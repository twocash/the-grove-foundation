# Migration Map: pipeline-inspector-v1
**Date:** 2025-01-03
**Sprint:** pipeline-inspector-v1

---

## Migration Overview

| Phase | Files | Est. Hours |
|-------|-------|------------|
| Phase 1: Schema & Types | 3 | 2 |
| Phase 2: Tier Terminology Fix | 2 | 1 |
| Phase 3: New Primitives | 3 | 3 |
| Phase 4: Inspector Integration | 3 | 3 |
| Phase 5: Copilot Integration | 3 | 4 |
| Phase 6: API Endpoints | 2 | 4 |
| Phase 7: Tests | 3 | 3 |
| **Total** | **19 files** | **~20 hours** |

---

## Phase 1: Schema & Types (Foundation)

### 1.1 Database Migration

**Create:** `supabase/migrations/004_document_enrichment.sql`

```sql
-- Schema changes for document enrichment
-- See SPEC.md for full schema

-- Fix tier values
UPDATE documents SET tier = 'seed' WHERE tier = 'seedling';
UPDATE documents SET tier = 'tree' WHERE tier = 'oak';

-- Add enrichment columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_context JSONB DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary TEXT;
-- ... (full schema in SPEC.md)

-- Add indexes
CREATE INDEX IF NOT EXISTS documents_keywords_idx ON documents USING gin(keywords);
-- ...

-- Add utility score trigger
CREATE OR REPLACE FUNCTION update_document_utility() ...
```

**Verify:** 
- `npx supabase db push` succeeds
- Existing documents still queryable
- Tier values corrected in data

### 1.2 TypeScript Types

**Create:** `src/bedrock/consoles/PipelineMonitor/types.ts`

```typescript
export const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'] as const;
export type DocumentTier = typeof CANONICAL_TIERS[number];

export interface Document {
  // See ARCHITECTURE.md for full interface
}
```

**Verify:** 
- Types compile without errors
- Existing code using Document type still works

### 1.3 Export Updates

**Modify:** `src/bedrock/consoles/PipelineMonitor/index.ts`

```typescript
export * from './types';  // Add this line
```

---

## Phase 2: Tier Terminology Fix (Critical Path)

### 2.1 DocumentsView Tier Filter

**Modify:** `src/bedrock/consoles/PipelineMonitor/DocumentsView.tsx`

**Lines 122-125 (approximate):**
```diff
- <option value="seedling">Seedling</option>
- <option value="sapling">Sapling</option>
- <option value="oak">Oak</option>
+ <option value="seed">Seed</option>
+ <option value="sprout">Sprout</option>
+ <option value="sapling">Sapling</option>
+ <option value="tree">Tree</option>
+ <option value="grove">Grove</option>
```

**Also update imports:**
```diff
+ import { CANONICAL_TIERS, type DocumentTier } from './types';
```

**Verify:**
```bash
# Must return empty
grep -rn "seedling\|\"oak\"\|'oak'" src/bedrock/consoles/PipelineMonitor/
```

### 2.2 DocumentCard Tier Display

**Modify:** `src/bedrock/consoles/PipelineMonitor/DocumentCard.tsx`

Update any tier display logic to use canonical values. Check for:
- Tier badge colors
- Tier label text
- Any conditionals based on tier value

**Verify:**
- Card displays correct tier names
- Badge colors appropriate for all five tiers

---

## Phase 3: New Primitives

### 3.1 TagArray Component

**Create:** `src/bedrock/primitives/TagArray.tsx`

Key requirements:
- Uses `--card-*` tokens for chip styling
- Supports add/remove operations
- Handles empty state gracefully
- Supports read-only mode

**Verify:**
- Storybook entry (if available)
- Manual testing in isolation

### 3.2 GroupedChips Component

**Create:** `src/bedrock/primitives/GroupedChips.tsx`

Key requirements:
- Groups chips by category
- Supports add/remove per group
- Category labels configurable
- Uses `--card-*` tokens

### 3.3 UtilityBar Component

**Create:** `src/bedrock/primitives/UtilityBar.tsx`

Key requirements:
- Progress bar visualization
- Score and count display
- Optional trend indicator
- Read-only (no edit)

### 3.4 Export Updates

**Modify:** `src/bedrock/primitives/index.ts`

```typescript
export { TagArray } from './TagArray';
export { GroupedChips } from './GroupedChips';
export { UtilityBar } from './UtilityBar';
```

---

## Phase 4: Inspector Integration

### 4.1 Inspector Config

**Create:** `src/bedrock/consoles/PipelineMonitor/document-inspector.config.ts`

See ARCHITECTURE.md for full config structure.

### 4.2 PipelineMonitor Integration

**Modify:** `src/bedrock/consoles/PipelineMonitor/PipelineMonitor.tsx`

Changes needed:
1. Import BedrockLayout if not already using
2. Add selected document state
3. Wire inspector config based on selection
4. Add onSave handler for inspector edits

```diff
+ import { BedrockLayout, BedrockInspector } from '@/bedrock/primitives';
+ import { buildDocumentInspector } from './document-inspector.config';

+ const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

+ const inspectorConfig = selectedDoc 
+   ? buildDocumentInspector(selectedDoc)
+   : null;

// In render:
+ {inspectorConfig && (
+   <BedrockInspector
+     config={inspectorConfig}
+     data={selectedDoc}
+     onSave={handleInspectorSave}
+   />
+ )}
```

### 4.3 Document Selection Wiring

**Modify:** `src/bedrock/consoles/PipelineMonitor/DocumentsView.tsx`

