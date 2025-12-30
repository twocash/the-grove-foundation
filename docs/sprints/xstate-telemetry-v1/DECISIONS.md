# DECISIONS.md — Architecture Decision Records

**Sprint:** xstate-telemetry-v1
**Date:** 2024-12-29

---

## ADR-001: Consolidate Telemetry into XState

### Status
Accepted

### Context
The system currently has two parallel state tracking mechanisms:
1. **XState Engagement Machine** — Primary state for UI reactivity
2. **Engagement Bus** — Singleton with localStorage persistence, telemetry events

The Moment system needs metrics from both, creating coupling and duplication.

### Decision
Consolidate all moment-related telemetry into XState. Add cumulative metrics to XState context with persistence.

### Rationale
- **Single source of truth** — One place to track engagement state
- **Pattern compliance** — PROJECT_PATTERNS.md mandates XState for engagement state
- **Simplification** — Removes need for Engagement Bus in Kinetic Stream

### Alternatives Considered
1. **Keep both systems** — Rejected: perpetuates duplication
2. **Migrate everything to Engagement Bus** — Rejected: Bus is older, less declarative
3. **Create third abstraction layer** — Rejected: adds complexity

### Consequences
- XState context grows (6 new fields)
- Engagement Bus deprecation can begin for Kinetic Stream
- Other surfaces (Foundation consoles) may still use Engagement Bus temporarily

---

## ADR-002: Persist Cumulative Metrics Separately

### Status
Accepted

### Context
XState context is typically ephemeral. Cumulative metrics (journeysCompleted, sessionCount, etc.) must persist across page reloads and sessions.

### Decision
Create a new localStorage key `grove-telemetry-cumulative` with its own persistence functions. Hydrate XState context on provider mount.

### Rationale
- **Isolation** — Cumulative metrics separate from ephemeral session state
- **Backward compatible** — Doesn't change existing storage keys
- **Simple** — Single JSON object, easy to debug

### Alternatives Considered
1. **XState persist middleware** — Rejected: persists too much, complex config
2. **Extend existing storage keys** — Rejected: mixes concerns
3. **IndexedDB** — Rejected: overkill for small data

### Consequences
- New storage key to manage
- Hydration logic needed in context provider
- Must handle missing/corrupt data gracefully

---

## ADR-003: Compute minutesActive On-Demand

### Status
Accepted

### Context
`minutesActive` is needed for moment triggers but changes every minute. Storing in XState context would cause frequent re-renders.

### Decision
Store `sessionStartedAt` timestamp in context. Compute `minutesActive` on-demand when building MomentEvaluationContext.

### Rationale
- **Performance** — Avoid re-renders every minute
- **Accuracy** — Always reflects current time
- **Simplicity** — One stored value, one computation

### Alternatives Considered
1. **Store and update minutesActive** — Rejected: causes re-renders, needs interval
2. **Use Engagement Bus timer** — Rejected: adds Bus dependency back
3. **Update only on interaction** — Rejected: stale during idle periods

### Consequences
- Moment evaluation includes a computation (trivial cost)
- No minute-by-minute telemetry events (acceptable)

---

## ADR-004: Session Detection via Timeout

### Status
Accepted

### Context
Need to know when a user returns after being away (new session) vs. continuing an existing session.

### Decision
Use a 30-minute timeout. If `lastSessionAt` is more than 30 minutes ago, increment `sessionCount` and treat as new session.

### Rationale
- **Industry standard** — 30 minutes is common session timeout
- **Simple** — Single timestamp comparison
- **Matches Engagement Bus behavior** — Easy migration

### Alternatives Considered
1. **Browser visibility API** — Rejected: complex, doesn't cover tab close
2. **beforeunload event** — Rejected: unreliable on mobile
3. **Server-side sessions** — Rejected: no backend for this

### Consequences
- 30-minute threshold is hardcoded (can extract to config later)
- Quick return after closing tab is same session (intended)

---

## ADR-005: Custom Lens Detection by ID Pattern

### Status
Accepted

### Context
Need `hasCustomLens` boolean for moment triggers. Must distinguish custom lenses from built-in lenses.

### Decision
Detect custom lenses by ID pattern: `custom-*` prefix OR UUID format.

### Rationale
- **Convention-based** — Follows existing custom lens creation pattern
- **No schema changes** — Works with current lens data
- **Reliable** — UUIDs are unmistakable

### Alternatives Considered
1. **Add `isCustom` field to lens schema** — Rejected: requires schema migration
2. **Separate custom lens storage** — Rejected: adds complexity
3. **User metadata flag** — Rejected: where would it live?

### Consequences
- Custom lens IDs must follow convention (already do)
- Detection happens on lens selection (negligible cost)

---

## ADR-006: Telemetry Events as Side Effects

### Status
Accepted

### Context
The Engagement Bus emitted telemetry events (`momentShown`, `momentActioned`, `momentDismissed`) that other systems could subscribe to.

### Decision
Convert to XState events that execute side-effect actions (console.log for now). No external subscribers initially.

### Rationale
- **Simplicity** — Logging is sufficient for debugging
- **Extensibility** — Actions can be extended later for analytics
- **Clean migration** — Same events, different dispatch mechanism

### Alternatives Considered
1. **Keep Engagement Bus for telemetry only** — Rejected: defeats consolidation goal
2. **Add analytics service immediately** — Rejected: out of scope
3. **No telemetry events** — Rejected: loses debugging visibility

### Consequences
- Console logs for moment telemetry (development visibility)
- Future sprint can add analytics service subscription
- No real-time dashboard (was never built anyway)

---

## Testing Strategy

### Unit Tests
- `types.ts` changes: Type checking via `npm run typecheck`
- `persistence.ts`: Unit tests for get/set/isNewSession
- `machine.ts`: Verify new events trigger correct actions

### Integration Tests
- Hydration: Mount provider, verify context has persisted values
- Persistence: Trigger events, reload, verify values persist

### E2E Tests
- Complete a journey → `journeysCompleted` increments
- Return after 30+ minutes → `sessionCount` increments
- Moment triggers work with new context values
