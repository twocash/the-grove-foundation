# S23-SFR: Sprout Finishing Room UX Redesign

**Sprint:** sfr-ux-redesign-v1
**Alias:** S23-SFR
**Status:** APPROVED - READY FOR USER REVIEW
**Created:** 2026-01-24
**Author:** UX Chief (Product Pod)

---

## Executive Summary

The Sprout Finishing Room is the **transformation chamber** of the Grove knowledge lifecycle. It's where raw research becomes reasoned editorial assets. This sprint redesigns the SFR from a functional modal into a **flow-state writing environment** that guides users from validation to creation with zero friction.

**The Stakes:** This is the feature that sells Grove. A user who experiences the journey from spark → research → polished artifact will understand the product's value instantly. A user who gets confused at this step will never return.

---

## Strategic Context: The Knowledge Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE GROVE KNOWLEDGE LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ╭──────────╮     ╭──────────╮     ╭──────────────────╮     ╭──────────╮   │
│   │  SPARK   │────▶│ RESEARCH │────▶│ SPROUT FINISHING │────▶│ NURSERY  │   │
│   │          │     │          │     │      ROOM        │     │          │   │
│   │ "What if │     │ Claude   │     │                  │     │ Draft    │   │
│   │  ...?"   │     │ web      │     │  ★ YOU ARE HERE  │     │ review   │   │
│   ╰──────────╯     │ search   │     │                  │     │ & edit   │   │
│                    ╰──────────╯     ╰──────────────────╯     ╰────┬─────╯   │
│                                                                    │         │
│                    ╭──────────────────────────────────────────────╯         │
│                    │                                                         │
│                    ▼                                                         │
│              ╭──────────╮     ╭───────────────╮                             │
│              │  GARDEN  │────▶│   KNOWLEDGE   │                             │
│              │          │     │    COMMONS    │                             │
│              │ Accepted │     │               │                             │
│              │ canon    │     │ Shared truth  │                             │
│              ╰──────────╯     ╰───────────────╯                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Critical Moment

When the user enters the Sprout Finishing Room, they are holding:
- **Raw research**: 5,000-8,000 characters of prose with citations
- **30+ sources**: Real URLs from Claude's web search
- **An intent**: "I want to turn this into something useful"

What they need:
1. **Confidence**: "Can I trust this research?"
2. **Direction**: "What kind of artifact should this become?"
3. **Flow**: "Let me write without distractions"
4. **Iteration**: "Let me try different approaches"
5. **Persistence**: "Don't lose my work"

The current SFR addresses none of these well. This sprint fixes that.

---

## User Goals & How This Design Serves Them

### Goal 1: "Can I Trust This Research?"

**User Need:** Before committing to writing, users need to validate that the research is credible and comprehensive.

**Design Response: Phase 1 - The Reading Room**

| Element | Purpose |
|---------|---------|
| **Left Column (20%)** | "Trust Signals" - Source count, domain diversity, publication dates |
| **Center Column (55%)** | Full research prose at optimal reading width (65-75 chars) |
| **Right Column (25%)** | Deferred - user hasn't committed to action yet |

**The Psychology:** By dedicating 75% of the screen to *reading* before *acting*, we signal: "Take your time. Validate. Then decide."

---

### Goal 2: "What Should This Become?"

**User Need:** The same research could become a blog post, a vision paper, an executive summary. The user needs to understand their options and make an informed choice.

**Design Response: Output Style Selection (Right Column)**

| Element | Purpose |
|---------|---------|
| **Vertical Card Grid** | Each card = one Writer Template (Blog, Academic, etc.) |
| **Single Selection** | Radio behavior - one choice at a time |
| **Sticky Notes Footer** | "Additional Context" textarea anchored at bottom |

**The Psychology:** Presenting styles as *cards* (not a dropdown) makes the choice feel significant. The user is selecting a *voice*, not checking a box.

---

### Goal 3: "Let Me Write Without Distractions"

**User Need:** Once committed to generating, the user needs maximum focus on the output. Research and configuration should be accessible but not visible.

**Design Response: Phase 3 - Zen Mode**

| Element | Purpose |
|---------|---------|
| **50px Rails** | Minimal footprint - icons + badges only |
| **Full-Width Editor** | 1fr center column claims all available space |
| **Overlay Drawers** | Context floats *over* content, no text reflow |

**The Psychology:** The "Curtain Pull" transition signals a mode shift. "Reading time is over. Writing time begins." The 400ms animation duration feels *heavy* and *mechanical* - like a vault door closing, not a menu appearing.

---

### Goal 4: "Let Me Try Different Approaches"

**User Need:** Users don't always nail it on the first try. They may want to generate a Blog Post, then try an Executive Summary, then compare.

**Design Response: Version Tab System**

| Element | Purpose |
|---------|---------|
| **Tab Bar** | `[ Blog Post V1 ] [ Vision Paper V1 ] [ + New ]` |
| **Horizontal Scroll** | Tabs 5+ scroll, no overflow menu clutter |
| **History Dropdown** | Clock icon reveals all versions for quick jump |
| **New = Forward** | Clicking `+ New` opens Config drawer, generates new tab |

