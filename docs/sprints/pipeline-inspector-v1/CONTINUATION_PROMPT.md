# Continuation Prompt: pipeline-inspector-v1

**Sprint:** pipeline-inspector-v1
**Last Updated:** 2025-01-03
**Status:** Planning Complete, Ready for Execution

---

## Quick Resume Instructions

If you're a fresh Claude instance resuming this work:

```
1. Read this file completely
2. Read EXECUTION_PROMPT.md for detailed implementation steps
3. Check DEVLOG.md for what's already done
4. Continue from the last incomplete epic
```

---

## Project Location

```
C:\GitHub\the-grove-foundation
```

---

## What This Sprint Does

Extends the PipelineMonitor console with:
1. **Inspector Panel** - View and edit document metadata
2. **Copilot Commands** - AI-powered enrichment (keywords, summary, entities)
3. **Knowledge Commons Alignment** - Fix tier terminology, add quality signals

---

## Current Status

### Completed
- [x] Sprint planning artifacts created
- [x] ADR-001 accepted (tier unification)
- [x] DEVELOPMENT_CONTRACT established
- [x] All planning documents written

### Pending
- [ ] Epic 1: Schema & Types Foundation
- [ ] Epic 2: Tier Terminology Fix
- [ ] Epic 3: New Primitives (TagArray, GroupedChips, UtilityBar)
- [ ] Epic 4: Inspector Integration
- [ ] Epic 5: Copilot Integration
- [ ] Epic 6: API Endpoints
- [ ] Epic 7: Tests & Verification

---

## Critical Constraint

**TIER TERMINOLOGY IS BINDING:**
```typescript
// ONLY these values allowed
const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'] as const;

// PROHIBITED: seedling, oak, published, archived, draft
```

**Verification command:**
```bash
grep -rn "seedling\|\"oak\"\|'oak'" src/
# Must return empty
```

---

## Files to Read First

1. `EXECUTION_PROMPT.md` - Step-by-step implementation guide
2. `DEVELOPMENT_CONTRACT.md` - Binding constraints
3. `DEVLOG.md` - What's already done
4. `SPRINTS.md` - Epic/story breakdown with acceptance criteria
5. `ARCHITECTURE.md` - Target state and type definitions

---

## Key Decisions Already Made

| Decision | Resolution |
|----------|------------|
| Tier names | seed/sprout/sapling/tree/grove (canonical) |
| Quality model | Through use, not gatekeeping |
| AI previews | Required before applying extractions |
| Utility formula | ln(count+1) × diversity_factor |
| Entity categories | people, organizations, concepts, technologies |
| Temporal classes | evergreen, current, dated, historical |

---

## Next Actions

If resuming from fresh context:

1. **Verify current state:**
   ```bash
   cd C:\GitHub\the-grove-foundation
   git status
   npm run build
   ```

2. **Check DEVLOG.md** for last completed work

3. **Start/continue** from the first incomplete epic

4. **Log progress** in DEVLOG.md as you work

---

## Build Gates

Run these after each epic:

```bash
# TypeScript clean
npx tsc --noEmit

# Build succeeds
npm run build

# Tests pass
npm test

# No tier violations
grep -rn "seedling\|\"oak\"\|'oak'" src/
```

---

## Emergency Contacts

If blocked on architecture questions, refer to:
- `DEVELOPMENT_CONTRACT.md` - Binding rules
- `ADR-001-knowledge-commons-unification.md` - Tier philosophy
- `PROJECT_PATTERNS.md` - Pattern catalog

---

## Session Handoff Notes

*Add any context the next session needs to know:*

- Sprint planning is complete as of 2025-01-03
- No implementation work started yet
- Begin with Epic 1, Story 1.1 (database migration)
- Estimated ~20 hours remaining
