# Grove Foundation Refactor: Vision & Architecture Specification

**Version:** 1.0  
**Date:** December 21, 2025  
**Status:** APPROVED FOR DESIGN SPRINT  
**Sprint Name:** foundation-ux-unification-v1

---

## Executive Summary

The Grove Foundation Refactor transforms the current multi-surface architecture into a **unified widget experience** where Chat, Explore, and Garden modes are contexts within a single intelligent interface—not separate applications.

This document captures the architectural vision, component grammar, and implementation strategy for:

1. **The Grove Widget** — A chat-first, mode-fluid interface that adapts based on context
2. **The Garden Mode** — The Sprout System's user-facing view, embedded within the Terminal
3. **The Foundation Console** — A refactored backstage using unified component patterns
4. **The Component Grammar** — A reusable vocabulary derived from Symbol Garden patterns

**Core Insight:** The Terminal isn't a "feature"—it's proof of the core thesis. An LLM interface that helps discover insights across disparate chunks, showing multiple facets of perspective on one dataset in infinite ways. The meta is the product.

---

## Part 1: The Universe We're Building

### The Grove: Three Domains, One Interface

The Grove operates across three conceptual domains, but users experience them through a single unified interface:

| Domain | Role | Metaphor | Experience |
|--------|------|----------|------------|
| **Terminal** | Observer/Gardener | Theater + Greenhouse | Chat, Explore, Garden modes in one widget |
| **Foundation** | Worldsmith | Control Room | Configure reality (authorized users only) |
| **Network** | Commons | Shared Forest | Knowledge that propagates across Groves |

**The insight:** These aren't separate apps. The Grove Widget is the universal interface that shifts modes based on what the user needs.

### The Widget as Universal Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE GROVE WIDGET                                 │
│            "Your AI, Your Data, Your Machine"                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Chat-first interface that can:                                        │
│   • Converse (daily AI assistant) — Coming in 1.0                       │
│   • Explore (Terminal/Journey mode) — Current MVP                       │
│   • Garden (see your planted sprouts) — This refactor                   │
│   • Configure (Worldsmith mode, if authorized) — Foundation Console     │
│                                                                         │
│   Runs locally by default.                                              │
│   Reaches to cloud when it needs to think harder.                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### URL Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  the-grove.ai                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /                     Landing page (the pitch)                         │
│                        → Seeds the concept for universities              │
│                        → CTA: "Try the Terminal" or "Learn More"        │
│                                                                          │
│  /terminal             The Grove Widget (full experience)               │
│                        → Chat mode (coming soon placeholder)            │
│                        → Explore mode (journeys, lenses)                │
│                        → Garden mode (your sprouts)                     │
│                                                                          │
│  /foundation           Worldsmith Console (authorized users)            │
│                        → Configure the reality others explore           │
│                        → Moderate sprouts, tune prompts                 │
│                        → Infrastructure, not experience                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: The Grove Widget Design

### Design Principles

1. **Chat-first, mode-fluid** — The primary interface is always a text input. Modes are contexts, not destinations.
2. **Slash commands as superpowers** — `/explore`, `/garden`, `/plant`, `/stats`, `/help`
3. **Progressive disclosure** — Simple by default, powerful when you need it
4. **Ambient awareness** — Subtle indicators of state (session time, sprout count, exploration depth)
5. **The widget IS the window** — Everything happens in one unified container

### Widget Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  🌳 The Grove                              47m │ 🌱 3 │ ◐ Exploring │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ │                         [Content Area]                              │ │
│ │                                                                     │ │
│ │    Adapts based on mode:                                           │ │
│ │    • Chat → Conversation thread (Coming Soon placeholder)          │ │
│ │    • Explore → Journey content with highlights                     │ │
│ │    • Garden → Sprout cards grouped by growth stage                 │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  / Type a message or command...                              ⌘K    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│   Explore ──●── Garden ──○── Chat (Coming Soon)          ⚙ │ ? │ ···  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Header: Ambient Status Bar

```
🌳 The Grove                              47m │ 🌱 3 │ ◐ Exploring
```

| Element | Purpose |
|---------|---------|
| Logo/Brand | Minimal, confident identity |
| Session Timer | How long you've been here (engagement without pressure) |
| Sprout Count | Your plantings this session (gamification that matters) |
| Mode Indicator | Current context (Exploring, Gardening, Chatting) |

