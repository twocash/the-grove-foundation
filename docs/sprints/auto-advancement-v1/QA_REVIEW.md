# QA Review: S7-SL-AutoAdvancement

**Sprint:** S7-SL-AutoAdvancement (Programmable Curation Engine)
**Reviewer:** QA Reviewer (Agent)
**Date:** 2026-01-16
**Status:** ✅ APPROVED (after corrections)

---

## Executive Summary

The S7-SL-AutoAdvancement sprint artifacts are comprehensive and well-structured. QA identified several path errors in EXECUTION_PROMPT.md and a signal schema mismatch with S6. **All issues have been corrected.**

**Verdict:** ✅ Ready for developer handoff.

---

## Review Checklist

| Area | Status | Notes |
|------|--------|-------|
| Story-to-Wireframe Coverage | ✅ PASS | All 5 components have corresponding stories |
| Gherkin Testability | ✅ PASS | All 24 stories have testable ACs |
| DEX Compliance | ✅ PASS | UX Chief approved |
| Execution Paths | ✅ PASS | Paths corrected in EXECUTION_PROMPT.md |
| Schema Consistency | ✅ PASS | Signal mapping added to EXECUTION_PROMPT.md |
| Dependency Clarity | ✅ PASS | S6 dependency well documented |

---

## Critical Issues (Fixed ✅)

### Issue 1: Component File Paths Are Wrong

**Location:** EXECUTION_PROMPT.md lines 196-207

**Problem:** EXECUTION_PROMPT specifies incorrect file paths for new components.

| EXECUTION_PROMPT Says | Actual Codebase Pattern |
|-----------------------|-------------------------|
| `src/bedrock/components/AdvancementRuleCard.tsx` | `src/bedrock/consoles/ExperienceConsole/AdvancementRuleCard.tsx` |
| `src/bedrock/components/AdvancementRuleEditor.tsx` | `src/bedrock/consoles/ExperienceConsole/AdvancementRuleEditor.tsx` |
| `src/bedrock/components/AdvancementHistoryPanel.tsx` | `src/bedrock/consoles/ExperienceConsole/AdvancementHistoryPanel.tsx` |
| `src/bedrock/components/ManualOverrideModal.tsx` | `src/bedrock/consoles/ExperienceConsole/ManualOverrideModal.tsx` |
| `src/bedrock/components/BulkRollbackModal.tsx` | `src/bedrock/consoles/ExperienceConsole/BulkRollbackModal.tsx` |

**Evidence:** Existing components follow pattern:
- `src/bedrock/consoles/ExperienceConsole/FeatureFlagCard.tsx`
- `src/bedrock/consoles/ExperienceConsole/FeatureFlagEditor.tsx`
- `src/bedrock/consoles/ExperienceConsole/LifecycleConfigCard.tsx`

**Fix:** Update all component paths in "New Files to Create" section.

---

### Issue 2: Hook File Path Is Wrong

**Location:** EXECUTION_PROMPT.md line 209

**Problem:** Hook location doesn't match codebase pattern.

| EXECUTION_PROMPT Says | Actual Codebase Pattern |
|-----------------------|-------------------------|
| `src/bedrock/hooks/useAdvancementRuleData.ts` | `src/bedrock/consoles/ExperienceConsole/useAdvancementRuleData.ts` |

**Evidence:** Existing hooks follow pattern:
- `src/bedrock/consoles/ExperienceConsole/useFeatureFlagsData.ts`
- `src/bedrock/consoles/ExperienceConsole/useLifecycleConfigData.ts`

**Fix:** Update hook path in "New Files to Create" section.

---

### Issue 3: Registry Location Is Wrong

**Location:** EXECUTION_PROMPT.md line 216

**Problem:** References wrong file for component registration.

| EXECUTION_PROMPT Says | Actual Codebase Pattern |
|-----------------------|-------------------------|
| `src/bedrock/config/component-registry.ts` | `src/bedrock/consoles/ExperienceConsole/component-registry.ts` |

**Evidence:** Actual file at `src/bedrock/consoles/ExperienceConsole/component-registry.ts:40`

**Fix:** Update registry path in "Files to Modify" section.

---

### Issue 4: Types Path Is Wrong

**Location:** EXECUTION_PROMPT.md line 215

**Problem:** grove-object.ts is in `schema/` not `types/`.

| EXECUTION_PROMPT Says | Actual Codebase Pattern |
|-----------------------|-------------------------|
| `src/core/types/grove-object.ts` | `src/core/schema/grove-object.ts` |

**Evidence:** File exists at `src/core/schema/grove-object.ts:1`

**Fix:** Update path in "Files to Modify" section.

---

### Issue 5: Missing Registry Updates

**Location:** EXECUTION_PROMPT.md "Files to Modify" section

**Problem:** Several required file updates are not documented.

**Missing Files:**

1. **`src/bedrock/types/experience.types.ts`**
   - Must add `'advancement-rule'` entry to `EXPERIENCE_TYPE_REGISTRY`
   - Must add to `ExperiencePayloadMap` type

2. **`src/bedrock/consoles/ExperienceConsole/hook-registry.ts`**
   - Must register `useAdvancementRuleData` hook

3. **`src/bedrock/consoles/ExperienceConsole/component-registry.ts`**
   - Must import and register `AdvancementRuleCard`
   - Must import and register `AdvancementRuleEditor`

**Fix:** Add these files to "Files to Modify" section with specific changes.

