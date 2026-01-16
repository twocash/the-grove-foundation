# Next Sprint Handoff: 4D-Docs Terminology Update

**Prepared By:** Randy (Chief of Staff)  
**Date:** 2026-01-15  
**Current Sprint:** sprout-finishing-room-v1 ✅ COMPLETE  
**Next Sprint:** terminology-migration-4d (4D-Docs phase)  
**Status:** 🎯 Ready for execution

---

## Quick Start for Developer

### 1. Read the Execution Prompt
```
docs/sprints/terminology-migration-4d/4D-DOCS-EXECUTION_PROMPT.md
```

### 2. Understand the Context
```
docs/sprints/terminology-migration-4d/SPEC.md
```

### 3. Execute the Sprint
- **Type:** Documentation only (NO code changes)
- **Files to edit:** 4 documentation files
- **Risk:** Low
- **Estimated time:** 2-4 hours
- **Success:** Commit with message: `docs(4d): Update terminology to 4D Experience Model`

---

## Why This Sprint?

### The Problem
During Sprout Finishing Room sprint, we discovered **design regression** - new design work was referencing deprecated MVP terminology (Hub, Journey, Node) that should have been replaced during the 4D experience architecture transition.

### The Impact
- **Blocks future design work** - Designers using wrong mental model
- **Developer confusion** - Mixed terminology in codebase
- **Technical debt** - Inconsistent data models

### The Solution
Three-phase terminology migration:

1. **4D-Docs** ← START HERE (documentation only, low risk)
2. **4D-Schema** (type aliases with deprecation warnings)
3. **4D-Codebase** (internal variable renaming)

Phases can run **independently** or in **parallel**. No blocking dependencies.

---

## Sprint Overview: 4D-Docs

### What You'll Do
Update 4 documentation files to use correct 4D Experience Model terminology.

### Terminology Mapping (Memorize This)

| Old Term | New Term | Short Label |
|----------|----------|-------------|
| **Hub** | **Experience Path** | Path |
| **Journey** | **Experience Sequence** | Sequence |
| **Node** | **Experience Moment** | Moment |
| **Topic Hub** | **Cognitive Domain** | Domain |

### Files to Update

| File | Priority | Task |
|------|----------|------|
| `docs/design-system/DESIGN_SYSTEM.md` | Critical | Replace deprecated terms |
| `docs/design-system/UI_VISION_LIVING_GLASS.md` | Critical | Update conceptual references |
| `CLAUDE.md` | High | Update primary context doc |
| `docs/4D_EXPERIENCE_MODEL.md` | High | Create new reference (NEW FILE) |

### What NOT to Change

- **Sprint docs in `docs/sprints/`** - Historical, keep as-is
- **TypeScript files** - That's 4D-Schema sprint (later)
- **UI labels in code** - "Topic Hub" stays in RealityTuner console
- **Code examples** - If showing actual variable names, preserve them

---

## Execution Checklist

### Pre-Flight
- [ ] Read `4D-DOCS-EXECUTION_PROMPT.md` completely
- [ ] Read `SPEC.md` for full context
- [ ] Verify you understand the terminology mapping

### During Sprint
- [ ] Update `DESIGN_SYSTEM.md`
- [ ] Audit `UI_VISION_LIVING_GLASS.md`
- [ ] Update `CLAUDE.md`
- [ ] Create `docs/4D_EXPERIENCE_MODEL.md`
- [ ] Check for broken links
- [ ] Verify no unintended changes

### Post-Sprint
- [ ] Commit: `docs(4d): Update terminology to 4D Experience Model`
- [ ] Push to main
- [ ] Update status log (Randy can do this if you prefer)
- [ ] Mark Fix Queue complete in Notion (optional)

---

## Sample Before/After

### Before (Deprecated)
```markdown
The user navigates through **hubs** and **journeys** to reach **nodes**.
Each hub contains multiple journeys, and each journey consists of ordered nodes.
```

