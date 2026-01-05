# Execution Prompt: 4D Prompt Telemetry Sprint
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Handoff Date:** 2025-01-05

---

## Context for Execution Agent

You are implementing telemetry infrastructure for the Grove Terminal's 4D prompt system. This is a **reference implementation** for the 1.0 release, following Trellis Architecture and DEX principles.

### Critical Constraints

1. **STRANGLER FIG**: The marketing MVP is live. Do NOT modify:
   - `src/data/prompts/*.json` files
   - `src/data/prompts/index.ts`
   - Existing Terminal/Foundation components

2. **BEDROCK FIRST**: All new code goes in `src/core/telemetry/`. This is foundational infrastructure.

3. **NON-BLOCKING**: Telemetry failures must never break user experience. Log warnings, don't throw.

4. **DEX COMPLIANCE**: Types should be declarative (const arrays over enums), provenance traceable.

---

## Live Status

| Phase | Status |
|-------|--------|
| Sprint artifacts | ✅ Complete |
| Database schema | 🔲 Not started |
| Core types | 🔲 Not started |
| API endpoints | 🔲 Not started |
| React hook | 🔲 Not started |
| Integration wiring | 🔲 Not started |

---

## Execution Sequence

### Step 1: Database Schema

Create `supabase/migrations/006_prompt_telemetry.sql`:

```sql
-- Full schema in ARCHITECTURE.md Section 3.1
-- Key elements:
-- - prompt_telemetry table with all context/scoring/outcome columns
-- - prompt_performance view for aggregations
-- - Indexes on prompt_id, session_id, timestamp
-- - RLS: anonymous insert, service_role select
```

**Verify:**
```bash
npx supabase db push
# Then test with:
# INSERT INTO prompt_telemetry (event_type, prompt_id, session_id) VALUES ('impression', 'test', gen_random_uuid());
```

### Step 2: Core Types

Create `src/core/telemetry/types.ts`:

```typescript
// From ARCHITECTURE.md Section 2.1
// Key types:
// - PROMPT_TELEMETRY_EVENT_TYPES const array
// - PromptTelemetryEventType derived type
// - PromptTelemetryEvent interface
// - TelemetryContext, TelemetryScoringDetails, TelemetryOutcome
// - PromptStats (for API responses)
```

Create `src/core/telemetry/index.ts`:
```typescript
export * from './types';
export * from './client';
export * from './batch';
export { usePromptTelemetry } from './usePromptTelemetry';
```

### Step 3: API Client

Create `src/core/telemetry/client.ts`:

```typescript
// From ARCHITECTURE.md Section 2.2
// Functions:
// - submitTelemetryEvent(event) -> { id, status }
// - submitTelemetryBatch(events) -> { count, status }
// - getPromptStats(promptId) -> PromptStats
// - listPromptPerformance(options) -> { prompts, total }
```

Create `src/core/telemetry/batch.ts`:

```typescript
// From ARCHITECTURE.md Section 2.3
// - createTelemetryBatcher({ maxSize, flushDelayMs, onError })
// - Returns { add, flush }
```

### Step 4: Server Endpoints

Add to `server.js` (find appropriate section, likely near existing API endpoints):

```javascript
// From ARCHITECTURE.md Section 4.1
// Endpoints:
// - POST /api/telemetry/prompt
// - POST /api/telemetry/prompt/batch
// - GET /api/telemetry/prompt/:promptId/stats
// - GET /api/telemetry/prompts/performance
```

**Verify:**
```bash
curl -X POST http://localhost:3001/api/telemetry/prompt \
  -H "Content-Type: application/json" \
  -d '{"eventType":"impression","promptId":"test","sessionId":"00000000-0000-0000-0000-000000000000","context":{"stage":"genesis","entropy":0.5}}'
```

### Step 5: React Hook

Create `src/core/telemetry/usePromptTelemetry.ts`:

```typescript
// From ARCHITECTURE.md Section 2.4
// Hook with:
// - recordImpressions(scoredPrompts, context) - batched
// - recordSelection(promptId) - immediate
// - recordCompletion(promptId, outcome) - immediate
// - Stores context in ref for selection events
// - Flushes on unmount
```

### Step 6: Integration Wiring (Careful)

This is the only step that touches existing code. Be surgical.

**Find the prompt suggestion hook or component:**
- Look for `usePromptSuggestions` in `src/explore/`
- Or find where `ScoredPrompt[]` is rendered

**Add telemetry:**
```typescript
import { usePromptTelemetry } from '@core/telemetry';

// In component:
const { recordImpressions, recordSelection } = usePromptTelemetry({
  sessionId: session?.id ?? 'anonymous',
});

// When prompts are displayed:
useEffect(() => {
  if (scoredPrompts.length > 0) {
    recordImpressions(scoredPrompts, contextState);
  }
}, [scoredPrompts]);

// When prompt is clicked:
const handleSelect = (prompt) => {
  recordSelection(prompt.id);
  // ... existing selection logic
};
```

**If session ID isn't available:**
- Generate a transient ID: `useRef(crypto.randomUUID())`
- Or wire through existing session context

---

## Validation Checklist

### Foundation (Must Pass)
- [ ] Migration runs: `npx supabase db push` succeeds
- [ ] Types compile: `npm run typecheck` passes
- [ ] Endpoints respond: curl tests return 2xx
- [ ] Hook compiles: No TypeScript errors

### Integration (Must Pass)
- [ ] Events in database: Check `prompt_telemetry` table after browsing Terminal
- [ ] Context captured: Events have stage, lens, entropy values
- [ ] Marketing MVP works: Terminal still loads, prompts display

### Quality (Should Pass)
- [ ] Impressions batched: Multiple prompts → single API call
- [ ] Selections immediate: Click → instant database write
- [ ] Errors silent: Disable server, verify no UI errors

---

## Reference Files

**Full Specifications:**
- `docs/sprints/4d-prompt-refactor-telemetry-v1/SPEC.md`
- `docs/sprints/4d-prompt-refactor-telemetry-v1/ARCHITECTURE.md`

**Decision Rationale:**
- `docs/sprints/4d-prompt-refactor-telemetry-v1/DECISIONS.md`

**Story Details:**
- `docs/sprints/4d-prompt-refactor-telemetry-v1/SPRINTS.md`

**Migration Plan:**
- `docs/sprints/4d-prompt-refactor-telemetry-v1/MIGRATION_MAP.md`

---

## Attention Anchors

Before each major step, re-read:

1. **Strangler fig**: Am I modifying marketing MVP files? (If yes, STOP)
2. **Non-blocking**: Can telemetry failure break the user? (If yes, add try/catch)
3. **DEX compliance**: Are types declarative? Is provenance traceable?

---

## If You Get Stuck

1. **Types don't align**: Check `src/core/context-fields/types.ts` for existing interfaces
2. **Session ID unavailable**: Use anonymous ID, document for future fix
3. **Scoring details missing**: Check `src/explore/utils/scorePrompt.ts` for shape
4. **Supabase errors**: Verify RLS policies allow anonymous inserts

---

## Completion Criteria

**Sprint is DONE when:**
- [ ] Can see telemetry events in `prompt_telemetry` table
- [ ] Events include context (stage, lens, entropy)
- [ ] Events include scoring (finalScore, rank)
- [ ] Marketing Terminal still works
- [ ] All TypeScript compiles

**Sprint is SUCCESSFUL when:**
- [ ] Selection rate calculable per prompt
- [ ] Admin can query prompt performance
- [ ] Foundation laid for feedback loop (future sprint)
