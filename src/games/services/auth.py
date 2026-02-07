"""Simplified user and team management - no password authentication."""

import random
import secrets
from datetime import datetime

from games.core.database import get_connection
from games.models import (
	ANIMAL_AVATARS,
	Team,
	TeamCreate,
	User,
	UserCreate,
	UserRole,
)

ANIMAL_NAMES_UPPER = [a.upper() for a in ANIMAL_AVATARS]


def generate_team_code() -> str:
	"""Generate a unique 6-character team join code."""
	return secrets.token_hex(3).upper()


async def generate_scholar_code(conn) -> str:
	"""Generate a unique ANIMAL-NNNN scholar code with collision checking."""
	for _ in range(10):
		animal = random.choice(ANIMAL_NAMES_UPPER)
		digits = f"{random.randint(0, 9999):04d}"
		code = f"{animal}-{digits}"
		existing = await conn.fetchrow(
			"SELECT 1 FROM users WHERE scholar_code = $1",
			code,
		)
		if existing is None:
			return code
	raise RuntimeError("Failed to generate unique scholar code after 10 attempts")


async def get_user_by_id(user_id: int) -> User | None:
	"""Get a user by ID."""
	async with get_connection() as conn:
		row = await conn.fetchrow(
			"SELECT * FROM users WHERE id = $1",
			user_id,
		)
		if row is None:
			return None
		return User(
			id=row["id"],
			display_name=row["display_name"],
			role=UserRole(row["role"]),
			team_id=row["team_id"],
			avatar_color=row["avatar_color"],
			scholar_code=row["scholar_code"],
			avatar=row["avatar"] or "fox",
			created_at=row["created_at"],
		)


async def get_user_by_scholar_code(code: str) -> User | None:
	"""Look up a user by scholar code (case-insensitive)."""
	normalized = code.strip().upper()
	async with get_connection() as conn:
		row = await conn.fetchrow(
			"SELECT * FROM users WHERE scholar_code = $1",
			normalized,
		)
		if row is None:
			return None
		return User(
			id=row["id"],
			display_name=row["display_name"],
			role=UserRole(row["role"]),
			team_id=row["team_id"],
			avatar_color=row["avatar_color"],
			scholar_code=row["scholar_code"],
			avatar=row["avatar"] or "fox",
			created_at=row["created_at"],
		)


async def create_user(user_data: UserCreate) -> User:
	"""Create a new user with a generated scholar code."""
	now = datetime.utcnow()

	async with get_connection() as conn:
		scholar_code = await generate_scholar_code(conn)
		row = await conn.fetchrow(
			"""
			INSERT INTO users (display_name, role, avatar_color, avatar, scholar_code, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
			""",
			user_data.display_name,
			user_data.role.value,
			user_data.avatar_color or "#6b9080",
			user_data.avatar or "fox",
			scholar_code,
			now,
		)
		user_id = row["id"]

	return User(
		id=user_id,
		display_name=user_data.display_name,
		role=user_data.role,
		avatar_color=user_data.avatar_color or "#6b9080",
		avatar=user_data.avatar or "fox",
		scholar_code=scholar_code,
		created_at=now,
	)


async def create_team(coach_id: int, team_data: TeamCreate) -> Team:
	"""Create a new team."""
	join_code = generate_team_code()
	now = datetime.utcnow()

	async with get_connection() as conn:
		# Create the team
		row = await conn.fetchrow(
			"""
			INSERT INTO teams (name, join_code, coach_id, created_at)
			VALUES ($1, $2, $3, $4)
			RETURNING id
			""",
			team_data.name,
			join_code,
			coach_id,
			now,
		)
		team_id = row["id"]

		# Update the coach's team_id
		await conn.execute(
			"UPDATE users SET team_id = $1 WHERE id = $2",
			team_id,
			coach_id,
		)

	return Team(
		id=team_id,
		name=team_data.name,
		join_code=join_code,
		coach_id=coach_id,
		created_at=now,
	)


async def get_team_by_code(join_code: str) -> Team | None:
	"""Get a team by join code."""
	async with get_connection() as conn:
		row = await conn.fetchrow(
			"SELECT * FROM teams WHERE join_code = $1",
			join_code.upper(),
		)
		if row is None:
			return None
		return Team(
			id=row["id"],
			name=row["name"],
			join_code=row["join_code"],
			coach_id=row["coach_id"],
			created_at=row["created_at"],
		)


async def get_team_by_id(team_id: int) -> Team | None:
	"""Get a team by ID."""
	async with get_connection() as conn:
		row = await conn.fetchrow(
			"SELECT * FROM teams WHERE id = $1",
			team_id,
		)
		if row is None:
			return None
		return Team(
			id=row["id"],
			name=row["name"],
			join_code=row["join_code"],
			coach_id=row["coach_id"],
			created_at=row["created_at"],
		)


async def join_team(user_id: int, join_code: str) -> Team | None:
	"""Join a team using the join code."""
	team = await get_team_by_code(join_code)
	if team is None:
		return None

	async with get_connection() as conn:
		await conn.execute(
			"UPDATE users SET team_id = $1 WHERE id = $2",
			team.id,
			user_id,
		)

	return team


async def get_team_members(team_id: int) -> list[User]:
	"""Get all members of a team."""
	async with get_connection() as conn:
		rows = await conn.fetch(
			"SELECT * FROM users WHERE team_id = $1 ORDER BY created_at",
			team_id,
		)
		return [
			User(
				id=row["id"],
				display_name=row["display_name"],
				role=UserRole(row["role"]),
				team_id=row["team_id"],
				avatar_color=row["avatar_color"],
				scholar_code=row["scholar_code"],
				avatar=row["avatar"] or "fox",
				created_at=row["created_at"],
			)
			for row in rows
		]
