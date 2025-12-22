# Grove Workspace: Revised Architecture Specification

**Version:** 2.0  
**Date:** December 21, 2025  
**Status:** PIVOT IN PROGRESS  
**Sprint Name:** foundation-ux-unification-v1

---

## Pivot Summary

The Grove Widget (footer-mode-toggle design) is being replaced with **Grove Workspace**—a three-column architecture that scales with Grove's complexity and unifies the Terminal and Foundation Console patterns.

**What triggered the pivot:**
- Footer mode toggle doesn't scale as we add sections (Explore, Garden, Chat, Village Feed)
- Three-column matches Foundation Console, enabling shared component grammar
- Diary entries ("Village Feed") need a proper home
- Symbol Garden already proves this pattern works

**What carries forward from Week 1:**
- CommandPalette component
- Session timer logic
- Sprout count tracking
- WidgetUIContext (adapted to WorkspaceUIContext)
- Terminal integration work (moves into ExploreView)

---

## Part 1: Three-Column Architecture

### The Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🌳 The Grove                                              ⌘K    ⚙    ?   │
├────────────┬─────────────────────────────────────────────┬──────────────────┤
│ LEFT       │ CENTER                                      │ RIGHT            │
│ Navigation │ Content                                     │ Inspector        │
│ (240px)    │ (flex-1)                                    │ (360px)          │
├────────────┼─────────────────────────────────────────────┼──────────────────┤
│            │                                             │                  │
│ EXPLORE    │                                             │                  │
│  ├─ Chat   │  [Content depends on left selection]       │ [Inspector shows │
│  ├─ Nodes  │                                             │  clicked item]   │
│  │  ├─ Ratchet │                                        │                  │
│  │  ├─ Hybrid  │                                        │                  │
│  │  └─ Economics │                                      │                  │
│  ├─ Journeys   │                                        │                  │
│  └─ Lenses     │                                        │                  │
│            │                                             │                  │
│ GARDEN     │                                             │                  │
│  ├─ My Sprouts │                                        │                  │
│  └─ Commons    │                                        │                  │
│            │                                             │                  │
│ VILLAGE    │                                             │                  │
│  └─ Feed   │                                             │                  │
│            │                                             │                  │
│────────────│                                             │                  │
│ 47m │ 🌱 3 │                                             │                  │
│ ● Healthy  │                                             │                  │
└────────────┴─────────────────────────────────────────────┴──────────────────┘
```

### Column Responsibilities

| Column | Width | Purpose |
|--------|-------|---------|
| **Left (Navigation)** | 240px fixed | Section tree, collapsible groups, status indicators |
| **Center (Content)** | flex-1 | Main view area—changes based on nav selection |
| **Right (Inspector)** | 360px, collapsible | Detail panel for selected items, configuration |

### Why Three Columns

1. **No mode switching friction** — All sections visible in sidebar
2. **Scales with complexity** — Add more nodes, journeys, feeds without UI redesign
3. **Consistent inspector** — Click anything, see its properties
4. **Matches Foundation Console** — Same architecture, different role
5. **Village Feed has a home** — Diary entries become first-class content

---

## Part 2: Navigation Tree Structure

### Section Hierarchy

```typescript
type NavigationTree = {
  explore: {
    label: 'Explore';
    icon: 'compass';
    children: {
      chat: { label: 'Chat'; view: 'terminal-chat' };
      nodes: {
        label: 'Nodes';
        children: Record<string, NodeItem>;  // Dynamic from narratives.json
      };
      journeys: { label: 'Journeys'; view: 'journey-list' };
      lenses: { label: 'Lenses'; view: 'lens-picker' };
    };
  };
  garden: {
    label: 'Garden';
    icon: 'sprout';
    children: {
      mySprouts: { label: 'My Sprouts'; view: 'sprout-grid' };
      commons: { label: 'Commons'; view: 'commons-feed' };
    };
  };
  village: {
    label: 'Village';
    icon: 'users';
    children: {
      feed: { label: 'Feed'; view: 'village-feed' };
    };
  };
};
```

### Navigation State

```typescript
interface NavigationState {
  // Which section/item is active
  activePath: string[];  // e.g., ['explore', 'nodes', 'ratchet']
  
  // Which groups are expanded
  expandedGroups: Set<string>;  // e.g., Set(['explore', 'explore.nodes'])
  
