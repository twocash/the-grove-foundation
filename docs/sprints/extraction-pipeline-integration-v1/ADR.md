# Architecture Decision Records

**Sprint:** extraction-pipeline-integration-v1  
**Date:** January 6, 2026

---

## ADR-001: Extraction Belongs in Pipeline Monitor, Not Prompt Workshop

### Status
**Accepted**

### Context
The prototype sprint (`prompt-extraction-pipeline-v1`) placed manual extraction UI in Prompt Workshop with an "Extract from Document" button and modal. This required users to:
1. Copy/paste document content into a modal
2. Manually trigger extraction
3. Review results in a separate workflow

### Decision
Move extraction to Pipeline Monitor as a Copilot command and toolbar action. Extraction is document processing—it belongs alongside `summarize`, `extract keywords`, and `extract entities`.

### Consequences
**Positive:**
- Extraction integrated with document lifecycle
- Bulk processing possible (all documents, filtered, unprocessed)
- Consistent UX with other enrichment operations
- Document tracking (which docs have been processed)

**Negative:**
- Review Queue remains in Prompt Workshop (split workflow)
- Requires API endpoint for bulk operations

### Alternatives Considered
1. **Keep in Prompt Workshop** — Rejected: wrong mental model, no bulk capability
2. **Automatic on upload** — Deferred: too aggressive, may extract from low-quality docs
3. **Separate Extraction Console** — Rejected: unnecessary fragmentation

---

## ADR-002: Stage Classification in Extraction Prompt, Not Post-Processing

### Status
**Accepted**

### Context
Extracted prompts need `targeting.stages` populated. Two approaches:
1. LLM classifies stages during extraction
2. Post-processing rules classify based on question patterns

### Decision
LLM classifies stages during extraction with explicit guidance in the prompt.

### Consequences
**Positive:**
- LLM has full context (document content, concept meaning)
- Can provide `stageReasoning` for human review
- More nuanced than regex pattern matching

**Negative:**
- Relies on LLM following instructions
- Stage classification quality varies by model

### Rationale
The extraction prompt already requires sophisticated understanding. Adding stage classification is incremental. Post-processing would lose context about why a concept matters.

---

## ADR-003: Topic Category Mapping to Existing Categories

### Status
**Accepted**

### Context
Extracted prompts need `topicAffinities` populated. Options:
1. Free-form topic generation
2. Map to existing categories from `groveCoreConcepts.json`

### Decision
Map to existing categories: infrastructure, architecture, economics, ratchet-thesis, vision, community, philosophy, roles, engagement.

### Consequences
**Positive:**
- Consistent with existing prompt library
- No topic proliferation
- Enables filtering by known categories

**Negative:**
- May force concepts into imperfect fits
- New categories require code change

### Rationale
DEX Principle: Declarative Sovereignty. Categories are configuration. Adding new categories should be a deliberate decision, not emergent from extraction.

---

## ADR-004: systemContext Generation is Mandatory

### Status
**Accepted**

### Context
The prototype extracted `userQuestion` but left `systemContext` empty or minimal. This meant the LLM answering highlight clicks had no guidance.

### Decision
Extraction prompt MUST generate rich `systemContext` including:
- User state (what stage, what they likely know)
- What to emphasize
- What to avoid
- Practical connection
- Concrete examples
- Tone guidance

### Consequences
**Positive:**
- Highlight responses are contextually appropriate
- Reduces need for manual systemContext authoring
- Quality floor for all extracted prompts

**Negative:**
- Longer extraction output
- More prompt engineering in extraction prompt
- Review needs to verify systemContext quality

### Rationale
A prompt without systemContext is incomplete. The LLM responding to highlights needs guidance to provide useful answers. This is the difference between "accurate" and "helpful."

---

## ADR-005: Preview Mode for Single-Document Extraction

### Status
**Accepted**

### Context
Pipeline Monitor Copilot commands can be `preview: true` (show results, require "Apply") or `preview: false` (immediate action).

### Decision
`extract-prompts` command uses preview mode. User sees extracted concepts with confidence scores before saving.

### Consequences
**Positive:**
- User can reject poor extractions before they pollute Review Queue
- Consistent with other extraction commands (keywords, entities)
- Transparency about what will be created

**Negative:**
- Extra step in workflow
- May want "just do it" mode for bulk

### Rationale
Extraction creates new objects. User should see what they're creating. Bulk extraction via toolbar action can skip preview since it's explicitly batch processing.

---

## ADR-006: Document Tracking Fields on Document Type

### Status
**Accepted**

### Context
Need to track which documents have been processed for prompt extraction to enable "unprocessed only" bulk mode.

### Decision
Add to Document interface:
```typescript
promptsExtracted?: boolean;
promptExtractionAt?: string;
promptExtractionCount?: number;
```

### Consequences
**Positive:**
- Simple filtering for bulk operations
- Visible in Pipeline Monitor UI
- Can show extraction status per document

**Negative:**
- Additional fields to maintain
- Migration needed for existing documents

### Alternatives Considered
1. **Separate tracking table** — Rejected: overengineered for this use case
2. **Check prompts data layer** — Rejected: expensive query, no timestamp

---

## ADR-007: Keep Review Queue in Prompt Workshop

### Status
**Accepted**

### Context
Extraction moves to Pipeline Monitor. Where should review happen?

### Decision
Review Queue stays in Prompt Workshop. The workflow is:
1. Pipeline Monitor: Extract prompts from documents
2. Prompt Workshop: Review and approve/reject extracted prompts

### Consequences
**Positive:**
- Prompt Workshop is the "prompt home" — all prompt operations there
- Review requires prompt editing capabilities (already in Workshop)
- Clear separation: Pipeline = documents, Workshop = prompts

**Negative:**
- Split workflow (extract in one place, review in another)
- User must switch consoles

### Rationale
The Review Queue is about prompt quality, not document processing. An extracted prompt is already a prompt—it belongs in Prompt Workshop.

---

## ADR-008: Confidence Threshold Default 0.7

### Status
**Accepted**

### Context
Extraction produces confidence scores. What threshold filters results?

### Decision
Default confidence threshold: 0.7 (70%). Configurable via API options.

### Consequences
**Positive:**
- Filters low-confidence extractions automatically
- Reduces Review Queue noise
- Can be adjusted for different quality bars

**Negative:**
- May miss edge cases that humans would accept
- "Magic number" without empirical validation

### Rationale
0.7 is a reasonable starting point. Too low (0.5) floods queue with maybes. Too high (0.9) misses good concepts the LLM was uncertain about. Can tune based on actual extraction quality.

---

## Decision Log

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Extraction in Pipeline Monitor | Accepted |
| 002 | Stage classification in extraction prompt | Accepted |
| 003 | Map to existing topic categories | Accepted |
| 004 | systemContext generation mandatory | Accepted |
| 005 | Preview mode for single-doc extraction | Accepted |
| 006 | Document tracking fields | Accepted |
| 007 | Review Queue stays in Prompt Workshop | Accepted |
| 008 | Confidence threshold 0.7 | Accepted |
