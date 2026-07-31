"""Fact & Word vault models — cross-game spaced-repetition mastery tracking."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FactType(str, Enum):
	"""Kinds of math facts we track."""

	MULT = "mult"
	DIV = "div"
	ADD = "add"
	SUB = "sub"
	FRAC_EQ = "frac_eq"  # equivalence: 2/4 == 1/2
	FRAC_CMP = "frac_cmp"  # comparison: 2/3 > 3/5


class FactStatus(str, Enum):
	"""Mastery lifecycle for a fact."""

	LEARNING = "learning"  # default, still being introduced
	STICKY = "sticky"  # missed 2+ times, needs extra reps
	MASTERED = "mastered"  # 4+ correct-fast in a row, retired to long spacing


class WordMode(str, Enum):
	"""How a word was encountered in a game."""

	CLOZE = "cloze"  # contextual fill-in
	MORPH = "morph"  # morphology (root/prefix/suffix)
	NETWORK = "network"  # semantic network (synonym/antonym)
	PROD = "prod"  # productive use (write a sentence)
	SOUND = "sound"  # audio/animation match
	DEFN = "defn"  # definition match


class FactVaultItem(BaseModel):
	"""One fact in a user's vault."""

	model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True)

	user_id: int
	fact_id: str
	fact_type: FactType
	operands: list[Any]
	answer: str
	attempts: int = 0
	correct: int = 0
	avg_ms: int = 0
	status: FactStatus = FactStatus.LEARNING
	ease: float = 2.5
	interval_hours: float = 0.083  # 5 minutes
	last_seen_at: datetime | None = None
	due_at: datetime = Field(default_factory=datetime.utcnow)


class WordVaultItem(BaseModel):
	"""One word in a user's vault."""

	model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True)

	user_id: int
	word: str
	pos: str | None = None
	mastery_level: int = 0  # 0..5
	encounters_count: int = 0
	correct_count: int = 0
	distinct_games: int = 0
	ease: float = 2.5
	interval_hours: float = 0.083
	last_seen_at: datetime | None = None
	due_at: datetime = Field(default_factory=datetime.utcnow)


class FactAttemptCreate(BaseModel):
	"""Recorded when a player answers a math fact."""

	model_config = ConfigDict(extra="forbid")

	fact_id: str
	fact_type: FactType
	operands: list[Any]
	answer: str
	game_id: str
	correct: bool
	ms: int = Field(ge=0, le=120_000)


class WordEncounterCreate(BaseModel):
	"""Recorded when a player interacts with a word."""

	model_config = ConfigDict(extra="forbid")

	word: str
	pos: str | None = None
	game_id: str
	mode: WordMode
	correct: bool
	ms: int | None = None


class FactDueResponse(BaseModel):
	"""Facts due for review, sticky-first."""

	model_config = ConfigDict(extra="forbid")

	items: list[FactVaultItem]
	sticky_count: int
	learning_count: int
	mastered_count: int


class WordDueResponse(BaseModel):
	"""Words due for review."""

	model_config = ConfigDict(extra="forbid")

	items: list[WordVaultItem]
	total_seen: int
	mastered_count: int  # mastery_level >= 5
	sticky_count: int  # encounters_count >= 3 and correct_count / encounters_count < 0.6


class VaultStats(BaseModel):
	"""Aggregate mastery snapshot for a user."""

	model_config = ConfigDict(extra="forbid")

	facts_total: int
	facts_mastered: int
	facts_sticky: int
	facts_learning: int
	words_seen: int
	words_mastered: int
	words_sticky: int
	last_practice_at: datetime | None = None


class WrongAnswerDigest(BaseModel):
	"""Personalized warmup: N items most in need of retrieval."""

	model_config = ConfigDict(extra="forbid")

	facts: list[FactVaultItem]
	words: list[WordVaultItem]
