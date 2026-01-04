# Architectural Decision Records — hybrid-search-toggle-v1

## ADR-001: Toggle Location in Header

### Status
Accepted

### Context
Need to add a UI toggle for hybrid search. Options for placement include:
- In header (visible always)
- In settings panel (hidden until accessed)
- In command console (contextual)

### Options Considered
1. **Header placement** — Always visible, easy access
2. **Settings panel** — Hidden complexity, but requires navigation
3. **Command console dropdown** — Contextual but discoverable

### Decision
Place toggle in header, between stage badge and lens/journey pills.

### Rationale
- Matches Pattern 9 (Module Shell) — header has contextual features slot
- Search mode is a per-session preference, should be visible
- Follows existing header layout patterns (pills, badges)

### Consequences

**Positive:**
- Immediately discoverable
- No additional navigation required
- Visual feedback on current search mode

**Negative:**
- Adds visual complexity to header
- Users unfamiliar with RAG may be confused

**Neutral:**
- Toggle size kept small to minimize impact

---

## ADR-002: State Management Approach

### Status
Accepted

### Context
Need to manage toggle state across renders and persist across sessions.

### Options Considered
1. **XState (Engagement Machine)** — Full state machine integration
2. **useState + localStorage** — Simple React state with persistence
3. **React Context** — Shared state provider

### Decision
Use useState + localStorage in ExploreShell, pass props down.

### Rationale
- Feature flag doesn't need state machine complexity
- Direct prop drilling is sufficient for 2-level hierarchy
- localStorage provides persistence without backend
- Matches existing localStorage patterns (grove-session-established)

### Consequences

**Positive:**
- Simple implementation
- No new dependencies
- Easy to understand and debug

**Negative:**
- Not integrated with engagement telemetry (acceptable for feature flag)

**Neutral:**
- Could upgrade to XState later if needed

---

## ADR-003: Testing Strategy

### Status
Accepted

### Context
Need to verify toggle functionality without over-testing implementation.

### Decision
E2E tests only, focused on:
1. Toggle visibility
2. Click behavior (state change)
3. Persistence (localStorage)

### Test Categories
| Category | Tests | Purpose |
|----------|-------|---------|
| E2E | 3 | Behavior verification |

### Assertions Used
- `toBeVisible()` — Toggle renders
- `toHaveAttribute()` — Class indicates state
- `evaluate(localStorage)` — Persistence

### Consequences

**Positive:**
- Tests verify user-visible behavior
- No implementation coupling
- Fast to run

**Negative:**
- No unit test coverage (acceptable for UI toggle)

---

## ADR-004: Toggle Visual Design

### Status
Accepted

### Context
Toggle needs to be visible but not dominant. Must indicate ON/OFF state clearly.

### Decision
Pill-style button with:
- Small dot indicator (colored when ON)
- "RAG" label
- "ON"/"OFF" suffix
- Color change on state (neon-cyan when ON, muted when OFF)
- Tooltip explaining function

### Rationale
- Matches HeaderPill component style
- Clear visual feedback
- Tooltip explains for unfamiliar users
- Does not compete with lens/journey pills

### Consequences

**Positive:**
- Consistent with existing UI patterns
- Clear state indication
- Accessible via tooltip

**Negative:**
- "RAG" may be unfamiliar term to non-technical users
- Could change label to "Search" in future

---

## ADR-005: Default State

### Status
Accepted

### Context
Should hybrid search be ON or OFF by default?

### Options Considered
1. **OFF by default** — Conservative, matches current behavior
2. **ON by default** — Better search quality
3. **Remember last state** — User preference

### Decision
OFF by default on first visit, then remember user preference.

### Rationale
- Maintains current behavior for existing users
- Allows opt-in to new feature
- Once toggled, preference persists

### Consequences

**Positive:**
- No surprise behavior change
- User in control
- Easy A/B testing

**Negative:**
- Users may not discover the feature
- Could add onboarding hint in future
