# Execution Prompt: pipeline-inspector-v1

**Sprint:** pipeline-inspector-v1
**Date:** 2025-01-03
**Type:** Feature Development
**Est. Hours:** ~20

---

## Self-Contained Context

You are executing the `pipeline-inspector-v1` sprint for the Grove Foundation project. This sprint extends the PipelineMonitor console with Inspector Panel and Copilot support, aligned with the Knowledge Commons architecture.

### Project Location
```
C:\GitHub\the-grove-foundation
```

### Key Files (Read These First)
```
docs/sprints/pipeline-inspector-v1/
├── SPEC.md                 ← Full specification (goals, non-goals, requirements)
├── ADR-001-*.md           ← Architectural decision: tier unification
├── DEVELOPMENT_CONTRACT.md ← Binding constraints (violations block merge)
├── ARCHITECTURE.md         ← Target state, types, configs
├── MIGRATION_MAP.md        ← File-by-file change plan
├── SPRINTS.md              ← Epic/story breakdown with tests
└── DEVLOG.md               ← Log your progress here
```

---

## Critical Constraint: Tier Terminology

**BINDING RULE:** Only these tier values are allowed:
```typescript
const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'] as const;
```

**PROHIBITED:** `seedling`, `oak`, `published`, `archived`, `draft`

**Verification (run before every commit):**
```bash
grep -rn "seedling\|\"oak\"\|'oak'" src/bedrock/consoles/PipelineMonitor/
# MUST return empty
```

---

## Execution Order

### Epic 1: Schema & Types (Required First)

**1.1 Create Database Migration**
```bash
# Create file
code supabase/migrations/004_document_enrichment.sql
```

Contents from SPEC.md schema section. Key points:
- Fix tier data: `UPDATE documents SET tier = 'seed' WHERE tier = 'seedling';`
- Add all enrichment columns
- Create indexes
- Add utility score trigger

**1.2 Create TypeScript Types**
```bash
code src/bedrock/consoles/PipelineMonitor/types.ts
```

See ARCHITECTURE.md for full interface.

**1.3 Verify**
```bash
npx supabase db push
npx tsc --noEmit
```

---

### Epic 2: Tier Fix (Critical Path)

**2.1 Fix DocumentsView.tsx**

Find and replace tier filter options (around line 122-125):
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

**2.2 Fix DocumentCard.tsx**

Update any tier display logic. Check for:
- Badge color mapping
- Tier label text

**2.3 Verify**
```bash
grep -rn "seedling\|\"oak\"\|'oak'" src/bedrock/consoles/PipelineMonitor/
# Must be empty
npm run build
```

---

### Epic 3: New Primitives

**3.1 TagArray.tsx**
```bash
code src/bedrock/primitives/TagArray.tsx
```

Component requirements:
- Props: `value: string[], onChange?, placeholder?, readOnly?`
- Uses `--card-*` tokens for chip styling
- Add via input + Enter key
- Remove via × button on each chip
- Empty state handling

**3.2 GroupedChips.tsx**
```bash
code src/bedrock/primitives/GroupedChips.tsx
```

Component requirements:
- Props: `value: Record<string, string[]>, onChange?, groups: string[], readOnly?`
- Group labels as row headers
- Add/remove per group
- Uses `--card-*` tokens

**3.3 UtilityBar.tsx**
```bash
code src/bedrock/primitives/UtilityBar.tsx
```

Component requirements:
- Props: `score: number, retrievalCount: number, trend?: 'up'|'down'|'stable'`
- Progress bar visualization
- Always read-only

**3.4 Export**
```bash
# Add to src/bedrock/primitives/index.ts
export { TagArray } from './TagArray';
export { GroupedChips } from './GroupedChips';
export { UtilityBar } from './UtilityBar';
```

**3.5 Verify**
```bash
npm run build
npx tsc --noEmit
```

---

### Epic 4: Inspector Integration

**4.1 Create Inspector Config**
```bash
code src/bedrock/consoles/PipelineMonitor/document-inspector.config.ts
```

Export `buildDocumentInspector(doc: Document): InspectorConfig`

See ARCHITECTURE.md for full config structure.

**4.2 Add Selection State to PipelineMonitor**

In `PipelineMonitor.tsx`:
```typescript
const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

// Pass to DocumentsView
<DocumentsView 
  onOpenUpload={...}
  onSelectDocument={setSelectedDoc}
/>
```

