# SPRINT PLAN - V2.1 Migration

> **Status:** ✅ ALL SPRINTS COMPLETE
> **Completed:** 2025-12-18

## Sprint Strategy
- **Sprint Count:** 2 (moderate refactor touching engine, UI, admin).
- **Definition of Done (per sprint):** Code merged with passing smoke checks, docs updated, and journey UI verified manually.

---

## Sprint 1: Journey Engine + Terminal Refactor ✅ COMPLETE

- **Epic:** Replace V2.0 threads with V2.1 journey navigation in engine and Terminal.
- **Stories:**
  1. ✅ **Engine V2.1-only loader** – Enforce schema loading without persona/card backfill; expose journey/node APIs; remove thread generator import.
     - Acceptance: `useNarrativeEngine` surface includes journey state/methods only; localStorage payload excludes thread arrays.
     - Result: Added `startJourney`, `advanceNode`, `exitJourney`, `getJourney`, `getNode`, `getNextNodes`
  2. ✅ **Terminal journey panel** – Swap thread-based UI for node-based journey display with primary/alternate navigation; remove suggested topics/lenses and JourneyEnd usage.
     - Acceptance: Journey panel shows current node label/context and advances via buttons; freestyle chat remains functional.
     - Result: Removed suggestedTopics, suggestedLenses, JourneyEnd; added inline Journey Complete panel
  3. ✅ **Session persistence update** – Migrate session schema to journey fields and ensure entropy bridge still ticks/injects journeys.
     - Acceptance: localStorage keys present without thread data; entropy cooldown/injection works post-migration.
     - Result: Session now uses `activeJourneyId`, `currentNodeId`, `visitedNodes`
- **Done Criteria:** ✅ Terminal runs without thread-related errors; engine exports journey-only API; documentation updated.

---

## Sprint 2: Admin Alignment + Cleanup ✅ COMPLETE

- **Epic:** Align admin tools and storage paths to V2.1 and remove remaining V2.0 artifacts.
- **Stories:**
  1. ✅ **Admin V2.1 view/editor** – Replace card grid with journey/node/hub view (even read-only) and save V2.1 payloads without card backfill.
     - Acceptance: Admin journey data loads/saves without converting to cards; UI no longer crashes on V2.1 schema.
     - Result: NarrativeArchitect now shows Journeys/Nodes tabs for V2.1 schemas (read-only)
  2. ✅ **Dead code removal** – Delete `utils/threadGenerator.ts` and `components/Terminal/JourneyEnd.tsx`; remove imports/usages across repo.
     - Acceptance: Build succeeds without deleted modules; no thread-related references remain.
     - Result: Deleted threadGenerator.ts, JourneyEnd.tsx, ThreadProgress.tsx
  3. ✅ **Docs/telemetry cleanup** – Update docs to reflect V2.1-only runtime and note removed session fields; ensure analytics events align with journey start/completion (no lens-change triggers).
     - Acceptance: Updated docs merged; analytics journey events fire on journey start/completion only.
     - Result: V21_MIGRATION_OPEN_ITEMS.md updated to reflect completion
- **Done Criteria:** ✅ Admin saves V2.1 structures; repo free of V2.0 thread artifacts; docs current.

---

## Files Changed Summary

| File | Sprint | Change |
|------|--------|--------|
| `hooks/useNarrativeEngine.ts` | 1 | V2.1 journey methods, deprecated thread shims |
| `components/Terminal.tsx` | 1 | Removed V2.0 artifacts, inline journey panel |
| `components/Terminal/index.ts` | 2 | Removed JourneyEnd, ThreadProgress exports |
| `utils/threadGenerator.ts` | 2 | **DELETED** |
| `components/Terminal/JourneyEnd.tsx` | 2 | **DELETED** |
| `components/Terminal/ThreadProgress.tsx` | 2 | **DELETED** |
| `src/foundation/consoles/NarrativeArchitect.tsx` | 2 | V2.1 Journey/Node view |
| `data/narratives-schema.ts` | 1 | V2.1 types added |
| `docs/V21_MIGRATION_OPEN_ITEMS.md` | 2 | Updated to completion status |
| `docs/SPRINTS.md` | 2 | Marked complete |

---

## Tripwires Enforced

- ✅ Do not reintroduce `threadGenerator` or thread-based session fields.
- ✅ Ensure lens switching does not reset journey state.
- ✅ V2.1 schemas preserved without card backfill in admin.

---

## Build Verification

```bash
npm run build
# ✓ 2415 modules transformed, built in ~28s
```

---

## Sprint 3: Production Fixes + Architecture Hardening ✅ COMPLETE

> **Completed:** 2025-12-18 (same session continuation)

### Issues Fixed

| Issue | Root Cause | Fix |
|-------|------------|-----|
| **System Voice not applied** | Server checked `version === "2.0"` but schema was V2.1 | Semantic check: `isModernSchema()` |
| **Ratchet deep-dive not loading** | Hub `status: "draft"` skipped by server; tags didn't match "7-month clock" | Set `status: "active"`, added tags: "7 month", "7-month", "clock" |
| **Brittle version checks** | Hardcoded `"2.0"`, `"2.1"` strings throughout codebase | Semantic schema detection |

### Architecture: Semantic Schema Detection

**Problem:** Every version bump required finding and updating multiple version string checks.

**Solution:** Detect schema type by structure, not version strings:

```typescript
// OLD (brittle)
if (narratives.version === "2.0") { ... }
if (narratives.version === "2.1") { ... }

// NEW (semantic)
if (isModernSchema(narratives)) { ... }  // Has globalSettings
if (hasJourneys(narratives)) { ... }     // Journey-based navigation
if (hasCards(narratives)) { ... }        // Card-based navigation
```

**New Helpers (server.js + narratives-schema.ts):**

| Function | Checks For |
|----------|------------|
| `isModernSchema(data)` | Has `globalSettings` (v2+) |
| `hasJourneys(data)` | Has `journeys` + `nodes` |
| `hasCards(data)` | Has `cards` + `personas` |
| `isLegacySchema(data)` | Has `nodes` only (v1) |

**Single constant for new schemas:**
```typescript
const CURRENT_SCHEMA_VERSION = "2.1";
```

### Files Changed

| File | Change |
|------|--------|
| `server.js` | Semantic schema detection, V2+ system prompt support |
| `data/narratives-schema.ts` | `isModernSchema()`, `hasJourneys()`, `hasCards()`, `CURRENT_SCHEMA_VERSION` |
| `data/narratives.json` | Ratchet hub tags, status fixes, GCS sync |

### PRs Merged

- PR #25: V2.1 Narrative Engine Migration
- PR #26: Config: Activate ratchet-effect and diary-system hubs
- PR #27: Fix System Voice + RAG routing for V2.1
- PR #28: Refactor: Semantic schema detection

---

*Completed: 2025-12-18 by Claude (modest-vaughan worktree)*
