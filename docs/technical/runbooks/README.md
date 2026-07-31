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
| `LITELLM_BASE_URL` | `https://llm.lindela.io` | LiteLLM gateway for practice AI games |
| `LITELLM_API_KEY` | `sk-pjs-litellm-master-key` | Gateway master key |
| `LITELLM_DEFAULT_MODEL` | `gemma4:cloud` | Only cloud model currently returning content on the gateway |
| `DEBUG` | `false` | |

Frontend (`NEXT_PUBLIC_*` exposed to browser):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_PUSHER_KEY` | Soketi app key |
| `NEXT_PUBLIC_PUSHER_HOST` | Soketi host |
| `NEXT_PUBLIC_PUSHER_PORT` | Soketi port |
| `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_DEPLOYMENT_NAME` / `AZURE_OPENAI_API_VERSION` | Session-game AI routes. Server-side only — never `NEXT_PUBLIC_` |

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

---

## Adding a practice game

Practice games are single-file React components under `frontend/app/team/practice/<category>/<slug>/page.tsx`. The shared FactVault / WordVault engine handles all mastery tracking — the game only needs to load a pool, present questions, and record attempts.

1. **Pick a category** and route. Existing: `math`, `fractions`, `word-problems`, `vocabulary`.
2. **Decide the vault:**
   - Math or word problem → `useFactVault({factType})` + `recordAttempt(...)`
   - Vocabulary → `useWordVault()` + `recordEncounter(...)`
3. **Pick a source pool.** Reuse an existing seed catalog if possible:

   | Catalog endpoint | Purpose |
   |---|---|
   | `/api/vault/catalog/facts` | Math facts (277 items) |
   | `/api/vault/catalog/words` | Tier-2 vocab (107 items) |
   | `/api/vault/catalog/odd-one-out` | 4-word semantic sets |
   | `/api/vault/catalog/prefix-power` | Fill-a-prefix sentences |
   | `/api/vault/catalog/wrong-word-hunt` | Swapped-word passages |
   | `/api/vault/catalog/word-problems` | Word problems by operation |
   | `/api/vault/catalog/missing-number` | Inverse-thinking mysteries |

   If none fits, add a new seed:
   - Write `src/games/data/seed/<slug>.json`
   - Add a `_load_<slug>` helper in `src/games/api/routes/vault.py`
   - Add a new `GET /api/vault/catalog/<slug>` endpoint
   - Add a matching TS type + `vaultApi.get<Slug>` method in `frontend/lib/api/vault.ts`

4. **Follow the game contract:**
   - `'use client'` **must be the first line** — no imports before it.
   - Use `PracticeGameLayout` from `@/components/practice` for the shell (title, back button, mastery meter, right-side badge).
   - Use `PracticeAnswerButton` for 4-option pickers.
   - Record every attempt/encounter **fire-and-forget** (`void recordAttempt(...)`) — never await, don't block UI on network.
   - Phases: `loading → playing → reveal → done` (adapt as needed).
   - No hardcoded fallback pools — if the API fails, show an error state with a Back button. The vault is the single source of truth.
   - 2-space indent for TSX. Use palette `ink-*`, `cream-*`, `gold-*`, `sage-*`, `coral-*` only (no `lavender-*` — it's not in the config).

5. **Wire into the category listing** (e.g. add a `{slug, title, subtitle, Icon, minutes}` entry to the `GAMES` array in `app/team/practice/math/page.tsx`).

6. **Bump the count on the main landing** at `app/team/practice/page.tsx` (`gameCount` for the category tile).

7. **Verify:** `cd frontend && pnpm tsc --noEmit` must exit clean.

Every existing game in `app/team/practice/*/*/page.tsx` follows this pattern — copy the closest one as a starting point. See [Practice Engine](../practice-engine.md) for engine internals.

---

## Adding an AI-powered practice game

Same as above plus:

1. Add a new endpoint in `src/games/api/routes/ai.py` following the pattern of `grade-sentence`. Use the `_chat()` helper which proxies to LiteLLM. Set `temperature=0.3` for grading, `0.6` for generation.
2. Add a matching type + method in `frontend/lib/api/ai.ts`.
3. In the game, always show a loading state during the AI call (2–8s typical). Never let a submit button be double-clicked.
4. Handle errors gracefully — show a retry banner, don't crash.

For Wordish-Charades-style pre-generation (many parallel calls at load time), use `Promise.all` with at most 5 concurrent calls. LiteLLM's default rate limits are generous, but the current gateway model (`gemma4:cloud`) can rate-limit under load.

---

## LiteLLM gateway model choice

The default `LITELLM_DEFAULT_MODEL=gemma4:cloud` is set because **it's currently the only cloud alias that returns visible content through the gateway**. Other models in the catalog (`deepseek`, `deepseek-v4-flash:cloud`, `glm-5.2:cloud`, `minimax-m2.7:cloud`, `ollama-cloud`) consume tokens but return empty strings — a proxy config issue outside the app.

Diagnostics:
```bash
curl -sS https://llm.lindela.io/v1/models -H "Authorization: Bearer $LITELLM_API_KEY" \
  | python3 -c "import sys,json; print('\n'.join(sorted(m['id'] for m in json.load(sys.stdin)['data'])))"

curl -sS -X POST https://llm.lindela.io/v1/chat/completions \
  -H "Authorization: Bearer $LITELLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"gemma4:cloud","messages":[{"role":"user","content":"Say hi"}],"max_tokens":50}'
```

If a different model starts returning content, override `LITELLM_DEFAULT_MODEL` in the environment — no code change needed.
