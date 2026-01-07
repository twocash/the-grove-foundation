# ARCHITECTURE.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Created**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)

---

## Current Architecture (Problem)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENRICHMENT PATHS                             │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │    PIPELINE PATH     │
                    │  polishExtracted     │
                    │     Concepts()       │
                    └──────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Context: Hardcoded minimal    │
              │ "a platform for exploring     │
              │  ideas about distributed AI"  │
              │                               │
              │ ❌ No vocabulary              │
              │ ❌ No framing                 │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Generic prompts  │
                    └──────────────────┘


                    ┌──────────────────────┐
                    │   AD HOC PATH        │
                    │  enrichPromptTitles  │
                    │  enrichPromptTarget  │
                    └──────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Context: Dynamic lookup       │
              │ knowledge.getDocument(        │
              │   'grove-overview')           │
              │                               │
              │ ⚠️ May fail silently          │
              │ ⚠️ Truncated to 1500 chars    │
              │ ⚠️ Different content          │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Inconsistent     │
                    │ prompts          │
                    └──────────────────┘

                              ↓
              ┌───────────────────────────────┐
              │         CORPUS DRIFT          │
              │  Different vocabulary from    │
              │  different enrichment paths   │
              └───────────────────────────────┘
```

---

## New Architecture (Reference Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                 GROVE_WORLDVIEW_CONTEXT                         │
│                                                                 │
│   Single constant defined once in server.js                     │
│   ~500 words, 8 vocabulary terms                                │
│   6 framing principles, 6 anti-patterns                         │
│                                                                 │
│   ✅ One source of truth                                        │
│   ✅ Version controlled                                         │
│   ✅ No runtime dependencies                                    │
│   ✅ Always available                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   PIPELINE    │   │   AD HOC      │   │   AD HOC      │
│   polish      │   │   enrichPrompt│   │   enrichPrompt│
│   Extracted   │   │   Titles()    │   │   Targeting() │
│   Concepts()  │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CONSISTENT GROVE-GROUNDED PROMPTS             │
│                                                                 │
│   • Same 8-term vocabulary                                      │
│   • Same framing principles                                     │
│   • Same anti-patterns                                          │
│   • Coherent corpus regardless of enrichment path               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Pipeline Extraction

```
Document Upload
      │
      ▼
buildClaudeExtractionPrompt()
      │ Extracts raw concepts
      ▼
polishExtractedConcepts()
      │
      ├─────────────────────────────────────┐
      │                                     │
      ▼                                     ▼
┌─────────────────┐              ┌─────────────────────┐
│ Source Doc      │              │ GROVE_WORLDVIEW_    │
│ Content         │              │ CONTEXT constant    │
└─────────────────┘              └─────────────────────┘
      │                                     │
      └──────────────┬──────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ LLM generates   │
            │ Grove-grounded  │
            │ prompts         │
            └─────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Prompts saved   │
            │ to corpus       │
            └─────────────────┘
```

---

## Data Flow: Ad Hoc Enrichment

```
Copilot Action
(/make-compelling or /suggest-targeting)
      │
      ▼
POST /api/prompts/enrich
      │
      ▼
┌─────────────────────────────────────────┐
│ Router determines operation             │
│                                         │
│ 'titles' → enrichPromptTitles()         │
│ 'targeting' → enrichPromptTargeting()   │
└─────────────────────────────────────────┘
      │
      ├─────────────────────────────────────┐
      │                                     │
      ▼                                     ▼
┌─────────────────┐              ┌─────────────────────┐
│ Prompt data     │              │ GROVE_WORLDVIEW_    │
│ from request    │              │ CONTEXT constant    │
└─────────────────┘              └─────────────────────┘
      │                                     │
      └──────────────┬──────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ LLM generates   │
            │ Grove-grounded  │
            │ suggestions     │
            └─────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ UI presents     │
            │ clickable       │
            │ options         │
            └─────────────────┘
```

---

## Vocabulary Map

| Grove Term | Definition | Map To When Concept Involves |
|------------|------------|------------------------------|
| Computational Sovereignty | AI on hardware you control | Infrastructure, ownership, independence |
| The Ratchet Thesis | Capability propagation frontier→edge | AI progress, timelines, capability curves |
| Efficiency-Enlightenment Loop | Agents motivated by cognition access | Economics, motivation, agent behavior |
| Knowledge Commons | Network-wide innovation sharing | Collaboration, attribution, network effects |
| Hybrid Cognition | Local + cloud seamless bridging | Architecture, scaling, resource allocation |
| Gardener/Observer Dynamic | Relationship of care, not extraction | User experience, parasocial design |
| Epistemic Independence | Knowledge production without dependency | Institutions, governance, academic freedom |
| Technical Frontier | Research informing Grove architecture | Academic papers, R&D, new developments |

---

## Design Principles

### 1. Single Source of Truth
One constant, used everywhere. No divergent context sources.

### 2. No Runtime Dependencies
Context is a constant, not a database lookup. Always available, never fails.

### 3. Version Controlled
Context lives in code, reviewed in PRs, tracked in git history.

### 4. Shift Left Quality
Fix at generation time, not QA time. Prompts are correct by construction.

### 5. Reference Implementation
This is the Trellis 1.0 standard for Grove context injection.
