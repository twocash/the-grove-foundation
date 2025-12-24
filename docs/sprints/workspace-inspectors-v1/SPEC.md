# Sprint 3: Workspace Inspectors v1 — Specification

**Sprint:** workspace-inspectors-v1
**Version:** 1.0
**Date:** 2024-12-24

---

## 1. Overview

### 1.1 Purpose

Update workspace Information Architecture to v0.15, refactor inspector components to use shared form primitives, and establish consistent `--grove-*` token usage across the inspector system.

### 1.2 Goals

| Priority | Goal | Success Criteria |
|----------|------|------------------|
| P0 | IA v0.15 structure | Nav shows Terminal, Diary, Sprouts under Project |
| P0 | LensInspector cleanup | No inline form components (use /shared/forms) |
| P1 | Token consistency | All inspectors use `--grove-*` tokens |
| P1 | Diary stub | DiaryInspector placeholder functional |
| P2 | Node stub | NodeInspector shows meaningful placeholder |

### 1.3 Non-Goals

- Full Diary functionality (future sprint)
- Terminal embedding in nav (already exists at route level)
- Cultivate section removal (keep for Commons)
- Light mode inspector variants

---

## 2. Information Architecture

### 2.1 Navigation Tree Changes

**File:** `src/workspace/NavigationSidebar.tsx`

```typescript
// Current (v0.14.2)
groveProject: {
  children: {
    nodes: { ... },
    journeys: { ... },
    lenses: { ... },
  }
}

// Target (v0.15)
groveProject: {
  children: {
    terminal: { id: 'terminal', label: 'Terminal', icon: 'chat_bubble', view: 'terminal' },
    lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
    journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
    nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
    diary: { id: 'diary', label: 'Diary', icon: 'book', view: 'diary-list' },
    sprouts: { id: 'sprouts', label: 'Sprouts', icon: 'eco', view: 'sprout-grid' },
  }
}
```

### 2.2 View Mapping

| Nav Item | View ID | Content Component | Status |
|----------|---------|-------------------|--------|
| Terminal | `terminal` | ExploreChat (existing) | ✅ Exists |
| Lenses | `lens-picker` | LensPicker (existing) | ✅ Exists |
| Journeys | `journey-list` | JourneyList (existing) | ✅ Exists |
| Nodes | `node-grid` | NodeGrid (existing) | ✅ Exists |
| Diary | `diary-list` | DiaryList (new stub) | 🆕 Create |
| Sprouts | `sprout-grid` | SproutGrid (existing) | ✅ Exists |

### 2.3 Icon Mapping Addition

```typescript
// Add to iconNameToSymbol
book: 'menu_book',  // For Diary
```

---

## 3. Inspector Specifications

### 3.1 LensInspector Refactor

**File:** `src/explore/LensInspector.tsx`

#### Current State
- 294 lines
- Inline components: Toggle (35 lines), Slider (24 lines), Select (27 lines), Checkbox (17 lines), InfoCallout (16 lines)
- Total inline: ~119 lines

#### Target State
- ~175 lines (remove ~119 lines of inline components)
- Import from shared: `Toggle`, `Slider`, `Select`, `Checkbox` from `@/shared/forms`
- Import from shared: `InfoCallout` from `@/shared/feedback`

#### Changes Required

```tsx
// Remove these inline definitions (lines 11-135):
function Toggle({ ... }) { ... }
function Slider({ ... }) { ... }
function Select({ ... }) { ... }
function Checkbox({ ... }) { ... }
function InfoCallout({ ... }) { ... }

// Add imports:
import { Toggle, Slider, Select, Checkbox } from '@/shared/forms';
import { InfoCallout } from '@/shared/feedback';
```

#### Props Alignment

Verify shared components have compatible props:

| Component | LensInspector Props | Shared Props | Delta |
|-----------|---------------------|--------------|-------|
| Toggle | checked, onChange, label, description | ✅ Match | None |
| Slider | value, onChange, label, min, max, valueLabel | Need `valueLabel` | Add prop |
| Select | value, onChange, label, options | ✅ Match | None |
| Checkbox | checked, onChange, label | ✅ Match | None |
| InfoCallout | message, variant | ✅ Match | None |

### 3.2 DiaryInspector Stub

**File:** `src/explore/DiaryInspector.tsx` (new)

```tsx
interface DiaryInspectorProps {
  entryId?: string;
}

export function DiaryInspector({ entryId }: DiaryInspectorProps) {
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 
                        border border-border-light dark:border-slate-700 
                        flex items-center justify-center">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">
            menu_book
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Agent Diary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily reflections from Grove agents
          </p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="p-6 bg-stone-50 dark:bg-slate-900/50 rounded-xl 
                      border border-dashed border-slate-300 dark:border-slate-700
                      text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">
          auto_stories
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Diary entries coming soon
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Agents will share their daily discoveries here
        </p>
      </div>
    </div>
  );
}
```

### 3.3 NodeInspector Enhancement

**File:** `src/workspace/Inspector.tsx` (inline case)

Current inline stub is sufficient. Verify token usage.

