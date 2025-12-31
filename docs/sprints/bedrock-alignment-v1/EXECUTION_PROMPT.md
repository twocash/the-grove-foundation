# Bedrock Alignment v1 - Execution Prompt

## Mission
Align all Bedrock consoles to Quantum Glass design system and improve the Pipeline Monitor Documents view to use card-based collection pattern with modal upload.

## Critical Context

### The Problem
Two competing token systems are being mixed:
- **Workspace tokens** (`border-light`, `surface-light`, `dark:` prefix) - for light/dark mode
- **Quantum Glass tokens** (`--glass-*`, `--neon-*`) - dark-only, used by `/explore`

Bedrock should use **Quantum Glass exclusively**.

The Pipeline Monitor's Documents view uses an inline upload zone and table instead of cards. The pipeline workflow views (Processing, Hubs, Journeys) are correct and should be preserved.

### The ONE Pattern

```css
/* Backgrounds (dark only) */
--glass-void     /* #030712 - deepest, viewport */
--glass-panel    /* rgba(17,24,39,0.6) - with blur */
--glass-solid    /* #111827 - no blur fallback */
--glass-elevated /* rgba(30,41,59,0.4) - hover/raised */

/* Borders */
--glass-border       /* #1e293b - default */
--glass-border-hover /* #334155 - interactive */

/* Accents */
--neon-green  /* #10b981 - success, primary actions */
--neon-cyan   /* #06b6d4 - info, interactive, selected */
--neon-amber  /* #f59e0b - warning, pending */
--neon-violet /* #8b5cf6 - processing, special */

/* Text hierarchy */
--glass-text-primary   /* #ffffff - headings */
--glass-text-secondary /* #e2e8f0 - body emphasis */
--glass-text-body      /* #cbd5e1 - body text */
--glass-text-muted     /* #94a3b8 - secondary info */
--glass-text-subtle    /* #64748b - tertiary/disabled */
```

### Files Reference

**Token definitions:**
- `styles/globals.css` - Lines 460-520 define Quantum Glass tokens

**Existing primitives (use these):**
- `src/bedrock/primitives/GlassPanel.tsx`
- `src/bedrock/primitives/GlassCard.tsx`
- `src/bedrock/primitives/GlassButton.tsx`
- `src/bedrock/primitives/GlassStatusBadge.tsx`
- `src/bedrock/primitives/GlassMetricCard.tsx`
- `src/bedrock/primitives/GlassTable.tsx`
- `src/bedrock/primitives/BedrockLayout.tsx`
- `src/bedrock/primitives/BedrockNav.tsx`

**Modal pattern reference:**
- `src/surface/components/KineticStream/LensPicker.tsx` - Glass modal overlay

---

## Epic 1: Token Alignment

### Story 1.1: BedrockLayout Glass Tokens
**File:** `src/bedrock/primitives/BedrockLayout.tsx`

Replace all Workspace tokens with Quantum Glass equivalents.

**Token mappings:**
| Workspace | Quantum Glass |
|-----------|---------------|
| `bg-surface-light dark:bg-surface-dark` | `bg-[var(--glass-solid)]` |
| `border-border-light dark:border-border-dark` | `border-[var(--glass-border)]` |
| `text-foreground-light dark:text-foreground-dark` | `text-[var(--glass-text-primary)]` |
| `text-muted-light dark:text-muted-dark` | `text-[var(--glass-text-muted)]` |

**Acceptance:**
- [ ] No `dark:` prefixes remain
- [ ] No `-light` or `-dark` token suffixes
- [ ] All colors use `var(--glass-*)` or `var(--neon-*)`
- [ ] Header visually matches GlassPanel styling

### Story 1.2: ThreeColumnLayout Glass Tokens
**File:** `src/shared/layout/ThreeColumnLayout.tsx`

Audit and replace any Workspace tokens.

**Acceptance:**
- [ ] Background uses `--glass-void` or `--glass-solid`
- [ ] Borders use `--glass-border`
- [ ] No light/dark mode switching tokens

