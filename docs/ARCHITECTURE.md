# ARCHITECTURE: V2.1 Journey Engine

## Current Architecture
- Terminal relies on V2.0 thread constructs (`currentThread`, `advanceThread`, `JourneyEnd`) and lens-based entrypoints, mixing freestyle chat with card sequences.【F:components/Terminal.tsx†L200-L324】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】
- `useNarrativeEngine` delivers V2.0 fallbacks (personas/cards) and thread generation via `threadGenerator`, persisting thread state in localStorage alongside entropy state.【F:hooks/useNarrativeEngine.ts†L18-L193】【F:hooks/useNarrativeEngine.ts†L284-L359】
- Schema definitions still blend personas/cards with journeys/hubs, keeping dual models alive.【F:data/narratives-schema.ts†L1-L178】
- AdminDashboard reconstructs schemas through card backfill to support legacy editors, reinforcing V2.0 shapes on save.【F:App.tsx†L90-L200】

## Target Architecture
- Narrative runtime consumes V2.1-only schema: journeys (entryNode, linkedHubId), nodes (label, query, contextSnippet, primary/alternate next), hubs for entropy routing; personas sourced from `DEFAULT_PERSONAS` only.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L14-L108】【F:hooks/useNarrativeEngine.ts†L214-L334】
- Hook responsibilities: load schema, expose journey navigation (`startJourney`, `advanceNode`, `exitJourney`), track `activeJourneyId`/`currentNodeId`/`visitedNodes`, and preserve entropy bridge APIs without thread generation.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】【F:hooks/useNarrativeEngine.ts†L397-L477】
- Terminal UI renders journey panel bound to current node, showing context snippets and navigation buttons linked to node edges; no thread arrays or V2.0 suggestion widgets.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L108】
- Admin experience surfaces journeys/nodes/hubs with V2.1 fields and saves directly to `/api/admin/narrative` without converting to cards.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】【F:App.tsx†L90-L200】

## Dependency Rules
- No runtime imports from `utils/threadGenerator.ts` or card-only helpers inside narrative engine or Terminal.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L87-L108】【F:hooks/useNarrativeEngine.ts†L18-L32】
- Lens selection may update tone guidance but cannot reset journey navigation state; journey progression is lens-agnostic.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L137-L155】【F:hooks/useNarrativeEngine.ts†L197-L229】
- Entropy bridge operates on hubs and conversation history, invoking journey start instead of thread regeneration.【F:hooks/useNarrativeEngine.ts†L397-L477】

## Data Flow (Target)
1. Load V2.1 schema from `/api/narrative`; reject or sanitize V2.0 shapes before state initialization.【F:hooks/useNarrativeEngine.ts†L90-L133】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】
2. Session state stores `activeJourneyId`, `currentNodeId`, `visitedNodes`, `entropyState`, and active lens id; no thread arrays or positions persisted.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】【F:hooks/useNarrativeEngine.ts†L134-L193】
3. Terminal renders current node and calls `advanceNode` based on button selection; chat submissions use node queries/context for API calls while entropy ticks update bridge timers.【F:components/Terminal.tsx†L157-L324】【F:hooks/useNarrativeEngine.ts†L397-L477】
4. Admin saves updated journeys/nodes/hubs through `/api/admin/narrative` without card conversion, keeping storage aligned to V2.1.【F:App.tsx†L90-L200】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】
