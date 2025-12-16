# Sprint: Topic Hub RAG Architecture

> **Status:** Ready for Implementation
> **Priority:** High
> **Estimated Complexity:** Medium
> **Branch:** Create from `main` at commit `506f4d7`

---

## Problem Statement

Currently, the Terminal loads **all** knowledge base files (~557KB) into every chat session's system prompt. This causes:

1. **TPM Quota Exhaustion** - Single requests consume ~142,000 tokens, hitting Gemini's tokens-per-minute limits
2. **Irrelevant Context** - Users asking about "The Ratchet" get context about "Diary Systems" diluting response quality
3. **No Topic Awareness** - The LLM doesn't know which knowledge domains are most relevant to the current query
4. **Fixed 50KB Limit** - Current workaround truncates context arbitrarily, losing valuable information

## Proposed Solution: Topic Hub RAG Architecture

### Core Concept

Replace "load everything" with **intelligent context selection** based on Topic Hubs:

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOPIC HUB RAG FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Query ──► Topic Router ──► Select Hub(s) ──► Load Context │
│                     │                                            │
│                     ▼                                            │
│            Match against hub tags                                │
│            (ratchet, economics, etc.)                            │
│                     │                                            │
│                     ▼                                            │
│            Hub defines:                                          │
│            - primarySource: "Grove_Ratchet_Deep_Dive.md"         │
│            - supportingSources: ["METR_research.md"]             │
│            - expertFraming: "You are explaining the Ratchet..."  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Knowledge Base Reorganization

#### Tier 1: Default Context (~15KB)
Always loaded. Provides foundational understanding.

| File | Purpose | Est. Size |
|------|---------|-----------|
| `_default/grove-overview.md` | TL;DR of entire thesis | 5KB |
| `_default/key-concepts.md` | Core vocabulary (Ratchet, Cognitive Split, etc.) | 5KB |
| `_default/visionary-narrative.md` | The "why" - emotional/strategic framing | 5KB |

#### Tier 2: Topic Hub Sources (~20-40KB each)
Loaded when Topic Hub is activated.

| Hub ID | Primary Source | Supporting Sources |
|--------|----------------|-------------------|
| `ratchet-effect` | `Grove_Ratchet_Deep_Dive.md` | `Ratchet_Quantitative.md`, `METR_research.md` |
| `infrastructure-bet` | `Grove_Economics_Deep_Dive.md` | `Hyperscaler_Analysis.md` |
| `cognitive-split` | `Hierarchical_Reasoning_Brief.md` | `Simulation_Deep_Dive.md` |
| `diary-system` | `Grove_Diary_Deep_Dive.md` | `Knowledge_Commons.md` |
| `university-path` | `Purdue_Strategic_Proposal.md` | `Engagement_Research.md` |
| `technical-arch` | `Grove_Technical_Architecture.md` | `Distributed_Systems.md` |

### Implementation Tasks

#### Phase 1: Knowledge Base Restructuring
- [ ] Create `_default/` folder in GCS bucket with core context files
- [ ] Use AI to extract/summarize content from existing 21 files into Tier 1 defaults
- [ ] Tag existing files with Topic Hub IDs
- [ ] Update `TopicHub` schema to include `sourceFiles: string[]` mapping

#### Phase 2: Server-Side RAG Logic
- [ ] Modify `fetchRagContext()` to accept optional `hubIds: string[]`
- [ ] Always load `_default/*` files first
- [ ] If hubIds provided, load those hub's source files
- [ ] Implement file-level caching (files rarely change)
- [ ] Add logging for context composition

#### Phase 3: Query-to-Hub Routing
- [ ] Enhance `topicRouter.ts` to return matched hub IDs
- [ ] Pass hub hints from frontend when following journey cards
- [ ] Allow server to auto-detect hubs from query keywords

#### Phase 4: Journey Integration
- [ ] Cards can specify `contextHubs: string[]` to pre-load relevant context
- [ ] Personas can have `preferredHubs: string[]` for their worldview
- [ ] Dynamic hub detection for free-form queries

### Schema Changes

```typescript
// Enhanced TopicHub (in src/core/schema/narrative.ts)
export interface TopicHub {
  id: string;
  title: string;
  tags: string[];           // Query matching keywords
  priority: number;
  enabled: boolean;

  // NEW: RAG Source Configuration
  sourceFiles: string[];    // Files to load when hub activated
  contextBudget: number;    // Max bytes for this hub's context (default 30000)

  // Existing
  expertFraming: string;
  keyPoints: string[];
  // ...
}

// Enhanced Card (for journey context hints)
export interface Card {
  // ...existing fields
  contextHubs?: string[];   // Hint which hubs to load for this card
}
```