---

## Medium Issues (Fixed ✅)

### Issue 6: Signal Schema Naming Mismatch

**Location:** PRODUCT_BRIEF.md lines 195-205 vs S6 schema

**Problem:** Signal field names in PRODUCT_BRIEF don't match S6 schema.

| PRODUCT_BRIEF Uses | S6 Schema (`sprout-signals.ts`) Uses |
|--------------------|--------------------------------------|
| `retrievals` | `retrievalCount` |
| `citations` | `referenceCount` |
| `queryDiversity` | `diversityIndex` |
| `utilityScore` | `utilityScore` ✅ |

**Evidence:** `src/core/schema/sprout-signals.ts:258-277`

**Options:**
1. Update PRODUCT_BRIEF to match S6 schema naming
2. Create mapping layer in signal fetcher
3. Update S6 schema to match PRODUCT_BRIEF (not recommended - S6 already in progress)

**Recommended Fix:** Update PRODUCT_BRIEF and DESIGN_WIREFRAMES to use S6 schema names.

---

### Issue 7: Missing useUnifiedExperienceData Update

**Location:** Not mentioned in EXECUTION_PROMPT

**Problem:** The `hook-registry.ts` explicitly states that hook calls must be added to `useUnifiedExperienceData` due to React Rules of Hooks.

**Evidence:** `hook-registry.ts:27-29`:
```typescript
// IMPORTANT: React hooks cannot be called conditionally/dynamically.
// This registry is used by useUnifiedExperienceData to know which hooks exist.
// The actual hook calls must be explicit in useUnifiedExperienceData.
```

**Fix:** Add `src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts` to "Files to Modify" section.

---

## Coverage Verification

### Story-to-Wireframe Mapping

| Epic | Stories | Wireframe Component | Status |
|------|---------|---------------------|--------|
| Epic 1: Rule Management | US-S001 to US-S005 | AdvancementRuleCard, AdvancementRuleEditor | ✅ Covered |
| Epic 2: Evaluation Engine | US-S006 to US-S010 | N/A (backend logic) | ✅ No UI needed |
| Epic 3: Operator Controls | US-S011 to US-S014 | AdvancementHistoryPanel, ManualOverrideModal, BulkRollbackModal | ✅ Covered |
| Epic 4: Gardener Experience | US-S015 to US-S017 | TierBadge (tooltip extension) | ✅ Covered |
| Epic 5: Console Integration | US-S018 to US-S021 | Registry entries | ✅ Covered |
| Epic 6: S6 Integration | US-S022 to US-S024 | signalFetcher.ts | ✅ Covered |

### Gherkin Testability Audit

All 24 stories have Gherkin acceptance criteria. Sample verification:

| Story | Gherkin Scenario | Testable? | Notes |
|-------|-----------------|-----------|-------|
| US-S001 | "Create advancement rule" | ✅ Yes | Clear Given/When/Then |
| US-S007 | "Batch evaluation executes" | ✅ Yes | Has table-driven data |
| US-S011 | "View advancement history" | ✅ Yes | Pagination covered |
| US-S015 | "Badge cache invalidation" | ✅ Yes | State transition clear |

---

## Corrected File Structure

### New Files to Create (Corrected Paths)

```
src/core/schema/advancement.ts          # AdvancementRulePayload, Criterion types

src/core/engine/advancementEvaluator.ts # evaluateAdvancement() pure function
src/core/engine/signalFetcher.ts        # getObservableSignals() with mock fallback
src/core/jobs/advancementBatchJob.ts    # Daily batch orchestration

src/bedrock/consoles/ExperienceConsole/
├── AdvancementRuleCard.tsx             # Grid card (follow FeatureFlagCard)
├── AdvancementRuleEditor.tsx           # Inspector panel (follow FeatureFlagEditor)
├── AdvancementHistoryPanel.tsx         # Audit trail grouped by batch
├── ManualOverrideModal.tsx             # Individual tier override
├── BulkRollbackModal.tsx               # Mass rollback with reason
└── useAdvancementRuleData.ts           # CRUD hook
```

### Files to Modify (Corrected Paths)

```
src/core/schema/grove-object.ts                           # Add 'advancement-rule' to union
src/bedrock/types/experience.types.ts                     # Add to EXPERIENCE_TYPE_REGISTRY
src/bedrock/consoles/ExperienceConsole/component-registry.ts  # Register Card/Editor
src/bedrock/consoles/ExperienceConsole/hook-registry.ts   # Register useAdvancementRuleData
src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts  # Add hook call
src/surface/components/TierBadge/TierBadge.tsx            # Add provenance tooltip
```

---

## Action Required

All critical and medium issues have been addressed:

1. [x] **Update EXECUTION_PROMPT.md** with corrected file paths ✅
2. [x] **Update EXECUTION_PROMPT.md** to include all required file modifications ✅
3. [x] **Align signal names** - Signal mapping table added to EXECUTION_PROMPT.md ✅
4. [x] **Re-verify** - All paths verified against codebase ✅

**Sprint is ready for developer handoff.**

---

## QA Reviewer Notes

The sprint planning is thorough and well-structured. The DEX compliance is excellent. The only issues are path discrepancies that are easy to fix. Once corrected, this sprint is ready for developer handoff.

The S6 dependency is properly documented with mock signal fallback strategy.

---

*QA Review for S7-SL-AutoAdvancement*
*Grove Foundation - QA Protocol v1*
