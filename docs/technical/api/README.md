# API Reference

Base URL: `http://localhost:8000` (dev) · `https://llocal.com` (prod)

All requests pass `X-User-Id: <int>` for authentication. Obtain this ID from `POST /api/auth/join` or `POST /api/auth/recover`. Interactive docs at `/docs` (Swagger) and `/redoc`.

---

## Auth `/api/auth`

### `POST /api/auth/join`
Create a new user account.

**Body:** `{ "name": "Alice", "role": "player" }`  
`role`: `player` | `coach`

**Response:** `{ "user": { "id": 42, "name": "Alice", "role": "player", "scholar_code": "WSC-XXXX", "team_id": null } }`

Store the returned `id` — pass it as `X-User-Id` on all subsequent requests.

---

### `POST /api/auth/recover`
Recover identity using a scholar code.

**Body:** `{ "scholar_code": "WSC-XXXX" }`

---

### `GET /api/auth/me`
Get current user's profile. **Headers:** `X-User-Id: 42`

---

### `POST /api/auth/team`
Create a team (coach only). Coaches may own multiple teams.

**Body:** `{ "name": "Team Alpha", "join_code": "ALPHA2024" }`  
`join_code` is optional; auto-generated if omitted.

---

### `POST /api/auth/team/join`
Join a team using its join code (players only). Max 5 scholars per team.

**Body:** `{ "join_code": "ALPHA2024" }`

---

### `GET /api/auth/team`
Get current user's team and all members.

---

### `GET /api/auth/teams`
List all teams owned by the coach (coach only).

---

### `POST /api/auth/team/switch`
Switch a coach's active team. **Body:** `{ "team_id": 3 }`

---

### `GET /api/auth/user/{user_id}`
Get a user by ID (no auth required).

---

## Sessions `/api/sessions`

### `POST /api/sessions`
Create a session (coach only).

**Body:**
```json
{
  "name": "Tuesday Practice",
  "mode": "team_practice",
  "games": ["buzzer_battle", "flashcard_frenzy"],
  "scheduled_at": "2026-07-29T14:00:00Z"
}
```
`mode`: `team_practice` | `solo`  
`games`: array of game type slugs — see `GET /api/games/definitions`

---

### `GET /api/sessions`
List sessions for current user's team.

---

### `GET /api/sessions/{session_id}`
Session details + player count.

---

### `POST /api/sessions/{session_id}/start`
Start session. Fires `session:start` on `presence-session-{id}`.

---

### `POST /api/sessions/{session_id}/end`
End session. Fires `session:end`.

---

### `GET /api/sessions/{session_id}/games`
Games scheduled for a session.

---

## Games `/api/games`

### `GET /api/games/definitions`
All game definitions grouped by category.

```json
{ "categories": { "scholars_bowl": [...], ... }, "total_games": 16 }
```

---

### `GET /api/games/category/{category}`
`category`: `scholars_bowl` | `collaborative_writing` | `scholars_challenge` | `team_debate`

---

### `GET /api/games/definition/{game_type}`
Single game definition (name, description, min/max players, time limit, etc.).

---

### `GET /api/games/questions`
Random questions for a subject.

| Param | Required | Values |
|---|---|---|
| `subject` | yes | `science` `literature` `arts` `social_studies` `special_area` |
| `difficulty` | no | `easy` `medium` `hard` |
| `count` | no (default 10) | 1–1000 |

---

### `GET /api/games/questions/mixed`
Random questions from all subjects. Params: `difficulty` (optional), `count` (default 10).

---

### `GET /api/games/subjects`
All subjects with question counts.

---

## Pusher `/api/pusher`

### `POST /api/pusher/auth`
Authenticate a Pusher channel subscription.

**Body:** `{ "channel_name": "presence-session-42", "socket_id": "..." }`  
**Headers:** `X-User-Id: <id>`

---

## Vault `/api/vault` (Practice)

The vault backs the 17 grade 3–4 practice games. Every attempt POSTs here; games query due/wrong-recent to build sessions. All endpoints require `X-User-Id` except `/catalog/*` (same pool for every user).

### Facts (math)

#### `POST /api/vault/fact/attempt`
Record an attempt, upsert the vault row, return the updated row. Handles SM-2-lite scheduling and status transitions.

