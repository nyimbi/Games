# Architecture

## Overview

WSC Scholar Games is a real-time multiplayer educational platform for World Scholar's Cup preparation. It consists of a **Next.js 15 frontend**, a **FastAPI backend**, and a **Soketi real-time layer**.

```
┌──────────────────────────────────────────┐
│              Next.js 15 Frontend         │
│  /coach/*   /team/*   /play/[sessionId]  │
│  /app/api/* (6 AI routes → Claude)       │
└────────────┬─────────────────────────────┘
             │ REST  (X-User-Id header auth)
             ▼
┌──────────────────────────────────────────┐
│          FastAPI Backend (Python)        │
│  /api/auth   /api/sessions               │
│  /api/games  /api/pusher                 │
└────────────┬──────────┬──────────────────┘
             │          │
             ▼          ▼
      PostgreSQL    Soketi (Pusher-compat)
      (asyncpg)     172.236.30.103:6001
```

## Roles

| Role | Description |
|---|---|
| **Coach** | Creates teams, schedules sessions, views analytics. Can own multiple teams. |
| **Player (Scholar)** | Joins via team code, plays games in sessions. Up to 5 per team. |

## Auth Model

No passwords. All API calls pass `X-User-Id: <int>` header.

- **Join**: `POST /api/auth/join` with name + role → returns numeric user ID, store client-side
- **Recover**: `POST /api/auth/recover` with scholar code → returns user ID (scholars get a unique short code on creation)
- No JWT — the header is trusted; the backend fetches the user record on each request

## Session Lifecycle

```
Coach: POST /api/sessions              → creates session (mode: team_practice | solo)
Coach: POST /api/sessions/{id}/start   → status: active; fires session:start on Soketi
Players subscribe: presence-session-{id} via Pusher JS
Game events: game:start, question, buzzer, answer, score:update, timer:start …
Coach: POST /api/sessions/{id}/end     → status: completed; fires session:end
```

## Real-time (Soketi/Pusher)

Channel naming:
- `presence-session-{session_id}` — all players in a live session (membership tracking built-in)
- `private-user-{user_id}` — direct messages to a specific user

Channel auth: `POST /api/pusher/auth`

The `GameSession` helper class (`src/games/services/realtime.py`) wraps common patterns: `start_game`, `send_question`, `record_buzzer`, `update_scores`, `sync_state`, `change_turn`, etc.

## AI Integration

Six Next.js API routes call Claude server-side (key never exposed to browser):

| Route | Purpose |
|---|---|
| `/api/generate-questions` | Generate practice questions on demand |
| `/api/explain-answer` | Explain why an answer is correct |
| `/api/evaluate-debate` | Score debate arguments |
| `/api/evaluate-speaking` | Score impromptu speaking |
| `/api/debate-hints` | Provide debate coaching hints |
| `/api/argument-tennis` | Generate counter-arguments |

## Question Database

475+ questions stored as JSON under `src/games/data/questions/`:

| File | Subject | ~Count |
|---|---|---|
| `science.json` | Chemistry, physics, biology, astronomy | 95 |
| `literature.json` | Classic/contemporary lit, literary devices | 95 |
| `arts.json` | Visual arts, music, dance, movements | 95 |
| `social_studies.json` | History, geography, politics, philosophy | 95 |
| `special_area.json` | Current events, technology, interdisciplinary | 95 |

Each question: `id`, `text`, `options[]`, `correct_index`, `difficulty` (easy/medium/hard), `explanation`, `time_limit`.

## 16 Games

| Category | Games |
|---|---|
| **Scholars Bowl** | BuzzerBattle, QuickfireQuiz, EliminationOlympics, ScavengerBowl |
| **Collaborative Writing** | StoryChain, EssaySprint, RoleWriting, ArgumentTennis |
| **Scholars Challenge** | FlashcardFrenzy, PatternPuzzles, ScholarsChallenge, ConnectionQuest |
| **Team Debate** | MiniDebate, RolePlayDebates, ArgumentBuilder, ImpromptuChallenge |

## Directory Structure

```
games/
├── src/games/              # Python backend
│   ├── api/
│   │   ├── app.py          # FastAPI app factory + lifespan (init_db / close_pool)
│   │   └── routes/         # auth, sessions, games, pusher
│   ├── core/
│   │   ├── config.py       # pydantic-settings (env vars, lru_cache)
│   │   └── database.py     # asyncpg pool
│   ├── models/             # Pydantic v2: user, session, game, progress
│   ├── services/
│   │   ├── auth.py         # user/team CRUD
│   │   └── realtime.py     # Pusher client + GameSession helper
│   └── data/questions/     # 5 JSON question banks
├── frontend/               # Next.js 15 (App Router)
│   ├── app/
│   │   ├── api/            # 6 Claude AI routes
│   │   ├── coach/          # Coach dashboard, schedule, team, analytics
│   │   ├── team/           # Player hub: games, leaderboard, progress, profile
│   │   └── play/[sessionId]/ # Live game session
│   ├── components/
│   │   ├── games/          # 27 game components
│   │   ├── ui/             # Card, Badge, Timer, Buzzer, AchievementToast…
│   │   └── layout/         # CoachNav, PlayerNav
│   └── types/index.ts      # Shared TS types
├── tests/ci/               # pytest CI suite
├── infra/docker/           # Dockerfile
└── scripts/deploy/         # local / staging / production deploy scripts
```