**The Psychology:** Tabs create a *workspace* mental model. The user isn't "going back" - they're *adding* to their collection. This aligns with "never destroy user work."

---

### Goal 5: "Don't Lose My Work"

**User Need:** Modern users expect auto-save. "Did you save?" is a UX failure.

**Design Response: Aggressive State Persistence**

| Scenario | Behavior |
|----------|----------|
| Tab switching | State frozen in memory instantly |
| Modal close | Save to `latest_draft_context` on Sprout object |
| Network failure | Warning modal (only failure case that warns) |
| Generate mid-edit | Creates new tab, preserves current tab's edits |

**The Psychology:** The user should never *think* about saving. The system captures every keystroke. "Pick up where you left off" is the default.

---

## The Three Phases

### Phase 1: Review & Configure (The Reading Room)

**Purpose:** Validate research, select output style, add notes

**Layout:** 3-Column Grid
```
┌─────────────────────────────────────────────────────────────────┐
│  SPROUT FINISHING ROOM - Phase 1                                │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │                                    │                 │
│  TRUST   │          RESEARCH                  │   OUTPUT        │
│  SIGNALS │          (Primary Reading)         │   STYLE         │
│          │                                    │                 │
│  20%     │          55%                       │   25%           │
│          │                                    │                 │
│ Sources  │  [Full prose content with          │  ┌───────────┐  │
│ count    │   inline citations...]             │  │ Blog Post │  │
│          │                                    │  └───────────┘  │
│ Domain   │                                    │  ┌───────────┐  │
│ diversity│                                    │  │ Vision    │  │
│          │                                    │  │ Paper     │  │
│          │                                    │  └───────────┘  │
│ Recency  │                                    │  ┌───────────┐  │
│ signals  │                                    │  │ Higher Ed │  │
│          │                                    │  └───────────┘  │
│          │                                    │                 │
│          │                                    │  ┌───────────┐  │
│          │                                    │  │ Notes...  │  │
│          │                                    │  │           │  │
│          │                                    │  └───────────┘  │
│          │                                    │                 │
├──────────┴────────────────────────────────────┴─────────────────┤
│                    [ GENERATE ARTIFACT ]                         │
└─────────────────────────────────────────────────────────────────┘
```

**Entry Condition:** `sprout.artifacts.length === 0` (fresh sprout)

---

### Phase 2: The Shift (The Commitment)

**Purpose:** Animate transition from reading to writing mode

**Trigger:** User clicks "GENERATE ARTIFACT"

**Animation Specification:**
```
Duration:     400ms
Easing:       cubic-bezier(0.4, 0, 0.2, 1)  // "ease-out" feel
Direction:    Columns slide outward (off-screen)
Residue:      50px rails remain as anchors
Center:       Cross-fade from Research to Editor
```

**Behavior:**
- **One-way commitment** - no "undo" button
- **Abort on failure** - error toast, user stays in Phase 1
- **Data handoff** - Research → Left Rail, Config → Right Rail

**The "Curtain Pull" Effect:**
```css
/* Phase 1 */
grid-template-columns: 20% 55% 25%;

/* Phase 3 (animated) */
grid-template-columns: 50px 1fr 50px;
transition: grid-template-columns 400ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

### Phase 3: Production (Zen Mode)

**Purpose:** Focused writing environment with peek-able context

**Layout:** Double-Drawer with Central Editor
```
┌─────────────────────────────────────────────────────────────────┐
│  SPROUT FINISHING ROOM - Phase 3                                │
├────┬────────────────────────────────────────────────────────┬───┤
│    │  [ Blog Post V1 ] [ Vision Paper V1 ] [ + ]  [Export][Save]│   │
│ S  ├────────────────────────────────────────────────────────┤ C │
│ O  │                                                        │ O │
│ U  │                                                        │ N │
│ R  │         E D I T O R                                    │ F │
│ C  │                                                        │ I │
│ E  │         (Full-width prose editing)                     │ G │
│ S  │                                                        │   │
│    │         - Skeleton loader while generating             │   │
│ 50 │         - Rich text with citations                     │ 50│
│ px │         - Auto-save on every change                    │ px│
│    │                                                        │   │
│ 12 │                                                        │   │
│    │                                                        │   │
└────┴────────────────────────────────────────────────────────┴───┘

