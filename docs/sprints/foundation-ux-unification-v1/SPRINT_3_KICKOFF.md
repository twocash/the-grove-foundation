# Grove Workspace: Sprint 3 Kickoff

**Copy and paste this entire message into a new Claude Code session.**

---

## SPRINT 3: Visual Polish + Collection Controls + Inspector Enhancement

Sprint 2 established the IA and basic views. Now we need to:
1. Fix the visual styling to match the design system
2. Add the universal collection controls (Search/Filter/Sort)
3. Enhance the Inspector with configurable options
4. Implement proper light/dark mode toggle

### CRITICAL: Design System Update

Reference the mockup at: `docs/sprints/foundation-ux-unification-v1/mockup-lens-picker.html`

The current implementation has styling issues. Here's the correct design system:

**Color Palette (supports light AND dark mode):**

```css
/* Light mode (default) */
--background-light: #f8f7f5;      /* Warm paper/cream */
--surface-light: #ffffff;          /* Cards, panels */
--border-light: #e7e5e4;           /* Subtle borders */

/* Dark mode */
--background-dark: #0f172a;        /* Deep slate */
--surface-dark: #1e293b;           /* Elevated surfaces */
--border-dark: #334155;            /* Dark borders */

/* Primary accent */
--primary: #4d7c0f;                /* Grove green (emerald-700ish) */

/* Text - Light mode */
--text-primary-light: #1e293b;     /* slate-800 */
--text-secondary-light: #64748b;   /* slate-500 */
--text-muted-light: #94a3b8;       /* slate-400 */

/* Text - Dark mode */
--text-primary-dark: #f1f5f9;      /* slate-100 */
--text-secondary-dark: #94a3b8;    /* slate-400 */
--text-muted-dark: #64748b;        /* slate-500 */
```

**Typography:**
- Font stack: `Inter, sans-serif` (UI), `Merriweather, serif` (brand), `JetBrains Mono` (code)
- Use Google Material Symbols for icons (not Lucide)

**Card styling with accent colors:**
```css
/* Each lens/category gets a distinct accent */
--accent-freestyle: #3b82f6;       /* blue */
--accent-citizen: #dc2626;         /* red */
--accent-academic: #10b981;        /* emerald */
--accent-engineer: #6366f1;        /* indigo */
```

### NEW PATTERN: Collection Controls Header

Every collection view (Lenses, Nodes, Journeys, Sprouts) should have this header pattern:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Choose Your Lens                                                            │
│  Select a perspective to explore The Grove. Each lens shapes how ideas      │
│  are presented to you, filtering the noise to match your intent.            │
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────┐  ┌─────────┐             │
│  │ 🔍 Search perspectives...       │  │ Filter  │  │ Sort    │             │
│  └─────────────────────────────────┘  └─────────┘  └─────────┘             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ● ACTIVE LENS: Concerned Citizen                                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Components to create:**

```typescript
// src/shared/CollectionHeader.tsx
interface CollectionHeaderProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  onSearch: (query: string) => void;
  filterOptions?: FilterOption[];
  sortOptions?: SortOption[];
  activeIndicator?: React.ReactNode;  // e.g., "ACTIVE LENS: Concerned Citizen"
}

// src/shared/SearchInput.tsx
interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

// src/shared/FilterButton.tsx
// src/shared/SortButton.tsx
```

### ENHANCED: Inspector Panel

The Inspector should show configuration options, not just static details:

**Lens Inspector example:**
```
┌─────────────────────────────────────┐
│ Lens Inspector                   ✕  │
├─────────────────────────────────────┤
│  [🏠] Concerned Citizen             │
│       Societal Impact Focus         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Lens Active          [====○]   ││
│  │ Currently in use               ││
│  └─────────────────────────────────┘│
│                                     │
│  CONFIGURATION                      │
│  ─────────────────────────────────  │
│                                     │
│  Tone Intensity              High   │
│  [════════════════●══]              │
│                                     │
│  Primary Source                     │
│  [Public Policy & Ethics    ▾]      │
│                                     │
│  Include Opinion Pieces      [✓]    │
│                                     │
│  ─────────────────────────────────  │
│  ⚠️ This lens prioritizes social   │
│     context over technical specs.   │
│     Some code blocks may be hidden. │
└─────────────────────────────────────┘
```

**Inspector views needed:**
- `LensInspector` — Toggle active, tone slider, source dropdown, checkboxes
- `NodeInspector` — Related journeys, contained hubs, start journey button
- `JourneyInspector` — Progress, steps preview, continue button
- `SproutInspector` — Full content, provenance, promote/delete actions

### THEME TOGGLE

Add a theme toggle button in the header:

```typescript
// In WorkspaceHeader.tsx
<button 
  onClick={() => document.documentElement.classList.toggle('dark')}
  className="p-2 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-md"
>
  <span className="material-symbols-outlined dark:hidden">dark_mode</span>
  <span className="material-symbols-outlined hidden dark:inline">light_mode</span>
</button>
```

