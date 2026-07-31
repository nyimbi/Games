"""AI routes: LiteLLM-backed helpers for the AI-dependent practice games.

- POST /api/ai/grade-sentence — grade a kid's sentence using a target word
- POST /api/ai/generate-story-problem — story-form of a given equation
- POST /api/ai/generate-word-clues — 3 progressive clues for a word (Charades)

All calls go through the LiteLLM gateway (OpenAI-compatible). Wildcard routes
to local Ollama by default; heavier tasks can pass a cloud model in `model`.
"""

import json
from typing import Any

import httpx
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from games.core.config import get_settings

router = APIRouter(prefix="/ai", tags=["ai"])

_TIMEOUT_S = 30.0


async def _chat(messages: list[dict], model: str | None = None, max_tokens: int = 400, temperature: float = 0.7) -> str:
	"""Send a chat completion to LiteLLM. Returns the assistant message content."""
	s = get_settings()
	m = model or s.litellm_default_model
	async with httpx.AsyncClient(timeout=_TIMEOUT_S) as client:
		r = await client.post(
			f"{s.litellm_base_url}/v1/chat/completions",
			headers={
				"Authorization": f"Bearer {s.litellm_api_key}",
				"Content-Type": "application/json",
			},
			json={
				"model": m,
				"messages": messages,
				"max_tokens": max_tokens,
				"temperature": temperature,
			},
		)
		if r.status_code != 200:
			raise HTTPException(status_code=502, detail=f"LiteLLM {r.status_code}: {r.text[:200]}")
		data = r.json()
		content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
		if not content:
			raise HTTPException(status_code=502, detail="LiteLLM returned empty content")
		return content


def _extract_json(text: str) -> Any:
	"""Extract JSON from an LLM response that may have prose around it."""
	text = text.strip()
	# Strip common code-fence wrappers
	if text.startswith("```"):
		text = text.strip("`")
		if text.startswith("json\n"):
			text = text[5:]
		elif text.startswith("json "):
			text = text[5:]
	# Find first { and matching }
	start = text.find("{")
	end = text.rfind("}")
	if start == -1 or end == -1 or end < start:
		raise HTTPException(status_code=502, detail=f"LLM output not JSON: {text[:200]}")
	try:
		return json.loads(text[start : end + 1])
	except json.JSONDecodeError as e:
		raise HTTPException(status_code=502, detail=f"LLM JSON parse error: {e}")


# ---------------------------------------------------------------------------
# Grade sentence — Sentence Spinner
# ---------------------------------------------------------------------------


class GradeSentenceRequest(BaseModel):
	model_config = ConfigDict(extra="forbid")
	sentence: str = Field(min_length=3, max_length=500)
	target_word: str = Field(min_length=1, max_length=40)
	required_elements: list[str] = Field(default_factory=list, description="Other elements the sentence must include")


class GradeSentenceResponse(BaseModel):
	model_config = ConfigDict(extra="forbid")
	used_correctly: bool  # target word used with correct meaning
	included_all: bool  # required_elements all present
	feedback: str  # 1-2 sentences of kid-friendly feedback
	score: int  # 0..10


@router.post("/grade-sentence", response_model=GradeSentenceResponse)
async def grade_sentence(
	req: GradeSentenceRequest,
	x_user_id: int = Header(..., description="User ID"),
) -> GradeSentenceResponse:
	"""Grade a sentence for correct use of a target vocabulary word."""
	required = ", ".join(req.required_elements) if req.required_elements else "(none)"
	system = (
		"You are a friendly writing tutor for kids ages 8-9 (grade 3-4). "
		"You grade one sentence and reply ONLY with a JSON object — no prose. "
		"Judge whether the target word is used with its correct meaning in context. "
		"Small grammar slips are OK; focus on whether the word is used correctly."
	)
	user = (
		f"Target word: {req.target_word}\n"
		f"Sentence must also include: {required}\n\n"
		f"Kid's sentence: \"{req.sentence}\"\n\n"
		'Reply with JSON: {"used_correctly": bool, "included_all": bool, '
		'"feedback": "one or two encouraging sentences", "score": integer 0-10}'
	)
	content = await _chat(
		[{"role": "system", "content": system}, {"role": "user", "content": user}],
		max_tokens=300,
		temperature=0.3,
	)
	data = _extract_json(content)
	return GradeSentenceResponse(
		used_correctly=bool(data.get("used_correctly", False)),
		included_all=bool(data.get("included_all", False)),
		feedback=str(data.get("feedback", "Great try!"))[:400],
		score=max(0, min(10, int(data.get("score", 5)))),
	)


