# Grove Workspace: Sprint 2 Kickoff

**Copy and paste this entire message into a new Claude Code session.**

---

## SPRINT 2: Content Engine + Dark Mode Polish + IA Restructure

We've completed the three-column workspace shell. Now we need to:
1. Fix the dark mode styling (light gray elements breaking the theme)
2. Restructure the navigation to the correct IA
3. Wire up real content to replace placeholders

### CRITICAL: Information Architecture Update

The sidebar navigation is wrong. Restructure to this IA:

```
EXPLORE              ← Terminal view (the working demo)
  ├─ Nodes           ← Knowledge node cards
  ├─ Journeys        ← Journey picker
  └─ Lenses          ← Lens picker

DO                   ← Action-oriented AI assistance (all Coming Soon)
  ├─ Chat            ← Brainstorming, writing, conversation
  ├─ Apps            ← Coding widgets for personal use
  └─ Agents          ← Task assistance, delegation

CULTIVATE            ← Knowledge refinement
  ├─ My Sprouts      ← Your captured insights
  └─ Commons         ← Network-wide knowledge

VILLAGE              ← Social/narrative layer
  └─ Feed            ← Agent activity, diary entries
```

**Key changes:**
- "Explore" is the Terminal itself (not a parent with "Chat" under it)
- "Chat" moves under new "Do" section as Coming Soon
- "Garden" renamed to "Cultivate"
- New "Do" section for future productivity features (all placeholders)

**Navigation tree in code:**

```typescript
const navigationTree = {
  explore: {
    label: 'Explore',
    icon: Compass, // or Terminal icon
    view: 'terminal', // Clicking Explore directly shows Terminal
    children: {
      nodes: { label: 'Nodes', view: 'node-grid' },
      journeys: { label: 'Journeys', view: 'journey-list' },
      lenses: { label: 'Lenses', view: 'lens-picker' },
    },
  },
  do: {
    label: 'Do',
    icon: Zap, // or Play icon
    children: {
      chat: { label: 'Chat', view: 'chat-placeholder', comingSoon: true },
      apps: { label: 'Apps', view: 'apps-placeholder', comingSoon: true },
      agents: { label: 'Agents', view: 'agents-placeholder', comingSoon: true },
    },
  },
  cultivate: {
    label: 'Cultivate',
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

### CRITICAL: Dark Mode Style Fix

The workspace has light gray elements that break the dark theme. Apply these fixes:

```css
/* All text should use these colors, NEVER gray-300, gray-400, etc. */
--grove-text: #e2e8f0;          /* Primary text */
--grove-text-muted: #94a3b8;    /* Secondary text */
--grove-text-dim: #64748b;      /* Tertiary/disabled */

/* Backgrounds - NEVER use white, gray-100, gray-200 */
--grove-bg: #0a0f14;            /* Deep background */
--grove-surface: #121a22;       /* Cards, panels */
--grove-surface-hover: #1a242f; /* Hover states */
--grove-border: #1e2a36;        /* Borders */

