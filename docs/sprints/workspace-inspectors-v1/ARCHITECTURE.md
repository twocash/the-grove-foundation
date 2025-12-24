# Sprint 3: Workspace Inspectors v1 — Architecture Decisions

**Sprint:** workspace-inspectors-v1
**Date:** 2024-12-24

---

## ADR-001: Information Architecture v0.15

### Context

The current IA (v0.14.2) groups exploration tools under a "Grove Project" knowledge field, but:
- Terminal is implicit (default view, not in nav)
- Diary doesn't exist
- Sprouts live under Cultivate, not Project

### Decision

Restructure navigation to make all Project-scoped tools explicit children:

```
Explore
└── Grove Project
    ├── Terminal     ← NEW (explicit nav item)
    ├── Lenses
    ├── Journeys
    ├── Nodes
    ├── Diary        ← NEW
    └── Sprouts      ← MOVED from Cultivate
```

### Consequences

- **Positive:** Clear mental model — everything under Project relates to that knowledge field
- **Positive:** Terminal now discoverable in nav (was hidden as default)
- **Negative:** Cultivate section loses primary content (but keeps Commons)
- **Neutral:** More nav items under Project (6 vs 3)

### Implementation

```typescript
// NavigationSidebar.tsx - navigationTree changes
groveProject: {
  id: 'groveProject',
  label: 'Grove Project',
  icon: 'forest',
  view: 'terminal',  // Default when clicking Project header
  children: {
    terminal: { id: 'terminal', label: 'Terminal', icon: 'message', view: 'terminal' },
    lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
    journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
    nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
    diary: { id: 'diary', label: 'Diary', icon: 'book', view: 'diary-list' },
    sprouts: { id: 'sprouts', label: 'Sprouts', icon: 'sprout', view: 'sprout-grid' },
  },
}
```

---

## ADR-002: Inspector Component Architecture

### Context

Three patterns exist for inspector content:
1. **Inline in Inspector.tsx** — Node, Diary-entry, Chat-context cases
2. **Dedicated components** — LensInspector, JourneyInspector, SproutInspector
3. **Foundation inspectors** — Separate system in /foundation/inspectors/

### Decision

Standardize on **dedicated component pattern** for all inspector types.

```
src/explore/
├── LensInspector.tsx      ✅ Exists
├── JourneyInspector.tsx   ✅ Exists  
├── DiaryInspector.tsx     🆕 Create
└── NodeInspector.tsx      🆕 Create (extract from inline)

src/cultivate/
└── SproutInspector.tsx    ✅ Exists
```

### Consequences

- **Positive:** Consistent pattern, easier to find/modify
- **Positive:** Each inspector can have focused logic
- **Negative:** More files (acceptable trade-off)

### Implementation

Extract inline cases from Inspector.tsx into dedicated files.

---

## ADR-003: Shared Form Component Usage

### Context

LensInspector defines inline Toggle, Slider, Select, Checkbox, InfoCallout components (~119 lines) that duplicate `/shared/forms/` implementations.

### Decision

Refactor LensInspector to import from shared library:

```typescript
// Before
function Toggle({ checked, onChange, label, description }: ToggleProps) { ... }

// After
import { Toggle, Slider, Select, Checkbox } from '@/shared/forms';
import { InfoCallout } from '@/shared/feedback';
```

### Consequences

- **Positive:** Single source of truth for form components
- **Positive:** ~119 lines removed from LensInspector
- **Negative:** Must ensure shared components have all needed props
- **Action:** Add `valueLabel` prop to shared Slider if missing

---

## ADR-004: Token Strategy for Inspectors

### Context

Current inspector styling uses mixed patterns:
- Direct Tailwind utilities (`bg-slate-900/50`)
- Semantic tokens via Tailwind (`border-border-dark`)
- CSS variables (`var(--grove-text)`)

### Decision

Use **CSS variables for inspector-specific styling**, keeping semantic Tailwind tokens for common patterns.

