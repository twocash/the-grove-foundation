# DECISIONS (ADR Style)

## ADR-001: Adopt V2.1 Journey Graph as Sole Narrative Model
- **Context:** Dual support for V2.0 cards/threads and V2.1 journeys causes UX drift and token waste.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L7-L86】【F:hooks/useNarrativeEngine.ts†L90-L359】
- **Decision:** Remove thread generation and enforce journey/node navigation with entropy-driven entry; personas remain tonal only via defaults.
- **Consequences:** Thread-related code deleted; session schema changes to journey state; Terminal/UI rewritten around nodes; admin tools must speak V2.1 natively.

## ADR-002: Retain Cognitive Bridge with V2.1 Hubs
- **Context:** Entropy detector already routes to topic hubs and suggests journeys; needs to operate without thread regeneration.【F:hooks/useNarrativeEngine.ts†L397-L477】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L137-L155】
- **Decision:** Keep entropy evaluation and injection APIs, wiring them to `startJourney` and node navigation.
- **Consequences:** Bridge remains the entry point for guided journeys; requires node/journey lookup helpers and hub alignment.

## ADR-003: Remove V2.0 Admin Backfill
- **Context:** AdminDashboard rebuilds schemas into V2.0 cards to satisfy legacy editors, risking corrupt saves and blocking journey edits.【F:App.tsx†L90-L200】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】
- **Decision:** Stop card backfill; provide journey/node/hub views/editors that persist V2.1 payloads directly.
- **Consequences:** Admin updates stay compatible with runtime; additional UI work needed for journey inspection/editing.
