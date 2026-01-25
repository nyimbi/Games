"""Games API routes - game definitions and question delivery."""

import json
import random
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query, status
from pydantic import BaseModel

from games.models import (
	GAME_CATEGORY_MAP,
	GAME_DEFINITIONS,
	Difficulty,
	GameCategory,
	GameDefinition,
	GameType,
	Question,
	Subject,
)

router = APIRouter(prefix="/games", tags=["games"])

# Path to questions data
QUESTIONS_DIR = Path(__file__).parent.parent.parent / "data" / "questions"


class GameCategoryResponse(BaseModel):
	"""Response with games in a category."""

	category: str
	category_name: str
	games: list[GameDefinition]


class QuestionsResponse(BaseModel):
	"""Response with questions for a game."""

	questions: list[Question]
	total: int


def load_questions(subject: Subject, difficulty: Difficulty | None = None) -> list[dict]:
	"""Load questions from JSON files."""
	file_path = QUESTIONS_DIR / f"{subject.value}.json"

	if not file_path.exists():
		return []

	with open(file_path) as f:
		data = json.load(f)

	questions = data.get("questions", [])

	if difficulty:
		questions = [q for q in questions if q.get("difficulty") == difficulty.value]

	return questions


@router.get("/definitions")
async def get_all_game_definitions() -> dict[str, Any]:
	"""Get all game definitions."""
	# Group by category
	categories: dict[str, list[dict]] = {}
	for game_def in GAME_DEFINITIONS:
		cat = game_def.category
		if cat not in categories:
			categories[cat] = []
		categories[cat].append(game_def.model_dump())

	return {
		"categories": categories,
		"total_games": len(GAME_DEFINITIONS),
	}


@router.get("/category/{category}", response_model=GameCategoryResponse)
async def get_games_by_category(category: str) -> GameCategoryResponse:
	"""Get all games in a category."""
	try:
		game_category = GameCategory(category)
	except ValueError:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"Category '{category}' not found",
		)

	category_names = {
		GameCategory.SCHOLARS_BOWL: "Scholar's Bowl",
		GameCategory.COLLABORATIVE_WRITING: "Collaborative Writing",
		GameCategory.SCHOLARS_CHALLENGE: "Scholar's Challenge",
		GameCategory.TEAM_DEBATE: "Team Debate",
	}

	games = [
		game_def
		for game_def in GAME_DEFINITIONS
		if game_def.category == category
	]

	return GameCategoryResponse(
		category=category,
		category_name=category_names.get(game_category, category),
		games=games,
	)


@router.get("/definition/{game_type}")
async def get_game_definition(game_type: str) -> GameDefinition:
	"""Get definition for a specific game."""
	for game_def in GAME_DEFINITIONS:
		if game_def.type == game_type:
			return game_def

	raise HTTPException(
		status_code=status.HTTP_404_NOT_FOUND,
		detail=f"Game '{game_type}' not found",
	)


@router.get("/questions", response_model=QuestionsResponse)
async def get_questions(
	subject: Subject = Query(..., description="Subject area"),
	difficulty: Difficulty | None = Query(None, description="Difficulty level"),
	count: int = Query(10, ge=1, le=1000, description="Number of questions"),
	x_user_id: int | None = Header(None),
) -> QuestionsResponse:
	"""Get random questions for a game."""
	all_questions = load_questions(subject, difficulty)

	if not all_questions:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"No questions found for {subject.value}",
		)

	# Shuffle and limit
	random.shuffle(all_questions)
	selected = all_questions[:count]

	# Convert to Question models
	questions = [
		Question(
			id=q.get("id", f"{subject.value}-{i}"),
			subject=subject,
			difficulty=Difficulty(q.get("difficulty", "medium")),
			text=q["text"],
			options=q["options"],
			correct_index=q.get("correct_index", q.get("correct", 0)),
			explanation=q.get("explanation"),
			time_limit_seconds=q.get("time_limit", 30),
		)
		for i, q in enumerate(selected)
	]

	return QuestionsResponse(questions=questions, total=len(questions))


@router.get("/questions/mixed", response_model=QuestionsResponse)
async def get_mixed_questions(
	difficulty: Difficulty | None = Query(None, description="Difficulty level"),
	count: int = Query(10, ge=1, le=1000, description="Number of questions"),
	x_user_id: int | None = Header(None),
) -> QuestionsResponse:
	"""Get mixed questions from all subjects."""
	all_questions = []

	for subject in Subject:
		subject_questions = load_questions(subject, difficulty)
		for q in subject_questions:
			q["_subject"] = subject
		all_questions.extend(subject_questions)

	if not all_questions:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="No questions found",
		)

	# Shuffle and limit
	random.shuffle(all_questions)
	selected = all_questions[:count]

	# Convert to Question models
	questions = [
		Question(
			id=q.get("id", f"mixed-{i}"),
			subject=q["_subject"],
			difficulty=Difficulty(q.get("difficulty", "medium")),
			text=q["text"],
			options=q["options"],
			correct_index=q.get("correct_index", q.get("correct", 0)),
			explanation=q.get("explanation"),
			time_limit_seconds=q.get("time_limit", 30),
		)
		for i, q in enumerate(selected)
	]

	return QuestionsResponse(questions=questions, total=len(questions))


@router.get("/subjects")
async def get_subjects() -> dict[str, Any]:
	"""Get all available subjects with question counts."""
	subjects = []

	for subject in Subject:
		questions = load_questions(subject)
		subjects.append({
			"value": subject.value,
			"name": subject.value.replace("_", " ").title(),
			"question_count": len(questions),
		})

	return {"subjects": subjects}
