# Research Lifecycle 1.0 Roadmap

**Status:** Strategic Roadmap  
**Created:** January 12, 2026  
**Sprint Context:** sprout-research-v1  
**Source Conversation:** Claude Desktop session, January 12, 2026

---

## The Core Insight: Configuration IS the Agent

This roadmap emerged from a key architectural realization: the Experiences Console in /bedrock is the configuration surface for **grove-level system objects** that shape behavior without code changes.

These aren't separate "agents" that get deployed. They're **system_objects** that:

1. Live in the grove's configuration layer
2. Are versioned (you can roll back)
3. Are snapshotted when work products are created (provenance)
4. Shape behavior of the actual execution code

The "Prompt Architect" isn't a standalone thing—it's the existing intake pipeline *reading* PromptArchitectConfig to know how to behave. The "Writer Agent" isn't a separate service—it's the writing phase reading WriterAgentConfig to determine voice, structure, and citation style.

**Same code. Different configuration. Different personality.**

---

## The Agent Configuration Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│  EXPERIENCES CONSOLE (/bedrock)                                     │
│  "How does this grove think?"                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Prompt Architect│  │  Research Agent │  │  Writer Agent   │     │
│  │     Config      │  │     Config      │  │    Config       │     │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤     │
│  │ • Hypothesis    │  │ • Search depth  │  │ • Voice/Tone    │     │
│  │   goals         │  │ • Source prefs  │  │ • Citation      │     │
│  │ • Inference     │  │ • Confidence    │  │   style         │     │
│  │   rules         │  │   thresholds    │  │ • Structure     │     │
│  │ • Quality gates │  │ • Max API calls │  │ • Custom        │     │
│  │ • Confirmation  │  │ • Timeout rules │  │   instructions  │     │
│  │   mode          │  │                 │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Evaluator     │  │    Critic       │  │   Synthesis     │     │
│  │     Config      │  │    Config       │  │     Config      │     │
│  │   (future)      │  │   (future)      │  │   (future)      │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Grove Personality Emerges from Config Stack**

A legal discovery grove might have:
- PromptArchitectConfig: Case theory focus, strict quality gates, always-confirm mode
- WriterAgentConfig: Formal voice, Chicago citations, evidentiary structure
- ResearchAgentConfig: High depth, prioritize primary sources, conservative confidence

A startup strategy grove might have:
- PromptArchitectConfig: Broad hypothesis space, low gates, auto-confirm most sparks
- WriterAgentConfig: Direct voice, inline citations, executive summary format
- ResearchAgentConfig: Breadth over depth, include practitioner sources

---

## The Research Lifecycle: Agents in Sequence

The research lifecycle involves three distinct agents, each with separate configuration concerns:

```
User: "sprout: What are pricing models for distributed inference?"
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PROMPT ARCHITECT                                                   │
│  Question: "What should we research?"                               │
│  Config: PromptArchitectConfig (quality gates, inference rules)     │
│  Output: ResearchSprout (branches, strategy, grove context)         │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  RESEARCH AGENT                                                     │
│  Question: "What did we find?"                                      │
│  Config: ResearchAgentConfig (depth, sources, confidence)           │
│  - Executes searches per branch                                     │
│  - Collects evidence (source, quote, relevance, confidence)         │
│  - Does NOT write prose                                             │
│  Output: EvidenceBundle                                             │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  WRITER AGENT                                                       │
│  Question: "How do we present this?"                                │
│  Config: WriterAgentConfig (voice, structure, citations)            │
│  - Loads WriterAgentConfig for grove                                │
│  - Transforms evidence into prose                                   │
│  - Applies voice, structure, citation rules                         │
│  Output: ResearchDocument                                           │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GARDEN INSPECTOR (UI)                                              │
│  - Displays document with progress states                           │
│  - CTA: "Add to Knowledge Base"                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Why Agent Separation Matters

**Different configuration concerns.** Research Agent cares about search depth, source quality thresholds, relevance scoring. Writer Agent cares about formality level, citation style (Chicago vs. APA), section structure, voice.

**Reusability.** The same Writer Agent config could format:
- Research outputs (this use case)
- Chat insights promoted to corpus
- External document imports
- Synthesis across multiple sprouts
- Future: executive summaries, one-pagers

**Quality isolation.** If output is bad, you can debug: Was the evidence weak? Or was the writing poor? Separation lets you validate each step.

**Grove personality at scale.** Jim's Grove writes like Jim. A university research grove writes like an academic. This is the Writer's job, configured once and applied consistently.

---

## Current State (January 2026)

### What's Built

**Prompt Architect (Complete)**
- `sprout:` command detection and routing
- PromptArchitectConfig loading with inference rules
- Quality gate enforcement
- ResearchSprout object model with grove context snapshots
- GardenInspector confirmation dialog
- Full UI flow from command → confirmation → queue

**Research Agent (Skeleton)**
- Queue consumer pattern for pending sprouts
- Research Agent skeleton with progress callbacks
- Progress event types defined
- Runs in `simulationMode: true` (fake evidence)

**UI Layer (Foundation)**
- GardenTray for sprout display with status grouping
- Pulsing badge notifications and toast system
- Status grouping and filtering (active, attention, completed)

### What's Missing

**Research Agent (Execution)**
- Real LLM/search execution (currently placeholder)
- Evidence extraction from search results
- Branch-by-branch evidence collection
- EvidenceBundle generation

**Writer Agent (New)**
- WriterAgentConfig schema
- Evidence → prose transformation
- Citation formatting
- ResearchDocument generation

**Results Display**
- Document rendering in GardenInspector
- Progress streaming during execution
- "Add to Knowledge Base" integration

---

## The v1.0 Demo Vision

**User Experience Flow:**

1. **Initiation** - User types `sprout: What are the pricing models for distributed inference?`
2. **Confirmation** - GardenInspector shows inferred branches, research strategy; user clicks "Start Research"
3. **Progress** - Live updates: "Searching pricing strategies..." → "Found 4 sources" → "Analyzing evidence..." → "Writing synthesis..."
4. **Results** - Formatted document appears with position statement, analysis, and clickable citations
5. **Action** - User clicks "Add to Knowledge Base" to persist

**Success Criteria:**
- Complete lifecycle in under 90 seconds
- Real, verifiable sources with clickable URLs
- Professional-quality prose matching grove voice
- Clear progress visibility throughout

---

## Sprint Roadmap

### Sprint 1: Evidence Collection Engine
**Goal:** Research Agent produces real EvidenceBundle from web searches

**Scope:**
- ResearchAgentConfig schema (depth, source preferences, confidence thresholds)
- Research execution engine with web search integration
- Evidence extraction and structuring
- EvidenceBundle as handoff artifact

**User Experience:**
- Console logging shows real searches happening
- Branch-by-branch progress visible in debug mode

**Key Files:**
- `@core/schema/research-agent-config.ts` (new)
- `@core/schema/evidence-bundle.ts` (new)
- `src/explore/services/research-execution-engine.ts` (new)
- `src/explore/services/research-agent.ts` (modify - replace simulation)

**Technical Decisions:**
- Use existing Gemini service for search (grounding enabled)
- Sequential branch processing for MVP (easier debugging)
- Local-state only (defer Supabase persistence)

---

### Sprint 2: Writer Agent Foundation
**Goal:** Transform evidence into formatted research documents

**Scope:**
- WriterAgentConfig schema (voice, structure, citations)
- Default config with professional voice
- Writer system prompt from research-agent-vision.md
- Evidence → ResearchDocument transformation

**User Experience:**
- No visible change yet (headless)
- Documents are well-formatted when they appear

**Key Files:**
- `@core/schema/writer-agent-config.ts` (new)
- `@core/schema/research-document.ts` (new or enhance)
- `src/explore/services/writer-agent.ts` (new)
- System prompt: derive from `docs/product/research-agent-vision.md` Appendix A

**WriterAgentConfig Schema:**
```typescript
interface WriterAgentConfig {
  id: string;
  type: 'writer-agent-config';
  groveId: string;
  
  voice: {
    formality: 'casual' | 'professional' | 'academic' | 'technical';
    perspective: 'first-person' | 'third-person' | 'neutral';
    personality?: string;
  };
  
  documentStructure: {
    includePosition: boolean;
    includeLimitations: boolean;
    citationStyle: 'inline' | 'footnote' | 'endnote';
    citationFormat: 'chicago' | 'apa' | 'mla' | 'simple';
    maxLength?: number;
  };
  
  qualityRules: {
    requireCitations: boolean;
    minConfidenceToInclude: number;
    flagUncertainty: boolean;
  };
  