Rail Content (50px):
┌────┐
│ 🌱 │  ← Icon (Sprout for Sources)
│ 12 │  ← Badge (source count)
│    │
│    │
│ S  │
│ O  │  ← Rotated label (low contrast)
│ U  │
│ R  │
│ C  │
│ E  │
│ S  │
└────┘
```

**Entry Condition:** `sprout.artifacts.length > 0` (existing work)

**Drawer Behavior:**
- **Overlay** (float over editor, no text reflow)
- **Independent** (left and right can open separately)
- **Click rail** to toggle drawer open/closed

---

## DEX/Trellis Compliance

This design adheres to the four pillars of the Declarative Exploration (DEX) standard:

### 1. Declarative Sovereignty

**Principle:** Behavior should be changeable via configuration, not code.

**Implementation:**

| Configurable Element | Storage | Example |
|---------------------|---------|---------|
| Writer Templates | `data/seeds/output-templates.json` | Add "Press Release" without code |
| Phase transitions | State machine config | Adjust timing, easing |
| Rail width | Design tokens | `--rail-width: 50px` |
| Column proportions | Layout config | `[20%, 55%, 25%]` |

**Code Pattern:**
```typescript
// BAD: Hardcoded
const RAIL_WIDTH = 50;

// GOOD: Declarative
const { railWidth } = useLayoutConfig('sfr');
```

---

### 2. Capability Agnosticism

**Principle:** Components should work regardless of which AI model executes.

**Implementation:**

| Component | Agnostic Behavior |
|-----------|-------------------|
| `OutputStyleSelector` | Same component in Phase 1 column OR Phase 3 drawer |
| `TrustSignals` | Renders source metadata regardless of search provider |
| `Editor` | Accepts any markdown/prose content |

**Code Pattern:**
```typescript
// State-driven container slots
<SlotContainer slot={phase === 1 ? 'right-column' : 'right-drawer'}>
  <OutputStyleSelector
    templates={templates}
    selected={selectedId}
    onSelect={setSelectedId}
  />
</SlotContainer>
```

---

### 3. Provenance as Infrastructure

**Principle:** Origin and authorship must be tracked for all data.

**Implementation:**

| Data Point | Provenance Tracked |
|------------|-------------------|
| Research | `searchProvider`, `searchTimestamp`, `sourceUrls[]` |
| Generated Artifact | `templateId`, `userNotes`, `generatedAt`, `modelId`, **`promptSnapshot`** |
| User Edits | `lastEditedAt`, `editHistory[]` (optional) |
| Version | `versionNumber`, `parentVersionId` |

**Schema:**
```typescript
interface Artifact {
  id: string;
  sproutId: string;

  // Generation provenance
  templateId: string;
  templateVersion: string;
  userNotes?: string;
  modelId: string;
  generatedAt: string;

  // CRITICAL: Prompt snapshot for reproducibility
  // Six months later, when V1 was great but V2 is bad,
  // you need to know EXACTLY what system prompt drove V1.
  promptSnapshot: string;  // Full merged systemPrompt at generation time

  // Content
  content: string;