### 3.4 Inspector Router Update

**File:** `src/workspace/Inspector.tsx`

```tsx
// Add import
import { DiaryInspector } from '../explore/DiaryInspector';

// Add case in renderContent()
case 'diary':
  return <DiaryInspector entryId={inspector.mode.entryId} />;
```

---

## 4. Token Specifications

### 4.1 Token Audit

Components to verify use `--grove-*` tokens:

| Component | Current | Target |
|-----------|---------|--------|
| LensInspector | Mixed Tailwind | `--grove-surface`, `--grove-text`, etc. |
| JourneyInspector | Mixed Tailwind | Same |
| SproutInspector | Mixed Tailwind | Same |
| DiaryInspector | N/A (new) | Use tokens from start |
| Shared forms | Mixed Tailwind | Update to tokens |

### 4.2 Token Mapping

From globals.css (existing):

```css
/* These exist and should be used */
--color-primary: #4d7c0f;
--color-surface-dark: #1e293b;
--color-border-dark: #334155;
```

Tailwind classes to replace:

| Current Class | Token Replacement |
|---------------|-------------------|
| `bg-slate-900/50` | `bg-[var(--grove-surface)]` or `dark:bg-surface-dark/50` |
| `border-slate-700` | `border-border-dark` |
| `text-slate-700 dark:text-slate-200` | Keep (acceptable pattern) |
| `bg-primary` | Keep (uses token via Tailwind) |

### 4.3 Shared Form Token Update

Update `/shared/forms/Toggle.tsx` etc. to use semantic colors:

```tsx
// Before
className="bg-stone-50 dark:bg-slate-900/50 border border-border-light dark:border-slate-700"

// After (option A - CSS variable)
className="bg-[var(--grove-inspector-surface)] border border-[var(--grove-inspector-border)]"

// After (option B - Tailwind extend)
className="bg-grove-surface border border-grove-border"
```

**Decision:** Use Option A (CSS variables) for this sprint. Tailwind extend is future optimization.

---

## 5. Acceptance Criteria

### 5.1 IA Update

- [ ] NavigationSidebar shows: Terminal → Lenses → Journeys → Nodes → Diary → Sprouts
- [ ] Clicking each nav item routes to correct view
- [ ] Diary shows placeholder content
- [ ] Sprouts no longer appears under Cultivate (or Cultivate is hidden)

### 5.2 Inspector Refactor

- [ ] LensInspector imports from /shared/forms and /shared/feedback
- [ ] No inline Toggle/Slider/Select/Checkbox/InfoCallout definitions
- [ ] Functionality unchanged (toggle works, slider works, etc.)

### 5.3 DiaryInspector

- [ ] DiaryInspector.tsx created in /src/explore/
- [ ] Renders placeholder UI with icon and message
- [ ] Router case added in Inspector.tsx

### 5.4 Token Usage

- [ ] All inspector files use semantic tokens or acceptable Tailwind patterns
- [ ] No hardcoded hex colors in inspector files
- [ ] Shared form components updated if needed

---

## 6. Files Changed

### New Files
- `src/explore/DiaryInspector.tsx`
- `src/explore/DiaryList.tsx` (content area stub)

### Modified Files
- `src/workspace/NavigationSidebar.tsx` — IA tree update
- `src/workspace/Inspector.tsx` — Add diary case
- `src/explore/LensInspector.tsx` — Refactor to shared
- `src/shared/forms/Slider.tsx` — Add valueLabel prop (if needed)

### Audit Only (token check)
- `src/explore/JourneyInspector.tsx`
- `src/cultivate/SproutInspector.tsx`
- `src/shared/forms/*.tsx`
- `src/shared/feedback/*.tsx`

---

## 7. Test Plan

### 7.1 Manual Testing

| Test | Steps | Expected |
|------|-------|----------|
| Nav structure | Open /terminal, expand Explore → Grove Project | See Terminal, Lenses, Journeys, Nodes, Diary, Sprouts |
| Terminal nav | Click Terminal in nav | ExploreChat visible |
| Diary nav | Click Diary in nav | Diary placeholder visible |
| Lens inspector | Click lens icon in header | LensInspector opens, toggle/slider work |
| Journey inspector | Start journey, click info | JourneyInspector opens |

### 7.2 Regression

- Genesis flow still works (tree click → lens select → headline collapse)
- ExploreChat styling unchanged (uses --chat-* tokens from PR #34)
- Sprout capture still works

---

## 8. Dependencies

| Dependency | Status |
|------------|--------|
| PR #34 (chat tokens) | ✅ Merged |
| Shared form components | ✅ Exist |
| Inspector router | ✅ Exists |
| WorkspaceUIContext | ✅ Exists |

---

## 9. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Shared component prop mismatch | Low | Medium | Check props before refactor |
| View routing gaps | Medium | Low | Add stub views as needed |
| Token cascade issues | Low | Medium | Test dark mode thoroughly |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| Knowledge Field | A RAG-indexed project domain (e.g., "Grove Project") |
| Inspector | Right-column detail panel for selected items |
| Stub | Placeholder implementation for future functionality |