### Sprint 3 Deliverables

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| Design system update | CSS variables, Tailwind config | 🔴 Do first |
| Material Symbols | Replace Lucide with Google icons | 🔴 Do first |
| Theme toggle | Light/dark mode switch in header | 🔴 Do first |
| CollectionHeader | Reusable search/filter/sort bar | 🟡 Core pattern |
| SearchInput | Typeahead search component | 🟡 Core pattern |
| FilterButton/SortButton | Dropdown controls | 🟡 Core pattern |
| LensInspector | Full configuration panel | 🟡 High value |
| Card accent colors | Per-lens/category colors | 🟢 Polish |
| Active indicator bar | Shows current lens/journey | 🟢 Polish |

### Task Sequence

**Phase 1: Design System Foundation**
1. Update `tailwind.config.ts` with new color palette
2. Update `styles/globals.css` with CSS variables
3. Add Google Fonts (Inter, Merriweather, JetBrains Mono)
4. Add Material Symbols icon font
5. Add theme toggle to WorkspaceHeader

**Phase 2: Collection Controls Pattern**
1. Create `CollectionHeader.tsx` with title, description, controls
2. Create `SearchInput.tsx` with typeahead support
3. Create `FilterButton.tsx` and `SortButton.tsx`
4. Create `ActiveIndicator.tsx` for current state display
5. Apply pattern to LensPicker, NodeGrid, JourneyList, SproutGrid

**Phase 3: Inspector Enhancement**
1. Create `LensInspector.tsx` with configuration controls
2. Add toggle switch component
3. Add slider component  
4. Add dropdown select component
5. Add info callout component (the amber warning box)

**Phase 4: Card Polish**
1. Add accent colors to lens cards (blue, red, emerald, etc.)
2. Add hover effects (scale icon, shadow)
3. Add selected state styling (border color, checkmark)
4. Ensure cards look good in both light and dark mode

### Reference Implementation

The mockup HTML is at: `docs/sprints/foundation-ux-unification-v1/mockup-lens-picker.html`

Key classes to copy:
- Card: `p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg`
- Selected card: `border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-[#3f1919]`
- Search input: `bg-stone-100 dark:bg-slate-900 border border-border-light dark:border-border-dark px-2 py-1.5 rounded-md`
- Button: `px-3.5 py-2.5 bg-surface-light dark:bg-slate-900 border border-border-light dark:border-slate-700 rounded-lg`

### Tailwind Config Update

```javascript
// tailwind.config.ts
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4d7c0f',
        'background-light': '#f8f7f5',
        'background-dark': '#0f172a',
        'surface-light': '#ffffff',
        'surface-dark': '#1e293b',
        'border-light': '#e7e5e4',
        'border-dark': '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

### Icon Migration

Replace Lucide icons with Material Symbols:

```html
<!-- Add to index.html -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
```

```typescript
// Usage
<span className="material-symbols-outlined">explore</span>
<span className="material-symbols-outlined filled">eyeglasses</span>  // filled variant

// Icon mapping
// Lucide → Material Symbols
// Compass → explore
// Sprout → eco
// Users → group
// Zap → bolt
// Search → search
// Filter → filter_list
// Settings → settings
// X → close
```

### Acceptance Criteria

- [ ] Light mode is clean paper/cream aesthetic
- [ ] Dark mode is deep slate, not pure black
- [ ] Theme toggle works in header
- [ ] All collection views have Search/Filter/Sort bar
- [ ] Typeahead search filters items in real-time
- [ ] Active lens indicator shows current state
- [ ] Lens cards have distinct accent colors
- [ ] Selected card has visual treatment (border, checkmark)
- [ ] LensInspector shows configuration options
- [ ] Inspector controls actually work (toggle, slider, dropdown)
- [ ] Material Symbols icons used throughout
- [ ] No light gray violations in dark mode
- [ ] No dark gray violations in light mode

### Files to Create

```
src/shared/
├── CollectionHeader.tsx     # Title + description + controls
├── SearchInput.tsx          # Typeahead search
├── FilterButton.tsx         # Filter dropdown
├── SortButton.tsx           # Sort dropdown
├── ActiveIndicator.tsx      # Current state bar
├── Toggle.tsx               # On/off switch
├── Slider.tsx               # Range input
└── Select.tsx               # Dropdown select

src/explore/
├── LensInspector.tsx        # Enhanced lens config panel

src/workspace/
├── ThemeToggle.tsx          # Light/dark switch
```

### Files to Modify

```
tailwind.config.ts           # New color palette
styles/globals.css           # CSS variables
index.html                   # Google Fonts + Material Symbols
src/workspace/WorkspaceHeader.tsx  # Add theme toggle
src/explore/LensPicker.tsx   # Add CollectionHeader, accent colors
src/explore/NodeGrid.tsx     # Add CollectionHeader
src/explore/JourneyList.tsx  # Add CollectionHeader
src/cultivate/SproutGrid.tsx # Add CollectionHeader
```

### Reference Files

Copy the mockup to the sprint docs for reference:
```
docs/sprints/foundation-ux-unification-v1/
├── mockup-lens-picker.html   # Full HTML/CSS reference
├── mockup-lens-picker.png    # Screenshot
```

**Start with Phase 1 (Design System), test theme toggle, then build collection controls pattern.**