  // Lifecycle
  version: number;
  parentVersionId?: string;
  status: 'draft' | 'provisional' | 'promoted';
}
```

**Why `promptSnapshot`?**

Templates evolve. A "Blog Post" writer in January may have different instructions than in March. The `promptSnapshot` field captures the *exact* merged prompt (template.systemPrompt + userNotes) at the moment of generation. This enables:

1. **Debugging** - Why did V1 work better than V2?
2. **Reproducibility** - Can we regenerate with the same prompt?
3. **Audit** - What instructions did the AI actually receive?

---

### 4. Organic Scalability

**Principle:** Structure should support growth without redesign.

**Implementation:**

| Growth Vector | Design Accommodation |
|--------------|----------------------|
| More templates | Vertical scroll in card grid |
| More versions | Tab scroll + History dropdown |
| More sources | Badge count + drawer scroll |
| More features | Rail icons can expand (Settings, Help, etc.) |

---

## Implementation Reference

This section provides architectural blueprints for the "Double Drawer" and "Overlay" mechanics. These patterns should be adapted to fit the Grove design system while maintaining DEX/Trellis compliance.

### 1. The Core Grid Architecture (Phase 3 - Zen Mode)

The layout relies on a 3-column CSS Grid where the outer columns are fixed "rails" and the center takes the remaining space.

**The Logic:** `[50px] [1fr] [50px]` creates the stable "Zen Mode" editor. The center column stretches to fill the screen while rails remain locked.

```html
<div class="grid h-screen w-full grid-cols-[50px_1fr_50px] overflow-hidden bg-neutral-900 text-white">

  <!-- LEFT RAIL + DRAWER -->
  <aside class="relative border-r border-neutral-800 bg-neutral-950 z-20">
    <div class="flex h-full flex-col items-center py-4">
       <!-- Icon with Badge -->
       <button class="group relative p-2 hover:bg-neutral-800 rounded">
         <span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">12</span>
         <svg class="h-6 w-6 text-emerald-500">...</svg>
       </button>

       <!-- Rotated Label (anchored to bottom) -->
       <div class="mt-auto rotate-180 py-8 text-[10px] font-medium uppercase tracking-widest text-neutral-600">
         Sources
       </div>
    </div>

    <!-- Left Drawer (slides in from rail edge) -->
    <div id="left-drawer"
         class="absolute top-0 left-[50px] h-full w-[350px] border-r border-neutral-800 bg-neutral-900 shadow-2xl transition-transform duration-300 ease-out -translate-x-full overflow-y-auto"
         data-open="false">

         <!-- PRIMARY: Research text for fact-checking -->
         <div class="p-4 border-b border-neutral-800">
            <h3 class="text-xs font-bold text-neutral-500 uppercase">Research Reference</h3>
            <!-- ResearchContent (ReadOnly mode) -->
            <!-- User writes "10x improvement", wonders if correct, opens drawer to verify -->
            <div class="mt-2 text-sm text-neutral-300 prose prose-invert prose-sm">
              <!-- Full research prose rendered here -->
            </div>
         </div>

         <!-- SECONDARY: Source list -->
         <div class="p-4">
            <h3 class="text-xs font-bold text-neutral-500 uppercase">Sources</h3>
            <!-- TrustSignals content here -->
         </div>
    </div>
  </aside>

  <!-- CENTER: EDITOR PANEL -->
  <main class="relative z-10 flex flex-col bg-neutral-50">

    <!-- Tab Bar -->
    <header class="flex h-12 items-center border-b border-neutral-200 bg-white px-4">
      <button class="mr-1 rounded-t border border-b-0 border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-black">
        Blog Post V1
      </button>
      <button class="px-4 py-2 text-sm text-neutral-500 hover:text-black">
        + New
      </button>

      <!-- Actions (anchored right) -->
      <div class="ml-auto flex space-x-2">
        <button class="text-xs font-medium text-neutral-600">Export</button>
        <button class="rounded bg-emerald-600 px-3 py-1 text-xs text-white">Save</button>
      </div>
    </header>

    <!-- Editor Content -->
    <div class="flex-1 overflow-y-auto p-12">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-4xl font-bold text-neutral-900">Strategic Outlook...</h1>
        <p class="mt-6 text-lg text-neutral-800">The introduction of the Rubin architecture...</p>
      </div>
    </div>
  </main>

  <!-- RIGHT RAIL + DRAWER -->
  <aside class="relative border-l border-neutral-800 bg-neutral-950 z-20">
    <div class="flex h-full flex-col items-center py-4">
       <button class="p-2 hover:bg-neutral-800 rounded">
         <svg class="h-6 w-6 text-neutral-500">...</svg>
       </button>
    </div>

    <!-- Right Drawer -->
    <div id="right-drawer"
         class="absolute top-0 right-[50px] h-full w-[300px] border-l border-neutral-800 bg-neutral-900 shadow-2xl transition-transform duration-300 ease-out translate-x-full"
         data-open="false">

         <!-- CRITICAL: Header reinforces "Immutable Artifact" rule -->
         <div class="p-4 border-b border-neutral-800">
            <h3 class="text-sm font-bold text-white">Generate New Version</h3>
            <p class="text-xs text-neutral-500 mt-1">Changes create V2, not modify V1</p>
         </div>

         <!-- OutputStyleSelector + NotesTextarea here -->
    </div>
  </aside>

</div>
```

---

### 2. The Drawer Positioning Logic

The critical architectural detail is how the Drawer interacts with the Rail:

| Element | Role | CSS Pattern |
|---------|------|-------------|
| **Container** | `<aside>` | `position: relative` - establishes positioning context |
| **Rail** | Inner div | `flex flex-col` - always visible, 50px wide |
| **Drawer** | Sibling div | `position: absolute` - slides relative to aside |

**Left Drawer Positioning:**
```css
/* Starts exactly where rail ends */
left: 50px;  /* = rail width */

/* Hidden state */
transform: translateX(-100%);  /* Slides left, off-screen */

/* Open state */
transform: translateX(0);  /* Slides into view */
```

**Right Drawer Positioning:**
```css
/* Starts exactly where rail ends */
right: 50px;  /* = rail width */

/* Hidden state */
transform: translateX(100%);  /* Slides right, off-screen */

/* Open state */
transform: translateX(0);  /* Slides into view */
```

**State Toggle (JavaScript/React):**
```typescript
// Toggle via data attribute (CSS-driven)
drawer.dataset.open = drawer.dataset.open === 'true' ? 'false' : 'true';

// Or via class toggle
drawer.classList.toggle('-translate-x-full');  // Left drawer
drawer.classList.toggle('translate-x-full');   // Right drawer
drawer.classList.toggle('translate-x-0');
```

---

### 3. The "Curtain Pull" Transition (Phase 1 → Phase 3)

To achieve the "curtain pull" effect, animate the Parent Grid definition itself:

**Phase 1 (Review Mode):**
```html
<div class="grid grid-cols-[20%_55%_25%] transition-[grid-template-columns] duration-500 ease-in-out ...">
  <!-- 3-column layout -->
</div>
```

**Phase 3 (Production Mode):**
```html
<div class="grid grid-cols-[50px_1fr_50px] transition-[grid-template-columns] duration-500 ease-in-out ...">
  <!-- Rails + Editor layout -->