  // What's selected in center content (for inspector)
  selectedEntityId: string | null;
  selectedEntityType: EntityType | null;
}

type EntityType = 'node' | 'journey' | 'lens' | 'sprout' | 'diary-entry';
```

---

## Part 3: Center Content Views

### View Mapping

| Nav Selection | Center View | Description |
|---------------|-------------|-------------|
| `explore.chat` | `TerminalChat` | The existing Terminal, embedded |
| `explore.nodes` | `NodeGrid` | Card grid of all knowledge nodes |
| `explore.nodes.[id]` | `NodeDetail` | Single node with its content |
| `explore.journeys` | `JourneyList` | Available journeys |
| `explore.lenses` | `LensPicker` | Lens selection and preview |
| `garden.mySprouts` | `SproutGrid` | User's sprouts by growth stage |
| `garden.commons` | `CommonsFeed` | Network-wide established sprouts |
| `village.feed` | `VillageFeed` | Diary entries, agent activity |

### Terminal Integration

The existing Terminal component lives at `explore.chat`. When selected:
- Center shows full Terminal experience
- Inspector can show chat context, active lens, loaded RAG files
- Command input is Terminal's own (not a separate widget input)

```typescript
// ExploreChat.tsx
const ExploreChat: React.FC = () => {
  return (
    <div className="h-full overflow-hidden">
      <Terminal 
        embedded={true}  // Tells Terminal it's inside workspace
        onContextChange={(ctx) => {
          // Update inspector with current context
          inspector.show('chat-context', ctx);
        }}
      />
    </div>
  );
};
```

---

## Part 4: Inspector Panel

### Inspector Modes

```typescript
type InspectorMode = 
  | { type: 'none' }
  | { type: 'node'; nodeId: string }
  | { type: 'journey'; journeyId: string }
  | { type: 'lens'; lensId: string }
  | { type: 'sprout'; sproutId: string }
  | { type: 'diary-entry'; entryId: string }
  | { type: 'chat-context'; context: ChatContext };

interface InspectorState {
  mode: InspectorMode;
  isOpen: boolean;
}
```

### Inspector Content by Mode

| Mode | Inspector Shows |
|------|-----------------|
| `node` | Node metadata, related journeys, contained hubs |
| `journey` | Journey steps, progress, completion stats |
| `lens` | Lens description, prompt preview, activation button |
| `sprout` | Full content, provenance, growth stage, actions |
| `diary-entry` | Entry content, agent attribution, timestamp |
| `chat-context` | Active lens, loaded RAG, session stats |

---

## Part 5: Village Feed (Diary)

### What Is Village Feed

The diary system surfaces agent activity and narrative texture. In the three-column layout, it becomes a scrollable feed:

```
┌─────────────────────────────────────────────────────────────────┐
│  Village Feed                                    Filter ▾      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🤖 Agent-7 reflected on the Ratchet thesis              │   │
│  │ "The 7-month window feels shorter each cycle..."        │   │
│  │ 3 minutes ago                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🌱 Your sprout "Infrastructure becomes product" is      │   │
│  │    now ROOTING — found 3 supporting sources             │   │
│  │ 12 minutes ago                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🤖 Agent-3 and Agent-7 debated hybrid architecture      │   │
│  │ "Local-first vs. cloud-capable isn't binary..."         │   │
│  │ 1 hour ago                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Feed Entry Types

```typescript
type FeedEntry = 
  | { type: 'agent-reflection'; agentId: string; content: string; timestamp: string }
  | { type: 'agent-debate'; agents: string[]; topic: string; timestamp: string }
  | { type: 'sprout-progress'; sproutId: string; newStage: GrowthStage; timestamp: string }
  | { type: 'commons-adoption'; sproutId: string; adoptionCount: number; timestamp: string }
  | { type: 'journey-milestone'; journeyId: string; milestone: string; timestamp: string };
```

### Feed vs. Inspector

- **Feed (Center)**: Scrollable timeline of all activity
- **Inspector (Right)**: Detail view when you click an entry

---

## Part 6: Component Grammar (Unified)

### Shared Components (Terminal + Foundation)

