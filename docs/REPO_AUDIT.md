# Repo Audit (Phase 0)

## Framework & Runtime
- Frontend uses React + Vite with Node-driven scripts (`dev`, `build`, `preview`) and a Node `server.js` entry for production serving.【F:package.json†L6-L32】
- Express server boots static dist assets and exposes admin/content APIs for narratives, knowledge, and manifests, relying on Google Cloud Storage and Gemini API keys.【F:server.js†L1-L141】

## Entry Points & Routing
- `App.tsx` is the SPA shell; it toggles admin mode via `?admin=true`, renders the Terminal plus marketing sections, and hosts the AdminDashboard tabs (Narrative, Audio, RAG, Flags, Hubs, Engagement).【F:App.tsx†L1-L200】
- Client routing is largely section-based within the page; React Router is present as a dependency but not used in the main shell (no `<Router>` mounting observed in `App.tsx`).【F:package.json†L19-L22】【F:App.tsx†L1-L200】

## Data & State Layers
- Narrative schema types still include V2.0 card/persona constructs alongside V2.1 journeys/hubs, showing ongoing dual-model support.【F:data/narratives-schema.ts†L1-L178】
- `useNarrativeEngine` fetches `/api/narrative` and falls back to a V2.0 schema with personas/cards, retaining thread generation via `threadGenerator` and exposing V2.0-centric methods (`getPersonaCards`, `getEntryPoints`, `currentThread`, `advanceThread`).【F:hooks/useNarrativeEngine.ts†L90-L479】
- Terminal UI consumes the V2.0 thread API (`currentThread`, `currentPosition`, `regenerateThread`, `advanceThread`) and still renders V2.0 components like `JourneyEnd`, `suggestedTopics`, and `suggestedLenses` per migration notes.【F:components/Terminal.tsx†L200-L324】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L134】

## Admin / Surface Boundaries
- AdminDashboard loads schema and feature flags/hubs through `/api/narrative`, rehydrating V2.0 schemas by converting nodes to cards and backfilling defaults, preserving legacy structures in admin flows.【F:App.tsx†L90-L200】

## Risks & Gaps
1. Dual schema surface: V2.0 fallback paths in `useNarrativeEngine` and AdminDashboard risk reintroducing card threads, conflicting with the V2.1 journey graph plan.【F:hooks/useNarrativeEngine.ts†L90-L332】【F:App.tsx†L90-L200】
2. UX drift: Terminal reliance on thread-based navigation and V2.0 suggestions contradicts the V2.1 node-based journey model outlined in migration notes.【F:components/Terminal.tsx†L200-L324】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】
3. Dead code: `utils/threadGenerator.ts` and `components/Terminal/JourneyEnd.tsx` remain flagged for deletion, but continue influencing types and imports indirectly (thread generator imported in `useNarrativeEngine`).【F:hooks/useNarrativeEngine.ts†L18-L32】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L87-L134】
4. Admin/editor mismatch: Narrative admin tooling reconstitutes V2.0 cards, preventing accurate V2.1 journey/node editing and risking corrupted saves.【F:App.tsx†L90-L200】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L134】

