# Architecture Decisions: 4D Prompt Telemetry
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Date:** 2025-01-05

---

## ADR-001: Strangler Fig Over Direct Modification

### Context
The marketing MVP (Genesis/Terminal/Foundation) is live and serving users. We need to add telemetry infrastructure without breaking existing functionality.

### Decision
**Use the strangler fig pattern**: Build new infrastructure in bedrock that wraps around existing code via adapters. The marketing MVP prompt files remain untouched.

### Consequences
- ✅ Zero risk to live marketing site
- ✅ Clean separation between reference implementation and MVP
- ✅ Can iterate on telemetry without affecting users
- ⚠️ Slight code duplication until eventual migration
- ⚠️ Adapter layer adds indirection

### Alternatives Considered
1. **Direct modification of prompt files**: Rejected—too risky for live system
2. **Feature flags in existing code**: Rejected—pollutes MVP codebase
3. **Parallel prompt system**: Rejected—unnecessary complexity

---

## ADR-002: Telemetry in Bedrock, Not Explore

### Context
Telemetry is foundational infrastructure that multiple layers will consume. Where should it live?

### Decision
**Place telemetry in `src/core/telemetry/`** as first-class bedrock infrastructure, not in the explore layer.

### Rationale
- Telemetry types are Grove objects (DEX-compliant)
- Multiple consumers: explore, admin panels, future analytics
- Core infrastructure belongs in core

### Consequences
- ✅ Clean dependency direction (explore → core)
- ✅ Reusable across layers
- ✅ Proper DEX object model
- ⚠️ Core layer grows (acceptable for foundational infrastructure)

---

## ADR-003: Batched Impressions, Immediate Selections

### Context
When prompts are displayed, we may show 3-5 at once. When a user selects, that's a single high-signal event.

### Decision
- **Impressions**: Batch into single API call (debounced 100ms)
- **Selections**: Submit immediately (no batching)
- **Completions**: Submit immediately

### Rationale
- Impressions are high-volume, low-urgency
- Selections are the key conversion metric—don't lose them
- Completions include outcome data that completes the telemetry chain

### Consequences
- ✅ Reduced API calls for impressions
- ✅ Selection data is durable
- ✅ Complete provenance chain
- ⚠️ Slight complexity in batching logic

---

## ADR-004: Context Snapshot Over Reference

### Context
When recording telemetry, should we store the full context state or just reference IDs?

### Decision
**Store full context snapshot** in each telemetry event (stage, lens, entropy, topics, moments).

### Rationale
- Context changes rapidly—references would require joins
- Analytics queries need denormalized data
- Storage is cheap; query complexity is expensive
- Enables time-travel analysis ("what was the context when this was shown?")

### Consequences
- ✅ Fast analytics queries
- ✅ Complete provenance
- ✅ No join complexity
- ⚠️ Larger row size (acceptable)
- ⚠️ Data duplication (intentional)

---

## ADR-005: Anonymous Telemetry Writes

### Context
Telemetry events come from frontend. Should we require authentication?

### Decision
**Allow anonymous inserts** to `prompt_telemetry` table via RLS policy. Read access restricted to service role.

### Rationale
- Telemetry collection should never fail due to auth issues
- Session ID provides sufficient correlation
- No PII in telemetry events
- Admin queries use service role anyway

### Consequences
- ✅ Telemetry never blocked by auth
- ✅ Simpler frontend implementation
- ✅ Read access properly restricted
- ⚠️ Potential for abuse (mitigated by rate limiting in future)

---

## ADR-006: View Over Materialized View for Performance

### Context
Aggregated prompt stats need to be queryable. Should we use a view or materialized view?

### Decision
**Start with a regular view** (`prompt_performance`). Migrate to materialized view if performance becomes an issue.

### Rationale
- Regular views are simpler to maintain
- Event volume is initially low
- Materialized views add refresh complexity
- Optimize when data proves we need it

### Consequences
- ✅ Simpler implementation
- ✅ Always fresh data
- ⚠️ May need optimization at scale
- ⚠️ Future migration to materialized view possible

---

## ADR-007: Scoring Details in Telemetry

### Context
Should telemetry include the scoring breakdown that determined prompt ranking?

### Decision
**Yes, include full scoring details** (finalScore, rank, matchDetails with component weights).

### Rationale
- Essential for understanding "why was this prompt shown?"
- Enables analysis of scoring algorithm effectiveness
- Supports future A/B testing of scoring weights
- Small storage cost for high diagnostic value

### Consequences
- ✅ Complete explainability
- ✅ Scoring algorithm validation
- ✅ A/B testing foundation
- ⚠️ Tight coupling to scoring interface (acceptable)

---

## ADR-008: Event Types as Const Array

### Context
How should telemetry event types be defined?

### Decision
**Define as const array** with derived type:
```typescript
const PROMPT_TELEMETRY_EVENT_TYPES = ['impression', 'selection', 'completion', 'feedback', 'skip'] as const;
type PromptTelemetryEventType = typeof PROMPT_TELEMETRY_EVENT_TYPES[number];
```

### Rationale
- Single source of truth
- Runtime enumerable (for validation)
- Type-safe at compile time
- Declarative (aligns with DEX)

### Consequences
- ✅ Type safety
- ✅ Runtime validation possible
- ✅ Declarative pattern
- ✅ Easy to extend

---

## ADR-009: Fail-Silent Telemetry

### Context
What happens when telemetry submission fails?

### Decision
**Log warning and continue**. Never throw, never block user experience.

### Rationale
- Telemetry is observability, not functionality
- Users shouldn't see errors for analytics failures
- Console warnings sufficient for debugging
- Retry logic adds complexity without proportional value

### Consequences
- ✅ User experience never degraded
- ✅ Simple error handling
- ⚠️ Some telemetry may be lost (acceptable)
- ⚠️ No retry queue (future enhancement if needed)

---

## ADR-010: Session ID from Existing Infrastructure

### Context
Telemetry needs a session identifier. Should we create a new one?

### Decision
**Use existing session ID** from the session management system already in place.

### Rationale
- Avoids ID proliferation
- Correlates telemetry with other session data
- Already available in context
- No new infrastructure needed

### Consequences
- ✅ Consistent session tracking
- ✅ Correlation with existing data
- ✅ No new ID management
- ⚠️ Dependency on session system

---

## Summary Table

| ADR | Decision | Primary Driver |
|-----|----------|----------------|
| 001 | Strangler fig pattern | Risk mitigation |
| 002 | Telemetry in bedrock | DEX compliance |
| 003 | Batch impressions, immediate selections | Performance + reliability |
| 004 | Full context snapshot | Query simplicity |
| 005 | Anonymous writes | Reliability |
| 006 | Regular view (not materialized) | Simplicity |
| 007 | Include scoring details | Explainability |
| 008 | Const array for event types | Type safety + declarative |
| 009 | Fail-silent | User experience |
| 010 | Reuse session ID | Consistency |
