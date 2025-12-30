# Migration Map — Kinetic Cultivation v1

**Sprint:** `kinetic-cultivation-v1`  
**Date:** 2024-12-29

---

## File Operations Summary

| Operation | Count |
|-----------|-------|
| CREATE | 14 |
| MODIFY | 4 |
| DEPRECATE | 1 |
| DELETE | 0 |

---

## Files to Create

### Config (Day 1)

| File | Purpose | Epic |
|------|---------|------|
| `src/features/kinetic/config/sprout-capture.config.ts` | Declarative capture config | 1 |

### Hooks (Days 1-4)

| File | Purpose | Epic |
|------|---------|------|
| `src/features/kinetic/hooks/useTextSelection.ts` | Selection detection | 1 |
| `src/features/kinetic/hooks/useSproutCapture.ts` | Capture orchestration | 2 |
| `src/features/kinetic/hooks/useKineticShortcuts.ts` | Global keyboard listener | 4 |
| `src/features/kinetic/hooks/useShortcutFeedback.ts` | Visual feedback system | 4 |

### Components (Days 1-4)

| File | Purpose | Epic |
|------|---------|------|
| `src/features/kinetic/components/MagneticPill.tsx` | Selection action trigger | 1 |
| `src/features/kinetic/components/SproutCaptureCard.tsx` | Capture form | 2 |
| `src/features/kinetic/components/SproutTray.tsx` | Right-edge drawer | 3 |
| `src/features/kinetic/components/SproutCard.tsx` | Compact sprout display | 3 |
| `src/features/kinetic/components/KeyboardHUD.tsx` | Shortcut reference overlay | 4 |

### Store (Day 3)

| File | Purpose | Epic |
|------|---------|------|
| `src/features/kinetic/store/sproutStore.ts` | Zustand + persist | 3 |

### Animations (Day 3)

| File | Purpose | Epic |
|------|---------|------|
| `src/features/kinetic/animations/sproutFlight.ts` | Flight animation sequence | 3 |

### Utils (Day 5)

| File | Purpose | Epic |
|------|---------|------|
| `src/features/kinetic/utils/sproutAdapter.ts` | Schema adapter functions | 5 |

---

## Files to Modify

### Schema (Day 2)

```
src/core/schema/sprout.ts
├── ADD: SproutProvenance interface
├── EXTEND: Sprout interface with provenance field
└── MARK: Deprecated flat fields with comments
```

### Kinetic Components (Days 1, 3, 4)

```
src/features/kinetic/KineticShell.tsx
├── IMPORT: useKineticShortcuts, SproutTray
├── ADD: Shortcut hook wiring
└── RENDER: SproutTray as right-edge element

src/features/kinetic/KineticStream.tsx
├── IMPORT: useTextSelection, MagneticPill, SproutCaptureCard
├── ADD: streamRef for selection container
├── WIRE: Selection hook with ref
└── RENDER: Pill and capture card conditionally
```

### Styling (Day 3)

```
src/app/globals.css
├── ADD: --tray-* token namespace
└── ADD: --pill-* token namespace
```

---

## Files to Deprecate

| File | Replacement | Migration |
|------|-------------|-----------|
| `hooks/useSproutStorage.ts` | `src/features/kinetic/store/sproutStore.ts` | Gradual; Terminal continues using until migrated |

---

## Directory Structure (Final)

```
src/features/kinetic/
├── KineticShell.tsx           ← MODIFIED
├── KineticStream.tsx          ← MODIFIED
├── config/
│   └── sprout-capture.config.ts   ← NEW
├── components/
│   ├── MagneticPill.tsx           ← NEW
│   ├── SproutCaptureCard.tsx      ← NEW
│   ├── SproutTray.tsx             ← NEW
│   ├── SproutCard.tsx             ← NEW
│   └── KeyboardHUD.tsx            ← NEW
├── hooks/
│   ├── useTextSelection.ts        ← NEW
│   ├── useSproutCapture.ts        ← NEW
│   ├── useKineticShortcuts.ts     ← NEW
│   └── useShortcutFeedback.ts     ← NEW
├── store/
│   └── sproutStore.ts             ← NEW
├── animations/
│   └── sproutFlight.ts            ← NEW
└── utils/
    └── sproutAdapter.ts           ← NEW
```

---

## Token Additions (globals.css)

```css
:root {
  /* Tray namespace */
  --tray-width-collapsed: 48px;
  --tray-width-expanded: 240px;
  --tray-bg: rgba(0, 0, 0, 0.6);
  --tray-bg-hover: rgba(0, 0, 0, 0.7);
  --tray-border: rgba(255, 255, 255, 0.1);
  --tray-border-hover: rgba(255, 255, 255, 0.15);
  --tray-backdrop-blur: 12px;
  --tray-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  
  /* Tray badge */
  --tray-badge-bg: var(--grove-accent, #10b981);
  --tray-badge-text: white;
  
  /* Pill namespace */
  --pill-bg: rgba(16, 185, 129, 0.9);
  --pill-bg-hover: rgba(16, 185, 129, 1);
  --pill-text: white;
  --pill-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
  
  /* Capture card */
  --capture-card-bg: rgba(0, 0, 0, 0.8);
  --capture-card-border: rgba(255, 255, 255, 0.15);
  --capture-card-backdrop-blur: 16px;
}
```

---

## Schema Changes (sprout.ts)

### Add: SproutProvenance

```typescript
export interface SproutProvenance {
  sourceId: string;
  sourceType: 'message' | 'journey_node' | 'static_content';
  contextSpan: string;
  selectionRange?: { start: number; end: number };
  lensId?: string;
  journeyId?: string;
  nodeId?: string;
}
```

### Extend: Sprout

```typescript
export interface Sprout {
  // ... existing fields ...
  
  // NEW: Nested provenance
  provenance: SproutProvenance;
  
  // DEPRECATED: Flat fields (remove after Terminal migration)
  /** @deprecated Use provenance.lensId */
  personaId?: string;
  /** @deprecated Use provenance.journeyId */
  journeyId?: string;
  /** @deprecated Use provenance.nodeId */
  nodeId?: string;
  /** @deprecated Use provenance.contextSpan */
  query?: string;
}
```

---

## Execution Order

| Day | Files Created | Files Modified |
|-----|---------------|----------------|
| 1 | config, useTextSelection, MagneticPill | KineticStream |
| 2 | SproutCaptureCard, useSproutCapture | sprout.ts |
| 3 | sproutStore, SproutTray, SproutCard, sproutFlight | globals.css, KineticShell |
| 4 | useKineticShortcuts, useShortcutFeedback, KeyboardHUD | KineticShell |
| 5 | sproutAdapter | - |

---

*Migration map complete. See SPRINTS.md for story breakdown.*
