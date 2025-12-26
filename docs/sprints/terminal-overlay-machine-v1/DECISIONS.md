# Architectural Decisions: terminal-overlay-machine-v1

## ADR-001: Discriminated Union over XState

### Context

Terminal overlay state needs a declarative approach. Two options:

1. **Full XState machine** — Define states, events, transitions formally
2. **Discriminated union** — TypeScript type system enforces valid states

### Decision

Use discriminated union (`TerminalOverlay` type).

### Rationale

- **Simplicity:** Overlays are simple state with no complex transitions. XState is designed for complex state graphs with guards, actions, and context.
- **Type Safety:** TypeScript discriminated unions provide exhaustiveness checking without runtime library.
- **Bundle Size:** No additional dependency.
- **Familiarity:** React `useState` + TypeScript is more familiar to contributors than XState.

### Consequences

- ✅ Simpler mental model
- ✅ Smaller bundle
- ✅ TypeScript catches invalid states at compile time
- ⚠️ No built-in transition logging (we add via analytics config)
- ⚠️ If overlays ever need complex transitions, may need to revisit

---

## ADR-002: Registry Pattern for Component Mapping

### Context

Need to map overlay types to components. Options:

1. **Switch statement** — `switch(overlay.type) { case 'lens-picker': return <LensPicker/> }`
2. **Registry object** — `OVERLAY_REGISTRY[overlay.type].component`

### Decision

Use registry object pattern.

### Rationale

- **Declarative Sovereignty:** Config is data, not code. Non-engineers can understand and theoretically modify.
- **Single Location:** All overlay configs in one file.
- **Extensible:** Adding overlays doesn't require touching rendering logic.
- **Metadata:** Can attach `hideInput`, `analytics`, etc. alongside component.

### Consequences

- ✅ Clear separation of what (registry) vs how (renderer)
- ✅ Easy to add new overlays
- ✅ Centralized analytics configuration
- ⚠️ Slight indirection (need to look up registry to see component)

---

## ADR-003: Handler Mapping in Renderer

### Context

Different overlays need different handlers (onBack, onComplete, etc.). Options:

1. **Pass all handlers, let component ignore unused** — Simpler but messy props
2. **Map handlers per overlay type** — More code but cleaner component props

### Decision

Map handlers per overlay type in `getPropsForOverlay()`.

### Rationale

- **Type Safety:** Each overlay gets exactly the props it needs
- **Documentation:** Handler mapping documents what each overlay requires
- **Encapsulation:** Overlay components don't need to know about other overlays' handlers

### Consequences

- ✅ Clean component interfaces
- ✅ TypeScript can validate prop passing
- ⚠️ `getPropsForOverlay` needs update when adding overlays
- ⚠️ Switch statement in renderer (but it's the only one)

---

## ADR-004: Derived Input Visibility

### Context

Input visibility depends on overlay state. Options:

1. **Store as separate boolean** — `showInput: boolean`
2. **Derive from overlay** — `shouldShowInput(overlay)`

### Decision

Derive from overlay state.

### Rationale

- **Single Source of Truth:** Overlay state determines input visibility, not a separate variable
- **No Sync Bugs:** Can't forget to update input visibility when changing overlay
- **Config-Driven:** Registry's `hideInput` field determines behavior

### Consequences

- ✅ No sync bugs possible
- ✅ Behavior controlled by registry config
- ⚠️ Slight computation on each render (negligible)

---

## ADR-005: Remove flowState Entirely

### Context

Current `flowState` enum partially overlaps with overlay state. Options:

1. **Keep flowState, use overlay for visibility** — Two related but different concepts
2. **Remove flowState, overlay is the flow** — Single concept

### Decision

Remove `flowState` and `TerminalFlowState` type.

### Rationale

- **Redundancy:** `flowState: 'selecting'` means same as `overlay: { type: 'lens-picker' }`
- **Confusion Prevention:** Two state variables for same concept causes bugs
- **Simpler Mental Model:** One variable to understand

### Consequences

- ✅ Single source of truth
- ✅ Fewer state variables
- ⚠️ Any code checking `flowState` needs migration
- ⚠️ Need to verify no external consumers depend on flowState

---

## ADR-006: Keep hasShownWelcome Separate

### Context

`hasShownWelcome` tracks whether welcome has been shown in session. Options:

1. **Encode in overlay** — `{ type: 'welcome', shown: true }`
2. **Keep separate** — `hasShownWelcome: boolean`

### Decision

Keep as separate boolean.

### Rationale

- **Different Concern:** `hasShownWelcome` is a session flag, not current visibility
- **Persistence Pattern:** This flag affects initialization logic, not overlay state
- **Clarity:** "Has been shown" is different from "is currently showing"

### Consequences

- ✅ Clear separation of concerns
- ✅ Initialization logic unchanged
- ⚠️ Two welcome-related pieces of state (acceptable given different purposes)

---

## Summary Table

| Decision | Choice | Key Reason |
|----------|--------|------------|
| ADR-001 | Discriminated union | Simplicity over ceremony |
| ADR-002 | Registry pattern | Declarative sovereignty |
| ADR-003 | Handler mapping | Type safety |
| ADR-004 | Derived visibility | Single source of truth |
| ADR-005 | Remove flowState | Eliminate redundancy |
| ADR-006 | Keep hasShownWelcome | Different concern |
