# REPO_AUDIT.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Audited**: 2026-01-06

---

## Current Architecture

### Upload Flow

**File**: `src/bedrock/consoles/PipelineMonitor/UploadModal.tsx`

Current modal uploads files but has NO processing settings:
- Drag/drop or file picker
- Uploads to `/api/knowledge/documents`
- Documents enter queue with `status: 'pending'`
- User must manually click "Process Queue" then "Bulk Extract"

### Processing Flow

**File**: `src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx`

```tsx
// Current header buttons:
// 1. "Add Files" → opens upload modal
// 2. "Process Queue" → triggers embedding only
// 3. "Bulk Extract" dropdown → separate extraction operation
```

### Embedding Endpoint

**File**: `server.js` (~line 4694)

```javascript
app.post('/api/knowledge/embed', async (req, res) => {
  // Currently ONLY does embedding
  // No extraction, no polish
  const result = await knowledge.embedPendingDocuments(limit || 10);
  res.json(result);
});
```

### Keyword Extraction

**File**: `server.js` (~line 5160)

```javascript
async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords from this document...`;
  // ❌ NO Grove context
  // ❌ Generic keyword extraction
  // ❌ Misses Grove vocabulary
}
```

### Bulk Extraction Endpoint

**File**: `server.js` (search for `/api/prompts/extract-bulk`)

- Extracts concepts from documents
- Calls `polishExtractedConcepts()` for enrichment
- Separate from embedding flow

---

## Files to Modify

| File | Purpose | Changes |
|------|---------|---------|
| `server.js` | Backend | Add `GROVE_WORLDVIEW_CONTEXT`, modify `extractKeywords`, modify `/api/knowledge/embed` |
| `UploadModal.tsx` | UI | Add processing settings checkboxes |
| `PipelineMonitorWithUpload.tsx` | UI | Pass settings to process queue |
| Document schema | Data | Add `processingSettings` field |

---

## Key Functions

### 1. extractKeywords (server.js ~5160)

**Current**:
```javascript
async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords...`;
}
```

**Needed**:
```javascript
async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords from this document.

## GROVE VOCABULARY (prioritize these when relevant)
${GROVE_WORLDVIEW_CONTEXT}

If the document discusses concepts related to Grove's thesis, include 
relevant Grove vocabulary terms as keywords.

Title: ${title}
Content: ${content.slice(0, 3000)}
...`;
}
```

### 2. /api/knowledge/embed (server.js ~4694)

**Current**: Only embeds documents

**Needed**: Check document settings, optionally run extraction + polish

```javascript
app.post('/api/knowledge/embed', async (req, res) => {
  // Embed documents
  const embedded = await knowledge.embedPendingDocuments(limit);
  
  // Check if extraction requested
  if (runExtraction) {
    const extracted = await extractAndPolishDocuments(embedded.documentIds);
  }
  
  res.json({ embedded, extracted });
});
```

### 3. UploadModal.tsx

**Current**: File upload only

**Needed**: Processing settings

```tsx
<div className="processing-settings">
  <label>
    <input type="checkbox" checked={embedForSearch} disabled />
    Embed for search (required)
  </label>
  <label>
    <input type="checkbox" checked={extractPrompts} onChange={...} />
    Extract exploration prompts
  </label>
  {extractPrompts && (
    <label className="ml-4">
      <input type="checkbox" checked={autoEnrich} onChange={...} />
      Auto-enrich with Grove context
    </label>
  )}
</div>
```

---

## Document Metadata Schema

**Current** (inferred from usage):
```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'embedded' | 'error';
  keywords?: string[];
  embedding?: number[];
}
```

**Proposed Addition**:
```typescript
interface Document {
  // ... existing fields
  processingSettings?: {
    extractPrompts: boolean;
    autoEnrich: boolean;
    groveContextVersion?: string;
  };
  processingStatus?: {
    embedded: boolean;
    extracted: boolean;
    enriched: boolean;
    lastProcessedAt?: string;
  };
}
```

---

## API Contract Changes

### POST /api/knowledge/embed

**Current Request**:
```json
{ "documentIds": ["id1", "id2"], "limit": 10 }
```

**New Request** (backward compatible):
```json
{
  "documentIds": ["id1", "id2"],
  "limit": 10,
  "runExtraction": true,
  "runEnrichment": true
}
```

**New Response**:
```json
{
  "embedded": { "processed": 5, "errors": [] },
  "extracted": { "prompts": 12, "errors": [] },
  "enriched": { "polished": 12, "errors": [] }
}
```

---

## Dependency: GROVE_WORLDVIEW_CONTEXT

This sprint depends on `extraction-grove-context-v1` which defines the constant.

If that sprint isn't complete yet, this sprint should:
1. Define the constant (same content)
2. Use it in `extractKeywords` AND enrichment functions
3. Ensure single source of truth
