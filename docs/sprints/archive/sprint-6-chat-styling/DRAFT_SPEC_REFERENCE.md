# Grove Workspace: Sprint 6 Kickoff

**Copy and paste this entire message into a new Claude Code session.**

---

## SPRINT 6: Console Migration + Sprout Queue + Chat Readability

Sprint 5 established the Foundation workspace framework (ThreeColumnLayout, FoundationNav, FoundationInspector). Now we:
1. **Fix chat readability** — Cap message width for comfortable reading
2. Migrate existing consoles to use shared components and unified styling
3. Build out the Sprout Queue moderation workflow
4. Complete the visual system alignment (holo-* → grove-*)

### Current State

**What Sprint 5 delivered:**
- `src/shared/` — Layout, forms, controls, feedback components
- `src/foundation/FoundationWorkspace.tsx` — Three-column shell
- `src/foundation/FoundationNav.tsx` — Navigation tree
- `src/foundation/FoundationInspector.tsx` — Inspector panel
- `/foundation/sprouts` — Placeholder route

**What remains:**
- **Chat messages too wide** — Hard to read on wide screens
- Console internals still use `holo-*` colors and old component patterns
- SproutQueue is just a placeholder
- NarrativeArchitect doesn't use Inspector pattern
- Other consoles (Health, Knowledge, Audio, etc.) need migration

---

### Sprint 6 Deliverables

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| **Chat readability** | Cap message width at ~768px | 🔴 Critical |
| **Chat styling overhaul** | Fix contrast, message bubbles, input styling | 🔴 Critical |
| NarrativeArchitect migration | Use CollectionHeader, Inspector for editing | 🔴 Critical |
| SproutQueue implementation | Full moderation workflow | 🔴 Critical |
| Visual migration | Replace holo-* with grove-* tokens | 🔴 Critical |
| HealthDashboard migration | Apply new patterns | 🟡 High |
| Foundation components update | DataPanel, GlowButton, MetricCard → unified | 🟡 High |
| Remaining consoles | KnowledgeVault, AudioStudio, etc. | 🟢 Medium |

---

### Task Sequence

#### Phase 0: Chat Readability Pattern (DO FIRST)

**Problem:** Chat messages span full content width, making them hard to read on wide screens. The human eye struggles to track back to the start of the next line when lines exceed ~75 characters.

**Solution:** Cap message container at a fixed max-width that provides comfortable reading regardless of screen size.

**The readability math:**

| Screen Width | Max Message Width | Ratio |
|--------------|-------------------|-------|
| 1366px | 768px | ~56% |
| 1440px | 768px | ~53% |
| 1920px | 768px | ~40% |
| 2560px | 768px | ~30% |

**Implementation pattern:**

```css
/* Chat message container */
.chat-message-container {
  max-width: 48rem;  /* 768px - comfortable reading width */
  width: 100%;
  margin: 0 auto;    /* Center when container is wider */
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .chat-message-container {
    max-width: 38rem;  /* 608px for smaller screens */
  }
}

@media (max-width: 768px) {
  .chat-message-container {
    max-width: 100%;   /* Full width on mobile */
    padding: 0 1rem;
  }
}
```

**Tailwind implementation:**

```tsx
// ChatMessage.tsx or similar
<div className="w-full flex justify-center">
  <div className="w-full max-w-3xl lg:max-w-[38rem] xl:max-w-3xl px-4">
    {/* Message content */}
  </div>
</div>
```

**Where to apply:**

1. **Terminal chat** (`src/explore/ExploreChat.tsx` or wherever chat renders)
2. **Any future chat UI** (Widget chat, embedded chat, etc.)
3. **Long-form content views** (Journey content, Sprout full view)

**ChatContainer component (reusable):**

```tsx
// src/shared/layout/ChatContainer.tsx

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  children, 
  className 
}) => (
  <div className={cn(
    "w-full max-w-3xl mx-auto px-4",
    "lg:max-w-[38rem] xl:max-w-3xl",
    className
  )}>
    {children}
  </div>
);
```

**Usage in chat views:**

```tsx
// ExploreChat.tsx
const ExploreChat: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto">
      <ChatContainer>
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </ChatContainer>
      
      {/* Input stays at bottom, also constrained */}
      <div className="border-t">
        <ChatContainer>
          <ChatInput onSend={handleSend} />
        </ChatContainer>
      </div>
    </div>
  );
};
```

