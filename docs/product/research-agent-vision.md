# Grove Research Agent: Product Vision & Plan

**Document Type:** Product Vision & Roadmap  
**Author:** Jim Calhoun, Take Flight Advisors  
**Created:** December 28, 2025  
**Status:** Draft for Review  

---

## Executive Summary

The Research Agent transforms Grove from a knowledge *retrieval* system into a knowledge *growth* system. Users can commission deep research on any topic, receive structured analysis with citations, and add validated findings directly to their personal knowledge base.

**The core insight:** Research is not a feature—it's a growth mechanism for the Grove. Every research request potentially yields new Sprouts that make future conversations smarter.

**MVP scope:** User issues research query → Agent produces structured document → User approves → Document enters RAG for future retrieval.

**Vision scope:** Research yields atomic Sprouts with provenance chains, connection suggestions, and confidence ratings—building a personal knowledge graph through use.

---

## Strategic Context

### Why Research Matters for Grove

Grove's value proposition is *owned intelligence*—knowledge infrastructure that belongs to the user, not the platform. But owned intelligence requires a growth mechanism. Currently, Sprouts emerge only from conversation. This is slow and serendipitous.

Research Agent adds intentional knowledge growth:

| Growth Mode | Mechanism | Speed | Coverage |
|-------------|-----------|-------|----------|
| Conversational | Insights emerge from dialogue | Slow | Narrow (follows conversation) |
| **Research** | User commissions targeted exploration | Fast | Broad (systematic coverage) |
| Import | User adds external documents | Variable | User-dependent |

Research fills the gap between passive conversation and active curation.

### Competitive Positioning

| Product | Research Capability | Knowledge Ownership |
|---------|---------------------|---------------------|
| ChatGPT | Basic web search, ephemeral | Platform owns context |
| Perplexity | Strong search, citations | No persistent knowledge base |
| Notion AI | Document Q&A | User owns docs, AI is query layer |
| **Grove** | Research → Sprouts → RAG | User owns growing knowledge graph |

Grove's differentiator: Research doesn't just answer questions—it *grows your Grove*. Every research session potentially makes future sessions smarter.

### Alignment with Trellis Architecture

Research Agent implements DEX principles:

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Research output format defined by schema, not code |
| **Capability Agnosticism** | Works with any model that can search and synthesize |
| **Provenance as Infrastructure** | Every claim traces to source URL and search query |
| **Organic Scalability** | Starts as single document, evolves to atomic Sprouts |

---

## User Personas & Jobs to Be Done

### Primary Persona: The Systematic Learner

**Profile:** Professional exploring a new domain—regulatory landscape, competitive analysis, technical architecture decision.

**Job to be done:** "I need to understand [complex topic] well enough to make decisions and explain my reasoning to others."

**Current alternatives:** 
- Multiple ChatGPT sessions (no persistence)
- Perplexity searches (good sources, no accumulation)
- Manual research and note-taking (time-intensive)

**Grove Research value:** Structured output with citations that becomes part of their permanent knowledge base.

### Secondary Persona: The Knowledge Curator

**Profile:** Researcher, analyst, or consultant building domain expertise over time.

**Job to be done:** "I want to systematically build a knowledge base on [domain] that I can reference and build upon."

**Current alternatives:**
- Notion/Roam with manual entry
- Zotero for academic sources
- Personal wikis

**Grove Research value:** Research compounds—each document adds to RAG, improving future research and conversation quality.

### Tertiary Persona: The Sprout Validator

**Profile:** User who captured an insight from conversation but wants to verify/expand it.

**Job to be done:** "I noted this claim in a conversation—is it actually true? What's the fuller picture?"

**Current alternatives:**
- Manual Google search
- Ask ChatGPT to verify (no sources)
- Ignore the uncertainty

**Grove Research value:** "Research This" on existing Sprout returns validated analysis that can replace or supplement the original.

---

## Product Vision

### The End State (v2.0+)

