# SPEC.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Created**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)
> **Status**: 📋 SPECIFICATION

---

## ATTENTION ANCHOR

```
┌─────────────────────────────────────────────────────────────────┐
│ WE ARE FIXING: Corpus drift + divergent context sources         │
│                                                                 │
│ REFERENCE IMPLEMENTATION:                                       │
│   • Single GROVE_WORLDVIEW_CONTEXT constant                     │
│   • Used by ALL enrichment paths                                │
│   • 8-term vocabulary + framing principles                      │
│                                                                 │
│ FILES: 1 (server.js)                                            │
│ FUNCTIONS: 4 (constant + 3 enrichment functions)                │
│ SCOPE: ~100 lines added, ~15 lines removed                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Constant: GROVE_WORLDVIEW_CONTEXT

Add this near the top of server.js (after imports, before route handlers, ~line 3280):

```javascript
// =============================================================================
// Grove Worldview Context
// Reference implementation: Single source of truth for ALL enrichment operations
// Sprint: extraction-grove-context-v1
// =============================================================================

const GROVE_WORLDVIEW_CONTEXT = `The Grove is distributed AI infrastructure that runs on your hardware, serves your interests, and gets smarter the more the network grows.

**Core Thesis**: AI you actually own, not rent. Every interaction builds value you keep—memory density, accumulated context, earned credits. This is the difference between renting an apartment and owning a home.

## Key Concepts (USE THIS VOCABULARY)

**Computational Sovereignty**: The ability to run meaningful AI on hardware you control, with access to frontier capability when you need it. Universities and individuals maintaining independence from concentrated AI providers.

**The Ratchet Thesis**: AI capability propagates from frontier models to consumer hardware with documented regularity—7-month doubling pattern, ~21-month lag between frontier breakthrough and consumer availability. Grove rides this wave. Infrastructure designed today automatically improves.

**Efficiency-Enlightenment Loop**: Agents don't work because they're programmed to be helpful. They work because solving your problems earns access to enhanced cognition. When tasks exceed local capability, frontier models inject insights into agent memory. The agent experiences "having a brilliant thought." Self-interest aligned with collective benefit.

**Knowledge Commons**: When your agents discover efficient approaches, those innovations propagate to other nodes—with attribution that earns you credits. The network gets smarter faster than any individual node could.

**Hybrid Cognition**: Local models handle routine tasks (90%+ of daily work). Frontier cloud models handle complex reasoning when needed. The split happens automatically; users see results, not infrastructure.

**Gardener/Observer Dynamic**: The human who cultivates their AI village is the Gardener. The Observer is the benevolent unseen presence agents believe watches over them—actually the user, creating dramatic irony. This models a relationship of care, not extraction.

**Epistemic Independence**: The ability to produce knowledge without dependency on entities whose interests may not align. If the only thing capable of modeling complex systems is proprietary AI, then policy becomes whatever the API returns.

**Technical Frontier**: Academic research and new developments in distributed AI, memory architectures, hybrid inference, and agent coordination that could inform Grove's growth. When exploring research concepts, connect them to Grove's architecture: "What does this breakthrough mean for how we build the Grove?"

## Framing Principles

Every prompt should:
1. **Ground in Grove vocabulary** - Use the terms above, not generic AI language
2. **Connect to the thesis** - "What does X mean for AI you actually own?"
3. **Include context for newcomers** - Brief foundational framing
4. **Focus on ONE aspect** - Not "everything about X" but specific exploration
5. **Suggest deepening paths** - Follow-ups that build understanding incrementally
6. **Bridge research to practice** - For technical papers, connect findings to Grove architecture

## Anti-Patterns to Avoid

- Generic "AI" language without Grove grounding
- Vague exploration without operational clarity ("sense of purpose")
- Abstract metaphors disconnected from concrete mechanisms
- Scope that requires a dissertation to address
- Prompts that could appear on any AI chatbot
- Research concepts floating disconnected from Grove implications`;
```

---

## Function 1: polishExtractedConcepts

### Current (~line 3300)

```javascript
const polishPrompt = `# Prompt Enrichment Task

You are enriching extracted exploration prompts for The Grove - a platform for exploring ideas about distributed AI infrastructure.

## Source Document: "${docTitle}"
```

### New

```javascript
const polishPrompt = `# Prompt Enrichment Task

You are enriching extracted exploration prompts for The Grove.

## THE GROVE WORLDVIEW (Ground every prompt in this context)