### Story 1.3: BedrockNav Glass Tokens
**File:** `src/bedrock/primitives/BedrockNav.tsx`

Ensure nav items use Glass tokens:
- Background: `--glass-solid` default, `--glass-elevated` hover
- Borders: `--glass-border`
- Text: `--glass-text-muted` default, `--glass-text-primary` active
- Active indicator: neon accent color

**Acceptance:**
- [ ] Nav visually integrates with GlassPanel content
- [ ] Active state has neon accent indicator
- [ ] Hover states use `--glass-elevated`

---

## Epic 2: Pipeline Monitor Documents View

**Important:** The pipeline workflow views (ProcessingQueue, HubSuggestions, JourneySynthesis) are correct and provide essential RAG functionality. They should NOT be modified except for token fixes if needed.

This epic focuses only on the Documents view.

### Story 2.1: Upload Modal Component
**Create:** `src/bedrock/consoles/PipelineMonitor/UploadModal.tsx`

Glass modal overlay for file uploads. Reference `LensPicker.tsx` for modal pattern.

```tsx
interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}
```

**Visual spec:**
- Full-screen overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Centered modal: `--glass-panel` background, max-w-lg
- Drag-drop zone with dashed border (`border-dashed border-white/20`)
- Active drag state: `border-[var(--neon-cyan)]` with glow
- Close on backdrop click or X button
- Loading state during upload
- Success feedback then close