### Slash Commands (Complete List)

| Command | Action | Available In |
|---------|--------|--------------|
| `/explore` | Enter exploration mode | Any |
| `/garden` | View your sprouts | Any |
| `/chat` | Chat mode (shows coming soon) | Any |
| `/plant` | Plant selected text | Explore |
| `/plant --tag=ratchet` | Plant with hub association | Explore |
| `/plant --note="..."` | Plant with annotation | Explore |
| `/stats` | Session statistics | Any |
| `/lens` | Show available lenses | Explore |
| `/lens academic` | Switch to Academic lens | Explore |
| `/journey` | Show available journeys | Explore |
| `/journey ratchet` | Jump to specific journey | Explore |
| `/help` | Show all commands | Any |
| `/settings` | Open settings | Any |

### Footer: Mode Switcher + Utils

```
  Explore ──●── Garden ──○── Chat (Coming Soon)          ⚙ │ ? │ ···
```

| Element | Purpose |
|---------|---------|
| Mode Toggle | Visual indication of where you are, clickable to switch |
| Settings (⚙) | Opens configuration (lens preferences, API keys if self-hosted) |
| Help (?) | Contextual help for current mode |
| More (···) | Share, export, feedback |

---

## Part 3: Mode-Specific Content Areas

### Explore Mode (Current Terminal, Refined)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  The Ratchet Effect                                    Journey 2/6     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                         │
│  The 7-month clock.                                                    │
│                                                                         │
│  Every seven months, capabilities that required frontier-scale          │
│  compute become achievable on consumer hardware. This isn't            │
│  Moore's Law—it's faster, and it's driven by algorithmic               │
│  efficiency gains compounding with hardware improvements.               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ "The capability that cost $10M to train in January costs        │   │
│  │  $100K by August."                                              │   │
│  │                                           — 🌱 Plant this       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  This creates a predictable window for infrastructure planning...      │
│                                                                         │
│                                        ← Previous    Next →             │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Refinements:**
- Clean typography, generous whitespace
- Highlightable passages with inline "🌱 Plant this" action
- Subtle journey progress indicator
- Navigation feels like reading, not clicking

### Garden Mode (The Sprout System View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Your Garden                                          3 sprouts         │
│                                                                         │
│  ┌─ Tender (2) ────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ┌────────────────────┐  ┌────────────────────┐                 │   │
│  │  │ 🌱                 │  │ 🌱                 │                 │   │
│  │  │ "The 7-month       │  │ "Capability that   │                 │   │
│  │  │  clock"            │  │  cost $10M..."     │                 │   │
│  │  │                    │  │                    │                 │   │
│  │  │ Planted 12m ago    │  │ Planted 3m ago     │                 │   │
│  │  │ From: The Ratchet  │  │ From: The Ratchet  │                 │   │
│  │  └────────────────────┘  └────────────────────┘                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Rooting (1) ───────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ┌────────────────────┐                                         │   │
│  │  │ 🌿                 │  Agent is researching...                │   │
│  │  │ "Infrastructure    │  Found 3 supporting sources             │   │
│  │  │  becomes the       │                                         │   │
│  │  │  product"          │  ◐ Strengthening                        │   │
│  │  └────────────────────┘                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  🌐 Knowledge Commons — Recently Established                            │
│  "The 21-month lag creates a planning window" — 47 gardens              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Sprouts grouped by growth stage (Tender, Rooting, Branching, Hardened, etc.)
- Cards show excerpt, source, planting time
- Progress indicators for agent cultivation
- Knowledge Commons preview at bottom

### Chat Mode (Coming Soon Placeholder)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │      💬  Chat Mode                                              │   │
│  │          Coming in Grove 1.0                                    │   │
│  │                                                                 │   │
│  │      Your AI assistant that runs on your machine.               │   │
│  │                                                                 │   │
│  │      • Rewrite emails in your voice                            │   │
│  │      • Brainstorm without sending data to the cloud            │   │
│  │      • Manage your calendar with natural language              │   │
│  │      • Search your local files intelligently                   │   │
│  │                                                                 │   │
│  │      Local-first. Cloud-capable. Yours.                        │   │
│  │                                                                 │   │
│  │      ┌─────────────────────────────────────────────────┐       │   │
│  │      │  Notify me when Chat is available               │       │   │
│  │      │  [your@email.com                    ] [Notify]  │       │   │
│  │      └─────────────────────────────────────────────────┘       │   │
│  │                                                                 │   │
│  │      For now, try /explore to discover Grove's ideas.          │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Purpose:**
- Communicates vision without pretending feature exists
- Captures leads for launch notification
- Redirects to working Explore mode

