# Architecture: Card System Unification

**Sprint:** card-system-unification-v1  
**Pattern Approach:** Token Namespaces + Engagement Machine state derivation  
**Design Goal:** Establish THE canonical card styling pattern for the entire Grove ecosystem

---

## The Broader Vision

This sprint doesn't just fix three components—it establishes the **infrastructure layer** that all future card-based UIs will use:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CARD TOKEN INFRASTRUCTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  globals.css                                                    │
│  └── --card-border-*                                            │
│  └── --card-bg-*                                                │
│  └── --card-ring-*                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    CURRENT CONSUMERS                            │
├─────────────────────────────────────────────────────────────────┤
│  Foundation Explore    │  LensCard, CustomLensCard, JourneyCard │
│  Genesis               │  (LensGrid - different interaction)    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    FUTURE CONSUMERS                             │
├─────────────────────────────────────────────────────────────────┤
│  Foundation Explore    │  NodeCard, HubCard                     │
│  Foundation Admin      │  UserCard, ConfigCard, AnalyticsCard   │
│  Terminal              │  SuggestionCard, ContextCard           │
│  Any new surface       │  Uses same tokens                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Building a new card component means:**
1. Use `--card-*` tokens (don't invent new colors)
2. Implement appropriate states (isActive, isInspected, isSelected, isDisabled)
3. Done. Styling is inherited.

**Changing card styling means:**
1. Edit `--card-*` token values in globals.css
2. Done. All cards update.

---

## Overview

This sprint implements styling through CSS custom properties (tokens) rather than creating new components. The card components remain the same; their styling becomes declarative.

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE (Hardcoded)                       │
├─────────────────────────────────────────────────────────────┤
│  LensCard                                                   │
│  └── className="border-slate-200 ..."  (hardcoded)          │
│  └── button className="bg-slate-100 ..."  (wrong color)    │
│                                                             │
│  JourneyCard                                                │
│  └── className="border-slate-200 ..."  (hardcoded)          │
│  └── No isInspected prop                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AFTER (Token-Based)                      │
├─────────────────────────────────────────────────────────────┤
│  globals.css                                                │
│  └── --card-border-default, --card-ring-color, etc.         │
│                                                             │
│  LensCard                                                   │
│  └── isInspected prop (from workspaceUI)                    │
│  └── className uses var(--card-*) tokens                    │
│  └── button className="bg-primary text-white"               │
│                                                             │
│  JourneyCard                                                │
│  └── isInspected prop (from workspaceUI)                    │
│  └── className uses var(--card-*) tokens                    │
└─────────────────────────────────────────────────────────────┘
```

---

## DEX Compliance

### Declarative Sovereignty

**How domain experts can modify behavior without code:**

1. **Token values** in `globals.css` can be changed by anyone who can edit CSS
2. **Foundation nav labels** defined in `quantum-content.ts` SUPERPOSITION_MAP
3. **Card accent colors** already in `PERSONA_COLORS` (narrative schema)

A designer can change the "inspected" ring color from primary to accent by editing one CSS token, without touching React components.

### Capability Agnosticism

**How this works regardless of model:**

The card system is purely UI. It doesn't depend on any LLM capability. The `isInspected` state comes from the Engagement Machine (XState), which is a deterministic state machine.

### Provenance

**How we track attribution:**

- Sprint artifacts document why decisions were made
- Git history shows token value changes
- DEVLOG captures implementation choices

### Organic Scalability

**How this grows without restructuring:**

New card types (e.g., NodeCard, HubCard) can be added by:
1. Using the same `--card-*` tokens
2. Adding `isInspected` prop if they support inspector

The token namespace is extensible. Adding `--card-border-warning` for error states doesn't require changing existing components.

---

## State Flow

### isInspected Derivation

```
┌──────────────────┐
│ WorkspaceUI      │
│ (React Context)  │
├──────────────────┤
│ inspector: {     │
│   isOpen: true   │
│   mode: {        │
│     type: 'lens' │
│     lensId: 'x'  │
│   }              │
│ }                │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ LensPicker       │
├──────────────────┤
│ inspectedLensId  │
│ = workspaceUI    │
│   .inspector     │
│   .mode.lensId   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ LensCard         │
├──────────────────┤
│ isInspected =    │
│ inspectedLensId  │
│ === persona.id   │
└──────────────────┘
```

### Visual State Selection

```typescript
// className logic in LensCard
const cardClassName = cn(
  // Base styles
  "group cursor-pointer flex flex-col p-5 rounded-xl border transition-all",
  
  // State cascade: inspected > active > default
  isInspected
    ? "ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]"
    : isActive
      ? "bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1 ring-[var(--card-ring-active)]"
      : "border-[var(--card-border-default)] hover:shadow-lg hover:border-primary/30"
);
```

---

## Token Architecture

### Namespace Design

```css
/* In globals.css */

:root {
  /* Card component tokens */
  --card-border-default: theme('colors.slate.200');
  --card-border-inspected: theme('colors.primary.DEFAULT');
  --card-border-active: rgba(16, 185, 129, 0.3);  /* primary at 30% */
  
  --card-bg-default: transparent;
  --card-bg-active: rgba(16, 185, 129, 0.05);     /* primary at 5% */
  
  --card-ring-color: theme('colors.primary.DEFAULT');
  --card-ring-active: rgba(16, 185, 129, 0.2);    /* primary at 20% */
}

.dark {
  --card-border-default: theme('colors.slate.700');
  --card-bg-active: rgba(16, 185, 129, 0.1);      /* slightly more visible in dark */
}
```

### Token Cascade

```
globals.css (tokens)
    ↓
LensCard / JourneyCard (consume tokens)
    ↓
Tailwind (compiles to CSS)
    ↓
Browser (renders)
```

---

## File Changes Summary

### Modified Files

| File | Purpose | Changes |
|------|---------|---------|
| `src/app/globals.css` | Add `--card-*` tokens | ~20 lines |
| `src/explore/LensPicker.tsx` | Add isInspected, fix button | ~40 lines |
| `src/explore/JourneyList.tsx` | Add isInspected | ~30 lines |
| `src/core/schema/narrative.ts` | Add foundation.sectionLabels to LensReality | ~10 lines |
| `src/data/quantum-content.ts` | Wire nav labels per lens | ~5 lines per lens |
| Foundation sidebar component | Read labels from reality | ~15 lines |

### No Changes

| File | Reason |
|------|--------|
| `components/Terminal/LensGrid.tsx` | Genesis has no inspector; different UX is intentional |
| `src/explore/inspectors/*` | Already work correctly with inspector state |

---

## Integration Points

### WorkspaceUIContext

Already provides:
- `inspector.isOpen`
- `inspector.mode` (with `type`, `lensId`, or `journeyId`)

No changes needed to context.

### useQuantumInterface

Will be extended to provide `reality.foundation.sectionLabels` for nav label reactivity.

### Engagement Machine

No changes needed. Card styling is pure UI; it reads state but doesn't modify it.

---

## Testing Strategy

### Unit Tests

Not required for styling changes. Visual verification more appropriate.

### E2E Tests

Behavior-focused tests (existing):
- "clicking lens card opens inspector" — already tested
- "selecting lens returns to chat" — already tested

Visual regression (if baseline exists):
- Run Playwright visual comparison before/after

### Manual Verification

Primary verification method for this sprint:
1. Visual inspection of state transitions
2. Token override test (change value, verify all cards update)
3. Dark mode verification

---

## Rollback Plan

If issues arise:

1. **Token changes:** Revert globals.css token additions
2. **Component changes:** Revert isInspected prop additions
3. **Full rollback:** `git revert` the sprint PR

All changes are additive (new props, new tokens). No existing functionality is removed.

---

## Diagram: Final State

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CARD STYLING SYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────────┐ │
│  │   globals.css   │────▶│   LensCard.tsx  │     │ JourneyCard   │ │
│  │                 │     │                 │     │               │ │
│  │ --card-border-* │     │ isInspected ◀───┼─────┼── workspaceUI │ │
│  │ --card-ring-*   │     │ isActive        │     │ isInspected   │ │
│  │ --card-bg-*     │     │                 │     │ isActive      │ │
│  └─────────────────┘     └─────────────────┘     └───────────────┘ │
│           │                      │                      │           │
│           └──────────────────────┴──────────────────────┘           │
│                                  │                                  │
│                                  ▼                                  │
│                     ┌─────────────────────┐                         │
│                     │   Visual States     │                         │
│                     ├─────────────────────┤                         │
│                     │ Default   □         │                         │
│                     │ Inspected ◉ ring-2  │                         │
│                     │ Active    ◯ ring-1  │                         │
│                     └─────────────────────┘                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

*Architecture complete. Token-based approach enables declarative styling without component fragmentation.*