**Implementation:**
```tsx
export function UploadModal({ open, onClose, onUploadComplete }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const content = await file.text();
        await fetch('/api/knowledge/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            content,
            fileType: file.type || 'text/plain',
            sourceType: 'upload',
          }),
        });
      }
      onUploadComplete?.();
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-[var(--glass-text-primary)]">
            Add Files
          </h2>
          <button onClick={onClose} className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files);
          }}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${dragActive 
              ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5' 
              : 'border-white/20 hover:border-white/30'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.json"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />
          
          <span className={`material-symbols-outlined text-4xl mb-4 block ${
            uploading ? 'animate-spin text-[var(--neon-cyan)]' : 'text-[var(--glass-text-muted)]'
          }`}>
            {uploading ? 'progress_activity' : 'cloud_upload'}
          </span>
          
          <p className="text-[var(--glass-text-primary)] font-medium mb-1">
            {dragActive ? 'Drop files here' : 'Drag & drop files'}
          </p>
          <p className="text-[var(--glass-text-muted)] text-sm mb-4">
            Supports .txt, .md, .json
          </p>
          
          <GlassButton
            variant="secondary"
            size="sm"
            icon="folder_open"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Browse Files
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance:**
- [ ] Modal opens/closes smoothly
- [ ] Backdrop click closes modal
- [ ] Drag-drop works with visual feedback
- [ ] File browse works
- [ ] Uploads to `/api/knowledge/upload`
- [ ] Shows loading state
- [ ] Closes on success

### Story 2.2: Document Card Component
**Create:** `src/bedrock/consoles/PipelineMonitor/DocumentCard.tsx`

Card component for displaying documents in the collection view.

```tsx
interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    tier: string;
    embedding_status: string;
    created_at: string;
    content_length?: number;
  };
  selected?: boolean;
  favorited?: boolean;
  onSelect?: () => void;
  onFavorite?: () => void;
}
```

**Visual spec:**
- Use `glass-card` CSS pattern or extend GlassCard
- Icon: `description` (Material Symbols)
- Layout: Icon | Title + metadata | Tier badge | Status badge | Star
- Selected state: cyan border + subtle glow
- Hover: elevated background

**Implementation outline:**
```tsx
export function DocumentCard({ document, selected, favorited, onSelect, onFavorite }: DocumentCardProps) {
  const statusConfig = {
    pending: { color: 'amber', icon: 'hourglass_empty', label: 'Pending' },
    processing: { color: 'violet', icon: 'sync', label: 'Processing' },
    complete: { color: 'green', icon: 'check_circle', label: 'Complete' },
    error: { color: 'red', icon: 'error', label: 'Error' },
  }[document.embedding_status] || { color: 'gray', icon: 'help', label: 'Unknown' };

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${selected 
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 shadow-[0_0_20px_-5px_var(--neon-cyan)]' 
          : 'border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-elevated)]'
        }
      `}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-[var(--glass-panel)] flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-xl text-[var(--glass-text-muted)]">
          description
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[var(--glass-text-primary)] truncate">
          {document.title}
        </h4>
        <p className="text-xs text-[var(--glass-text-subtle)]">
          {new Date(document.created_at).toLocaleDateString()}
          {document.content_length && ` • ${Math.round(document.content_length / 1000)}k chars`}
        </p>
      </div>

      {/* Tier Badge */}
      <span className="px-2 py-1 text-xs rounded bg-[var(--glass-panel)] text-[var(--glass-text-muted)] capitalize">
        {document.tier}
      </span>

      {/* Status Badge */}
      <GlassStatusBadge status={statusConfig.color} icon={statusConfig.icon} size="sm">
        {statusConfig.label}
      </GlassStatusBadge>

      {/* Favorite */}
      <button
        onClick={(e) => { e.stopPropagation(); onFavorite?.(); }}
        className={`p-1 rounded transition-colors ${
          favorited 
            ? 'text-[var(--neon-amber)]' 
            : 'text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-muted)]'
        }`}
      >
        <span className="material-symbols-outlined text-lg">
          {favorited ? 'star' : 'star_outline'}
        </span>
      </button>
    </div>
  );
}
```

**Acceptance:**
- [ ] Renders document metadata clearly
- [ ] Selected state visible with cyan glow
- [ ] Favorite toggle works
- [ ] Hover state works
- [ ] Matches Glass design system

### Story 2.3: Refactor Documents View (UploadPanel → DocumentsView)
**Rename & Rewrite:** `src/bedrock/consoles/PipelineMonitor/UploadPanel.tsx` → `DocumentsView.tsx`

Transform from inline upload + table into card-based collection view with filter bar.

```tsx
interface DocumentsViewProps {
  onOpenUpload: () => void;
}

export function DocumentsView({ onOpenUpload }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('pipeline-doc-favorites');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Fetch documents
  useEffect(() => {
    fetch('/api/knowledge/documents')
      .then(res => res.json())
      .then(data => setDocuments(data.documents || []))
      .finally(() => setLoading(false));
  }, []);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('pipeline-doc-favorites', JSON.stringify([...next]));
      return next;
    });
  };

  // Filter logic
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (tierFilter !== 'all' && doc.tier !== tierFilter) return false;
      if (statusFilter !== 'all' && doc.embedding_status !== statusFilter) return false;
      if (showFavoritesOnly && !favorites.has(doc.id)) return false;
      return true;
    });
  }, [documents, searchQuery, tierFilter, statusFilter, showFavoritesOnly, favorites]);

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)] text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-subtle)] focus:border-[var(--neon-cyan)] focus:outline-none"
          />
        </div>

        {/* Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-2 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-secondary)] focus:border-[var(--neon-cyan)] focus:outline-none"
        >
          <option value="all">All Tiers</option>
          <option value="seedling">Seedling</option>
          <option value="sapling">Sapling</option>
          <option value="oak">Oak</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-secondary)] focus:border-[var(--neon-cyan)] focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="complete">Complete</option>
          <option value="error">Error</option>
        </select>

        {/* Favorites Toggle */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`p-2 rounded-lg border transition-colors ${
            showFavoritesOnly
              ? 'bg-[var(--neon-amber)]/10 border-[var(--neon-amber)]/30 text-[var(--neon-amber)]'
              : 'border-[var(--glass-border)] text-[var(--glass-text-muted)] hover:border-[var(--glass-border-hover)]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {showFavoritesOnly ? 'star' : 'star_outline'}
          </span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Result count */}
        <span className="text-sm text-[var(--glass-text-subtle)]">
          {filteredDocs.length} of {documents.length}
        </span>
      </div>

      {/* Document Cards */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-[var(--glass-panel)] animate-pulse" />
            ))}
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-3">
            {filteredDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                selected={selected === doc.id}
                favorited={favorites.has(doc.id)}
                onSelect={() => setSelected(doc.id)}
                onFavorite={() => toggleFavorite(doc.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-[var(--glass-text-subtle)] mb-4 block">
              {searchQuery || tierFilter !== 'all' || statusFilter !== 'all' ? 'search_off' : 'inbox'}
            </span>
            <p className="text-[var(--glass-text-primary)] font-medium">
              {searchQuery || tierFilter !== 'all' || statusFilter !== 'all' 
                ? 'No matching documents' 
                : 'No documents yet'
              }
            </p>
            <p className="text-[var(--glass-text-muted)] text-sm mt-1">
              {searchQuery || tierFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload files to start building your knowledge base'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Acceptance:**
- [ ] Documents render as cards, not table rows
- [ ] Search filters by title
- [ ] Tier dropdown filters work
- [ ] Status dropdown filters work
- [ ] Favorites toggle persists to localStorage
- [ ] Empty states appropriate to context
- [ ] Loading skeleton while fetching

### Story 2.4: Update PipelineMonitor Main Component
**Modify:** `src/bedrock/consoles/PipelineMonitor/PipelineMonitor.tsx`

- Add upload modal state
- Replace UploadPanel with DocumentsView
- Add "Add Files" button to header that opens modal
- Keep ProcessingQueue, HubSuggestions, JourneySynthesis as-is

**Key changes:**
```tsx
// Add state
const [uploadOpen, setUploadOpen] = useState(false);

// Update header
header={
  <div className="flex items-center gap-3">
    {/* Existing status badge */}
    <GlassButton
      variant="primary"
      accent="cyan"
      size="sm"
      icon="add"
      onClick={() => setUploadOpen(true)}
    >
      Add Files
    </GlassButton>
    {/* Existing process queue button */}
  </div>
}

// Update renderPanel for 'documents' case
case 'documents':
  return <DocumentsView onOpenUpload={() => setUploadOpen(true)} />;

// Add modal at end of component
<UploadModal
  open={uploadOpen}
  onClose={() => setUploadOpen(false)}
  onUploadComplete={fetchMetrics}
/>
```

**Acceptance:**
- [ ] "Add Files" button in header opens upload modal
- [ ] Documents view shows cards with filters
- [ ] Processing, Hubs, Journeys views unchanged
- [ ] Pipeline workflow preserved

### Story 2.5: Update Exports
**Modify:** `src/bedrock/consoles/PipelineMonitor/index.ts`

```tsx
export { PipelineMonitor } from './PipelineMonitor';
export { DocumentsView } from './DocumentsView';
export { DocumentCard } from './DocumentCard';
export { UploadModal } from './UploadModal';
export { ProcessingQueue } from './ProcessingQueue';
export { HubSuggestions } from './HubSuggestions';
export { JourneySynthesis } from './JourneySynthesis';
```

**Delete old file:**
- `src/bedrock/consoles/PipelineMonitor/UploadPanel.tsx` (replaced by DocumentsView)

**Acceptance:**
- [ ] All exports resolve
- [ ] No import errors
- [ ] Build passes

---

## Epic 3: Placeholder Console Updates

### Story 3.1: GardenConsole Glass Styling
**Rewrite:** `src/bedrock/consoles/GardenConsole.tsx`

Update placeholder to use Glass primitives and BedrockLayout.

```tsx
import React from 'react';
import { BedrockLayout, GlassPanel } from '../primitives';

export function GardenConsole() {
  return (
    <BedrockLayout
      consoleId="garden"
      title="Knowledge Garden"
      description="Sprout moderation and curation"
      navigation={<div />}
      content={
        <GlassPanel tier="panel" className="m-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--glass-text-subtle)] mb-4">
              eco
            </span>
            <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-2">
              Coming Soon
            </h3>
            <p className="text-sm text-[var(--glass-text-muted)] max-w-md">
              The Knowledge Garden will provide a moderation workflow for
              reviewing user-submitted sprouts, with AI-assisted categorization.
            </p>
            <div className="mt-6 flex gap-4 text-sm text-[var(--glass-text-subtle)]">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">rate_review</span>
                <span>Review Queue</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">category</span>
                <span>Auto-Categorize</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      }
      navWidth={0}
    />
  );
}

export default GardenConsole;
```

**Acceptance:**
- [ ] Uses BedrockLayout
- [ ] Uses GlassPanel
- [ ] All tokens are Quantum Glass
- [ ] No Workspace tokens remain

### Story 3.2: LensWorkshop Glass Styling
**Rewrite:** `src/bedrock/consoles/LensWorkshop.tsx`

Same pattern as GardenConsole.

```tsx
import React from 'react';
import { BedrockLayout, GlassPanel } from '../primitives';

export function LensWorkshop() {
  return (
    <BedrockLayout
      consoleId="lens-workshop"
      title="Lens Workshop"
      description="Design and configure exploration lenses"
      navigation={<div />}
      content={
        <GlassPanel tier="panel" className="m-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--glass-text-subtle)] mb-4">
              tune
            </span>
            <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-2">
              Coming Soon
            </h3>
            <p className="text-sm text-[var(--glass-text-muted)] max-w-md">
              The Lens Workshop will provide a visual editor for creating
              exploration lenses, with AI-assisted prompt optimization.
            </p>
            <div className="mt-6 flex gap-4 text-sm text-[var(--glass-text-subtle)]">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">edit_note</span>
                <span>Prompt Editor</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">science</span>
                <span>Test Runner</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      }
      navWidth={0}
    />
  );
}

export default LensWorkshop;
```

**Acceptance:**
- [ ] Uses BedrockLayout
- [ ] Uses GlassPanel
- [ ] All tokens are Quantum Glass

---

## Epic 4: Integration Testing

### Story 4.1: Visual Audit
Navigate to each route and verify:

| Route | Check |
|-------|-------|
| `/bedrock` | Dashboard renders, nav works |
| `/bedrock/pipeline` | Documents as cards, upload modal works, pipeline views work |
| `/bedrock/garden` | Placeholder renders with Glass styling |
| `/bedrock/lenses` | Placeholder renders with Glass styling |

**Acceptance:**
- [ ] All routes load without console errors
- [ ] Consistent dark Glass aesthetic
- [ ] No light-mode artifacts visible
- [ ] Pipeline workflow (embed, cluster, synthesize) still functional

### Story 4.2: Build Verification
```bash
npm run build
npm run test
```

**Acceptance:**
- [ ] Build passes
- [ ] No TypeScript errors
- [ ] Tests pass (or are updated)

---

## Execution Order

1. **Story 1.1-1.3** - Token alignment (foundation)
2. **Story 2.1** - UploadModal
3. **Story 2.2** - DocumentCard
4. **Story 2.3** - DocumentsView (replaces UploadPanel)
5. **Story 2.4** - PipelineMonitor integration
6. **Story 2.5** - Cleanup exports
7. **Story 3.1-3.2** - Placeholder updates
8. **Story 4.1-4.2** - Testing

---

## Constraints

- **DO NOT** modify ProcessingQueue.tsx, HubSuggestions.tsx, or JourneySynthesis.tsx logic
- **DO NOT** change API endpoints
- **DO** use existing Glass primitives
- **DO** follow the token mappings exactly
- **DO** maintain all existing pipeline functionality

---

## Success Criteria

When complete:
1. `/bedrock/*` routes have consistent Quantum Glass dark aesthetic
2. Pipeline Monitor Documents view shows filterable cards
3. Upload is via modal triggered from header
4. Pipeline workflow (Processing, Hubs, Journeys) preserved and functional
5. No Workspace tokens (`-light`, `-dark`, `dark:`) in any Bedrock file
6. Build passes, no console errors
