"""Vault routes: shared mastery engine for fact (math) and word (vocab) drills.

Every practice game POSTs its attempts here. The vault runs SM-2-lite spaced
repetition, tracks per-item mastery, and exposes "due" queues that games consume.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict

_SEED_DIR = Path(__file__).parent.parent.parent / "data" / "seed"
_FACTS_CATALOG: list[dict] | None = None
_WORDS_CATALOG: list[dict] | None = None
_OOO_SETS: list[dict] | None = None


def _load_facts_catalog() -> list[dict]:
	global _FACTS_CATALOG
	if _FACTS_CATALOG is None:
		with open(_SEED_DIR / "facts.json") as f:
			_FACTS_CATALOG = json.load(f)["facts"]
	return _FACTS_CATALOG


def _load_words_catalog() -> list[dict]:
	global _WORDS_CATALOG
	if _WORDS_CATALOG is None:
		with open(_SEED_DIR / "words.json") as f:
			_WORDS_CATALOG = json.load(f)["words"]
	return _WORDS_CATALOG


def _load_ooo_sets() -> list[dict]:
	global _OOO_SETS
	if _OOO_SETS is None:
		with open(_SEED_DIR / "odd_one_out.json") as f:
			_OOO_SETS = json.load(f)["sets"]
	return _OOO_SETS

from games.core.database import get_connection
from games.models import (
	FactAttemptCreate,
	FactDueResponse,
	FactStatus,
	FactType,
	FactVaultItem,
	VaultStats,
	WordDueResponse,
	WordEncounterCreate,
	WordMode,
	WordVaultItem,
	WrongAnswerDigest,
)

router = APIRouter(prefix="/vault", tags=["vault"])

# --- Spaced-repetition tuning knobs ---
FAST_MS = 3000  # answered under 3s counts as "fast"
MIN_EASE = 1.3
MAX_EASE = 3.0
WRONG_INTERVAL_HOURS = 0.083  # 5 minutes
MASTERED_CORRECT_STREAK = 4
MASTERED_MAX_AVG_MS = 3500
STICKY_WRONG_RECENT = 2  # 2 wrong in last 3 attempts → sticky
MASTERY_LEVEL_MAX = 5


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _next_schedule(
	prev_ease: float,
	prev_interval_h: float,
	correct: bool,
	ms: int,
) -> tuple[float, float]:
	"""SM-2-lite. Returns (new_ease, new_interval_hours)."""
	if not correct:
		return max(MIN_EASE, prev_ease - 0.2), WRONG_INTERVAL_HOURS
	# correct
	if ms <= FAST_MS:
		new_ease = min(MAX_EASE, prev_ease + 0.15)
		new_interval = max(WRONG_INTERVAL_HOURS, prev_interval_h * new_ease)
	else:
		new_ease = prev_ease
		new_interval = max(WRONG_INTERVAL_HOURS, prev_interval_h * (prev_ease * 0.7))
	# cap at 30 days so a mastered item still resurfaces occasionally
	return new_ease, min(new_interval, 24.0 * 30)


def _row_to_fact(row: Any) -> FactVaultItem:
	operands = row["operands"]
	if isinstance(operands, str):
		operands = json.loads(operands)
	return FactVaultItem(
		user_id=row["user_id"],
		fact_id=row["fact_id"],
		fact_type=FactType(row["fact_type"]),
		operands=operands,
		answer=row["answer"],
		attempts=row["attempts"],
		correct=row["correct"],
		avg_ms=row["avg_ms"],
		status=FactStatus(row["status"]),
		ease=row["ease"],
		interval_hours=row["interval_hours"],
		last_seen_at=row["last_seen_at"],
		due_at=row["due_at"],
	)


def _row_to_word(row: Any) -> WordVaultItem:
	return WordVaultItem(
		user_id=row["user_id"],
		word=row["word"],
		pos=row["pos"],
		mastery_level=row["mastery_level"],
		encounters_count=row["encounters_count"],
		correct_count=row["correct_count"],
		distinct_games=row["distinct_games"],
		ease=row["ease"],
		interval_hours=row["interval_hours"],
		last_seen_at=row["last_seen_at"],
		due_at=row["due_at"],
	)


# ---------------------------------------------------------------------------
# Fact endpoints
# ---------------------------------------------------------------------------


@router.post("/fact/attempt", response_model=FactVaultItem)
async def record_fact_attempt(
	attempt: FactAttemptCreate,
	x_user_id: int = Header(..., description="User ID"),
) -> FactVaultItem:
	"""Record a math attempt. Upserts fact_vault, appends fact_attempt log,
	returns updated vault item."""
	now = datetime.utcnow()
	async with get_connection() as conn:
		async with conn.transaction():
			# Append to log
			await conn.execute(
				"""INSERT INTO fact_attempt (user_id, fact_id, fact_type, game_id, correct, ms, at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)""",
				x_user_id, attempt.fact_id, attempt.fact_type.value,
				attempt.game_id, attempt.correct, attempt.ms, now,
			)

			# Fetch existing (locked for update)
			row = await conn.fetchrow(
				"SELECT * FROM fact_vault WHERE user_id = $1 AND fact_id = $2 FOR UPDATE",
				x_user_id, attempt.fact_id,
			)

			if row is None:
				attempts = 1
				correct_count = 1 if attempt.correct else 0
				avg_ms = attempt.ms
				ease = 2.5
				interval_h = WRONG_INTERVAL_HOURS
			else:
				attempts = row["attempts"] + 1
				correct_count = row["correct"] + (1 if attempt.correct else 0)
				avg_ms = int((row["avg_ms"] * row["attempts"] + attempt.ms) / attempts)
				ease = row["ease"]
				interval_h = row["interval_hours"]

			new_ease, new_interval = _next_schedule(ease, interval_h, attempt.correct, attempt.ms)
			due_at = now + timedelta(hours=new_interval)

			# Recent 3 attempts for status decision
			recent = await conn.fetch(
				"""SELECT correct FROM fact_attempt
				WHERE user_id = $1 AND fact_id = $2
				ORDER BY at DESC LIMIT 3""",
				x_user_id, attempt.fact_id,
			)
			wrong_recent = sum(1 for r in recent if not r["correct"])
			# Consecutive-correct streak (from most recent backwards)
			streak = 0
			for r in recent:
				if r["correct"]:
					streak += 1
				else:
					break
			# Look further back for the mastered check (4-streak)
			if streak == len(recent) and streak > 0:
				older = await conn.fetch(
					"""SELECT correct FROM fact_attempt
					WHERE user_id = $1 AND fact_id = $2
					ORDER BY at DESC OFFSET 3 LIMIT 4""",
					x_user_id, attempt.fact_id,
				)
				for r in older:
					if r["correct"]:
						streak += 1
					else:
						break

			if wrong_recent >= STICKY_WRONG_RECENT:
				new_status = FactStatus.STICKY
			elif streak >= MASTERED_CORRECT_STREAK and avg_ms <= MASTERED_MAX_AVG_MS:
				new_status = FactStatus.MASTERED
			else:
				new_status = FactStatus.LEARNING

			operands_json = json.dumps(attempt.operands)

			await conn.execute(
				"""INSERT INTO fact_vault (
					user_id, fact_id, fact_type, operands, answer,
					attempts, correct, avg_ms, status, ease, interval_hours,
					last_seen_at, due_at
				) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13)
				ON CONFLICT (user_id, fact_id) DO UPDATE SET
					attempts = EXCLUDED.attempts,
					correct = EXCLUDED.correct,
					avg_ms = EXCLUDED.avg_ms,
					status = EXCLUDED.status,
					ease = EXCLUDED.ease,
					interval_hours = EXCLUDED.interval_hours,
					last_seen_at = EXCLUDED.last_seen_at,
					due_at = EXCLUDED.due_at""",
				x_user_id, attempt.fact_id, attempt.fact_type.value, operands_json,
				attempt.answer, attempts, correct_count, avg_ms, new_status.value,
				new_ease, new_interval, now, due_at,
			)

			row = await conn.fetchrow(
				"SELECT * FROM fact_vault WHERE user_id = $1 AND fact_id = $2",
				x_user_id, attempt.fact_id,
			)
	return _row_to_fact(row)


@router.get("/fact/due", response_model=FactDueResponse)
async def get_due_facts(
	x_user_id: int = Header(..., description="User ID"),
	limit: int = Query(20, ge=1, le=100),
	fact_type: FactType | None = Query(None),
) -> FactDueResponse:
	"""Get facts due for review. Sticky first, then earliest-due learning."""
	now = datetime.utcnow()
	async with get_connection() as conn:
		type_clause = "AND fact_type = $3" if fact_type else ""
		params: list[Any] = [x_user_id, now]
		if fact_type:
			params.append(fact_type.value)

		# Sticky always surfaces regardless of due_at
		sticky_rows = await conn.fetch(
			f"""SELECT * FROM fact_vault
			WHERE user_id = $1 AND status = 'sticky' {type_clause}
			ORDER BY due_at ASC LIMIT $2""",
			x_user_id, min(limit, 10), *([fact_type.value] if fact_type else []),
		)

		remaining = limit - len(sticky_rows)
		if remaining > 0:
			due_rows = await conn.fetch(
				f"""SELECT * FROM fact_vault
				WHERE user_id = $1 AND due_at <= $2 AND status != 'sticky' {type_clause}
				ORDER BY due_at ASC LIMIT $3""" if fact_type else
				"""SELECT * FROM fact_vault
				WHERE user_id = $1 AND due_at <= $2 AND status != 'sticky'
				ORDER BY due_at ASC LIMIT $3""",
				*([x_user_id, now, fact_type.value, remaining] if fact_type else [x_user_id, now, remaining]),
			)
		else:
			due_rows = []

		# Status counts
		counts = await conn.fetchrow(
			"""SELECT
				COUNT(*) FILTER (WHERE status = 'sticky') AS sticky,
				COUNT(*) FILTER (WHERE status = 'learning') AS learning,
				COUNT(*) FILTER (WHERE status = 'mastered') AS mastered
			FROM fact_vault WHERE user_id = $1""",
			x_user_id,
		)

	items = [_row_to_fact(r) for r in list(sticky_rows) + list(due_rows)]
	return FactDueResponse(
		items=items,
		sticky_count=counts["sticky"] or 0,
		learning_count=counts["learning"] or 0,
		mastered_count=counts["mastered"] or 0,
	)


@router.get("/fact/wrong-recent")
async def get_recent_wrong_facts(
	x_user_id: int = Header(..., description="User ID"),
	limit: int = Query(10, ge=1, le=50),
) -> dict[str, Any]:
	"""Wrong Answer Journal feed — facts missed in the last 7 days, most-missed first."""
	async with get_connection() as conn:
		rows = await conn.fetch(
			"""SELECT fv.*, mc.miss_count FROM fact_vault fv
			JOIN (
				SELECT fact_id, COUNT(*) AS miss_count
				FROM fact_attempt
				WHERE user_id = $1 AND correct = FALSE AND at > NOW() - INTERVAL '7 days'
				GROUP BY fact_id
				ORDER BY miss_count DESC LIMIT $2
			) mc ON mc.fact_id = fv.fact_id
			WHERE fv.user_id = $1
			ORDER BY mc.miss_count DESC""",
			x_user_id, limit,
		)
	return {
		"items": [
			{**_row_to_fact(r).model_dump(mode="json"), "miss_count": r["miss_count"]}
			for r in rows
		],
	}


# ---------------------------------------------------------------------------
# Word endpoints
# ---------------------------------------------------------------------------


@router.post("/word/encounter", response_model=WordVaultItem)
async def record_word_encounter(
	enc: WordEncounterCreate,
	x_user_id: int = Header(..., description="User ID"),
) -> WordVaultItem:
	"""Record a vocabulary encounter and update mastery."""
	now = datetime.utcnow()
	ms = enc.ms if enc.ms is not None else 0
	word = enc.word.strip().lower()
	async with get_connection() as conn:
		async with conn.transaction():
			await conn.execute(
				"""INSERT INTO word_encounter (user_id, word, game_id, mode, correct, ms, at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)""",
				x_user_id, word, enc.game_id, enc.mode.value, enc.correct, enc.ms, now,
			)

			row = await conn.fetchrow(
				"SELECT * FROM word_vault WHERE user_id = $1 AND word = $2 FOR UPDATE",
				x_user_id, word,
			)

			if row is None:
				encounters = 1
				correct_count = 1 if enc.correct else 0
				ease = 2.5
				interval_h = WRONG_INTERVAL_HOURS
			else:
				encounters = row["encounters_count"] + 1
				correct_count = row["correct_count"] + (1 if enc.correct else 0)
				ease = row["ease"]
				interval_h = row["interval_hours"]

			# Count distinct game modes used for this word (mastery gate)
			distinct = await conn.fetchval(
				"""SELECT COUNT(DISTINCT mode) FROM word_encounter
				WHERE user_id = $1 AND word = $2 AND correct = TRUE""",
				x_user_id, word,
			) or 0

			# Days since first correct encounter (mastery gate)
			first_correct_at = await conn.fetchval(
				"""SELECT MIN(at) FROM word_encounter
				WHERE user_id = $1 AND word = $2 AND correct = TRUE""",
				x_user_id, word,
			)

			# Mastery: 0..5. 5 = "known" (needs 4+ correct across 2+ modes over 7+ days)
			mastery = 0
			if correct_count >= 1:
				mastery = 1
			if correct_count >= 2:
				mastery = 2
			if correct_count >= 3 and distinct >= 2:
				mastery = 3
			if correct_count >= 4 and distinct >= 2:
				mastery = 4
			if (
				correct_count >= 4
				and distinct >= 2
				and first_correct_at is not None
				and (now - first_correct_at) >= timedelta(days=7)
			):
				mastery = 5

			new_ease, new_interval = _next_schedule(ease, interval_h, enc.correct, ms if ms else FAST_MS)
			due_at = now + timedelta(hours=new_interval)

			await conn.execute(
				"""INSERT INTO word_vault (
					user_id, word, pos, mastery_level, encounters_count, correct_count,
					distinct_games, ease, interval_hours, last_seen_at, due_at
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
				ON CONFLICT (user_id, word) DO UPDATE SET
					pos = COALESCE(EXCLUDED.pos, word_vault.pos),
					mastery_level = EXCLUDED.mastery_level,
					encounters_count = EXCLUDED.encounters_count,
					correct_count = EXCLUDED.correct_count,
					distinct_games = EXCLUDED.distinct_games,
					ease = EXCLUDED.ease,
					interval_hours = EXCLUDED.interval_hours,
					last_seen_at = EXCLUDED.last_seen_at,
					due_at = EXCLUDED.due_at""",
				x_user_id, word, enc.pos, mastery, encounters, correct_count,
				distinct, new_ease, new_interval, now, due_at,
			)

			row = await conn.fetchrow(
				"SELECT * FROM word_vault WHERE user_id = $1 AND word = $2",
				x_user_id, word,
			)
	return _row_to_word(row)


@router.get("/word/due", response_model=WordDueResponse)
async def get_due_words(
	x_user_id: int = Header(..., description="User ID"),
	limit: int = Query(20, ge=1, le=100),
) -> WordDueResponse:
	"""Get words due for review. Sticky (missed) first, then earliest-due."""
	now = datetime.utcnow()
	async with get_connection() as conn:
		rows = await conn.fetch(
			"""SELECT * FROM word_vault
			WHERE user_id = $1
			AND (
				due_at <= $2
				OR (encounters_count >= 3 AND correct_count::float / encounters_count < 0.6)
			)
			ORDER BY
				CASE WHEN encounters_count >= 3 AND correct_count::float / encounters_count < 0.6 THEN 0 ELSE 1 END,
				due_at ASC
			LIMIT $3""",
			x_user_id, now, limit,
		)
		counts = await conn.fetchrow(
			"""SELECT
				COUNT(*) AS total,
				COUNT(*) FILTER (WHERE mastery_level >= 5) AS mastered,
				COUNT(*) FILTER (WHERE encounters_count >= 3 AND correct_count::float / encounters_count < 0.6) AS sticky
			FROM word_vault WHERE user_id = $1""",
			x_user_id,
		)
	return WordDueResponse(
		items=[_row_to_word(r) for r in rows],
		total_seen=counts["total"] or 0,
		mastered_count=counts["mastered"] or 0,
		sticky_count=counts["sticky"] or 0,
	)


# ---------------------------------------------------------------------------
# Aggregate stats + warmup
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=VaultStats)
async def get_vault_stats(
	x_user_id: int = Header(..., description="User ID"),
) -> VaultStats:
	"""Aggregate mastery snapshot for the practice landing page."""
	async with get_connection() as conn:
		facts = await conn.fetchrow(
			"""SELECT
				COUNT(*) AS total,
				COUNT(*) FILTER (WHERE status = 'mastered') AS mastered,
				COUNT(*) FILTER (WHERE status = 'sticky') AS sticky,
				COUNT(*) FILTER (WHERE status = 'learning') AS learning,
				MAX(last_seen_at) AS last_seen
			FROM fact_vault WHERE user_id = $1""",
			x_user_id,
		)
		words = await conn.fetchrow(
			"""SELECT
				COUNT(*) AS total,
				COUNT(*) FILTER (WHERE mastery_level >= 5) AS mastered,
				COUNT(*) FILTER (WHERE encounters_count >= 3 AND correct_count::float / encounters_count < 0.6) AS sticky,
				MAX(last_seen_at) AS last_seen
			FROM word_vault WHERE user_id = $1""",
			x_user_id,
		)
	last_practice = None
	fl, wl = facts["last_seen"], words["last_seen"]
	if fl and wl:
		last_practice = max(fl, wl)
	else:
		last_practice = fl or wl
	return VaultStats(
		facts_total=facts["total"] or 0,
		facts_mastered=facts["mastered"] or 0,
		facts_sticky=facts["sticky"] or 0,
		facts_learning=facts["learning"] or 0,
		words_seen=words["total"] or 0,
		words_mastered=words["mastered"] or 0,
		words_sticky=words["sticky"] or 0,
		last_practice_at=last_practice,
	)


@router.get("/warmup", response_model=WrongAnswerDigest)
async def get_warmup(
	x_user_id: int = Header(..., description="User ID"),
	facts: int = Query(5, ge=0, le=20),
	words: int = Query(5, ge=0, le=20),
) -> WrongAnswerDigest:
	"""Personalized 5+5 warmup: the most-in-need-of-retrieval items across both vaults."""
	now = datetime.utcnow()
	async with get_connection() as conn:
		fact_rows = await conn.fetch(
			"""SELECT * FROM fact_vault
			WHERE user_id = $1
			ORDER BY
				CASE status WHEN 'sticky' THEN 0 WHEN 'learning' THEN 1 ELSE 2 END,
				due_at ASC
			LIMIT $2""",
			x_user_id, facts,
		) if facts > 0 else []
		word_rows = await conn.fetch(
			"""SELECT * FROM word_vault
			WHERE user_id = $1
			ORDER BY
				CASE WHEN encounters_count >= 3 AND correct_count::float / encounters_count < 0.6 THEN 0 ELSE 1 END,
				mastery_level ASC,
				due_at ASC
			LIMIT $2""",
			x_user_id, words,
		) if words > 0 else []
	return WrongAnswerDigest(
		facts=[_row_to_fact(r) for r in fact_rows],
		words=[_row_to_word(r) for r in word_rows],
	)


# ---------------------------------------------------------------------------
# Catalog endpoints — games pull filtered fact/word pools from these
# ---------------------------------------------------------------------------


@router.get("/catalog/facts")
async def get_facts_catalog(
	fact_type: FactType | None = Query(None),
	tier: int | None = Query(None, ge=1, le=3),
) -> dict[str, Any]:
	"""Public catalog of math facts. No auth required — same pool for all users."""
	facts = _load_facts_catalog()
	if fact_type:
		facts = [f for f in facts if f["fact_type"] == fact_type.value]
	if tier is not None:
		facts = [f for f in facts if f.get("tier") == tier]
	return {"facts": facts, "count": len(facts)}


@router.get("/catalog/words")
async def get_words_catalog(
	level: int | None = Query(None, ge=1, le=3),
	pos: str | None = Query(None),
	has_morphology: bool = Query(False),
) -> dict[str, Any]:
	"""Public catalog of vocabulary words."""
	words = _load_words_catalog()
	if level is not None:
		words = [w for w in words if w.get("level") == level]
	if pos:
		words = [w for w in words if w.get("pos") == pos]
	if has_morphology:
		words = [w for w in words if "morphology" in w]
	return {"words": words, "count": len(words)}


@router.get("/catalog/odd-one-out")
async def get_odd_one_out_sets(
	level: int | None = Query(None, ge=1, le=3),
) -> dict[str, Any]:
	"""Curated 4-word sets for the Odd One Out game."""
	sets = _load_ooo_sets()
	if level is not None:
		sets = [s for s in sets if s.get("level") == level]
	return {"sets": sets, "count": len(sets)}


@router.get("/catalog/word/{word}")
async def get_word_detail(word: str) -> dict[str, Any]:
	"""Full metadata for one word (definition, morphology, synonyms, etc.)."""
	words = _load_words_catalog()
	needle = word.strip().lower()
	for w in words:
		if w["word"].lower() == needle:
			return w
	raise HTTPException(status_code=404, detail=f"Word '{word}' not in catalog")