**Visual result:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Nav │                        Content Area                          │ Inspector│
│     │  ┌──────────────────────────────────────────────────────┐    │         │
│     │  │                                                      │    │         │
│     │  │   User: What is the Ratchet thesis?                 │    │         │
│     │  │                                                      │    │         │
│     │  │   Assistant: The Ratchet thesis describes how AI    │    │         │
│     │  │   capabilities propagate from frontier to consumer  │    │         │
│     │  │   hardware with predictable timing patterns...      │    │         │
│     │  │                                                      │    │         │
│     │  │   ← 768px max, centered in content area →           │    │         │
│     │  │                                                      │    │         │
│     │  └──────────────────────────────────────────────────────┘    │         │
│     │                    ↑ whitespace on wide screens ↑            │         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Files to update:**
- `src/shared/layout/ChatContainer.tsx` — NEW: Reusable container
- `src/explore/ExploreChat.tsx` — Wrap messages in ChatContainer
- `src/shared/layout/index.ts` — Export ChatContainer

**Acceptance criteria:**
- [ ] Messages max out at ~768px width
- [ ] Messages center when container is wider
- [ ] Comfortable reading on 1920px+ screens
- [ ] Mobile still uses full width
- [ ] Input field matches message width

---

#### Phase 0.5: Chat Styling Overhaul (CRITICAL UX FIX)

**Problem:** The current chat has severe contrast issues in dark mode. User messages are nearly invisible (dark text on dark background). The overall styling doesn't match the polished mockup direction.

**Reference mockups:**
- Light mode: `mockup_3/screen.png` — Clean, professional, proper contrast
- Dark mode: `mockup_4/screen.png` — Deep slate background, proper message bubbles

**Design direction from mockups:**

**Color System Update:**
```typescript
// tailwind.config.ts additions
colors: {
  "primary": "#197fe6",           // Bright blue (more vibrant than green)
  "background-light": "#f6f7f8",  // Warm off-white
  "background-dark": "#111921",   // Deep slate (NOT pure black)
  "surface-dark": "#1E293B",      // Elevated surfaces
  "border-dark": "#293038",       // Subtle borders
}
```

**Message Bubble Styles:**

```css
/* User message (right-aligned) */
.user-message {
  @apply bg-primary text-white;
  @apply px-5 py-3.5 rounded-2xl rounded-tr-sm;
  @apply shadow-md;
  @apply max-w-[85%] md:max-w-[70%];
}

/* AI message (left-aligned) */
.ai-message {
  @apply bg-surface-dark text-slate-100;
  @apply border border-border-dark;
  @apply px-5 py-3.5 rounded-2xl rounded-tl-sm;
  @apply shadow-sm;
  @apply max-w-[90%] md:max-w-[85%];
}

/* Light mode variants */
.light .ai-message {
  @apply bg-slate-100 text-slate-900;
  @apply border-slate-200;
}
```

**Message Layout Pattern:**

```tsx
// UserMessage component
<div className="flex items-end gap-3 justify-end group">
  <div className="flex flex-col gap-1 items-end max-w-[85%] md:max-w-[70%]">
    {/* Metadata */}
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs text-slate-500">10:42 AM</span>
      <p className="text-slate-300 text-xs font-bold">You</p>
    </div>
    {/* Bubble */}
    <div className="p-4 rounded-2xl rounded-tr-sm bg-primary text-white shadow-md">
      <p className="text-sm md:text-base font-medium leading-relaxed">
        {content}
      </p>
    </div>
  </div>
  {/* Avatar (optional) */}
  <Avatar user={user} className="size-10 hidden sm:block" />
</div>

// AIMessage component
<div className="flex items-start gap-3 group">
  <Avatar ai className="size-10 hidden sm:block shadow-[0_0_15px_rgba(25,127,230,0.2)]" />
  <div className="flex flex-col gap-1 items-start max-w-[90%] md:max-w-[85%]">
    {/* Metadata */}
    <div className="flex items-center gap-2 mb-1">
      <p className="text-primary text-xs font-bold">The Grove AI</p>
      <span className="text-xs text-slate-500">10:42 AM</span>
    </div>
    {/* Bubble */}
    <div className="p-4 rounded-2xl rounded-tl-sm bg-surface-dark text-slate-100 border border-border-dark shadow-sm">
      <p className="text-sm md:text-base font-normal leading-relaxed">
        {content}
      </p>
    </div>
  </div>
</div>
```

