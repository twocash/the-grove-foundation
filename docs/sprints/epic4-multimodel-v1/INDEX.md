# EPIC4-SL-MultiModel Sprint Navigation

**Sprint:** S8-SL-MultiModel [EPIC Phase 4]
**EPIC:** Knowledge as Observable System
**Status:** 🟡 In Progress (Planning Phase)

---

## Sprint Artifacts

### Planning Phase
- ✅ **[SPEC.md](./SPEC.md)** - Sprint specification with Live Status & Attention Anchor
- ✅ **[DEVLOG.md](./DEVLOG.md)** - Execution tracking and progress
- 📋 **[REPO_AUDIT.md](./REPO_AUDIT.md)** - Repository analysis (in progress)
- 📋 **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Target state design (planned)
- 📋 **[MIGRATION_MAP.md](./MIGRATION_MAP.md)** - Change plan (planned)
- 📋 **[DECISIONS.md](./DECISIONS.md)** - ADR documentation (planned)
- 📋 **[SPRINTS.md](./SPRINTS.md)** - Epic breakdown (planned)
- 📋 **[EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)** - Developer handoff (planned)
- 📋 **[CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md)** - Session handoff (planned)

---

## Quick Links

### Current Phase
- **Phase:** 0: Pattern Check (Complete)
- **Next:** Phase 1: Repository Audit
- **Status:** 🟡 In Progress

### Attention Anchor
**Re-read before decisions:**
- We are building multi-model lifecycle support with A/B testing
- Success: Operators can create and test different lifecycle models
- We are NOT building federation or attribution economy
- Current phase: Planning (Phases 0-6 complete)

---

## Context

### Sprint Goal
Support multiple lifecycle models (botanical, academic, research, creative) with operator tools for A/B testing and analytics.

### Vision
"Each grove defines its own lifecycle model. Epistemological pluralism - no central authority."

**Examples:**
- Botanical: seed → sprout → sapling → tree → grove
- Academic: hypothesis → tested → published → canonical
- Research: observation → theory → law
- Creative: sketch → refined → masterwork

### Dependencies
- ✅ **S7-SL-AutoAdvancement** - Complete
- 🎯 **S7.5-SL-JobConfigSystem** - In Progress (not blocking)
- 📋 **EPIC4-SL-MultiModel** - This sprint (planning complete)

---

## Key Deliverables

1. **Multi-model config support** - GroveObject pattern extension
2. **ExperienceConsole lifecycle editor** - ModelCard & ModelEditor
3. **A/B testing framework** - FeatureFlag extension
4. **Analytics dashboard** - ModelAnalyticsCatalog (json-render)
5. **Model library** - 4 standard templates + custom builder

---

## EPIC Progress

```
EPIC: Knowledge as Observable System
├── ✅ Phase 0: Tier Progression (S4)
├── ✅ Phase 1: Lifecycle Engine (S5)
├── ✅ Phase 2: Observable Signals (S6)
├── ✅ Phase 3: AutoAdvancement (S7)
├── 🎯 Phase 3.5: JobConfig (S7.5)
├── 📋 Phase 4: MultiModel (S8) ← HERE
├── 💡 Phase 5: Federation (S9)
├── 💡 Phase 6: AI Curation (S10)
└── 💡 Phase 7: Attribution (S11)
```

---

## Naming Convention

**This sprint uses the NEW convention:**
- **Primary ID:** EPIC4-SL-MultiModel
- **Legacy Label:** S8-SL-MultiModel [EPIC Phase 4]
- **See:** `docs/SPRINT_NAMING_CONVENTION.md`

---

## Documentation

- **Sprint Naming:** `docs/SPRINT_NAMING_CONVENTION.md`
- **EPIC Overview:** Notion - "EPIC: Knowledge as Observable System"
- **Previous Sprint:** `docs/sprints/auto-advancement-v1/` (S7)
- **Parallel Sprint:** `docs/sprints/job-config-system-v1/` (S7.5)

---

## Next Steps

1. Complete planning artifacts (REPO_AUDIT, ARCHITECTURE, etc.)
2. Finalize EXECUTION_PROMPT
3. Hand off to developer
4. Begin implementation following epics
5. Track progress in DEVLOG.md

---

**Started:** 2026-01-16
**Estimated Duration:** 2 sprints
**Domain:** core
**DEX Compliant:** ✅
