# Grove Workspace: Sprint 5 Kickoff

**Copy and paste this entire message into a new Claude Code session.**

---

## SPRINT 5: Foundation Console Unification

Sprint 4 completed the Terminal workspace at `/terminal`. Now we apply the same three-column pattern and component grammar to the Foundation Console at `/foundation/*`, creating a unified Grove experience.

### Current State Analysis

**What exists at `/foundation/*`:**

| Route | Console | Purpose |
|-------|---------|---------|
| `/foundation` | Dashboard | Landing with console links |
| `/foundation/genesis` | Genesis | Experience mode switcher |
| `/foundation/health` | System Health | API/service monitoring |
| `/foundation/narrative` | Narrative Architect | Journey/Node/Card CRUD |
| `/foundation/engagement` | Engagement Bridge | User engagement analytics |
| `/foundation/knowledge` | Knowledge Vault | RAG document management |
| `/foundation/tuner` | Reality Tuner | Config/settings |
| `/foundation/audio` | Audio Studio | TTS generation |

**Current architecture:**
- `FoundationLayout.tsx` — Two-column (sidebar + content)
- `NavSidebar.tsx` — Collapsible Lucide icons
- `HUDHeader.tsx` — Status bar with version
- `GridViewport.tsx` — Content wrapper with grid background
- Individual consoles are full-page components

**Issues:**
1. Different visual language than Terminal workspace
2. No Inspector pattern (detail views are inline)
3. No CollectionHeader pattern (search is ad-hoc)
4. Lucide icons vs Material Symbols
5. Different color tokens (`holo-cyan` vs `grove-*`)
6. No shared components with Terminal

---

### Sprint 5 Goal

Apply the workspace pattern to Foundation Console:
1. Same three-column layout (nav | content | inspector)
2. Same visual system (colors, typography, icons)
3. Same component patterns (CollectionHeader, Inspector)
4. Shared components extracted to common location

**Result:** Foundation Console and Terminal feel like the same product.

---

### Sprint 5 Deliverables

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| Unified layout | Three-column pattern for Foundation | 🔴 Critical |
| Shared component extraction | Move workspace components to shared | 🔴 Critical |
| Visual system alignment | Same colors, icons, typography | 🔴 Critical |
| NarrativeArchitect refactor | Apply CollectionHeader + Inspector | 🟡 High |
| HealthDashboard refactor | Apply new patterns | 🟡 High |
| Sprout Queue module | New: Moderation workflow | 🟡 High |
| Other consoles | Apply patterns to remaining consoles | 🟢 Medium |

---

### Task Sequence

#### Phase 1: Shared Component Extraction

Move Terminal workspace components to truly shared location:

**Current structure:**
```
src/
├── workspace/           ← Terminal-specific
│   ├── NavigationSidebar.tsx
│   ├── Inspector.tsx
│   ├── ContentRouter.tsx
│   └── ...
├── shared/              ← Exists but incomplete
│   ├── CollectionHeader.tsx
│   ├── SearchInput.tsx
│   └── ...
```

**Target structure:**
```
src/
├── shared/
│   ├── layout/          ← NEW: Layout primitives
│   │   ├── ThreeColumnLayout.tsx
│   │   ├── NavigationTree.tsx
│   │   ├── InspectorPanel.tsx
│   │   └── ContentArea.tsx
│   ├── controls/        ← NEW: Collection controls
│   │   ├── CollectionHeader.tsx
│   │   ├── SearchInput.tsx
│   │   ├── FilterButton.tsx
│   │   ├── SortButton.tsx
│   │   └── ActiveIndicator.tsx
│   ├── forms/           ← NEW: Form elements
│   │   ├── Toggle.tsx
│   │   ├── Slider.tsx
│   │   ├── Select.tsx
│   │   └── Checkbox.tsx
│   ├── feedback/        ← NEW: Status/feedback
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── StatusBadge.tsx
│   │   └── InfoCallout.tsx
│   └── index.ts         ← Barrel export
├── workspace/           ← Terminal-specific composition
│   ├── GroveWorkspace.tsx
│   ├── WorkspaceUIContext.tsx
│   └── ...
├── foundation/          ← Foundation-specific composition
│   ├── FoundationWorkspace.tsx  ← NEW
│   ├── FoundationUIContext.tsx  ← NEW
│   └── consoles/
```

**Key insight:** Extract the *primitives*, keep the *compositions* separate.

