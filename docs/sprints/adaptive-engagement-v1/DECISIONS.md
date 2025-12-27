# Architecture Decision Records — adaptive-engagement-v1

**Sprint:** `adaptive-engagement-v1`  
**Created:** 2025-12-27

---

## ADR-001: Session Telemetry as New Pattern

### Context

Grove needs to adapt content based on user engagement depth. The Quantum Interface (Pattern 1) handles lens-based content variation, but not engagement-based variation. A first-time visitor should see different prompts than a returning power user.

### Decision

Create **Pattern 11: Session Engagement Telemetry** as a new pattern that:
- Tracks engagement signals (visits, exchanges, topics, sprouts)
- Computes engagement stage (ARRIVAL → ORIENTED → EXPLORING → ENGAGED)
- Provides stage as input to prompt selection

### Rationale

1. **Existing patterns insufficient:** Quantum Interface collapses on lens, not engagement. Pattern 2 (Engagement Machine) handles state transitions, not engagement measurement.

2. **DEX compliance verified:**
   - Declarative Sovereignty: Stage thresholds in config
   - Capability Agnosticism: Observation-based, not model-dependent
   - Provenance: Timestamps, sources recorded
   - Organic Scalability: Works with defaults

3. **Clean separation:** Telemetry observes; prompts consume. No tight coupling.

### Consequences

- New files: `src/lib/telemetry/`, `hooks/useSessionTelemetry.ts`
- Pattern catalog updated: PROJECT_PATTERNS.md will include Pattern 11
- Future extensions: Per-lens stage tuning, A/B testing

### Status

**Approved** — Pattern 11 is approved for implementation.

---

## ADR-002: Stage Computation Thresholds

### Context

How do we define when a user transitions from ARRIVAL to ORIENTED, from ORIENTED to EXPLORING, etc.?

### Decision

Use declarative thresholds with these defaults:

| Transition | Threshold |
|------------|-----------|
| → ORIENTED | 3 exchanges OR 2+ visits (returning user) |
| → EXPLORING | 5 exchanges OR 2+ topics touched |
| → ENGAGED | 1+ sprout captured OR (3+ visits AND 15+ total exchanges) |

### Rationale

1. **Multiple paths:** Different users engage differently. Some ask many questions; some explore topics; some return often.

2. **Low barrier to ORIENTED:** 3 exchanges is achievable in first session. Returning users skip ARRIVAL entirely.

3. **Sprout as strong signal:** Capturing a sprout is explicit contribution, deserves ENGAGED status.

4. **Power user path:** 15+ total exchanges across 3+ visits = invested user even without sprouts.

### Alternatives Considered

1. **Time-based thresholds:** Rejected. Time spent doesn't equal engagement.
2. **Single metric:** Rejected. Engagement is multidimensional.
3. **ML-based classification:** Rejected. Overcomplicated for MVP; thresholds are understandable.

### Consequences

- Thresholds are tunable per lens (future)
- May need adjustment based on real usage data
- Clear, debuggable stage computation

### Status

**Approved**

---

## ADR-003: Journey Implicit Entry via Pattern Matching

### Context

Should journeys only start when users explicitly click "Start Journey"? Or can users enter journeys implicitly by asking relevant questions?

### Decision

Support **both explicit and implicit entry**:

1. **Explicit:** User clicks "Start Journey" → journey begins at waypoint 0
2. **Implicit:** User asks question matching waypoint pattern → ambient tracking begins

### Rationale

1. **Natural discovery:** Users asking "What is The Grove?" are already on the "Understanding Grove" journey—they just don't know it.

2. **Progressive disclosure:** Don't force journey structure on users who want to explore freely. Track progress silently.

3. **Opt-in deepening:** After implicit progress, offer: "You've explored 3/5 topics in this journey. Want to complete it?"

### Implementation

```typescript
interface JourneyWaypoint {
  entryPatterns?: string[];  // Regex patterns for implicit entry
  // e.g., ["why.*grove", "purpose.*distributed"]
}
```

### Alternatives Considered

