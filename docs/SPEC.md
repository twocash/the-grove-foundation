# SPEC: V2.1 Journey Graph Restoration

## Goals
- Replace V2.0 thread/card navigation with authored V2.1 journeys and nodes as the single source of truth.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】
- Keep lenses as tonal modifiers sourced from `DEFAULT_PERSONAS`, decoupled from journey flow.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L137-L155】
- Preserve the Cognitive Bridge/entropy hook to offer journey entry points without reintroducing thread generation.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L137-L155】【F:hooks/useNarrativeEngine.ts†L397-L477】

## Non-goals
- No new knowledge base content or topic hubs beyond existing schema defaults; focus is navigation refactor.【F:data/narratives-schema.ts†L107-L178】
- No redesign of marketing sections outside the Terminal/Admin surfaces.【F:App.tsx†L1-L90】

## Current-State Inventory
- `useNarrativeEngine` loads `/api/narrative`, falls back to V2.0 personas/cards, and exposes thread APIs (`currentThread`, `advanceThread`, `regenerateThread`).【F:hooks/useNarrativeEngine.ts†L90-L479】
- Terminal consumes thread APIs, renders `JourneyEnd`, `suggestedTopics`, and lens suggestions tied to V2.0 card entrypoints.【F:components/Terminal.tsx†L200-L324】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】
- Migration notes flag `utils/threadGenerator.ts` and `components/Terminal/JourneyEnd.tsx` as deletions; they remain referenced (thread generator import).【F:hooks/useNarrativeEngine.ts†L18-L32】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L87-L134】
- AdminDashboard reconstructs V2.0 schemas for flags/hubs, preserving legacy card structures in saves.【F:App.tsx†L90-L200】

## Target Architecture & Dependency Rules
- Narrative data: adopt V2.1 journeys/nodes/hubs only; personas come from `DEFAULT_PERSONAS` for tone (no schema personas/cards at runtime).【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L137-L155】【F:hooks/useNarrativeEngine.ts†L214-L334】
- Hook API: expose journey-centric state (`activeJourneyId`, `currentNodeId`, `visitedNodes`) and navigation (`startJourney`, `advanceNode`, `exitJourney`) without thread functions.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】
- Terminal UI: render current node context, primary/alternate transitions, and completion actions instead of thread progress or V2.0 suggestions.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L108】
- Admin: read/write V2.1 journeys/nodes/hubs, avoiding card regeneration on load/save paths.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】

## Migration Plan (High-Level)
1. Delete/retire V2.0-only artifacts: `utils/threadGenerator.ts`, `components/Terminal/JourneyEnd.tsx`, and thread-specific session fields.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L87-L108】
2. Refactor `useNarrativeEngine` to load V2.1 schema strictly, surface journey/node helpers, and persist journey state in session storage (no thread generation).【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】【F:hooks/useNarrativeEngine.ts†L90-L349】
3. Rewire Terminal to consume journey/node APIs, remove suggested topics/lenses, and show node context plus navigation buttons tied to `primaryNext`/`alternateNext`.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】【F:components/Terminal.tsx†L200-L324】
4. Adjust Admin journey tooling to display V2.1 journeys/nodes and ensure save pipeline writes V2.1-compatible payloads without V2.0 backfill.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】【F:App.tsx†L90-L200】

## UI / System Design Spec
- Terminal Journey Panel: shows active journey title, current node label, context snippet, and buttons for primary/alternate transitions; completion offers Freestyle/new journey options.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L108】
- Lens Picker: retains existing UI but treated as tone selector; switching lenses must not reset journey state.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L137-L155】【F:hooks/useNarrativeEngine.ts†L197-L229】
- Cognitive Bridge: continues to evaluate entropy and suggest journeys; injections trigger `startJourney` with entry nodes.【F:hooks/useNarrativeEngine.ts†L397-L477】
- Admin Journey View: replace card grid with journey list + node viewer/editor suitable for V2.1 fields (id, label, query, contextSnippet, primaryNext, alternateNext).【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】

## Acceptance Criteria
- Engine: `useNarrativeEngine` no longer exposes thread APIs and initializes V2.1 journey state on load (activeJourneyId/currentNodeId null until start).【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】
- Terminal: UI renders node-based journey view and navigation; V2.0 suggestions and JourneyEnd removed from runtime UI; freestyle chat still works with entropy injections.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L108】【F:components/Terminal.tsx†L157-L324】
- Admin: Journey data loads/saves without V2.0 card backfill, and users can at least view V2.1 journey/node structures without crashes.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】【F:App.tsx†L90-L200】
- Data integrity: persisted session/local storage no longer stores thread arrays/positions; journey state persistence is compatible with V2.1 fields only.【F:hooks/useNarrativeEngine.ts†L134-L193】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】

## Test Plan
- Unit/logic: adjust/add hook tests around journey navigation (start/advance/exit) once available.
- Integration/manual:
  - `npm run dev` then verify Terminal journey panel renders and advances via primary/alternate paths.【F:package.json†L6-L10】
  - Trigger entropy suggestion (chat relevant topic) and confirm bridge starts correct journey without generating threads.【F:hooks/useNarrativeEngine.ts†L397-L477】
  - Validate Admin journey view loads without V2.0 card conversions and saves cleanly via `/api/admin/narrative`.【F:App.tsx†L90-L200】