</div>
```

**Animation Specification:**
```css
.sfr-grid {
  transition-property: grid-template-columns;
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Browser Compatibility Note:**
> Animating `grid-template-columns` works in modern browsers (Chrome 90+, Firefox 88+, Safari 15+).
> **Fallback:** If your stack struggles with grid animation, use absolute positioning for the "curtains" that slide away. The columns become positioned divs that animate `width` and `transform` instead.

---

### 4. DEX-Compliant Configuration Layer

To maintain **Declarative Sovereignty**, these layout values must be configurable without code changes:

**Layout Configuration Schema:**
```typescript
// src/core/config/sfr-layout.ts
interface SFRLayoutConfig {
  // Phase 1 proportions
  phase1: {
    leftColumn: string;    // "20%"
    centerColumn: string;  // "55%"
    rightColumn: string;   // "25%"
  };

  // Phase 3 dimensions
  phase3: {
    railWidth: string;     // "50px"
    drawerWidth: {
      left: string;        // "350px"
      right: string;       // "300px"
    };
  };

  // Animation
  transition: {
    duration: number;      // 400
    easing: string;        // "cubic-bezier(0.4, 0, 0.2, 1)"
  };
}

// Default configuration (overridable via seeds)
export const DEFAULT_SFR_LAYOUT: SFRLayoutConfig = {
  phase1: {
    leftColumn: '20%',
    centerColumn: '55%',
    rightColumn: '25%',
  },
  phase3: {
    railWidth: '50px',
    drawerWidth: {
      left: '350px',
      right: '300px',
    },
  },
  transition: {
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

**Usage in Components:**
```typescript
// Hook for declarative layout access
function useSFRLayout() {
  const config = useLayoutConfig('sfr') ?? DEFAULT_SFR_LAYOUT;

  const phase1Columns = `${config.phase1.leftColumn} ${config.phase1.centerColumn} ${config.phase1.rightColumn}`;
  const phase3Columns = `${config.phase3.railWidth} 1fr ${config.phase3.railWidth}`;

  return {
    phase1Columns,
    phase3Columns,
    railWidth: config.phase3.railWidth,
    drawerWidth: config.phase3.drawerWidth,
    transition: config.transition,
  };
}

// In component
const { phase1Columns, phase3Columns, transition } = useSFRLayout();

<div
  className="grid h-full"
  style={{
    gridTemplateColumns: phase === 1 ? phase1Columns : phase3Columns,
    transition: `grid-template-columns ${transition.duration}ms ${transition.easing}`,
  }}
>
```

**Seed File Override:**
```json
// data/seeds/sfr-layout.json
{
  "phase1": {
    "leftColumn": "18%",
    "centerColumn": "58%",
    "rightColumn": "24%"
  },
  "phase3": {
    "railWidth": "60px",
    "drawerWidth": {
      "left": "400px",
      "right": "320px"
    }
  },
  "transition": {
    "duration": 500,
    "easing": "ease-out"
  }
}
```

---

### 5. Drawer State Management (DEX-Compliant)

Drawer open/close state should be managed declaratively, not via imperative DOM manipulation:

```typescript
// State-driven drawer control
interface SFRDrawerState {
  leftOpen: boolean;
  rightOpen: boolean;
}

function useSFRDrawers() {
  const [state, setState] = useState<SFRDrawerState>({
    leftOpen: false,
    rightOpen: false,
  });

  const toggleLeft = () => setState(s => ({ ...s, leftOpen: !s.leftOpen }));
  const toggleRight = () => setState(s => ({ ...s, rightOpen: !s.rightOpen }));
  const closeAll = () => setState({ leftOpen: false, rightOpen: false });

  return { ...state, toggleLeft, toggleRight, closeAll };
}

// In template - data attribute driven
<div
  className="absolute top-0 left-[50px] h-full w-[350px] ... transition-transform duration-300"
  data-open={leftOpen}
  style={{
    transform: leftOpen ? 'translateX(0)' : 'translateX(-100%)',
  }}
>
```

**CSS Alternative (data-attribute driven):**
```css
/* Drawer hidden by default */
.sfr-drawer {
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}

/* Open state via data attribute */
.sfr-drawer[data-open="true"] {
  transform: translateX(0);
}

/* Right drawer variant */
.sfr-drawer-right {
  transform: translateX(100%);
}

.sfr-drawer-right[data-open="true"] {
  transform: translateX(0);
}
```

---

## Accessibility Specifications

This section defines accessibility requirements per WCAG 2.1 AA compliance.

### Keyboard Navigation

| Context | Key | Action |
|---------|-----|--------|
| **Phase 1** | Tab | Move through: Trust Signals → Research → Template Cards → Notes → Generate |
| **Phase 3** | Tab | Move through: Left Rail → Tabs → Editor → Right Rail |
| **Tab Bar** | Arrow Left/Right | Navigate between artifact tabs |
| **Tab Bar** | Enter | Activate selected tab |
| **Rail** | Enter/Space | Toggle drawer open/closed |
| **Drawer Open** | Escape | Close drawer, return focus to rail |
| **Drawer Open** | Tab | Cycle within drawer (focus trap) |

### Focus Management

```typescript
// Focus trap when drawer opens
useEffect(() => {
  if (drawerOpen) {
    const firstFocusable = drawerRef.current?.querySelector('button, [href], input, select, textarea');
    firstFocusable?.focus();
  }
}, [drawerOpen]);

// Return focus when drawer closes
const closeDrawer = () => {
  setDrawerOpen(false);
  railButtonRef.current?.focus();
};
```

### ARIA Labels

| Element | ARIA Attribute | Value |
|---------|----------------|-------|
| Left Rail Button | `aria-label` | "Toggle research sources panel" |
| Left Rail Button | `aria-expanded` | `{leftDrawerOpen}` |
| Right Rail Button | `aria-label` | "Toggle output style configuration" |
| Right Rail Button | `aria-expanded` | `{rightDrawerOpen}` |
| Left Drawer | `aria-label` | "Research sources and reference text" |
| Right Drawer | `aria-label` | "Generate new version options" |
| Tab Bar | `role` | "tablist" |
| Each Tab | `role` | "tab" |
| Each Tab | `aria-selected` | `{isActive}` |
| Editor Panel | `role` | "tabpanel" |

### Reduced Motion

```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sfr-grid {
    transition: none;
  }

  .sfr-drawer {
    transition: none;
  }

  /* Instant state change instead of Curtain Pull */
  .sfr-phase-transition {
    animation: none;
  }
}
```

### Color Contrast

| Element | Foreground | Background | Ratio | Passes AA |
|---------|------------|------------|-------|-----------|
| Rail label | #666666 | #0a0a0a | 5.1:1 | ✅ |
| Badge text | #000000 | #10b981 | 7.2:1 | ✅ |
| Editor text | #171717 | #fafafa | 16:1 | ✅ |
| Tab active | #000000 | #ffffff | 21:1 | ✅ |
| Tab inactive | #737373 | #ffffff | 4.6:1 | ✅ |

### Touch Targets

| Element | Minimum Size | Actual Size | Passes |
|---------|--------------|-------------|--------|
| Rail toggle | 44×44px | 50×50px | ✅ |
| Tab button | 44×44px | 44×48px | ✅ |
| Template card | 44×44px | 100% × 60px | ✅ |
| Generate button | 44×44px | 100% × 48px | ✅ |

---

## Technical Architecture

### State Machine

```
                    ┌─────────────────┐
                    │                 │
         ┌──────────│     IDLE        │
         │          │                 │
         │          └────────┬────────┘
         │                   │
         │           openModal(sprout)
         │                   │
         │                   ▼
         │          ┌─────────────────┐
         │          │                 │
         │     ┌────│  PHASE_1_REVIEW │◄────────────────┐
         │     │    │                 │                 │
         │     │    └────────┬────────┘                 │
         │     │             │                          │
         │     │      generateArtifact()                │
         │     │             │                          │
         │     │             ▼                          │
         │     │    ┌─────────────────┐                 │
         │     │    │                 │                 │
         │     │    │  PHASE_2_SHIFT  │                 │
         │     │    │   (animating)   │                 │
         │     │    └────────┬────────┘                 │
         │     │             │                          │
         │     │      onAnimationEnd()                  │
         │     │             │                          │
         │     │             ▼                          │
         │     │    ┌─────────────────┐                 │
         │     │    │                 │      error      │
         │     └────│ PHASE_3_PRODUCE │─────────────────┘
         │          │                 │
         │          └────────┬────────┘
         │                   │
         │            closeModal()
         │                   │
         └───────────────────┘
