# MIGRATION_MAP.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Created**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)

---

## Change Summary

| File | Change Type | Lines |
|------|-------------|-------|
| `server.js` | Add constant | +60 |
| `server.js` | Update `polishExtractedConcepts` | +15 |
| `server.js` | Update `enrichPromptTitles` | +5, -3 |
| `server.js` | Update `enrichPromptTargeting` | +5, -3 |
| `server.js` | Remove dynamic lookup | -12 |
| **Total** | | ~+70 net |

---

## Change 1: Add GROVE_WORLDVIEW_CONTEXT Constant

### Location
Insert at ~line 3280, after imports/config but before extraction functions.

### Code to Add

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

## Change 2: Update polishExtractedConcepts

### Location: ~line 3300

### Before

```javascript
const polishPrompt = `# Prompt Enrichment Task

You are enriching extracted exploration prompts for The Grove - a platform for exploring ideas about distributed AI infrastructure.

## Source Document: "${docTitle}"

${docContent}
```

### After

```javascript
const polishPrompt = `# Prompt Enrichment Task

You are enriching extracted exploration prompts for The Grove.

## THE GROVE WORLDVIEW (Ground every prompt in this context)

${GROVE_WORLDVIEW_CONTEXT}

---

## Source Document: "${docTitle}"

${docContent}
```

### Also Add: Task Step 0

Find the "Your Task" section (~line 3360). Insert before "### 1. Compelling Title":

```javascript
### 0. Ground in Grove Context (CRITICAL - DO THIS FIRST)

Before enriching, ask: "How does this concept connect to Grove's thesis?"

Map the concept to Grove vocabulary:
- Technical infrastructure → Computational sovereignty, hybrid cognition
- Economic models → Efficiency-enlightenment loop, credit systems
- Governance questions → Knowledge Commons, epistemic independence
- User experience → Gardener/Observer relationship, memory density
- Capability questions → The Ratchet thesis, frontier-to-edge propagation
- Research findings → Technical Frontier, architecture implications

If the source is academic research, frame the exploration as:
"This research suggests X. What does this mean for Grove's architecture?"

If the concept doesn't naturally connect to Grove, find the bridge.
Every idea explored in the Grove should deepen understanding of why
distributed, owned AI matters.

```

---

## Change 3: Update enrichPromptTitles

### Location: ~line 4088

### Before

```javascript
async function enrichPromptTitles(prompt, groveContext) {
  const titlePrompt = `You are helping create compelling, user-friendly titles for exploration prompts in The Grove - a platform for exploring ideas about distributed AI infrastructure.

${groveContext ? `GROVE CONTEXT:\n${groveContext}\n---` : ''}

CURRENT PROMPT DATA:
```

### After

```javascript
async function enrichPromptTitles(prompt) {
  const titlePrompt = `You are helping create compelling, user-friendly titles for exploration prompts in The Grove.

## THE GROVE WORLDVIEW

${GROVE_WORLDVIEW_CONTEXT}

---

CURRENT PROMPT DATA:
```

**Changes:**
1. Remove `groveContext` parameter
2. Replace dynamic context injection with constant
3. Add "THE GROVE WORLDVIEW" header

---

## Change 4: Update enrichPromptTargeting

### Location: ~line 4140

### Before

```javascript
async function enrichPromptTargeting(prompt, groveContext) {
  const targetingPrompt = `You are helping configure targeting for exploration prompts in The Grove - a platform for exploring ideas about distributed AI infrastructure.

${groveContext ? `GROVE CONTEXT:\n${groveContext}\n---` : ''}

CURRENT PROMPT DATA:
```

### After

```javascript
async function enrichPromptTargeting(prompt) {
  const targetingPrompt = `You are helping configure targeting for exploration prompts in The Grove.

## THE GROVE WORLDVIEW

${GROVE_WORLDVIEW_CONTEXT}

---

CURRENT PROMPT DATA:
```

**Changes:**
1. Remove `groveContext` parameter
2. Replace dynamic context injection with constant
3. Add "THE GROVE WORLDVIEW" header

---

## Change 5: Remove Dynamic Lookup in /api/prompts/enrich

### Location: ~line 4250

### Delete This Block

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

## Verification Steps

1. **Build**: `npm run build` - no syntax errors
2. **Pipeline**: Extract from document, check vocabulary
3. **Ad hoc titles**: `/make-compelling`, check vocabulary
4. **Ad hoc targeting**: `/suggest-targeting`, check vocabulary
5. **QA**: Compare flag rates before/after

---

## Rollback Plan

If issues arise:
1. Revert all changes to server.js
2. Constant is additive - removing it breaks nothing else
3. Re-add `groveContext` parameter if needed for backward compatibility