1. **Explicit only:** Rejected. Misses organic explorers.
2. **Implicit only:** Rejected. Users who want structure should get it.
3. **Semantic matching (embeddings):** Deferred. Pattern matching is simpler for MVP.

### Consequences

- Regex patterns need careful design (avoid false positives)
- Telemetry tracks `explicit: boolean` for analysis
- UX shows subtle progress even for implicit journeys

### Status

**Approved**

---

## ADR-004: Prompt Selection Algorithm

### Context

How do we select which prompts to show from the available pool?

### Decision

Multi-factor filtering and ranking:

1. **Filter by stage:** Only prompts matching current stage
2. **Filter by lens affinity:** Only prompts allowed for current lens
3. **Filter by lens exclude:** Remove prompts excluded for current lens
4. **Sort by weight:** Higher weight = more prominent
5. **Substitute variables:** Replace `{lastTopic}`, `{lensName}`, etc.
6. **Limit count:** Return top N prompts (e.g., 3-4)

### Rationale

1. **Stage-first:** Core adaptive behavior
2. **Lens refinement:** Same stage, different framing per audience
3. **Weights for control:** Domain experts can prioritize without code
4. **Dynamic variables:** Personalization without hardcoding

### Alternatives Considered

1. **Random selection:** Rejected. Not adaptive.
2. **ML-based recommendation:** Deferred. Overcomplicated for MVP.
3. **User preference learning:** Deferred. Requires more history.

### Consequences

- Algorithm is deterministic given same inputs
- Easy to test and debug
- Future: Add A/B testing layer

### Status

**Approved**

---

## ADR-005: Server Sync Strategy

### Context

When and how should client telemetry sync to server?

### Decision

**Debounced sync with localStorage fallback:**

1. Telemetry updates → localStorage immediately
2. After 30 seconds of no updates → sync to server
3. On page unload → attempt sync
4. On failure → localStorage persists until next successful sync
5. On page load → merge server + local (server wins on conflict)

### Rationale

1. **Reliability first:** localStorage ensures no data loss
2. **Efficiency:** Debouncing prevents API spam
3. **Conflict resolution:** Server is source of truth for cross-device
4. **Graceful degradation:** Works offline, syncs when online

### Alternatives Considered

1. **Sync every update:** Rejected. Too many API calls.
2. **Sync on page unload only:** Rejected. Unload events unreliable.
3. **WebSocket real-time:** Deferred. Overkill for telemetry.

### Consequences

- Slight delay in cross-device sync (30s debounce)
- localStorage cleanup needed for old sessions
- Server API must handle idempotent updates

### Status

**Approved**

---

## ADR-006: Testing Strategy

### Context

How should we test adaptive engagement?

### Decision

**Three-layer testing:**

1. **Unit tests:** Stage computation, prompt filtering, variable substitution
2. **Integration tests:** Hook behavior, telemetry flow
3. **E2E tests:** User journeys through stage progression

### Key Test Scenarios

| Test | Type | Verification |
|------|------|--------------|
| Stage computation correctness | Unit | Thresholds work |
| Returning user starts ORIENTED | E2E | localStorage simulated |
| Lens switch updates prompts | E2E | UI responds |
| Journey implicit entry | E2E | Pattern matching works |
| Server sync on debounce | Integration | API called after delay |

### Rationale

1. **Unit for logic:** Stage computation is pure function, easy to test
2. **E2E for UX:** User-visible behavior is what matters
3. **Integration for wiring:** Hook + storage + sync

### Consequences

- Test files parallel production files
- E2E tests may need localStorage manipulation
- CI runs all layers

### Status

**Approved**

---

## Summary Table

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Session Telemetry as Pattern 11 | Approved |
| 002 | Declarative stage thresholds | Approved |
| 003 | Implicit + explicit journey entry | Approved |
| 004 | Multi-factor prompt selection | Approved |
| 005 | Debounced server sync with fallback | Approved |
| 006 | Three-layer testing strategy | Approved |

---

*Foundation Loop v2.0 — Phase 5: Decisions*
