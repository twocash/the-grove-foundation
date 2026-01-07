# SPEC.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Created**: 2026-01-06
> **Status**: 📋 SPECIFICATION

---

## ATTENTION ANCHOR

```
┌─────────────────────────────────────────────────────────────────┐
│ GOAL: Declarative pipeline at upload time                       │
│                                                                 │
│ DEX PATTERN:                                                    │
│   • Declare processing intent when uploading                    │
│   • System executes full pipeline automatically                 │
│   • GROVE_WORLDVIEW_CONTEXT informs ALL stages                  │
│                                                                 │
│ KEY INSIGHT:                                                    │
│   Grove context improves KEYWORDS → better EMBEDDINGS           │
│   → better SEARCH → better DISCOVERY                            │
│                                                                 │
│ FILES: 3 (server.js, UploadModal.tsx, PipelineMonitorWithUpload)│
│ SCOPE: ~150 lines added/modified                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Constant: GROVE_WORLDVIEW_CONTEXT

**Note**: If `extraction-grove-context-v1` is already complete, this constant exists. If not, add it as Step 1.

This constant is used by:
1. `extractKeywords()` - Weight Grove vocabulary in keywords
2. `polishExtractedConcepts()` - Ground prompts in Grove thesis
3. `enrichPromptTitles()` - Grove-aware title suggestions
4. `enrichPromptTargeting()` - Grove-aware lens recommendations

---

## Component 1: Upload Modal Settings

**File**: `src/bedrock/consoles/PipelineMonitor/UploadModal.tsx`

### Add State

```tsx
const [extractPrompts, setExtractPrompts] = useState(true);
const [autoEnrich, setAutoEnrich] = useState(true);
```

### Add Settings UI (after file drop zone, before upload button)

```tsx
{/* Processing Pipeline Settings */}
<div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
  <div className="text-sm font-medium text-white/70 mb-2">
    Processing Pipeline
  </div>
  
  <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
    <input
      type="checkbox"
      checked={true}
      disabled
      className="rounded bg-white/10 border-white/20"
    />
    <span>Embed for search</span>
    <span className="text-white/40">(required)</span>
  </label>
  
  <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
    <input
      type="checkbox"
      checked={extractPrompts}
      onChange={(e) => setExtractPrompts(e.target.checked)}
      className="rounded bg-white/10 border-white/20"
    />
    <span>Extract exploration prompts</span>
  </label>
  
  {extractPrompts && (
    <label className="flex items-center gap-2 text-sm text-white/60 ml-6">
      <input
        type="checkbox"
        checked={autoEnrich}
        onChange={(e) => setAutoEnrich(e.target.checked)}
        className="rounded bg-white/10 border-white/20"
      />
      <span>Auto-enrich with Grove context</span>
    </label>
  )}
</div>
```

### Modify Upload Handler

Pass settings to the upload endpoint:

```tsx
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('processingSettings', JSON.stringify({
  extractPrompts,
  autoEnrich,
}));

