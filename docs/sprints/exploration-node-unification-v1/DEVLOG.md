# Development Log: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Started:** 2025-01-05  
**Status:** PLANNING COMPLETE - Ready for Execution

---

## Sprint Summary

Unify Questions and Prompts into a single PromptObject with provenance tracking. Create extraction pipeline, activate hybrid search, and update Prompt Workshop UI to display "Exploration Nodes" with provenance badges.

### Key Deliverables

1. **PromptProvenance type** - Track where each prompt came from
2. **Extraction endpoint** - Transform documents into PromptObjects
3. **Hybrid search activation** - Wire existing SQL function
4. **Provenance-aware scoring** - Boost based on source relevance
5. **UI updates** - Header label, badges, filter

---

## Progress Log

### 2025-01-05: Sprint Planning

- [x] REPO_AUDIT.md - Current state analysis
- [x] SPEC.md - Requirements and data model
- [x] ARCHITECTURE.md - System design
- [x] DECISIONS.md - 10 ADRs documented
- [x] MIGRATION.md - File changes mapped
- [x] STORIES.md - 17 stories, 33 points
- [x] EXECUTION_PROMPT.md - Handoff ready

**Strategic decision confirmed:** Questions ARE Prompts with different provenance. Unified model.

---

## Epic Progress

### Epic 1: Type Foundation (6 points)
| Story | Status | Notes |
|-------|--------|-------|
| 1.1 Add PromptProvenance type | ⬜ | |
| 1.2 Extend PromptObject | ⬜ | |
| 1.3 Backfill authored prompts | ⬜ | 66 prompts |

### Epic 2: Extraction Pipeline (10 points)
| Story | Status | Notes |
|-------|--------|-------|
| 2.1 Create module structure | ⬜ | |
| 2.2 Implement transform | ⬜ | |
| 2.3 Add server endpoint | ⬜ | |
| 2.4 Client function | ⬜ | |

### Epic 3: Hybrid Search (5 points)
| Story | Status | Notes |
|-------|--------|-------|
| 3.1 Verify SQL deployed | ⬜ | |
| 3.2 Update search.js | ⬜ | |
| 3.3 Return doc IDs | ⬜ | |

### Epic 4: Provenance Scoring (5 points)
| Story | Status | Notes |
|-------|--------|-------|
| 4.1 Add modifier function | ⬜ | |
| 4.2 Integrate scoring | ⬜ | |
| 4.3 Update hook | ⬜ | |

### Epic 5: UI Updates (7 points)
| Story | Status | Notes |
|-------|--------|-------|
| 5.1 Header label | ⬜ | "Exploration Nodes" |
| 5.2 ProvenanceBadge | ⬜ | |
| 5.3 Add to PromptCard | ⬜ | |
| 5.4 Provenance filter | ⬜ | |

---

## Issues & Blockers

None yet.

---

## Decisions Made During Execution

*(Record any runtime decisions here)*

---

## Testing Notes

*(Record test results here)*

---

## Final Verification

- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Extraction endpoint works
- [ ] Hybrid search returns enrichment scores
- [ ] "Exploration Nodes" header visible
- [ ] Badges display correctly
- [ ] Filter works

---

*Log updated: 2025-01-05*