**ThreeColumnLayout.tsx:**
```typescript
interface ThreeColumnLayoutProps {
  navigation: React.ReactNode;
  content: React.ReactNode;
  inspector?: React.ReactNode;
  inspectorOpen?: boolean;
  navWidth?: number;        // default 240
  inspectorWidth?: number;  // default 360
  className?: string;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  navigation,
  content,
  inspector,
  inspectorOpen = true,
  navWidth = 240,
  inspectorWidth = 360,
  className,
}) => (
  <div className={cn("flex h-screen overflow-hidden", className)}>
    <aside style={{ width: navWidth }} className="flex-shrink-0 border-r">
      {navigation}
    </aside>
    <main className="flex-1 overflow-auto">
      {content}
    </main>
    {inspector && inspectorOpen && (
      <aside style={{ width: inspectorWidth }} className="flex-shrink-0 border-l">
        {inspector}
      </aside>
    )}
  </div>
);
```

---

#### Phase 2: Foundation Layout Refactor

Replace `FoundationLayout.tsx` with new pattern:

**Before (current):**
```typescript
// FoundationLayout.tsx
<div className="min-h-screen bg-obsidian text-white font-mono">
  <HUDHeader status="healthy" version="2.4.1" />
  <div className="flex">
    <NavSidebar />
    <GridViewport>
      {isRootPath ? <DashboardPlaceholder /> : <Outlet />}
    </GridViewport>
  </div>
</div>
```

**After (new):**
```typescript
// FoundationWorkspace.tsx
import { ThreeColumnLayout } from '@/shared/layout';
import { FoundationUIProvider } from './FoundationUIContext';

export const FoundationWorkspace: React.FC = () => {
  const { inspectorMode, closeInspector } = useFoundationUI();
  
  return (
    <FoundationUIProvider>
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <FoundationHeader />
        <ThreeColumnLayout
          navigation={<FoundationNav />}
          content={<Outlet />}
          inspector={
            inspectorMode.type !== 'none' && (
              <FoundationInspector mode={inspectorMode} onClose={closeInspector} />
            )
          }
          inspectorOpen={inspectorMode.type !== 'none'}
        />
      </div>
    </FoundationUIProvider>
  );
};
```

**FoundationUIContext.tsx:**
```typescript
interface FoundationUIState {
  // Navigation
  activeConsole: string;
  
  // Inspector
  inspectorMode: FoundationInspectorMode;
  
  // Selection state
  selectedJourneyId: string | null;
  selectedNodeId: string | null;
  selectedSproutId: string | null;
}

type FoundationInspectorMode =
  | { type: 'none' }
  | { type: 'journey'; journeyId: string }
  | { type: 'node'; nodeId: string }
  | { type: 'sprout-review'; sproutId: string }
  | { type: 'settings'; section: string };
```

---

#### Phase 3: Navigation Tree Update

Replace `NavSidebar.tsx` with new pattern using shared NavigationTree:

**Foundation Navigation Structure:**
```typescript
const foundationNav = {
  overview: {
    label: 'Overview',
    icon: 'dashboard',
    route: '/foundation',
  },
  content: {
    label: 'Content',
    icon: 'edit_document',
    children: {
      narrative: { label: 'Narrative Architect', route: '/foundation/narrative', icon: 'map' },
      knowledge: { label: 'Knowledge Vault', route: '/foundation/knowledge', icon: 'database' },
      audio: { label: 'Audio Studio', route: '/foundation/audio', icon: 'music_note' },
    },
  },
  moderation: {
    label: 'Moderation',
    icon: 'shield',
    children: {
      sproutQueue: { label: 'Sprout Queue', route: '/foundation/sprouts', icon: 'eco', badge: 12 },
    },
  },
  analytics: {
    label: 'Analytics',
    icon: 'analytics',
    children: {
      engagement: { label: 'Engagement', route: '/foundation/engagement', icon: 'trending_up' },
      health: { label: 'System Health', route: '/foundation/health', icon: 'monitor_heart' },
    },
  },
  settings: {
    label: 'Settings',
    icon: 'settings',
    children: {
      tuner: { label: 'Reality Tuner', route: '/foundation/tuner', icon: 'tune' },
      genesis: { label: 'Experience Mode', route: '/foundation/genesis', icon: 'auto_awesome' },
    },
  },
};
```

---

#### Phase 4: NarrativeArchitect Refactor

The largest console, apply all patterns:

**Current:** 872-line monolith with inline everything
**Target:** Composed from shared components + Inspector

**Refactored structure:**
```typescript
// NarrativeArchitect.tsx (simplified)
const NarrativeArchitect: React.FC = () => {
  const { schema, loading } = useNarrativeSchema();
  const { openInspector } = useFoundationUI();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredJourneys = useFilteredJourneys(schema, searchQuery);
  const filteredNodes = useFilteredNodes(schema, searchQuery);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <ConsoleHeader 
        title="Narrative Architect"
        subtitle={`v2.1 | ${schema.journeys.length} journeys | ${schema.nodes.length} nodes`}
        actions={<SaveButton />}
      />
      
      {/* Metrics */}
      <MetricsRow schema={schema} />
      
      {/* Main content with CollectionHeader */}
      <CollectionHeader
        title="Journeys"
        description="Manage guided exploration paths"
        searchPlaceholder="Search journeys..."
        onSearch={setSearchQuery}
        actions={<CreateJourneyButton />}
      />
      
      {/* Grid */}
      <JourneyGrid 
        journeys={filteredJourneys}
        onSelect={(id) => openInspector({ type: 'journey', journeyId: id })}
      />
    </div>
  );
};
```

