# REPO_AUDIT.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Audited**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)

---

## Current State: Divergent Context Sources

### Path 1: Pipeline Enrichment

**Function**: `polishExtractedConcepts()` (~line 3285)
**Context**: Hardcoded minimal description

```javascript
const polishPrompt = `# Prompt Enrichment Task

You are enriching extracted exploration prompts for The Grove - 
a platform for exploring ideas about distributed AI infrastructure.
```

**Problem**: No vocabulary, no framing principles, no thesis connection.

---

### Path 2: Ad Hoc Enrichment (Copilot Actions)

**Endpoint**: `/api/prompts/enrich` (~line 4220)
**Functions**: `enrichPromptTitles()`, `enrichPromptTargeting()` (~lines 4088, 4140)
**Context**: Dynamic lookup from knowledge module

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

**Problems**:
1. Different source than pipeline
2. Depends on knowledge module availability
3. Truncated to 1500 chars (may cut off important terms)
4. Fails silently if lookup fails

---

## Target State: Unified Context

### Single Source of Truth

```javascript
// =============================================================================
// Grove Worldview Context
// Used by ALL enrichment operations for consistent vocabulary
// =============================================================================

const GROVE_WORLDVIEW_CONTEXT = `
The Grove is distributed AI infrastructure that runs on your hardware, 
serves your interests, and gets smarter the more the network grows.

**Core Thesis**: AI you actually own, not rent...

[Full 8-term vocabulary]
[6 framing principles]
[6 anti-patterns]
`;
```

### Usage in All Three Functions

```javascript
// Pipeline
async function polishExtractedConcepts(concepts, sourceDocument) {
  const polishPrompt = `...
## THE GROVE WORLDVIEW
${GROVE_WORLDVIEW_CONTEXT}
...`;
}

// Ad hoc titles
async function enrichPromptTitles(prompt) {
  const titlePrompt = `...
${GROVE_WORLDVIEW_CONTEXT}
...`;
}

// Ad hoc targeting
async function enrichPromptTargeting(prompt) {
  const targetingPrompt = `...
${GROVE_WORLDVIEW_CONTEXT}
...`;
}
```

---

## Files to Modify

| File | Location | Change |
|------|----------|--------|
| `server.js` | ~line 3280 | Add `GROVE_WORLDVIEW_CONTEXT` constant |
| `server.js` | `polishExtractedConcepts` (~3285) | Use constant in prompt |
| `server.js` | `enrichPromptTitles` (~4088) | Use constant, remove `groveContext` param |
| `server.js` | `enrichPromptTargeting` (~4140) | Use constant, remove `groveContext` param |
| `server.js` | `/api/prompts/enrich` (~4250) | Remove dynamic lookup logic |

---

## Context Content (8 Terms)

From `what-is-the-grove.md`:

| Term | Definition | Use When |
|------|------------|----------|
| Computational Sovereignty | AI on hardware you control | Infrastructure, ownership |
| The Ratchet Thesis | Capability propagation frontier→edge | AI progress, timelines |
| Efficiency-Enlightenment Loop | Agents motivated by cognition access | Economics, motivation |
| Knowledge Commons | Network-wide innovation sharing | Collaboration, attribution |
| Hybrid Cognition | Local + cloud seamless bridging | Architecture, scaling |
| Gardener/Observer Dynamic | Relationship of care, not extraction | User experience |
| Epistemic Independence | Knowledge production without dependency | Institutions, governance |
| Technical Frontier | Research informing Grove architecture | Academic papers, R&D |

---

## Verification Plan

1. **Build**: `npm run build` passes
2. **Pipeline**: Extract prompts → check Grove vocabulary
3. **Ad hoc titles**: `/make-compelling` → check Grove vocabulary
4. **Ad hoc targeting**: `/suggest-targeting` → check lens reasoning uses Grove terms
5. **QA comparison**: Run QA on new vs old extractions
