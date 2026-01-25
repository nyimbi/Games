"""Real-time communication service using Pusher/Soketi."""

import json
from datetime import datetime
from enum import Enum
from functools import lru_cache
from typing import Any

import pusher

from games.core.config import get_settings


class EventType(str, Enum):
	"""Types of real-time events."""

	# Session events
	SESSION_START = "session:start"
	SESSION_END = "session:end"
	SESSION_PAUSE = "session:pause"
	SESSION_RESUME = "session:resume"
	PLAYER_JOINED = "player:joined"
	PLAYER_LEFT = "player:left"

	# Game events
	GAME_START = "game:start"
	GAME_END = "game:end"
	ROUND_START = "round:start"
	ROUND_END = "round:end"
	QUESTION = "question"
	ANSWER = "answer"
	BUZZER = "buzzer"
	BUZZER_RESET = "buzzer:reset"
	SCORE_UPDATE = "score:update"
	TIMER_UPDATE = "timer:update"
	TIMER_START = "timer:start"
	TIMER_STOP = "timer:stop"

	# Writing events
	WRITING_UPDATE = "writing:update"
	TURN_CHANGE = "turn:change"

	# Debate events
	SPEAKER_CHANGE = "speaker:change"
	ARGUMENT = "argument"

	# General
	STATE_SYNC = "state:sync"
	CHAT = "chat"
	ERROR = "error"


@lru_cache
def get_pusher_client() -> pusher.Pusher:
	"""Get the Pusher client instance."""
	settings = get_settings()
	return pusher.Pusher(
		app_id=settings.pusher_app_id,
		key=settings.pusher_key,
		secret=settings.pusher_secret,
		host=settings.pusher_host,
		port=settings.pusher_port,
		ssl=settings.pusher_ssl,
	)


def get_session_channel(session_id: str) -> str:
	"""Get the channel name for a session."""
	return f"presence-session-{session_id}"


def get_private_channel(user_id: str) -> str:
	"""Get a private channel for a specific user."""
	return f"private-user-{user_id}"


async def trigger_event(
	channel: str,
	event: EventType,
	data: dict[str, Any],
	socket_id: str | None = None,
) -> bool:
	"""Trigger an event on a channel.

	Args:
		channel: The channel to trigger on
		event: The event type
		data: The event data
		socket_id: Optional socket ID to exclude from receiving

	Returns:
		True if successful
	"""
	client = get_pusher_client()
	try:
		# Add timestamp if not present
		if "timestamp" not in data:
			data["timestamp"] = datetime.utcnow().isoformat()

		if socket_id:
			client.trigger(channel, event.value, data, socket_id)
		else:
			client.trigger(channel, event.value, data)
		return True
	except Exception as e:
		print(f"Failed to trigger event: {e}")
		return False


async def trigger_session_event(
	session_id: str,
	event: EventType,
	data: dict[str, Any],
	exclude_socket_id: str | None = None,
) -> bool:
	"""Trigger an event on a session channel."""
	channel = get_session_channel(session_id)
	return await trigger_event(channel, event, data, exclude_socket_id)


async def trigger_user_event(
	user_id: str,
	event: EventType,
	data: dict[str, Any],
) -> bool:
	"""Trigger an event to a specific user."""
	channel = get_private_channel(user_id)
	return await trigger_event(channel, event, data)


def authenticate_channel(
	channel: str,
	socket_id: str,
	user_id: str,
	user_info: dict[str, Any] | None = None,
) -> str:
	"""Authenticate a user for a channel.

	For presence channels, includes user info.
	For private channels, just authenticates.
	"""
	client = get_pusher_client()

	if channel.startswith("presence-"):
		# Presence channel - include user info
		auth = client.authenticate(
			channel=channel,
			socket_id=socket_id,
			custom_data={
				"user_id": user_id,
				"user_info": user_info or {},
			},
		)
	else:
		# Private channel - just authenticate
		auth = client.authenticate(
			channel=channel,
			socket_id=socket_id,
		)

	return json.dumps(auth)


class GameSession:
	"""Helper class for managing a game session's real-time events."""

	def __init__(self, session_id: str):
		self.session_id = session_id
		self.channel = get_session_channel(session_id)

	async def start_game(
		self,
		game_type: str,
		initial_state: dict[str, Any],
	) -> bool:
		"""Broadcast game start to all players."""
		return await trigger_session_event(
			self.session_id,
			EventType.GAME_START,
			{
				"game_type": game_type,
				"state": initial_state,
			},
		)

	async def end_game(self, results: dict[str, Any]) -> bool:
		"""Broadcast game end with results."""
		return await trigger_session_event(
			self.session_id,
			EventType.GAME_END,
			{"results": results},
		)

	async def send_question(
		self,
		question_data: dict[str, Any],
		round_number: int,
	) -> bool:
		"""Send a new question to all players."""
		# First reset buzzer
		await trigger_session_event(
			self.session_id,
			EventType.BUZZER_RESET,
			{"round": round_number},
		)

		# Then send question
		return await trigger_session_event(
			self.session_id,
			EventType.QUESTION,
			{
				"question": question_data,
				"round": round_number,
			},
		)

	async def record_buzzer(
		self,
		user_id: str,
		username: str,
		timestamp: datetime,
	) -> bool:
		"""Record and broadcast a buzzer press."""
		return await trigger_session_event(
			self.session_id,
			EventType.BUZZER,
			{
				"user_id": user_id,
				"username": username,
				"buzzer_time": timestamp.isoformat(),
			},
		)

	async def update_scores(self, scores: dict[str, int]) -> bool:
		"""Broadcast score updates."""
		return await trigger_session_event(
			self.session_id,
			EventType.SCORE_UPDATE,
			{"scores": scores},
		)

	async def start_timer(self, duration_seconds: int) -> bool:
		"""Start a synchronized timer."""
		return await trigger_session_event(
			self.session_id,
			EventType.TIMER_START,
			{
				"duration": duration_seconds,
				"start_time": datetime.utcnow().isoformat(),
			},
		)

	async def stop_timer(self) -> bool:
		"""Stop the current timer."""
		return await trigger_session_event(
			self.session_id,
			EventType.TIMER_STOP,
			{},
		)

	async def sync_state(self, state: dict[str, Any]) -> bool:
		"""Sync the full game state to all clients."""
		return await trigger_session_event(
			self.session_id,
			EventType.STATE_SYNC,
			{"state": state},
		)

	async def change_turn(self, user_id: str, username: str) -> bool:
		"""Announce a turn change."""
		return await trigger_session_event(
			self.session_id,
			EventType.TURN_CHANGE,
			{
				"current_player_id": user_id,
				"current_player_name": username,
			},
		)

	async def broadcast_writing(
		self,
		user_id: str,
		username: str,
		content: str,
		section: str | None = None,
	) -> bool:
		"""Broadcast a writing update."""
		return await trigger_session_event(
			self.session_id,
			EventType.WRITING_UPDATE,
			{
				"user_id": user_id,
				"username": username,
				"content": content,
				"section": section,
			},
		)
