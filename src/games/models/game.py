"""Game content models (questions, prompts, topics)."""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from games.models.session import Difficulty


class Subject(str, Enum):
	"""WSC subject areas."""

	SCIENCE = "science"
	SOCIAL_STUDIES = "social_studies"
	ARTS = "arts"
	LITERATURE = "literature"
	SPECIAL_AREA = "special_area"


class Question(BaseModel):
	"""A trivia/quiz question."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	subject: Subject
	difficulty: Difficulty
	text: str = Field(..., min_length=10)
	options: list[str] = Field(..., min_length=2, max_length=5)
	correct_index: int = Field(..., ge=0)
	explanation: str | None = None
	time_limit_seconds: int = Field(default=30, ge=5, le=120)
	theme_connection: str | None = None
	deep_explanation: str | None = None
	related_questions: list[str] = Field(default_factory=list)
	tags: list[str] = Field(default_factory=list)
	source: str | None = None

	def is_correct(self, answer_index: int) -> bool:
		"""Check if the given answer is correct."""
		return answer_index == self.correct_index


class WritingPrompt(BaseModel):
	"""A prompt for writing games."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	subject: Subject
	difficulty: Difficulty
	title: str = Field(..., min_length=5, max_length=100)
	prompt: str = Field(..., min_length=20)
	starter_text: str | None = None  # For Story Chain
	word_limit: int = Field(default=200, ge=50, le=1000)
	time_limit_seconds: int = Field(default=300, ge=60, le=1800)


class DebateTopic(BaseModel):
	"""A topic for debate games."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	subject: Subject
	difficulty: Difficulty
	motion: str = Field(..., min_length=10)  # "This house believes..."
	context: str | None = None
	pro_hints: list[str] = Field(default_factory=list)
	con_hints: list[str] = Field(default_factory=list)
	prep_time_seconds: int = Field(default=60, ge=30, le=300)
	speaking_time_seconds: int = Field(default=120, ge=30, le=600)


class PatternPuzzle(BaseModel):
	"""A pattern recognition puzzle."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	subject: Subject
	difficulty: Difficulty
	sequence: list[str]  # The pattern elements
	missing_index: int  # Which element is hidden
	options: list[str]  # Possible answers
	correct_index: int
	explanation: str | None = None


class GameDefinition(BaseModel):
	"""Static definition of a game type."""

	model_config = ConfigDict(extra="forbid")

	type: str  # GameType value
	name: str
	description: str
	category: str  # GameCategory value
	min_players: int = 1
	max_players: int = 10
	duration_minutes: int = 15
	sync_type: str  # "real-time", "turn-based", "synchronized", "individual"
	icon: str = "gamepad"  # Icon name for UI


