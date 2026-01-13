# Results Display v1 - Sprint Specification

**Sprint:** 5 - Results Display
**Codename:** results-display-v1
**Status:** Ready for Execution
**Dependencies:** Sprint 2 (Writer Agent) ✅, Sprint 3 (Pipeline Integration) 🚀

---

## Constitutional Reference

- [x] Read: `The_Trellis_Architecture__First_Order_Directives.md`
- [x] Read: `Bedrock_Architecture_Specification.md`
- [x] Read: `docs/BEDROCK_SPRINT_CONTRACT.md` (Binding Contract v1.3)
- [x] Read: `src/core/schema/research-document.ts`

---

## Goal

Beautiful document rendering in GardenInspector. Transform ResearchDocument from the Writer Agent into a polished, readable UI that displays:
- Position statement (thesis) prominently
- Markdown analysis with inline citations
- Clickable citation references
- Copy/export actions

---

## Scope

### In Scope
- ResearchResultsView component
- CitationBlock component
- Markdown rendering with citation links
- Position statement as highlighted quote
- Expandable citations section
- Copy to clipboard action
- Integration with GardenInspector

### Out of Scope
- "Add to Knowledge Base" action (Sprint 6)
- LLM integration (placeholder remains)
- Real-time streaming of results (Sprint 4)
- Edit/modify document capabilities

---

## DEX Compliance Matrix

### Feature: ResearchResultsView Component

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | [x] | Citations rendered from data, no hardcoded display logic |
| Capability Agnosticism | [x] | Works with any ResearchDocument regardless of source model |
| Provenance as Infrastructure | [x] | Every citation traces to source URL with accessedAt timestamp |
| Organic Scalability | [x] | Component accepts ResearchDocument schema; new fields render automatically |

**Blocking issues:** None

### Feature: CitationBlock Component

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | [x] | Citation display driven by Citation schema |
| Capability Agnosticism | [x] | Works with any citation regardless of research agent |
| Provenance as Infrastructure | [x] | Displays title, URL, domain, snippet, accessedAt |
| Organic Scalability | [x] | Array-based; handles 0-N citations |

**Blocking issues:** None

---

## Console Implementation Checklist

Note: This sprint modifies GardenInspector (existing component), not creating a new console.

- [x] Component integrates with existing GardenInspector
- [ ] ResearchResultsView displays position statement prominently
- [ ] Markdown analysis renders with proper formatting
- [ ] Citations section is expandable/collapsible
- [ ] Copy to clipboard button functional
- [ ] Mobile-responsive layout verified

---

## Copilot Actions

N/A - This sprint adds display components, not Copilot interactions.

---

## Object Types Used

| Object Type | Usage | Schema Location |
|-------------|-------|-----------------|
| ResearchDocument | Primary input for display | `src/core/schema/research-document.ts` |
| Citation | Citation rendering | `src/core/schema/research-document.ts` |
| ResearchSprout | Context for document lookup | `src/core/schema/research-sprout.ts` |

---

## Key Files

### Create
- `src/explore/components/ResearchResultsView.tsx` — Main results display component
- `src/explore/components/CitationBlock.tsx` — Individual citation display
- `tests/visual-qa/results-display.spec.ts` — Visual verification tests
- `docs/sprints/results-display-v1/REVIEW.html` — Sprint verification document

### Modify
- `src/explore/GardenInspector.tsx` — Integrate ResearchResultsView for completed sprouts

### Reference (read-only)
- `src/core/schema/research-document.ts` — ResearchDocument schema
- `src/explore/services/writer-agent.ts` — Writer Agent output format

---

## Architectural Pattern

```typescript
// src/explore/components/ResearchResultsView.tsx

interface ResearchResultsViewProps {
  /** The research document to display */
  document: ResearchDocument;

  /** Optional: show compact version */
  compact?: boolean;

  /** Callback when copy is clicked */
  onCopy?: () => void;

  /** Callback when "Add to KB" is clicked (v1: disabled) */
  onAddToKnowledgeBase?: () => void;
}

export function ResearchResultsView({
  document,
  compact = false,
  onCopy,
  onAddToKnowledgeBase,
}: ResearchResultsViewProps) {
  return (
    <div className="research-results">
      {/* Confidence Badge */}
      <ConfidenceBadge score={document.confidenceScore} status={document.status} />

      {/* Position Statement - Thesis Card */}
      <PositionCard position={document.position} />

      {/* Analysis - Markdown with inline citation refs */}
      <AnalysisSection analysis={document.analysis} citations={document.citations} />

      {/* Limitations (if present) */}
      {document.limitations && (
        <LimitationsNote limitations={document.limitations} />
      )}

      {/* Citations - Expandable Section */}
      <CitationsSection citations={document.citations} />

      {/* Actions */}
      <ResultsActions
        onCopy={onCopy}
        onAddToKnowledgeBase={onAddToKnowledgeBase}
        disableKB={true} // v1: disabled
      />
    </div>
  );
}
```

---

## Visual Design Requirements

### Position Statement (Thesis Card)
- Large, prominent quote block
- Subtle purple/blue gradient background
- Light border with rounded corners
- Confidence score badge in corner

### Analysis Section
- Clean markdown rendering
- Inline citations as `[1]`, `[2]` superscript links
- Clicking citation scrolls to Citations section
- Readable line height and spacing

### Citations Section
- Collapsible by default
- Each citation shows:
  - Index number `[1]`
  - Title (linked to URL)
  - Domain badge
  - Snippet preview
  - "Accessed" timestamp
- Expand/collapse animation

### Actions Bar
- Copy to Clipboard button
- "Add to Knowledge Base" button (disabled for v1, enabled in Sprint 6)
- Word count / citation count stats

---

## Success Criteria

From User Stories (see Notion):

| Story | Title | Priority |
|-------|-------|----------|
| US-E001 | Display Position Statement | P0 |
| US-E002 | Render Markdown Analysis | P0 |
| US-E003 | Show Clickable Citations | P0 |
| US-E004 | Copy Document to Clipboard | P1 |
| US-E005 | Handle Insufficient Evidence | P1 |
| US-E006 | Display Confidence Indicator | P1 |
| US-E007 | Mobile Responsive Layout | P2 |

---

## Feature Parity Status

| Feature | Legacy Location | Bedrock Status | Parity? |
|---------|-----------------|----------------|---------|
| Research results display | N/A (new feature) | Implementing | N/A |

---

## Visual Verification Requirements (Article IX)

This sprint modifies UI and MUST include:

- [ ] Screenshots in `docs/sprints/results-display-v1/screenshots/`
- [ ] REVIEW.html with AC-to-evidence mapping
- [ ] Playwright tests in `tests/visual-qa/results-display.spec.ts`
- [ ] All screenshots capture: default state, each AC, interactive elements
- [ ] Sign-off recorded with timestamp

---

## Reference Files

**ResearchDocument Schema:**
- `src/core/schema/research-document.ts`

**Writer Agent:**
- `src/explore/services/writer-agent.ts`

**GardenInspector (integration point):**
- `src/explore/GardenInspector.tsx`

**Roadmap:**
- `docs/RESEARCH_LIFECYCLE_1.0_ROADMAP.md`
