"""Session management API routes."""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from games.core.database import get_connection, parse_json_field, serialize_json_field
from games.models import (
	GAME_DEFINITIONS,
	Difficulty,
	GameType,
	Session,
	SessionCreate,
	SessionMode,
	SessionStatus,
)
from games.services.auth import get_user_by_id
from games.services.realtime import EventType, trigger_session_event

router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionResponse(BaseModel):
	"""Response with session info."""

	session: Session
	player_count: int = 0


class SessionListResponse(BaseModel):
	"""Response with list of sessions."""

	sessions: list[Session]


async def get_session_by_id(session_id: int) -> Session | None:
	"""Get a session by ID."""
	async with get_connection() as conn:
		row = await conn.fetchrow(
			"SELECT * FROM sessions WHERE id = $1",
			session_id,
		)
		if row is None:
			return None

		games = parse_json_field(row["games"], [])
		return Session(
			id=row["id"],
			team_id=row["team_id"],
			coach_id=row["coach_id"],
			player_id=row.get("player_id"),
			name=row["name"],
			mode=SessionMode(row.get("mode", "team_practice")),
			status=SessionStatus(row["status"]),
			scheduled_at=row["scheduled_at"],
			started_at=row["started_at"],
			ended_at=row["ended_at"],
			games=[GameType(g) for g in games],
			difficulty=Difficulty(row["difficulty"]),
			created_at=row["created_at"],
		)


@router.post("", response_model=SessionResponse)
async def create_session(
	session_data: SessionCreate,
	x_user_id: int = Header(...),
) -> SessionResponse:
	"""Create a new game session."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(status_code=401, detail="User not found")

	now = datetime.utcnow()

	# Determine session parameters based on mode
	if session_data.mode == SessionMode.SOLO_PRACTICE:
		# Solo practice - player creates for themselves
		team_id = user.team_id  # Can be None
		coach_id = None
		player_id = user.id
	else:
		# Team practice - coach creates for team
		if not user.is_coach():
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="Only coaches can create team sessions",
			)
		if not user.team_id:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="You need to create a team first",
			)
		team_id = user.team_id
		coach_id = user.id
		player_id = None

	async with get_connection() as conn:
		row = await conn.fetchrow(
			"""
			INSERT INTO sessions (
				team_id, coach_id, player_id, name, mode, status,
				scheduled_at, games, difficulty, created_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id
			""",
			team_id,
			coach_id,
			player_id,
			session_data.name,
			session_data.mode.value,
			SessionStatus.SCHEDULED.value,
			session_data.scheduled_at,
			serialize_json_field([g.value for g in session_data.games]),
			session_data.difficulty.value,
			now,
		)
		session_id = row["id"]

	session = Session(
		id=session_id,
		team_id=team_id,
		coach_id=coach_id,
		player_id=player_id,
		name=session_data.name,
		mode=session_data.mode,
		status=SessionStatus.SCHEDULED,
		scheduled_at=session_data.scheduled_at,
		games=session_data.games,
		difficulty=session_data.difficulty,
		created_at=now,
	)

	return SessionResponse(session=session, player_count=1 if player_id else 0)


@router.get("", response_model=SessionListResponse)
async def list_sessions(
	session_status: SessionStatus | None = None,
	x_user_id: int = Header(...),
) -> SessionListResponse:
	"""List sessions for the current user."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(status_code=401, detail="User not found")

	async with get_connection() as conn:
		# Build query based on user role
		if user.is_coach():
			# Coach sees team sessions they created
			if session_status:
				rows = await conn.fetch(
					"""
					SELECT * FROM sessions
					WHERE coach_id = $1 AND status = $2
					ORDER BY created_at DESC
					""",
					user.id,
					session_status.value,
				)
			else:
				rows = await conn.fetch(
					"""
					SELECT * FROM sessions
					WHERE coach_id = $1
					ORDER BY created_at DESC
					""",
					user.id,
				)
		else:
			# Player sees their solo sessions + team sessions
			if session_status:
				rows = await conn.fetch(
					"""
					SELECT * FROM sessions
					WHERE (player_id = $1 OR team_id = $2) AND status = $3
					ORDER BY created_at DESC
					""",
					user.id,
					user.team_id,
					session_status.value,
				)
			else:
				rows = await conn.fetch(
					"""
					SELECT * FROM sessions
					WHERE player_id = $1 OR team_id = $2
					ORDER BY created_at DESC
					""",
					user.id,
					user.team_id,
				)

		sessions = []
		for row in rows:
			games = parse_json_field(row["games"], [])
			sessions.append(
				Session(
					id=row["id"],
					team_id=row["team_id"],
					coach_id=row["coach_id"],
					player_id=row.get("player_id"),
					name=row["name"],
					mode=SessionMode(row.get("mode", "team_practice")),
					status=SessionStatus(row["status"]),
					scheduled_at=row["scheduled_at"],
					started_at=row["started_at"],
					ended_at=row["ended_at"],
					games=[GameType(g) for g in games],
					difficulty=Difficulty(row["difficulty"]),
					created_at=row["created_at"],
				)
			)

		return SessionListResponse(sessions=sessions)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
	session_id: int,
	x_user_id: int = Header(...),
) -> SessionResponse:
	"""Get a specific session."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(status_code=401, detail="User not found")

	session = await get_session_by_id(session_id)
	if session is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Session not found",
		)

	# Check access
	if session.coach_id != user.id and session.player_id != user.id:
		if session.team_id != user.team_id:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="You don't have access to this session",
			)

	# Get player count
	async with get_connection() as conn:
		count = await conn.fetchval(
			"SELECT COUNT(*) FROM player_sessions WHERE session_id = $1 AND is_active = TRUE",
			session_id,
		)

	return SessionResponse(session=session, player_count=count or 0)


@router.post("/{session_id}/start")
async def start_session(
	session_id: int,
	x_user_id: int = Header(...),
) -> SessionResponse:
	"""Start a game session."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(status_code=401, detail="User not found")

	session = await get_session_by_id(session_id)
	if session is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Session not found",
		)

	# Check permission
	if session.is_solo:
		if session.player_id != user.id:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="Only the session owner can start this session",
			)
	elif session.coach_id != user.id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Only the coach can start team sessions",
		)

	# Update session status
	now = datetime.utcnow()
	async with get_connection() as conn:
		await conn.execute(
			"""
			UPDATE sessions
			SET status = $1, started_at = $2
			WHERE id = $3
			""",
			SessionStatus.ACTIVE.value,
			now,
			session_id,
		)

	session.status = SessionStatus.ACTIVE
	session.started_at = now

	# Notify connected clients
	if not session.is_solo:
		await trigger_session_event(
			str(session_id),
			EventType.SESSION_START,
			{
				"session_id": session_id,
				"games": [g.value for g in session.games],
				"difficulty": session.difficulty.value,
			},
		)

	return SessionResponse(session=session, player_count=0)


