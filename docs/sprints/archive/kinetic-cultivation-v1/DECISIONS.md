# Architectural Decision Records — Kinetic Cultivation v1

**Sprint:** `kinetic-cultivation-v1`  
**Date:** 2024-12-29

---

## ADR-001: Sprout Tray vs. Garden Navigation

### Context

When a user creates a Sprout, where does it go? We need immediate feedback that the insight was captured.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. Navigate to Garden** | Full context, rich UI | Interrupts reading flow, jarring |
| **2. Toast notification only** | Non-intrusive | No object permanence, ephemeral |
| **3. Visible Tray** | Object permanence, non-blocking | New component, animation work |

### Decision

**Option 3: Visible Tray**

### Rationale

- **Object permanence:** User sees their insight become a *thing* that lands *somewhere*
- **No navigation interruption:** Stay in reading flow
- **Progressive disclosure:** Tray → Garden is natural expansion
- **Aligns with philosophy:** "Objects not messages" means insights are objects

### Consequences

- New `SproutTray` component required
- Flight animation needed for satisfaction
- Garden view becomes "expanded Tray" in future sprint
- Right-edge positioning preserves vertical reading space

---

## ADR-002: useLayoutEffect for Selection Positioning

### Context

The Magnetic Pill must appear at the selection end. Standard `useEffect` causes a 1-frame flash where the pill appears at (0,0) before jumping to correct position.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. useEffect** | Standard, familiar | 1-frame position flash |
| **2. useLayoutEffect** | Synchronous, no flash | Blocks paint, slightly heavier |
| **3. CSS anchor positioning** | Native, no JS | Poor browser support |

### Decision

**Option 2: useLayoutEffect**

### Rationale

- Runs synchronously before browser paint
- Prevents any visual flash
- Performance cost is negligible for single element
- CSS anchor positioning not ready for production

### Consequences

- Must be careful about expensive calculations in layoutEffect
- Worth the trade-off for polish
- Document pattern for future selection-based UIs

---

## ADR-003: Sprout Schema Extension with Adapter

### Context

Existing Sprout schema has flat fields (`personaId`, `journeyId`). We want nested `provenance` object for cleaner attribution. Terminal `/sprout` command uses existing flat fields.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. Replace schema, migrate** | Clean, no legacy | Breaks Terminal, risky |
| **2. Extend with both formats** | Safe | Redundant fields |
| **3. Add provenance + adapter** | Safe, gradual migration | Adapter complexity |

### Decision

**Option 3: Add provenance + adapter**

### Rationale

- Terminal `/sprout` command continues working
- New Kinetic capture uses clean nested format
- Adapter functions enable gradual migration
- Can remove flat fields when Terminal migrates

### Consequences

- Create `sproutAdapter.ts` with `flattenSprout` and `nestSprout`
- Both formats valid temporarily
- Future sprint removes deprecated flat fields
- Document which fields are deprecated

---

## ADR-004: Framer Motion for Animations

### Context

Sprint requires: flight animation, spring physics, magnetic scaling, layoutId transitions.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. CSS only** | No dependency | Limited physics, no layoutId |
| **2. Framer Motion** | Full-featured, layoutId | Already in project |
| **3. React Spring** | Excellent physics | No layoutId equivalent |
| **4. GSAP** | Powerful | Overkill, different paradigm |

### Decision

**Option 2: Framer Motion**

### Rationale

- Already installed in project
- `layoutId` enables pill → card transition
- Spring physics built-in
- Good React integration
- Consistent with existing animations

### Consequences

- Use Framer Motion patterns throughout sprint
- Document spring values for reuse
- Ensure animations are interruptible (per WWDC 2018)

---

## ADR-005: Zustand over Context for Sprout State

### Context

Sprout state needs: persistence, cross-component access, efficient updates.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. React Context** | Built-in, familiar | Provider wrapper, re-renders |
| **2. Zustand** | No wrapper, persist middleware | External dependency |
| **3. Jotai** | Atomic, efficient | Less familiar pattern |

### Decision

**Option 2: Zustand**

### Rationale

- Already used elsewhere in codebase
- `persist` middleware handles localStorage
- No Provider wrapper needed
- Efficient subscriptions (no full-tree re-renders)
- Simple API

### Consequences

- Store in `src/features/kinetic/store/sproutStore.ts`
- Use `persist` middleware with version for migrations
- Components subscribe to specific slices

---

## ADR-006: Declarative Config Structure for Future Extraction

### Context

This sprint hardcodes single "Sprout" action. Future sprints may need multiple selection actions, configurable by non-engineers.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. Inline hardcoding** | Simple, fast | DEX violation, hard to extract |
| **2. TypeScript config object** | Typed, extractable | Still needs loader for JSON |
| **3. JSON from day 1** | Pure declarative | Over-engineering for MVP |

### Decision

**Option 2: TypeScript config object structured for extraction**

### Rationale

- TypeScript provides type safety during development
- Object structure mirrors future JSON schema
- Single file to convert when extraction triggered
- No JSON loading infrastructure needed for MVP
- Clear "TEMPORARY" documentation

### Consequences

- Create `sprout-capture.config.ts` with clear structure
- Document extraction triggers in SPEC.md
- Components read from config, not inline values
- Future sprint converts to JSON + loader

---

## ADR-007: Right-Edge Tray Positioning

### Context

Where should the Sprout Tray live in the Kinetic interface?

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. Bottom edge** | Common pattern | Conflicts with Command Console |
| **2. Right edge** | Preserves vertical space | Less common |
| **3. Left edge** | Mirrors sidebar patterns | Conflicts with nav |
| **4. Floating** | Flexible | Obscures content, positioning complexity |

### Decision

**Option 2: Right edge**

### Rationale

- Kinetic Stream is primary reading area (center/left)
- Bottom has Command Console, Z-index conflict
- Right edge is "collection" zone (natural for accumulation)
- Vertical positioning preserves reading flow
- 48px collapsed is minimal intrusion

### Consequences

- Tray as absolutely positioned right-edge element
- Expand on hover/click (not always expanded)
- Flight animation targets right edge
- Consider viewport height for many sprouts (scrolling)

---

## ADR-008: Selection Filtering Strategy

### Context

Not all text selections should trigger the Magnetic Pill. UI chrome (buttons, labels, navigation) should be excluded.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. Whitelist containers** | Explicit control | Must maintain list |
| **2. Blacklist UI elements** | Catches edge cases | Complex, fragile |
| **3. Data attribute marker** | Clear, semantic | Requires attribute on content |

### Decision

**Option 3: Data attribute marker**

### Rationale

- `[data-message-id]` already exists on messages
- Semantic: only content with provenance is selectable
- Easy to extend to other content types
- Clear contract: no attribute = no capture

### Consequences

- Selection hook checks for `[data-message-id]` ancestor
- Other content types add similar markers
- Clear documentation for content authors

---

## Decision Log

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Visible Tray for object permanence | ✅ Approved |
| 002 | useLayoutEffect for positioning | ✅ Approved |
| 003 | Schema extension with adapter | ✅ Approved |
| 004 | Framer Motion for animations | ✅ Approved |
| 005 | Zustand for state management | ✅ Approved |
| 006 | TypeScript config for extraction | ✅ Approved |
| 007 | Right-edge tray positioning | ✅ Approved |
| 008 | Data attribute selection filtering | ✅ Approved |

---

*Decisions documented. See MIGRATION.md for file operations.*