### API Changes

```typescript
// POST /api/chat body enhancement
{
  message: string;
  sessionId?: string;
  // NEW: Context hints
  contextHubs?: string[];   // Explicit hub IDs to load
  autoDetectHubs?: boolean; // Let server match query to hubs (default true)
}
```

### Success Metrics

1. **Token Efficiency**: Average context size < 25KB (vs current 50KB hard limit)
2. **Response Relevance**: Responses cite sources from the correct Topic Hub
3. **No Rate Limits**: Zero TPM quota errors under normal usage
4. **Faster Responses**: Smaller context = faster Gemini processing

---

## AI-Assisted Content Creation

### Generating Tier 1 Default Context

Use Claude/GPT to create the default context files:

```
PROMPT FOR grove-overview.md:

You are summarizing "The Grove" white paper into a 5KB TL;DR for an AI system prompt.

Source material: [paste full white paper]

Create a dense, information-rich summary covering:
1. The $380B infrastructure bet and why it matters
2. The Ratchet thesis (7-month doubling, 21-month lag, 8x gap)
3. The Cognitive Split (local hum vs cloud breakthrough)
4. Why local ownership beats cloud rental
5. The Grove's unique position

Format: Markdown with headers. No fluff. Every sentence should convey unique information.
Target: ~1200 words (5KB)
```

### Auto-Tagging Existing Files

```
PROMPT FOR file tagging:

I have these knowledge base files: [list files]

And these Topic Hubs:
- ratchet-effect: The Ratchet, capability doubling, frontier-to-edge lag
- infrastructure-bet: $380B spending, hyperscalers, data centers
- cognitive-split: Local vs cloud, routine vs breakthrough cognition
- diary-system: Agent diaries, knowledge commons, memory
- university-path: Academic partnerships, Purdue, research
- technical-arch: System architecture, distributed computing

For each file, assign 1-2 primary hub IDs and explain why.
Output as JSON: { "filename": ["hub1", "hub2"], ... }
```

### Creating Hub Expert Framings

```
PROMPT FOR expert framing:

For the "ratchet-effect" Topic Hub, create an expertFraming prompt (2-3 sentences) that:
1. Positions the AI as an expert on this specific topic
2. Sets the tone (data-driven, precise about timelines)
3. Hints at key evidence to cite

Example output:
"You are explaining the Ratchet Effect with precision. Cite the 7-month frontier doubling cycle, the 21-month lag to edge devices, and the resulting constant 8x capability gap. Reference METR's research on frontier capabilities when discussing measurement."
```

---

## Handoff Checklist

Before starting this sprint:

- [x] Main branch pushed to origin (commit `506f4d7`)
- [x] Worktree `exciting-lumiere` pushed to origin
- [x] Production deployed with current fixes (RAG limit, retry logic)
- [ ] Create new worktree for this sprint: `git worktree add ../smart-rag smart-rag`
- [ ] Review current Topic Hub definitions in `src/core/config/defaults.ts`
- [ ] Inventory GCS knowledge files: `gcloud storage ls gs://grove-assets/knowledge/`

---

## Sprint Kickoff Prompt

Copy this to start your next Claude Code session:

```
I'm starting the Topic Hub RAG Architecture sprint for The Grove Foundation.

Context:
- Main branch is at commit 506f4d7 with all recent fixes
- Production is live at grove-foundation-6hxw4evzcq-uc.a.run.app
- Sprint spec is in docs/SPRINT_TOPIC_HUB_RAG.md

Current State:
- 21 knowledge files in GCS (~557KB total)
- 50KB hard limit truncates context arbitrarily
- Topic Hubs exist but don't control RAG loading
- topicRouter.ts matches queries to hubs but result isn't used for context

Goals for this sprint:
1. Restructure knowledge base into Default + Hub-specific tiers
2. Use AI to create condensed Tier 1 default context (~15KB)
3. Modify server to load context based on Topic Hub matches
4. Wire journey cards to hint which hubs to load

Please:
1. Create a new worktree for this sprint
2. Start with Phase 1: Use AI to analyze existing knowledge files and create the Tier 1 default content
3. Show me the proposed file structure before implementing

Let's build intelligent context selection!
```