@router.post("/{session_id}/end")
async def end_session(
	session_id: int,
	x_user_id: int = Header(...),
) -> SessionResponse:
	"""End a game session."""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(status_code=401, detail="User not found")

	session = await get_session_by_id(session_id)
	if session is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Session not found",
		)

	# Check permission
	if session.is_solo:
		if session.player_id != user.id:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="Only the session owner can end this session",
			)
	elif session.coach_id != user.id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Only the coach can end team sessions",
		)

	# Update session status
	now = datetime.utcnow()
	async with get_connection() as conn:
		await conn.execute(
			"""
			UPDATE sessions
			SET status = $1, ended_at = $2
			WHERE id = $3
			""",
			SessionStatus.COMPLETED.value,
			now,
			session_id,
		)

	session.status = SessionStatus.COMPLETED
	session.ended_at = now

	# Notify connected clients
	if not session.is_solo:
		await trigger_session_event(
			str(session_id),
			EventType.SESSION_END,
			{"session_id": session_id},
		)

	return SessionResponse(session=session, player_count=0)


@router.get("/{session_id}/games")
async def list_available_games(
	session_id: int,
	x_user_id: int = Header(...),
) -> dict[str, Any]:
	"""Get available games for a session with their definitions."""
	session = await get_session_by_id(session_id)
	if session is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Session not found",
		)

	# Get game definitions for the session's games
	games = []
	for game_def in GAME_DEFINITIONS:
		if GameType(game_def.type) in session.games:
			games.append(game_def.model_dump())

	return {
		"session_id": session_id,
		"games": games,
		"total": len(games),
	}