**JourneyInspector in Foundation:**
```typescript
// foundation/inspectors/JourneyInspector.tsx
const FoundationJourneyInspector: React.FC<{ journeyId: string }> = ({ journeyId }) => {
  const { schema, updateJourney, deleteJourney } = useNarrativeSchema();
  const journey = schema.journeys[journeyId];
  
  return (
    <InspectorPanel title="Journey Details" onClose={closeInspector}>
      {/* Editable fields */}
      <InspectorSection title="Details">
        <TextInput label="Title" value={journey.title} onChange={...} />
        <TextArea label="Description" value={journey.description} onChange={...} />
        <Select label="Status" value={journey.status} options={['active', 'draft']} onChange={...} />
      </InspectorSection>
      
      {/* Nodes list */}
      <InspectorSection title="Nodes">
        <NodeList journeyId={journeyId} />
      </InspectorSection>
      
      {/* Provenance */}
      <ProvenanceSection artifact={journey} />
      
      {/* Actions */}
      <InspectorActions>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        <Button variant="danger" onClick={handleDelete}>Delete Journey</Button>
      </InspectorActions>
    </InspectorPanel>
  );
};
```

---

#### Phase 5: Sprout Queue Module (New)

**Purpose:** Moderation workflow for community-submitted sprouts

**Route:** `/foundation/sprouts`

**UI:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Sprout Queue                                                                │
│ Review and moderate community-submitted insights                            │
│                                                                             │
│ ┌─────────────────────────────────┐  ┌─────────┐  ┌─────────┐              │
│ │ 🔍 Search submissions...        │  │ Filter  │  │ Sort    │              │
│ └─────────────────────────────────┘  └─────────┘  └─────────┘              │
│                                                                             │
│ PENDING REVIEW (12)                                                         │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ "The 7-month doubling window feels shorter..."                          │ │
│ │ Submitted by: user_abc123 · 2 hours ago                                 │ │
│ │ Lens: Engineer v1.2 · Journey: The Ratchet (Step 3)                     │ │
│ │                                                          [Review →]     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ "Distributed inference changes the economics..."                        │ │
│ │ Submitted by: user_def456 · 5 hours ago                                 │ │
│ │ Lens: Academic v2.0 · Journey: Infrastructure Play                      │ │
│ │                                                          [Review →]     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Inspector for Sprout Review:**
```
┌─────────────────────────────────────┐
│ Sprout Review                    ✕  │
├─────────────────────────────────────┤
│ CONTENT                             │
│ ─────────────────────────────────── │
│ "The 7-month doubling window feels  │
│  shorter each cycle as              │
│  infrastructure matures..."         │
│                                     │
│ CAPTURE CONTEXT                     │
│ ─────────────────────────────────── │
│ 📅 December 22, 2025                │
│ 🔍 Lens: Engineer v1.2              │
│ 🗺️ Journey: The Ratchet (Step 3)    │
│ 👤 Submitter: user_abc123           │
│                                     │
│ MODERATION                          │
│ ─────────────────────────────────── │
│ Quality Score: ████████░░ 82%       │
│ Novelty: High                       │
│ Related existing: 2 similar sprouts │
│                                     │
│ ─────────────────────────────────── │
│ [✓ Approve]  [✗ Reject]  [⚡ Flag]  │
│                                     │
│ Notes for submitter:                │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**SproutQueue.tsx:**
```typescript
const SproutQueue: React.FC = () => {
  const { pendingSprouts, loading } = useSproutQueue();
  const { openInspector } = useFoundationUI();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  return (
    <div className="p-6 space-y-6">
      <ConsoleHeader 
        title="Sprout Queue"
        subtitle={`${pendingSprouts.length} pending review`}
      />
      
      <CollectionHeader
        title="Submissions"
        searchPlaceholder="Search submissions..."
        filterOptions={[
          { label: 'Pending', value: 'pending', count: 12 },
          { label: 'Approved', value: 'approved', count: 45 },
          { label: 'Rejected', value: 'rejected', count: 8 },
        ]}
        onFilterChange={setFilter}
      />
      
      <SproutSubmissionList
        sprouts={pendingSprouts}
        onSelect={(id) => openInspector({ type: 'sprout-review', sproutId: id })}
      />
    </div>
  );
};
```

---

#### Phase 6: Visual System Alignment

Ensure Foundation uses the same design tokens as Terminal:

**Replace holo-* colors with grove-* colors:**
```css
/* OLD */
--holo-cyan: #00d4aa;
--obsidian: #0a0f14;

