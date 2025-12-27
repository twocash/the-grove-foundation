# Repository Audit — adaptive-engagement-v1

**Sprint:** `adaptive-engagement-v1`  
**Audited:** 2025-12-27  
**Auditor:** Claude (Foundation Loop)

---

## Audit Scope

Analyze current state of engagement, prompts, and telemetry systems to inform adaptive engagement implementation.

---

## Current Architecture

### 1. Terminal Welcome System

**Location:** `components/Terminal/TerminalWelcome.tsx`

**Current State:**
- Static prompts defined in Quantum Interface reality
- Prompts are lens-reactive but NOT engagement-reactive
- No concept of "stages" or "depth"
- No telemetry collection

**Key Code:**
```typescript
const { reality } = useQuantumInterface();
const prompts = reality?.terminal?.prompts ?? [];
```

**Gap:** Prompts don't adapt to user engagement level.

### 2. Quantum Interface (Pattern 1)

**Location:** `src/surface/hooks/useQuantumInterface.ts`, `src/data/quantum-content.ts`

**Current State:**
- `LensReality` type defines per-lens content
- Content collapses on lens selection
- Terminal section exists with static prompts

**LensReality.terminal structure:**
```typescript
terminal?: {
  prompts?: string[];
  placeholder?: string;
}
```

**Extension Opportunity:** Add `stagePrompts` or compute prompts dynamically.

### 3. Session Management

**Location:** `src/lib/session.ts` (newly created in server-side-capture-v1)

**Current State:**
- `getOrCreateSessionId()` provides anonymous session ID
- Stored in localStorage with fallback
- Used by sprout server storage

**Gap:** Session exists but no telemetry collected beyond sprouts.

### 4. Sprout System

**Location:** `hooks/useSproutStorage.ts`, `lib/supabase.js`

**Current State:**
- Sprouts can be captured and persisted
- Server mode syncs to Supabase with embeddings
- `useSproutStats()` hook exists (or can be added)

**Opportunity:** Sprout capture count is an engagement signal.

### 5. Chat/Exchange Tracking

**Location:** `components/Terminal/*.tsx`, chat handler

**Current State:**
- Messages are sent and received
- No counting of exchanges
- No persistence of conversation patterns

**Gap:** Exchange count not tracked as telemetry.

### 6. Topic/Hub Tracking

**Location:** `data/hubs.json`, navigation state

**Current State:**
- Hubs define topic areas
- Navigation to hubs happens via prompts/CTAs
- No tracking of which hubs visited

**Gap:** Topic exploration not recorded.

---

## Files Relevant to Sprint

### Must Create (New Files)

| File | Purpose |
|------|---------|
| `src/core/schema/session-telemetry.ts` | Telemetry type definitions |
| `src/core/schema/suggested-prompts.ts` | Prompt schema with intents |
| `src/core/schema/journey.ts` | Journey/waypoint definitions |
| `src/lib/telemetry/collector.ts` | TelemetryCollector class |
| `src/lib/telemetry/stage-computation.ts` | Stage calculation logic |
| `src/lib/telemetry/storage.ts` | localStorage + server sync |
| `src/lib/telemetry/index.ts` | Barrel export |
| `hooks/useSessionTelemetry.ts` | React hook for telemetry |
| `hooks/useSuggestedPrompts.ts` | Prompt selection hook |
| `hooks/useJourneyProgress.ts` | Journey tracking hook |
| `src/data/prompts/stage-prompts.ts` | Stage-based prompt config |
| `src/data/journeys/grove-fundamentals.ts` | First journey definition |
| `src/data/journeys/index.ts` | Journey registry |
| `components/Terminal/JourneyProgressIndicator.tsx` | Progress UI |
| `components/Terminal/JourneyCompletionCard.tsx` | Completion UI |

### Must Modify (Existing Files)

| File | Changes |
|------|---------|
| `components/Terminal/TerminalWelcome.tsx` | Use adaptive prompts |
| `hooks/useSproutStorage.ts` | Emit telemetry on capture |
| Chat handler (TBD) | Track exchange count, topics |
| `server.js` | Add telemetry persistence endpoints |

### Database (Supabase)

| Table | Purpose |
|-------|---------|
| `session_telemetry` | Persistent engagement stats |
| `journey_progress` | Per-session journey state |

---

## Test Coverage Assessment

### Current Test State

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Unit | 3 | ~15 | Schema validation, health checks |
| Integration | 0 | 0 | No integration tests yet |
| E2E | 8 | ~25 | Terminal, Genesis, navigation |

### Test Quality

- [x] Tests verify behavior (`toBeVisible()`, `toBeEnabled()`)
- [x] Tests use semantic queries (role, text content)
- [ ] Tests report to Health system (not yet configured)

### Test Gaps

| Area | Current Coverage | Gap |
|------|------------------|-----|
| Telemetry system | None | Being created in this sprint |
| Session stages | None | Being created in this sprint |
| Prompt selection | None | Being created in this sprint |
| Journey framework | None | Being created in this sprint |
| Server sync | None | Being created in this sprint |

### Baseline Tests

Visual regression baselines exist for:
- Genesis page
- Terminal workspace (partial)

No baselines needed for this sprint (no visual changes to protected surfaces).

---

## Technical Debt Identified

### TD-1: Static Prompts in Quantum Interface

**Issue:** Prompts are flat strings in `SUPERPOSITION_MAP`, not structured objects.

**Impact:** Can't add metadata (intent, routing, dynamic variables).

**Mitigation:** New `SuggestedPrompt` schema with richer structure; TerminalWelcome uses new schema.

### TD-2: No Exchange Counting

**Issue:** Chat exchanges not counted or exposed.

**Impact:** Can't compute stage from engagement depth.

**Mitigation:** Add exchange tracking in chat handler, emit to TelemetryCollector.

### TD-3: No Topic Tracking

**Issue:** Hub/topic navigation not recorded.

**Impact:** Can't show "topics explored" or suggest underexplored areas.

**Mitigation:** TelemetryCollector tracks topic events from navigation.

---

## Dependencies Analysis

### server-side-capture-v1 (REQUIRED)

Sprint depends on:
- `lib/supabase.js` — Supabase client for server persistence
- `src/lib/session.ts` — Session ID management
- Express route patterns — API design conventions

**Status:** Reported complete. Verify before execution.

### Quantum Interface (EXISTING)

Sprint extends:
- `useQuantumInterface()` hook pattern
- `LensReality` type structure
- Content-by-lens reactivity

No modifications to existing pattern; only extension.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Telemetry performance overhead | Low | Medium | Debounce updates, batch server sync |
| Stage computation complexity | Low | Low | Clear thresholds, unit tests |
| Journey implicit entry false positives | Medium | Low | Conservative regex patterns |
| localStorage bloat | Low | Low | Prune old sessions, size limits |
| Server sync failures | Medium | Low | Automatic localStorage fallback |

---

## Verification Commands

```bash
# Check server-side-capture files exist
ls lib/supabase.js lib/embeddings.js src/lib/session.ts

# Check Supabase connection
curl -X GET "https://cntzzxqgqsjzsvscunsp.supabase.co/rest/v1/sprouts?limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Build passes
npm run build
```

---

## Conclusion

Repository is ready for adaptive-engagement-v1. Key dependencies (server-side-capture) are in place. Primary work is creating new telemetry infrastructure that integrates with existing Quantum Interface and session systems.

---

*Foundation Loop v2.0 — Phase 1: Repository Audit*
