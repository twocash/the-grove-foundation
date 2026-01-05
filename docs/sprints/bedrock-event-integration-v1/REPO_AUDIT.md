# Repository Audit: bedrock-event-integration-v1

**Sprint:** bedrock-event-integration-v1  
**Date:** January 4, 2026  
**Auditor:** Foundation Loop Phase 0  
**Focus:** Sprint 2 compliance review + Sprint 3 WIP assessment

---

## Part 1: Sprint 2 (bedrock-event-hooks-v1) Compliance Audit

### 1.1 Artifacts Review

| Artifact | Present | Compliant | Notes |
|----------|---------|-----------|-------|
| SPEC.md | ✅ | ⚠️ | Missing DEX compliance matrix |
| ARCHITECTURE.md | ❌ | N/A | Not created |
| DECISIONS.md | ❌ | N/A | Not created |
| Tests | ✅ | ✅ | 25 tests, 158 total |

**Verdict:** Sprint 2 executed with minimal documentation. Code is sound but lacks architectural justification.

### 1.2 DEX Compliance Matrix (Retroactive)

#### Feature: React Event Hooks

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Hooks are engine, not map. Event types defined declaratively in schema.ts. Non-technical users don't modify hooks—they configure what events mean. |
| Capability Agnosticism | ✅ | Event system contains no LLM calls. Works regardless of model capability. |
| Provenance as Infrastructure | ✅ | Every event carries `fieldId` + `timestamp` + `sessionId`. MetricAttribution enforced by schema. |
| Organic Scalability | ✅ | New event types via union extension. New projections via pure functions. No code changes to hooks needed. |

**Assessment:** Sprint 2 code is DEX-compliant. Documentation gap only.

---

## Part 2: Sprint 3 WIP Assessment

### 2.1 Files Created (Uncommitted)

```
?? src/core/events/hooks/ExploreEventProvider.tsx   (96 lines)
?? src/core/events/hooks/useEventBridge.ts          (349 lines)
 M src/core/events/hooks/index.ts                   (+15 lines)
 M data/narratives-schema.ts                        (+6 lines)
 M src/core/config/defaults.ts                      (+6 lines)
```

### 2.2 Critical Schema Violations in useEventBridge.ts

**The bridge dispatches events that will fail Zod validation:**

#### Violation 1: RESPONSE_COMPLETED

```typescript
// Bridge sends:
{
  type: 'RESPONSE_COMPLETED',
  queryId,
  responseLength,  // ❌ Not in schema
  hubId
}

// Schema requires:
{
  type: 'RESPONSE_COMPLETED',
  responseId,      // ✅ Required
  queryId,         // ✅ Matches
  hasNavigation,   // ✅ Required (boolean)
  spanCount,       // ✅ Required (number)
  hubId?,          // ✅ Optional, matches
  nodeId?          // ✅ Optional
}
```

**Impact:** Zod throws at runtime. Events rejected.

#### Violation 2: HUB_VISITED (Non-existent)

```typescript
// Bridge sends:
{ type: 'HUB_VISITED', hubId, hubName }

// Schema has:
{ type: 'HUB_ENTERED', hubId, source, queryTrigger? }
```

**Impact:** Zod throws for unknown event type.

#### Violation 3: SPROUT_CAPTURED (Non-existent)

```typescript
// Bridge sends:
{ type: 'SPROUT_CAPTURED', sproutId, tags }

// Schema has:
{ type: 'INSIGHT_CAPTURED', sproutId, journeyId?, hubId?, responseId? }
```

**Impact:** Zod throws for unknown event type.

#### Violation 4: LENS_ACTIVATED field mismatch

```typescript
// Bridge sends:
{ source: 'selection' | 'command' | 'auto' }  // Called 'trigger' in bridge

// Schema requires:
{ source: 'url' | 'selection' | 'system' | 'localStorage' }
```

**Impact:** `trigger` is undefined in schema. `source` enum mismatch.

### 2.3 DEX Compliance Assessment

| Test | Pass/Fail | Issue |
|------|-----------|-------|
| Declarative Sovereignty | ⚠️ | Feature flag is declarative ✅, but bridge hardcodes event subset |
| Capability Agnosticism | ✅ | No model assumptions |
| Provenance as Infrastructure | ❌ | Invalid events break provenance chain |
| Organic Scalability | ❌ | Adding new events requires bridge code changes |

---

## Part 3: Architectural Decisions Required

### Decision 1: Bridge Pattern vs. Direct Hook Usage

**Question:** Should `useEventBridge` exist, or should consumers use `useEventHelpers` directly?

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| A: Keep Bridge | Single point for dual-write, legacy compat | Hardcoded subset, schema drift risk |
| B: Remove Bridge | Direct schema adherence, full event set | Each consumer handles dual-write |
| C: Thin Bridge | Bridge only routes, uses useEventHelpers internally | Best of both |

**Recommendation:** Option C. Bridge wraps useEventHelpers for the new system, adds legacy dual-write layer on top.

### Decision 2: Legacy Dual-Write Strategy

**Question:** How long do we dual-write to legacy engagement bus?

**Options:**

| Option | Description | Risk |
|--------|-------------|------|
| A: Always | Dual-write forever | Maintenance burden |
| B: Feature flag | Dual-write when legacy consumers exist | Must track consumers |
| C: Deprecation timer | Dual-write for N sprints, then remove | Hard cutoff |

**Recommendation:** Option B. Track legacy consumers explicitly, remove dual-write when all migrated.

---

## Part 4: Files Requiring Changes

### 4.1 Delete or Rewrite

| File | Action | Reason |
|------|--------|--------|
| `useEventBridge.ts` | **REWRITE** | Schema violations, wrong pattern |

### 4.2 Keep

| File | Action | Reason |
|------|--------|--------|
| `ExploreEventProvider.tsx` | Keep | Feature flag wrapper is correct |
| Feature flag additions | Keep | Declarative control is correct |
| Index exports | Update after rewrite | Export new bridge |

### 4.3 New Files Needed

| File | Purpose |
|------|---------|
| `useLegacyBridge.ts` | Encapsulate legacy engagement bus writes |
| Tests for integration | Verify dual-write behavior |

---

## Part 5: Test Coverage Status

### Sprint 2 Tests (hooks.test.tsx)

```
✅ 25 tests passing
- Provider initialization
- Dispatch validation
- Projection hooks
- Memoization behavior
```

### Sprint 3 Tests Needed

```
- ExploreEventProvider feature flag switching
- Bridge dual-write (new system receives correct schema)
- Bridge dual-write (legacy receives translated events)
- Error handling when new system disabled
```

---

## Summary

| Item | Status | Action |
|------|--------|--------|
| Sprint 2 code | ✅ Compliant | Add missing docs |
| Sprint 3 WIP | ❌ Schema violations | Rewrite useEventBridge |
| Feature flag | ✅ Correct | Keep |
| Tests | ⚠️ Incomplete | Add integration tests |

**Blocking Issues:**
1. `useEventBridge.ts` dispatches invalid events
2. Bridge pattern reduces scalability

**Recommended Path:**
1. Discard current `useEventBridge.ts`
2. Implement thin bridge that wraps `useEventHelpers`
3. Add legacy translation layer
4. Complete Foundation Loop documentation

---

*Audit complete. Proceed to SPEC.md with fix design.*
