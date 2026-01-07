# REQUIREMENTS.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Created**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)
> **Type**: Prompt Engineering + Architecture Unification

---

## Problem Statement

Extracted prompts drift from Grove's worldview. QA consistently flags:

| Issue | Root Cause |
|-------|-----------|
| Source Mismatch | Generic "AI" language instead of Grove terminology |
| Ambiguous Intent | Vague exploration without operational clarity |
| Missing Context | No foundational framing for newcomers |
| Too Broad | Concepts float disconnected from Grove's thesis |

**Compounding Problem**: Two enrichment paths use **different context sources**:

| Path | Current Context |
|------|-----------------|
| Pipeline (`polishExtractedConcepts`) | Hardcoded minimal description |
| Ad hoc (`enrichPromptTitles`, `enrichPromptTargeting`) | Dynamic lookup: `knowledge.getDocument('grove-overview')` |

This creates corpus drift - prompts enriched via different paths may use inconsistent vocabulary.

---

## Solution

**Reference Implementation**: Extract Grove context to a **shared constant** (`GROVE_WORLDVIEW_CONTEXT`) used by ALL enrichment operations.

```
┌─────────────────────────────────────────────────────────────────┐
│                   GROVE_WORLDVIEW_CONTEXT                       │
│                   (~500 words, 8 terms)                         │
└─────────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    Pipeline           Ad hoc titles     Ad hoc targeting
    (polish)           (enrichPrompt     (enrichPrompt
                        Titles)           Targeting)
```

---

## User Stories

### US-1: Grounded Terminology
**As a** Gardener exploring prompts  
**I want** prompts to use Grove vocabulary consistently  
**So that** I learn the worldview through coherent language

**Acceptance Criteria:**
- All enrichment paths use identical Grove context
- Prompts use terms like "computational sovereignty," "the Ratchet," "Knowledge Commons"
- Generic "AI" replaced with Grove-specific framing

### US-2: Contextual Framing
**As a** newcomer  
**I want** prompts to include foundational context  
**So that** I can engage without prior Grove knowledge

**Acceptance Criteria:**
- Each prompt includes brief contextual framing
- Assumes no prior knowledge of Grove
- Connects new concepts to everyday understanding

### US-3: Focused Exploration
**As a** user exploring the corpus  
**I want** prompts focused on specific aspects  
**So that** I can build understanding incrementally

**Acceptance Criteria:**
- Each prompt explores ONE aspect of Grove's thesis
- Clear scope boundary (not "everything about X")
- Natural follow-ups suggested for deeper exploration

### US-4: Unified Context (NEW)
**As a** developer maintaining the system  
**I want** one source of truth for Grove context  
**So that** all enrichment paths stay synchronized

**Acceptance Criteria:**
- Single `GROVE_WORLDVIEW_CONTEXT` constant defined once
- Used by: `polishExtractedConcepts`, `enrichPromptTitles`, `enrichPromptTargeting`
- Dynamic knowledge lookup removed (replaced by constant)

---

## Scope

### In Scope
- Create `GROVE_WORLDVIEW_CONTEXT` constant in `server.js`
- Modify `polishExtractedConcepts` to use constant
- Modify `enrichPromptTitles` to use constant
- Modify `enrichPromptTargeting` to use constant
- Remove dynamic `grove-overview` lookup
- Test both enrichment paths

### Out of Scope
- Changing extraction logic
- New API endpoints
- UI changes
- QA rule modifications

---

## Success Metrics

| Metric | Target |
|--------|--------|
| QA "Source Mismatch" rate | Decrease by 50% |
| QA "Missing Context" rate | Decrease by 70% |
| QA "Too Broad" rate | Decrease by 40% |
| Grove vocabulary density | 2+ Grove terms per prompt |
| Context consistency | 100% (all paths use same constant) |

---

## Dependencies

- `what-is-the-grove.md` - Source for context content
- `polishExtractedConcepts()` in `server.js` - Pipeline enrichment
- `enrichPromptTitles()` in `server.js` - Ad hoc title enrichment
- `enrichPromptTargeting()` in `server.js` - Ad hoc targeting enrichment
