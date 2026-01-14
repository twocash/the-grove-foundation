# Results Wiring v1 - Sprint Specification

**Sprint:** `results-wiring-v1`
**Status:** Ready for Execution
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post knowledge-base-integration-v1)
**Date:** 2026-01-14

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Ready for Execution |
| **Status** | 🎯 Ready |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-14T02:00:00Z |
| **Next Action** | Execute Phase 1: Schema + Storage |

---

## Attention Anchor

**We are building:** Real research results display - replacing mock quantum computing data with actual sprout research results.

**Success looks like:** Users click completed sprouts and see THEIR research findings, not fake "Google Achieves Quantum Supremacy" content.

---

## Problem Statement

`GardenInspector.tsx` (lines 107-115) uses `createMockResearchDocument()` which always shows fake quantum computing content regardless of what the user actually researched.

**Current Code (lines 107-115):**
```typescript
// TODO: Replace with actual document retrieval from storage
const researchDocument: ResearchDocument | null = useMemo(() => {
  if (selectedSprout?.status === 'completed') {
    // For MVP, generate mock document based on sprout's spark
    return createMockResearchDocument(selectedSprout.spark);
  }
  return null;
}, [selectedSprout]);
```

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── src/surface/components/Terminal/*
└── src/workspace/*

ACTIVE BUILD ZONE — WHERE WE WORK
├── /explore route ◄── THIS SPRINT
├── src/explore/*
├── src/core/schema/*
└── supabase/migrations/*
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| ResearchDocument storage | ✅ Schema-driven | ✅ Any model | ✅ sproutId linked | ✅ JSONB flexible |
| Fallback converter | ✅ Config-based | ✅ Any source | ✅ Preserves origin | ✅ Extensible |

---

## Execution Architecture

### Phase 1: Schema + Storage (Core)

**Goal:** Add `researchDocument` field to sprout and persist it when pipeline completes.

| File | Change |
|------|--------|
| `src/core/schema/research-sprout.ts` | Add `researchDocument?: ResearchDocument` field |
| `src/explore/context/ResearchSproutContext.tsx` | Update `updateResults()` to persist document |
| `src/explore/context/ResearchExecutionContext.tsx` | Store `result.document` when pipeline completes |

**Gate:** TypeScript compiles, no runtime errors.

---

### Phase 2: Display Wiring

**Goal:** Replace mock with real data in GardenInspector.

| File | Change |
|------|--------|
| `src/explore/GardenInspector.tsx` | Replace `createMockResearchDocument()` with `sprout.researchDocument` |

**Before:**
```typescript
return createMockResearchDocument(selectedSprout.spark);
```

**After:**
```typescript
return selectedSprout.researchDocument ?? sproutToResearchDocument(selectedSprout);
```

**Gate:** Visual verification - completed sprout shows non-quantum content.

---

### Phase 3: Fallback Converter

**Goal:** Handle legacy sprouts without stored `researchDocument`.

| File | Purpose |
|------|---------|
| `src/explore/utils/sprout-to-document.ts` (new) | Convert legacy sprouts to ResearchDocument |

**Mapping:**
- `synthesis.summary` → `position`
- `synthesis.insights` + `evidence[]` → `analysis` markdown
- `evidence[]` → `citations[]` with indices
- `synthesis.confidence` → `confidenceScore`

**Gate:** Legacy sprouts render without errors.

---

### Phase 4: E2E Testing (Protocol v1.5 Constraint 11)

**Goal:** Console-monitored E2E test proving real data displays.

| File | Purpose |
|------|---------|
| `tests/e2e/results-wiring.spec.ts` (new) | E2E with console monitoring |

**Critical Assertion:**
```typescript
expect(content).not.toContain('Quantum computing');
expect(content).not.toContain('ionq.com');
expect(content).toContain('Grove'); // Or whatever was researched
```

**Gate:** E2E passes, zero critical console errors.

---

### Phase 5: Cleanup + Documentation

**Goal:** Remove mock, update REVIEW.html.

| Action | Details |
|--------|---------|
| Delete mock | Remove `createMockResearchDocument` import/usage |
| REVIEW.html | Screenshot evidence for all ACs |
| Code-simplifier | Run on modified files |

**Gate:** Sprint complete, all ACs verified.

---

## Files to Modify

| Priority | File | Lines | Change |
|----------|------|-------|--------|
| 1 | `src/core/schema/research-sprout.ts` | ~270 | Add `researchDocument` field |
| 2 | `src/explore/context/ResearchSproutContext.tsx` | ~400-450 | Persist document in updateResults |
| 3 | `src/explore/context/ResearchExecutionContext.tsx` | ~94-113 | Store pipeline result document |
| 4 | `src/explore/GardenInspector.tsx` | 107-115 | Replace mock with real data |
| 5 | `src/explore/utils/sprout-to-document.ts` | new | Fallback converter |
| 6 | `tests/e2e/results-wiring.spec.ts` | new | E2E console-monitored test |

---

## Acceptance Criteria Summary

| AC Code | Criterion | Verification |
|---------|-----------|--------------|
| **AC-RW001** | Results show REAL citations | Content matches query, NOT quantum |
| **AC-RW002** | Citation URLs are actual sources | URLs relevant to query |
| **AC-RW003** | Confidence score reflects synthesis | Score varies, not always 85% |
| **AC-RW004** | Fallback handles legacy sprouts | Old sprouts still render |
| **AC-RW005** | Zero console errors | Console monitoring passes |
| **AC-RW006** | Loading state during retrieval | Spinner shown during async |

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] All ACs verified with screenshots
- [ ] E2E test passes with console monitoring (Constraint 11)
- [ ] Zero critical console errors
- [ ] Code-simplifier applied
- [ ] REVIEW.html complete
- [ ] Mock removed from codebase

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Results still show quantum computing mock
- ❌ Critical console errors detected
- ❌ Legacy sprouts broken

---

## Reference Files

| File | Purpose |
|------|---------|
| `src/explore/mocks/mock-research-document.ts` | Mock to be replaced |
| `src/core/schema/research-document.ts` | ResearchDocument schema |
| `src/explore/components/ResearchResultsView.tsx` | Display component |
| `tests/e2e/_test-utils.ts` | Console monitoring utilities |

---

## Visual Verification Requirements (Protocol v1.5)

- [ ] Screenshots in `docs/sprints/results-wiring-v1/screenshots/`
- [ ] REVIEW.html with AC-to-evidence mapping
- [ ] E2E test with console monitoring
- [ ] All screenshots capture: real data (not quantum mock)

---

*This contract is binding. Deviation requires explicit human approval.*
