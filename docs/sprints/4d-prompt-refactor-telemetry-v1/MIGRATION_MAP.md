# Migration Map: 4D Prompt Telemetry
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Pattern:** Strangler Fig

---

## Overview

This migration follows the **strangler fig pattern**: new infrastructure wraps around existing code without modifying it. The marketing MVP continues working unchanged while bedrock telemetry infrastructure is built alongside.

```
Phase 1: Build Foundation (No user-facing changes)
    ↓
Phase 2: Wire Adapters (Telemetry starts flowing)
    ↓
Phase 3: Add Visibility (Admin can see metrics)
    ↓
[Future] Phase 4: Feedback Loop (Scoring uses telemetry)
```

---

## Phase 1: Build Foundation

**Goal:** Create telemetry infrastructure in bedrock with zero impact on marketing MVP.

### 1.1 Database Schema

| Task | File | Status |
|------|------|--------|
| Create migration file | `supabase/migrations/006_prompt_telemetry.sql` | 🔲 |
| Define `prompt_telemetry` table | (in migration) | 🔲 |
| Create `prompt_performance` view | (in migration) | 🔲 |
| Configure RLS policies | (in migration) | 🔲 |
| Push to Supabase | `npx supabase db push` | 🔲 |

### 1.2 Core Types

| Task | File | Status |
|------|------|--------|
| Create telemetry directory | `src/core/telemetry/` | 🔲 |
| Define event types | `src/core/telemetry/types.ts` | 🔲 |
| Export from index | `src/core/telemetry/index.ts` | 🔲 |

### 1.3 API Client

| Task | File | Status |
|------|------|--------|
| Create API client | `src/core/telemetry/client.ts` | 🔲 |
| Create batching utility | `src/core/telemetry/batch.ts` | 🔲 |

### 1.4 Server Endpoints

| Task | File | Status |
|------|------|--------|
| Add POST /api/telemetry/prompt | `server.js` | 🔲 |
| Add POST /api/telemetry/prompt/batch | `server.js` | 🔲 |
| Add GET /api/telemetry/prompt/:id/stats | `server.js` | 🔲 |
| Add GET /api/telemetry/prompts/performance | `server.js` | 🔲 |

### 1.5 React Hook

| Task | File | Status |
|------|------|--------|
| Create telemetry hook | `src/core/telemetry/usePromptTelemetry.ts` | 🔲 |

**Phase 1 Validation:**
- [ ] Migration runs without errors
- [ ] Endpoints respond correctly (test with curl/Postman)
- [ ] Types compile without errors
- [ ] Marketing MVP still works (smoke test)

---

## Phase 2: Wire Adapters

**Goal:** Connect telemetry hooks to existing prompt display/selection points.

### 2.1 Identify Integration Points

| Component | Location | Event |
|-----------|----------|-------|
| Prompt suggestion hook | `src/explore/hooks/usePromptSuggestions.ts` | impressions |
| Prompt selection handler | (varies by component) | selection |
| Chat completion handler | (varies by component) | completion |

### 2.2 Add Telemetry Wiring

| Task | Location | Status |
|------|----------|--------|
| Import usePromptTelemetry | Integration components | 🔲 |
| Call recordImpressions on prompt display | Suggestion hook/component | 🔲 |
| Call recordSelection on click | Selection handlers | 🔲 |
| Call recordCompletion after AI response | Chat handler | 🔲 |

### 2.3 Session ID Plumbing

| Task | Notes | Status |
|------|-------|--------|
| Verify session ID available | Check existing session context | 🔲 |
| Pass session ID to telemetry hook | May need context propagation | 🔲 |

**Phase 2 Validation:**
- [ ] Telemetry events appear in database
- [ ] Events have correct context data
- [ ] No console errors
- [ ] Marketing MVP still works (smoke test)

---

## Phase 3: Add Visibility

**Goal:** Operators can view prompt performance metrics.

### 3.1 Admin Interface Options

**Option A: Extend PipelineMonitor**
- Add "Prompt Performance" tab
- Show table of prompts with metrics
- Leverage existing copilot infrastructure

**Option B: Standalone Dashboard**
- New route `/admin/prompts`
- Dedicated telemetry visualization
- More flexibility, more work

**Recommended:** Option A (PipelineMonitor extension)

### 3.2 Implementation Tasks

| Task | Location | Status |
|------|----------|--------|
| Create PromptPerformance component | `src/admin/` or copilot | 🔲 |
| Fetch from /api/telemetry/prompts/performance | Component | 🔲 |
| Display metrics table | Component | 🔲 |
| Add sorting/filtering | Component | 🔲 |

**Phase 3 Validation:**
- [ ] Admin can see prompt performance metrics
- [ ] Metrics update as new telemetry flows
- [ ] UI is usable and informative

---

## Phase 4: Feedback Loop (Future Sprint)

**Goal:** Scoring algorithm uses telemetry to improve prompt surfacing.

### 4.1 Scoring Enhancement

| Task | Notes | Status |
|------|-------|--------|
| Load prompt stats in scoring | Fetch from API or cache | 🔲 |
| Factor selection rate into score | Boost high-performers | 🔲 |
| Factor entropy delta into score | Prefer prompts that reduce entropy | 🔲 |
| A/B test scoring changes | Feature flag system | 🔲 |

### 4.2 Feedback Integration

| Task | Notes | Status |
|------|-------|--------|
| Add user feedback UI | Thumbs up/down on prompts | 🔲 |
| Record feedback events | New event type | 🔲 |
| Factor feedback into scoring | Weight by explicit signal | 🔲 |

**Phase 4 is explicitly OUT OF SCOPE for this sprint.**

---

## File Change Summary

### New Files (Bedrock)

```
src/core/telemetry/
├── types.ts           # PromptTelemetryEvent, EventType, etc.
├── client.ts          # submitTelemetryEvent, getPromptStats
├── batch.ts           # createTelemetryBatcher
├── usePromptTelemetry.ts  # React hook
└── index.ts           # Re-exports

supabase/migrations/
└── 006_prompt_telemetry.sql  # Schema + RLS
```

### Modified Files

```
server.js              # Add telemetry endpoints (4 endpoints)
```

### Integration Points (Light Touch)

```
src/explore/hooks/usePromptSuggestions.ts  # Add recordImpressions call
[Component displaying prompts]             # Add recordSelection call  
[Chat completion handler]                  # Add recordCompletion call
```

### NOT Modified (Marketing MVP Protected)

```
src/data/prompts/base.prompts.json         # ❌ No changes
src/data/prompts/wayne-turner.prompts.json # ❌ No changes
src/data/prompts/dr-chiang.prompts.json    # ❌ No changes
src/data/prompts/stage-prompts.ts          # ❌ No changes
src/data/prompts/index.ts                  # ❌ No changes
```

---

## Rollback Plan

### If Phase 1 Fails
- Drop migration: `supabase migration repair --status reverted 006_prompt_telemetry`
- Delete `src/core/telemetry/` directory
- Remove endpoints from server.js

### If Phase 2 Fails
- Remove telemetry hook imports from integration points
- Core infrastructure remains (can retry wiring)

### If Phase 3 Fails
- Remove admin UI component
- Telemetry continues flowing (just not visible)

---

## Success Criteria

| Phase | Criterion | Verification |
|-------|-----------|--------------|
| 1 | Schema deployed | Query `prompt_telemetry` table |
| 1 | Endpoints working | curl tests return 2xx |
| 2 | Telemetry flowing | Events appear in database |
| 2 | Context captured | Events have stage/lens/entropy |
| 3 | Metrics visible | Admin can view performance table |
| All | MVP unchanged | Terminal still works |
