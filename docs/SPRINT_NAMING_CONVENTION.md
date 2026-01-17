# Sprint Naming Convention v1.0

**Date:** 2026-01-16
**Purpose:** Eliminate confusion between EPIC phases and Sprint numbers

---

## The Problem

Current system is confusing:
- EPIC has 8 phases (0-7)
- Sprints have numbers (S4-S11) that don't map cleanly
- Developers think in sprints, not EPIC phases
- Notion tracking gets cluttered with complex hierarchy

---

## The Solution: Two-Track Naming

### Track 1: Historical Sprints (Cannot Change)
**Legacy sprints already deployed:**

| Sprint | EPIC Phase | Name | Status |
|--------|------------|------|--------|
| S4 | Phase 0 | Tier Progression | ✅ Complete |
| S5 | Phase 1 | Lifecycle Engine | ✅ Complete |
| S6 | Phase 2 | Observable Signals | ✅ Complete |
| S7 | Phase 3 | AutoAdvancement | ✅ Complete |
| S7.5 | Phase 3.5 | JobConfig System | 🎯 In Progress |

---

### Track 2: Future Sprints (New Convention)
**Starting with S8:**

## NEW FORMAT: `[EPIC-Phase]-[SL]-[FullName]`

### Examples:

**S8-SL-MultiModel (EPIC Phase 4)**
- **Primary ID:** `EPIC4-SL-MultiModel`
- **Sprint Number:** S8 (legacy)
- **EPIC Phase:** 4 of 7
- **Display:** `S8-SL-MultiModel [EPIC Phase 4]`

**S9-SL-Federation (EPIC Phase 5)**
- **Primary ID:** `EPIC5-SL-Federation`
- **Sprint Number:** S9 (legacy)
- **EPIC Phase:** 5 of 7
- **Display:** `S9-SL-Federation [EPIC Phase 5]`

**S10-SL-AICuration (EPIC Phase 6)**
- **Primary ID:** `EPIC6-SL-AICuration`
- **Sprint Number:** S10 (legacy)
- **EPIC Phase:** 6 of 7
- **Display:** `S10-SL-AICuration [EPIC Phase 6]`

**S11-SL-Attribution (EPIC Phase 7)**
- **Primary ID:** `EPIC7-SL-Attribution`
- **Sprint Number:** S11 (legacy)
- **EPIC Phase:** 7 of 7 (Final)
- **Display:** `S11-SL-Attribution [EPIC Phase 7]`

---

## Implementation Rules

### For Notion Database:
```
Primary Title: EPIC4-SL-MultiModel: Custom Lifecycle Models
Subtitle: S8-SL-MultiModel [EPIC Phase 4]
```

### For Documentation:
```
Directory: docs/sprints/epic4-multimodel-v1/
Files: PRODUCT_BRIEF.md, DESIGN_WIREFRAMES.md, etc.
```

### For Git:
```
Branch: epic4-sl-multimodel-v1
Commits: feat(epic4): implement multi-model support
```

### For Code:
```typescript
// Use EPIC phase as primary
type EpicPhase = 'EPIC4' | 'EPIC5' | 'EPIC6' | 'EPIC7';
const currentEpic: EpicPhase = 'EPIC4';
```

---

## Quick Reference Card

### What Developers Need to Know:

**Current Sprint:**
- **Name:** S7.5-SL-JobConfigSystem
- **EPIC Phase:** 3.5 (between Phase 3 and 4)
- **Status:** 🎯 In Progress

**Next Sprint:**
- **Name:** S8-SL-MultiModel
- **EPIC Phase:** 4 of 7
- **Primary ID:** EPIC4-SL-MultiModel
- **Status:** 🎯 Ready for Planning

**After That:**
- **S9-SL-Federation** = EPIC Phase 5
- **S10-SL-AICuration** = EPIC Phase 6
- **S11-SL-Attribution** = EPIC Phase 7 (Final)

---

## Visual Hierarchy

```
EPIC: Knowledge as Observable System
├── Phase 3.5: JobConfig System 🎯 CURRENT
├── Phase 4: MultiModel 🎯 NEXT (EPIC4-SL-MultiModel)
├── Phase 5: Federation 💡 (EPIC5-SL-Federation)
├── Phase 6: AI Curation 💡 (EPIC6-SL-AICuration)
└── Phase 7: Attribution 💡 (EPIC7-SL-Attribution)
```

---

## Migration Plan

### For S8 (Next Sprint):
1. **Notion:** Create new page with dual naming
   - Title: `EPIC4-SL-MultiModel: Custom Lifecycle Models`
   - Subtitle: `S8-SL-MultiModel [EPIC Phase 4]`

2. **Directory:** Create `docs/sprints/epic4-multimodel-v1/`

3. **Documentation:** Lead all docs with "EPIC Phase 4"

4. **Commits:** Use `feat(epic4)` prefix

5. **Notion Status:** Add "EPIC Phase: 4 of 7" property

---

## Benefits

1. **Clarity:** Always know which EPIC phase you're in
2. **Hierarchy:** EPIC → Phase → Sprint (logical flow)
3. **Flexibility:** Sprint numbers can change, EPIC phases can't
4. **Developer-Friendly:** Think in EPIC phases, not arbitrary sprint numbers
5. **Notion-Friendly:** Clean properties and relationships

---

## Example: S8 Planning Kickoff

```
Subject: EPIC4-SL-MultiModel Sprint Planning

Sprint: S8-SL-MultiModel [EPIC Phase 4]
Epic: Knowledge as Observable System (Phase 4 of 7)
Goal: Multi-model lifecycle support with A/B testing framework

Context:
- Previous: S7-SL-AutoAdvancement (Phase 3) ✅ Complete
- Current: S7.5-SL-JobConfigSystem (Phase 3.5) 🎯 In Progress
- Next: S8-SL-MultiModel (Phase 4) ← STARTING THIS
- Following: S9-SL-Federation (Phase 5)
```

---

## Summary

**Think in EPIC Phases:**
- Current: Phase 3.5 (JobConfig)
- Next: Phase 4 (MultiModel)
- Then: Phase 5 (Federation)

**Sprint numbers are legacy labels for backward compatibility only.**

---

*This convention applies to all sprints starting with S8 (EPIC4-SL-MultiModel)*
*Historical sprints (S4-S7.5) retain original naming for consistency*
