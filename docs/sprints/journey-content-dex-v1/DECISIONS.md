# DECISIONS.md
# Sprint: journey-content-dex-v1
# Date: 2024-12-28

## Architecture Decision Records

---

### ADR-001: Schema-Driven Display Configuration

**Status:** Accepted

**Context:**  
The original bug fix proposal hardcoded display logic (progress bar colors, button labels) in React components. This violates Trellis Pillar I (Declarative Sovereignty).

**Decision:**  
Add `display?: JourneyDisplayConfig` to the Journey schema. The JourneyContent component reads this config and renders accordingly. Defaults are defined in code but can be overridden in schema.

**Rationale:**
- Non-technical users can change labels by editing JSON
- Different journeys can have different visual treatments
- Follows established DEX pattern

**Consequences:**
- Schema grows slightly larger
- Component has more conditional logic
- Better long-term maintainability

**Alternatives Rejected:**
- Hardcoded display (violates Pillar I)
- CSS-only theming (can't change labels or structure)
- Separate "journey templates" system (over-engineering for MVP)

---

### ADR-002: Default Actions vs. Explicit Actions

**Status:** Accepted

**Context:**  
Most waypoints need the same two actions: "Explore This" and "Next/Complete". But some waypoints might need custom actions (e.g., branching paths, external links).

**Decision:**  
If `waypoint.actions` is undefined, render default actions. If defined, render ONLY the specified actions.

**Rationale:**
- 95% of waypoints use defaults → less config needed
- Custom waypoints have full control
- Clear mental model: undefined = defaults, defined = explicit

**Consequences:**
- Existing journey definitions work without modification
- Adding custom actions is opt-in
- Can't "extend" defaults, only replace

**Alternatives Rejected:**
- Always require explicit actions (too verbose)
- Merge custom actions with defaults (confusing precedence)
- Action "plugins" system (over-engineering)

---

### ADR-003: Provenance Capture Point

**Status:** Accepted

**Context:**  
Per Pillar III, every insight must maintain attribution. When a user explores a waypoint, we need to capture which journey/waypoint triggered it.

**Decision:**  
Capture provenance at the action handler level, not in the component. JourneyContent builds the provenance object and passes it to `onAction()`. Terminal.tsx attaches it to the chat message.

**Rationale:**
- Single responsibility: component builds provenance, parent handles it
- Provenance structure is consistent
- Easy to test

**Consequences:**
- Provenance flows through callback chain
- Terminal.tsx needs to handle provenance in handleSend
- Chat messages need to accept optional provenance

**Alternatives Rejected:**
- Component sends chat directly (violates separation)
- Global provenance context (hidden dependencies)
- Provenance middleware (complex)

---

### ADR-004: Action Type Enum

**Status:** Accepted

**Context:**  
Actions need identifiable types so the handler knows what to do. Options: string union, enum, or interface hierarchy.

**Decision:**  
Use TypeScript string union: `'explore' | 'advance' | 'complete' | 'branch' | 'custom'`

**Rationale:**
- JSON-serializable (important for schema)
- TypeScript enforces exhaustive checking
- Simple to extend

**Consequences:**
- Handler needs switch statement
- Unknown action types need fallback handling
- Type safety at compile time

**Alternatives Rejected:**
- Numeric enum (magic numbers in JSON)
- Class hierarchy (over-engineering)
- Callback-based actions (can't serialize)

---

### ADR-005: Component File Location

**Status:** Accepted

**Context:**  
Where should JourneyContent live? Options: Terminal/ folder, core/ folder, shared components.

**Decision:**  
`components/Terminal/JourneyContent.tsx`

**Rationale:**
- Only used by Terminal
- Follows existing pattern (JourneyCard is there)
- Easy to find

**Consequences:**
- Tightly coupled to Terminal
- If needed elsewhere, would need to move

**Alternatives Rejected:**
- src/core/components (nothing else is there)
- Shared components folder (premature abstraction)

---

### ADR-006: Progress Bar Implementation

**Status:** Accepted

**Context:**  
Progress can be shown as: bar, dots, fraction, percentage, or nothing.

**Decision:**  
Default to progress bar with configurable color. Show waypoint count as text ("2 of 5"). Both can be hidden via schema.

**Rationale:**
- Bar gives visual feedback
- Count gives precise information
- Both are optional for minimalist journeys

**Consequences:**
- Two config options to control visibility
- Color is limited to preset options (for consistent theming)

**Alternatives Rejected:**
- Arbitrary CSS color (too flexible, can break design)
- Only percentage (less intuitive)
- Animated progress (scope creep)

---

### ADR-007: Handling Final Waypoint

**Status:** Accepted

**Context:**  
The last waypoint needs different behavior: "Complete" instead of "Next", and trigger completion flow.

**Decision:**  
Detection is automatic: `journeyProgress >= journeyTotal - 1`. Default actions change to "Complete Journey". Handler calls `completeJourney()` and triggers completion modal.

**Rationale:**
- No extra config needed per journey
- Consistent completion experience
- Explicit action type ("complete") for clarity

**Consequences:**
- Can't have journeys that loop forever (by design)
- Completion is always explicit user action

**Alternatives Rejected:**
- Auto-complete after last explore (user might not be done)
- Separate completion waypoint (redundant)
- Never-ending journeys (against design philosophy)

---

### ADR-008: Backward Compatibility with JourneyCard

**Status:** Accepted

**Context:**  
The old `JourneyCard` component exists and uses `Card[]` from NarrativeEngine. Some journeys might still use this system.

**Decision:**  
Keep both systems. JourneyContent renders when `isJourneyActive` (XState). JourneyCard renders when `currentThread.length > 0` (NarrativeEngine). They're mutually exclusive states.

**Rationale:**
- Non-breaking change
- Gradual migration possible
- Clear separation of concerns

**Consequences:**
- Two code paths for journeys
- Future sprint should deprecate JourneyCard
- Need to document which system each journey uses

**Alternatives Rejected:**
- Force migrate all journeys (risky)
- Unified adapter component (adds complexity)

---

## Decisions Summary

| ADR | Decision | Pillar |
|-----|----------|--------|
| 001 | Schema-driven display | I |
| 002 | Optional explicit actions | I |
| 003 | Provenance via callbacks | III |
| 004 | String union for action types | - |
| 005 | Component in Terminal/ folder | - |
| 006 | Progress bar + count, configurable | I |
| 007 | Auto-detect final waypoint | - |
| 008 | Coexist with old JourneyCard | - |
