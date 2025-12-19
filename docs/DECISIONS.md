# DECISIONS (ADR Style)

## ADR-001: Adopt V2.1 Journey Graph as Sole Narrative Model
- **Context:** Dual support for V2.0 cards/threads and V2.1 journeys causes UX drift and token waste.
- **Decision:** Remove thread generation and enforce journey/node navigation with entropy-driven entry; personas remain tonal only via defaults.
- **Consequences:** Thread-related code deleted; session schema changes to journey state; Terminal/UI rewritten around nodes; admin tools must speak V2.1 natively.
- **Status:** ✅ IMPLEMENTED (Sprint 1-3)

## ADR-002: Retain Cognitive Bridge with V2.1 Hubs
- **Context:** Entropy detector already routes to topic hubs and suggests journeys; needs to operate without thread regeneration.
- **Decision:** Keep entropy evaluation and injection APIs, wiring them to `startJourney` and node navigation.
- **Consequences:** Bridge remains the entry point for guided journeys; requires node/journey lookup helpers and hub alignment.
- **Status:** ✅ IMPLEMENTED (Sprint 4-5)

## ADR-003: Remove V2.0 Admin Backfill
- **Context:** AdminDashboard rebuilds schemas into V2.0 cards to satisfy legacy editors, risking corrupt saves and blocking journey edits.
- **Decision:** Stop card backfill; provide journey/node/hub views/editors that persist V2.1 payloads directly.
- **Consequences:** Admin updates stay compatible with runtime; additional UI work needed for journey inspection/editing.
- **Status:** ✅ IMPLEMENTED (Sprint 2)

## ADR-004: Entropy State Persistence
- **Context:** Conversation depth and cooldowns need to survive page refresh to maintain UX continuity.
- **Decision:** Persist `EntropyState` in `localStorage` (`grove-terminal-entropy`) alongside the session.
- **Rationale:** Preserves the "Simulated Memory" effect across page reloads. If a user refreshes during a deep dive, we shouldn't reset them to "Low Entropy" immediately.
- **Consequences:** Schema changes must include defaults for backward compatibility.
- **Status:** ✅ IMPLEMENTED (Sprint 4)

## ADR-005: Inline Injection vs. Sidebar
- **Context:** How should we offer the journey when entropy threshold is reached?
- **Decision:** **Inline Injection** (Cognitive Bridge) between chat bubbles, not sidebar notification.
- **Rationale:** Sidebar notifications suffer from "banner blindness." Inline injection disrupts the flow intentionally at a natural pause, acting as a "breakthrough" moment that aligns with the "Cloud Injection" metaphor.
- **Consequences:** Bridge appears in chat stream; requires careful render timing after model response.
- **Status:** ✅ IMPLEMENTED (Sprint 5)

## ADR-006: 800ms Latency Animation
- **Context:** The Cognitive Bridge needs to communicate the hybrid cognition transition.
- **Decision:** Include 800ms "Resolving connection..." animation before showing journey card.
- **Rationale:** The delay is pedagogical, not functional. It makes the metaphor of "calling out to cloud cognition" visible. Too fast (< 500ms) feels trivial; too slow (> 1000ms) frustrates.
- **Consequences:** Animation must not block React render loop; uses `setTimeout` + state transition.
- **Status:** ✅ IMPLEMENTED (Sprint 5)

## ADR-007: Cooldown Mechanics
- **Context:** Repeated injection disrupts conversation flow and annoys users.
- **Decision:** 
  - 5-exchange cooldown after dismissal
  - Maximum 2 injections per session
  - Cooldown state persists across refresh
- **Rationale:** Mirrors resource economics in Grove communities—cloud access is scarce. Attention is the Terminal's equivalent scarce resource.
- **Consequences:** `EntropyState` tracks `cooldownRemaining` and `injectionCount`.
- **Status:** ✅ IMPLEMENTED (Sprint 4-5)

## ADR-008: Cluster-to-Journey Mapping
- **Context:** Entropy detector identifies dominant topic clusters; needs to route to appropriate journeys.
- **Decision:** Static mapping in `entropyDetector.ts`:
  - `ratchet` → `ratchet` journey
  - `economics` → `stakes` journey
  - `architecture` → `stakes` journey
  - `knowledge-commons` → `stakes` journey
  - `observer` → `simulation` journey
- **Rationale:** Three journeys cover current content. Multiple clusters can map to same journey (e.g., economics + architecture both go to stakes).
- **Consequences:** Adding new journeys requires updating `CLUSTER_JOURNEY_MAP`.
- **Status:** ✅ IMPLEMENTED (Sprint 4)

---

*Last Updated: 2025-12-19*