const response = await fetch('/api/knowledge/documents', {
  method: 'POST',
  body: formData,
});
```

---

## Component 2: Grove-Weighted Keyword Extraction

**File**: `server.js` - `extractKeywords()` function (~line 5160)

### Current

```javascript
async function extractKeywords(content, title) {
  const prompt = `Extract 5-10 high-signal keywords from this document. Return as a JSON array of strings.

Title: ${title}
Content: ${content.slice(0, 3000)}

Return ONLY a JSON array, like: ["keyword1", "keyword2", ...]`;
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
```

---

## Component 3: Unified Pipeline Endpoint

**File**: `server.js` - `/api/knowledge/embed` route (~line 4694)

### Current

```javascript
app.post('/api/knowledge/embed', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    const { documentIds, limit } = req.body;
    
    // Only embedding
    const result = await knowledge.embedPendingDocuments(limit || 10);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### New

```javascript
app.post('/api/knowledge/embed', async (req, res) => {
  try {
    const knowledge = await getKnowledgeModule();
    if (!knowledge) {
      return res.status(503).json({ error: 'Knowledge module not available' });
    }

    const { documentIds, limit, runExtraction, runEnrichment } = req.body;
    const response = { embedded: null, extracted: null, enriched: null };

    // Step 1: Embedding (always runs)
    if (documentIds && documentIds.length > 0) {
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
      response.embedded = { processed, errors };
    } else {
      response.embedded = await knowledge.embedPendingDocuments(limit || 10);
    }

    // Step 2: Extraction (if requested or document settings indicate)
    if (runExtraction && response.embedded?.processed > 0) {
      try {
        // Get the document IDs that were just embedded
        const embeddedIds = documentIds || await getRecentlyEmbeddedDocumentIds(limit || 10);
        
        // Call extraction for each document
        const extractionResults = await extractPromptsFromDocuments(embeddedIds, runEnrichment);
        response.extracted = extractionResults;
      } catch (error) {
        console.error('[Pipeline] Extraction error:', error);
        response.extracted = { error: error.message };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('[Knowledge] Pipeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Extract prompts from documents (reuses existing extraction logic)
async function extractPromptsFromDocuments(documentIds, runEnrichment = true) {
  const results = { prompts: 0, errors: [] };
  
  for (const docId of documentIds) {
    try {
      // Get document content
      const knowledge = await getKnowledgeModule();
      const doc = await knowledge.getDocument(docId);
      
      if (!doc?.content) {
        results.errors.push(`${docId}: No content`);
        continue;
      }

      // Extract concepts (reuse existing buildClaudeExtractionPrompt logic)
      const concepts = await extractConceptsFromDocument(doc);
      
      // Polish if requested
      if (runEnrichment && concepts.length > 0) {
        const polished = await polishExtractedConcepts(concepts, doc);
        results.prompts += polished.length;
      } else {
        results.prompts += concepts.length;
      }
    } catch (error) {
      results.errors.push(`${docId}: ${error.message}`);
    }
  }
  
  return results;
}
```

---

## Component 4: Process Queue Button Update

**File**: `src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx`

### Current handleProcess

```tsx
const handleProcess = useCallback(async () => {
  setProcessing(true);
  try {
    const response = await fetch(PIPELINE_API.embed, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 10 }),
    });
    // ...
  }
});
```

### New handleProcess

```tsx
const handleProcess = useCallback(async () => {
  setProcessing(true);
  try {
    const response = await fetch(PIPELINE_API.embed, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        limit: 10,
        runExtraction: true,  // Execute full pipeline
        runEnrichment: true,
      }),
    });
    
    const result = await response.json();
    
    // Show comprehensive result
    if (result.extracted?.prompts) {
      setExtractionResult({
        extracted: result.extracted.prompts,
        errors: result.extracted.errors?.length || 0
      });
    }
    
    onRefresh?.();
  } finally {
    setProcessing(false);
  }
}, [onRefresh]);
```

---

## Before/After: Keyword Extraction

### Before (generic document)

**Document**: "Memory Architecture for Distributed AI Agents"

**Keywords extracted**:
```json
["memory", "architecture", "distributed", "AI", "agents", "neural networks"]
```

### After (Grove-weighted)

**Keywords extracted**:
```json
["Hybrid Cognition", "memory architecture", "Knowledge Commons", "distributed inference", "agent coordination", "Technical Frontier"]
```

---

## Before/After: User Workflow

### Before (4+ clicks)

```
1. Click "Add Files" → upload
2. Wait for upload complete
3. Click "Process Queue" → embed
4. Wait for embedding
5. Click "Bulk Extract" → extract
6. Wait for extraction
7. Prompts appear (unpolished)
```

### After (2 clicks)

```
1. Click "Add Files" → configure pipeline → upload
2. Click "Process Queue" → embed + extract + polish
3. Polished prompts appear
```

---

## Acceptance Criteria

| Test | Expected |
|------|----------|
| Upload modal shows settings | Checkboxes visible and functional |
| Settings stored with document | `processingSettings` in document metadata |
| Process Queue runs full pipeline | Embedding + extraction + polish in one call |
| Keywords include Grove vocabulary | When document discusses related concepts |
| Backward compatible | Old documents still process without settings |
| Error handling | Per-stage errors don't block subsequent documents |
