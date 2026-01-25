"""Simplified user API routes - no password authentication."""

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from games.models import (
	Team,
	TeamCreate,
	TeamJoin,
	User,
	UserCreate,
)
from games.services.auth import (
	create_team,
	create_user,
	get_team_by_id,
	get_team_members,
	get_user_by_id,
	join_team,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class UserResponse(BaseModel):
	"""Response with user info."""

	user: User


class TeamResponse(BaseModel):
	"""Response with team info."""

	team: Team
	members: list[User]


async def get_current_user(
	x_user_id: int = Header(..., description="User ID from registration"),
) -> User:
	"""Get the current user from the X-User-Id header."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="User not found",
		)
	return user


@router.post("/join", response_model=UserResponse)
async def join_as_user(user_data: UserCreate) -> UserResponse:
	"""Join the platform with a name and role - returns user ID to use for future requests."""
	user = await create_user(user_data)
	return UserResponse(user=user)


@router.get("/me", response_model=User)
async def get_me(
	x_user_id: int = Header(..., description="User ID"),
) -> User:
	"""Get the current user's profile."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="User not found",
		)
	return user


@router.post("/team", response_model=Team)
async def create_new_team(
	team_data: TeamCreate,
	x_user_id: int = Header(..., description="User ID"),
) -> Team:
	"""Create a new team (coach only)."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="User not found",
		)

	if not user.is_coach():
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Only coaches can create teams",
		)

	if user.team_id:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="You already have a team",
		)

	team = await create_team(user.id, team_data)
	return team


@router.post("/team/join", response_model=Team)
async def join_existing_team(
	join_data: TeamJoin,
	x_user_id: int = Header(..., description="User ID"),
) -> Team:
	"""Join a team using the join code."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="User not found",
		)

	if user.team_id:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="You are already in a team",
		)

	team = await join_team(user.id, join_data.join_code)
	if team is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Team not found with that code",
		)

	return team


@router.get("/team", response_model=TeamResponse)
async def get_my_team(
	x_user_id: int = Header(..., description="User ID"),
) -> TeamResponse:
	"""Get the current user's team and its members."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="User not found",
		)

	if not user.team_id:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="You are not in a team",
		)

	team = await get_team_by_id(user.team_id)
	if team is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Team not found",
		)

	members = await get_team_members(user.team_id)

	return TeamResponse(team=team, members=members)


@router.get("/user/{user_id}", response_model=User)
async def get_user(user_id: int) -> User:
	"""Get a user by ID."""
	user = await get_user_by_id(user_id)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="User not found",
		)
	return user