**Input Area Styling:**

```tsx
<div className="p-4 md:px-8 md:pb-8 border-t border-border-dark bg-background-dark/95 backdrop-blur">
  <ChatContainer>
    <div className="relative flex items-end gap-2 p-2 rounded-xl bg-surface-dark border border-border-dark focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-lg">
      {/* Attachment button */}
      <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-background-dark transition-colors">
        <span className="material-symbols-outlined">add_circle</span>
      </button>
      
      {/* Input */}
      <textarea 
        className="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:ring-0 resize-none py-2.5"
        placeholder="Ask a follow-up question or type to search..."
        rows={1}
      />
      
      {/* Send button */}
      <button className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md">
        <span className="material-symbols-outlined">send</span>
      </button>
    </div>
    <p className="text-center text-[10px] text-slate-500 mt-2">
      The Grove AI can make mistakes. Verify important information.
    </p>
  </ChatContainer>
</div>
```

**Lens Cards in Chat (inline):**

When the AI presents lens options in chat, they should be styled cards:

```tsx
<div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
  {lenses.map(lens => (
    <div 
      key={lens.id}
      className="
        flex flex-col rounded-xl overflow-hidden
        bg-surface-dark border border-border-dark
        hover:border-primary/50 transition-all
        hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]
        cursor-pointer group
      "
    >
      {/* Optional image header */}
      {lens.image && (
        <div className="h-32 w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${lens.image})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent" />
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
            <span className={`material-symbols-outlined text-[20px] ${lens.accentColor}`}>
              {lens.icon}
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="text-white text-lg font-bold group-hover:text-primary transition-colors">
            {lens.name}
          </h3>
          <p className="text-slate-400 text-sm leading-snug mt-1">
            {lens.description}
          </p>
        </div>
        <button className="
          mt-auto w-full py-2.5 rounded-lg 
          bg-border-dark text-white text-sm font-bold 
          hover:bg-primary transition-colors 
          flex items-center justify-center gap-2
        ">
          Apply Lens
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  ))}
</div>
```

**Files to create/update:**
- `src/shared/chat/ChatMessage.tsx` — Unified message component
- `src/shared/chat/UserMessage.tsx` — Right-aligned user bubble
- `src/shared/chat/AIMessage.tsx` — Left-aligned AI bubble
- `src/shared/chat/ChatInput.tsx` — Styled input area
- `src/shared/chat/InlineLensCards.tsx` — Lens selection in chat
- `src/explore/ExploreChat.tsx` — Update to use new components

**Key contrast fixes:**
- User messages: `bg-primary text-white` (NOT dark on dark)
- AI messages: `bg-surface-dark text-slate-100` with visible border
- Metadata: `text-slate-500` for timestamps, `text-primary` for AI name
- Input: `bg-surface-dark` with focus ring on `border-primary`

**Typography from mockup:**
- Font: Manrope (or Inter as fallback)
- Message text: `text-sm md:text-base leading-relaxed`
- Metadata: `text-xs`
- Lens card titles: `text-lg font-bold`

**Acceptance criteria:**
- [ ] User messages have white text on blue background (high contrast)
- [ ] AI messages have light text on dark surface (readable)
- [ ] Message bubbles have proper rounded corners (chat bubble style)
- [ ] Timestamps and metadata are visible but subtle
- [ ] Input area has visible border and focus state
- [ ] Lens cards render properly when presented in chat
- [ ] Both light and dark modes work correctly

---

#### Phase 1: Foundation Component Migration

Update the Foundation-specific components to use unified design tokens:

**Files to update:**
- `src/foundation/components/DataPanel.tsx`
- `src/foundation/components/GlowButton.tsx`
- `src/foundation/components/MetricCard.tsx`

**Color token mapping:**

