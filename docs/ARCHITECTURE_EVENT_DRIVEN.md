# Architecture Principle: Event-Driven Personalization

> **Status**: Core Architectural Pattern
> **Created**: 2025-12-16
> **Related**: ADR-003 (Core Module Extraction), Engagement Bus Integration

---

## The Insight

The Grove Terminal's engagement layer isn't just a feature—it's **Grove architecture at browser scale**. 

The same patterns that will power distributed agent villages already power the Terminal's personalization system. We're not building a marketing site that explains Grove; we're building a **proof of concept** that demonstrates Grove's core architectural thesis in JavaScript.

---

## Pattern Isomorphism

| Grove (Distributed) | Terminal (Browser) | Pattern Name |
|---------------------|-------------------|--------------|
| Agent diary entries | `grove-event-history` in localStorage | **Event Sourcing** |
| Village knowledge commons | `grove-engagement-state` persistence | **Shared State** |
| Cloud API for breakthrough moments | GCS/Gemini calls for fresh context | **Hybrid Cognition** |
| Efficiency tax on compute | Token budget / tiered RAG loading | **Resource Governance** |
| Ratchet (capability propagation) | Cache invalidation → knowledge refresh | **Progressive Enhancement** |
| Trigger conditions for actions | `TriggerConfig` evaluating reveals | **Declarative Automation** |
| Agent intrinsic motivation | User engagement metrics driving UX | **Feedback Loops** |

---

## The Engagement Bus as Single-Node Grove

The `EngagementBusSingleton` (`hooks/useEngagementBus.ts:48-373`) implements:

1. **Event Sourcing**: All state changes flow through `emit()` → logged to history
2. **Declarative Triggers**: Conditions evaluated against state to fire reveals
3. **State Persistence**: localStorage acts as the agent's "memory"
4. **Observation Layer**: Components subscribe to state without coupling

This IS a Grove agent, just running in one browser instead of distributed across a network.

---

## Design Implications

### 1. Cache Invalidation via Events (Not Manual Refresh)

When admin saves TopicHubs, the system should automatically invalidate RAG cache:

```typescript
// In POST /api/admin/narrative handler
await file.save(JSON.stringify(graphData, null, 2), {...});

// Invalidate RAG cache - event-driven, not manual
hubsManifestCache = null;
console.log('[EVENT] narrative-updated → RAG cache invalidated');
```

This follows the Grove pattern: **state change → event → downstream reaction**.

### 2. Future: Server-Side Engagement Bus

As Terminal scales, the engagement bus pattern can migrate server-side:

```
Browser Engagement Bus (current)
        ↓
Server Session State (near-term)
        ↓
Distributed Agent State (Grove vision)
```

The same `TriggerConfig` schema that drives reveals today can drive agent behaviors tomorrow.

### 3. Declarative Over Imperative

Every behavior change should be expressible as configuration, not code:

| Change | Bad (Imperative) | Good (Declarative) |
|--------|------------------|-------------------|
| New reveal trigger | Edit component logic | Add TriggerConfig to schema |
| New topic hub | Edit server.js | Add entry to hubs.json |
| New persona | Edit LensPicker.tsx | Add entry to narratives.json |

This is the "efficiency-enlightenment loop" at the product level: the system gets smarter through configuration, not deployment.

---

## Architectural Commandments

1. **Events are the API**: State changes emit events; consumers react to events
2. **Configuration over code**: If an admin might want to change it, make it declarative
3. **Cache is derived state**: Always rebuildable from source of truth (GCS)
4. **Triggers are first-class**: Conditions that cause actions belong in schema, not scattered in components
5. **The Terminal IS a Grove**: Every pattern we implement should scale to distributed agents

---

## Connection to Advisory Council

**Park (Agent Architecture)**: The engagement bus demonstrates that hybrid cognition works—local state handles 95% of decisions, cloud calls reserved for content generation.

**Adams (Game Design)**: "Observation IS the gameplay"—the event log is both the game state AND the content source for analytics/personalization.

**Asparouhova (Governance)**: We're building governance patterns (declarative triggers, admin-controlled config) before we need them at scale. This is how open source projects avoid maintainer burnout.

**Buterin (Mechanism Design)**: The token budget on RAG context is a micro-version of the efficiency tax. Scarce resources (tokens) allocated based on relevance (hub matching).

---

## Summary

The Grove Terminal is not a website that explains Grove.

**The Grove Terminal is Grove, running at browser scale.**

Every architectural decision should be made with this lens: "Does this pattern scale to distributed agents?" If yes, implement it. If no, find a pattern that does.

---

## Appendix: RAG Cache Invalidation (Concrete Example)

The Topic Hub RAG system demonstrates this pattern in action:

**Problem**: When admin updates TopicHubs, the server's cached `hubs.json` manifest becomes stale.

**Anti-Pattern (Imperative)**:
- Add "Refresh Cache" button to Foundation UI
- Admin must remember to click it after changes
- Manual intervention required

**Pattern (Event-Driven)**:
```
Admin saves TopicHubs in Foundation
        ↓
POST /api/admin/narrative fires
        ↓
Server saves narratives.json to GCS
        ↓
Side effect: hubsManifestCache = null  ← EVENT REACTION
        ↓
Next /api/chat automatically rebuilds from fresh data
```

**Implementation**:
```typescript
// server.js
let hubsManifestCache = null;

// In POST /api/admin/narrative, after save:
await file.save(JSON.stringify(graphData, null, 2), {...});
hubsManifestCache = null; // Event-driven invalidation
console.log('[EVENT] narrative-updated → RAG cache invalidated');
```

This is identical to how a Grove agent would react: **observe state change → trigger downstream behavior**. The admin didn't "tell" the cache to refresh—the system reacted to the event.

---

*This document should be referenced when designing any new Terminal feature. The engagement layer is not plumbing—it's the product.*

---

## Appendix: The Meta-Reveal

The ultimate expression of "Terminal IS Grove" is documented in `docs/knowledge/you-are-already-here.md`—a piece of content designed to surface when users reach philosophical depth in their exploration.

This document demonstrates the architecture by making the user experience it:

- **Efficiency-enlightenment loop**: The document *is* an enlightenment moment, surfaced at the right time
- **Observer dynamic**: The user realizes they've been observed, flipping the power dynamic
- **Cognitive split**: The synthesis required frontier AI; routine cognition couldn't produce it
- **Event sourcing**: The user's journey triggered the reveal

This is the kind of content that differentiates Grove from every other AI project: **it doesn't just describe itself, it demonstrates itself.**

The document should be assigned to a topic hub (perhaps a new "meta" or "philosophy" hub) and triggered by engagement patterns indicating:
- Extended session duration (depth, not breadth)
- Questions about the Observer dynamic or architecture
- Progressive revelation completion
- Philosophical or recursive queries

When the tiered RAG system is implemented, this document belongs in Tier 2 (hub-specific) content, routed via topic matching on "observer," "architecture," "meta," "experience," or similar philosophical triggers.