Research in Grove feels like having a research assistant who:
1. Understands your existing knowledge (reads your Grove)
2. Knows what you don't know (identifies gaps)
3. Produces atomic, citable insights (Sprouts with provenance)
4. Suggests connections (links new findings to existing Sprouts)
5. Gets smarter over time (learns your research patterns)

**User experience:**

```
User: /research What are the pricing models for distributed inference?

Grove: I see you have existing Sprouts on inference costs and edge 
       computing economics. I'll build on those.
       
       [Research in progress... 6 sources found]
       
       Research complete. I've harvested 5 insights:
       
       🌱 "Compute-time metering dominates current pricing..."
          confidence: 0.9 | connects to: "Edge latency Sprout"
       
       🌱 "Outcome-based pricing is emerging but requires..."
          confidence: 0.7 | new thread
       
       [Continue with 3 more...]
       
       [Review All] [Quick Accept] [Dismiss]
```

### The MVP (v1.0)

Research produces a single structured document that enters RAG on approval.

**User experience:**

```
User: /research What are the pricing models for distributed inference?

Grove: 🔬 Researching... (this may take a minute)
       
       [Progress: Searching... Analyzing... Synthesizing...]
       
       📄 Research Complete
       
       "Distributed inference networks are converging on three 
       pricing models: compute-time metering, QoS tiers, and 
       outcome-based pricing."
       
       3 citations | ~2,400 words | 47 seconds
       
       [View Full Document] [Add to Knowledge Base]
```

---

## MVP Specification

### Functional Requirements

#### FR-1: Research Command

**Trigger:** User types `/research [query]` in Terminal command input.

**Validation:**
- Query must be 10-500 characters
- Query must be a question or topic, not a command

**Response:** System acknowledges and begins research.

#### FR-2: Research Agent Execution

**Process:**
1. System prompt instructs agent on research methodology
2. Agent has access to web search tool
3. Agent performs 3-8 searches based on query complexity
4. Agent synthesizes findings into structured document
5. Agent returns document with citations

**Timeout:** 3 minutes maximum. If exceeded, return partial results with note.

**Cost tracking:** Log token usage per research request for future rate limiting.

#### FR-3: Research Document Schema

```typescript
interface ResearchDocument {
  id: string;
  query: string;
  
  // The content
  position: string;           // 1-3 sentence thesis
  analysis: string;           // Full analysis (markdown)
  citations: Citation[];
  
  // Metadata
  createdAt: number;
  searchesPerformed: number;
  tokensUsed: number;
  durationMs: number;
  
  // Status
  status: 'pending' | 'complete' | 'partial' | 'failed';
  ragStatus: 'not_added' | 'added';
}

interface Citation {
  index: number;              // [1], [2], etc.
  title: string;
  url: string;
  snippet: string;            // Relevant excerpt
  domain: string;             // For credibility signal
  accessedAt: number;
}
```

#### FR-4: Document Display

**In-stream preview:**
- Position (thesis) displayed
- Citation count and word count shown
- Two CTAs: "View Full Document" and "Add to Knowledge Base"

**Full document view:**
- Modal or slide-out panel
- Rendered markdown with citation links
- Sticky header with title and actions
- Citation list at bottom with snippets

#### FR-5: RAG Integration

**"Add to Knowledge Base" flow:**
1. User clicks CTA
2. Confirmation: "Add this research to your knowledge base? It will be available in future conversations."
3. On confirm: Document indexed to vector store
4. Success feedback: "Research added. You can reference this in future conversations."

**Indexing strategy:**
- Embed full document as single chunk (MVP simplicity)
- Metadata includes: query, citation URLs, creation date
- Retrieval: Standard semantic search against user's Grove

#### FR-6: Research History

**Requirement:** User can view past research documents.

**Access:** `/research history` command or dedicated UI route.

**Display:** List of past research with query, date, status, and RAG status.

### Non-Functional Requirements

#### NFR-1: Performance

- Research should complete in <90 seconds for typical queries
- Timeout at 180 seconds with graceful partial results
- Progress indication every 10 seconds

