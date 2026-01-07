# EXECUTION_PROMPT.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Created**: 2026-01-06
> **For**: Claude Code or fresh context window

---

## ATTENTION ANCHOR

```
┌─────────────────────────────────────────────────────────────────┐
│ GOAL: Declarative pipeline at upload time                       │
│                                                                 │
│ DEX PATTERN: Declare intent when uploading → system executes    │
│                                                                 │
│ KEY CHANGES:                                                    │
│   1. Grove-weighted keyword extraction                          │
│   2. Unified embed endpoint (embed + extract + polish)          │
│   3. Upload modal with processing settings                      │
│   4. "Process Queue" runs full pipeline                         │
│                                                                 │
│ FILES: 3 (server.js, UploadModal.tsx, PipelineMonitorWithUpload)│
│ BACKWARD COMPATIBLE: Yes - existing behavior unchanged          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 0: Verify GROVE_WORLDVIEW_CONTEXT Exists

Search `server.js` for `GROVE_WORLDVIEW_CONTEXT`.

**If found**: Skip to Step 1
**If not found**: Add the constant (see extraction-grove-context-v1 sprint for full content, or use abbreviated version below)

### Abbreviated GROVE_WORLDVIEW_CONTEXT (if needed)

Add near top of server.js, after imports:

```javascript
// =============================================================================
// Grove Worldview Context - Single source of truth for ALL enrichment
// =============================================================================

const GROVE_WORLDVIEW_CONTEXT = `The Grove is distributed AI infrastructure that runs on your hardware, serves your interests, and gets smarter the more the network grows.

**Core Thesis**: AI you actually own, not rent. Every interaction builds value you keep.

## Key Concepts (USE THIS VOCABULARY)

**Computational Sovereignty**: AI on hardware you control, independence from cloud providers.
**The Ratchet Thesis**: Capability propagates frontier→consumer with 7-month doubling, ~21-month lag.
**Efficiency-Enlightenment Loop**: Agents work because solving problems earns enhanced cognition.
**Knowledge Commons**: Network-wide innovation sharing with attribution.
**Hybrid Cognition**: Local models (90% of work) + frontier cloud seamlessly together.
**Gardener/Observer Dynamic**: Human cultivates AI village; Observer creates dramatic irony.
**Epistemic Independence**: Knowledge production without dependency on misaligned entities.
**Technical Frontier**: Research informing Grove architecture—connect findings to "What does this mean for Grove?"

## Framing Principles
1. Ground in Grove vocabulary
2. Connect to thesis ("What does X mean for AI you actually own?")
3. Include context for newcomers
4. Focus on ONE aspect
5. Suggest deepening paths
6. Bridge research to practice`;
```

---

## Step 1: Grove-Weighted Keyword Extraction

### Location
`server.js` - Search for `async function extractKeywords`

### Find This

```javascript
async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords from this document. Return as a JSON array of strings.

Title: ${title}
Content: ${content.slice(0, 3000)}

Return ONLY a JSON array, like: ["keyword1", "keyword2", ...]`;
```

### Replace With

```javascript
// Grove-weighted keyword extraction
// Sprint: upload-pipeline-unification-v1
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
```

---

## Step 2: Unified Pipeline Endpoint

### Location
`server.js` - Search for `app.post('/api/knowledge/embed'`

