# Design Decisions

## ADR-001: Passwordless auth via X-User-Id header

**Decision:** No passwords. Users register with a name and role, get back a numeric ID, and pass it as `X-User-Id` on every request.

**Rationale:** Target audience is school-age students in coached sessions. Eliminating passwords removes friction (no forgot-password flow, no email verification) and shrinks the attack surface. Scholar codes serve as the recovery mechanism. Not suitable for contexts requiring strong identity assurance.

**Trade-off:** The API trusts the header without cryptographic verification — appropriate for a local/school-network deployment, not for open internet exposure without a proxy enforcing auth.

---

## ADR-002: Soketi over raw WebSockets

**Decision:** Use Soketi (self-hosted Pusher-compatible server) at `172.236.30.103:6001` for real-time events.

**Rationale:** Presence channels give free membership tracking (who's in a session). The Pusher protocol handles reconnection, heartbeats, and channel auth out of the box. The `pusher` Python library and Pusher JS client are mature. Self-hosted Soketi avoids per-message SaaS costs.

**Trade-off:** Adds a Soketi process to infra. A WebSocket manager (`api/websocket/manager.py`) also exists as a fallback, but Soketi is the primary path.

---

## ADR-003: AI routes in Next.js, not FastAPI

**Decision:** The six AI-powered features are Next.js API routes, not Python backend routes.

**Rationale:** Keeps the Claude API key server-side without exposing it to the browser. Collocates AI logic with the UI components that consume it. Avoids adding an Anthropic SDK dependency to the Python backend. Next.js streaming responses work well for progressive Claude output.

**Trade-off:** AI feature logic is split from the rest of the backend. If the frontend is replaced, these routes need to be ported.

---

## ADR-004: Static JSON question banks

**Decision:** Questions are stored as JSON files under `src/games/data/questions/` (one per subject), loaded at request time.

**Rationale:** Questions are editorial content that changes infrequently. File-based storage makes them easy to edit, review in git, and ship with the app. No migration needed to add or edit questions.

**Trade-off:** No per-question analytics (which questions students get wrong) without a separate tracking layer. Filtering is done in-process rather than via SQL index.

---

## ADR-005: Multi-team coaches

**Decision:** Coaches can own multiple teams, with `active_team_id` tracking the current focus. `POST /api/auth/team/switch` changes context.

**Rationale:** A coach typically manages multiple cohorts (different school years, competition brackets, etc.).

**Trade-off:** Session creation and team-scoped queries check `active_team_id`. A switch call is required before creating sessions for a different team.

---

## ADR-006: Max 5 scholars per team

**Decision:** Hard limit of 5 players per team (`MAX_TEAM_SCHOLARS = 5` in `auth.py`).

**Rationale:** Mirrors the WSC competition format (3 scholars compete, squads include reserves). Keeps teams small by default.

**Trade-off:** Enforced at the API layer, not as a DB constraint. Two simultaneous join requests could briefly exceed the limit in a race condition.

---

## ADR-007: asyncpg over SQLAlchemy ORM

**Decision:** Raw asyncpg with `fetchrow` / `execute` instead of SQLAlchemy ORM.

**Rationale:** Query patterns are simple CRUD. asyncpg is faster, avoids ORM N+1 pitfalls, and keeps queries readable during latency-sensitive live game events.

**Trade-off:** No migration framework. Schema changes are manual SQL.