---

## Part 4: Component Grammar

### The Pattern (Derived from Symbol Garden)

Symbol Garden's three-panel architecture with context-aware inspector provides the reusable pattern:

1. **Left Sidebar** = Navigation scoped by workspace (project)
2. **Main Content** = Filtered collection (grid or list) with consistent header pattern
3. **Right Drawer** = Contextual inspector that morphs based on what you click

The `UIContext` is the orchestrator—it knows what mode the inspector is in and what entity is selected.

### Core Components

#### Shell Components

```typescript
// GroveWidget.tsx - The unified container
interface GroveWidgetProps {
  initialMode?: WidgetMode;
}

type WidgetMode = 'explore' | 'garden' | 'chat';

// Inspector.tsx - Right drawer (contextual)
interface InspectorProps {
  mode: InspectorMode;
  entityId: string | null;
  onClose: () => void;
}

type InspectorMode = 
  | 'none'
  | 'sprout'      // Viewing a Sprout's properties
  | 'node'        // Viewing a Node in journey
  | 'journey'     // Viewing a Journey
  | 'settings';   // Widget settings
```

#### Collection Components

```typescript
// CollectionGrid.tsx - Searchable, filterable grid
interface CollectionGridProps<T> {
  items: T[];
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  onItemClick: (item: T) => void;
  selectedId?: string;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  emptyState?: React.ReactNode;
  groupBy?: (item: T) => string;  // For Garden's growth stage grouping
}

// CollectionCard.tsx - Generic card for grid items
interface CollectionCardProps {
  title: string;
  subtitle?: string;
  status?: StatusBadge;
  tags?: string[];
  preview?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
}
```

#### Status Components

```typescript
// StatusBadge.tsx - Consistent status indicators
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success';
  label?: string;
  pulse?: boolean;  // For "live" indicators
}

// GrowthStageBadge.tsx - Sprout-specific
interface GrowthStageBadgeProps {
  stage: GrowthStage;
}

type GrowthStage = 
  | 'tender'      // Just planted
  | 'rooting'     // Agent researching
  | 'branching'   // Evidence accumulating
  | 'hardened'    // Validated
  | 'grafted'     // Connected to other sprouts
  | 'established' // In Knowledge Commons
  | 'dormant'     // Inactive
  | 'withered';   // Abandoned
```

### Context Architecture

```typescript
// WidgetUIContext.tsx
interface WidgetUIContextType {
  // Mode state
  currentMode: WidgetMode;
  setMode: (mode: WidgetMode) => void;
  
  // Inspector state
  inspectorMode: InspectorMode;
  inspectorEntityId: string | null;
  
  // Inspector actions
  openInspector: (mode: InspectorMode, entityId: string) => void;
  closeInspector: () => void;
  
  // Session state
  sessionStartTime: Date;
  sproutCount: number;
  
  // Command palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

// GardenContext.tsx
interface GardenContextType {
  // Sprouts
  sprouts: Sprout[];
  plantSprout: (content: string, context: SproutContext) => Promise<Sprout>;
  
  // Grouping
  sproutsByStage: Record<GrowthStage, Sprout[]>;
  
  // Knowledge Commons preview
  recentlyEstablished: EstablishedSprout[];
}
```

---

## Part 5: Visual Language

### Color Palette