Add callback for selection:
```typescript
interface DocumentsViewProps {
  onOpenUpload: () => void;
+ onSelectDocument?: (doc: Document) => void;
}
```

---

## Phase 5: Copilot Integration

### 5.1 Copilot Config

**Create:** `src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts`

See ARCHITECTURE.md for full config structure.

### 5.2 Command Handlers

**Create:** `src/bedrock/consoles/PipelineMonitor/copilot-handlers.ts`

```typescript
export async function handleExtractKeywords(doc: Document): Promise<CopilotResult> {
  const response = await fetch('/api/knowledge/enrich', {
    method: 'POST',
    body: JSON.stringify({ documentId: doc.id, operations: ['keywords'] })
  });
  const { results } = await response.json();
  
  return {
    preview: true,
    data: results.keywords,
    message: `Extracted ${results.keywords.length} keywords`
  };
}

// Similar handlers for: summarize, extractEntities, suggestQuestions, 
// classifyType, checkFreshness, enrich (compound), promote, reEmbed
```

### 5.3 PipelineMonitor Copilot Wiring

**Modify:** `src/bedrock/consoles/PipelineMonitor/PipelineMonitor.tsx`

```diff
+ import { BedrockCopilot } from '@/bedrock/primitives';
+ import { buildDocumentCopilot } from './document-copilot.config';
+ import * as handlers from './copilot-handlers';

+ const copilotConfig = buildDocumentCopilot(selectedDoc);

// In render:
+ <BedrockCopilot
+   config={copilotConfig}
+   handlers={handlers}
+ />
```

---

## Phase 6: API Endpoints

### 6.1 Document Update Endpoint

**Create:** `src/app/api/knowledge/documents/[id]/route.ts`

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updates = await request.json();
  
  // Validate tier if present
  if (updates.tier && !CANONICAL_TIERS.includes(updates.tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }
  
  // Update document in database
  const { data, error } = await supabase
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single();
  
  return NextResponse.json({ success: true, document: data });
}
```

### 6.2 Enrichment Endpoint

**Create:** `src/app/api/knowledge/enrich/route.ts`

```typescript
export async function POST(request: Request) {
  const { documentId, operations } = await request.json();
  
  // Fetch document content
  const doc = await getDocument(documentId);
  
  // Run requested extractions via AI
  const results = await runEnrichment(doc, operations);
  
  return NextResponse.json({
    documentId,
    results,
    model: 'claude-3-sonnet'  // or whichever model used
  });
}

async function runEnrichment(doc: Document, operations: string[]) {
  // Build prompt based on operations
  // Call AI API
  // Parse and return structured results
}
```

---

## Phase 7: Tests

### 7.1 Tier Terminology Test

**Create:** `tests/unit/tier-terminology.test.ts`

```typescript
import { CANONICAL_TIERS } from '@/bedrock/consoles/PipelineMonitor/types';

describe('Tier Terminology Compliance', () => {
  it('uses only canonical tier values', () => {
    expect(CANONICAL_TIERS).toEqual(['seed', 'sprout', 'sapling', 'tree', 'grove']);
  });

  it('does not contain legacy tier names', () => {
    expect(CANONICAL_TIERS).not.toContain('seedling');
    expect(CANONICAL_TIERS).not.toContain('oak');
  });
});
```

### 7.2 Copilot Preview Test

**Create:** `tests/e2e/copilot-preview.spec.ts`

```typescript
test('Copilot shows preview before saving keywords', async ({ page }) => {
  await page.goto('/foundation/pipeline');
  // Select a document
  await page.click('[data-testid="document-card"]:first-child');
  // Type command
  await page.fill('[data-testid="copilot-input"]', 'extract keywords');
  await page.press('[data-testid="copilot-input"]', 'Enter');
  // Verify preview shown
  await expect(page.getByText('Apply')).toBeVisible();
  await expect(page.getByText('Edit')).toBeVisible();
});
```

### 7.3 Inspector Integration Test

**Create:** `tests/e2e/pipeline-inspector.spec.ts`

```typescript
test('Inspector shows document details on selection', async ({ page }) => {
  await page.goto('/foundation/pipeline');
  await page.click('[data-testid="document-card"]:first-child');
  
  // Inspector should show
  await expect(page.getByText('Identity')).toBeVisible();
  await expect(page.getByText('Enrichment')).toBeVisible();
});
```

---

## Rollback Plan

### If Database Migration Fails

```bash
# Revert migration
npx supabase db reset --local
# Or manually drop added columns
```

### If UI Breaks

```bash
# Revert to previous commit
git checkout HEAD~1 -- src/bedrock/consoles/PipelineMonitor/
```

### Recovery Points

| Checkpoint | Git Tag | Description |
|------------|---------|-------------|
| Pre-sprint | `pre-pipeline-inspector` | Before any changes |
| Post-schema | `pipeline-inspector-schema` | After DB migration |
| Post-tier-fix | `pipeline-inspector-tier` | After tier terminology fix |
| Post-primitives | `pipeline-inspector-primitives` | After new components |

---

## Dependencies & Order

```
Phase 1 (Schema)
    ↓
Phase 2 (Tier Fix) ──────────────┐
    ↓                            │
Phase 3 (Primitives)             │
    ↓                            │
Phase 4 (Inspector) ←────────────┤
    ↓                            │
Phase 5 (Copilot)                │
    ↓                            │
Phase 6 (API) ←──────────────────┘
    ↓
Phase 7 (Tests)
```

**Critical path:** Phase 1 → Phase 2 → Phase 4 → Phase 6

Phase 3 can run in parallel after Phase 1. Tests can be written alongside each phase.
