"""FastAPI application setup."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from games.api.routes import auth_router, games_router, pusher_router, sessions_router
from games.core.config import get_settings
from games.core.database import close_pool, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
	"""Application lifespan handler."""
	# Startup
	await init_db()
	yield
	# Shutdown
	await close_pool()


def create_app() -> FastAPI:
	"""Create and configure the FastAPI application."""
	settings = get_settings()

	app = FastAPI(
		title=settings.app_name,
		description="Real-time multiplayer learning games for World Scholars Cup preparation",
		version="0.1.0",
		lifespan=lifespan,
	)

	# CORS middleware
	app.add_middleware(
		CORSMiddleware,
		allow_origins=settings.cors_origins,
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	# Include routers
	app.include_router(auth_router, prefix="/api")
	app.include_router(sessions_router, prefix="/api")
	app.include_router(games_router, prefix="/api")
	app.include_router(pusher_router, prefix="/api")

	# Health check
	@app.get("/health")
	async def health_check():
		"""Health check endpoint."""
		return {"status": "healthy", "app": settings.app_name}

	return app


# Create app instance
app = create_app()
