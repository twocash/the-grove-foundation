# Story Breakdown: 4D Prompt Telemetry
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Duration:** 1-2 days  
**Tier:** Sprint

---

## Epic 1: Database Foundation

### Story 1.1: Create Telemetry Schema
**Points:** 2  
**Priority:** P0 (Blocking)

**As a** developer  
**I want** a database schema for prompt telemetry  
**So that** events can be persisted and queried

**Tasks:**
- [ ] Create migration file `006_prompt_telemetry.sql`
- [ ] Define `prompt_telemetry` table with all columns
- [ ] Add indexes for common queries
- [ ] Create `prompt_performance` view
- [ ] Configure RLS policies (anonymous insert, service read)
- [ ] Push migration to Supabase

**Acceptance Criteria:**
- [ ] Migration runs without errors
- [ ] Can insert test row via SQL
- [ ] View returns aggregated data
- [ ] RLS allows anonymous inserts

**Files:**
- `supabase/migrations/006_prompt_telemetry.sql`

---

## Epic 2: Core Telemetry Types

### Story 2.1: Define Telemetry Types
**Points:** 1  
**Priority:** P0 (Blocking)

**As a** developer  
**I want** typed interfaces for telemetry events  
**So that** the system is type-safe and self-documenting

**Tasks:**
- [ ] Create `src/core/telemetry/` directory
- [ ] Define `PromptTelemetryEventType` const array
- [ ] Define `PromptTelemetryEvent` interface
- [ ] Define `TelemetryContext` interface
- [ ] Define `TelemetryScoringDetails` interface
- [ ] Define `TelemetryOutcome` interface
- [ ] Define `PromptStats` interface
- [ ] Create index.ts with re-exports

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Types align with database schema
- [ ] Exported from core/telemetry

**Files:**
- `src/core/telemetry/types.ts`
- `src/core/telemetry/index.ts`

---

## Epic 3: API Layer

### Story 3.1: Create API Client
**Points:** 2  
**Priority:** P0 (Blocking)

**As a** frontend component  
**I want** an API client for telemetry operations  
**So that** I can submit and query telemetry

**Tasks:**
- [ ] Create `submitTelemetryEvent` function
- [ ] Create `submitTelemetryBatch` function
- [ ] Create `getPromptStats` function
- [ ] Create `listPromptPerformance` function
- [ ] Add error handling (throw on non-2xx)

**Acceptance Criteria:**
- [ ] Functions return typed responses
- [ ] Error handling works correctly
- [ ] Query params properly encoded

**Files:**
- `src/core/telemetry/client.ts`

---

### Story 3.2: Create Batching Utility
**Points:** 1  
**Priority:** P1

**As a** telemetry consumer  
**I want** batched submission of impressions  
**So that** API calls are efficient

**Tasks:**
- [ ] Create `createTelemetryBatcher` function
- [ ] Implement queue with max size
- [ ] Implement flush delay
- [ ] Implement error callback
- [ ] Expose add() and flush() methods

**Acceptance Criteria:**
- [ ] Batches flush after delay or max size
- [ ] Errors don't break queue
- [ ] Clean up on unmount

**Files:**
- `src/core/telemetry/batch.ts`

---

### Story 3.3: Create Server Endpoints
**Points:** 3  
**Priority:** P0 (Blocking)

**As a** frontend client  
**I want** API endpoints for telemetry  
**So that** events can be persisted

**Tasks:**
- [ ] Add `POST /api/telemetry/prompt` endpoint
- [ ] Add `POST /api/telemetry/prompt/batch` endpoint
- [ ] Add `GET /api/telemetry/prompt/:id/stats` endpoint
- [ ] Add `GET /api/telemetry/prompts/performance` endpoint
- [ ] Validate request bodies
- [ ] Handle Supabase errors gracefully

**Acceptance Criteria:**
- [ ] Endpoints return correct status codes
- [ ] Validation rejects malformed requests
- [ ] Stats endpoint returns zeros for unknown prompts
- [ ] Performance endpoint supports sorting/limiting

**Files:**
- `server.js` (add ~150 lines)

---

## Epic 4: React Integration

### Story 4.1: Create Telemetry Hook
**Points:** 3  
**Priority:** P0 (Blocking)

**As a** React component  
**I want** a hook for recording telemetry  
**So that** I can instrument prompt display/selection

**Tasks:**
- [ ] Create `usePromptTelemetry` hook
- [ ] Implement `recordImpressions` (batched)
- [ ] Implement `recordSelection` (immediate)
- [ ] Implement `recordCompletion` (immediate)
- [ ] Store context in ref for selection events
- [ ] Flush batcher on unmount
- [ ] Add `enabled` flag for opt-out

**Acceptance Criteria:**
- [ ] Hook compiles without errors
- [ ] Impressions are batched
- [ ] Selections submit immediately
- [ ] Context preserved between calls
- [ ] No errors when disabled

