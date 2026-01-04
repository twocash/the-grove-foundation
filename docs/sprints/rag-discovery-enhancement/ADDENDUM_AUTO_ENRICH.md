# Addendum: Auto-Enrichment on Ingest

**Sprint:** rag-discovery-enhancement-v1  
**Phase:** Post-Epic 4 (execute after main sprint completes)  
**Scope:** ~15 minutes, ~20 lines of code

---

## Context

The main sprint creates bulk enrichment for backfill but doesn't auto-enrich new documents. This addendum hooks enrichment into the ingest pipeline so new docs are automatically enriched after embedding completes.

## Goal

```
Before: New Doc → Ingest → Embed → Done (no enrichment)
After:  New Doc → Ingest → Embed → Auto-Enrich → Done
```

## Implementation

### Step 1: Add Enrichment Hook to Ingest

**File:** `lib/knowledge/ingest.js`

Find where embedding status is set to 'complete' (likely after successful embedding generation). Add the auto-enrichment call:

```javascript
// Add import at top of file
import { enrichSingleDocument } from './enrich.js';

// After embedding completes successfully (find the spot where embedding_status = 'complete')
// Add this block:

// Auto-enrich after successful embedding (fire-and-forget)
enrichSingleDocument(documentId).catch(err => {
  console.error(`[Ingest] Auto-enrich failed for ${documentId}:`, err.message);
  // Don't throw - enrichment failure shouldn't block ingest
});

console.log(`[Ingest] Queued auto-enrichment for ${documentId}`);
```

### Step 2: Add Single Document Enrichment Function

**File:** `lib/knowledge/enrich.js`

Add this function (the batch version calls this internally, but we need it exported):

```javascript
/**
 * Enrich a single document by ID
 * Called automatically after embedding completes
 * @param {string} documentId
 * @param {string[]} [operations] - Which enrichment operations to run
 * @returns {Promise<Object>} - Enrichment results
 */
export async function enrichSingleDocument(documentId, operations = null) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Default operations if not specified
  const ops = operations || ['keywords', 'summary', 'entities', 'type', 'questions', 'freshness'];
  
  // Get document content
  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('documents')
    .select('id, title, content, enriched_at')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    throw new Error(`Document not found: ${documentId}`);
  }

  // Skip if already enriched
  if (doc.enriched_at) {
    console.log(`[Enrich] Document ${documentId} already enriched, skipping`);
    return { skipped: true, reason: 'already_enriched' };
  }

  console.log(`[Enrich] Starting enrichment for: ${doc.title}`);

  // Call existing enrichment endpoint internally
  // This reuses the server-side enrichment logic
  const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/knowledge/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      documentId, 
      operations: ops 
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Enrichment API failed: ${error}`);
  }

  const result = await response.json();
  console.log(`[Enrich] Completed enrichment for: ${doc.title}`);
  
  return result;
}
```

### Step 3: Update Exports

**File:** `lib/knowledge/index.js`

Add to exports:

```javascript
export { 
  getUnenrichedDocuments,
  getEnrichmentStats,
  enrichBatch,
  enrichSingleDocument,  // ADD THIS
} from './enrich.js';
```

---

## Alternative: Server-Side Hook

If `ingest.js` doesn't have a clean hook point, add to `server.js` instead.

Find the ingest/upload endpoint (likely `POST /api/knowledge/ingest` or similar) and add after successful embedding:

```javascript
// After embedding succeeds, trigger enrichment
const knowledge = await getKnowledgeModule();
knowledge.enrichSingleDocument(documentId).catch(err => {
  console.error(`[API] Auto-enrich failed: ${err.message}`);
});
```

---

## Verification

```bash
# 1. Start dev server
npm run dev

# 2. Ingest a new document (use your existing method)
# Watch logs for:
# [Ingest] Queued auto-enrichment for {uuid}
# [Enrich] Starting enrichment for: {title}
# [Enrich] Completed enrichment for: {title}

# 3. Verify document has enrichment
curl "http://localhost:3000/api/knowledge/documents/{uuid}" | jq '.keywords, .summary, .enriched_at'
```

---

## Rollback

If auto-enrichment causes issues:

```javascript
// Comment out the enrichSingleDocument call in ingest.js
// enrichSingleDocument(documentId).catch(...)
```

Documents will still ingest and embed; enrichment just becomes manual again.

---

## Notes

- **Fire-and-forget:** Enrichment runs async, doesn't block ingest response
- **Idempotent:** Skips if document already enriched
- **Graceful failure:** Logs errors but doesn't crash ingest
- **Uses existing logic:** Calls the same enrichment endpoint, no duplication

This completes the auto-enrichment loop. New documents will be searchable with hybrid scoring immediately after ingest.