**Body:**
```json
{
  "fact_id": "mult_7x8",
  "fact_type": "mult",
  "operands": [7, 8],
  "answer": "56",
  "game_id": "mult_ladder",
  "correct": true,
  "ms": 2400
}
```
`fact_type` ∈ `mult | div | add | sub | frac_eq | frac_cmp`

#### `GET /api/vault/fact/due?limit=20&fact_type=mult`
Due items ordered sticky first, then earliest-due learning. Returns `{items, sticky_count, learning_count, mastered_count}`.

#### `GET /api/vault/fact/wrong-recent?limit=10`
Facts missed in the last 7 days, most-missed first. Powers Wrong Answer Journal.

### Words (vocabulary)

#### `POST /api/vault/word/encounter`
**Body:**
```json
{ "word": "determined", "pos": "adj", "game_id": "cloze_detective", "mode": "cloze", "correct": true, "ms": 3200 }
```
`mode` ∈ `cloze | morph | network | prod | sound | defn`

#### `GET /api/vault/word/due?limit=20`
Due words, sticky first. Sticky = ≥3 encounters with <60% accuracy.

### Aggregates

#### `GET /api/vault/stats`
Landing-page counters: `{facts_total, facts_mastered, facts_sticky, facts_learning, words_seen, words_mastered, words_sticky, last_practice_at}`.

#### `GET /api/vault/warmup?facts=5&words=5`
Personalized digest — most-in-need items across both vaults. Returns `{facts: [...], words: [...]}`.

### Catalogs (no per-user data — same pool for everyone)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/vault/catalog/facts?fact_type=&tier=` | 277 math facts |
| `GET` | `/api/vault/catalog/words?level=&pos=&has_morphology=` | 107 tier-2 words |
| `GET` | `/api/vault/catalog/word/{word}` | Full metadata for one word |
| `GET` | `/api/vault/catalog/odd-one-out?level=` | 30 curated 4-word sets |
| `GET` | `/api/vault/catalog/prefix-power?level=` | 30 fill-a-prefix sentences |
| `GET` | `/api/vault/catalog/wrong-word-hunt?level=` | 30 swapped-word passages |
| `GET` | `/api/vault/catalog/word-problems?level=&operation=` | 30 word problems |
| `GET` | `/api/vault/catalog/missing-number?level=` | 30 detective missing-number problems |

Full engine detail in [Practice Engine](../practice-engine.md).

---

## AI `/api/ai` (Practice)

Proxies to LiteLLM at `https://llm.lindela.io` (OpenAI-compatible, `sk-pjs-litellm-master-key`). Default model: `gemma4:cloud`.

### `POST /api/ai/grade-sentence`
Sentence Spinner — grade a kid's sentence for correct target-word usage.

**Body:** `{ "sentence": "...", "target_word": "determined", "required_elements": ["a chef", "at the beach"] }`
**Response:** `{ "used_correctly": bool, "included_all": bool, "feedback": "...", "score": 0-10 }`

### `POST /api/ai/grade-story-problem`
Build-a-Problem — grade a story that should represent a given equation.

**Body:** `{ "kid_story": "...", "equation": "24 ÷ 6 = 4" }`
**Response:** `{ "matches_equation": bool, "makes_sense": bool, "feedback": "...", "score": 0-10, "example_story": "..." }`

### `POST /api/ai/generate-word-clues`
Wordish Charades — 3 progressively easier clues for a word.

**Body:** `{ "word": "determined", "pos": "adj", "definition": "..." }`
**Response:** `{ "word": "determined", "clues": ["hardest", "medium", "easiest"] }`

---

## Health

### `GET /health`
`{ "status": "healthy", "app": "Llocal Games" }` — no auth required.

---

## Real-time Events

Subscribe to `presence-session-{id}` via Pusher JS to receive:

| Event | Key payload fields |
|---|---|
| `session:start` | `session_id` |
| `session:end` | `session_id` |
| `player:joined` | `user_id`, `username` |
| `player:left` | `user_id` |
| `game:start` | `game_type`, `state` |
| `game:end` | `results` |
| `question` | `question`, `round` |
| `buzzer` | `user_id`, `username`, `buzzer_time` |
| `buzzer:reset` | `round` |
| `score:update` | `scores: { user_id: points }` |
| `timer:start` | `duration`, `start_time` |
| `timer:stop` | — |
| `writing:update` | `user_id`, `content`, `section` |
| `turn:change` | `current_player_id`, `current_player_name` |
| `state:sync` | `state` |
