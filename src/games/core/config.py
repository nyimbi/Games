"""Application configuration using pydantic-settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	"""Application settings loaded from environment variables."""

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		case_sensitive=False,
		extra="ignore",
	)

	# Application
	app_name: str = "WSC Scholar Games"
	debug: bool = False
	secret_key: str = "change-me-in-production-use-a-real-secret-key"

	# Database
	database_url: str = "postgresql://azureuser:Abcd1234.@lindela16.postgres.database.azure.com:5432/scholar?sslmode=require"

	# JWT Auth
	jwt_algorithm: str = "HS256"
	jwt_expire_minutes: int = 60 * 24 * 7  # 1 week

	# CORS
	cors_origins: list[str] = [
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://20.63.27.56:3000",
		"http://20.63.27.56",
		"https://llocal.com",
		"http://llocal.com",
		"https://www.llocal.com",
		"http://www.llocal.com",
	]

	# Server
	host: str = "0.0.0.0"
	port: int = 8000

	# Soketi/Pusher configuration
	pusher_app_id: str = "wsc-scholar-games"
	pusher_key: str = "wsc-games-key"
	pusher_secret: str = "wsc-games-secret"
	pusher_host: str = "172.236.30.103"
	pusher_port: int = 6001
	pusher_ssl: bool = False

	# Data paths
	data_dir: Path = Path(__file__).parent.parent.parent.parent / "data"
	questions_dir: Path = Path(__file__).parent.parent / "data" / "questions"


@lru_cache
def get_settings() -> Settings:
	"""Get cached settings instance."""
	return Settings()