/* Accent */
--grove-accent: #00d4aa;        /* Primary green */
--grove-accent-muted: #0a4a3a;  /* Muted green bg */
```

**Specific fixes needed:**
- Lens cards have light backgrounds → Change to `grove-surface`
- Any `bg-gray-*` classes → Replace with `bg-[#121a22]` or CSS variable
- Any `text-gray-300/400` → Replace with `text-[#94a3b8]` or `grove-text-muted`
- Hover states showing light colors → Use `hover:bg-[#1a242f]`
- "Coming Soon" items should be dimmed with `grove-text-dim`

Search the codebase for light mode violations:
```bash
grep -r "bg-gray-" src/
grep -r "bg-white" src/
grep -r "text-gray-[1-4]" src/
```

### Sprint 2 Goals

| Deliverable | Description | Status |
|-------------|-------------|--------|
| IA restructure | New nav tree (Explore/Do/Cultivate/Village) | 🔴 Do first |
| Dark mode fix | Consistent dark theme throughout | 🔴 Do first |
| Explore = Terminal | Clicking "Explore" shows Terminal directly | 🔨 Wire up |
| Lens picker | Click lens → activates in Terminal | 🔨 Wire up |
| Node grid | Show knowledge nodes as cards | 🔨 Wire up |
| Journey list | Show available journeys | 🔨 Wire up |
| Do section | Placeholder views for Chat/Apps/Agents | 🔨 Create |
| Sprout grid | Show user's sprouts by stage | 🔨 Wire up |
| Village feed | Mock diary entries | 🔨 Create |

### Task Sequence

**Phase 1: IA Restructure + Dark Mode (do first)**
1. Update `NavigationSidebar.tsx` with new tree structure
2. Rename "Garden" to "Cultivate" throughout
3. Add "Do" section with Coming Soon items
4. Make "Explore" click show Terminal directly
5. Audit all components for light-mode colors
6. Replace hardcoded colors with CSS variables

**Phase 2: Explore Section**
1. Clicking "Explore" → Shows Terminal (already working, just wire nav)
2. `NodeGrid.tsx` → Pull nodes from narratives, display as cards
3. `JourneyList.tsx` → Pull journeys from narratives, show progress
4. `LensPicker.tsx` → Wire to `default-personas.ts`, clicking activates lens

**Phase 3: Do Section (Placeholders)**
1. Create `DoPlaceholder.tsx` — Reusable Coming Soon view
2. Chat placeholder with description of future capability
3. Apps placeholder with description
4. Agents placeholder with description
5. Style as dimmed/disabled but informative

**Phase 4: Cultivate Section**
1. `SproutGrid.tsx` → Use existing `useSproutStorage` hook
2. Group sprouts by growth stage (tender, rooting, etc.)
3. `SproutCard.tsx` → Show excerpt, source, timestamp
4. `CommonsFeed.tsx` → Network activity preview (can be mock)

**Phase 5: Village Feed**
1. Create mock data schema for feed entries
2. `VillageFeed.tsx` → Scrollable timeline
3. `FeedEntry.tsx` → Entry cards with type icons
4. Click entry → Inspector shows full content

### Coming Soon Placeholder Component

Create a reusable placeholder for the "Do" section:

```typescript
// src/do/DoPlaceholder.tsx
interface DoPlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const DoPlaceholder: React.FC<DoPlaceholderProps> = ({ title, description, icon, features }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="text-grove-text-dim mb-4">{icon}</div>
    <h2 className="text-xl font-semibold text-grove-text mb-2">{title}</h2>
    <p className="text-grove-text-muted mb-6 max-w-md">{description}</p>
    <div className="text-grove-text-dim text-sm">
      <p className="mb-2">Coming capabilities:</p>
      <ul className="list-disc list-inside">
        {features.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    </div>
    <div className="mt-8 px-4 py-2 border border-grove-border rounded text-grove-text-dim text-sm">
      Coming in Grove 1.0
    </div>
  </div>
);
```

**Usage for each Do item:**

```typescript
// Chat placeholder
<DoPlaceholder
  title="Chat"
  description="Your AI thinking partner for brainstorming, writing, and conversation."
  icon={<MessageSquare size={48} />}
  features={[
    "Brainstorm ideas without sending data to the cloud",
    "Draft and refine writing in your voice",
    "Explore topics through natural conversation",
  ]}
/>

// Apps placeholder
<DoPlaceholder
  title="Apps"
  description="Build personal tools and widgets powered by local AI."
  icon={<Code size={48} />}
  features={[
    "Create custom dashboards and calculators",
    "Build automation scripts with natural language",
    "Design personal productivity tools",
  ]}
/>

// Agents placeholder
<DoPlaceholder
  title="Agents"
  description="Delegate tasks to AI agents that work on your behalf."
  icon={<Bot size={48} />}
  features={[
    "Research and summarize topics",
    "Monitor and alert on conditions",
    "Execute multi-step workflows",
  ]}
/>
```

### Data Sources Reference

**Lenses:** `src/data/default-personas.ts`
```typescript
{ id: 'concerned-citizen', name: 'Concerned Citizen', description: '...', systemPrompt: '...' }
```

**Nodes/Journeys:** `src/data/narratives.json` or `narratives-v2.1.json`

**Sprouts:** `hooks/useSproutStorage.ts`
```typescript
// Provides: sprouts, plantSprout, getSproutsByStage
```

**Village Feed:** Create new mock data
```typescript
// src/data/mock-feed.ts
export const mockFeedEntries: FeedEntry[] = [
  {
    id: '1',
    type: 'agent-reflection',
    agentId: 'agent-7',
    content: 'The 7-month window feels shorter each cycle...',
    timestamp: '2025-12-21T10:30:00Z',
  },
  {
    id: '2', 
    type: 'sprout-progress',
    sproutId: 'sp-123',
    previousStage: 'tender',
    newStage: 'rooting',
    timestamp: '2025-12-21T10:15:00Z',
  },
];
```

### File Structure Update

```
src/
├── workspace/
│   ├── GroveWorkspace.tsx
│   ├── WorkspaceUIContext.tsx
│   ├── NavigationSidebar.tsx    ← UPDATE with new IA
│   ├── Inspector.tsx
│   └── ContentRouter.tsx        ← UPDATE with new routes
├── explore/
│   ├── ExploreTerminal.tsx      ← Rename from ExploreChat
│   ├── NodeGrid.tsx
│   ├── JourneyList.tsx
│   └── LensPicker.tsx
├── do/                          ← NEW DIRECTORY
│   ├── DoPlaceholder.tsx        ← Reusable Coming Soon
│   ├── ChatPlaceholder.tsx
│   ├── AppsPlaceholder.tsx
│   └── AgentsPlaceholder.tsx
├── cultivate/                   ← RENAME from garden/
│   ├── SproutGrid.tsx
│   ├── SproutCard.tsx
│   └── CommonsFeed.tsx
├── village/
│   ├── VillageFeed.tsx
│   └── FeedEntry.tsx
└── shared/
    └── ...
```

### Acceptance Criteria

- [ ] Sidebar shows: Explore, Do, Cultivate, Village
- [ ] Clicking "Explore" shows Terminal directly
- [ ] "Do" section items show Coming Soon placeholders
- [ ] "Garden" renamed to "Cultivate" everywhere
- [ ] No light gray/white elements anywhere in UI
- [ ] Node grid shows real nodes from narratives
- [ ] Journey list shows real journeys
- [ ] Lens picker activates lens in Terminal
- [ ] Sprout grid shows user's actual sprouts
- [ ] Village feed shows mock diary entries
- [ ] All views consistent with dark theme

### Reference

- Architecture spec: `docs/sprints/foundation-ux-unification-v1/VISION_v2.md`
- Existing hooks: `hooks/useSproutStorage.ts`, `hooks/useNarrative.ts`
- Personas: `src/data/default-personas.ts`

**Start with Phase 1 (IA + Dark Mode), then work through each section. Test after each phase.**
