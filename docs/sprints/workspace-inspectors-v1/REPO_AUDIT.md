# Sprint 3: Workspace Inspectors v1 — Repository Audit

**Sprint:** workspace-inspectors-v1
**Date:** 2024-12-24
**Status:** 🔄 In Progress
**Depends on:** PR #34 ✅ Merged

---

## Executive Summary

Sprint scope expanded to include IA restructure. Three functional inspectors exist with good UX but inconsistent token usage. Work includes:

1. **IA Update** — Add Terminal, Diary, Sprouts to Project nav hierarchy
2. **Refactor to shared components** — LensInspector has inline duplicates of `/shared/forms/`
3. **Token consistency** — Migrate from direct Tailwind utilities to semantic tokens
4. **Stub inspectors** — Node and Diary placeholders

---

## Information Architecture Update

### Current IA (v0.14.2)

```
Explore
└── Grove Project (Knowledge Field)
    ├── Nodes
    ├── Journeys
    └── Lenses
└── + Fields [SOON]
```

### Target IA (v0.15)

```
Explore
└── Grove Project (Knowledge Field - maps to RAG at project level)
    ├── Terminal (chat - project scoped)
    ├── Lenses
    ├── Journeys
    ├── Nodes
    ├── Diary [NEW - stub]
    └── Sprouts [moved from Cultivate]
└── + Fields [SOON]
```

### Key Changes

| Item | Change | Work |
|------|--------|------|
| Terminal | Add to Project children | Nav tree update |
| Diary | New nav item | Nav tree + DiaryInspector stub |
| Sprouts | Move from Cultivate to Project | Nav tree update |
| Nodes | Keep | DiaryInspector placeholder |
| Lenses | Reorder (now first after Terminal) | Nav tree reorder |
| Journeys | Reorder | Nav tree reorder |

---

## Architecture Discovery

### Two Inspector Systems

| System | Location | Context | Users |
|--------|----------|---------|-------|
| **Workspace** | `/src/explore/`, `/src/cultivate/` | Main UI at `/terminal` | End users |
| **Foundation** | `/src/foundation/inspectors/` | Admin console at `/foundation` | Developers |

The Foundation inspectors use shared components (`InspectorPanel`, `InspectorSection`) while Workspace inspectors have inline implementations.

### Inspector Router

**File:** `src/workspace/Inspector.tsx` (154 lines)

Routes inspector types to components:

| Type | Component | Status |
|------|-----------|--------|
| `lens` | `LensInspector` | ✅ Functional (294 lines) |
| `journey` | `JourneyInspector` | ✅ Functional (178 lines) |
| `sprout` | `SproutInspector` | ✅ Functional (257 lines) |
| `node` | Inline | ⚠️ Stub ("coming soon") |
| `diary-entry` | Inline | ⚠️ Stub ("coming soon") |
| `chat-context` | Inline | ✅ Functional |

### Shared Component Library

**Location:** `/src/shared/`

```
shared/
├── forms/           # Toggle, Slider, Select, Checkbox, TextInput, TextArea
├── feedback/        # EmptyState, StatusBadge, InfoCallout, LoadingSpinner
├── layout/          # InspectorPanel, ThreeColumnLayout, ContentContainer
└── index.ts         # Barrel exports
```

**Problem:** Workspace inspectors duplicate components that exist in `/shared/forms/`:

| LensInspector Inline | Shared Equivalent |
|---------------------|-------------------|
| `Toggle` (lines 11-47) | `/shared/forms/Toggle.tsx` |
| `Slider` (lines 49-72) | `/shared/forms/Slider.tsx` |
| `Select` (lines 74-100) | `/shared/forms/Select.tsx` |
| `Checkbox` (lines 102-118) | `/shared/forms/Checkbox.tsx` |
| `InfoCallout` (lines 120-135) | `/shared/feedback/InfoCallout.tsx` |

---

## Token Architecture

### Current State (globals.css)

**Defined but not used consistently:**

```css
/* Workspace tokens */
--color-primary: #4d7c0f;
--color-background-light: #f8f7f5;
--color-background-dark: #0f172a;
--color-surface-light: #ffffff;
--color-surface-dark: #1e293b;
--color-border-light: #e7e5e4;
--color-border-dark: #334155;

/* Grove surface tokens */
--color-grove-cream: #F9F8F4;
--color-grove-dark: #1A2421;
--color-grove-forest: #355E3B;
--color-grove-accent: #355E3B;
--color-grove-light: #E5E5E0;
```

### Workspace Inspector Usage (Current)

Direct Tailwind utilities instead of semantic tokens:

```tsx
// LensInspector.tsx
className="bg-stone-50 dark:bg-slate-900/50 border border-border-light dark:border-slate-700"
className="text-slate-700 dark:text-slate-200"
```

### Sprint 1 Tokens (PR #34, not merged)

Branch `feature/chat-column-unification-v1` adds `--chat-*` tokens:

```css
--chat-bg: #1a2421;
--chat-surface: #243029;
--chat-accent: #00D4AA;
--chat-text: rgba(255, 255, 255, 0.9);
/* ... 25 total tokens */
```

---

## Dependency Analysis

### PR #34 Status

| Metric | Value |
|--------|-------|
| Branch | `feature/chat-column-unification-v1` |
| Commits | 7 ahead of main |
| Key changes | 25 `--chat-*` tokens, Terminal migration |
| Tests | Genesis baseline passing |