```css
/* Base */
--grove-bg: #0a0f14;           /* Deep forest night */
--grove-surface: #121a22;       /* Slightly lifted */
--grove-border: #1e2a36;        /* Subtle boundaries */

/* Accent */
--grove-accent: #00d4aa;        /* Vibrant teal-green (growth) */
--grove-accent-muted: #0a4a3a;  /* Muted for backgrounds */

/* Growth stages */
--stage-tender: #7dd3c0;        /* Pale green */
--stage-rooting: #4ade80;       /* Growing green */
--stage-branching: #22c55e;     /* Strong green */
--stage-hardened: #16a34a;      /* Deep green */
--stage-grafted: #15803d;       /* Forest green */
--stage-established: #166534;   /* Established */

/* Text */
--grove-text: #e2e8f0;          /* Primary */
--grove-text-muted: #94a3b8;    /* Secondary */
--grove-text-dim: #64748b;      /* Tertiary */

/* Semantic */
--grove-success: #22c55e;
--grove-warning: #f59e0b;
--grove-error: #ef4444;
```

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headers | Inter or Söhne | 16-24px | 600 |
| Body | System stack | 14-16px | 400 |
| Code/Commands | JetBrains Mono | 13px | 400 |
| Labels | Inter | 11px | 500 |

### Motion

| Transition | Duration | Easing |
|------------|----------|--------|
| Mode switch | 200ms | ease-out |
| Content fade | 150ms | ease-in-out |
| Inspector slide | 250ms | ease-out |
| Sprout growth | 300ms | spring |

---

## Part 6: Foundation Console Refactor

The Foundation Console (`/foundation/*`) uses the same component grammar, adapted for the Worldsmith role.

### Shell Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ConsoleShell                                                            │
├────────────┬────────────────────────────────────────────┬───────────────┤
│ ConsoleSide│  Console Content Area                      │  Inspector    │
│ bar (200px)│  (flex-1)                                  │  (360px)      │
│            │                                            │               │
│ ┌────────┐ │  Route-based content:                      │  Contextual:  │
│ │[F]     │ │  - /foundation/genesis    → Genesis        │  - Node       │
│ │Found.  │ │  - /foundation/health     → Health         │  - Journey    │
│ └────────┘ │  - /foundation/narrative  → Narrative      │  - Trigger    │
│            │  - /foundation/engagement → Engagement     │  - Document   │
│ Console    │  - /foundation/knowledge  → Knowledge      │  - Hub        │
│ Modules:   │  - /foundation/tuner      → Reality Tuner  │  - Settings   │
│ ├─Genesis  │  - /foundation/audio      → Audio Studio   │               │
│ ├─Health   │  - /foundation/sprouts    → Sprout Queue   │               │
│ ├─Narrative│                                            │               │
│ ├─Engage   │                                            │               │
│ ├─Knowledge│                                            │               │
│ ├─Tuner    │                                            │               │
│ ├─Audio    │                                            │               │
│ └─Sprouts  │                                            │               │
│            │                                            │               │
│ ─────────  │                                            │               │
│ 🏠 Exit    │                                            │               │
│ ● Healthy  │                                            │               │
└────────────┴────────────────────────────────────────────┴───────────────┘
```

### Module Layout Component

```typescript
// ModuleLayout.tsx - Consistent structure for each console
interface ModuleLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  stats: StatCard[];
  tabs: TabConfig[];
  actions?: ActionButton[];
  children: React.ReactNode;
}

