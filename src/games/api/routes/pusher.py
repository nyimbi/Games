"""Pusher/Soketi authentication endpoints."""

from fastapi import APIRouter, Form, Header, HTTPException, status
from fastapi.responses import PlainTextResponse

from games.services.auth import get_user_by_id
from games.services.realtime import authenticate_channel

router = APIRouter(prefix="/pusher", tags=["pusher"])


@router.post("/auth", response_class=PlainTextResponse)
async def pusher_auth(
	socket_id: str = Form(...),
	channel_name: str = Form(...),
	x_user_id: int = Header(...),
) -> str:
	"""Authenticate a Pusher/Soketi channel subscription.

	This endpoint is called by Pusher.js when subscribing to private or presence channels.
	"""
	user = await get_user_by_id(x_user_id)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="User not found",
		)

	# Validate channel access
	if channel_name.startswith("presence-session-"):
		# Session channels - user must be in a team (unless solo practice)
		session_id = channel_name.replace("presence-session-", "")
		# For now, allow any authenticated user
		# TODO: Validate session access based on team membership

	elif channel_name.startswith("private-user-"):
		# Private user channels - only the user themselves
		channel_user_id = channel_name.replace("private-user-", "")
		if str(channel_user_id) != str(user.id):
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="Cannot subscribe to another user's private channel",
			)

	else:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Invalid channel type",
		)

	# Generate auth response
	user_info = {
		"id": user.id,
		"display_name": user.display_name,
		"role": user.role.value,
		"avatar_color": user.avatar_color,
	}

	auth_response = authenticate_channel(
		channel=channel_name,
		socket_id=socket_id,
		user_id=str(user.id),
		user_info=user_info,
	)

	return auth_response