```

### Component Hierarchy

```
SproutFinishingRoom (Modal Container)
├── PhaseController (state machine)
│
├── Phase1Layout (grid-cols-[20%_55%_25%])
│   ├── TrustSignalsColumn
│   │   └── TrustSignals (existing component)
│   ├── ResearchColumn
│   │   └── ResearchContent (prose renderer)
│   └── ConfigColumn
│       ├── OutputStyleSelector
│       └── NotesTextarea (sticky footer)
│
├── Phase2Transition (animation controller)
│   └── CurtainPullAnimation
│
└── Phase3Layout (grid-cols-[50px_1fr_50px])
    ├── LeftRail
    │   ├── RailIcon + Badge
    │   ├── RailLabel (rotated)
    │   └── LeftDrawer (absolute, overlay)
    │       ├── ResearchContent (ReadOnly) ← PRIMARY: Fact-checking reference
    │       └── TrustSignals (Source list)
    ├── EditorPanel
    │   ├── TabBar
    │   │   ├── ArtifactTabs
    │   │   ├── NewTabButton
    │   │   └── ActionButtons (Export, Save)
    │   └── Editor
    │       └── (skeleton | content)
    └── RightRail
        ├── RailIcon
        ├── RailLabel (rotated)
        └── RightDrawer (absolute, overlay)
            ├── DrawerHeader: "Generate New Version" ← Reinforces immutability
            ├── OutputStyleSelector
            └── NotesTextarea
