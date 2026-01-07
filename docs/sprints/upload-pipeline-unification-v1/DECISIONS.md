# DECISIONS.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Created**: 2026-01-06

---

## ADR-001: Declarative vs Imperative Pipeline

### Context
Current pipeline requires multiple manual clicks: upload → embed → extract → polish.

### Options
- A) Keep imperative (multiple buttons)
- B) Declarative at upload time (declare intent, system executes)
- C) Fully automatic (always run everything)

### Decision
**Option B: Declarative at upload time**

### Rationale
1. **DEX Pattern** - Declare intent at point of action
2. **User control** - Not all documents need extraction
3. **Flexibility** - Can still use individual endpoints for edge cases
4. **UX improvement** - 2 clicks instead of 4+

### Consequences
- Upload modal gains settings UI
- "Process Queue" reads settings and executes full pipeline
- Backward compatible with existing behavior

---

## ADR-002: Grove Context in Keywords

### Context
Should Grove vocabulary influence keyword extraction?

### Options
- A) Generic keywords (current)
- B) Grove-weighted keywords (proposed)
- C) Separate "Grove keywords" field

### Decision
**Option B: Grove-weighted keywords**

### Rationale
1. **Search quality** - "Computational Sovereignty" query finds relevant docs
2. **Corpus coherence** - Shared vocabulary across documents
3. **Single field** - No schema changes needed
4. **Graceful** - Non-Grove docs still get generic keywords

### Consequences
- `extractKeywords` prompt includes Grove vocabulary
- Keywords may include Grove terms when relevant
- Better semantic search for Grove concepts

---

## ADR-003: Pipeline Endpoint Unification

### Context
Should extraction be a separate endpoint or integrated into embed?

### Options
- A) Keep separate endpoints (current)
- B) Add parameters to embed endpoint (proposed)
- C) New unified `/api/pipeline/process` endpoint

### Decision
**Option B: Add parameters to embed endpoint**

### Rationale
1. **Backward compatible** - Existing calls work unchanged
2. **Progressive enhancement** - New params enable new features
3. **Single request** - One call for full pipeline
4. **No new routes** - Simpler API surface

### Consequences
- `/api/knowledge/embed` accepts `runExtraction`, `runEnrichment`
- Default behavior (no params) = embed only
- Full pipeline enabled with params

---

## ADR-004: Settings Storage

### Context
Where to store processing settings?

### Options
- A) Don't store (settings only affect immediate processing)
- B) Store in document metadata
- C) Store in separate settings table

### Decision
**Option A: Don't store (for MVP)**

### Rationale
1. **Simplicity** - No schema changes
2. **MVP scope** - Settings affect processing, not retrieval
3. **Future enhancement** - Can add storage later if needed

### Consequences
- Settings are ephemeral (only affect current batch)
- Can't retroactively see what settings were used
- Future: Add `processingSettings` to document if needed

---

## ADR-005: Error Handling Strategy

### Context
How to handle errors in multi-stage pipeline?

### Options
- A) Fail fast (error in any stage stops all)
- B) Continue on error (log and proceed)
- C) Per-document granularity

### Decision
**Option C: Per-document granularity**

### Rationale
1. **Resilience** - One bad document doesn't block others
2. **Visibility** - Errors reported per-document
3. **Debugging** - Clear which step failed for which doc

### Consequences
- Each document processes independently
- Response includes errors array with document IDs
- Successful documents complete even if others fail

---

## ADR-006: UI Settings Location

### Context
Where should pipeline settings appear?

### Options
- A) In upload modal
- B) Separate settings panel
- C) Global preference

### Decision
**Option A: In upload modal**

### Rationale
1. **Contextual** - Settings visible at point of action
2. **DEX pattern** - Declare intent when uploading
3. **Discoverable** - User sees options without hunting

### Consequences
- Upload modal gets checkbox section
- Settings apply to current upload batch
- Can override per-batch

---

## ADR-007: Default Settings

### Context
What should defaults be for new uploads?

### Options
- A) Minimal (embed only)
- B) Full pipeline (embed + extract + enrich)
- C) Configurable global default

### Decision
**Option B: Full pipeline enabled by default**

### Rationale
1. **Grove-first** - Most users want full processing
2. **Reduce friction** - Don't require extra clicks for common case
3. **Easy opt-out** - Uncheck if not needed

### Consequences
- `extractPrompts: true` by default
- `autoEnrich: true` by default
- Users can uncheck for document-only uploads

---

## ADR-008: Bulk Extract Button

### Context
Should we remove the separate "Bulk Extract" button?

### Options
- A) Remove it (unified pipeline only)
- B) Keep it (for ad-hoc extraction)
- C) Hide but keep endpoint

### Decision
**Option B: Keep it**

### Rationale
1. **Flexibility** - Ad-hoc extraction still useful
2. **Recovery** - Re-run extraction if needed
3. **Backward compat** - Don't break existing workflows

### Consequences
- "Bulk Extract" remains in header
- Can be used for re-processing existing documents
- Two ways to extract (automatic via pipeline, manual via button)
