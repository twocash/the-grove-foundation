# Epic 5: Lens URL Hydration - Architectural Decisions

**Sprint**: active-grove-polish-v2
**Epic**: 5 - URL Lens Parameter Hydration
**Date**: 2024-12-23

---

## ADR-019: Bridge Hook Pattern for SSR Hydration Fix

### Status
ACCEPTED

### Context
The URL lens parameter (`?lens=engineer`) isn't working because NarrativeEngineContext's SSR handling is broken. We need to fix this without modifying the 694-line legacy monolith.

### Decision
Create a separate "bridge hook" (`useLensHydration`) that:
- Reads URL params on client mount
- Uses existing `selectLens()` mutator from NarrativeEngine
- Is explicitly documented as temporary/bridge code
- Will be deprecated when engagement system is refactored

### Alternatives Considered

**Option A: Patch NarrativeEngineContext**
- Add URL param check to existing useEffect (line 315)
- Pros: Single source of truth
- Cons: High risk in 694-line file, increases technical debt
- REJECTED: Too risky for immediate fix

**Option B: Move URL handling to useQuantumInterface**
- Have quantum interface check URL and set lens
- Pros: Keeps logic in "new" code
- Cons: Violates quantum interface's single responsibility (reality resolution)
- REJECTED: Wrong place architecturally

**Option C: Bridge hook (CHOSEN)**
- Isolated, documented, testable
- Uses existing NarrativeEngine mutators
- Clear deprecation path
- Pros: Low risk, establishes pattern, easy rollback
- Cons: Temporary code that must be removed later

### Consequences
- Positive: URL lens works immediately
- Positive: Pattern established for future bridge hooks
- Negative: Another file to track/remove during migration
- Mitigated: Extensive documentation explains why this exists

---

## ADR-020: Validate Lens Against DEFAULT_PERSONAS

### Status
ACCEPTED

### Context
URL parameters can contain anything. Invalid lens IDs would break the experience.

### Decision
Validate `?lens=` parameter against `Object.keys(DEFAULT_PERSONAS)` before accepting.

### Alternatives Considered

**Option A: Accept any string, let downstream handle errors**
- Pros: Simpler code
- Cons: Poor UX (errors deep in render), console noise
- REJECTED: Bad user experience

**Option B: Maintain separate VALID_LENS_IDS array**
- Pros: Explicit list
- Cons: Easy to get out of sync with DEFAULT_PERSONAS
- REJECTED: Maintenance burden

**Option C: Derive from DEFAULT_PERSONAS (CHOSEN)**
- Pros: Single source of truth, always in sync
- Cons: Couples to DEFAULT_PERSONAS structure
- ACCEPTED: Worth the coupling for correctness

### Consequences
- Invalid lens params silently fall back to picker (graceful degradation)
- No console errors for invalid params (only warn)
- If DEFAULT_PERSONAS structure changes, validation adapts automatically

---

## ADR-021: URL Param Overrides localStorage

### Status
ACCEPTED

### Context
If user has `engineer` in localStorage but visits `/?lens=academic`, which wins?

### Decision
URL parameter takes precedence over localStorage.

### Rationale
- URL represents **explicit user intent** (they clicked a link)
- localStorage represents **historical preference** (past selection)
- Marketing/sharing use case requires URL to work reliably
- User can always re-select their preferred lens

### Implementation
```typescript
// In useLensHydration:
if (session.activeLens === lensParam) return;  // Skip if already correct
// Note: We DON'T check if activeLens exists - we override it
```

### Consequences
- Deep links work even for returning users
- User might be surprised if lens changes from their preference
- Acceptable tradeoff for reliable deep linking

---

## ADR-022: useRef for Idempotency Guard

### Status
ACCEPTED

### Context
React StrictMode in development calls effects twice. We need to prevent double lens selection.

### Decision
Use `useRef` to track if hydration has already run.

### Alternatives Considered

**Option A: Rely on session.activeLens check alone**
```typescript
if (session.activeLens) return;
```
- Cons: Race condition if effect fires before session updates
- REJECTED: Not reliable

**Option B: useRef guard (CHOSEN)**
```typescript
const hasHydrated = useRef(false);
if (hasHydrated.current) return;
hasHydrated.current = true;
```
- Pros: Explicit, reliable, survives re-renders
- Cons: Extra ref allocation
- ACCEPTED: Small cost for reliability

**Option C: Empty dependency array is enough**
- Cons: StrictMode calls effects twice in dev
- REJECTED: Would cause console noise and potential double-selection

### Consequences
- Effect runs exactly once per component mount
- Safe in StrictMode
- Clear intent in code

---

## ADR-023: Log Actions to Console

### Status
ACCEPTED

### Context
Debugging URL param issues requires visibility into what's happening.

### Decision
Log all hydration decisions to console with `[LensHydration]` prefix.

### Log Levels

| Scenario | Log Level | Message |
|----------|-----------|---------|
| No URL param | console.log | "No URL lens param" |
| Invalid param | console.warn | "Invalid lens param: X" |
| Already set | console.log | "Lens already set: X" |
| Hydrating | console.log | "Hydrating from URL: X" |

### Consequences
- Easy debugging in production
- Consistent with existing `[ActiveGrove]` logging pattern
- Can be filtered in devtools

---

## ADR-024: No Custom Lens Support in Epic 5

### Status
ACCEPTED

### Context
Custom lenses use `?share=` parameter with compressed data. Should we also support `?lens=custom-123`?

### Decision
Only support archetype lens IDs in this epic. Custom lens URLs already work via `?share=` parameter.

### Rationale
1. `?share=` already handles custom lens sharing (via lensSerializer.ts)
2. Custom lens IDs are session-specific (custom-{timestamp})
3. No stable URL for custom lenses exists
4. Mixing patterns would confuse users and developers

### Consequences
- Clear separation: `?lens=` for archetypes, `?share=` for custom
- No changes needed to custom lens flow
- Documentation should clarify the difference

---

## ADR-025: Hook Returns void, Not State

### Status
ACCEPTED

### Context
Should `useLensHydration()` return anything?

### Decision
Return `void`. The hook is a side-effect-only operation.

### Rationale
1. Callers don't need to know what it did
2. `useQuantumInterface` already returns `activeLens`
3. Returning state would create redundant re-renders
4. Simple, focused hook should have simple interface

### Code Pattern
```typescript
// Good: Clear side-effect hook
useLensHydration();
const { activeLens } = useQuantumInterface();

// Bad: Redundant state
const { wasHydrated, hydatedLens } = useLensHydration();  // Don't do this
const { activeLens } = useQuantumInterface();  // Already have it here
```

### Consequences
- Clean API
- No confusion about where to get lens state
- Consistent with other side-effect hooks (e.g., useEffect patterns)

---

## Decision Summary

| ADR | Decision | Impact |
|-----|----------|--------|
| 019 | Bridge hook pattern | Establishes migration pattern |
| 020 | Validate against DEFAULT_PERSONAS | Safe, maintainable |
| 021 | URL overrides localStorage | Reliable deep links |
| 022 | useRef idempotency guard | StrictMode safe |
| 023 | Console logging | Debuggable |
| 024 | No custom lens support | Clear separation |
| 025 | void return type | Simple API |

---

## Future ADRs (Not This Epic)

- ADR-02X: EngagementContext state machine design
- ADR-02X: Declarative URL parameter configuration
- ADR-02X: NarrativeEngineContext deprecation strategy
