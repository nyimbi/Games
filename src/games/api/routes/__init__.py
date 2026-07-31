"""API routes."""

from games.api.routes.auth import router as auth_router
from games.api.routes.games import router as games_router
from games.api.routes.pusher import router as pusher_router
from games.api.routes.ai import router as ai_router
from games.api.routes.sessions import router as sessions_router
from games.api.routes.vault import router as vault_router

__all__ = [
	"ai_router",
	"auth_router",
	"games_router",
	"pusher_router",
	"sessions_router",
	"vault_router",
]
