# Sprint Specification: Evidence Collection Engine v1

**Sprint Name:** evidence-collection-v1
**Codename:** evidence-collection-v1
**Domain:** Explore (Research Pipeline)
**Type:** Core Infrastructure
**Priority:** P0 (Critical — enables Research Lifecycle)
**Effort:** Large (6 stories, engine + schema work)
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

Replace simulated research execution with **real web searches** via Gemini grounding. This sprint creates the execution engine and schemas that power the Research Agent pipeline.

**The Vision:**
```
ResearchSprout → ResearchExecutionEngine → Real Web Searches → EvidenceBundle
```

**After this sprint:**
- Research Agent produces real evidence from actual web searches
- EvidenceBundle is a typed, provenance-tracked artifact
- ResearchAgentConfig lives in Experience Console via registry
- Simulation mode is fully replaced

---

## The Problem

### Current State (Simulated)

```
research-agent.ts:
  - Claims sprout
  - Generates FAKE evidence data
  - Returns simulated EvidenceBundle
  - No actual web searches performed

Result:
- Can't validate research quality
- No real sources to cite
- Demo-only, not production-ready
```

### Target State (Real Execution)

```
ResearchAgentConfig (Experience type)
        ↓
ResearchExecutionEngine
        ↓
Gemini API (grounding enabled)
        ↓
Real search results → Source objects
        ↓
EvidenceBundle (typed, attributed)
```

---

## Goals

1. **Define schemas** — ResearchAgentConfig as Experience type, EvidenceBundle as output artifact
2. **Build execution engine** — Real web searches via Gemini grounding
3. **Replace simulation** — Strangler fig migration in research-agent.ts
4. **Register type** — ResearchAgentConfig in EXPERIENCE_TYPE_REGISTRY
5. **Extract evidence** — Structure raw search results into typed findings

## Non-Goals

- Progress streaming UI (Sprint 4)
- Writer Agent integration (Sprint 2-3)
- Supabase persistence (deferred — local-state only)
- New routes or navigation items (uses Experience Console)
- Parallel branch processing (sequential for MVP)

---

## Acceptance Criteria

### Schema Foundation
- [ ] AC-1: ResearchAgentConfig schema defined as Experience type variant
- [ ] AC-2: ResearchAgentConfig extends base Experience schema
- [ ] AC-3: EvidenceBundle schema defined with full provenance fields
- [ ] AC-4: Schema validation tests pass for both types

### Registry Integration
- [ ] AC-5: `research` type registered in EXPERIENCE_TYPE_REGISTRY
- [ ] AC-6: Console Factory renders ResearchAgentConfig without custom components
- [ ] AC-7: Type selector in Experience Console shows "Research Agent" option

### Execution Engine
- [ ] AC-8: ResearchExecutionEngine calls Gemini with grounding enabled
- [ ] AC-9: Engine respects `maxApiCalls` budget limit
- [ ] AC-10: Engine handles search failures gracefully (no crashes)
- [ ] AC-11: Sequential branch processing (one at a time)

### Evidence Extraction
- [ ] AC-12: Findings extracted from search snippets
- [ ] AC-13: Confidence score calculated per bundle
- [ ] AC-14: Relevance score calculated per branch
- [ ] AC-15: Full source provenance (URL, title, snippet, accessedAt)

### Simulation Replacement
- [ ] AC-16: No simulation code active in research-agent.ts
- [ ] AC-17: Research Agent uses ResearchExecutionEngine
- [ ] AC-18: Console logging shows real search activity

### Build Gates
- [ ] AC-19: `npm run build` passes
- [ ] AC-20: `npm test` passes
- [ ] AC-21: No TypeScript errors

---

## DEX Compliance Matrix

Per Bedrock Sprint Contract Article I, Section 1.2:

### Feature: Research Execution Engine

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| **Declarative Sovereignty** | [x] Pass | ResearchAgentConfig enables behavior changes via config (searchDepth, maxApiCalls, sourcePreferences) — no code changes needed |
| **Capability Agnosticism** | [x] Pass | Engine uses Gemini service abstraction. Config doesn't assume specific model. Fallback handling for search failures. |
| **Provenance as Infrastructure** | [x] Pass | EvidenceBundle captures: source URL, page title, snippet, accessedAt timestamp, sproutId lineage. Full audit trail. |
| **Organic Scalability** | [x] Pass | Registry pattern allows new research variants (e.g., "deep-research", "quick-scan") via schema only. |

**Blocking issues:** None identified

---

## Architecture

### Schema Layer

```typescript
// @core/schema/research-agent-config.ts
interface ResearchAgentConfig extends ExperienceBase {
  type: 'research';
  searchDepth: number;        // Max searches per branch
  sourcePreferences: string[]; // Preferred source types
  confidenceThreshold: number; // Minimum confidence 0-1
  maxApiCalls: number;        // Budget limit per execution
}

// @core/schema/evidence-bundle.ts
interface EvidenceBundle {
  sproutId: string;           // Link to originating sprout
  branches: BranchEvidence[]; // Evidence per research branch
  totalSources: number;       // Count of sources consulted
  executionTime: number;      // Duration in milliseconds
  confidenceScore: number;    // Overall confidence 0-1
}

interface BranchEvidence {
  branchQuery: string;
  sources: Source[];
  findings: string[];
  relevanceScore: number;
}

interface Source {
  url: string;
  title: string;
  snippet: string;
  accessedAt: string; // ISO timestamp
}
```

