"""API routes."""

from games.api.routes.auth import router as auth_router
from games.api.routes.games import router as games_router
from games.api.routes.pusher import router as pusher_router
from games.api.routes.sessions import router as sessions_router

__all__ = [
	"auth_router",
	"games_router",
	"pusher_router",
	"sessions_router",
]
