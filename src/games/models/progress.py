"""Progress tracking models for player achievements."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from games.models.game import Subject
from games.models.session import GameCategory, GameType


class BadgeType(str, Enum):
	"""Types of badges players can earn."""

	# Participation badges
	FIRST_GAME = "first_game"
	TEAM_PLAYER = "team_player"  # Played 10 sessions
	DEDICATED_SCHOLAR = "dedicated_scholar"  # Played 50 sessions

	# Score badges
	RISING_STAR = "rising_star"  # First perfect score
	STREAK_MASTER = "streak_master"  # 5 correct in a row
	SPEED_DEMON = "speed_demon"  # Answered in under 3 seconds

	# Subject mastery
	SCIENCE_WHIZ = "science_whiz"
	HISTORY_BUFF = "history_buff"
	ARTS_AFICIONADO = "arts_aficionado"
	BOOKWORM = "bookworm"  # Literature
	SPECIAL_SCHOLAR = "special_scholar"

	# Game-specific
	BUZZER_CHAMPION = "buzzer_champion"
	WORDSMITH = "wordsmith"  # Writing excellence
	DEBATE_DYNAMO = "debate_dynamo"
	PATTERN_SPOTTER = "pattern_spotter"


class Badge(BaseModel):
	"""A badge earned by a player."""

	model_config = ConfigDict(extra="forbid")

	type: BadgeType
	name: str
	description: str
	icon: str
	earned_at: datetime = Field(default_factory=datetime.utcnow)


# Badge definitions
BADGE_DEFINITIONS: dict[BadgeType, dict] = {
	BadgeType.FIRST_GAME: {
		"name": "First Steps",
		"description": "Played your first game!",
		"icon": "star",
	},
	BadgeType.TEAM_PLAYER: {
		"name": "Team Player",
		"description": "Participated in 10 team sessions",
		"icon": "users",
	},
	BadgeType.DEDICATED_SCHOLAR: {
		"name": "Dedicated Scholar",
		"description": "Completed 50 practice sessions",
		"icon": "award",
	},
	BadgeType.RISING_STAR: {
		"name": "Rising Star",
		"description": "Achieved a perfect score!",
		"icon": "sun",
	},
	BadgeType.STREAK_MASTER: {
		"name": "Streak Master",
		"description": "Got 5 correct answers in a row",
		"icon": "zap",
	},
	BadgeType.SPEED_DEMON: {
		"name": "Speed Demon",
		"description": "Answered correctly in under 3 seconds",
		"icon": "clock",
	},
	BadgeType.SCIENCE_WHIZ: {
		"name": "Science Whiz",
		"description": "Mastered 20 science questions",
		"icon": "flask",
	},
	BadgeType.HISTORY_BUFF: {
		"name": "History Buff",
		"description": "Mastered 20 social studies questions",
		"icon": "globe",
	},
	BadgeType.ARTS_AFICIONADO: {
		"name": "Arts Aficionado",
		"description": "Mastered 20 arts questions",
		"icon": "palette",
	},
	BadgeType.BOOKWORM: {
		"name": "Bookworm",
		"description": "Mastered 20 literature questions",
		"icon": "book",
	},
	BadgeType.SPECIAL_SCHOLAR: {
		"name": "Special Scholar",
		"description": "Mastered 20 special area questions",
		"icon": "sparkles",
	},
	BadgeType.BUZZER_CHAMPION: {
		"name": "Buzzer Champion",
		"description": "Won 10 buzzer battles",
		"icon": "target",
	},
	BadgeType.WORDSMITH: {
		"name": "Wordsmith",
		"description": "Excellence in collaborative writing",
		"icon": "feather",
	},
	BadgeType.DEBATE_DYNAMO: {
		"name": "Debate Dynamo",
		"description": "Stellar performance in debates",
		"icon": "message-circle",
	},
	BadgeType.PATTERN_SPOTTER: {
		"name": "Pattern Spotter",
		"description": "Solved 20 pattern puzzles",
		"icon": "grid",
	},
}


class SubjectProgress(BaseModel):
	"""Progress in a specific subject."""

	model_config = ConfigDict(extra="forbid")

	subject: Subject
	questions_attempted: int = 0
	questions_correct: int = 0
	current_streak: int = 0
	best_streak: int = 0

	@property
	def accuracy(self) -> float:
		"""Calculate accuracy percentage."""
		if self.questions_attempted == 0:
			return 0.0
		return (self.questions_correct / self.questions_attempted) * 100


class GameProgress(BaseModel):
	"""Progress in a specific game type."""

	model_config = ConfigDict(extra="forbid")

	game_type: GameType
	times_played: int = 0
	total_score: int = 0
	best_score: int = 0
	wins: int = 0


class PlayerProgress(BaseModel):
	"""Complete progress record for a player."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	user_id: int
	team_id: int

	# Overall stats
	total_sessions: int = 0
	total_games_played: int = 0
	total_points: int = 0
	current_streak_days: int = 0
	best_streak_days: int = 0
	last_played_at: datetime | None = None

	# Subject progress
	subject_progress: dict[Subject, SubjectProgress] = Field(default_factory=dict)

	# Game progress
	game_progress: dict[GameType, GameProgress] = Field(default_factory=dict)

	# Badges earned
	badges: list[Badge] = Field(default_factory=list)

	# Timestamps
	created_at: datetime = Field(default_factory=datetime.utcnow)
	updated_at: datetime = Field(default_factory=datetime.utcnow)

	def has_badge(self, badge_type: BadgeType) -> bool:
		"""Check if player has a specific badge."""
		return any(b.type == badge_type for b in self.badges)

	def get_subject_accuracy(self, subject: Subject) -> float:
		"""Get accuracy for a specific subject."""
		if subject in self.subject_progress:
			return self.subject_progress[subject].accuracy
		return 0.0


class LeaderboardEntry(BaseModel):
	"""Entry in the team leaderboard."""

	model_config = ConfigDict(extra="forbid")

	rank: int
	user_id: int
	display_name: str
	avatar_color: str
	total_points: int
	games_played: int
	badges_count: int


class SessionResult(BaseModel):
	"""Results from a completed session."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	session_id: int
	user_id: int
	games_played: list[GameType]
	total_score: int
	questions_correct: int
	questions_attempted: int
	new_badges: list[BadgeType] = Field(default_factory=list)
	completed_at: datetime = Field(default_factory=datetime.utcnow)