/* NEW (unified) */
--primary: #4d7c0f;
--background-dark: #0f172a;
--surface-dark: #1e293b;
```

**Replace Lucide with Material Symbols:**
```typescript
// OLD
import { BookOpen, Users, Grid3X3 } from 'lucide-react';

// NEW
<span className="material-symbols-outlined">menu_book</span>
<span className="material-symbols-outlined">group</span>
<span className="material-symbols-outlined">grid_view</span>
```

**Icon mapping for Foundation:**
| Lucide | Material Symbols |
|--------|------------------|
| BookOpen | menu_book |
| Users | group |
| Database | database |
| Sliders | tune |
| Music | music_note |
| Activity | monitoring |
| HeartPulse | monitor_heart |
| Save | save |
| Plus | add |
| Settings | settings |
| Search | search |
| Trash2 | delete |
| Edit3 | edit |
| Map | map |
| GitBranch | account_tree |

---

### File Structure After Sprint 5

```
src/
├── shared/
│   ├── layout/
│   │   ├── ThreeColumnLayout.tsx
│   │   ├── NavigationTree.tsx
│   │   ├── InspectorPanel.tsx
│   │   ├── ContentArea.tsx
│   │   └── index.ts
│   ├── controls/
│   │   ├── CollectionHeader.tsx
│   │   ├── SearchInput.tsx
│   │   ├── FilterButton.tsx
│   │   ├── SortButton.tsx
│   │   ├── ActiveIndicator.tsx
│   │   └── index.ts
│   ├── forms/
│   │   ├── Toggle.tsx
│   │   ├── Slider.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── TextInput.tsx
│   │   ├── TextArea.tsx
│   │   └── index.ts
│   ├── feedback/
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── InfoCallout.tsx
│   │   └── index.ts
│   └── index.ts
├── workspace/                    # Terminal workspace
│   ├── GroveWorkspace.tsx
│   ├── WorkspaceUIContext.tsx
│   └── ...
├── foundation/                   # Foundation workspace
│   ├── FoundationWorkspace.tsx   # NEW
│   ├── FoundationUIContext.tsx   # NEW
│   ├── FoundationNav.tsx         # NEW (replaces NavSidebar)
│   ├── FoundationHeader.tsx      # NEW (replaces HUDHeader)
│   ├── FoundationInspector.tsx   # NEW
│   ├── consoles/
│   │   ├── NarrativeArchitect.tsx  # REFACTORED
│   │   ├── SproutQueue.tsx         # NEW
│   │   ├── HealthDashboard.tsx     # REFACTORED
│   │   └── ...
│   └── inspectors/
│       ├── JourneyInspector.tsx    # NEW
│       ├── NodeInspector.tsx       # NEW
│       └── SproutReviewInspector.tsx # NEW
```

---

### Acceptance Criteria

**Layout:**
- [ ] Foundation uses ThreeColumnLayout
- [ ] Inspector panel opens on entity selection
- [ ] Navigation tree matches Terminal pattern
- [ ] Header consistent with Terminal

**Visual:**
- [ ] Same color palette (grove-* tokens)
- [ ] Material Symbols icons throughout
- [ ] Same typography (Inter, Merriweather)
- [ ] Theme toggle works

**Components:**
- [ ] CollectionHeader used in NarrativeArchitect
- [ ] CollectionHeader used in SproutQueue
- [ ] Inspector pattern for journey editing
- [ ] Inspector pattern for sprout review

**New functionality:**
- [ ] SproutQueue route exists at /foundation/sprouts
- [ ] Can view pending sprouts
- [ ] Can approve/reject sprouts from Inspector
- [ ] Badge shows pending count in nav

**Shared components:**
- [ ] ThreeColumnLayout importable from @/shared/layout
- [ ] All controls importable from @/shared/controls
- [ ] All forms importable from @/shared/forms
- [ ] Terminal still works after extraction

---

### Testing Checklist

1. **Terminal regression:** Verify `/terminal` still works after component extraction
2. **Foundation layout:** Three columns render correctly
3. **Navigation:** All console routes accessible
4. **Inspector:** Opens/closes, shows correct content
5. **NarrativeArchitect:** Journey/node editing still works
6. **SproutQueue:** Can view and moderate sprouts
7. **Theme:** Light/dark mode works in Foundation
8. **Responsive:** Layout handles narrow viewports

---

### Reference

- Terminal workspace: `src/workspace/`
- Current Foundation: `src/foundation/`
- Shared components: `src/shared/`
- Sprint 3-4 patterns: Same visual system and interaction patterns

**Start with Phase 1 (component extraction), verify Terminal still works, then proceed with Foundation refactor.**
