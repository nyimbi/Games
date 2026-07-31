# Llocal Games

[![CI](https://github.com/nyimbiodero/games/workflows/CI/badge.svg)](https://github.com/nyimbiodero/games/actions)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![uv](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/uv/main/assets/badge/v0.json)](https://github.com/astral-sh/uv)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Learning is retrieval practice.** Llocal Games is an educational platform that turns short, game-shaped drills into a shared mastery record: every game a kid plays feeds one adaptive vault, and every future game — plus a personalized daily warmup — reads from it. Kids build real skills; games stop repeating the ones already learned.

## What this is

Two experiences under one roof.

**Practice** — for kids ages 8–9 (grade 3–4). Seventeen short adaptive games covering the foundations that predict everything else: times tables, fractions, word problems, and vocabulary. Every attempt is scored, spaced, and remembered across games. A morning warmup drills exactly the items yesterday said were shaky.

**Sessions & Games** — for kids ages 10+ training in coach-led teams (originally built for World Scholar's Cup). Twenty-seven multiplayer games — trivia bowls, collaborative writing, debate, academic challenges — running live over WebSockets, with AI-powered feedback on writing and speaking.

Both share the same account, the same design language, and the same underlying philosophy: **skills stick when you retrieve them, in different contexts, over spaced time.**

## Who it's for

- **Kids** — the primary users. Practice is designed for 8–9-year-olds. Session games work from about age 10 upward.
- **Coaches** — run scheduled training sessions for teams of up to five scholars. Own multiple teams, view analytics, track subject mastery.
- **Parents and teachers** — assign practice, watch mastery grow across categories, spot sticky facts before they harden.

You can use just Practice, just Sessions, or both. They don't require each other.

## The philosophy

Five ideas shape every decision in this codebase.

**1. Retrieval, not exposure.** Reading a definition doesn't teach a word. Answering a question about it, in context, from memory does. Every game requires the kid to *produce* an answer under mild pressure.

**2. Cross-game mastery via a shared vault.** A child who nailed `7×8` in Multiplication Ladder should never see it again in Beat-the-Clock Grid tomorrow. Individual game state can't deliver this. One database, one scheduler, one truth per fact — and games become thin UIs over it.

**3. Spaced repetition (SM-2-lite), tuned for kids.** Wrong answers collapse the interval to five minutes. Fast + correct grows both the confidence and the wait. Slow + correct grows the wait but not the confidence. A 30-day cap keeps even "mastered" items resurfacing so they don't decay silently.

**4. Multi-representational encoding.** Fractions are pies *and* bars *and* symbols *and* positions on a number line. A word is "known" only after four correct encounters across two different game modes over at least a week. One-context mastery evaporates. Multi-context mastery sticks.

**5. Small, honest wins.** Games are 3–6 minutes long. No streaks, no lives, no dark-pattern engagement loops. If a kid closes the tab, their mastery data is safe. The reward is watching a real skill grow, visible in the mastery meter that follows them across every game.

## The vision

Most educational apps treat games as flashcards with sound effects. The database underneath is per-app, the mechanics are interchangeable, and each new "game" reinvents progress tracking from scratch.

We're building the opposite. The **vault is the product.** Games are how you fill it. This is why adding a new game here means writing one file — the shared engine handles selection, scheduling, mastery, warmup, offline sync, and analytics for free.

The end state we're aiming at:
- A kid opens the app, taps Warmup, and drills exactly what they got wrong yesterday — regardless of which of the 20 games surfaced it.
- A coach sees not just "score in Story Sorter" but "this student is stuck on subtraction word problems with 'left' as the keyword."
- Adding the 18th game — Rhythm & Rhyme with audio, or a new fraction-operations game — takes a day, not a month, because 90% of the work is already done.
- The same engine expands upward (algebra, essay writing) and downward (grade 1–2 counting) as the audience grows.

## How it works

### The Practice engine

```
   Kid plays game        ─┐
                          │
                          ▼
   /api/vault/*/attempt  ── FactVault (math)
                          ── WordVault (vocabulary)
                          │
                          ▼
   SM-2-lite scheduler → next due_at, ease, status
                          │
                          ▼
   Next game asks         "give me 10 due items"
   Warmup asks            "give me the 5 most sticky"
```

Every practice game is a UI over three primitives:

- `useFactVault({factType})` or `useWordVault()` — pulls the due items, exposes mastery counters.
- `recordAttempt(...)` / `recordEncounter(...)` — fire-and-forget write, offline-queued.
- Catalog endpoint — static pools of facts / words / task sets to sample from.

### The session engine

```
   Coach creates session → status: scheduled
   Coach starts session  → Soketi presence channel opens
   Players subscribe     → presence-session-{id}
   Game events flow      → question, buzzer, answer, score:update
   Coach ends session    → analytics written to player_progress
```

Real-time layer is [Soketi](https://soketi.app/) (Pusher-compatible). AI feedback (question generation, essay evaluation, debate coaching) is Azure OpenAI, called server-side from Next.js API routes.

## What's in the box

### Practice (17 games)

| Category | Games |
|---|---|
| **Times Tables** | Multiplication Ladder · Fact Family Duel · Beat-the-Clock Grid |
| **Fractions** | Pizza Cutter · Fraction Match · Fraction Race |
| **Word Problems** | Story Sorter · Missing Number Mystery · Build-a-Problem¹ |
| **Vocabulary** | Cloze Detective · Root Builder · Word Web · Odd One Out · Prefix Power · Wrong Word Hunt · Sentence Spinner¹ · Wordish Charades¹ |

¹ AI-powered — grading or generation via LiteLLM.

Full mechanic breakdown in [`docs/technical/practice-engine.md`](docs/technical/practice-engine.md).

### Sessions (27 games)

Scholars Bowl · Collaborative Writing · Scholars Challenge · Team Debate · Solo & Mixed — see the game catalog inside the app at `/team/games`.

## Stack

Next.js 15 · FastAPI · PostgreSQL (asyncpg) · Soketi (Pusher-compat) · LiteLLM gateway (Ollama + cloud) · Azure OpenAI · Tailwind · Fraunces + DM Sans

## Quick start

**Backend** (Python 3.10+, uv required):

```bash
uv sync
cp config/local/.env.example .env
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
uv run pytest -vxs tests/ci
```

## Environment variables

| Variable | Notes |
|---|---|
| `DATABASE_URL` | asyncpg-compatible PostgreSQL URL |
| `PUSHER_HOST` / `PUSHER_PORT` / `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` | Soketi config |
| `LITELLM_BASE_URL` | Default `https://llm.lindela.io` (practice AI games) |
| `LITELLM_API_KEY` | LiteLLM gateway key |
| `LITELLM_DEFAULT_MODEL` | Default `gemma4:cloud` |
| `AZURE_OPENAI_API_KEY` + endpoint vars | Session-game AI (server-side only) |

See `config/local/.env.example`.

## Project structure

```
games/
├── src/games/
│   ├── api/
│   │   ├── app.py          # FastAPI factory
│   │   └── routes/         # auth, sessions, games, pusher, vault, ai
│   ├── core/               # config, database (asyncpg)
│   ├── models/             # user, session, game, progress, vault
│   └── data/
│       ├── questions/      # 5 session-game question banks (475+ items)
│       └── seed/           # 8 practice catalogs (277 facts, 107 words, ...)
├── frontend/
│   ├── app/
│   │   ├── api/            # 6 Azure OpenAI routes (session games)
│   │   ├── coach/          # dashboard, schedule, analytics
│   │   ├── team/
│   │   │   ├── practice/   # 17 drill games + warmup
│   │   │   ├── games/      # session game catalog
│   │   │   ├── leaderboard, progress, profile
│   │   └── play/[sessionId]/
│   └── components/
│       ├── games/          # 49 session game components
│       ├── practice/       # PracticeGameLayout + shared drill widgets
│       └── ui/
├── tests/ci/
├── infra/docker/
└── scripts/deploy/
```

## Developer docs

- [Architecture](docs/technical/architecture/README.md) — system design, roles, session lifecycle, real-time model
- [Practice Engine](docs/technical/practice-engine.md) — FactVault + WordVault, SM-2-lite, seeds, adding a game
- [API Reference](docs/technical/api/README.md) — all endpoints + Pusher events
- [Design Decisions](docs/technical/design_decisions/README.md) — ADRs (auth, Soketi, AI placement, vault schema)
- [Runbooks](docs/technical/runbooks/README.md) — local dev, deploy, adding games/questions/seeds, troubleshooting

## License

MIT