| Component | Used In | Purpose |
|-----------|---------|---------|
| `WorkspaceShell` | Both | Three-column container |
| `NavigationSidebar` | Both | Left column with tree |
| `Inspector` | Both | Right column detail panel |
| `CollectionGrid` | Both | Card grids with filtering |
| `CollectionCard` | Both | Individual cards |
| `CommandPalette` | Both | Global ⌘K search/commands |
| `StatusBadge` | Both | Consistent status indicators |

### Terminal-Specific

| Component | Purpose |
|-----------|---------|
| `TerminalChat` | The embedded chat experience |
| `SproutGrid` | Sprouts by growth stage |
| `VillageFeed` | Diary entry timeline |
| `NodeGrid` | Knowledge node cards |

### Foundation-Specific

| Component | Purpose |
|-----------|---------|
| `ModuleLayout` | Consistent console module structure |
| `SproutQueue` | Moderation queue for sprouts |
| `NarrativeGraph` | Visual node/journey editor |

---

## Part 7: Revised Implementation Strategy

### Week 1 (REVISED): Workspace Shell

**Goal:** Replace widget shell with three-column workspace

**Deliverables:**
- `GroveWorkspace.tsx` — Three-column container
- `WorkspaceUIContext.tsx` — Navigation + inspector state
- `NavigationSidebar.tsx` — Left column with tree
- `Inspector.tsx` — Right column (collapsible)
- `WorkspaceHeader.tsx` — Top bar with ⌘K trigger

**Carries Forward:**
- CommandPalette.tsx (working)
- Session timer logic
- Sprout count tracking

### Week 2 (REVISED): Explore Section

**Goal:** Wire up Explore tree with existing Terminal

**Deliverables:**
- `ExploreChat.tsx` — Terminal embedded in workspace
- `NodeGrid.tsx` — Knowledge node cards
- `JourneyList.tsx` — Journey picker
- `LensPicker.tsx` — Lens selection

### Week 3 (REVISED): Garden Section

**Goal:** Implement sprout management

**Deliverables:**
- `SproutGrid.tsx` — Sprouts by growth stage
- `SproutCard.tsx` — Individual sprout display
- `CommonsFeed.tsx` — Network activity preview
- `SproutInspector.tsx` — Sprout detail panel

### Week 4 (REVISED): Village Feed

**Goal:** Implement diary/feed system

**Deliverables:**
- `VillageFeed.tsx` — Entry timeline
- `FeedEntry.tsx` — Individual entry cards
- `FeedInspector.tsx` — Entry detail panel
- Mock data for agent activity

---

## Part 8: Migration Path

### Files to Create

```
src/
├── workspace/
│   ├── GroveWorkspace.tsx        # Main container
│   ├── WorkspaceUIContext.tsx    # State management
│   ├── WorkspaceHeader.tsx       # Top bar
│   ├── NavigationSidebar.tsx     # Left column
│   ├── Inspector.tsx             # Right column
│   └── ContentRouter.tsx         # Center view switching
├── explore/
│   ├── ExploreChat.tsx           # Terminal wrapper
│   ├── NodeGrid.tsx              # Node cards
│   ├── JourneyList.tsx           # Journey picker
│   └── LensPicker.tsx            # Lens selection
├── garden/
│   ├── SproutGrid.tsx            # Sprout cards
│   ├── SproutCard.tsx            # Individual sprout
│   └── CommonsFeed.tsx           # Network preview
├── village/
│   ├── VillageFeed.tsx           # Diary timeline
│   └── FeedEntry.tsx             # Entry card
└── shared/
    ├── CollectionGrid.tsx        # Reusable grid
    ├── CollectionCard.tsx        # Reusable card
    ├── StatusBadge.tsx           # Status indicators
    └── CommandPalette.tsx        # (existing, move here)
```

### Files to Deprecate

```
src/surface/terminal/
├── GroveWidget.tsx               # Replaced by GroveWorkspace
├── WidgetHeader.tsx              # Replaced by WorkspaceHeader
├── WidgetInput.tsx               # Terminal has its own
├── ModeToggle.tsx                # Replaced by NavigationSidebar
├── ExploreView.tsx               # Split into explore/ components
├── GardenView.tsx                # Split into garden/ components
└── ChatView.tsx                  # Becomes placeholder in explore/
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-21 | Jim + Claude | Initial widget spec |
| 2.0 | 2025-12-21 | Jim + Claude | Pivot to three-column workspace |

---

*This document supersedes VISION.md v1.0. The three-column workspace architecture is now the target state.*
