"""Service layer."""

from games.services.auth import (
	create_team,
	create_user,
	get_team_by_code,
	get_team_by_id,
	get_team_members,
	get_user_by_id,
	join_team,
)
from games.services.realtime import (
	EventType,
	GameSession,
	authenticate_channel,
	get_private_channel,
	get_pusher_client,
	get_session_channel,
	trigger_event,
	trigger_session_event,
	trigger_user_event,
)

__all__ = [
	# Auth (simplified - no passwords)
	"create_team",
	"create_user",
	"get_team_by_code",
	"get_team_by_id",
	"get_team_members",
	"get_user_by_id",
	"join_team",
	# Realtime
	"EventType",
	"GameSession",
	"authenticate_channel",
	"get_private_channel",
	"get_pusher_client",
	"get_session_channel",
	"trigger_event",
	"trigger_session_event",
	"trigger_user_event",
]
