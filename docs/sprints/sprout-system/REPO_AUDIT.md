# Repository Audit — Sprout System Sprint

## Stack
- Framework: React 18 + TypeScript
- Build: Vite
- Styling: Tailwind CSS with Grove design tokens
- Backend: Express (server.js) on Cloud Run
- Storage: Google Cloud Storage (grove-assets bucket)

## Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
```

## Key Locations for Sprout System

| Concern | File | Lines | Notes |
|---------|------|-------|-------|
| Terminal Component | `components/Terminal.tsx` | 1-1404 | Main chat interface, holds messages state |
| Chat Messages Type | `types.ts` | — | `ChatMessage` interface |
| Command Registry | `components/Terminal/CommandInput/CommandRegistry.ts` | 1-86 | Slash command infrastructure |
| Command Files | `components/Terminal/CommandInput/commands/` | — | Individual command implementations |
| Stats Command | `components/Terminal/CommandInput/commands/stats.ts` | 1-15 | Opens stats modal |
| Stats Modal | `components/Terminal/Modals/StatsModal.tsx` | 1-177 | Current stats display |
| Stats Hook | `hooks/useExplorationStats.ts` | 1-97 | Aggregates exploration data |
| Streak Tracking | `hooks/useStreakTracking.ts` | 1-150+ | localStorage persistence |
| Schema Types | `src/core/schema/narrative.ts` | 1-457 | All narrative/hub types |
| Data Directory | `data/` | — | narratives.json, sprouts.json (new) |

## Relevant Patterns Observed

### Command System (v0.16)
- Commands registered via `CommandRegistry` singleton
- Each command in separate file under `commands/`
- Commands return `CommandResult`: modal, action, or error
- `CommandContext` provides actions: `openModal`, `showToast`, etc.

### Modal System
- Modals managed by Terminal.tsx state: `showHelpModal`, `showJourneysModal`, `showStatsModal`
- Modal components in `components/Terminal/Modals/`
- Opened via command result `{ type: 'modal', modal: 'stats' }`

### Stats Infrastructure
- `useExplorationStats` aggregates from multiple sources
- `useStreakTracking` handles localStorage persistence
- Stats displayed in `StatsModal` with `StatCard` component

### Message State
- Messages stored in `terminalState.messages` (React state)
- Each message has: `id`, `text`, `sender` ('user' | 'bot'), `timestamp`
- Bot messages accumulate via streaming (`accumulatedRawText`)
- Message ID generated from timestamp: `Date.now().toString()`

### Toast System
- `showToast(message)` available via `CommandContext`
- Used for quick user feedback

## Gaps/Technical Debt for Sprout System

### New Infrastructure Needed
- [ ] `data/sprouts.json` — New registry for captured sprouts
- [ ] `src/core/schema/sprout.ts` — Sprout type definitions
- [ ] `hooks/useSproutCapture.ts` — Capture last response with context
- [ ] `hooks/useSproutStats.ts` — Aggregate sprout statistics
- [ ] `components/Terminal/Modals/GardenModal.tsx` — Garden view modal
- [ ] `components/Terminal/CommandInput/commands/sprout.ts` — /sprout command
- [ ] `components/Terminal/CommandInput/commands/garden.ts` — /garden command

### Extensions to Existing Files
- [ ] `useExplorationStats.ts` — Add sprout counts
- [ ] `StatsModal.tsx` — Add Garden section
- [ ] `CommandRegistry.ts` — Register new commands

## Data Flow for Sprout Capture

```
User: /sprout
    │
    ▼
CommandInput parses command
    │
    ▼
sproutCommand.execute(context)
    │
    ├─► Get last bot message from terminalState.messages
    ├─► Get session context (persona, journey, hub)
    ├─► Get RAG context (from last response metadata)
    │
    ▼
useSproutCapture.capture(response, context)
    │
    ├─► Generate sprout ID
    ├─► Build Sprout object with provenance
    ├─► Save to localStorage (MVP)
    │
    ▼
showToast("🌱 Sprout planted!")
```

## localStorage Keys (MVP)
- `grove-sprouts` — Array of Sprout objects (new)
- `grove-streak-data` — Existing streak tracking
- `grove-last-lens` — Existing lens persistence