```tsx
// Preferred patterns

// Background surfaces
className="bg-stone-50 dark:bg-slate-900/50"  // Keep - clear light/dark
className="bg-[var(--grove-surface)]"          // Use for inspector-specific

// Borders
className="border-border-light dark:border-slate-700"  // Keep - semantic
className="border-[var(--grove-inspector-border)]"     // If needed

// Text
className="text-slate-700 dark:text-slate-200"  // Keep - readable
className="text-[var(--grove-text)]"            // For consistency
```

### Consequences

- **Positive:** Maintains dark mode compatibility
- **Positive:** Allows future theming via CSS variable changes
- **Negative:** Mixed patterns (acceptable for gradual migration)

### Future

Full token migration to Tailwind `extend` config in Sprint 5 (Cross-Surface Consistency).

---

## ADR-005: Content View Routing

### Context

ContentRouter maps navigation paths to view IDs, then conditionally renders components.

### Decision

Add new paths to viewMap and corresponding renders:

```typescript
// ContentRouter.tsx additions

const viewMap: Record<string, string> = {
  // ... existing
  'explore.groveProject.terminal': 'terminal',
  'explore.groveProject.diary': 'diary-list',
  'explore.groveProject.sprouts': 'sprout-grid',
};

// In render:
{viewId === 'diary-list' && <DiaryList />}
```

### Consequences

- **Positive:** Consistent routing pattern
- **Neutral:** DiaryList is a stub initially

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GroveWorkspace                               │
├──────────────┬─────────────────────────────┬───────────────────────┤
│ Navigation   │        ContentRouter        │      Inspector        │
│ Sidebar      │                             │                       │
│              │                             │                       │
│ ▼ Explore    │  ┌─────────────────────┐   │  ┌─────────────────┐  │
│   ▼ Project  │  │ ExploreChat         │   │  │ LensInspector   │  │
│     Terminal │  │ (Terminal view)     │   │  │                 │  │
│     Lenses   │  └─────────────────────┘   │  │ Uses:           │  │
│     Journeys │  ┌─────────────────────┐   │  │ - Toggle        │  │
│     Nodes    │  │ DiaryList           │   │  │ - Slider        │  │
│     Diary    │  │ (Diary view - stub) │   │  │ - Select        │  │
│     Sprouts  │  └─────────────────────┘   │  │ - InfoCallout   │  │
│              │                             │  │ from /shared/   │  │
│ ▼ Do         │  ┌─────────────────────┐   │  └─────────────────┘  │
│   Chat [Soon]│  │ LensPicker          │   │                       │
│   Apps [Soon]│  │ JourneyList         │   │  ┌─────────────────┐  │
│   Agents     │  │ NodeGrid            │   │  │ DiaryInspector  │  │
│              │  │ SproutGrid          │   │  │ (stub)          │  │
│ ▼ Cultivate  │  │ VillageFeed         │   │  └─────────────────┘  │
│   Commons    │  └─────────────────────┘   │                       │
│              │                             │                       │
└──────────────┴─────────────────────────────┴───────────────────────┘
```

---

## File Structure (Post-Sprint)

```
src/
├── explore/
│   ├── ExploreChat.tsx         # Terminal view (existing)
│   ├── LensPicker.tsx          # Lens selection (existing)
│   ├── LensInspector.tsx       # MODIFIED - uses shared components
│   ├── JourneyList.tsx         # Journey list view (existing)
│   ├── JourneyInspector.tsx    # Journey detail (existing)
│   ├── NodeGrid.tsx            # Node grid view (existing)
│   ├── NodeInspector.tsx       # NEW - extracted stub
│   ├── DiaryList.tsx           # NEW - stub view
│   └── DiaryInspector.tsx      # NEW - stub inspector
├── cultivate/
│   ├── SproutGrid.tsx          # Sprout view (existing)
│   └── SproutInspector.tsx     # Sprout detail (existing)
├── workspace/
│   ├── NavigationSidebar.tsx   # MODIFIED - IA v0.15
│   ├── ContentRouter.tsx       # MODIFIED - new routes
│   └── Inspector.tsx           # MODIFIED - new cases
└── shared/
    ├── forms/
    │   ├── Slider.tsx          # MODIFIED - add valueLabel prop
    │   └── ...
    └── feedback/
        └── ...
```