**4.3 Wire Inspector**

In `PipelineMonitor.tsx`:
```typescript
import { buildDocumentInspector } from './document-inspector.config';

const inspectorConfig = selectedDoc 
  ? buildDocumentInspector(selectedDoc)
  : null;

// In render, add inspector panel
```

**4.4 Verify**
```bash
npm run build
npm run dev
# Manual test: click document card, verify inspector shows
```

---

### Epic 5: Copilot Integration

**5.1 Create Copilot Config**
```bash
code src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts
```

Export `buildDocumentCopilot(doc: Document | null): CopilotConfig`

See ARCHITECTURE.md for full config structure.

**5.2 Create Command Handlers**
```bash
code src/bedrock/consoles/PipelineMonitor/copilot-handlers.ts
```

Implement handlers for each command. Key pattern:
```typescript
export async function handleExtractKeywords(doc: Document): Promise<CopilotResult> {
  const response = await fetch('/api/knowledge/enrich', {
    method: 'POST',
    body: JSON.stringify({ documentId: doc.id, operations: ['keywords'] })
  });
  const { results } = await response.json();
  
  return {
    preview: true,  // REQUIRED for extraction commands
    data: results.keywords,
    message: `Extracted ${results.keywords.length} keywords`
  };
}
```

**5.3 Wire Copilot**

In `PipelineMonitor.tsx`:
```typescript
import { buildDocumentCopilot } from './document-copilot.config';
import * as handlers from './copilot-handlers';

const copilotConfig = buildDocumentCopilot(selectedDoc);

// In render, add copilot panel
```

**5.4 Verify**
```bash
npm run build
npm run dev
# Manual test: select doc, type "extract keywords", verify preview shows
```

---

### Epic 6: API Endpoints

**6.1 Document Update Endpoint**
```bash
mkdir -p src/app/api/knowledge/documents/[id]
code src/app/api/knowledge/documents/[id]/route.ts
```

Implement PATCH method with tier validation.

**6.2 Enrichment Endpoint**
```bash
mkdir -p src/app/api/knowledge/enrich
code src/app/api/knowledge/enrich/route.ts
```

Implement POST method calling AI API.

**6.3 Verify**
```bash
npm run build
# Test with curl or Postman
```

---

### Epic 7: Tests

**7.1 Create Test Files**
```bash
code tests/unit/tier-terminology.test.ts
code tests/e2e/pipeline-inspector.spec.ts
code tests/e2e/copilot-preview.spec.ts
```

**7.2 Run All Tests**
```bash
npm test
npx playwright test
```

---

## Final Verification Checklist

Before marking sprint complete:

```bash
# 1. Build succeeds
npm run build

# 2. All tests pass
npm test
npx playwright test

# 3. No tier terminology violations
grep -rn "seedling\|\"oak\"\|'oak'" src/
# Must return empty

# 4. TypeScript clean
npx tsc --noEmit

# 5. Dev server works
npm run dev
# Manual verification of inspector/copilot
```

---

## DEVLOG Format

Log progress in `docs/sprints/pipeline-inspector-v1/DEVLOG.md`:

```markdown
## [Date] - [Epic/Story]

**Status:** In Progress | Complete | Blocked

**Work Done:**
- [What was implemented]

**Decisions:**
- [Any runtime decisions made]

**Blockers:**
- [Any issues encountered]

**Next:**
- [What to do next]

**Build Gate:**
```bash
[Commands run and results]
```
```

---

## Troubleshooting

### Migration fails to apply
```bash
# Check migration syntax
npx supabase db diff

# Reset local if needed
npx supabase db reset
```

### TypeScript errors after type changes
```bash
# Full rebuild
rm -rf .next node_modules/.cache
npm run build
```

### Inspector not showing
- Check selectedDoc state is set
- Check buildDocumentInspector returns valid config
- Check BedrockInspector is imported and rendered

### Copilot commands not working
- Check command pattern regex matches input
- Check handler is imported and wired
- Check API endpoint responds

---

## Emergency Rollback

If something breaks badly:

```bash
# Revert PipelineMonitor changes
git checkout HEAD~1 -- src/bedrock/consoles/PipelineMonitor/

# Or revert entire sprint
git checkout pre-pipeline-inspector -- .
```

---

**Begin with Epic 1. Log all progress in DEVLOG.md. Run build gates after each epic.**
