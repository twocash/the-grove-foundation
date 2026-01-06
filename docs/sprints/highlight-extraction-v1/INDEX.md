# highlight-extraction-v1 — Sprint Index

**Sprint:** highlight-extraction-v1  
**Status:** 🟡 Ready for Execution  
**Created:** 2026-01-05

---

## Quick Links

| Artifact | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current extraction pipeline analysis |
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria, DEX compliance |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data structures, file organization |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes with code samples |
| [DECISIONS.md](./DECISIONS.md) | 10 ADRs including testing strategy |
| [STORIES.md](./STORIES.md) | 5 epics, 30 story points |
| **[EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md)** | **Claude CLI handoff** |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking |

---

## Sprint Summary

**Objective:** Extend extraction pipeline to auto-generate backing prompts for kinetic highlights

**Scope:**
- Concept detection with confidence scoring
- Emily Short template prompt generation
- Trigger merge/deduplication logic
- Workshop UI for surface filtering
- Recursive validation (extract from insight doc)

**Duration:** 3-4 days (30 story points)

**Success Criteria:**
- Process Grove doc → generates 5+ highlight prompts
- Each prompt has valid highlightTriggers
- Prompts appear in Workshop with "extracted" badge
- Approving makes prompt available for lookup
- Confidence threshold is configurable (DEX)

---

## Dependency Chain

```
exploration-node-unification-v1 ✅
    ↓
kinetic-highlights-v1 ✅
    ↓
highlight-extraction-v1 (this sprint)
```

---

## How to Execute

1. Open Claude CLI
2. Navigate to repository: `cd C:\GitHub\the-grove-foundation`
3. Run: `cat docs/sprints/highlight-extraction-v1/EXECUTION_PROMPT.md`
4. Follow the phased execution plan

---

## Open Issues

**highlights.prompts.json Coverage:**
- Current: 6 seed prompts
- Target: 20+ core concepts
- Status: Deferred to post-sprint
- Approach: Validate extraction quality first, then decide batch author vs extraction
