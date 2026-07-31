# Architecture

## Overview

Llocal Games is a two-mode educational platform: **live multiplayer sessions** for coach-run teams (originally built for World Scholar's Cup training) and **adaptive personal practice** for grade 3–4 kids. It consists of a **Next.js 15 frontend**, a **FastAPI backend**, a **Soketi real-time layer**, and a **LiteLLM AI gateway**.

```
┌────────────────────────────────────────────────────┐
│                Next.js 15 Frontend                 │
│  /coach/*   /team/*   /play/[sessionId]            │
│  /team/practice/*  (17 grade 3–4 drill games)      │
│  /app/api/* (6 Azure OpenAI routes — session games)│
└────────────┬───────────────────────────────────────┘
             │ REST  (X-User-Id header auth)
             ▼
┌────────────────────────────────────────────────────┐
│          FastAPI Backend (Python)                  │
│  /api/auth   /api/sessions   /api/games            │
│  /api/pusher                                       │
│  /api/vault  ── FactVault + WordVault (practice)   │
│  /api/ai     ── LiteLLM proxy (practice AI games)  │
└─────┬────────────┬─────────────────┬───────────────┘
      │            │                 │
      ▼            ▼                 ▼
 PostgreSQL   Soketi (Pusher)   LiteLLM gateway
 (asyncpg)    172.236.30.103    llm.lindela.io
                :6001            (Ollama + cloud)
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

Two separate AI paths — session games and practice games use different providers because the workloads differ (session games have Azure quota; practice games run through the shared LiteLLM gateway on the fleet).

### Session games — Azure OpenAI via Next.js API routes

Six Next.js API routes call Azure OpenAI server-side (key never exposed to browser):

| Route | Purpose |
|---|---|
| `/api/generate-questions` | Generate on-demand practice questions |
| `/api/explain-answer` | Explain why an answer is correct |
| `/api/evaluate-debate` | Score debate arguments |
| `/api/evaluate-speaking` | Score impromptu speaking |
| `/api/debate-hints` | Provide debate coaching hints |
| `/api/argument-tennis` | Generate counter-arguments |

### Practice games — LiteLLM gateway via FastAPI

Three FastAPI routes proxy to LiteLLM at `https://llm.lindela.io` (OpenAI-compatible):

| Route | Purpose |
|---|---|
| `POST /api/ai/grade-sentence` | Sentence Spinner — grade productive vocabulary use |
| `POST /api/ai/grade-story-problem` | Build-a-Problem — grade a story that matches an equation |
| `POST /api/ai/generate-word-clues` | Wordish Charades — 3 progressive clues per word |

Model defaults to `gemma4:cloud` — currently the only cloud alias returning visible content through the gateway. See [Practice Engine](../practice-engine.md#ai-powered-games) for detail.

## Practice Mode

Beyond live sessions, the platform includes a **Practice** section at `/team/practice/*` — 17 short adaptive drill games for grade 3–4 (ages 8–9) across four categories: times tables, fractions, word problems, vocabulary.

Practice differs from sessions architecturally:

| | Sessions | Practice |
|---|---|---|
| **Real-time** | Yes (Soketi presence + events) | No |
| **Multiplayer** | Yes (team-based) | Solo |
| **State** | `sessions`, `player_sessions`, `session_results` | `fact_vault`, `word_vault`, `fact_attempt`, `word_encounter` |
| **AI provider** | Azure OpenAI | LiteLLM (Ollama + cloud) |
| **Difficulty** | Coach-selected per session | Adaptive (SM-2-lite spaced repetition) |
| **Content source** | 5 subject JSONs, 475+ questions | 8 seed catalogs (277 facts, 107 words, ~150 curated tasks) |

The **shared mastery vault** is the engine's core value: every practice game feeds and reads from the same `fact_vault` / `word_vault` tables, so a fact learned in one game retires from every other. Full architecture in [Practice Engine](../practice-engine.md).

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

## Games

### Session games (27, live multiplayer)

| Category | Games |
|---|---|
| **Scholars Bowl** | BuzzerBattle, QuickfireQuiz, EliminationOlympics, ScavengerBowl, TossupBonus, CategoryChallenge, TeamTrivia |
| **Collaborative Writing** | StoryChain, EssaySprint, RoleWriting, ArgumentTennis, ParagraphSwap, ReverseEssay, SubjectSwap |
| **Scholars Challenge** | FlashcardFrenzy, PatternPuzzles, ScholarsChallenge, ConnectionQuest, TimelineRace, FactOrFiction, GraphGuesser |
| **Team Debate** | MiniDebate, RolePlayDebates, ArgumentBuilder, ImpromptuChallenge, DevilsAdvocate, ArgumentArena, AnalogyArena |
| **Solo / Mixed** | BattleMode, ScholarSprint, TreasureHunt, MemoryMosaic, SixDegrees, EvidenceHunt, WrongAnswerJournal, ScholarRead + 10 math one-offs (TimesTableBlitz, MathHangman, FractionFaceOff, PrimePatrol, OperationBuilder, ShapeSherlock, EstimationNation, NumberConnections, SequenceSleuth, DivisibilityDash) |

### Practice games (17, adaptive drill)

| Category | Games |
|---|---|
| **Times Tables** | Multiplication Ladder, Fact Family Duel, Beat-the-Clock Grid |
| **Fractions** | Pizza Cutter, Fraction Match, Fraction Race |
| **Word Problems** | Story Sorter, Missing Number Mystery, Build-a-Problem¹ |
| **Vocabulary** | Cloze Detective, Root Builder, Word Web, Odd One Out, Prefix Power, Wrong Word Hunt, Sentence Spinner¹, Wordish Charades¹ |

¹ AI-powered via LiteLLM.

## Directory Structure

```
games/
├── src/games/              # Python backend
│   ├── api/
│   │   ├── app.py          # FastAPI app factory + lifespan (init_db / close_pool)
│   │   └── routes/         # auth, sessions, games, pusher, vault, ai
│   ├── core/
│   │   ├── config.py       # pydantic-settings (env + LiteLLM defaults)
│   │   └── database.py     # asyncpg pool + init_db (11 tables incl. vaults)
│   ├── models/             # Pydantic v2: user, session, game, progress, vault
│   ├── services/
│   │   ├── auth.py         # user/team CRUD
│   │   └── realtime.py     # Pusher client + GameSession helper
│   └── data/
│       ├── questions/      # 5 JSON question banks (475+ items)
│       └── seed/           # 8 practice catalogs (facts, words, tasks)
├── frontend/               # Next.js 15 (App Router)
│   ├── app/
│   │   ├── api/            # 6 Azure OpenAI routes (session games)
│   │   ├── coach/          # Coach dashboard, schedule, team, analytics
│   │   ├── team/
│   │   │   ├── practice/   # /team/practice + 17 drill games + warmup
│   │   │   ├── games/      # Session game catalog & join
│   │   │   ├── leaderboard, progress, profile
│   │   └── play/[sessionId]/ # Live session
│   ├── components/
│   │   ├── games/          # 49 session-game components
│   │   ├── practice/       # PracticeGameLayout + PracticeAnswerButton
│   │   ├── ui/             # Card, Badge, Timer, Buzzer, AchievementToast…
│   │   └── layout/         # CoachNav, PlayerNav
│   ├── lib/
│   │   ├── api/            # vault.ts, ai.ts, client.ts (session)
│   │   ├── hooks/          # useVault, useAuth, useGameState, useSounds
│   └── types/index.ts
├── tests/ci/               # pytest CI suite
├── infra/docker/           # Dockerfile
└── scripts/deploy/         # local / staging / production deploy scripts
```