  customInstructions?: string;
}
```

---

### Sprint 3: Pipeline Integration
**Goal:** Connect Research Agent → Writer Agent → ResearchDocument

**Scope:**
- End-to-end pipeline wiring
- Config loading pattern (defaults for v1.0, Supabase-ready)
- Error handling and graceful degradation
- Timeout handling with partial results

**User Experience:**
- Submit sprout → watch progress → receive document
- Still using existing GardenInspector UI

**Key Files:**
- `src/explore/services/research-pipeline.ts` (new - orchestration)
- `src/explore/hooks/useResearchAgent.ts` (modify - consume full pipeline)

**Architectural Pattern:**
```typescript
async function executeResearch(sprout: ResearchSprout) {
  // Load configs (v1.0: returns defaults; future: from Supabase)
  const researchConfig = await loadResearchAgentConfig(sprout.groveId);
  const writerConfig = await loadWriterAgentConfig(sprout.groveId);
  
  // Research phase - shaped by researchConfig
  const evidence = await collectEvidence(sprout, researchConfig);
  
  // Write phase - shaped by writerConfig
  const document = await writeDocument(evidence, writerConfig);
  
  return document;
}
```

---

### Sprint 4: Progress Streaming UI
**Goal:** Real-time visibility into research execution

**Scope:**
- Live search query display in GardenInspector
- Sources discovered (URLs appearing as found)
- Analysis state indicators
- Synthesis progress

**User Experience:**
- "Searching: distributed inference pricing models..."
- "Found: arxiv.org - Efficient Inference at Scale"
- "Analyzing 6 sources..."
- "Writing synthesis..."

**Key Files:**
- `src/explore/GardenInspector.tsx` (enhance - progress display)
- `src/explore/components/ResearchProgress.tsx` (new)
- `src/explore/hooks/useResearchProgress.ts` (new or enhance)

**Progress Event Types (already defined):**
```typescript
type ResearchProgressEvent =
  | { type: 'searching'; query: string }
  | { type: 'source-found'; title: string; url: string }
  | { type: 'analyzing'; sourceCount: number }
  | { type: 'synthesizing' }
  | { type: 'complete'; documentId: string };
```

---

### Sprint 5: Results Display
**Goal:** Beautiful document rendering in GardenInspector

**Scope:**
- ResearchResultsView component
- Markdown rendering with citation links
- Position statement as highlighted quote
- Expandable citations section
- Copy and export actions

**User Experience:**
- Position (thesis) prominently displayed
- Smooth-reading analysis with inline citations
- Citations section with source previews
- "Copy to Clipboard" button
- "Add to Knowledge Base" CTA

**Key Files:**
- `src/explore/components/ResearchResultsView.tsx` (new)
- `src/explore/components/CitationBlock.tsx` (new)
- `src/explore/GardenInspector.tsx` (integrate results view)

---

### Sprint 6: Knowledge Base Integration
**Goal:** Promote research documents to grove corpus

**Scope:**
- "Add to Knowledge Base" action handler
- Document persistence (local or Supabase)
- Success confirmation and linking
- Research → corpus provenance chain

**User Experience:**
- Click "Add to Knowledge Base"
- Toast: "Added to Grove knowledge base"
- Document appears in corpus with research provenance

**Key Files:**
- `src/explore/services/knowledge-base-integration.ts` (new)
- Integration with existing corpus/knowledge systems

---

### Sprint 7: Polish and Demo Prep
**Goal:** Demo-ready proof of concept

**Scope:**
- Error handling edge cases
- Loading states and skeleton UI
- Performance optimization
- Demo script and recording

**User Experience:**
- Graceful handling of search failures
- Clear error messages when things go wrong
- Smooth, professional feel throughout

**Deliverables:**
- Working demo video
- Stakeholder walkthrough script
- Known limitations documentation

---

## Schema Summary

### System Objects (Agent Configs)

| Config | Status | Location |
|--------|--------|----------|
| PromptArchitectConfig | ✅ Complete | `@core/schema/prompt-architect-config.ts` |
| ResearchAgentConfig | Sprint 1 | `@core/schema/research-agent-config.ts` |
| WriterAgentConfig | Sprint 2 | `@core/schema/writer-agent-config.ts` |

### Handoff Artifacts

| Artifact | Producer | Consumer |
|----------|----------|----------|
| ResearchSprout | Prompt Architect | Research Agent |
| EvidenceBundle | Research Agent | Writer Agent |
| ResearchDocument | Writer Agent | UI / Knowledge Base |

---

## Future: Experiences Console UI

For v1.0, agent configs exist and shape behavior, but administrators can't edit them via UI. The "headless" approach proves the architecture.

Future sprints would add the Experiences Console UI in /bedrock:
- Visual editor for each agent config
- Preview of how changes affect behavior
- Version history and rollback
- Grove templates (legal, academic, startup, etc.)

---

## Success Metrics for v1.0

1. **Functional:** Complete lifecycle from `sprout:` command to rendered document
2. **Real:** Actual web search, real evidence, verifiable citations
3. **Quality:** Professional prose that matches intended grove voice
4. **Speed:** Under 90 seconds for typical research queries
5. **Visible:** Clear progress indicators throughout execution
6. **Architectural:** Clean separation enabling future configuration UI

---

## Appendix: Key Reference Documents

**Product Vision:**
- `docs/product/research-agent-vision.md` - Full spec with system prompts

**Sprint Documentation:**
- `docs/sprints/sprout-research-v1/INDEX.md` - Phase checklist
- `docs/sprints/sprout-research-v1/DEVLOG.md` - Session history

**Specifications:**
- `Chat_Native_Sprout_Research_Spec_v1_1.docx` - Architectural spec

**This Roadmap:**
- `docs/RESEARCH_LIFECYCLE_1.0_ROADMAP.md` - This document
