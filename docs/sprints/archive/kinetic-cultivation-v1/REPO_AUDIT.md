# Repository Audit — Kinetic Cultivation v1

**Sprint:** `kinetic-cultivation-v1`  
**Date:** 2024-12-29  
**Auditor:** Claude + Jim

---

## Project Structure

```
C:\GitHub\the-grove-foundation\
├── src/
│   ├── core/
│   │   ├── schema/
│   │   │   ├── sprout.ts              ← MODIFY: Add SproutProvenance
│   │   │   ├── grove-object.ts        ← REFERENCE: GroveObjectMeta pattern
│   │   │   └── narrative.ts           ← REFERENCE: LensReality type
│   │   └── engagement/                ← REFERENCE: State machine
│   ├── surface/
│   │   ├── components/
│   │   │   └── GroveObjectCard/       ← EXTEND: Add sprout renderer
│   │   └── hooks/
│   │       └── useQuantumInterface.ts ← INVOKE: Read activeLens
│   ├── features/
│   │   └── kinetic/                   ← TARGET: New components
│   │       ├── KineticShell.tsx       ← MODIFY: Wire shortcuts, tray
│   │       ├── KineticStream.tsx      ← MODIFY: Wire selection
│   │       ├── components/            ← CREATE: New components
│   │       ├── hooks/                 ← CREATE: New hooks
│   │       ├── store/                 ← CREATE: Zustand store
│   │       ├── config/                ← CREATE: Declarative config
│   │       └── animations/            ← CREATE: Flight animation
│   └── app/
│       └── globals.css                ← MODIFY: Add --tray-* tokens
├── hooks/
│   └── useSproutStorage.ts            ← DEPRECATE: Replace with Zustand
├── docs/
│   └── sprints/
│       ├── sprout-system/             ← REFERENCE: Prior sprint
│       └── kinetic-cultivation-v1/    ← THIS SPRINT
└── PROJECT_PATTERNS.md                ← REVIEWED
```

---

## Key Files Analysis

### Files to Modify

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/core/schema/sprout.ts` | Sprout type definition | Add `SproutProvenance` interface, extend `Sprout` |
| `src/features/kinetic/KineticShell.tsx` | Kinetic container | Wire `useKineticShortcuts`, render `SproutTray` |
| `src/features/kinetic/KineticStream.tsx` | Chat stream | Wire `useTextSelection`, render `MagneticPill` |
| `src/app/globals.css` | Design tokens | Add `--tray-*` token namespace |

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/kinetic/config/sprout-capture.config.ts` | Declarative capture config (extraction-ready) |
| `src/features/kinetic/hooks/useTextSelection.ts` | Selection detection |
| `src/features/kinetic/hooks/useKineticShortcuts.ts` | Global keyboard shortcuts |
| `src/features/kinetic/hooks/useShortcutFeedback.ts` | Visual feedback system |
| `src/features/kinetic/hooks/useSproutCapture.ts` | Capture orchestration |
| `src/features/kinetic/components/MagneticPill.tsx` | Selection action trigger |
| `src/features/kinetic/components/SproutCaptureCard.tsx` | Capture form |
| `src/features/kinetic/components/SproutTray.tsx` | Right-edge drawer |
| `src/features/kinetic/components/SproutCard.tsx` | Compact sprout display |
| `src/features/kinetic/components/KeyboardHUD.tsx` | Shortcut reference overlay |
| `src/features/kinetic/store/sproutStore.ts` | Zustand + persist |
| `src/features/kinetic/animations/sproutFlight.ts` | Flight animation |
| `src/features/kinetic/utils/sproutAdapter.ts` | Schema adapter |

### Files to Reference (Read-Only)

| File | Why Referenced |
|------|----------------|
| `src/core/schema/grove-object.ts` | GroveObjectMeta pattern |
| `src/surface/hooks/useQuantumInterface.ts` | Read activeLens |
| `src/core/engagement/` | Read activeJourney |
| `docs/sprints/sprout-system/ARCHITECTURE.md` | Prior schema decisions |

### Files to Deprecate

| File | Replacement |
|------|-------------|
| `hooks/useSproutStorage.ts` | `src/features/kinetic/store/sproutStore.ts` |

---

## Existing Sprout Schema

From `src/core/schema/sprout.ts` (current state):

```typescript
export type GrowthStage = 
  | 'tender'
  | 'rooting'
  | 'branching'
  | 'hardened'
  | 'grafted'
  | 'established'
  | 'dormant'
  | 'withered';

export interface Sprout {
  id: string;
  capturedAt: string;
  content: string;
  query: string;
  contextLoaded: string[];
  personaId: string;
  journeyId?: string;
  hubId?: string;
  nodeId?: string;
  stage: GrowthStage;
  tags: string[];
  notes?: string;
  sessionId: string;
  derivedFrom?: string;
  derivatives: string[];
  promotedToCommons?: boolean;
  promotedAt?: string;
  adoptionCount?: number;
}
```

**Issue:** Flat fields (`personaId`, `journeyId`, etc.) should be nested under `provenance` for cleaner attribution tracking. Need adapter for backward compatibility.

---

## Dependencies

| Package | Version | Status | Used For |
|---------|---------|--------|----------|
| framer-motion | Check package.json | ✓ Installed | Animations, layoutId |
| zustand | Check package.json | ✓ Installed | State management |
| @xstate/react | Check package.json | ✓ Installed | Engagement machine |

---

## Pattern Compliance Check

| Pattern | Status | Notes |
|---------|--------|-------|
| P1: Quantum Interface | ✓ INVOKE | Read `activeLens` from existing hook |
| P4: Token Namespaces | ✓ EXTEND | Add `--tray-*` tokens |
| P7: Object Model | ✓ EXTEND | Sprout implements GroveObjectMeta |
| P8: Canonical Source | ✓ COMPLIANT | No duplication planned |
| Selection Action | NEW | Proposed pattern, documented |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Selection API edge cases | Medium | High | Day 1 focus, extensive testing |
| Animation performance | Low | Medium | Use hardware-accelerated properties |
| Schema migration | Low | Medium | Adapter pattern, backward compat |
| Keyboard shortcut conflicts | Low | Low | Test against browser defaults |

---

*Audit complete. Proceed to SPEC.md.*