#### NFR-2: Cost Management

- MVP: No hard limits, but log all usage
- Track: tokens consumed, searches performed, duration
- Future: Implement daily/monthly quotas

#### NFR-3: Quality

- Citations must be real, accessible URLs
- Position must be supported by analysis
- Analysis must reference citations inline

#### NFR-4: Error Handling

- Network failures: Retry once, then fail gracefully
- No results: Return "insufficient sources" with suggestions
- Timeout: Return partial results with "research incomplete" flag

### User Interface Specifications

#### UI-1: Research Command Input

Location: Terminal command input (existing)

Behavior:
- `/research ` prefix triggers research mode
- Input field placeholder changes: "What would you like to research?"
- Submit initiates research flow

#### UI-2: Research Progress Indicator

Location: Stream (new StreamItem type or SystemEvent enhancement)

States:
```
🔬 Researching: "distributed inference pricing"
   Searching for sources...
   
🔬 Researching: "distributed inference pricing"
   Analyzing 6 sources...
   
🔬 Researching: "distributed inference pricing"
   Synthesizing findings...
```

Visual: Subtle animation, not intrusive. Cognitive state style from Kinetic Stream.

#### UI-3: Research Result Block

Location: Stream (new block type)

Layout:
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Research Complete                                        │
│                                                             │
│ [Position text - 1-3 sentences, the thesis]                 │
│                                                             │
│ ───────────────────────────────────────────────────────────│
│ 3 citations  •  ~2,400 words  •  47s                        │
│                                                             │
│ [View Full Document]  [Add to Knowledge Base]               │
└─────────────────────────────────────────────────────────────┘
```

Styling: GlassPanel variant, distinct from response blocks.

#### UI-4: Full Document Viewer

Location: Modal overlay or slide-out panel (TBD based on implementation ease)

Layout:
```
┌─────────────────────────────────────────────────────────────┐
│ Research: "distributed inference pricing models"        [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ # Position                                                  │
│                                                             │
│ Distributed inference networks are converging on three      │
│ pricing models: compute-time metering, quality-of-service   │
│ tiers, and outcome-based pricing.                           │
│                                                             │
│ # Analysis                                                  │
│                                                             │
│ ## Compute-Time Metering                                    │
│                                                             │
│ The dominant model in current distributed inference         │
│ networks charges per inference-second or per-token [1].     │
│ This approach mirrors traditional cloud computing...        │
│                                                             │
│ [... continued ...]                                         │
│                                                             │
│ # Citations                                                 │
│                                                             │
│ [1] "Decentralized Inference Pricing" - arxiv.org           │
│     "The paper proposes a metering framework..."            │
│                                                             │
│ [2] "Edge AI Economics" - a16z.com                          │
│     "Andreessen Horowitz analysis of pricing trends..."     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      [Add to Knowledge Base]                │
└─────────────────────────────────────────────────────────────┘
```

#### UI-5: RAG Confirmation

Trigger: User clicks "Add to Knowledge Base"

Modal:
```
┌─────────────────────────────────────────────────────────────┐
│ Add to Knowledge Base                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ This research will be added to your Grove and available     │
│ in future conversations.                                    │
│                                                             │
│ Query: "distributed inference pricing models"               │
│ Size: ~2,400 words, 3 citations                             │
│                                                             │
│                          [Cancel]  [Add]                    │
└─────────────────────────────────────────────────────────────┘
```

Success toast: "✓ Research added to your knowledge base"

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Terminal                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /research [query]                                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Research Handler                          │
│  - Validates query                                           │
│  - Creates ResearchJob                                       │
│  - Invokes Research Agent                                    │
│  - Streams progress to Terminal                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Research Agent                            │
│  - System prompt with methodology                            │
│  - Tool: web_search                                          │
│  - Iterative search/analyze/synthesize loop                  │
│  - Returns structured ResearchDocument                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Document Storage                          │
│  - Stores ResearchDocument                                   │
│  - Tracks RAG status                                         │
│  - Enables history retrieval                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (on user approval)
┌─────────────────────────────────────────────────────────────┐
│                    Vector Store (RAG)                        │
│  - Embeds document                                           │
│  - Stores with metadata                                      │
│  - Available for future retrieval                            │
└─────────────────────────────────────────────────────────────┘
```

### Research Agent Design

#### Agent Loop

```typescript
async function executeResearch(query: string): Promise<ResearchDocument> {
  const agent = new ClaudeAgent({
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8000,
    systemPrompt: RESEARCH_SYSTEM_PROMPT,
    tools: [webSearchTool]
  });
  
  // Single prompt that guides multi-step research
  const result = await agent.run(`
    Research query: "${query}"
    
    Follow your methodology:
    1. Scope the question
    2. Search for authoritative sources (3-8 searches)
    3. Analyze findings
    4. Synthesize into position + analysis + citations
    
    Return your findings in the specified JSON format.
  `);
  
  return parseResearchOutput(result);
}
```

#### System Prompt

```markdown
You are a research agent for Grove, a personal knowledge system.

## Your Mission

Transform a research query into a structured document with:
- A clear position (thesis)
- Supporting analysis
- Verified citations

## Research Methodology

### Phase 1: Scope (no searches)
- Clarify the research question
- Identify 3-5 key aspects to investigate
- Note what's in/out of scope

### Phase 2: Search (3-8 searches)
- Start broad, then narrow based on findings
- Prioritize: academic sources, official documentation, recognized experts
- Avoid: forums, social media, SEO-optimized content farms
- For each search, note the most valuable 1-2 sources

### Phase 3: Analyze
- Extract key claims from sources
- Note areas of consensus and disagreement
- Identify gaps in available information

### Phase 4: Synthesize
- Form a clear position based on evidence
- Structure analysis into logical sections
- Cite sources inline using [n] notation
- Be explicit about confidence and limitations

## Output Format

Return valid JSON:

```json
{
  "position": "1-3 sentence thesis summarizing findings",
  "analysis": "Full markdown analysis with ## sections and [n] citations",
  "citations": [
    {
      "index": 1,
      "title": "Source title",
      "url": "https://...",
      "snippet": "Relevant excerpt from source",
      "domain": "arxiv.org"
    }
  ],
  "searchesPerformed": 5,
  "limitations": "What couldn't be determined or verified"
}
```

## Quality Standards

- Every claim in analysis must have a citation
- Position must be supported by analysis
- Acknowledge uncertainty explicitly
- Prefer depth over breadth
- If sources conflict, present both views

## Constraints

- Maximum 8 web searches
- Return results even if incomplete
- Never fabricate sources
- URLs must be real and accessible
```

### API Integration

#### Endpoint

```typescript
// POST /api/research
interface ResearchRequest {
  query: string;
  options?: {
    maxSearches?: number;    // default: 8
    timeout?: number;        // default: 180000 (3 min)
  };
}

interface ResearchResponse {
  jobId: string;
  status: 'started' | 'complete' | 'failed';
  document?: ResearchDocument;
  error?: string;
}
```

#### Streaming Progress

For MVP, use Server-Sent Events or polling:

```typescript
// GET /api/research/:jobId/status
interface ResearchStatus {
  jobId: string;
  status: 'searching' | 'analyzing' | 'synthesizing' | 'complete' | 'failed';
  progress?: string;         // Human-readable progress
  searchesComplete?: number;
  document?: ResearchDocument;
}
```

### RAG Integration

#### Embedding Strategy

MVP: Embed full document as single vector.

```typescript
async function addToRAG(doc: ResearchDocument): Promise<void> {
  const content = formatForEmbedding(doc);
  
  await vectorStore.upsert({
    id: doc.id,
    vector: await embed(content),
    metadata: {
      type: 'research',
      query: doc.query,
      position: doc.position,
      citationCount: doc.citations.length,
      citationUrls: doc.citations.map(c => c.url),
      createdAt: doc.createdAt,
      wordCount: countWords(doc.analysis)
    }
  });
}

function formatForEmbedding(doc: ResearchDocument): string {
  return `
Research Query: ${doc.query}

Position: ${doc.position}

Analysis:
${doc.analysis}

Key Sources: ${doc.citations.map(c => c.title).join(', ')}
  `.trim();
}
```

#### Retrieval

Research documents retrieved alongside other Sprouts:

```typescript
async function retrieveContext(query: string): Promise<Context[]> {
  const results = await vectorStore.search({
    query,
    topK: 10,
    filter: { userId: currentUser.id }
  });
  
  // Research documents are just another context type
  return results.map(r => ({
    type: r.metadata.type,  // 'research' | 'sprout' | 'conversation'
    content: r.content,
    relevance: r.score,
    source: r.metadata
  }));
}
```

---

## Roadmap

### Phase 1: MVP (v1.0)

**Timeline:** 2-3 weeks  
**Goal:** Basic research → document → RAG flow

**Deliverables:**
- `/research` command handler
- Research agent with web search
- ResearchResultBlock in Terminal
- Document viewer (modal)
- RAG integration
- Research history (basic)

**Success criteria:**
- User can issue research query
- Document returns in <2 minutes
- Document can be added to RAG
- Document is retrievable in future conversations

### Phase 2: Polish & Validate (v1.1)

**Timeline:** 2 weeks  
**Goal:** Quality improvements based on usage

**Deliverables:**
- Research from existing Sprout ("Research This" button)
- Improved progress indication
- Better error handling and partial results
- Usage tracking and basic rate limiting
- Document editing before RAG addition

**Success criteria:**
- Research quality meets user expectations
- <10% failure rate
- Clear feedback on progress and errors

### Phase 3: Atomic Sprouts (v1.2)

**Timeline:** 3-4 weeks  
**Goal:** Research outputs Sprouts, not just documents

**Deliverables:**
- Structured analysis with clear sections
- Section → Sprout atomization on approval
- Connection suggestions to existing Sprouts
- Sprout review/edit UI
- Confidence scoring per Sprout

**Success criteria:**
- Users can review and edit individual Sprouts
- Connections suggested are relevant
- Sprouts maintain citation provenance

### Phase 4: Full Harvest (v2.0)

**Timeline:** 4-6 weeks  
**Goal:** Research as intelligent knowledge growth

**Deliverables:**
- Research agent aware of existing Grove
- Gap identification (what user doesn't know)
- Multi-document research campaigns
- Sprout conflict detection (contradicts existing knowledge)
- Research patterns and recommendations

**Success criteria:**
- Research builds on existing knowledge
- Users report feeling their Grove "gets smarter"
- Research suggests follow-up investigations

---

## Success Metrics

### Engagement Metrics

| Metric | MVP Target | v2.0 Target |
|--------|------------|-------------|
| Research queries/user/week | 2+ | 5+ |
| Documents added to RAG | 60% of completed | 80% of completed |
| Research completion rate | 90% | 95% |
| Average research time | <90s | <60s |

### Quality Metrics

| Metric | MVP Target | v2.0 Target |
|--------|------------|-------------|
| Citation accuracy (URLs work) | 95% | 99% |
| User satisfaction (thumbs up) | 70% | 85% |
| Research referenced in later conversations | Track only | 40% of added |

### Growth Metrics

| Metric | MVP Target | v2.0 Target |
|--------|------------|-------------|
| Sprouts from research | N/A (doc only) | 30% of total Sprouts |
| Grove size growth from research | Track only | 2x baseline growth |

---

## Risks & Mitigations

### Risk 1: Research Quality Inconsistent

**Likelihood:** High  
**Impact:** High (core value proposition)

**Mitigations:**
- Strong system prompt with quality criteria
- Citation validation before return
- User feedback loop (thumbs up/down)
- Quality scoring for source domains

### Risk 2: Cost Overruns

**Likelihood:** Medium  
**Impact:** Medium (unsustainable economics)

**Mitigations:**
- Token tracking from day one
- Search count limits (max 8)
- Timeout limits (3 min)
- v1.1: User-facing quotas if needed

### Risk 3: Slow Performance

**Likelihood:** Medium  
**Impact:** Medium (poor UX)

**Mitigations:**
- Progress indication (user knows it's working)
- Timeout with partial results
- Future: Background processing option

### Risk 4: Low Adoption

**Likelihood:** Low-Medium  
**Impact:** High (wasted investment)

**Mitigations:**
- Clear value prop in UX
- Prominent but not intrusive entry point
- Success stories and templates
- Future: Suggested research based on conversation

---

## Open Questions

### Product Questions

1. **Should research be a premium feature?**
   - Costs ~$0.10-0.50 per research in API calls
   - Could gate behind Pro tier or credit system

2. **What's the document retention policy?**
   - Keep all research forever?
   - Archive after N days if not added to RAG?

3. **Should research be shareable?**
   - Export as PDF/Markdown?
   - Share link to document?
   - Collaborative Grove implications?

### Technical Questions

1. **Which vector store for RAG?**
   - Pinecone, Weaviate, pgvector, local?
   - Depends on broader Grove RAG architecture

2. **How to handle research that contradicts existing Sprouts?**
   - Surface conflict to user?
   - Automatic confidence adjustment?

3. **Background processing for v1.1+?**
   - Job queue architecture (Redis, SQS)?
   - Notification system?

---

## Appendix A: Research Prompt Iterations

### Prompt v0.1 (Starting Point)

[Include the system prompt from Technical Architecture section]

### Prompt Tuning Process

1. Run 10 sample queries across domains
2. Evaluate: citation accuracy, position clarity, analysis depth
3. Adjust prompt based on failure modes
4. Repeat until quality bar met

### Sample Queries for Testing

- "What are the pricing models for distributed inference networks?"
- "How does the EU AI Act classify edge computing applications?"
- "What is the current state of homomorphic encryption for ML inference?"
- "Compare WebGPU vs WebNN for in-browser ML"
- "What are the governance models for open source AI projects?"

---

## Appendix B: Competitive Research

### Perplexity Pro

**Strengths:**
- Excellent source quality
- Fast results
- Good citation formatting

**Weaknesses:**
- No persistent knowledge base
- No connection to prior queries
- Results don't compound

### ChatGPT with Browsing

**Strengths:**
- Conversational follow-up
- Good synthesis

**Weaknesses:**
- Citation quality variable
- No structured output
- No RAG integration

### Elicit

**Strengths:**
- Academic source focus
- Structured extraction
- Concept mapping

**Weaknesses:**
- Narrow to academic use case
- No general web search
- Separate from conversation

### Grove Research Positioning

"Research that grows your knowledge, not just answers your question."

Unique value:
- Research compounds (enters RAG)
- Structured output (position + analysis + citations)
- Future: Integrates with existing knowledge
- Future: Suggests follow-up research

---

## Appendix C: Future Vision Sketches

### Collaborative Research

Multiple users researching same topic, Sprouts merge with attribution:

```
🌱 "Distributed inference pricing converges on three models..."
   Sources: Jim's research, Sarah's research
   Confidence: 0.95 (corroborated)
```

### Research Campaigns

Multi-query research with synthesis:

```
User: /research-campaign "Competitive landscape for distributed AI"

Grove: I'll investigate this as a 5-part research campaign:
       1. Major players and positioning
       2. Technical architectures compared
       3. Pricing and business models
       4. Regulatory considerations
       5. Market predictions
       
       Estimated time: 15-20 minutes
       
       [Start Campaign] [Customize Topics]
```

### Knowledge Gap Detection

Grove identifies what user doesn't know:

```
Grove: Based on your Grove, you have strong coverage of 
       technical architecture but limited knowledge of:
       - Regulatory landscape (2 Sprouts)
       - Competitive pricing (0 Sprouts)
       
       [Research Gaps] [Ignore]
```

---

*Document version 1.0. For review and iteration.*
