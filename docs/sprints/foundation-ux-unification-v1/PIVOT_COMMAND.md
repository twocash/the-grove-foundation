# Grove Workspace: Sprint Pivot Command

**Copy and paste this entire message into your current Claude Code session to pivot the sprint.**

---

## PIVOT DIRECTIVE

We're pivoting from the footer-mode-toggle Grove Widget to a **three-column Grove Workspace** architecture. Stop current work and read this carefully.

### What Changed

The Grove Widget (single content area + footer mode toggle) is being replaced with **Grove Workspace**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🌳 The Grove                                              ⌘K    ⚙    ?   │
├────────────┬─────────────────────────────────────────────┬──────────────────┤
│ LEFT       │ CENTER                                      │ RIGHT            │
│ Navigation │ Content                                     │ Inspector        │
│ (240px)    │ (flex-1)                                    │ (360px)          │
├────────────┼─────────────────────────────────────────────┼──────────────────┤
│            │                                             │                  │
│ EXPLORE    │  [Content depends on left selection]       │ [Inspector shows │
│  ├─ Chat   │                                             │  clicked item]   │
│  ├─ Nodes  │                                             │                  │
│  ├─ Journeys │                                           │                  │
│  └─ Lenses │                                             │                  │
│            │                                             │                  │
│ GARDEN     │                                             │                  │
│  ├─ My Sprouts │                                        │                  │
│  └─ Commons    │                                        │                  │
│            │                                             │                  │
│ VILLAGE    │                                             │                  │
│  └─ Feed   │  (Diary entries, agent activity)           │                  │
│            │                                             │                  │
│────────────│                                             │                  │
│ 47m │ 🌱 3 │                                             │                  │
│ ● Healthy  │                                             │                  │
└────────────┴─────────────────────────────────────────────┴──────────────────┘
```

### Why We're Pivoting

1. Footer mode toggle doesn't scale (we just added Village Feed / diary)
2. Three-column matches Foundation Console pattern
3. Everything visible in sidebar, no hidden modes
4. Inspector pattern is consistent and powerful
5. This is where we'd end up anyway—better to pivot now

### What Carries Forward

- `CommandPalette.tsx` — Keep it, works great
- Terminal integration work — The embedded Terminal becomes `ExploreChat`
- Session timer / sprout count logic — Moves to sidebar footer
- All the sprint planning artifacts — Just updating the target

### What Gets Deprecated

- `GroveWidget.tsx` → Replaced by `GroveWorkspace.tsx`
- `WidgetHeader.tsx` → Replaced by `WorkspaceHeader.tsx`
- `ModeToggle.tsx` → Replaced by `NavigationSidebar.tsx`
- `ExploreView.tsx`, `GardenView.tsx`, `ChatView.tsx` → Split into section-specific components

### New File Structure

```
src/
├── workspace/
│   ├── GroveWorkspace.tsx        # Three-column container
│   ├── WorkspaceUIContext.tsx    # Navigation + inspector state
│   ├── WorkspaceHeader.tsx       # Top bar
│   ├── NavigationSidebar.tsx     # Left column with tree
│   ├── Inspector.tsx             # Right column (collapsible)
│   └── ContentRouter.tsx         # Center view switching
├── explore/
│   ├── ExploreChat.tsx           # Terminal wrapper
│   ├── NodeGrid.tsx              # Knowledge node cards
│   ├── JourneyList.tsx           # Journey picker
│   └── LensPicker.tsx            # Lens selection
├── garden/
│   ├── SproutGrid.tsx            # Sprouts by growth stage
│   ├── SproutCard.tsx            # Individual sprout
│   └── CommonsFeed.tsx           # Network activity
├── village/
│   ├── VillageFeed.tsx           # Diary timeline
│   └── FeedEntry.tsx             # Entry card
└── shared/
    ├── CollectionGrid.tsx        # Reusable grid
    ├── CollectionCard.tsx        # Reusable card  
    ├── StatusBadge.tsx           # Status indicators
    └── CommandPalette.tsx        # Move existing here
```

### Updated Spec

Read the full pivot spec at:
```
docs/sprints/foundation-ux-unification-v1/VISION_v2.md
```

### Your Next Steps

1. **Read VISION_v2.md** — Understand the three-column architecture
2. **Create the workspace shell** — `GroveWorkspace.tsx` with three columns
3. **Create NavigationSidebar** — Tree structure with Explore/Garden/Village sections
4. **Wire up ContentRouter** — Switch center content based on nav selection
5. **Move Terminal** — The existing embedded Terminal becomes `ExploreChat` at `explore.chat`
6. **Add Inspector** — Right panel that shows detail for clicked items

### Navigation Tree Structure

```typescript
const navigationTree = {
  explore: {
    label: 'Explore',
    icon: Compass,
    children: {
      chat: { label: 'Chat', view: 'terminal-chat' },
      nodes: { 
        label: 'Nodes',
        children: {}, // Populated from narratives.json
      },
      journeys: { label: 'Journeys', view: 'journey-list' },
      lenses: { label: 'Lenses', view: 'lens-picker' },
    },
  },
  garden: {
    label: 'Garden',
    icon: Sprout,
    children: {
      mySprouts: { label: 'My Sprouts', view: 'sprout-grid' },
      commons: { label: 'Commons', view: 'commons-feed' },
    },
  },
  village: {
    label: 'Village',
    icon: Users,
    children: {
      feed: { label: 'Feed', view: 'village-feed' },
    },
  },
};
```

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
```

### Acceptance Criteria for Pivot

- [ ] Three-column layout renders at `/terminal`
- [ ] Left sidebar shows Explore/Garden/Village tree
- [ ] Clicking nav items changes center content
- [ ] Explore > Chat shows the existing Terminal
- [ ] Inspector panel opens when items are clicked
- [ ] ⌘K still opens command palette
- [ ] Session timer and sprout count in sidebar footer

### Reference Pattern

Look at Symbol Garden 2.0 at `C:\GitHub\symbol-garden-2` for the three-column pattern:
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/RightDrawer.tsx`
- `src/lib/ui-context.tsx`

Now execute the pivot. Start with creating the `src/workspace/` directory and `GroveWorkspace.tsx`.
