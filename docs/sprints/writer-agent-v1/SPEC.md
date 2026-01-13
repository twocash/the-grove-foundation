# Sprint Specification: Writer Agent Foundation v1

**Sprint Name:** writer-agent-v1
**Codename:** writer-agent-v1
**Domain:** Explore (Research Pipeline)
**Type:** Core Infrastructure
**Priority:** P0 (Critical — enables Research Lifecycle)
**Effort:** Medium (6 stories, schema + service work)
**Created:** 2026-01-12
**Author:** Jim Calhoun / Claude

---

## Constitutional Reference

Per Bedrock Sprint Contract Article I:

- [x] Read: `The_Trellis_Architecture__First_Order_Directives.md`
- [x] Read: `Bedrock_Architecture_Specification.md`
- [x] Read: `BEDROCK_SPRINT_CONTRACT.md`

**Note:** This is a **Core Infrastructure Sprint** (per Contract Section 6.3). Console-specific requirements (Section 2.3, 3.4, 5.2) are N/A.

---

## Executive Summary

Build the Writer Agent that transforms EvidenceBundle (from Sprint 1) into formatted ResearchDocument. This sprint creates schemas, services, and system prompts for the writing phase of the research pipeline.

**The Vision:**
```
EvidenceBundle → WriterAgent (config-driven) → ResearchDocument (with citations)
```

**After this sprint:**
- WriterAgentConfig is a typed Experience with voice/structure settings
- ResearchDocument schema captures position, analysis, and citations
- Writer system prompt produces consistent, well-formatted output
- Pipeline ready for Sprint 3 integration

---

## The Problem

### Current State (Evidence Only)

```
research-execution-engine.ts:
  - Produces EvidenceBundle with raw sources
  - No transformation to readable document
  - No voice or style configuration
  - No citation formatting

Result:
- Evidence exists but isn't usable
- No position/thesis synthesis
- Can't present research to user
```

### Target State (Full Transformation)

```
EvidenceBundle (Sprint 1 output)
        ↓
WriterAgentConfig (Experience type)
        ↓
WriterAgent Service
        ↓
LLM with system prompt
        ↓
ResearchDocument (position + analysis + citations)
```

---

## Goals

1. **Define schemas** — WriterAgentConfig as Experience type, ResearchDocument as output artifact
2. **Build writer service** — Evidence → document transformation
3. **Create system prompt** — From research-agent-vision.md methodology
4. **Register type** — WriterAgentConfig in EXPERIENCE_TYPE_REGISTRY
5. **Wire pipeline** — Connect EvidenceBundle output to Writer input

## Non-Goals

- UI for document display (Sprint 5)
- RAG integration (Sprint 3)
- Document editing (future)
- Multi-document research campaigns (v2.0)
- Research history persistence (Sprint 6)

---

## Acceptance Criteria

### Schema Foundation
- [ ] AC-1: WriterAgentConfig schema defined as Experience type variant
- [ ] AC-2: WriterAgentConfig includes voice, documentStructure, qualityRules
- [ ] AC-3: ResearchDocument schema defined with position, analysis, citations
- [ ] AC-4: Schema validation tests pass for both types

### Registry Integration
- [ ] AC-5: `writer-agent-config` type registered in EXPERIENCE_TYPE_REGISTRY
- [ ] AC-6: Console Factory renders WriterAgentConfig without custom components
- [ ] AC-7: Type selector in Experience Console shows "Writer Agent" option

### Writer Service
- [ ] AC-8: WriterAgent service accepts EvidenceBundle + config
- [ ] AC-9: Service returns typed ResearchDocument
- [ ] AC-10: Service handles empty evidence gracefully (insufficient-evidence status)
- [ ] AC-11: Voice configuration affects output tone

### System Prompt
- [ ] AC-12: System prompt specifies position/thesis requirements
- [ ] AC-13: System prompt specifies citation format (inline [n] notation)
- [ ] AC-14: System prompt specifies markdown structure for analysis
- [ ] AC-15: Voice customization injected into prompt

### Pipeline Wiring
- [ ] AC-16: EvidenceBundle can be passed to WriterAgent
- [ ] AC-17: Source provenance flows to Citation objects
- [ ] AC-18: Console logging shows transformation activity

