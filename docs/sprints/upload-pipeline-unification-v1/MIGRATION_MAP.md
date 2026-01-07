# MIGRATION_MAP.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Created**: 2026-01-06

---

## Change Summary

| File | Change Type | Lines |
|------|-------------|-------|
| `server.js` | Modify `extractKeywords` | +25 |
| `server.js` | Modify `/api/knowledge/embed` | +50 |
| `server.js` | Add helper function | +30 |
| `UploadModal.tsx` | Add settings UI | +40 |
| `PipelineMonitorWithUpload.tsx` | Update process handler | +10 |
| **Total** | | ~+155 |

---

## Prerequisite: GROVE_WORLDVIEW_CONTEXT

**Check if constant exists** (from `extraction-grove-context-v1`):

Search for `GROVE_WORLDVIEW_CONTEXT` in `server.js`.

- **If exists**: Skip to Change 1
- **If not**: Add the constant first (see extraction-grove-context-v1 sprint)

---

## Change 1: Modify extractKeywords

### Location
`server.js` - `extractKeywords` function (search for `async function extractKeywords`)

### Current (~line 5160)

```javascript
async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords from this document. Return as a JSON array of strings.

Title: ${title}
Content: ${content.slice(0, 3000)}

Return ONLY a JSON array, like: ["keyword1", "keyword2", ...]`;

  try {
    const response = await callGeminiForEnrichment(prompt);
```

### New

```javascript
async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords from this document for semantic search indexing.

## GROVE VOCABULARY (prioritize these terms when the document discusses related concepts)

The Grove uses specific terminology. When extracting keywords, if the document discusses any of these concepts, USE THE GROVE TERM as a keyword:

- "Computational Sovereignty" - AI running on hardware you control, independence from cloud providers
- "The Ratchet Thesis" - AI capability propagating from frontier to consumer hardware over time
- "Efficiency-Enlightenment Loop" - Agents motivated by earning access to enhanced cognition
- "Knowledge Commons" - Network-wide innovation sharing with attribution
- "Hybrid Cognition" - Local models + frontier cloud models working seamlessly together
- "Gardener/Observer Dynamic" - The human cultivating AI communities, dramatic irony of observation
- "Epistemic Independence" - Producing knowledge without dependency on potentially misaligned entities
- "Technical Frontier" - Academic research informing distributed AI architecture

Also include specific technical terms, named entities, and domain concepts from the document.

Title: ${title}
Content: ${content.slice(0, 3000)}

Return ONLY a JSON array of 5-10 keywords, like: ["Computational Sovereignty", "memory architecture", "distributed inference", ...]`;

  try {
    const response = await callGeminiForEnrichment(prompt);
```

---

## Change 2: Modify /api/knowledge/embed Endpoint

### Location
`server.js` - search for `app.post('/api/knowledge/embed'`

### Current

```javascript
app.post('/api/knowledge/embed', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { documentIds, limit } = req.body;

    if (documentIds && documentIds.length > 0) {
      // Embed specific documents
      const errors = [];
      let processed = 0;
      for (const id of documentIds) {
        try {
          await knowledge.embedDocument(id);
          processed++;
        } catch (error) {
          errors.push(`${id}: ${error.message}`);
        }
      }
      return res.json({ processed, errors });
    }

    // Embed all pending
    const result = await knowledge.embedPendingDocuments(limit || 10);
    res.json(result);
  } catch (error) {
    console.error('[Knowledge] Embed error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### New

```javascript
// Unified pipeline endpoint: embed + optionally extract + polish
// Sprint: upload-pipeline-unification-v1
app.post('/api/knowledge/embed', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { documentIds, limit, runExtraction, runEnrichment } = req.body;
    const response = { embedded: null, extracted: null };
    let embeddedDocIds = [];

    // Step 1: Embedding (always runs)
    if (documentIds && documentIds.length > 0) {
      const errors = [];
      let processed = 0;
      for (const id of documentIds) {
        try {
          await knowledge.embedDocument(id);
          embeddedDocIds.push(id);
          processed++;
        } catch (error) {
          errors.push(`${id}: ${error.message}`);
        }
      }
      response.embedded = { processed, errors };
    } else {
      const result = await knowledge.embedPendingDocuments(limit || 10);
      response.embedded = result;
      // Get IDs of embedded documents for extraction
      if (result.documents) {
        embeddedDocIds = result.documents.map(d => d.id);
      }
    }

    // Step 2: Extraction + Enrichment (if requested)
    if (runExtraction && embeddedDocIds.length > 0) {
      console.log(`[Pipeline] Running extraction for ${embeddedDocIds.length} documents`);
      try {
        const extractionResults = await extractPromptsFromDocuments(
          embeddedDocIds, 
          runEnrichment !== false // default to true
        );
        response.extracted = extractionResults;
      } catch (error) {
        console.error('[Pipeline] Extraction error:', error);
        response.extracted = { error: error.message, prompts: 0 };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('[Knowledge] Pipeline error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Change 3: Add Helper Function

### Location
Add after the modified `/api/knowledge/embed` endpoint

### New Function

```javascript
// Helper: Extract and polish prompts from documents
// Sprint: upload-pipeline-unification-v1
async function extractPromptsFromDocuments(documentIds, runEnrichment = true) {
  const results = { prompts: 0, errors: [] };
  const knowledge = await getKnowledgeModule();
  
  for (const docId of documentIds) {
    try {
      // Get document
      const doc = await knowledge.getDocument(docId);
      if (!doc?.content) {
        results.errors.push(`${docId}: No content`);
        continue;
      }

      console.log(`[Pipeline] Extracting from: ${doc.title || docId}`);

      // Build extraction prompt and call LLM
      const extractionPrompt = buildClaudeExtractionPrompt(doc.content, doc.title);
      const extractionResponse = await callGeminiForEnrichment(extractionPrompt);
      
      // Parse concepts from response
      let concepts = [];
      try {
        concepts = JSON.parse(extractionResponse);
        if (!Array.isArray(concepts)) concepts = [concepts];
      } catch (e) {
        console.warn(`[Pipeline] Parse error for ${docId}:`, e.message);
        results.errors.push(`${docId}: Parse error`);
        continue;
      }

      if (concepts.length === 0) {
        console.log(`[Pipeline] No concepts extracted from ${docId}`);
        continue;
      }

      // Polish if requested
      if (runEnrichment) {
        const polished = await polishExtractedConcepts(concepts, doc);
        results.prompts += polished.length;
        console.log(`[Pipeline] Polished ${polished.length} prompts from ${docId}`);
      } else {
        // Save raw concepts as prompts
        for (const concept of concepts) {
          await savePromptToDatabase({
            title: concept.title || concept.concept || 'Untitled',
            executionPrompt: concept.description || concept.prompt || '',
            sourceDocId: docId,
            status: 'draft'
          });
          results.prompts++;
        }
      }
    } catch (error) {
      console.error(`[Pipeline] Error processing ${docId}:`, error);
      results.errors.push(`${docId}: ${error.message}`);
    }
  }
  
  console.log(`[Pipeline] Extraction complete: ${results.prompts} prompts, ${results.errors.length} errors`);
  return results;
}
```

---

## Change 4: Upload Modal Settings UI

### Location
`src/bedrock/consoles/PipelineMonitor/UploadModal.tsx`

### Add State (near top of component)

```tsx
const [extractPrompts, setExtractPrompts] = useState(true);
const [autoEnrich, setAutoEnrich] = useState(true);
```

### Add Settings UI (after file list, before upload button)

Find the upload button and add this section before it:

```tsx
{/* Processing Pipeline Settings - Sprint: upload-pipeline-unification-v1 */}
{files.length > 0 && (
  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
    <div className="text-sm font-medium text-white/70 mb-2">
      Processing Pipeline
    </div>
    
    <label className="flex items-center gap-2 text-sm text-white/60 mb-2 cursor-not-allowed">
      <input
        type="checkbox"
        checked={true}
        disabled
        className="rounded bg-white/10 border-white/20 cursor-not-allowed"
      />
      <span>Embed for search</span>
      <span className="text-white/40 text-xs">(required)</span>
    </label>
    
    <label className="flex items-center gap-2 text-sm text-white/60 mb-2 cursor-pointer">
      <input
        type="checkbox"
        checked={extractPrompts}
        onChange={(e) => setExtractPrompts(e.target.checked)}
        className="rounded bg-white/10 border-white/20 cursor-pointer"
      />
      <span>Extract exploration prompts</span>
    </label>
    
    {extractPrompts && (
      <label className="flex items-center gap-2 text-sm text-white/60 ml-6 cursor-pointer">
        <input
          type="checkbox"
          checked={autoEnrich}
          onChange={(e) => setAutoEnrich(e.target.checked)}
          className="rounded bg-white/10 border-white/20 cursor-pointer"
        />
        <span>Auto-enrich with Grove context</span>
      </label>
    )}
  </div>
)}
```

### Store Settings (optional - for future per-document tracking)

If the upload handler sends metadata, include:

```tsx
const uploadSettings = {
  extractPrompts,
  autoEnrich,
};
// Include in form data or request body if API supports it
```

---

## Change 5: Process Queue Handler

### Location
`src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx`

### Find handleProcess function and update

```tsx
const handleProcess = useCallback(async () => {
  setProcessing(true);
  try {
    const response = await fetch(PIPELINE_API.embed, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        limit: 10,
        runExtraction: true,   // Run full pipeline
        runEnrichment: true,   // Include Grove context enrichment
      }),
    });
    
    const result = await response.json();
    console.log('[Pipeline] Process result:', result);
    
    // Show extraction results if available
    if (result.extracted?.prompts) {
      setExtractionResult({
        extracted: result.extracted.prompts,
        errors: result.extracted.errors?.length || 0
      });
    }
    
    onRefresh?.();
  } catch (error) {
    console.error('[Pipeline] Process error:', error);
  } finally {
    setProcessing(false);
  }
}, [onRefresh]);
```

---

## Verification Steps

1. **Build**: `npm run build` passes
2. **Keywords**: Upload document, check keywords include Grove vocab
3. **Full pipeline**: Click "Process Queue", verify extraction runs automatically
4. **UI settings**: Upload modal shows checkboxes
5. **Backward compat**: Old endpoint calls still work (just embedding)

---

## Rollback Plan

If issues arise:
1. Remove `runExtraction`/`runEnrichment` params from embed endpoint
2. Revert `extractKeywords` to original prompt
3. UI changes are additive - removing checkboxes is safe