# ---------------------------------------------------------------------------
# Generate story problem — Build-a-Problem
# ---------------------------------------------------------------------------


class GenerateStoryProblemRequest(BaseModel):
	model_config = ConfigDict(extra="forbid")
	kid_story: str = Field(min_length=5, max_length=600)
	equation: str = Field(min_length=3, max_length=40, description="e.g. '24 ÷ 6 = 4'")


class GenerateStoryProblemResponse(BaseModel):
	model_config = ConfigDict(extra="forbid")
	matches_equation: bool  # story's math corresponds to the equation
	makes_sense: bool  # story is coherent
	feedback: str
	score: int  # 0..10
	example_story: str  # a model story if kid's was off


@router.post("/grade-story-problem", response_model=GenerateStoryProblemResponse)
async def grade_story_problem(
	req: GenerateStoryProblemRequest,
	x_user_id: int = Header(..., description="User ID"),
) -> GenerateStoryProblemResponse:
	"""Grade a kid's story that should represent a given equation."""
	system = (
		"You are a friendly math tutor for kids ages 8-9. You judge whether a kid's "
		"story problem matches a given equation. Reply ONLY with JSON — no prose."
	)
	user = (
		f"Target equation: {req.equation}\n\n"
		f"Kid's story: \"{req.kid_story}\"\n\n"
		"Does the story describe a situation whose math matches the equation? "
		"A good story mentions the numbers in the equation and describes an "
		"action or scenario (adding, subtracting, sharing, grouping) that maps to the operation.\n\n"
		'Reply with JSON: {"matches_equation": bool, "makes_sense": bool, '
		'"feedback": "one or two encouraging sentences", "score": integer 0-10, '
		'"example_story": "a short model story matching the equation, for a grade 3-4 reader"}'
	)
	content = await _chat(
		[{"role": "system", "content": system}, {"role": "user", "content": user}],
		max_tokens=500,
		temperature=0.4,
	)
	data = _extract_json(content)
	return GenerateStoryProblemResponse(
		matches_equation=bool(data.get("matches_equation", False)),
		makes_sense=bool(data.get("makes_sense", False)),
		feedback=str(data.get("feedback", "Nice try!"))[:400],
		score=max(0, min(10, int(data.get("score", 5)))),
		example_story=str(data.get("example_story", ""))[:400],
	)


# ---------------------------------------------------------------------------
# Generate word clues — Wordish Charades
# ---------------------------------------------------------------------------


class GenerateWordCluesRequest(BaseModel):
	model_config = ConfigDict(extra="forbid")
	word: str = Field(min_length=1, max_length=40)
	pos: str | None = None
	definition: str | None = None


class GenerateWordCluesResponse(BaseModel):
	model_config = ConfigDict(extra="forbid")
	word: str
	clues: list[str] = Field(min_length=3, max_length=3, description="3 progressively easier clues")


@router.post("/generate-word-clues", response_model=GenerateWordCluesResponse)
async def generate_word_clues(
	req: GenerateWordCluesRequest,
	x_user_id: int = Header(..., description="User ID"),
) -> GenerateWordCluesResponse:
	"""Generate 3 progressively easier clues for a word (Wordish Charades)."""
	defn = req.definition or "(look up the definition yourself)"
	pos = req.pos or "unknown"
	system = (
		"You write vocabulary clues for kids ages 8-9. You generate exactly 3 clues, "
		"ordered from HARDEST (subtle hint) to EASIEST (nearly gives it away). "
		"Do NOT include the target word itself in any clue. Do NOT include any word "
		"from the target word's family (e.g., if word is 'determined', don't say "
		"'determine'). Reply ONLY with JSON — no prose."
	)
	user = (
		f"Target word: {req.word} ({pos})\n"
		f"Definition: {defn}\n\n"
		'Reply with JSON: {"clues": ["hardest clue", "medium clue", "easiest clue"]}'
	)
	content = await _chat(
		[{"role": "system", "content": system}, {"role": "user", "content": user}],
		max_tokens=300,
		temperature=0.6,
	)
	data = _extract_json(content)
	clues = data.get("clues", [])
	if not isinstance(clues, list) or len(clues) != 3:
		raise HTTPException(status_code=502, detail=f"Expected exactly 3 clues, got {clues!r}")
	# Guard: strip the target word if the model included it anyway
	target_lower = req.word.lower()
	cleaned = [c.replace(req.word, "___").replace(req.word.capitalize(), "___") for c in clues]
	return GenerateWordCluesResponse(word=req.word, clues=[str(c)[:200] for c in cleaned])