### Replace Entire Endpoint

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
      } else if (result.processed > 0) {
        // Fallback: get recently embedded docs
        const recentDocs = await knowledge.getDocumentsByStatus('embedded', limit || 10);
        embeddedDocIds = recentDocs.map(d => d.id);
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
        response.extracted = { error: error.message, prompts: 0, errors: [] };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('[Knowledge] Pipeline error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Add Helper Function (after the endpoint)

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
      const extractionPrompt = buildClaudeExtractionPrompt(doc.content, doc.title || 'Untitled');
      const extractionResponse = await callGeminiForEnrichment(extractionPrompt);
      
      // Parse concepts from response
      let concepts = [];
      try {
        const cleaned = extractionResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        concepts = JSON.parse(cleaned);
        if (!Array.isArray(concepts)) concepts = [concepts];
      } catch (e) {
        console.warn(`[Pipeline] Parse error for ${docId}:`, e.message);
        console.warn('[Pipeline] Response was:', extractionResponse.slice(0, 500));
        results.errors.push(`${docId}: Parse error`);
        continue;
      }

      if (concepts.length === 0) {
        console.log(`[Pipeline] No concepts extracted from ${docId}`);
        continue;
      }

      console.log(`[Pipeline] Extracted ${concepts.length} concepts from ${docId}`);

      // Polish if requested (uses GROVE_WORLDVIEW_CONTEXT via polishExtractedConcepts)
      if (runEnrichment) {
        const polished = await polishExtractedConcepts(concepts, doc);
        results.prompts += polished.length;
        console.log(`[Pipeline] Polished ${polished.length} prompts from ${docId}`);
      } else {
        // Save raw concepts
        results.prompts += concepts.length;
        console.log(`[Pipeline] Saved ${concepts.length} raw prompts from ${docId}`);
      }
    } catch (error) {
      console.error(`[Pipeline] Error processing ${docId}:`, error);
      results.errors.push(`${docId}: ${error.message}`);
    }
  }
  
  console.log(`[Pipeline] Complete: ${results.prompts} prompts, ${results.errors.length} errors`);
  return results;
}
```

---

## Step 3: Upload Modal Settings UI

### Location
`src/bedrock/consoles/PipelineMonitor/UploadModal.tsx`

### Add State (near other useState declarations)

```tsx
const [extractPrompts, setExtractPrompts] = useState(true);
const [autoEnrich, setAutoEnrich] = useState(true);
```

### Add Settings UI

Find the section before the upload button (look for `GlassButton` with "Upload" text). Add this before it:

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
        className="rounded bg-white/10 border-white/20 cursor-not-allowed accent-emerald-500"
      />
      <span>Embed for search</span>
      <span className="text-white/40 text-xs">(required)</span>
    </label>
    
    <label className="flex items-center gap-2 text-sm text-white/60 mb-2 cursor-pointer hover:text-white/80">
      <input
        type="checkbox"
        checked={extractPrompts}
        onChange={(e) => setExtractPrompts(e.target.checked)}
        className="rounded bg-white/10 border-white/20 cursor-pointer accent-emerald-500"
      />
      <span>Extract exploration prompts</span>
    </label>
    
    {extractPrompts && (
      <label className="flex items-center gap-2 text-sm text-white/60 ml-6 cursor-pointer hover:text-white/80">
        <input
          type="checkbox"
          checked={autoEnrich}
          onChange={(e) => setAutoEnrich(e.target.checked)}
          className="rounded bg-white/10 border-white/20 cursor-pointer accent-emerald-500"
        />
        <span>Auto-enrich with Grove context</span>
      </label>
    )}
  </div>
)}
```

---

## Step 4: Process Queue Handler Update

### Location
`src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx`

### Find handleProcess and Update

```tsx
const handleProcess = useCallback(async () => {
  setProcessing(true);
  try {
    const response = await fetch(PIPELINE_API.embed, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        limit: 10,
        runExtraction: true,   // Sprint: upload-pipeline-unification-v1
        runEnrichment: true,   // Full pipeline with Grove context
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

## Step 5: Build & Test

```bash
npm run build
```

### Test Scenarios

1. **Upload with settings**: 
   - Open Pipeline Monitor
   - Click "Add Files"
   - Verify checkboxes appear
   - Upload document

2. **Process Queue**:
   - Click "Process Queue"
   - Check console for `[Pipeline]` logs
   - Verify prompts appear in corpus

3. **Keywords**:
   - Check embedded document's keywords
   - Verify Grove vocabulary included when relevant

4. **Backward compat**:
   - API call without new params should still work (embed only)

---

## Success Criteria

- [ ] `GROVE_WORLDVIEW_CONTEXT` constant exists
- [ ] `extractKeywords` includes Grove vocabulary prompt
- [ ] `/api/knowledge/embed` accepts `runExtraction`, `runEnrichment`
- [ ] `extractPromptsFromDocuments` helper function works
- [ ] Upload modal shows processing checkboxes
- [ ] "Process Queue" runs full pipeline
- [ ] Keywords include Grove terms when relevant
- [ ] Prompts generated automatically
- [ ] Backward compatible
- [ ] `npm run build` passes

---

## Update DEVLOG

After completion, update `docs/sprints/upload-pipeline-unification-v1/DEVLOG.md` with:
- Stories completed
- Example keywords (showing Grove vocabulary)
- Example pipeline run output
- Any issues encountered