### Execution Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   ResearchExecutionEngine                    │
├─────────────────────────────────────────────────────────────┤
│  Input: ResearchSprout + ResearchAgentConfig                │
├─────────────────────────────────────────────────────────────┤
│  1. Extract branches from sprout                            │
│  2. For each branch (sequential):                           │
│     a. Check budget (maxApiCalls)                           │
│     b. Call Gemini with grounding                           │
│     c. Extract sources from response                        │
│     d. Structure as BranchEvidence                          │
│  3. Calculate confidence score                              │
│  4. Assemble EvidenceBundle                                 │
├─────────────────────────────────────────────────────────────┤
│  Output: EvidenceBundle                                      │
└─────────────────────────────────────────────────────────────┘
```

### Integration Layer

```
research-agent.ts (Modified)
        │
        ├── OLD: generateSimulatedEvidence()  ← REMOVED
        │
        └── NEW: ResearchExecutionEngine.execute(sprout, config)
```

---

## Key Files

| File | Action | Notes |
|------|--------|-------|
| `@core/schema/research-agent-config.ts` | **New** | Experience type variant schema |
| `@core/schema/evidence-bundle.ts` | **New** | Output artifact schema |
| `src/explore/services/research-execution-engine.ts` | **New** | Core execution logic |
| `src/explore/services/research-agent.ts` | **Modify** | Replace simulation with real execution |
| `src/explore/config/experience-type-registry.ts` | **Modify** | Register `research` type |

---

## User Stories Reference

Full user stories with Gherkin acceptance criteria documented in Notion:
**[User Stories & Acceptance Criteria (v1.0 Review)](https://www.notion.so/2e6780a78eef81b2a69ed4ad0bb0aea8)**

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-E001 | Define ResearchAgentConfig Schema | P0 | S |
| US-E002 | Define EvidenceBundle Schema | P0 | S |
| US-E003 | Register Research Type in Registry | P0 | S |
| US-E004 | Create Research Execution Engine | P0 | L |
| US-E005 | Replace Simulation with Real Execution | P0 | M |
| US-E006 | Extract and Structure Evidence | P0 | M |

---

## Implementation Phases

### Phase 1: Schema Foundation
- [ ] Create `@core/schema/research-agent-config.ts`
- [ ] Create `@core/schema/evidence-bundle.ts`
- [ ] Add Zod validation schemas
- [ ] Add schema validation tests

**Gate:** `npm run build` passes, schema tests pass

### Phase 2: Registry Integration
- [ ] Add `research` type to EXPERIENCE_TYPE_REGISTRY
- [ ] Define field mappings for Console Factory
- [ ] Verify type selector shows "Research Agent"

**Gate:** Experience Console shows research type option

### Phase 3: Execution Engine
- [ ] Create `research-execution-engine.ts`
- [ ] Implement Gemini grounding call
- [ ] Implement budget tracking (maxApiCalls)
- [ ] Implement error handling (graceful failures)
- [ ] Implement sequential branch processing

**Gate:** Engine returns real EvidenceBundle from test sprout

### Phase 4: Evidence Extraction
- [ ] Implement source extraction from Gemini response
- [ ] Implement findings distillation
- [ ] Implement confidence scoring
- [ ] Implement relevance scoring

**Gate:** EvidenceBundle contains structured, attributed data

### Phase 5: Strangler Fig Migration
- [ ] Identify simulation code in research-agent.ts
- [ ] Wire ResearchExecutionEngine
- [ ] Remove/disable simulation paths
- [ ] Add console logging for debug visibility

**Gate:** `console.log` shows real search queries, no simulation data

### Phase 6: Verification
- [ ] Run full research flow end-to-end
- [ ] Verify EvidenceBundle in debug console
- [ ] Screenshot evidence of real sources
- [ ] Update REVIEW.html

**Gate:** All acceptance criteria checked, REVIEW.html complete

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sequential processing | Yes | Easier debugging for MVP, parallel is Phase 2 |
| Gemini grounding | Use existing service | Already integrated, grounding supported |
| Local-state only | Yes | Defer Supabase per spec |
| Experience type variant | Yes | Leverages Console Factory, no new routes |
| Confidence calculation | Source count + agreement | Simple heuristic for v1 |

---

## Open Questions

1. **Gemini grounding configuration** — Does the existing Gemini service have grounding enabled? Need to verify before execution engine work.

2. **Source quality heuristics** — How do we determine if a source is "authoritative"? Options:
   - Domain allowlist (curated)
   - Manual curation per-source
   - Algorithm (TBD for v2)

3. **Branch budget allocation** — When maxApiCalls is reached, which branches get priority?
   - Order defined in sprout (current assumption)
   - Priority field (future enhancement)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Console Factory v2 | ✅ Complete | ResearchAgentConfig uses polymorphic editor |
| Universal Inspector Fixes | ✅ Complete | Inspector pattern established |
| Gemini Service | ✅ Exists | Verify grounding is enabled |
| EXPERIENCE_TYPE_REGISTRY | ✅ Exists | Add `research` entry |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gemini grounding not enabled | Medium | High | Verify before Phase 3, escalate if blocked |
| API rate limits | Low | Medium | Budget tracking (maxApiCalls) built-in |
| Poor search quality | Medium | Medium | Confidence scoring flags low-quality results |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Real searches executed | ≥1 per branch |
| EvidenceBundle completeness | All fields populated |
| Source provenance | 100% have URL + timestamp |
| Simulation code | 0% active |
| Build status | Green |

---

## Related Work

- **Parent Spec:** Research Lifecycle 1.0 Roadmap (Notion)
- **User Stories:** [User Stories & Acceptance Criteria](https://www.notion.so/2e6780a78eef81b2a69ed4ad0bb0aea8)
- **Dependency:** Console Factory v2 (complete)
- **Blocks:** Sprint 2 (Writer Agent), Sprint 3 (Research Pipeline)

---

*This specification follows the Foundation Loop methodology with Bedrock Sprint Contract compliance.*
