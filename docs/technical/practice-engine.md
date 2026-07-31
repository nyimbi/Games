# Practice Engine

The **Practice** section is a set of short adaptive drill games for grade 3–4 (ages 8–9), covering multiplication, division, fractions, word problems, and vocabulary. It lives at `/team/practice/*` in the frontend and is powered by two shared mastery vaults on the backend.

The engine's leverage is not the individual games — it's the **shared adaptive layer** underneath. Every game feeds and reads from the same vault, so mastery of `7×8` learned in Multiplication Ladder retires that fact from Beat-the-Clock Grid, Story Sorter, and the personalized Warmup.

## Contents

- [Why the vault, not per-game state](#why-the-vault-not-per-game-state)
- [FactVault](#factvault-math)
- [WordVault](#wordvault-vocabulary)
- [Spaced repetition (SM-2-lite)](#spaced-repetition-sm-2-lite)
- [Seed catalogs](#seed-catalogs)
- [API surface](#api-surface)
- [Frontend integration](#frontend-integration)
- [AI-powered games](#ai-powered-games)
- [Adding a new practice game](#adding-a-new-practice-game)
- [Warmup: the payoff](#warmup-the-payoff)

---

## Why the vault, not per-game state

A child who nails `7×8` in Times Tables doesn't need to keep seeing it in Fact Family Duel. A child who missed `determined` twice in Cloze Detective needs it in tomorrow's Warmup, not five days later when they next open Sentence Spinner.

Individual game state cannot deliver this. Cross-game mastery requires:

1. A single record per (user, item) that any game can read or update.
2. A spaced-repetition scheduler decoupled from any one game's UX.
3. Encounter logging (not just aggregates) so we can spot patterns — "7×8 missed in 3 different games" is a stronger signal than "7×8 has 40% accuracy."

The vault provides these. Games are thin UIs over it.

---

## FactVault (math)

**Table:** `fact_vault` — one row per `(user_id, fact_id)`.

```sql
CREATE TABLE fact_vault (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fact_id TEXT NOT NULL,           -- "mult_7x8", "div_42÷6", "frac_eq_1/2=2/4"
    fact_type TEXT NOT NULL,         -- mult | div | add | sub | frac_eq | frac_cmp
    operands JSONB NOT NULL,         -- e.g. [7, 8] or ["1/2", "2/4"]
    answer TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    avg_ms INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'learning',   -- learning | sticky | mastered
    ease REAL NOT NULL DEFAULT 2.5,
    interval_hours REAL NOT NULL DEFAULT 0.083, -- 5 minutes
    last_seen_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, fact_id)
);
```

**Companion table:** `fact_attempt` — append-only log of every attempt (needed for Wrong Answer Journal and pattern analysis).

```sql
CREATE TABLE fact_attempt (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fact_id TEXT NOT NULL,
    fact_type TEXT NOT NULL,
    game_id TEXT NOT NULL,           -- which game recorded this
    correct BOOLEAN NOT NULL,
    ms INTEGER NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Status lifecycle

- **`learning`** — default state. Fact appears at its scheduled `due_at`.
- **`sticky`** — 2+ wrong in the most recent 3 attempts. Surfaces regardless of `due_at` (the "stuck pile" comes back to the top).
- **`mastered`** — 4+ consecutive correct AND `avg_ms ≤ 3500`. Retires to long spacing; still resurfaces occasionally.

Transitions happen inside `POST /api/vault/fact/attempt` (`vault.py`) — the query looks at the last 3–7 attempts to decide.

---

## WordVault (vocabulary)

**Table:** `word_vault` — one row per `(user_id, word)`.

```sql
CREATE TABLE word_vault (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    pos TEXT,
    mastery_level INTEGER NOT NULL DEFAULT 0,   -- 0..5
    encounters_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    distinct_games INTEGER NOT NULL DEFAULT 0,
    ease REAL NOT NULL DEFAULT 2.5,
    interval_hours REAL NOT NULL DEFAULT 0.083,
    last_seen_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, word)
);
```

**Companion table:** `word_encounter` — append-only log, one row per interaction. `mode` records how the word was met: `cloze`, `morph`, `network`, `prod`, `sound`, `defn`.

### Mastery gate

The `mastery_level` climbs 0 → 5 based on the number of correct encounters, the number of **distinct modes** used (cross-representational), and time elapsed since the first correct encounter:

| Level | Condition |
|---|---|
| 1 | ≥1 correct |
| 2 | ≥2 correct |
| 3 | ≥3 correct AND ≥2 distinct modes |
| 4 | ≥4 correct AND ≥2 distinct modes |
| 5 | ≥4 correct AND ≥2 distinct modes AND ≥7 days since first correct |

The 7-day + multi-mode gate is deliberate. One-context mastery evaporates in a week; the level-5 "known" bar exists because that's what actually sticks. This is the piece most vocab apps skip.

---

## Spaced repetition (SM-2-lite)

Every attempt updates `(ease, interval_hours)`. The next `due_at` is `now + interval_hours`.

```python
def _next_schedule(prev_ease, prev_interval_h, correct, ms) -> (float, float):
    if not correct:
        return max(1.3, prev_ease - 0.2), 0.083   # 5 minutes
    if ms <= 3000:  # fast + correct
        new_ease = min(3.0, prev_ease + 0.15)
        new_interval = prev_interval_h * new_ease
    else:           # slow + correct
        new_ease = prev_ease
        new_interval = prev_interval_h * (prev_ease * 0.7)
    return new_ease, min(new_interval, 24.0 * 30)   # 30-day cap
```

Rationale:
- **Wrong** collapses interval to 5 min — retest quickly.
- **Fast correct** grows both ease and interval — the fact is genuinely retrievable.
- **Slow correct** grows interval but not ease — kid got it, but with effort; keep pressure on.
- **30-day cap** — even "mastered" facts resurface at least monthly (retention decay hedge).

Full logic in `src/games/api/routes/vault.py`.

---

## Seed catalogs

The vault stores per-user state, but every game needs a **pool** to draw from. Pools are static JSON in `src/games/data/seed/`:

| File | Purpose | Item count |
|---|---|---|
| `facts.json` | Math fact catalog (mult, div, frac_eq, frac_cmp) | 277 |
| `words.json` | Tier-2 vocabulary with morphology, syn/ant, family | 107 |
| `odd_one_out.json` | 4-word sets with the outsider + reason | 30 |
| `prefix_power.json` | Sentences with a missing prefix | 30 |
| `wrong_word_hunt.json` | Passages with one word swapped | 30 |
| `word_problems.json` | Word problems with operation label | 30 |
| `missing_number.json` | Detective-style inverse problems | 30 |

`generate_facts.py` produces `facts.json` deterministically (times tables 2×2..12×12 + division inverses + curated fraction pairs). Word and task JSONs are hand-curated for grade 3–4 quality.

Games call the catalog endpoints (see below) to load a pool, sample from it, and record attempts back to the vault.

---

## API surface

All endpoints under `/api/vault` require `X-User-Id`. Catalogs are public (same pool for every user).

### Fact endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/vault/fact/attempt` | Record attempt, upsert vault row, return updated row |
| `GET` | `/api/vault/fact/due?limit=N&fact_type=mult` | Due items, sticky first, then earliest-due learning |
| `GET` | `/api/vault/fact/wrong-recent?limit=N` | Wrong Answer Journal — facts missed in last 7 days, most-missed first |

### Word endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/vault/word/encounter` | Record encounter, upsert vault row |
| `GET` | `/api/vault/word/due?limit=N` | Due words, sticky first |

### Aggregate

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/vault/stats` | Landing-page counters (mastered, sticky, learning per vault) |
| `GET` | `/api/vault/warmup?facts=5&words=5` | Personalized digest — most-in-need items across both vaults |

### Catalog (no auth needed on data — same for everyone)

| Method | Path |
|---|---|
| `GET` | `/api/vault/catalog/facts?fact_type=&tier=` |
| `GET` | `/api/vault/catalog/words?level=&pos=&has_morphology=` |
| `GET` | `/api/vault/catalog/word/{word}` |
| `GET` | `/api/vault/catalog/odd-one-out?level=` |
| `GET` | `/api/vault/catalog/prefix-power?level=` |
| `GET` | `/api/vault/catalog/wrong-word-hunt?level=` |
| `GET` | `/api/vault/catalog/word-problems?level=&operation=` |
| `GET` | `/api/vault/catalog/missing-number?level=` |

### AI (LiteLLM-backed, gemma4:cloud default)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/ai/grade-sentence` | Sentence Spinner — grade productive word use |
| `POST` | `/api/ai/grade-story-problem` | Build-a-Problem — grade story-to-equation match |
| `POST` | `/api/ai/generate-word-clues` | Wordish Charades — 3 progressive clues for a word |

---

## Frontend integration

The frontend contract is deliberately narrow:

```ts
// One hook per vault:
const { dueItems, catalog, stats, recordAttempt, refreshDue, loadCatalog } =
  useFactVault({ factType: 'mult', limit: 15, autoLoad: true });

const { dueItems, catalog, stats, recordEncounter, refreshDue, loadCatalog } =
  useWordVault({ autoLoad: true });

const { stats } = useVaultStats();           // landing counters
const { digest } = useWarmup({facts:5, words:5}); // personalized digest
```

The client wraps a fetch layer that includes an **offline queue** in `localStorage`: if `recordAttempt` fails (network hiccup mid-game), it buffers the payload and flushes on the next successful call. No lost mastery data on flaky connections.

### Shared UI shell

`components/practice/PracticeGameLayout.tsx` provides:

- Sticky compact header with title, back button, right-side badge.
- **Mastery meter** — segmented bar showing mastered / learning / sticky counts for the game's fact type.
- Mobile-first body with `max-w-2xl` and 56px minimum touch targets.
- `PracticeAnswerButton` — reusable answer button with `idle | correct | wrong | muted` states, 64px minimum height, `active:scale-97` tactile feedback.

Every game uses this shell — visual consistency across the 17 games is not left to individual game authors.

---

## AI-powered games

Three games call the LiteLLM gateway at `https://llm.lindela.io` (OpenAI-compatible):

- **Sentence Spinner** — kid writes a sentence using a target word + 3 spun elements → `POST /api/ai/grade-sentence` returns `{used_correctly, score, feedback}`.
- **Build-a-Problem** — kid writes a story matching an equation → `POST /api/ai/grade-story-problem` returns `{matches_equation, score, feedback, example_story}`.
- **Wordish Charades** — pre-generates 3 progressive clues per word during the loading phase → `POST /api/ai/generate-word-clues`.

### Model choice

Default: `gemma4:cloud` — currently the only cloud model routed through the gateway that returns visible content. Other models in the LiteLLM catalog (`deepseek`, `glm-5.2:cloud`, `minimax-m2.7:cloud`, `deepseek-v4-flash:cloud`, `ollama-cloud`) consume tokens but return empty strings — a gateway/proxy config issue. Override via `LITELLM_DEFAULT_MODEL` env var when a different model works.

### Latency handling

- **Sentence Spinner / Build-a-Problem**: single call at submit time (2–8s). UI shows loading state; button disabled to prevent double-submit.
- **Wordish Charades**: 5 parallel calls during load (`Promise.all`, one retry per word). ~10–20s startup so gameplay is instant.

If the gateway errors, games show a retry banner. No silent degradation.

---

## Adding a new practice game

1. **Pick a category** (or add a new one under `/team/practice/<category>`).
2. **Decide the vault contract**:
   - Math or word problem → `useFactVault({factType})` + `recordAttempt`.
   - Vocabulary → `useWordVault()` + `recordEncounter`.
3. **Pick a source pool**:
   - Existing seed → use one of the `/api/vault/catalog/*` endpoints.
   - New seed → add a JSON file under `src/games/data/seed/`, a `_load_*` helper in `vault.py`, and a new `/catalog/<slug>` endpoint. Then add a matching TS type + `vaultApi` method in `frontend/lib/api/vault.ts`.
4. **Follow the game contract**:
   - `'use client'` first line.
   - Use `PracticeGameLayout` for the shell.
   - Use `PracticeAnswerButton` for 4-option pickers (or reuse the same styling for other layouts).
   - Record every attempt/encounter fire-and-forget (`void recordAttempt(...)`), never await.
   - Phases: `loading → playing → reveal → done` (adapt as needed).
   - No hardcoded fallback pools — if the API fails, show error state and let the kid go back.
5. **Wire the game** in the category listing page (e.g. `app/team/practice/math/page.tsx`).
6. **Verify** with `pnpm tsc --noEmit` from `frontend/`.

Every existing practice game follows this pattern — cross-reference any `frontend/app/team/practice/*/page.tsx` for a working example.

---

## Warmup: the payoff

The `/team/practice/warmup` route is the concrete demonstration of what shared-vault mastery buys. It:

1. Calls `GET /api/vault/warmup?facts=5&words=5`.
2. The endpoint returns the 5 facts and 5 words most in need of retrieval — sticky first, then earliest-due — across every game the kid has played.
3. A short 5-question drill uses these mixed items.

Kid opens Practice → taps Warmup → immediately drills on **exactly the things they got wrong yesterday**, regardless of which game surfaced them. That personalization is only possible because every game funnels attempts to the same vault.