| Old (holo-*) | New (grove-*) |
|--------------|---------------|
| `holo-cyan` | `primary` (#4d7c0f) |
| `holo-cyan/10` | `primary/10` |
| `holo-cyan/20` | `primary/20` |
| `holo-lime` | `emerald-500` |
| `holo-red` | `red-500` |
| `obsidian` | `background-dark` (#0f172a) |
| `obsidian-raised` | `surface-dark` (#1e293b) |
| `text-gray-500` | `text-slate-500` |
| `text-gray-400` | `text-slate-400` |
| `text-white` | `text-slate-100` |

**DataPanel.tsx update:**

```typescript
// Before
<div className="bg-obsidian-raised border border-holo-cyan/20 rounded-lg">
  <div className="text-holo-cyan">{title}</div>
</div>

// After
<div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg">
  <div className="text-primary dark:text-primary">{title}</div>
</div>
```

**GlowButton.tsx update:**

```typescript
// Before
const variants = {
  primary: 'bg-holo-cyan/20 text-holo-cyan hover:bg-holo-cyan/30 border-holo-cyan/50',
  secondary: 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/10',
  danger: 'bg-holo-red/20 text-holo-red hover:bg-holo-red/30 border-holo-red/50',
};

// After  
const variants = {
  primary: 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/50',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-border-light dark:border-border-dark',
  danger: 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50',
};
```

---

#### Phase 2: NarrativeArchitect Refactor

The 872-line monolith needs to be broken apart:

**Current problems:**
- Inline search, no CollectionHeader
- Inline editing, no Inspector pattern
- All state local, no context integration
- Mixed V2.0/V2.1 logic is confusing

**Target architecture:**

```
src/foundation/consoles/narrative/
├── NarrativeArchitect.tsx      # Main view (simplified)
├── JourneyGrid.tsx             # Journey cards grid
├── NodeGrid.tsx                # Node cards grid
├── useNarrativeSchema.ts       # Data fetching hook
└── index.ts

src/foundation/inspectors/
├── JourneyInspector.tsx        # Edit journey in Inspector
├── NodeInspector.tsx           # Edit node in Inspector
└── index.ts
```

**NarrativeArchitect.tsx (simplified):**

```typescript
const NarrativeArchitect: React.FC = () => {
  const { schema, loading, saveSchema } = useNarrativeSchema();
  const { openInspector } = useFoundationUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'journeys' | 'nodes'>('journeys');
  
  if (loading) return <LoadingSpinner message="Loading Narrative Engine..." />;
  
  const isV21 = schema?.version === '2.1';
  const journeys = Object.values(schema?.journeys || {});
  const nodes = Object.values(schema?.nodes || {});
  
  const filteredJourneys = useMemo(() => {
    if (!searchQuery) return journeys;
    const q = searchQuery.toLowerCase();
    return journeys.filter(j => 
      j.title.toLowerCase().includes(q) || 
      j.description.toLowerCase().includes(q)
    );
  }, [journeys, searchQuery]);
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Narrative Architect
          </h1>
          <p className="text-slate-500 text-sm">
            {isV21 ? `v2.1 | ${journeys.length} journeys | ${nodes.length} nodes` : 'v2.0'}
          </p>
        </div>
        <Button variant="primary" onClick={saveSchema}>
          <span className="material-symbols-outlined text-sm">save</span>
          Save to Production
        </Button>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Journeys" value={journeys.length} highlight />
        <MetricCard label="Active" value={journeys.filter(j => j.status === 'active').length} />
        <MetricCard label="Total Nodes" value={nodes.length} />
        <MetricCard label="Orphan Nodes" value={nodes.filter(n => !n.primaryNext).length} />
      </div>
      
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button 
          variant={viewMode === 'journeys' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('journeys')}
        >
          <span className="material-symbols-outlined text-sm">map</span>
          Journeys
        </Button>
        <Button 
          variant={viewMode === 'nodes' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('nodes')}
        >
          <span className="material-symbols-outlined text-sm">account_tree</span>
          Nodes
        </Button>
      </div>
      
      {/* Collection with header */}
      <CollectionHeader
        title={viewMode === 'journeys' ? 'Journeys' : 'Nodes'}
        description={viewMode === 'journeys' 
          ? 'Guided exploration paths through Grove content'
          : 'Individual content nodes within journeys'
        }
        searchPlaceholder={`Search ${viewMode}...`}
        onSearch={setSearchQuery}
        actions={
          <Button variant="primary" size="sm" disabled>
            <span className="material-symbols-outlined text-sm">add</span>
            New {viewMode === 'journeys' ? 'Journey' : 'Node'}
          </Button>
        }
      />
      
      {/* Grid */}
      {viewMode === 'journeys' ? (
        <JourneyGrid 
          journeys={filteredJourneys}
          onSelect={(id) => openInspector({ type: 'journey', journeyId: id })}
        />
      ) : (
        <NodeGrid 
          nodes={filteredNodes}
          onSelect={(id) => openInspector({ type: 'node', nodeId: id })}
        />
      )}
    </div>
  );
};
```

**JourneyInspector.tsx:**

```typescript
const JourneyInspector: React.FC<{ journeyId: string }> = ({ journeyId }) => {
  const { schema, updateJourney } = useNarrativeSchema();
  const { closeInspector } = useFoundationUI();
  const journey = schema?.journeys?.[journeyId];
  
  if (!journey) return <EmptyState message="Journey not found" />;
  
  const nodes = Object.values(schema?.nodes || {}).filter(n => n.journeyId === journeyId);
  
  const [title, setTitle] = useState(journey.title);
  const [description, setDescription] = useState(journey.description);
  const [status, setStatus] = useState(journey.status);
  
  const handleSave = () => {
    updateJourney(journeyId, { title, description, status });
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <h3 className="font-medium text-slate-900 dark:text-slate-100">Journey Details</h3>
        <button onClick={closeInspector} className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <TextInput label="Title" value={title} onChange={setTitle} />
          <TextArea label="Description" value={description} onChange={setDescription} rows={3} />
          <Select 
            label="Status" 
            value={status} 
            onChange={setStatus}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
        
        {/* Nodes */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Nodes ({nodes.length})
          </h4>
          <div className="space-y-2">
            {nodes.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0)).map(node => (
              <div 
                key={node.id}
                className="p-3 bg-surface-light dark:bg-slate-800 rounded-lg border border-border-light dark:border-border-dark"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary">#{node.sequenceOrder}</span>
                  <span className="text-sm text-slate-900 dark:text-slate-100">{node.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Provenance (stub) */}
        <div className="pt-4 border-t border-border-light dark:border-border-dark">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Provenance
          </h4>
          <div className="text-xs text-slate-400 space-y-1">
            <div>v{journey.version || '1.0'} · System default</div>
            <div>Created: {journey.createdAt || 'Unknown'}</div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-border-light dark:border-border-dark space-y-2">
        <Button variant="primary" fullWidth onClick={handleSave}>
          Save Changes
        </Button>
        <Button variant="ghost" fullWidth>
          View JSON
        </Button>
      </div>
    </div>
  );
};
```

---

#### Phase 3: Sprout Queue Implementation

Build the full moderation workflow:

**Data model:**

```typescript
// src/core/schema/sprout-queue.ts

interface QueuedSprout {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  
  // Capture context
  captureContext: {
    userId: string;
    timestamp: string;
    lensId: string;
    lensVersion: string;
    journeyId?: string;
    journeyStep?: number;
    nodeId?: string;
    sessionId: string;
  };
  
  // Moderation
  moderation?: {
    reviewedBy: string;
    reviewedAt: string;
    decision: 'approved' | 'rejected' | 'flagged';
    notes?: string;
    qualityScore?: number;
  };
  
  // If approved, target location
  targetCommons?: {
    category: string;
    tags: string[];
  };
}
```

**SproutQueue.tsx (full implementation):**

```typescript
const SproutQueue: React.FC = () => {
  const { sprouts, loading, updateSprout } = useSproutQueue();
  const { openInspector, inspectorMode } = useFoundationUI();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSprouts = useMemo(() => {
    let result = sprouts;
    
    if (filter !== 'all') {
      result = result.filter(s => s.status === filter);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.content.toLowerCase().includes(q));
    }
    
    return result.sort((a, b) => 
      new Date(b.captureContext.timestamp).getTime() - 
      new Date(a.captureContext.timestamp).getTime()
    );
  }, [sprouts, filter, searchQuery]);
  
  const counts = useMemo(() => ({
    pending: sprouts.filter(s => s.status === 'pending').length,
    approved: sprouts.filter(s => s.status === 'approved').length,
    rejected: sprouts.filter(s => s.status === 'rejected').length,
    flagged: sprouts.filter(s => s.status === 'flagged').length,
  }), [sprouts]);
  
  if (loading) return <LoadingSpinner message="Loading sprout queue..." />;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Sprout Queue
        </h1>
        <p className="text-slate-500 text-sm">
          Review and moderate community-submitted insights
        </p>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Pending Review" value={counts.pending} highlight />
        <MetricCard label="Approved" value={counts.approved} />
        <MetricCard label="Rejected" value={counts.rejected} />
        <MetricCard label="Flagged" value={counts.flagged} />
      </div>
      
      {/* Collection Header */}
      <CollectionHeader
        title="Submissions"
        description="Community insights awaiting moderation"
        searchPlaceholder="Search submissions..."
        onSearch={setSearchQuery}
        filterOptions={[
          { label: 'Pending', value: 'pending', count: counts.pending },
          { label: 'Approved', value: 'approved', count: counts.approved },
          { label: 'Rejected', value: 'rejected', count: counts.rejected },
          { label: 'All', value: 'all' },
        ]}
        activeFilter={filter}
        onFilterChange={setFilter}
      />
      
      {/* List */}
      {filteredSprouts.length === 0 ? (
        <EmptyState 
          icon="eco"
          message={filter === 'pending' 
            ? 'No sprouts pending review' 
            : `No ${filter} sprouts found`
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredSprouts.map(sprout => (
            <SproutSubmissionCard
              key={sprout.id}
              sprout={sprout}
              selected={inspectorMode.type === 'sprout-review' && inspectorMode.sproutId === sprout.id}
              onClick={() => openInspector({ type: 'sprout-review', sproutId: sprout.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

**SproutSubmissionCard.tsx:**

```typescript
const SproutSubmissionCard: React.FC<{
  sprout: QueuedSprout;
  selected: boolean;
  onClick: () => void;
}> = ({ sprout, selected, onClick }) => {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    flagged: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/50"
      )}
    >
      {/* Content preview */}
      <p className="text-slate-900 dark:text-slate-100 line-clamp-2 mb-3">
        "{sprout.content}"
      </p>
      
      {/* Metadata row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span>user_{sprout.captureContext.userId.slice(0, 6)}</span>
          <span>·</span>
          <span>{formatRelativeTime(sprout.captureContext.timestamp)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {sprout.captureContext.journeyId && (
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {sprout.captureContext.journeyId}
            </span>
          )}
          <span className={cn("px-2 py-0.5 rounded", statusColors[sprout.status])}>
            {sprout.status}
          </span>
        </div>
      </div>
    </button>
  );
};
```

**SproutReviewInspector.tsx:**

```typescript
const SproutReviewInspector: React.FC<{ sproutId: string }> = ({ sproutId }) => {
  const { sprouts, updateSprout } = useSproutQueue();
  const { closeInspector } = useFoundationUI();
  const sprout = sprouts.find(s => s.id === sproutId);
  
  const [notes, setNotes] = useState('');
  
  if (!sprout) return <EmptyState message="Sprout not found" />;
  
  const handleDecision = (decision: 'approved' | 'rejected' | 'flagged') => {
    updateSprout(sproutId, {
      status: decision,
      moderation: {
        reviewedBy: 'admin', // TODO: actual user
        reviewedAt: new Date().toISOString(),
        decision,
        notes: notes || undefined,
      },
    });
    closeInspector();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <h3 className="font-medium text-slate-900 dark:text-slate-100">Review Sprout</h3>
        <button onClick={closeInspector} className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Sprout content */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Content
          </h4>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-border-light dark:border-border-dark">
            <p className="text-slate-900 dark:text-slate-100 leading-relaxed">
              "{sprout.content}"
            </p>
          </div>
        </div>
        
        {/* Capture context */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Capture Context
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              {new Date(sprout.captureContext.timestamp).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">eyeglasses</span>
              Lens: {sprout.captureContext.lensId} v{sprout.captureContext.lensVersion}
            </div>
            {sprout.captureContext.journeyId && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-lg">map</span>
                Journey: {sprout.captureContext.journeyId} 
                {sprout.captureContext.journeyStep !== undefined && ` (Step ${sprout.captureContext.journeyStep})`}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">person</span>
              Submitter: user_{sprout.captureContext.userId.slice(0, 8)}
            </div>
          </div>
        </div>
        
        {/* Moderation notes */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Moderation Notes
          </h4>
          <TextArea
            value={notes}
            onChange={setNotes}
            placeholder="Add notes for the submitter (optional)..."
            rows={3}
          />
        </div>
        
        {/* Previous moderation if exists */}
        {sprout.moderation && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500">
            <div>Previously reviewed by {sprout.moderation.reviewedBy}</div>
            <div>Decision: {sprout.moderation.decision}</div>
            {sprout.moderation.notes && <div>Notes: {sprout.moderation.notes}</div>}
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        {sprout.status === 'pending' ? (
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="primary" 
              onClick={() => handleDecision('approved')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              Approve
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleDecision('rejected')}
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Reject
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDecision('flagged')}
            >
              <span className="material-symbols-outlined text-sm">flag</span>
              Flag
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-500">
            This sprout has been {sprout.status}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

#### Phase 4: useSproutQueue Hook

Data fetching and state management for the queue:

```typescript
// src/foundation/hooks/useSproutQueue.ts

interface UseSproutQueueReturn {
  sprouts: QueuedSprout[];
  loading: boolean;
  error: string | null;
  updateSprout: (id: string, updates: Partial<QueuedSprout>) => Promise<void>;
  refreshQueue: () => Promise<void>;
}

export function useSproutQueue(): UseSproutQueueReturn {
  const [sprouts, setSprouts] = useState<QueuedSprout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchQueue = async () => {
    try {
      setLoading(true);
      // For now, use mock data
      // Later: const res = await fetch('/api/admin/sprout-queue');
      const mockSprouts = generateMockSprouts();
      setSprouts(mockSprouts);
    } catch (err) {
      setError('Failed to load sprout queue');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQueue();
  }, []);
  
  const updateSprout = async (id: string, updates: Partial<QueuedSprout>) => {
    setSprouts(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
    // Later: await fetch(`/api/admin/sprout-queue/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  };
  
  return {
    sprouts,
    loading,
    error,
    updateSprout,
    refreshQueue: fetchQueue,
  };
}

// Mock data generator
function generateMockSprouts(): QueuedSprout[] {
  return [
    {
      id: 'sprout-001',
      content: 'The 7-month capability doubling window feels shorter each cycle as infrastructure matures and deployment pipelines optimize.',
      status: 'pending',
      captureContext: {
        userId: 'user_abc123def456',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lensId: 'engineer',
        lensVersion: '1.2',
        journeyId: 'ratchet',
        journeyStep: 3,
        nodeId: 'capability-propagation',
        sessionId: 'sess_xyz789',
      },
    },
    {
      id: 'sprout-002',
      content: 'Distributed inference fundamentally changes the economics of AI access - the question is whether that benefits individuals or just creates new bottlenecks.',
      status: 'pending',
      captureContext: {
        userId: 'user_def456ghi789',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        lensId: 'academic',
        lensVersion: '2.0',
        journeyId: 'infrastructure-play',
        journeyStep: 2,
        sessionId: 'sess_abc123',
      },
    },
    // Add more mock sprouts...
  ];
}
```

---

#### Phase 5: Wire Inspector Routing

Update FoundationInspector to route to correct inspector:

```typescript
// src/foundation/FoundationInspector.tsx

const FoundationInspector: React.FC = () => {
  const { inspectorMode, closeInspector } = useFoundationUI();
  
  if (inspectorMode.type === 'none') return null;
  
  const renderInspector = () => {
    switch (inspectorMode.type) {
      case 'journey':
        return <JourneyInspector journeyId={inspectorMode.journeyId} />;
      case 'node':
        return <NodeInspector nodeId={inspectorMode.nodeId} />;
      case 'sprout-review':
        return <SproutReviewInspector sproutId={inspectorMode.sproutId} />;
      case 'settings':
        return <SettingsInspector section={inspectorMode.section} />;
      default:
        return <EmptyState message="Select an item to view details" />;
    }
  };
  
  return (
    <div className="h-full bg-surface-light dark:bg-background-dark/50 border-l border-border-light dark:border-border-dark">
      {renderInspector()}
    </div>
  );
};
```

---

### File Structure After Sprint 6

```
src/
├── shared/
│   └── layout/
│       ├── ChatContainer.tsx       # NEW: Readable message width
│       └── ...
├── explore/
│   └── ExploreChat.tsx             # UPDATED: Uses ChatContainer
├── foundation/
├── FoundationWorkspace.tsx
├── FoundationUIContext.tsx
├── FoundationNav.tsx
├── FoundationHeader.tsx
├── FoundationInspector.tsx
├── components/
│   ├── DataPanel.tsx          # UPDATED: unified colors
│   ├── GlowButton.tsx         # UPDATED: unified colors  
│   ├── MetricCard.tsx         # UPDATED: unified colors
│   └── index.ts
├── consoles/
│   ├── narrative/
│   │   ├── NarrativeArchitect.tsx  # REFACTORED
│   │   ├── JourneyGrid.tsx
│   │   ├── NodeGrid.tsx
│   │   ├── useNarrativeSchema.ts
│   │   └── index.ts
│   ├── SproutQueue.tsx             # IMPLEMENTED
│   ├── SproutSubmissionCard.tsx    # NEW
│   ├── HealthDashboard.tsx
│   └── ...
├── inspectors/
│   ├── JourneyInspector.tsx        # NEW
│   ├── NodeInspector.tsx           # NEW
│   ├── SproutReviewInspector.tsx   # NEW
│   └── index.ts
└── hooks/
    ├── useNarrativeSchema.ts
    ├── useSproutQueue.ts           # NEW
    └── index.ts
```

---

### Acceptance Criteria

**Chat Readability (Phase 0):**
- [ ] ChatContainer component exists in src/shared/layout/
- [ ] Messages max out at ~768px width on wide screens
- [ ] Messages center in content area when wider than max
- [ ] Mobile uses full width with padding
- [ ] Input field matches message container width
- [ ] Comfortable reading on 1920px+ screens

**Chat Styling (Phase 0.5):**
- [ ] User messages: white text on blue background (high contrast)
- [ ] AI messages: light text on dark surface (readable)
- [ ] Message bubbles have rounded corners (chat bubble style)
- [ ] Timestamps and metadata visible but subtle
- [ ] Input area has visible border and focus state
- [ ] Lens cards render properly when presented in chat
- [ ] Both light and dark modes work correctly
- [ ] No more zero-contrast text issues

**Visual Migration:**
- [ ] DataPanel uses unified colors
- [ ] GlowButton uses unified colors
- [ ] MetricCard uses unified colors
- [ ] No holo-* references in updated components

**NarrativeArchitect:**
- [ ] Uses CollectionHeader for search
- [ ] Click journey → Inspector opens with edit form
- [ ] Can edit journey title, description, status
- [ ] View nodes within journey

**Sprout Queue:**
- [ ] Route exists at /foundation/sprouts
- [ ] Shows pending/approved/rejected counts
- [ ] Can filter by status
- [ ] Can search submissions
- [ ] Click submission → Inspector opens
- [ ] Can approve/reject/flag from Inspector
- [ ] Badge in nav shows pending count

**Inspector Integration:**
- [ ] FoundationInspector routes to correct component
- [ ] Close button works
- [ ] State updates reflect in list

---

### Testing Checklist

1. **Chat readability:** Test on 1920px+ screen, verify message width caps
2. **Visual regression:** No broken styling after color migration
3. **NarrativeArchitect:** Can still view journeys and nodes
4. **Inspector flow:** Click → open → edit → save → close
5. **Sprout Queue:** Full approve/reject flow works
6. **Navigation:** All Foundation routes still accessible
7. **Theme:** Light/dark mode works throughout

---

### Reference

- Sprint 5 deliverables: FoundationWorkspace, shared components
- Terminal patterns: src/workspace/ for reference
- Design tokens: tailwind.config.ts

**Start with Phase 0 (chat readability), then Phase 1 (component migration), verify no regressions, then implement Sprout Queue.**