# Game definitions for the 16 games
GAME_DEFINITIONS: list[GameDefinition] = [
	# Scholar's Bowl
	GameDefinition(
		type="buzzer_battle",
		name="Buzzer Battle",
		description="Race to buzz in first with the correct answer!",
		category="scholars_bowl",
		sync_type="real-time",
		icon="zap",
		duration_minutes=10,
	),
	GameDefinition(
		type="category_challenge",
		name="Category Challenge",
		description="Draw category cards and answer questions in turns.",
		category="scholars_bowl",
		sync_type="turn-based",
		icon="layers",
		duration_minutes=15,
	),
	GameDefinition(
		type="team_trivia_night",
		name="Team Trivia Night",
		description="Answer together as a team for bonus points!",
		category="scholars_bowl",
		sync_type="synchronized",
		icon="users",
		duration_minutes=20,
	),
	GameDefinition(
		type="scavenger_bowl",
		name="Scavenger Bowl",
		description="Find hidden answers in the virtual room!",
		category="scholars_bowl",
		sync_type="real-time",
		icon="search",
		duration_minutes=15,
	),
	# Collaborative Writing
	GameDefinition(
		type="story_chain",
		name="Story Chain",
		description="Build a story together, one paragraph at a time.",
		category="collaborative_writing",
		sync_type="turn-based",
		icon="book-open",
		duration_minutes=20,
	),
	GameDefinition(
		type="essay_sprint",
		name="Essay Sprint",
		description="Write an essay together in real-time!",
		category="collaborative_writing",
		sync_type="real-time",
		icon="edit-3",
		duration_minutes=25,
	),
	GameDefinition(
		type="role_based_writing",
		name="Role-Based Writing",
		description="Each player writes a different section.",
		category="collaborative_writing",
		sync_type="synchronized",
		icon="clipboard",
		duration_minutes=20,
	),
	GameDefinition(
		type="argument_tennis",
		name="Argument Tennis",
		description="Rally arguments back and forth on a topic.",
		category="collaborative_writing",
		sync_type="turn-based",
		icon="repeat",
		duration_minutes=15,
	),
	# Scholar's Challenge
	GameDefinition(
		type="flashcard_frenzy",
		name="Flashcard Frenzy",
		description="Speed through flashcards to rack up points!",
		category="scholars_challenge",
		sync_type="individual",
		icon="credit-card",
		duration_minutes=10,
	),
	GameDefinition(
		type="pattern_puzzles",
		name="Pattern Puzzles",
		description="Spot the pattern and find the missing piece.",
		category="scholars_challenge",
		sync_type="synchronized",
		icon="grid",
		duration_minutes=15,
	),
	GameDefinition(
		type="quickfire_quiz",
		name="Quickfire Quiz",
		description="Rapid-fire questions - think fast!",
		category="scholars_challenge",
		sync_type="synchronized",
		icon="clock",
		duration_minutes=10,
	),
	GameDefinition(
		type="elimination_olympics",
		name="Elimination Olympics",
		description="Practice strategic guessing like the real competition.",
		category="scholars_challenge",
		sync_type="individual",
		icon="target",
		duration_minutes=15,
	),
	# Team Debate
	GameDefinition(
		type="mini_debate",
		name="Mini-Debate",
		description="Quick structured debates on fun topics.",
		category="team_debate",
		sync_type="turn-based",
		icon="message-circle",
		duration_minutes=20,
	),
	GameDefinition(
		type="role_play_debates",
		name="Role-Play Debates",
		description="Take on character roles and debate!",
		category="team_debate",
		sync_type="turn-based",
		icon="users",
		duration_minutes=25,
	),
	GameDefinition(
		type="argument_builder",
		name="Argument Builder",
		description="Collaborate to build the perfect argument.",
		category="team_debate",
		sync_type="synchronized",
		icon="tool",
		duration_minutes=15,
	),
	GameDefinition(
		type="impromptu_challenge",
		name="Impromptu Challenge",
		description="Think on your feet with surprise topics!",
		category="team_debate",
		sync_type="individual",
		icon="mic",
		duration_minutes=15,
	),
]


	# New games
	GameDefinition(
		type="tossup_bonus",
		name="Tossup/Bonus",
		description="Buzz in early as clues are revealed — the sooner you buzz, the more points!",
		category="scholars_bowl",
		sync_type="real-time",
		icon="layers",
		duration_minutes=15,
		min_players=2,
		max_players=10,
	),
	GameDefinition(
		type="fact_or_fiction",
		name="Fact or Fiction",
		description="Is it true? And if false, can you correct it? Test your WSC knowledge.",
		category="scholars_challenge",
		sync_type="synchronized",
		icon="check-circle",
		duration_minutes=10,
		min_players=1,
		max_players=10,
	),
	GameDefinition(
		type="timeline_race",
		name="Timeline Race",
		description="Arrange historical and scientific events in chronological order before time runs out.",
		category="scholars_challenge",
		sync_type="synchronized",
		icon="calendar",
		duration_minutes=10,
		min_players=1,
		max_players=10,
	),
	GameDefinition(
		type="analogy_arena",
		name="Analogy Arena",
		description="Complete cross-subject analogies: A is to B as C is to ___",
		category="scholars_challenge",
		sync_type="real-time",
		icon="git-branch",
		duration_minutes=10,
		min_players=1,
		max_players=10,
	),
	GameDefinition(
		type="subject_swap",
		name="Subject Swap",
		description="Questions that start in one subject but the answer lives in another!",
		category="scholars_challenge",
		sync_type="synchronized",
		icon="shuffle",
		duration_minutes=12,
		min_players=1,
		max_players=10,
	),
	GameDefinition(
		type="six_degrees",
		name="Six Degrees",
		description="Connect two unrelated concepts through a chain of valid links in 6 steps or fewer.",
		category="scholars_challenge",
		sync_type="individual",
		icon="link",
		duration_minutes=15,
		min_players=1,
		max_players=6,
	),
	GameDefinition(
		type="evidence_hunt",
		name="Evidence Hunt",
		description="Given a claim, race to find the strongest counter-evidence. AI scores your rebuttal.",
		category="team_debate",
		sync_type="individual",
		icon="search",
		duration_minutes=12,
		min_players=1,
		max_players=6,
	),
	GameDefinition(
		type="devils_advocate",
		name="Devil's Advocate",
		description="Argue the exact opposite of a stated position. AI evaluates how well you flip the argument.",
		category="team_debate",
		sync_type="turn-based",
		icon="flip-horizontal",
		duration_minutes=15,
		min_players=1,
		max_players=6,
	),
	GameDefinition(
		type="paragraph_swap",
		name="Paragraph Swap",
		description="Write a paragraph, then edit a teammate's. AI scores coherence improvement.",
		category="collaborative_writing",
		sync_type="turn-based",
		icon="edit",
		duration_minutes=20,
		min_players=1,
		max_players=6,
	),
	GameDefinition(
		type="reverse_essay",
		name="Reverse Essay",
		description="Given a conclusion, reconstruct the argument that leads to it.",
		category="collaborative_writing",
		sync_type="individual",
		icon="corner-up-left",
		duration_minutes=15,
		min_players=1,
		max_players=6,
	),
	GameDefinition(
		type="times_table_blitz",
		name="Times Table Blitz",
		description="Race through multiplication tables with speed streaks and escalating difficulty.",
		category="scholars_challenge",
		sync_type="synchronized",
		icon="hash",
		duration_minutes=8,
		min_players=1,
		max_players=10,
	),
]


def get_game_definition(game_type: str) -> GameDefinition | None:
	"""Get the definition for a game type."""
	for game_def in GAME_DEFINITIONS:
		if game_def.type == game_type:
			return game_def
	return None