interface StatCard {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

interface TabConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
}
```

### Refactor Sequence

1. **Week N:** Create ConsoleUIContext + ModuleLayout + base components
2. **Week N+1:** Refactor Narrative Architect as canonical implementation
3. **Week N+2:** Add Sprout Queue module for cultivation moderation
4. **Week N+3:** Migrate other modules incrementally

---

## Part 7: Implementation Strategy

### Phase 1: Grove Widget Shell (Week 1)

**Goal:** Create the unified container with mode switching

**Deliverables:**
- `GroveWidget.tsx` — Main container
- `WidgetUIContext.tsx` — State management
- `WidgetHeader.tsx` — Ambient status bar
- `CommandInput.tsx` — Slash command entry
- `CommandPalette.tsx` — Command picker
- `ModeToggle.tsx` — Footer navigation

**Acceptance Criteria:**
- Can switch between Explore/Garden/Chat modes
- Command palette opens on `/` keystroke
- Mode indicator updates correctly
- Session timer counts up

### Phase 2: Garden Mode (Week 2)

**Goal:** Implement the Sprout System user view

**Deliverables:**
- `GardenView.tsx` — Main garden layout
- `GardenContext.tsx` — Sprout state management
- `SproutCard.tsx` — Individual sprout display
- `GrowthStageGroup.tsx` — Stage-based grouping
- `KnowledgeCommonsPreview.tsx` — Recently established

**Acceptance Criteria:**
- Sprouts display grouped by growth stage
- Cards show content, source, time
- Empty state guides users to Explore
- Commons preview shows network activity

### Phase 3: Explore Mode Refinement (Week 3)

**Goal:** Integrate current Terminal into widget pattern

**Deliverables:**
- `ExploreView.tsx` — Refactored Terminal content
- `PlantSelectionTooltip.tsx` — Inline planting action
- `JourneyProgress.tsx` — Navigation indicator
- Integration with `/plant` command

**Acceptance Criteria:**
- Existing Terminal features work in new shell
- Text selection shows "🌱 Plant this" action
- `/plant` command captures with full context
- Journey navigation preserved

### Phase 4: Foundation Console Pattern (Week 4)

**Goal:** Establish component grammar for backstage

**Deliverables:**
- `ConsoleUIContext.tsx` — Inspector state
- `ModuleLayout.tsx` — Consistent module structure
- `CollectionGrid.tsx` — Generic collection display
- `Inspector.tsx` — Contextual right panel
- Narrative Architect refactored to pattern

**Acceptance Criteria:**
- Narrative Architect uses new components
- Inspector opens/closes correctly
- Pattern documented for other modules

---

## Part 8: Testing Strategy

### Unit Tests

| Component | Test Focus |
|-----------|------------|
| WidgetUIContext | Mode switching, inspector state |
| CommandPalette | Command matching, keyboard navigation |
| SproutCard | Rendering variants, click handling |
| GrowthStageGroup | Grouping logic, empty states |

### Integration Tests

| Flow | Test Focus |
|------|------------|
| Plant a Sprout | Select text → click plant → appears in garden |
| Mode Switch | Explore → Garden → Chat → Explore |
| Command Execution | Type `/garden` → mode switches |
| Inspector Toggle | Click sprout → inspector opens → ESC closes |

### E2E Tests

| Scenario | Test Focus |
|----------|------------|
| New User Journey | Landing → Explore → Plant → Garden |
| Return User | Direct to Garden → see sprouts |
| Worldsmith Flow | Foundation → Sprout Queue → Approve |

---

## Appendix A: Sprout Data Model

```typescript
interface Sprout {
  id: string;
  capturedAt: string;  // ISO timestamp
  
  // The preserved content (VERBATIM)
  content: string;     // Exact text captured
  query: string;       // What generated this
  
  // Generation context (for attribution)
  contextLoaded: string[];  // RAG files used
  personaId: string;        // Lens active
  journeyId?: string;       // If in journey mode
  hubId?: string;           // Topic hub matched
  nodeId?: string;          // Specific node
  
  // Lifecycle
  stage: GrowthStage;
  tags: string[];
  notes?: string;
  
  // Attribution chain
  sessionId: string;
  derivedFrom?: string;
  derivatives: string[];
  
  // Promotion tracking
  promotedToCommons?: boolean;
  promotedAt?: string;
  adoptionCount?: number;
}

type GrowthStage = 
  | 'tender'      // Just planted, no validation
  | 'rooting'     // Agent researching evidence
  | 'branching'   // Evidence accumulating
  | 'hardened'    // Validated by agents
  | 'grafted'     // Connected to other sprouts
  | 'established' // Promoted to Knowledge Commons
  | 'dormant'     // Inactive but preserved
  | 'withered';   // Abandoned by gardener
```

---

## Appendix B: Reference Implementation

See Symbol Garden 2.0 at `C:\GitHub\symbol-garden-2` for pattern reference:

- `src/components/layout/AppShell.tsx` — Shell pattern
- `src/components/layout/Sidebar.tsx` — Navigation with workspaces
- `src/components/layout/RightDrawer.tsx` — Contextual inspector
- `src/lib/ui-context.tsx` — State management
- `src/components/icons/IconGrid.tsx` — Collection with filtering
- `src/components/icons/IconCard.tsx` — Card component

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-21 | Jim + Claude | Initial specification |

---

*This document is the authoritative specification for the Grove Foundation Refactor. Design sprints should reference this for architectural decisions.*