### Build Gates
- [ ] AC-19: `npm run build` passes
- [ ] AC-20: `npm test` passes
- [ ] AC-21: No TypeScript errors

---

## DEX Compliance Matrix

Per Bedrock Sprint Contract Article I, Section 1.2:

### Feature: Writer Agent Service

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| **Declarative Sovereignty** | [x] Pass | WriterAgentConfig enables voice/style changes via config (formality, perspective, citationStyle) — no code changes needed |
| **Capability Agnosticism** | [x] Pass | Service abstracts LLM. Config doesn't assume specific model. |
| **Provenance as Infrastructure** | [x] Pass | ResearchDocument maintains citation chain: Source (evidence) → Citation (document). Full attribution preserved. |
| **Organic Scalability** | [x] Pass | Registry pattern allows new writer variants (e.g., "summary-writer", "brief-writer") via schema only. |

**Blocking issues:** None identified

---

## Architecture

### Schema Layer

```typescript
// @core/schema/writer-agent-config.ts
interface WriterAgentConfigPayload {
  voice: {
    formality: 'casual' | 'professional' | 'academic' | 'technical';
    perspective: 'first-person' | 'third-person' | 'neutral';
    personality?: string;
  };

  documentStructure: {
    includePosition: boolean;
    includeLimitations: boolean;
    citationStyle: 'inline' | 'endnote';
    citationFormat: 'simple' | 'apa' | 'chicago';
    maxLength?: number;
  };

  qualityRules: {
    requireCitations: boolean;
    minConfidenceToInclude: number;
    flagUncertainty: boolean;
  };
}

// @core/schema/research-document.ts
interface ResearchDocument {
  id: string;
  evidenceBundleId: string;     // Link to source evidence
  query: string;                 // Original research query

  // The content
  position: string;              // 1-3 sentence thesis
  analysis: string;              // Full analysis (markdown)
  limitations?: string;          // What couldn't be determined
  citations: Citation[];

  // Metadata
  createdAt: string;
  wordCount: number;

  // Status
  status: 'complete' | 'partial' | 'insufficient-evidence';
  confidenceScore: number;       // Inherited from evidence
}

interface Citation {
  index: number;                 // [1], [2], etc.
  title: string;
  url: string;
  snippet: string;
  domain: string;
  accessedAt: string;
}
```

### Service Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      WriterAgent Service                     │
├─────────────────────────────────────────────────────────────┤
│  Input: EvidenceBundle + WriterAgentConfig                  │
├─────────────────────────────────────────────────────────────┤
│  1. Validate evidence (check for sources)                   │
│  2. Build prompt with voice/structure config                │
│  3. Call LLM with system prompt + evidence                  │
│  4. Parse structured output                                 │
│  5. Map sources to citations                                │
│  6. Return ResearchDocument                                 │
├─────────────────────────────────────────────────────────────┤
│  Output: ResearchDocument                                    │
└─────────────────────────────────────────────────────────────┘
```

### Integration Layer

```
research-execution-engine.ts (Sprint 1)
        │
        ├── Returns: EvidenceBundle
        │
        ▼
writer-agent.ts (NEW)
        │
        ├── Input: EvidenceBundle + WriterAgentConfig
        ├── Returns: ResearchDocument
        │
        ▼
