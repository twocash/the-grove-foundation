# MIGRATION MAP

## Deletions / Deprecations
- Remove `utils/threadGenerator.ts` and all imports (thread-based scoring obsolete under V2.1).【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L87-L98】【F:hooks/useNarrativeEngine.ts†L18-L32】
- Remove `components/Terminal/JourneyEnd.tsx` and any references from Terminal UI.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L98-L108】
- Drop V2.0 session fields (`currentThread`, `currentPosition`, `visitedCards` as card ids) in favor of journey/node tracking.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】【F:hooks/useNarrativeEngine.ts†L284-L359】

## Engine Refactor
- Enforce V2.1 schema loading in `useNarrativeEngine`; disallow persona/card backfill and default to journey/node structures only.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】【F:hooks/useNarrativeEngine.ts†L90-L133】
- Replace thread APIs with journey APIs: `startJourney(journeyId)`, `advanceNode(choiceIndex)`, `exitJourney`, `getNode`, `getJourney`, `getNextNodes` derived from node edges.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】
- Persist journey state (`activeJourneyId`, `currentNodeId`, `visitedNodes`) plus entropy and lens; keep entropy bridge intact.【F:hooks/useNarrativeEngine.ts†L134-L193】【F:hooks/useNarrativeEngine.ts†L397-L477】

## Terminal UI Changes
- Remove `suggestedTopics`, `suggestedLenses`, thread progress, and JourneyEnd usage; replace with journey panel showing current node label/contextSnippet and navigation buttons for primary/alternate edges.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L108】【F:components/Terminal.tsx†L157-L324】
- Align chat handling so node-triggered prompts call API and then `advanceNode` without assuming thread indices.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L56-L86】【F:components/Terminal.tsx†L157-L324】

## Admin Updates
- Stop reconstructing V2.0 cards on schema load/save; operate directly on journeys/nodes/hubs in admin tabs.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】【F:App.tsx†L90-L200】
- Provide journey/node view/editor (even minimal read-only) to validate V2.1 data integrity before saves.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L109-L185】

## Data Contracts
- Storage payload from `/api/narrative` should match V2.1 shape: `version`, `globalSettings`, `journeys`, `nodes`, `hubs`; personas from `DEFAULT_PERSONAS` locally only.【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L14-L108】【F:hooks/useNarrativeEngine.ts†L214-L334】
- LocalStorage keys remain (`grove-terminal-lens`, `grove-terminal-session`, entropy key) but session payload drops thread data in favor of journey state.【F:hooks/useNarrativeEngine.ts†L134-L193】【F:docs/V21_MIGRATION_OPEN_ITEMS.md†L73-L86】
