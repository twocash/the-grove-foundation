# DECISIONS.md - prompt-refinement-v1

> **Sprint**: prompt-refinement-v1
> **Created**: 2026-01-06

---

## ADR-001: Title Strategy - Questions Default with Compelling Action

### Status
**ACCEPTED**

### Context
Extracted prompts have titles like "Observer Dynamic" or "Distributed Long-Term Memory" - concept labels that don't communicate what the user will explore. We need to transform these into compelling exploration prompts.

Options considered:
1. Generate both question and topic-phrase styles during extraction
2. Default to questions, provide manual override
3. Default to questions, provide Copilot action for transformation

### Decision
**Option 3**: Questions as default + `/make-compelling` Copilot action.

- Extraction generates question-style titles by default: "What is the Observer Dynamic?"
- `/make-compelling` action uses `interestingBecause` field to craft topic-phrase: "The Observer Dynamic: Seeing Without Being Seen"
- Avoids doubling token cost during extraction

### Consequences
- Lower extraction cost (single title generated)
- Operators can selectively transform titles that need it
- `interestingBecause` field becomes more valuable (used for transformation)
- May need to improve question generation logic over time

---

## ADR-002: Execution Prompt Structure - Three Fields

### Status
**ACCEPTED**

### Context
The REQUIREMENTS.md proposed four fields for structured execution prompts:
- `userIntent`
- `responseGuidance`
- `depthLevel`
- `suggestedFollowups`

### Decision
Use **three fields**, dropping `depthLevel`:

```typescript
interface StructuredExecutionPrompt {
  userIntent: string;
  conceptAngle: string;  // renamed from responseGuidance
  suggestedFollowups?: string[];
}
```

### Rationale
- **Drop `depthLevel`**: The engagement machine already handles depth based on entropy and stage. Adding a static depth level creates potential conflicts.
- **Rename to `conceptAngle`**: More descriptive - it's the angle/perspective for framing the response.
- **Make followups optional**: Not every prompt needs explicit follow-ups; the system can generate contextually.

### Consequences
- Simpler schema, fewer fields to populate during extraction
- Depth remains dynamic based on runtime context
- `conceptAngle` populated from existing `interestingBecause` field

---

## ADR-003: Auto-Extraction Default Off

### Status
**ACCEPTED**

### Context
Should prompt extraction run automatically when documents are ingested?

Options:
1. Auto-extract on ingest (default on)
2. Auto-extract on ingest (default off, toggle to enable)
3. Manual trigger only

### Decision
**Option 2**: Auto-extraction defaults OFF at collection level.

- One-click manual trigger: "Extract prompts from this document"
- Collection-level setting to enable auto-extraction
- Smart re-extraction on document update with diff view

### Rationale
- Prevents unwanted prompt proliferation
- Gives operators control over extraction timing
- Reduces compute costs for large document uploads
- Diff view for re-extraction prevents duplicate prompts

### Consequences
- Operators must explicitly trigger extraction
- Need to build manual trigger UI
- Need to track which documents have been extracted

---

## ADR-004: UI Within Three-Panel Constraint

### Status
**ACCEPTED**

### Context
The REQUIREMENTS.md suggested a potential "full-screen comparison mode" or "Kanban-style board" for review. Should we break from the standard three-panel layout?

### Decision
**Stay within three-panel pattern**:
- Navigation | Content | Inspector layout preserved
- Add collapsible "Source Context" section at TOP of Inspector
- Defer full-width expand unless proven necessary

### Rationale
- Consistency with other Bedrock consoles
- Users already familiar with pattern
- Collapsible source context provides information without clutter
- Can always add full-width mode later if needed

### Consequences
- Source context limited to Inspector width
- May need horizontal scroll for long passages
- Batch actions appear in contextual features slot

---

## ADR-005: Batch Operations Architecture

### Status
**ACCEPTED**

### Context
How should batch operations work for approving/rejecting/QA-checking multiple prompts?

Options:
1. Dedicated batch mode with different UI
2. Selection state + batch action buttons
3. Keyboard-only batch operations

### Decision
**Option 2**: Individual actions as primitives, batch = "apply action to selection."

- Selection state managed in `usePromptSelection` hook
- Keyboard shortcuts: A (approve), R (reject), E (edit/inspect)
- Shift+Click for range selection
- Batch actions show confirmation + progress
- Results available for review (not auto-applied)

### Rationale
- Same actions work for single or multiple prompts
- Keyboard shortcuts speed up power users
- Confirmation prevents accidental mass operations
- Progress indicator for large batches

### Consequences
- Need selection state management
- Need to implement range selection
- Need confirmation modal for destructive actions
- Need progress indicator for batch operations

---

## ADR-006: Source Context Fetching Strategy

### Status
**ACCEPTED**

### Context
When should we fetch source document context for extracted prompts?

Options:
1. Pre-fetch for all visible prompts
2. Lazy load when Inspector opens
3. User-triggered fetch (button click)

### Decision
**Option 2**: Lazy load when Inspector opens.

- Fetch source context when prompt is inspected
- Cache results for session duration
- Show loading state in Source Context section

### Rationale
- Reduces unnecessary API calls
- Context only needed when user is reviewing specific prompt
- Cache prevents repeated fetches for same prompt