**Files:**
- `src/core/telemetry/usePromptTelemetry.ts`

---

## Epic 5: Integration Wiring

### Story 5.1: Identify Integration Points
**Points:** 1  
**Priority:** P1

**As a** developer  
**I want** to identify where to wire telemetry  
**So that** integration is targeted and minimal

**Tasks:**
- [ ] Audit `usePromptSuggestions` for impression point
- [ ] Audit prompt display components for selection point
- [ ] Audit chat handler for completion point
- [ ] Document session ID availability
- [ ] Create integration checklist

**Acceptance Criteria:**
- [ ] Integration points documented
- [ ] Session ID source identified
- [ ] Minimal touch points identified

**Files:**
- Documentation only (or inline comments)

---

### Story 5.2: Wire Impression Recording
**Points:** 2  
**Priority:** P1

**As a** user viewing prompts  
**I want** impressions recorded  
**So that** we know which prompts were shown

**Tasks:**
- [ ] Import `usePromptTelemetry` at integration point
- [ ] Call `recordImpressions` when prompts are displayed
- [ ] Pass scored prompts and context state
- [ ] Verify events appear in database

**Acceptance Criteria:**
- [ ] Impressions recorded in database
- [ ] Context data correct
- [ ] Scoring data included
- [ ] No UI impact

**Files:**
- `src/explore/hooks/usePromptSuggestions.ts` or display component

---

### Story 5.3: Wire Selection Recording
**Points:** 2  
**Priority:** P1

**As a** user selecting a prompt  
**I want** selections recorded  
**So that** we know which prompts users choose

**Tasks:**
- [ ] Identify prompt click handler
- [ ] Call `recordSelection` on click
- [ ] Verify event appears in database
- [ ] Ensure selection happens even if telemetry fails

**Acceptance Criteria:**
- [ ] Selections recorded in database
- [ ] Context preserved from impressions
- [ ] Scoring details included
- [ ] Prompt execution not blocked

**Files:**
- Prompt display/selection component

---

### Story 5.4: Wire Completion Recording
**Points:** 2  
**Priority:** P2

**As a** system processing prompt completions  
**I want** completions recorded with outcomes  
**So that** we can measure prompt effectiveness

**Tasks:**
- [ ] Identify chat completion callback
- [ ] Calculate dwell time
- [ ] Calculate entropy delta
- [ ] Call `recordCompletion` with outcome
- [ ] Verify event appears in database

**Acceptance Criteria:**
- [ ] Completions recorded
- [ ] Dwell time reasonable
- [ ] Entropy delta calculated
- [ ] Follow-up prompt tracked (if applicable)

**Files:**
- Chat handler component

---

## Epic 6: Visibility (Should Have)

### Story 6.1: Create Performance View Component
**Points:** 3  
**Priority:** P2

**As an** operator  
**I want** to see prompt performance metrics  
**So that** I can understand which prompts work

**Tasks:**
- [ ] Create `PromptPerformancePanel` component
- [ ] Fetch from `/api/telemetry/prompts/performance`
- [ ] Display table with metrics
- [ ] Add sort by column
- [ ] Add filter by lens (optional)
- [ ] Integrate into PipelineMonitor or admin

**Acceptance Criteria:**
- [ ] Metrics visible in UI
- [ ] Table sortable
- [ ] Data refreshes
- [ ] Handles empty state

**Files:**
- `src/admin/PromptPerformancePanel.tsx` (or copilot component)

---

## Sprint Summary

| Epic | Stories | Points | Priority |
|------|---------|--------|----------|
| 1. Database Foundation | 1 | 2 | P0 |
| 2. Core Types | 1 | 1 | P0 |
| 3. API Layer | 3 | 6 | P0-P1 |
| 4. React Integration | 1 | 3 | P0 |
| 5. Integration Wiring | 4 | 7 | P1-P2 |
| 6. Visibility | 1 | 3 | P2 |
| **Total** | **11** | **22** | |

---

## Execution Order

### Day 1: Foundation
1. Story 1.1: Create Telemetry Schema (P0)
2. Story 2.1: Define Telemetry Types (P0)
3. Story 3.1: Create API Client (P0)
4. Story 3.3: Create Server Endpoints (P0)
5. Story 4.1: Create Telemetry Hook (P0)

### Day 2: Integration
6. Story 3.2: Create Batching Utility (P1)
7. Story 5.1: Identify Integration Points (P1)
8. Story 5.2: Wire Impression Recording (P1)
9. Story 5.3: Wire Selection Recording (P1)
10. Story 5.4: Wire Completion Recording (P2)
11. Story 6.1: Create Performance View (P2)

---

## Definition of Done

- [ ] All P0 stories complete
- [ ] At least impression and selection wired
- [ ] Telemetry events visible in database
- [ ] Marketing MVP still works
- [ ] No TypeScript errors
- [ ] Basic smoke test passes
