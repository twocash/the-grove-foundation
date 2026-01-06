# highlight-extraction-v1 — Continuation Prompt

**Use this prompt in a fresh Claude context window to continue work.**

---

## Context

This sprint extends the Grove extraction pipeline to auto-generate backing prompts for kinetic highlights. The recursive insight: Grove documentation teaches the system to guide exploration of Grove concepts. Planning is complete; execution is ready.

## Project Location

```
C:\GitHub\the-grove-foundation
```

## What Was Accomplished

### Strategic Analysis
- Identified gap: extraction pipeline doesn't produce highlight-ready prompts
- Designed concept detection with confidence scoring
- Chose Emily Short template for generation quality
- Established recursive validation using insight document

### Documentation Created

All artifacts in `docs/sprints/highlight-extraction-v1/`:

| Artifact | Description |
|----------|-------------|
| `INDEX.md` | Sprint navigation and summary |
| `REPO_AUDIT.md` | Extraction pipeline analysis, gaps identified |
| `SPEC.md` | Goals, acceptance criteria, DEX compliance |
| `ARCHITECTURE.md` | System design, data structures, file organization |
| `MIGRATION_MAP.md` | File-by-file changes with full code samples |
| `DECISIONS.md` | 10 ADRs including testing strategy |
| `STORIES.md` | 5 epics, 30 story points |
| `EXECUTION_PROMPT.md` | Self-contained Claude CLI handoff |
| `DEVLOG.md` | Execution tracking (in progress) |

### Key Technical Decisions

1. **Confidence threshold 0.7, mutable** — In EXTRACTION_CONFIG, not hardcoded
2. **Favor-newer merge strategy** — When triggers overlap, keep recent prompt
3. **Emily Short template** — context → confusion → question pattern
4. **extractionMethod field** — Added to PromptProvenance for filtering
5. **Formal acceptance test** — Extract from `Exploration_Architecture_Validates_Itself.md`

## Sprint Status

| Epic | Name | Points | Status |
|------|------|--------|--------|
| 1 | Core Concept Registry | 5 | 📋 Ready |
| 2 | Concept Detection | 8 | 📋 Ready |
| 3 | Prompt Generation | 8 | 📋 Ready |
| 4 | Merge Logic & Types | 5 | 📋 Ready |
| 5 | Workshop UI | 4 | 📋 Ready |

**Total:** 30 points (~3-4 days)

## Dependencies

- [x] exploration-node-unification-v1 — Complete
- [x] kinetic-highlights-v1 — Complete (6 seed prompts working)

## Your Task

### If Sprint NOT YET EXECUTED:

1. **Read execution prompt:**
   ```bash
   cat docs/sprints/highlight-extraction-v1/EXECUTION_PROMPT.md
   ```

2. **Execute in phases:**
   - Phase 1: Core Concept Registry
   - Phase 2: Concept Detection
   - Phase 3: Prompt Generation
   - Phase 4: Merge Logic & Types
   - Phase 5: Workshop UI

3. **Update DEVLOG.md** after each epic

### If Sprint PARTIALLY EXECUTED:

1. **Check DEVLOG.md** for progress
2. **Continue from last completed epic**
3. **Run build gate before proceeding**

## Files to Read First

Before doing anything, read these to understand current state:

```
1. docs/sprints/highlight-extraction-v1/INDEX.md (sprint overview)
2. docs/sprints/highlight-extraction-v1/DEVLOG.md (execution status)
3. docs/sprints/highlight-extraction-v1/SPEC.md (goals, acceptance criteria)
```

## Critical Context

- **DEX Compliance** — All thresholds in config, not code
- **Recursive Validation** — Extract from `Exploration_Architecture_Validates_Itself.md` as acceptance test
- **Open Issue** — highlights.prompts.json needs 20+ prompts (deferred to post-sprint)
- **Provenance** — All extracted prompts get `reviewStatus: 'pending'`

## Attention Anchor

**We are building:** Auto-extraction of backing prompts for kinetic highlights

**Success looks like:** Process Grove doc → 5+ prompts with valid triggers → appear in Workshop → approval makes available for lookup

**We are NOT:** Building semantic matching, auto-approval, or real-time extraction

---

**Start by reading the INDEX.md to orient yourself, then check DEVLOG.md for execution status.**
