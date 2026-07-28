# WSC Scholar Games

[![CI](https://github.com/nyimbiodero/games/workflows/CI/badge.svg)](https://github.com/nyimbiodero/games/actions)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![uv](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json)](https://github.com/astral-sh/uv)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Real-time multiplayer educational gaming platform for World Scholar's Cup (WSC) training. Coaches run sessions, scholars play 16 academic games across 5 WSC subjects, with AI-powered hints and evaluation.

**Stack:** Next.js 15 + FastAPI + PostgreSQL + Soketi (Pusher-compat) + Claude AI

## Games

| Category | Games |
|---|---|
| **Scholars Bowl** | BuzzerBattle, QuickfireQuiz, EliminationOlympics, ScavengerBowl |
| **Collaborative Writing** | StoryChain, EssaySprint, RoleWriting, ArgumentTennis |
| **Scholars Challenge** | FlashcardFrenzy, PatternPuzzles, ScholarsChallenge, ConnectionQuest |
| **Team Debate** | MiniDebate, RolePlayDebates, ArgumentBuilder, ImpromptuChallenge |

## Questions

475+ questions across 5 subjects (`science`, `literature`, `arts`, `social_studies`, `special_area`), 3 difficulties. Stored as JSON in `src/games/data/questions/` — edit files directly, no restart needed.

## Quick Start

**Backend** (Python 3.10+, uv required):

```bash
uv sync
cp config/local/.env.example .env   # set DATABASE_URL + PUSHER_* vars
uv run uvicorn games.api.app:app --reload --port 8000
# docs at http://localhost:8000/docs
```

**Frontend** (Node 18+, pnpm required):

```bash
cd frontend
pnpm install
pnpm dev   # http://localhost:3000
```

**Tests:**

```bash
uv run pytest -vxs tests/ci   # requires live database
```

**Lint / format:**

```bash
make lint      # ruff check
make format    # ruff format
```

## Project Structure

```
games/
├── src/games/
│   ├── api/
│   │   ├── app.py          # FastAPI app factory
│   │   └── routes/         # auth, sessions, games, pusher
│   ├── core/               # config (pydantic-settings), database (asyncpg)
│   ├── models/             # user, session, game, progress (Pydantic v2)
│   ├── services/
│   │   ├── auth.py         # user/team CRUD
│   │   └── realtime.py     # Soketi/Pusher client + GameSession helper
│   └── data/questions/     # 5 JSON question banks
├── frontend/               # Next.js 15
│   ├── app/
│   │   ├── api/            # 6 Claude AI routes (server-side)
│   │   ├── coach/          # dashboard, schedule, team, analytics
│   │   ├── team/           # player hub: games, leaderboard, progress
│   │   └── play/[sessionId]/
│   └── components/
│       ├── games/          # 27 game components
│       └── ui/             # Card, Badge, Timer, Buzzer, AchievementToast…
├── tests/ci/               # pytest suite
├── infra/docker/           # Dockerfile
└── scripts/deploy/         # local / staging / production
```

## Environment Variables

| Variable | Notes |
|---|---|
| `DATABASE_URL` | asyncpg-compatible PostgreSQL URL |
| `PUSHER_HOST` | Soketi server (default `172.236.30.103`) |
| `PUSHER_PORT` | Default `6001` |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` | Must match Soketi config |
| `ANTHROPIC_API_KEY` | Server-side only, for Next.js AI routes |

See `config/local/.env.example` for the full list.

## Developer Docs

- [Architecture](docs/technical/architecture/README.md) — system design, roles, session lifecycle, real-time model
- [API Reference](docs/technical/api/README.md) — all endpoints + Pusher events
- [Design Decisions](docs/technical/design_decisions/README.md) — ADRs (auth, Soketi, AI placement, question storage, etc.)
- [Runbooks](docs/technical/runbooks/README.md) — local dev, deploy, adding games/questions, troubleshooting

## License

MIT