### After (4D Model)
```markdown
The user follows **experience paths** through **cognitive domains**,
encountering **moments** shaped by their active lens.
Each path organizes sequences of moments within specific domains.
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking links | Search for references after renaming |
| Introducing errors | Documentation only - no runtime impact |
| Scope creep | Stick to terminology updates only |
| Merge conflicts | Low - working in docs/ |

**Overall Risk:** 🟢 LOW (documentation only, no code changes)

---

## Success Criteria

Sprint is complete when:
- ✅ All 4 files updated with correct terminology
- ✅ New reference doc created (`docs/4D_EXPERIENCE_MODEL.md`)
- ✅ No broken links
- ✅ Commit message follows convention
- ✅ Changes pushed to main

---

## What Comes After?

After 4D-Docs, you have options (can do any order or parallel):

### Option 1: Continue Terminology Migration
- **4D-Schema** - Add TypeScript type aliases with deprecation warnings
- **4D-Codebase** - Rename internal variables and functions
- **Benefit:** Completes the full migration

### Option 2: New Feature Sprint
Check Notion Feature Roadmap for sprints with status `🎯 ready`:
- Look for sprints with artifacts in `docs/sprints/{name}/EXECUTION_PROMPT.md`
- Filter by priority or user value

### Option 3: Bug Fixes / Polish
- Check `.agent/status/` for documented bugs
- Known issues: `AUTO_REFRESH_BUG.md` (low priority)

**Recommended:** Complete 4D-Docs first (quick win), then reassess priorities.

---

## Resources

### Documentation
- **Sprint spec:** `docs/sprints/terminology-migration-4d/SPEC.md`
- **Execution prompt:** `docs/sprints/terminology-migration-4d/4D-DOCS-EXECUTION_PROMPT.md`
- **Context doc:** `CLAUDE.md`

### Fix Queue (Notion)
- **4D-Docs:** https://www.notion.so/2e9780a78eef8139a2ddd1b4b8c278fd
- **4D-Schema:** https://www.notion.so/2e9780a78eef81f0b635d116dac8f9be
- **4D-Codebase:** https://www.notion.so/2e9780a78eef81a2b829c5b479a66649

### Status Logs
- **Current:** `.agent/status/current/`
- **Archive:** `.agent/status/archive/`

---

## Developer Notes

### Coordination Protocol
1. When starting sprint, create status entry:
   ```
   017-{timestamp}-developer.md
   ```

2. Update heartbeat every 5 minutes while working:
   ```yaml
   heartbeat: 2026-01-15T23:15:00Z
   ```

3. On completion, update status to COMPLETE and add commit hash

### If You Get Stuck
- Check SPEC.md for terminology mapping
- Review 4D_EXPERIENCE_MODEL.md reference (once created)
- Ask user for clarification
- Randy available for coordination questions

### Grove Execution Protocol
This sprint follows the **Trellis Architecture** DEX principles:
- **Declarative Sovereignty:** Documentation defines the mental model
- **Provenance as Infrastructure:** Terminology conveys system lineage
- **Organic Scalability:** Consistent terminology enables growth

---

## Sprint Metrics (Estimated)

| Metric | Target |
|--------|--------|
| Files modified | 4 |
| Files created | 1 |
| Lines changed | ~50-100 |
| Time estimate | 2-4 hours |
| Risk level | Low |
| Tests required | None (docs only) |
| User validation | Optional (low impact) |

---

## Commit Template

```
docs(4d): Update terminology to 4D Experience Model

Replace deprecated Hub/Journey/Node terms with 4D Experience Model:
- Hub → Experience Path
- Journey → Experience Sequence  
- Node → Experience Moment
- Topic Hub → Cognitive Domain

Files updated:
- docs/design-system/DESIGN_SYSTEM.md
- docs/design-system/UI_VISION_LIVING_GLASS.md
- CLAUDE.md

Files created:
- docs/4D_EXPERIENCE_MODEL.md (reference doc)

Sprint: terminology-migration-4d (4D-Docs phase)
Risk: Low (documentation only, no code changes)
```

---

*Next sprint handoff prepared by Randy - Chief of Staff v1.2*  
*"From Hub to Path. From Journey to Sequence. From Node to Moment."*