**Decision required:** Merge PR #34 before Sprint 3, or work in parallel?

### Shared Forms → Inspector Dependencies

```
LensInspector.tsx
├── Uses: Toggle (inline) → Should use: /shared/forms/Toggle
├── Uses: Slider (inline) → Should use: /shared/forms/Slider
├── Uses: Select (inline) → Should use: /shared/forms/Select
├── Uses: Checkbox (inline) → Should use: /shared/forms/Checkbox
└── Uses: InfoCallout (inline) → Should use: /shared/feedback/InfoCallout

JourneyInspector.tsx
└── No inline components (already lean)

SproutInspector.tsx
└── No inline components (uses native form elements)
```

---

## Files In Scope

### Primary (Implementation Focus)

| File | Lines | Work |
|------|-------|------|
| `src/explore/LensInspector.tsx` | 294 | Refactor to shared components |
| `src/explore/JourneyInspector.tsx` | 178 | Token audit only |
| `src/workspace/Inspector.tsx` | 154 | Inline stub → proper components |

### Secondary (Audit Only)

| File | Lines | Work |
|------|-------|------|
| `src/cultivate/SproutInspector.tsx` | 257 | Token audit |
| `src/shared/forms/*.tsx` | ~250 | Verify token usage |
| `src/shared/feedback/*.tsx` | ~150 | Verify token usage |

### Out of Scope

| File | Reason |
|------|--------|
| `src/foundation/inspectors/*` | Foundation system, separate aesthetic |
| `components/Terminal/*` | Addressed in Sprint 1 |

---

## Token Migration Map

### Proposed `--grove-*` Token Schema

To parallel the `--chat-*` pattern from Sprint 1:

```css
/* Workspace Inspector Tokens */
--grove-bg: var(--color-background-dark);           /* #0f172a */
--grove-surface: var(--color-surface-dark);         /* #1e293b */
--grove-surface-hover: #2d3b4a;
--grove-border: var(--color-border-dark);           /* #334155 */
--grove-text: rgba(255, 255, 255, 0.9);
--grove-text-muted: rgba(255, 255, 255, 0.6);
--grove-accent: var(--color-primary);               /* #4d7c0f */
--grove-accent-hover: #5a8f12;
```

### Color Mappings

| Current Usage | Proposed Token |
|---------------|----------------|
| `bg-slate-900/50` | `var(--grove-surface)` |
| `bg-stone-50 dark:bg-slate-900` | Light: keep, Dark: `var(--grove-surface)` |
| `text-slate-700 dark:text-slate-200` | `var(--grove-text)` |
| `text-slate-500 dark:text-slate-400` | `var(--grove-text-muted)` |
| `border-slate-700` | `var(--grove-border)` |
| `bg-primary` | `var(--grove-accent)` |

---

## Recommendations

### 1. Merge PR #34 First

Sprint 1 establishes the token pattern. Merging it before Sprint 3:
- Validates the approach works
- Ensures consistent pattern across sprints
- Reduces merge conflicts

### 2. Refactor LensInspector

Remove 120+ lines of inline components, import from `/shared/`:

```tsx
// Before
function Toggle({ ... }) { ... }  // 35 lines
function Slider({ ... }) { ... }  // 24 lines

// After
import { Toggle, Slider, Select, Checkbox } from '@/shared/forms';
import { InfoCallout } from '@/shared/feedback';
```

### 3. Define `--grove-inspector-*` Tokens

Scope tokens to inspector context:

```css
/* Inspector-specific tokens */
--grove-inspector-bg: var(--grove-surface);
--grove-inspector-card: var(--grove-surface-hover);
--grove-inspector-border: var(--grove-border);
```

### 4. Migrate Shared Forms to Tokens

Update `/shared/forms/Toggle.tsx` etc. to use tokens:

```tsx
// Before
className="bg-stone-50 dark:bg-slate-900/50"

// After
className="bg-[var(--grove-inspector-card)]"
// OR with Tailwind config extension
className="bg-grove-inspector-card"
```

---

## Open Questions

1. ~~**PR #34 merge timing?**~~ — ✅ Merged
2. **Light mode support?** — Inspectors show in workspace (dark) but what about Genesis?
3. ~~**Node/Diary stubs**~~ — ✅ Implement as placeholders this sprint

---

## Updated Scope

### Must Have (This Sprint)

| Deliverable | Work |
|-------------|------|
| IA v0.15 | Update NavigationSidebar tree structure |
| Terminal in nav | Add Terminal as first child of Project |
| Diary nav + stub | New nav item + DiaryInspector placeholder |
| Sprouts relocated | Move from Cultivate to Project |
| LensInspector refactor | Replace inline components with shared |
| Token audit | All inspectors using `--grove-*` tokens |
| Node stub | Placeholder inspector (exists, verify) |

### Nice to Have

| Deliverable | Work |
|-------------|------|
| DiaryInspector real UI | Beyond placeholder |
| View routing | Content area views for each nav item |

---

## Next Steps

1. ✅ Repo audit complete
2. ✅ PR #34 merged
3. 📋 Write SPEC.md with detailed requirements
4. 📋 Create ARCHITECTURE.md for IA + token schema
5. 📋 Build MIGRATION_MAP.md for component changes
