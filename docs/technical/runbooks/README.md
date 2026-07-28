# Runbooks

## Local development

**Prerequisites:** Python 3.10+, Node.js 18+, pnpm, uv, PostgreSQL, Soketi.

```bash
# Backend
uv sync
cp config/local/.env.example .env
# Edit .env: DATABASE_URL, PUSHER_* vars
uv run uvicorn games.api.app:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev   # http://localhost:3000
```

Backend interactive docs: http://localhost:8000/docs

---

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | (Azure PG URL) | asyncpg-compatible connection string |
| `SECRET_KEY` | `change-me` | Reserved for future signing use |
| `PUSHER_APP_ID` | `wsc-scholar-games` | Must match Soketi config |
| `PUSHER_KEY` | `wsc-games-key` | |
| `PUSHER_SECRET` | `wsc-games-secret` | |
| `PUSHER_HOST` | `172.236.30.103` | Soketi server IP |
| `PUSHER_PORT` | `6001` | |
| `PUSHER_SSL` | `false` | Set `true` when behind TLS termination |
| `DEBUG` | `false` | |

Frontend (`NEXT_PUBLIC_*` exposed to browser):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_PUSHER_KEY` | Soketi app key |
| `NEXT_PUBLIC_PUSHER_HOST` | Soketi host |
| `NEXT_PUBLIC_PUSHER_PORT` | Soketi port |
| `ANTHROPIC_API_KEY` | Server-side only — never `NEXT_PUBLIC_` |

---

## Running tests

```bash
uv run pytest -vxs tests/ci
```

Tests in `tests/ci/` require a live database. No mocks except LLM calls.

---

## Deploy to production

Scripts under `scripts/deploy/production/`.

```bash
# 1. Build frontend
cd frontend && pnpm build
# Verify BUILD_ID exists — never gate deploy on `build | tail` (masks failures)

# 2. Rsync build to server
rsync -avz frontend/.next/ user@host:/app/frontend/.next/

# 3. Restart backend
ssh user@host 'systemctl restart games-api'

# 4. Health check
curl https://llocal.com/health
```

---

## Database schema changes

No migration framework is wired up.

1. Connect to the database directly
2. Apply SQL manually
3. Document the change in `docs/project/changelog/CHANGELOG.md`

---

## Soketi / real-time not working

1. Confirm Soketi is running on `172.236.30.103:6001`
2. Verify `PUSHER_HOST` / `PUSHER_PORT` in backend `.env`
3. Verify `NEXT_PUBLIC_PUSHER_HOST` / `NEXT_PUBLIC_PUSHER_PORT` in frontend env
4. Test channel auth: `POST /api/pusher/auth` with a valid `X-User-Id` header
5. Check Soketi logs for auth failures or SSL/TLS mismatches (`PUSHER_SSL`)

---

## Adding a new game

1. Add a `GameType` enum value in `src/games/models/game.py`
2. Add a `GameDefinition` entry to `GAME_DEFINITIONS` (category, min/max players, time limit)
3. Create `frontend/components/games/MyGame.tsx`
4. Export it from `frontend/components/games/index.ts`
5. Wire it into the game renderer in `frontend/app/play/[sessionId]/page.tsx`
6. If the game needs AI, add a route under `frontend/app/api/`

---

## Adding questions

Edit the relevant JSON file under `src/games/data/questions/`. Schema:

```json
{
  "id": "sci-096",
  "text": "What is the powerhouse of the cell?",
  "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
  "correct_index": 1,
  "difficulty": "easy",
  "explanation": "Mitochondria produce ATP through cellular respiration.",
  "time_limit": 30
}
```

No restart needed — questions are loaded from disk on each request.
