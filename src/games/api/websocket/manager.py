"""WebSocket connection manager for real-time game sync."""

import asyncio
import json
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import WebSocket
from pydantic import BaseModel


class MessageType(str, Enum):
	"""Types of WebSocket messages."""

	# Connection events
	CONNECTED = "connected"
	DISCONNECTED = "disconnected"
	ERROR = "error"

	# Session events
	SESSION_START = "session_start"
	SESSION_END = "session_end"
	SESSION_PAUSE = "session_pause"
	SESSION_RESUME = "session_resume"
	PLAYER_JOINED = "player_joined"
	PLAYER_LEFT = "player_left"

	# Game events
	GAME_START = "game_start"
	GAME_END = "game_end"
	ROUND_START = "round_start"
	ROUND_END = "round_end"
	QUESTION = "question"
	ANSWER = "answer"
	BUZZER = "buzzer"
	SCORE_UPDATE = "score_update"
	TIMER_UPDATE = "timer_update"

	# Writing events
	WRITING_UPDATE = "writing_update"
	TURN_CHANGE = "turn_change"

	# Debate events
	SPEAKER_CHANGE = "speaker_change"
	ARGUMENT = "argument"

	# General
	STATE_SYNC = "state_sync"
	CHAT = "chat"
	PING = "ping"
	PONG = "pong"


class WSMessage(BaseModel):
	"""WebSocket message format."""

	type: MessageType
	payload: dict[str, Any] = {}
	sender_id: str | None = None
	timestamp: datetime | None = None

	def to_json(self) -> str:
		"""Serialize to JSON string."""
		data = self.model_dump(mode="json")
		if data["timestamp"] is None:
			data["timestamp"] = datetime.utcnow().isoformat()
		return json.dumps(data)


class Connection:
	"""Represents a single WebSocket connection."""

	def __init__(
		self,
		websocket: WebSocket,
		user_id: str,
		username: str,
		session_id: str,
		role: str,
	):
		self.websocket = websocket
		self.user_id = user_id
		self.username = username
		self.session_id = session_id
		self.role = role
		self.connected_at = datetime.utcnow()

	async def send(self, message: WSMessage) -> bool:
		"""Send a message to this connection."""
		try:
			await self.websocket.send_text(message.to_json())
			return True
		except Exception:
			return False


class SessionRoom:
	"""A room for a game session containing multiple connections."""

	def __init__(self, session_id: str):
		self.session_id = session_id
		self.connections: dict[str, Connection] = {}  # user_id -> Connection
		self.game_state: dict[str, Any] = {}
		self.created_at = datetime.utcnow()

	def add_connection(self, conn: Connection) -> None:
		"""Add a connection to the room."""
		self.connections[conn.user_id] = conn

	def remove_connection(self, user_id: str) -> Connection | None:
		"""Remove a connection from the room."""
		return self.connections.pop(user_id, None)

	def get_connection(self, user_id: str) -> Connection | None:
		"""Get a connection by user ID."""
		return self.connections.get(user_id)

	def get_coach_connection(self) -> Connection | None:
		"""Get the coach connection if present."""
		for conn in self.connections.values():
			if conn.role == "coach":
				return conn
		return None

	def get_player_connections(self) -> list[Connection]:
		"""Get all player connections."""
		return [c for c in self.connections.values() if c.role == "player"]

	async def broadcast(
		self,
		message: WSMessage,
		exclude_user_id: str | None = None,
	) -> None:
		"""Broadcast a message to all connections in the room."""
		tasks = []
		for user_id, conn in self.connections.items():
			if user_id != exclude_user_id:
				tasks.append(conn.send(message))
		await asyncio.gather(*tasks, return_exceptions=True)

	async def send_to_user(self, user_id: str, message: WSMessage) -> bool:
		"""Send a message to a specific user."""
		conn = self.connections.get(user_id)
		if conn:
			return await conn.send(message)
		return False

	async def send_to_coach(self, message: WSMessage) -> bool:
		"""Send a message to the coach only."""
		coach = self.get_coach_connection()
		if coach:
			return await coach.send(message)
		return False

	async def send_to_players(self, message: WSMessage) -> None:
		"""Send a message to all players (not coach)."""
		tasks = [conn.send(message) for conn in self.get_player_connections()]
		await asyncio.gather(*tasks, return_exceptions=True)

	@property
	def player_count(self) -> int:
		"""Get the number of players in the room."""
		return len(self.get_player_connections())

	@property
	def is_empty(self) -> bool:
		"""Check if the room has no connections."""
		return len(self.connections) == 0