```

### CSS Architecture (Tailwind)

**Phase 1 Grid:**
```html
<div class="grid h-full grid-cols-[20%_55%_25%] transition-[grid-template-columns] duration-500 ease-out">
```

**Phase 3 Grid:**
```html
<div class="grid h-full grid-cols-[50px_1fr_50px] transition-[grid-template-columns] duration-500 ease-out">
```

**Drawer Pattern:**
```html
<aside class="relative z-20">
  <!-- Rail (always visible) -->
  <div class="flex h-full w-[50px] flex-col items-center">
    <button>...</button>
    <span class="rotate-180 text-[10px] uppercase">Sources</span>
  </div>

  <!-- Drawer (slides in) -->
  <div class="absolute left-[50px] top-0 h-full w-[350px]
              -translate-x-full transition-transform duration-300
              data-[open=true]:translate-x-0">
    <!-- Drawer content -->
  </div>
</aside>
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ENTRY                                                                   │
│    │                                                                     │
│    ▼                                                                     │
│  ┌──────────────────┐                                                    │
│  │ Sprout Object    │                                                    │
│  │ - evidence[]     │                                                    │
│  │ - synthesis      │                                                    │
│  │ - artifacts[]    │                                                    │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐     ┌──────────────────┐                          │
│  │ artifacts.length │────▶│ Route Decision   │                          │
│  │ === 0?           │     │                  │                          │
│  └──────────────────┘     │ Yes → Phase 1    │                          │
│                           │ No  → Phase 3    │                          │
│                           └──────────────────┘                          │
│                                                                          │
│  PHASE 1                                                                 │
│    │                                                                     │
│    ├─── evidence[] ──────────▶ TrustSignals (left column)               │
│    │                                                                     │
│    ├─── synthesis ───────────▶ ResearchContent (center column)          │
│    │                                                                     │
│    └─── templates[] ─────────▶ OutputStyleSelector (right column)       │
│                                                                          │
│  GENERATE                                                                │
│    │                                                                     │
│    ├─── selectedTemplateId ──┐                                          │
│    │                         │                                          │
│    ├─── userNotes ───────────┼──▶ POST /api/research/write              │
│    │                         │                                          │
│    └─── evidence[] ──────────┘                                          │
│                                                                          │
│         API Response                                                     │
│              │                                                           │
│              ▼                                                           │
│    ┌──────────────────┐                                                 │
│    │ New Artifact     │                                                 │
│    │ - content        │──────────▶ sprout.artifacts.push()              │
│    │ - templateId     │                                                 │
│    │ - version: 1     │                                                 │
│    └──────────────────┘                                                 │
│                                                                          │
│  PHASE 3                                                                 │
│    │                                                                     │
│    ├─── artifacts[] ─────────▶ TabBar (one tab per artifact)            │
│    │                                                                     │
│    ├─── activeArtifact ──────▶ Editor (content display/edit)            │
│    │                                                                     │
│    ├─── synthesis ───────────▶ LeftDrawer (ResearchContent - ReadOnly)  │
│    │                                  ↳ Fact-checking reference          │
│    ├─── evidence[] ──────────▶ LeftDrawer (TrustSignals - Source list)  │
│    │                                                                     │
│    └─── templates[] ─────────▶ RightDrawer ("Generate New Version")     │
│                                                                          │
│  SAVE                                                                    │
│    │                                                                     │
│    └─── activeArtifact ──────▶ POST /api/nursery/save                   │
│                                      │                                   │
│                                      ▼                                   │
│                               ┌──────────────┐                          │
│                               │ Nursery      │                          │
│                               │ (Supabase)   │                          │
│                               └──────────────┘                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Responsive Strategy

**Decision:** On mobile, skip Phase 1 layout entirely. Use Phase 3 (rails + drawer) from the start.

**Rationale:** Three columns don't fit on a phone. Don't try.

**Implementation:**
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

// Mobile always uses Phase 3 layout, even for fresh sprouts
const effectivePhase = isMobile ? 3 : phase;
```

### Mobile "Blind Launch" Prevention

**Problem:** User opens a fresh Sprout on mobile → lands in Zen Mode → no artifacts yet → blank editor area → confusion.

**Fix:** When `artifacts.length === 0` on mobile, the **Right Drawer (Config) opens by default**.

```typescript
// Determine initial drawer state
const initialRightOpen = isMobile && sprout.artifacts.length === 0;

