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

## Health

### `GET /health`
`{ "status": "healthy", "app": "WSC Scholar Games" }` — no auth required.

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