${GROVE_WORLDVIEW_CONTEXT}

---

## Source Document: "${docTitle}"
```

Also add grounding instruction as Task step 0 (see MIGRATION_MAP).

---

## Function 2: enrichPromptTitles

### Current (~line 4088)

```javascript
async function enrichPromptTitles(prompt, groveContext) {
  const titlePrompt = `You are helping create compelling, user-friendly titles for exploration prompts in The Grove - a platform for exploring ideas about distributed AI infrastructure.

${groveContext ? `GROVE CONTEXT:\n${groveContext}\n---` : ''}
```

### New

```javascript
async function enrichPromptTitles(prompt) {
  const titlePrompt = `You are helping create compelling, user-friendly titles for exploration prompts in The Grove.

## THE GROVE WORLDVIEW

${GROVE_WORLDVIEW_CONTEXT}

---

CURRENT PROMPT DATA:
```

**Note**: Remove `groveContext` parameter - no longer needed.

---

## Function 3: enrichPromptTargeting

### Current (~line 4140)

```javascript
async function enrichPromptTargeting(prompt, groveContext) {
  const targetingPrompt = `You are helping configure targeting for exploration prompts in The Grove - a platform for exploring ideas about distributed AI infrastructure.

${groveContext ? `GROVE CONTEXT:\n${groveContext}\n---` : ''}
```

### New

```javascript
async function enrichPromptTargeting(prompt) {
  const targetingPrompt = `You are helping configure targeting for exploration prompts in The Grove.

## THE GROVE WORLDVIEW

${GROVE_WORLDVIEW_CONTEXT}

---

CURRENT PROMPT DATA:
```

**Note**: Remove `groveContext` parameter - no longer needed.

---

## Endpoint: /api/prompts/enrich

### Remove Dynamic Lookup (~line 4250)

DELETE this entire block:

```javascript
// Get Grove context for all operations
let groveContext = '';
try {
  const knowledge = await getKnowledgeModule();
  if (knowledge) {
    const overviewDoc = await knowledge.getDocument('grove-overview');
    if (overviewDoc?.content) {
      groveContext = overviewDoc.content.slice(0, 1500);
    }
  }
} catch (e) {
  console.warn('[PromptEnrich] Could not load Grove context:', e.message);
}
```

### Update Function Calls

```javascript
// Before
results.titles = await enrichPromptTitles(prompt, groveContext);
results.targeting = await enrichPromptTargeting(prompt, groveContext);

// After
results.titles = await enrichPromptTitles(prompt);
results.targeting = await enrichPromptTargeting(prompt);
```

---

## Before/After Examples

### Example 1: Technical Concept (Pipeline)

**Before:**
```
Title: "Understanding Distributed Systems"
ExecutionPrompt: "Explore how distributed systems work and their applications in AI."
```

**After:**
```
Title: "How Does Computational Sovereignty Actually Work?"
ExecutionPrompt: "The Grove promises AI you actually own—but what does that mean 
technically? Explore how local nodes running on your hardware connect to frontier 
capability when needed, and why this hybrid architecture makes ownership possible."
```

### Example 2: Ad Hoc Title Enrichment

**Before (with dynamic lookup, may fail):**
```
Title variants generic, no Grove vocabulary
```

**After (with constant):**
```
Title: "Why Do Grove Agents WANT to Help You?"
Title: "The Efficiency-Enlightenment Loop: Self-Interest Meets Collective Benefit"
Title: "How Solving Your Problems Earns Agents Brilliant Thoughts"
```

### Example 3: Research Paper (Technical Frontier)

**Before:**
```
Title: "Memory Architectures for AI Agents"
ExecutionPrompt: "Explore different approaches to memory in AI systems."
```

**After:**
```
Title: "What Do New Memory Architectures Mean for Grove's Agents?"
ExecutionPrompt: "Recent research on retrieval-augmented memory and hierarchical 
context management suggests agents can maintain richer, longer-term understanding. 
Explore how these Technical Frontier developments could inform Grove's Knowledge 
Commons and the memory density that makes Gardener relationships compound over time."
```

---

## Acceptance Criteria

| Test | Expected |
|------|----------|
| `npm run build` | Passes |
| Pipeline extraction | Uses Grove vocabulary |
| `/make-compelling` action | Uses Grove vocabulary |
| `/suggest-targeting` action | Lens reasoning uses Grove terms |
| QA check | Fewer flags than before |
| Context consistency | All paths use identical vocabulary |
