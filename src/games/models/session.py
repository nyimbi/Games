"""Session models for game scheduling and management."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class SessionStatus(str, Enum):
	"""Status of a game session."""

	SCHEDULED = "scheduled"
	ACTIVE = "active"
	PAUSED = "paused"
	COMPLETED = "completed"
	CANCELLED = "cancelled"


class SessionMode(str, Enum):
	"""Mode of game session."""

	SOLO_PRACTICE = "solo_practice"  # Single player practice
	TEAM_PRACTICE = "team_practice"  # Full team with coach
	FREE_PLAY = "free_play"  # Players can join anytime


class GameCategory(str, Enum):
	"""Game categories matching WSC events."""

	SCHOLARS_BOWL = "scholars_bowl"
	COLLABORATIVE_WRITING = "collaborative_writing"
	SCHOLARS_CHALLENGE = "scholars_challenge"
	TEAM_DEBATE = "team_debate"


class GameType(str, Enum):
	"""Individual game types within categories."""

	# Scholar's Bowl
	BUZZER_BATTLE = "buzzer_battle"
	CATEGORY_CHALLENGE = "category_challenge"
	TEAM_TRIVIA_NIGHT = "team_trivia_night"
	SCAVENGER_BOWL = "scavenger_bowl"

	# Collaborative Writing
	STORY_CHAIN = "story_chain"
	ESSAY_SPRINT = "essay_sprint"
	ROLE_BASED_WRITING = "role_based_writing"
	ARGUMENT_TENNIS = "argument_tennis"

	# Scholar's Challenge
	FLASHCARD_FRENZY = "flashcard_frenzy"
	PATTERN_PUZZLES = "pattern_puzzles"
	QUICKFIRE_QUIZ = "quickfire_quiz"
	ELIMINATION_OLYMPICS = "elimination_olympics"

	# Team Debate
	MINI_DEBATE = "mini_debate"
	ROLE_PLAY_DEBATES = "role_play_debates"
	ARGUMENT_BUILDER = "argument_builder"
	IMPROMPTU_CHALLENGE = "impromptu_challenge"


# Map game types to their categories
GAME_CATEGORY_MAP: dict[GameType, GameCategory] = {
	GameType.BUZZER_BATTLE: GameCategory.SCHOLARS_BOWL,
	GameType.CATEGORY_CHALLENGE: GameCategory.SCHOLARS_BOWL,
	GameType.TEAM_TRIVIA_NIGHT: GameCategory.SCHOLARS_BOWL,
	GameType.SCAVENGER_BOWL: GameCategory.SCHOLARS_BOWL,
	GameType.STORY_CHAIN: GameCategory.COLLABORATIVE_WRITING,
	GameType.ESSAY_SPRINT: GameCategory.COLLABORATIVE_WRITING,
	GameType.ROLE_BASED_WRITING: GameCategory.COLLABORATIVE_WRITING,
	GameType.ARGUMENT_TENNIS: GameCategory.COLLABORATIVE_WRITING,
	GameType.FLASHCARD_FRENZY: GameCategory.SCHOLARS_CHALLENGE,
	GameType.PATTERN_PUZZLES: GameCategory.SCHOLARS_CHALLENGE,
	GameType.QUICKFIRE_QUIZ: GameCategory.SCHOLARS_CHALLENGE,
	GameType.ELIMINATION_OLYMPICS: GameCategory.SCHOLARS_CHALLENGE,
	GameType.MINI_DEBATE: GameCategory.TEAM_DEBATE,
	GameType.ROLE_PLAY_DEBATES: GameCategory.TEAM_DEBATE,
	GameType.ARGUMENT_BUILDER: GameCategory.TEAM_DEBATE,
	GameType.IMPROMPTU_CHALLENGE: GameCategory.TEAM_DEBATE,
}


class Difficulty(str, Enum):
	"""Question/game difficulty levels."""

	EASY = "easy"
	MEDIUM = "medium"
	HARD = "hard"


class Session(BaseModel):
	"""A scheduled or active game session."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	team_id: int | None = None  # None for solo practice
	coach_id: int | None = None  # None for solo practice
	player_id: int | None = None  # Set for solo practice
	name: str = Field(..., min_length=1, max_length=100)
	mode: SessionMode = SessionMode.TEAM_PRACTICE
	status: SessionStatus = SessionStatus.SCHEDULED
	scheduled_at: datetime | None = None
	started_at: datetime | None = None
	ended_at: datetime | None = None
	games: list[GameType] = Field(default_factory=list)
	difficulty: Difficulty = Difficulty.MEDIUM
	created_at: datetime = Field(default_factory=datetime.utcnow)

	@property
	def is_solo(self) -> bool:
		"""Check if this is a solo practice session."""
		return self.mode == SessionMode.SOLO_PRACTICE


class SessionCreate(BaseModel):
	"""Schema for creating a new session."""

	model_config = ConfigDict(extra="forbid")

	name: str = Field(..., min_length=1, max_length=100)
	mode: SessionMode = SessionMode.TEAM_PRACTICE
	scheduled_at: datetime | None = None
	games: list[GameType] = Field(..., min_length=1)
	difficulty: Difficulty = Difficulty.MEDIUM


class SessionUpdate(BaseModel):
	"""Schema for updating a session."""

	model_config = ConfigDict(extra="forbid")

	name: str | None = None
	scheduled_at: datetime | None = None
	games: list[GameType] | None = None
	difficulty: Difficulty | None = None
	status: SessionStatus | None = None


class ActiveGame(BaseModel):
	"""Current game being played in a session."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	session_id: int
	game_type: GameType
	started_at: datetime = Field(default_factory=datetime.utcnow)
	current_round: int = 1
	total_rounds: int = 10
	state: dict = Field(default_factory=dict)  # Game-specific state


class PlayerSession(BaseModel):
	"""Player's participation in a session."""

	model_config = ConfigDict(extra="forbid")

	user_id: int
	session_id: int
	joined_at: datetime = Field(default_factory=datetime.utcnow)
	is_active: bool = True
	score: int = 0