class ConnectionManager:
	"""Manages all WebSocket connections across sessions."""

	def __init__(self):
		self.rooms: dict[str, SessionRoom] = {}  # session_id -> SessionRoom
		self._lock = asyncio.Lock()

	async def connect(
		self,
		websocket: WebSocket,
		user_id: str,
		username: str,
		session_id: str,
		role: str,
	) -> Connection:
		"""Accept a new WebSocket connection and add to room."""
		await websocket.accept()

		conn = Connection(
			websocket=websocket,
			user_id=user_id,
			username=username,
			session_id=session_id,
			role=role,
		)

		async with self._lock:
			if session_id not in self.rooms:
				self.rooms[session_id] = SessionRoom(session_id)
			self.rooms[session_id].add_connection(conn)

		# Notify others in the room
		room = self.rooms[session_id]
		await room.broadcast(
			WSMessage(
				type=MessageType.PLAYER_JOINED,
				payload={
					"user_id": user_id,
					"username": username,
					"role": role,
					"player_count": room.player_count,
				},
				sender_id=user_id,
			),
			exclude_user_id=user_id,
		)

		# Send current state to new connection
		await conn.send(
			WSMessage(
				type=MessageType.CONNECTED,
				payload={
					"session_id": session_id,
					"player_count": room.player_count,
					"game_state": room.game_state,
				},
			)
		)

		return conn

	async def disconnect(self, user_id: str, session_id: str) -> None:
		"""Remove a connection from its room."""
		async with self._lock:
			room = self.rooms.get(session_id)
			if room:
				conn = room.remove_connection(user_id)
				if conn:
					# Notify others
					await room.broadcast(
						WSMessage(
							type=MessageType.PLAYER_LEFT,
							payload={
								"user_id": user_id,
								"username": conn.username,
								"role": conn.role,
								"player_count": room.player_count,
							},
							sender_id=user_id,
						)
					)

				# Clean up empty rooms
				if room.is_empty:
					del self.rooms[session_id]

	def get_room(self, session_id: str) -> SessionRoom | None:
		"""Get a room by session ID."""
		return self.rooms.get(session_id)

	async def update_game_state(
		self,
		session_id: str,
		state_update: dict[str, Any],
		broadcast: bool = True,
	) -> None:
		"""Update the game state for a session."""
		room = self.rooms.get(session_id)
		if room:
			room.game_state.update(state_update)
			if broadcast:
				await room.broadcast(
					WSMessage(
						type=MessageType.STATE_SYNC,
						payload=room.game_state,
					)
				)

	async def handle_buzzer(
		self,
		session_id: str,
		user_id: str,
		username: str,
		timestamp: datetime,
	) -> bool:
		"""Handle a buzzer press - returns True if this user won the race."""
		room = self.rooms.get(session_id)
		if not room:
			return False

		# Check if buzzer is locked (someone already buzzed)
		if room.game_state.get("buzzer_locked"):
			return False

		# Lock the buzzer and record winner
		room.game_state["buzzer_locked"] = True
		room.game_state["buzzer_winner"] = {
			"user_id": user_id,
			"username": username,
			"timestamp": timestamp.isoformat(),
		}

		# Broadcast buzzer win
		await room.broadcast(
			WSMessage(
				type=MessageType.BUZZER,
				payload={
					"winner_id": user_id,
					"winner_name": username,
					"timestamp": timestamp.isoformat(),
				},
				sender_id=user_id,
			)
		)

		return True

	async def reset_buzzer(self, session_id: str) -> None:
		"""Reset the buzzer for a new question."""
		room = self.rooms.get(session_id)
		if room:
			room.game_state["buzzer_locked"] = False
			room.game_state["buzzer_winner"] = None
			await room.broadcast(
				WSMessage(
					type=MessageType.STATE_SYNC,
					payload={"buzzer_locked": False, "buzzer_winner": None},
				)
			)


# Global connection manager instance
manager = ConnectionManager()