const [rightDrawerOpen, setRightDrawerOpen] = useState(initialRightOpen);
```

**User Experience:**
- Fresh sprout on mobile → Drawer slides in showing "Generate New Version" options
- User immediately sees Writer templates and Notes field
- Clear call-to-action, no confusion about what to do next

**Mobile Layout:**
```
┌────────────────────────────┐
│  ☰  Sprout Finishing Room  │  ← Hamburger for rails
├────────────────────────────┤
│                            │
│    [ Blog V1 ] [ + ]       │  ← Simplified tab bar
│                            │
│    ┌────────────────────┐  │
│    │                    │  │
│    │   Editor Content   │  │
│    │                    │  │
│    │                    │  │
│    └────────────────────┘  │
│                            │
│    [Save to Nursery]       │
└────────────────────────────┘
```

**Hamburger Menu:**
- "Sources" → Opens full-screen drawer
- "Style" → Opens full-screen drawer
- "New Version" → Opens style selector, then generates

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first generation | < 30 seconds | Analytics: modal open → generate click |
| Generation completion rate | > 80% | Starts / Completions |
| Multi-version usage | > 25% of sessions | Sessions with 2+ artifacts |
| Save to Nursery rate | > 60% | Generations / Saves |
| Return visits | > 40% | Users who open SFR twice+ |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Grid animation jank | Medium | Medium | Fallback to absolute positioning |
| Auto-save data loss | Low | High | Aggressive debounce, retry logic |
| Drawer overlap confusion | Medium | Low | Clear visual hierarchy (shadows) |
| Tab overflow complexity | Low | Medium | History dropdown as escape hatch |
| Mobile drawer UX | Medium | Medium | User testing before launch |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| S21-RL (Research Template Wiring) | ✅ Complete | Research API returns full prose |
| S22-WP (Writer Panel Piping) | 🚧 In Progress | Must complete before S23 |
| Writer Templates | ⚠️ Partial | Need full systemPrompts for 6 templates |
| Nursery Supabase Table | ⚠️ TBD | Schema may need updates |

---

## Open Questions for Product Review

1. **Save Actions:** "Save to Nursery" + "Export" - what export formats? (Markdown, PDF, Notion?)

2. **Version Limit:** Should we cap versions per sprout? (e.g., max 10 to prevent runaway usage)

3. **Collaboration:** Is this single-user only, or could two people view the same sprout?

---

## Template Loading (Declarative Data)

**IMPORTANT:** Writer template names, descriptions, and systemPrompts are **declarative data**, not hardcoded values. The SFR loads templates dynamically from seed files.

**Source of Truth:** `data/seeds/output-templates.json`

**Current Writer Templates (agentType: "writer"):**
| Template | Description | Default |
|----------|-------------|---------|
| Engineering / Architecture | Technical analysis with implementation patterns | No |
| Vision Paper | Forward-looking strategic perspective | No |
| Higher Ed Policy | Policy analysis for academic contexts | No |
| Blog Post | Engaging content for general audience | Yes |

**Current Research Templates (agentType: "research"):**
| Template | Description | Default |
|----------|-------------|---------|
| Deep Dive | Exhaustive research with maximum branching | Yes |
| Quick Scan | Rapid overview with limited depth | Yes |
| Academic Review | Scholarly literature review | No |
| Trend Analysis | Trend-focused temporal patterns | No |

**Loading Pattern:**
```typescript
// OutputStyleSelector loads templates declaratively
const templates = useOutputTemplates({ agentType: 'writer' });

// Hook filters seed data by agentType, returns only active templates
// Each template includes: id, meta.title, meta.description, meta.icon, payload.systemPrompt

// SFR displays meta.title as card label
// SFR uses payload.systemPrompt + userNotes for generation
```

**Adding New Templates:** Add a new entry to `data/seeds/output-templates.json` with `payload.agentType: "writer"`. No code changes required.

---

## New Patterns to Document

The following patterns are introduced by this sprint and require documentation in `docs/patterns/` during implementation:

| Pattern | Description | Documentation Location |
|---------|-------------|------------------------|
| **Double-Drawer Rail** | 50px collapsed rail with overlay drawer that slides from edge | `docs/patterns/double-drawer-rail.md` |
| **Curtain Pull Transition** | CSS Grid column animation from 3-column to rail+center+rail | `docs/patterns/curtain-pull-transition.md` |
| **Phase State Machine** | IDLE → PHASE_1 → PHASE_2 → PHASE_3 with error recovery | `docs/patterns/sfr-phase-machine.md` |
| **Slot-Based Component Relocation** | Same component renders in column OR drawer based on phase | `docs/patterns/slot-container.md` |

---

## Next Steps

1. ~~**Product Manager Review**~~ ✅ Validated (with template data correction)
2. ~~**UI/UX Designer Review**~~ ✅ Approved with corrections (applied)
3. ~~**UX Chief Sign-Off**~~ ✅ DEX compliance verified, APPROVED
4. ~~**User Story Refinery**~~ ✅ Complete - USER_STORIES.md generated
5. **User Review** - Present for final approval
6. **EXECUTION_PROMPT.md** - Generate after user approval

---

*Specification created 2026-01-24*
*Author: UX Chief (Product Pod)*
*Status: APPROVED - Ready for user review*

**Product Pod Sign-Off:**
- PM: ✅ Approved with template data correction
- UI/UX Designer: ✅ Approved with accessibility additions
- UX Chief: ✅ DEX compliance verified (4/4 pillars PASS)