### Consequences
- Small delay when opening Inspector (loading state)
- Cache management needed
- Need graceful handling of missing source documents

---

## ADR-007: QA Check Result Storage

### Status
**ACCEPTED**

### Context
Where should QA check results be stored?

Options:
1. In-memory only (ephemeral)
2. In prompt payload (persistent)
3. Separate QA results table

### Decision
**Option 2**: Store in prompt payload.

```typescript
interface PromptPayload {
  qaScore?: number;
  qaLastChecked?: string;
  qaIssues?: QAIssue[];
}
```

### Rationale
- Results persist across sessions
- No additional database tables needed
- QA history tied to prompt version
- Easy to query prompts by QA score

### Consequences
- Prompt payload grows with QA data
- Need to update qaLastChecked on each check
- Old QA results may become stale (timestamp helps)

---

## ADR-008: Keyboard Shortcut Scope

### Status
**ACCEPTED**

### Context
Should keyboard shortcuts be global (window-level) or scoped to specific components?

### Decision
**Scoped to ReviewQueue focus** with global Escape handler.

- A/R/E only work when ReviewQueue has focus
- Escape clears selection globally
- Prevents conflicts with text editing in Inspector

### Rationale
- Avoids accidental approvals while editing
- Standard pattern for keyboard shortcuts in lists
- Escape is universally "cancel/clear"

### Consequences
- Need to track/manage focus state
- May need focus indicator in ReviewQueue
- Document shortcuts in console header

---

## ADR-009: QA Check Rate Limiting

### Status
**ACCEPTED**

### Context
QA checks involve LLM calls. How do we prevent abuse or excessive costs?

### Decision
**Rate limit: 10 QA checks per minute per user.**

- Batch operations count as single request (up to 50 prompts)
- Cache results for 5 minutes
- Show rate limit warning when approaching limit

### Rationale
- Prevents runaway costs
- Batch operations encourage efficient review
- Cache reduces repeated checks on same prompt

### Consequences
- Need rate limiting middleware
- Need to display rate limit status to user
- Batch size limited to 50 prompts

---

## ADR-010: Title Transformation Logic Location

### Status
**ACCEPTED**

### Context
Where should title transformation logic live?

Options:
1. In React component
2. In Copilot action handler
3. In dedicated utility module

### Decision
**Option 3**: Dedicated utility module `TitleTransforms.ts`.

```
src/bedrock/consoles/PromptWorkshop/utils/TitleTransforms.ts
```

### Rationale
- Pure functions, easily testable
- Reusable across extraction and Copilot action
- Decoupled from React lifecycle
- Can be called server-side if needed

### Consequences
- Need to import into multiple places
- Unit tests in separate file
- Transformation rules centralized

---

## ADR-011: 4D Multi-Dimensional Targeting

### Status
**ACCEPTED**

### Context
Prompts extracted from documents need targeting configuration. Initial assumption was "assign to ONE lens." 

Review of existing schema revealed:
- `LensAffinity[]` already supports multiple lenses with weights
- `PromptStage` (genesis/exploration/synthesis/advocacy) already exists
- `VocabularyLevel` and `NarrativeStyle` in narrative.ts are unused
- Stage → depth mapping exists conceptually but isn't surfaced in UI

### Decision
**Multi-dimensional targeting**: Prompts are explorable across MANY lenses at different depths. Stage determines response characteristics, not the prompt itself.

```
Stage → Response Depth Mapping:
───────────────────────────────
genesis     → accessible vocabulary, stakes-heavy, short
exploration → technical vocabulary, mechanics-deep, medium
synthesis   → academic vocabulary, evidence-first, long  
advocacy    → executive vocabulary, resolution-oriented, comprehensive
```

### Rationale
1. **DEX Compliance**: Declarative configuration of exploration paths
2. **Organic Scalability**: Supports "guided wandering" per Trellis principle
3. **Leverages Existing Schema**: Uses LensAffinity[], targeting.stages already present
4. **Future-Ready**: Foundation for full 4D targeting UI in later sprint

### Consequences
- UI shows lens compatibility matrix (read-only in this sprint)
- `/suggest-targeting` Copilot action infers from salience dimensions
- Future sprint adds editing capabilities
- Response generation must respect stage → depth mapping

---

## Decision Log

| # | Decision | Date | Status |
|---|----------|------|--------|
| 001 | Title Strategy - Questions Default | 2026-01-06 | ACCEPTED |
| 002 | Execution Prompt - Three Fields | 2026-01-06 | ACCEPTED |
| 003 | Auto-Extraction Default Off | 2026-01-06 | ACCEPTED |
| 004 | UI Within Three-Panel | 2026-01-06 | ACCEPTED |
| 005 | Batch Operations Architecture | 2026-01-06 | ACCEPTED |
| 006 | Source Context Lazy Load | 2026-01-06 | ACCEPTED |
| 007 | QA Results in Payload | 2026-01-06 | ACCEPTED |
| 008 | Keyboard Shortcuts Scoped | 2026-01-06 | ACCEPTED |
| 009 | QA Rate Limiting | 2026-01-06 | ACCEPTED |
| 010 | Title Transforms Utility | 2026-01-06 | ACCEPTED |
| 011 | 4D Multi-Dimensional Targeting | 2026-01-06 | ACCEPTED |