[Sprint 3: Pipeline Integration]
```

---

## Key Files

| File | Action | Notes |
|------|--------|-------|
| `@core/schema/writer-agent-config.ts` | **New** | Experience type variant schema |
| `@core/schema/research-document.ts` | **New** | Output artifact schema |
| `src/explore/services/writer-agent.ts` | **New** | Core transformation service |
| `src/explore/prompts/writer-system-prompt.ts` | **New** | System prompt definition |
| `src/bedrock/types/experience.types.ts` | **Modify** | Register `writer-agent-config` type |
| `src/bedrock/config/consoles.ts` | **Modify** | Add console schema |

---

## User Stories Reference

Full user stories with Gherkin acceptance criteria documented in Notion:
**[User Stories & Acceptance Criteria (v1.0 Review)](https://www.notion.so/2e7780a78eef81ee9dbffae258ade65f)**

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-W001 | Define WriterAgentConfig Schema | P0 | S |
| US-W002 | Define ResearchDocument Schema | P0 | S |
| US-W003 | Register WriterAgentConfig in Registry | P0 | S |
| US-W004 | Create Writer Agent Service | P0 | M |
| US-W005 | Create Writer System Prompt | P0 | S |
| US-W006 | Wire Evidence to Document Pipeline | P0 | S |

---

## Implementation Phases

### Phase 1: Schema Foundation
- [ ] Create `@core/schema/writer-agent-config.ts`
- [ ] Create `@core/schema/research-document.ts`
- [ ] Add Zod validation schemas
- [ ] Export from `@core/schema/index.ts`

**Gate:** `npm run build` passes, schemas importable

### Phase 2: Registry Integration
- [ ] Add `writer-agent-config` type to EXPERIENCE_TYPE_REGISTRY
- [ ] Add console schema to consoles.ts
- [ ] Define field mappings for Console Factory
- [ ] Verify type selector shows "Writer Agent"

**Gate:** Experience Console shows writer agent type option

### Phase 3: System Prompt
- [ ] Create `writer-system-prompt.ts`
- [ ] Define base prompt from research-agent-vision.md
- [ ] Add voice customization injection
- [ ] Add structure customization injection

**Gate:** Prompt generates valid instructions for different configs

### Phase 4: Writer Service
- [ ] Create `writer-agent.ts`
- [ ] Implement evidence validation
- [ ] Implement prompt building
- [ ] Implement LLM call (placeholder for MVP)
- [ ] Implement output parsing
- [ ] Implement citation mapping

**Gate:** Service returns typed ResearchDocument from test evidence

### Phase 5: Pipeline Wiring
- [ ] Add export/import paths for cross-service use
- [ ] Add console logging for debug visibility
- [ ] Create test harness for manual verification

**Gate:** `console.log` shows transformation activity

### Phase 6: Verification
- [ ] Run full evidence → document flow manually
- [ ] Verify ResearchDocument in debug console
- [ ] Screenshot evidence of transformation
- [ ] Update REVIEW.html

**Gate:** All acceptance criteria checked, REVIEW.html complete

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM for writing | Gemini (same as research) | Consistency, existing integration |
| Citation style MVP | Inline [n] only | Simplest, most common format |
| Voice options | 4 formality levels | Covers common use cases |
| Local state only | Yes | Defer persistence per pattern |
| System prompt location | Separate file | Easier iteration and testing |

---

## Open Questions

1. **LLM choice** — Gemini for consistency, or Claude for writing quality? Decision: Start with Gemini for consistency.

2. **Document storage** — Where does ResearchDocument live before Sprint 3 wires persistence? Decision: Return value only, caller handles storage.

3. **Confidence inheritance** — Should ResearchDocument.confidenceScore come from EvidenceBundle? Decision: Yes, propagate from evidence.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Evidence Collection Engine (Sprint 1) | ✅ Complete | Provides EvidenceBundle input |
| Console Factory v2 | ✅ Complete | WriterAgentConfig uses polymorphic editor |
| EXPERIENCE_TYPE_REGISTRY | ✅ Exists | Add `writer-agent-config` entry |
| Gemini Service | ✅ Exists | Use for LLM calls |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Output quality inconsistent | Medium | High | Strong system prompt, quality rules in config |
| Citation mapping errors | Low | Medium | Explicit index matching, validation |
| Voice settings ignored | Low | Low | Prompt engineering, testing |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| ResearchDocument completeness | All required fields populated |
| Citation accuracy | 100% map to source evidence |
| Voice customization | Visible tone difference between settings |
| Build status | Green |

---

## Related Work

- **Parent Spec:** Research Lifecycle 1.0 Roadmap (Notion)
- **Dependency:** Sprint 1 - Evidence Collection Engine (complete)
- **User Stories:** [User Stories & Acceptance Criteria](https://www.notion.so/2e7780a78eef81ee9dbffae258ade65f)
- **Blocks:** Sprint 3 (Pipeline Integration), Sprint 5 (Results Display)

---

*This specification follows the Foundation Loop methodology with Bedrock Sprint Contract compliance.*
