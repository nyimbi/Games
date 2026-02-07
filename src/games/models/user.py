"""User models for team management - simplified without authentication."""

from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import AfterValidator


def _validate_team_code(code: str) -> str:
	"""Validate team code format (4-12 alphanumeric chars, hyphens allowed in middle)."""
	stripped = code.strip()
	assert 4 <= len(stripped) <= 12, "Team code must be 4-12 characters"
	assert all(c.isalnum() or c == "-" for c in stripped), "Team code must be alphanumeric (hyphens allowed)"
	assert stripped[0].isalnum() and stripped[-1].isalnum(), "Team code must start and end with a letter or number"
	return stripped.upper()


TeamCode = Annotated[str, AfterValidator(_validate_team_code)]

ANIMAL_AVATARS = [
	"fox", "owl", "dolphin", "lion", "panda",
	"butterfly", "turtle", "eagle", "octopus", "parrot",
	"wolf", "shark", "bee", "unicorn", "frog",
	"penguin", "lizard", "koala", "seal", "tiger",
]


class UserRole(str, Enum):
	"""User roles in the system."""

	COACH = "coach"
	PLAYER = "player"


class User(BaseModel):
	"""User model - identified by name, no password required."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	display_name: str = Field(..., min_length=1, max_length=50)
	role: UserRole
	team_id: int | None = None
	avatar_color: str = Field(default="#6b9080")  # Sage green default
	scholar_code: str | None = None
	avatar: str = "fox"
	created_at: datetime = Field(default_factory=datetime.utcnow)

	def is_coach(self) -> bool:
		"""Check if user is a coach."""
		return self.role == UserRole.COACH


class Team(BaseModel):
	"""Team model for grouping players under a coach."""

	model_config = ConfigDict(
		extra="forbid",
		validate_default=True,
	)

	id: int | None = None
	name: str = Field(..., min_length=2, max_length=50)
	join_code: TeamCode
	coach_id: int
	created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
	"""Schema for creating/joining as a user - just name and role."""

	model_config = ConfigDict(extra="forbid")

	display_name: str = Field(..., min_length=1, max_length=50)
	role: UserRole
	avatar_color: str | None = None
	avatar: str = "fox"


class TeamCreate(BaseModel):
	"""Schema for creating a new team. Optional join_code lets coaches pick a memorable code."""

	model_config = ConfigDict(extra="forbid")

	name: str = Field(..., min_length=2, max_length=50)
	join_code: str | None = Field(default=None, min_length=4, max_length=12)


class TeamJoin(BaseModel):
	"""Schema for joining a team."""

	model_config = ConfigDict(extra="forbid")

	join_code: str = Field(..., min_length=4, max_length=12)


class ScholarCodeLookup(BaseModel):
	"""Schema for looking up a user by scholar code."""

	model_config = ConfigDict(extra="forbid")

	scholar_code: str = Field(..., min_length=5, max_length=15)


class TeamSwitch(BaseModel):
	"""Schema for switching active team."""

	model_config = ConfigDict(extra="forbid")

	team_id: int
