"""Database layer using asyncpg for PostgreSQL."""

import json
from contextlib import asynccontextmanager
from typing import Any

import asyncpg

from games.core.config import get_settings

# Global connection pool
_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
	"""Get or create the connection pool."""
	global _pool
	if _pool is None:
		settings = get_settings()
		_pool = await asyncpg.create_pool(
			settings.database_url,
			min_size=2,
			max_size=10,
		)
	return _pool


async def close_pool() -> None:
	"""Close the connection pool."""
	global _pool
	if _pool is not None:
		await _pool.close()
		_pool = None


@asynccontextmanager
async def get_connection():
	"""Get a database connection from the pool."""
	pool = await get_pool()
	async with pool.acquire() as conn:
		yield conn


async def init_db() -> None:
	"""Initialize the database with all required tables."""
	async with get_connection() as conn:
		# Users table (SERIAL primary key) - no password, simplified auth
		await conn.execute("""
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				display_name TEXT NOT NULL,
				role TEXT NOT NULL,
				team_id INTEGER,
				avatar_color TEXT DEFAULT '#6b9080',
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		""")

		# Teams table (SERIAL primary key)
		await conn.execute("""
			CREATE TABLE IF NOT EXISTS teams (
				id SERIAL PRIMARY KEY,
				name TEXT NOT NULL,
				join_code TEXT UNIQUE NOT NULL,
				coach_id INTEGER NOT NULL REFERENCES users(id),
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		""")

		# Add foreign key to users for team_id after teams table exists
		await conn.execute("""
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM information_schema.table_constraints
					WHERE constraint_name = 'users_team_id_fkey'
				) THEN
					ALTER TABLE users ADD CONSTRAINT users_team_id_fkey
					FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
				END IF;
			END $$;
		""")

		# Sessions table (SERIAL primary key)
		await conn.execute("""
			CREATE TABLE IF NOT EXISTS sessions (
				id SERIAL PRIMARY KEY,
				team_id INTEGER REFERENCES teams(id),
				coach_id INTEGER REFERENCES users(id),
				player_id INTEGER REFERENCES users(id),
				name TEXT NOT NULL,
				mode TEXT NOT NULL DEFAULT 'team_practice',
				status TEXT NOT NULL DEFAULT 'scheduled',
				scheduled_at TIMESTAMPTZ,
				started_at TIMESTAMPTZ,
				ended_at TIMESTAMPTZ,
				games JSONB NOT NULL DEFAULT '[]',
				difficulty TEXT NOT NULL DEFAULT 'medium',
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		""")

		# Player sessions (participation tracking) - composite primary key
		await conn.execute("""
			CREATE TABLE IF NOT EXISTS player_sessions (
				user_id INTEGER NOT NULL REFERENCES users(id),
				session_id INTEGER NOT NULL REFERENCES sessions(id),
				joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				is_active BOOLEAN DEFAULT TRUE,
				score INTEGER DEFAULT 0,
				PRIMARY KEY (user_id, session_id)
			)
		""")

		# Player progress table (SERIAL primary key)
		await conn.execute("""
			CREATE TABLE IF NOT EXISTS player_progress (
				id SERIAL PRIMARY KEY,
				user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
				team_id INTEGER NOT NULL REFERENCES teams(id),
				total_sessions INTEGER DEFAULT 0,
				total_games_played INTEGER DEFAULT 0,
				total_points INTEGER DEFAULT 0,
				current_streak_days INTEGER DEFAULT 0,
				best_streak_days INTEGER DEFAULT 0,
				last_played_at TIMESTAMPTZ,
				subject_progress JSONB DEFAULT '{}',
				game_progress JSONB DEFAULT '{}',
				badges JSONB DEFAULT '[]',
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		""")

		# Session results table (SERIAL primary key)
		await conn.execute("""
			CREATE TABLE IF NOT EXISTS session_results (
				id SERIAL PRIMARY KEY,
				session_id INTEGER NOT NULL REFERENCES sessions(id),
				user_id INTEGER NOT NULL REFERENCES users(id),
				games_played JSONB NOT NULL DEFAULT '[]',
				total_score INTEGER NOT NULL DEFAULT 0,
				questions_correct INTEGER DEFAULT 0,
				questions_attempted INTEGER DEFAULT 0,
				new_badges JSONB DEFAULT '[]',
				completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		""")

		# Migrations: add scholar_code and avatar columns
		await conn.execute("""
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM information_schema.columns
					WHERE table_name = 'users' AND column_name = 'scholar_code'
				) THEN
					ALTER TABLE users ADD COLUMN scholar_code TEXT UNIQUE;
				END IF;
				IF NOT EXISTS (
					SELECT 1 FROM information_schema.columns
					WHERE table_name = 'users' AND column_name = 'avatar'
				) THEN
					ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT 'fox';
				END IF;
			END $$;
		""")
		await conn.execute(
			"CREATE UNIQUE INDEX IF NOT EXISTS idx_users_scholar_code ON users (scholar_code) WHERE scholar_code IS NOT NULL"
		)

		# Backfill: generate scholar codes for existing users without one
		await conn.execute("""
			DO $$
			DECLARE
				r RECORD;
				animals TEXT[] := ARRAY['FOX','OWL','DOLPHIN','LION','PANDA','BUTTERFLY','TURTLE','EAGLE','OCTOPUS','PARROT','WOLF','SHARK','BEE','UNICORN','FROG','PENGUIN','LIZARD','KOALA','SEAL','TIGER'];
				code TEXT;
				tries INT;
			BEGIN
				FOR r IN SELECT id FROM users WHERE scholar_code IS NULL
				LOOP
					tries := 0;
					LOOP
						code := animals[1 + floor(random() * 20)::int] || '-' || lpad(floor(random() * 10000)::text, 4, '0');
						BEGIN
							UPDATE users SET scholar_code = code WHERE id = r.id;
							EXIT;
						EXCEPTION WHEN unique_violation THEN
							tries := tries + 1;
							IF tries > 10 THEN
								RAISE EXCEPTION 'Could not generate unique scholar code for user %', r.id;
							END IF;
						END;
					END LOOP;
				END LOOP;
			END $$;
		""")

		# Create indexes
		await conn.execute(
			"CREATE INDEX IF NOT EXISTS idx_users_team ON users (team_id)"
		)
		await conn.execute(
			"CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions (team_id)"
		)
		await conn.execute(
			"CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status)"
		)
		await conn.execute(
			"CREATE INDEX IF NOT EXISTS idx_progress_user ON player_progress (user_id)"
		)
		await conn.execute(
			"CREATE INDEX IF NOT EXISTS idx_teams_join_code ON teams (join_code)"
		)


def record_to_dict(record: asyncpg.Record | None) -> dict[str, Any] | None:
	"""Convert a database record to a dictionary."""
	if record is None:
		return None
	return dict(record)


def parse_json_field(value: str | dict | list | None, default: Any = None) -> Any:
	"""Parse a JSON field from the database."""
	if value is None:
		return default
	if isinstance(value, (dict, list)):
		return value  # asyncpg already parses JSONB
	try:
		return json.loads(value)
	except (json.JSONDecodeError, TypeError):
		return default


def serialize_json_field(value: Any) -> str:
	"""Serialize a value to JSON for database storage."""
	return json.dumps(value, default=str)
