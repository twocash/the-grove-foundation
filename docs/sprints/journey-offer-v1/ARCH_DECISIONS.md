# ARCH_DECISIONS.md — journey-offer-v1

## ADR-001: Symmetric Architecture with Lens Offers

**Context:** Journey recommendations need inline presentation in the stream.

**Decision:** Mirror the lens-offer-v1 architecture exactly:
- Same StreamItem discriminated union pattern
- Same parser extraction approach
- Same component structure with GlassContainer

**Rationale:** Consistency reduces cognitive load. Both are "context suggestions" that change the user's experience mode.

**Consequences:** Easy to maintain, predictable patterns, shared styling infrastructure.

---

## ADR-002: Distinct Visual Identity

**Context:** Users need to distinguish journey offers from lens offers at a glance.

**Decision:** Use differentiated styling:
- **Lens offers:** Green accent (`--grove-forest`), lens/target icon
- **Journey offers:** Cyan accent (`--neon-cyan`), compass icon

**Rationale:** Color coding provides instant recognition. Both fit the glass aesthetic.

**Consequences:** Users can quickly understand offer type without reading.

---

## ADR-003: Duration Display

**Context:** Journeys have `estimatedMinutes` - users benefit from knowing commitment level.

**Decision:** Display duration prominently on journey offers when available.

**Format:** "~15 min journey" or similar

**Rationale:** Reduces friction by setting expectations. Lens offers don't have duration (they're mode switches, not timed experiences).

**Consequences:** Journey offers need to handle missing duration gracefully.

---

## ADR-004: Accept Triggers engStartJourney

**Context:** Accepting a journey offer should start the journey.

**Decision:** `onJourneyAccept(journeyId)` in ExploreShell:
1. Looks up journey via `getCanonicalJourney(journeyId, schema)`
2. Calls `engStartJourney(journey)` (XState transition)
3. Emits analytics via `emit.journeyStarted()`

**Rationale:** Reuses existing journey infrastructure. No new state management needed.

**Consequences:** Journey must exist in registry. Log warning if missing.

---

## ADR-005: Parser Extracts from Response Content

**Context:** LLM generates `<journey_offer />` tags inline.

**Decision:** Parse during response processing, similar to navigation blocks:
```typescript
const { offer: journeyOffer, cleanContent } = parseJourneyOffer(content, responseId);
```

**Rationale:** Same flow as lens offers. Clean separation of parsing from rendering.

**Consequences:** Need to wire parser into useKineticStream or ExploreShell response handling.

---

## DEX Compliance Notes

**Declarative Sovereignty:** Journey definitions live in schema, not code.

**Capability Agnosticism:** Works regardless of which AI generates the offer.

**Provenance as Infrastructure:** Offer tracks sourceResponseId for context.

**Organic Scalability:** Adding new journeys requires only schema updates.
