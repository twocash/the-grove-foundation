# REPO_AUDIT.md — Quantum Glass v1.1

## Sprint: Card System Unification
## Date: 2025-12-25
## Auditor: Claude

---

## 1. Current State Assessment

### 1.1 What Exists

**Quantum Glass v1 Foundation (Complete):**
- `styles/globals.css`: ~220 lines of glass tokens and utilities
- `.glass-card` with data-attribute states (selected, active)
- `.glass-panel`, `.glass-panel-solid` containers
- `.glass-viewport` with grid background
- `.status-badge-*` variants (active, draft, system)
- `--glass-*` token namespace (backgrounds, borders, text, neon accents)
- Corner accent pseudo-elements on cards

**Workspace Infrastructure (Complete):**
- `GroveWorkspace.tsx`: Uses `glass-viewport`
- `NavigationSidebar.tsx`: Uses glass tokens, green active state
- `InspectorPanel.tsx`: Uses `glass-panel-solid`
- `ObjectInspector.tsx`: Uses glass tokens
- `CardShell.tsx`: Reference implementation of glass-card pattern

### 1.2 What's Broken

**Collection View Cards (Inconsistent):**

| File | Problems |
|------|----------|
| `JourneyList.tsx` | Full card partially updated but has amber callout, icon still `text-primary`. Compact card untouched. |
| `LensPicker.tsx` | Full card has data attributes but uses `lensAccents` colored backgrounds. Compact card untouched. |
| `NodeGrid.tsx` | Uses outdated `--grove-*` tokens, no footer structure |

**Shared Components (Outdated):**

| File | Problems |
|------|----------|
| `CollectionHeader.tsx` | Uses `text-slate-*` with dark mode variants |
| `SearchInput.tsx` | Uses `bg-surface-light`, `border-border-light`, `text-slate-*` |
| `ActiveIndicator.tsx` | Uses `border-border-light`, `bg-stone-50`, `text-slate-*` |

**State Management (Bug):**

| File | Problem |
|------|---------|
| `WorkspaceUIContext.tsx` | `navigateTo` doesn't close inspector on collection change |

### 1.3 Token Debt

The following old token patterns need elimination:

```
❌ text-slate-900 dark:text-slate-100
❌ text-slate-500 dark:text-slate-400
❌ bg-surface-light dark:bg-surface-dark
❌ border-border-light dark:border-border-dark
❌ bg-stone-50 dark:bg-slate-900
❌ bg-amber-50 dark:bg-amber-900/30
❌ text-amber-600 dark:text-amber-400
❌ bg-primary/10 dark:bg-primary/20
❌ text-primary
❌ --grove-* tokens
```

Replace with:
```
✅ text-[var(--glass-text-primary)]
✅ text-[var(--glass-text-muted)]
✅ bg-[var(--glass-solid)]
✅ border-[var(--glass-border)]
✅ var(--neon-green), var(--neon-cyan)
```

---

## 2. File Inventory

### 2.1 Files to Modify

| File | Path | Lines | Change Type |
|------|------|-------|-------------|
| globals.css | `styles/globals.css` | ~1011 | Add ~80 lines |
| WorkspaceUIContext.tsx | `src/workspace/WorkspaceUIContext.tsx` | 231 | Modify ~20 lines |
| JourneyList.tsx | `src/explore/JourneyList.tsx` | 305 | Modify ~120 lines (2 components) |
| LensPicker.tsx | `src/explore/LensPicker.tsx` | 525 | Modify ~150 lines (2 components + remove lensAccents) |
| NodeGrid.tsx | `src/explore/NodeGrid.tsx` | 150 | Modify ~60 lines |
| CollectionHeader.tsx | `src/shared/CollectionHeader.tsx` | 106 | Modify ~10 lines |
| SearchInput.tsx | `src/shared/SearchInput.tsx` | 47 | Modify ~10 lines |
| ActiveIndicator.tsx | `src/shared/ActiveIndicator.tsx` | 27 | Modify ~15 lines |

### 2.2 Files to Create

None — all utilities go in existing globals.css.

### 2.3 Files Unchanged

| File | Reason |
|------|--------|
| CardShell.tsx | Already correct, serves as reference |
| StatusBadge.tsx | Already correct |
| NavigationSidebar.tsx | Already updated in v1 |
| InspectorPanel.tsx | Already updated in v1 |
| Inspector.tsx | Content only, styling via InspectorPanel |

---

## 3. Dependency Analysis

### 3.1 Import Dependencies

```
globals.css
  └── (no imports, pure CSS)

WorkspaceUIContext.tsx
  └── @core/schema/workspace (types only)

JourneyList.tsx
  ├── useNarrativeEngine
  ├── useOptionalWorkspaceUI
  ├── CollectionHeader ← needs update
  ├── useEngagement, useJourneyState
  └── StatusBadge ← needs import added

LensPicker.tsx
  ├── useNarrativeEngine
  ├── useWorkspaceUI
  ├── CollectionHeader ← needs update
  ├── useEngagement, useLensState
  └── StatusBadge ← needs import added

NodeGrid.tsx
  ├── useNarrativeEngine
  ├── useWorkspaceUI
  └── lucide-react icons (can remove Tag, ArrowRight)
```

### 3.2 Test Dependencies

```
src/explore/__tests__/
  └── (no dedicated card tests found)

src/workspace/__tests__/
  └── (inspector context tests needed)
```

---

## 4. Risk Assessment

### 4.1 Low Risk
- CSS utility additions (additive, non-breaking)
- Token replacements (visual only)
- ActiveIndicator update (isolated component)

### 4.2 Medium Risk
- Inspector close logic (state management change)
- JourneyCard/LensCard refactors (complex conditional logic)

### 4.3 Mitigation
- Phase execution allows visual verification after each step
- Existing test suite catches regressions
- Build verification at each phase

---

## 5. Estimated Scope

| Category | Lines Changed |
|----------|---------------|
| CSS additions | ~80 |
| State logic | ~20 |
| JourneyList (full + compact) | ~120 |
| LensPicker (full + compact + remove accents) | ~150 |
| NodeGrid | ~60 |
| Shared components | ~35 |
| **Total** | **~465 lines** |

---

## 6. Success Metrics

### Visual Verification Points
1. Journeys tab: All cards glass-styled, cyan callouts, no amber
2. Lenses tab: All cards glass-styled, monochrome icons, no colored backgrounds
3. Nodes tab: All cards glass-styled with footer
4. Active indicator: Glass tokens, green pulse
5. Search inputs: Glass solid background, cyan focus ring

### Behavioral Verification
1. Click Journey card → Journey Inspector opens
2. Navigate to Lenses → Inspector closes
3. Click Lens card → Lens Inspector opens
4. Hover any card → Lift + cyan corners
5. Active item → Green border + badge

### Technical Verification
1. `npm run build` passes
2. `npm test` all pass
3. No TypeScript errors
4. No console warnings
