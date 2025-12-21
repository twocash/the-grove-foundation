# The Grove Foundation - Context Bridge

> Living Research Platform | AI Terminal Companion | Narrative Engine

## Project Overview

**The Grove – Living Research** is an interactive, immersive research platform presenting the Grove white paper through visual storytelling and a persistent AI terminal companion. The core thesis: AI communities (agents) should run on locally-owned hardware rather than being rented from cloud providers.

**Live URL:** Deployed on Google Cloud Run
**Primary User:** Researchers, academics, and technologists exploring distributed AI ownership models

---

## Architecture Summary (Post-Sprint 4)

The codebase follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                         EXPERIENCES                              │
│                                                                  │
│    ┌─────────────────────┐         ┌─────────────────────┐      │
│    │      SURFACE        │         │     FOUNDATION      │      │
│    │   /  (home)         │         │   /foundation/*     │      │
│    │                     │         │                     │      │
│    │  - Paper/Ink theme  │         │  - Obsidian/Glow    │      │
│    │  - Terminal.tsx     │         │  - Admin consoles   │      │
│    │  - User experience  │         │  - Operator tools   │      │
│    └─────────────────────┘         └─────────────────────┘      │
│              │                               │                   │
└──────────────┼───────────────────────────────┼───────────────────┘
               │     ┌─────────────────┐       │
               └────►│     HOOKS       │◄──────┘
                     │  (React glue)   │
                     └────────┬────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                      ┌──────▼──────┐                            │
│                      │    CORE     │  (Pure TypeScript)         │
│                      │             │  (No React deps)           │
│                      │  - Schema   │  (No DOM APIs)             │
│                      │  - Engine   │                            │
│                      │  - Config   │                            │
│                      └─────────────┘                            │
│                          SUBSTRATE                              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/core/` | Pure TypeScript types, engines, config (NO React) |
| `src/surface/` | Surface experience (user-facing) |
| `src/foundation/` | Foundation experience (admin consoles) |
| `src/router/` | React Router configuration |
| `hooks/` | React hooks bridging Core to UI |
| `services/` | API clients |
| `components/` | Legacy Surface components |

### Path Aliases

```typescript
@core     → ./src/core
@surface  → ./src/surface
@foundation → ./src/foundation
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.2.3 |
| Routing | React Router | 7.1.5 |
| Build | Vite | 6.2.0 |
| Styling | Tailwind CSS | 4.x (npm) |
| Backend | Express | 4.21.2 |
| Runtime | Node.js | 20 (Alpine) |
| Cloud | GCP (Cloud Run, GCS) | - |
| AI | Google Gemini | 2.0-flash / 2.5-flash |
| Language | TypeScript | 5.8.2 |

---

## Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | SurfacePage | Main user experience |
| `/foundation` | FoundationLayout | Admin dashboard |
| `/foundation/genesis` | Genesis | Metrics & A/B testing dashboard |
| `/foundation/narrative` | NarrativeArchitect | Persona/card management |
| `/foundation/engagement` | EngagementBridge | Event bus monitoring |
| `/foundation/knowledge` | KnowledgeVault | RAG document management |
| `/foundation/tuner` | RealityTuner | Flags + Topic hubs |
| `/foundation/audio` | AudioStudio | TTS generation |

**Legacy Redirect:** `?admin=true` → `/foundation`

---

## Key Files Reference

### Core Module (`src/core/`)
- `schema/base.ts` - SectionId, ChatMessage, NarrativeNode
- `schema/narrative.ts` - Persona, Card, GlobalSettings, TopicHub
- `schema/engagement.ts` - EngagementState, Events, Triggers
- `schema/lens.ts` - CustomLens, Archetype, UserInputs
- `engine/triggerEvaluator.ts` - Reveal trigger evaluation
- `engine/topicRouter.ts` - Query-to-hub routing
- `config/defaults.ts` - All DEFAULT_* values

### Foundation Consoles (`src/foundation/consoles/`)
- `NarrativeArchitect.tsx` - Persona/card management
- `EngagementBridge.tsx` - Event bus monitor
- `KnowledgeVault.tsx` - RAG management
- `RealityTuner.tsx` - Feature flags + Topic hubs
- `AudioStudio.tsx` - TTS generation

### Surface Application
- `src/surface/pages/SurfacePage.tsx` - Main page
- `components/Terminal.tsx` - AI chat interface
- `components/Terminal/CustomLensWizard/` - 5-step wizard
- `components/Terminal/Reveals/` - Progressive reveals

### Services
- `services/chatService.ts` - Server-side chat client (preferred for chat)
- `services/geminiService.ts` - Direct Gemini API (deprecated for chat, kept for artifacts)
- `services/audioService.ts` - TTS generation, WAV header handling

### Hooks (State Management)
- `hooks/useNarrativeEngine.ts` - Primary v2 hook for lens/journey state
- `hooks/useEngagementBus.ts` - Core engagement bus singleton (7 React hooks)
- `hooks/useEngagementBridge.ts` - Backward-compatible bridge (replaces useRevealState)
- `hooks/useCustomLens.ts` - Custom lens CRUD with encrypted localStorage
- `hooks/useFeatureFlags.ts` - Feature flag access from globalSettings
- `hooks/useStreakTracking.ts` - User-local streak data persistence

### Types
- `types.ts` - Legacy v1 types (SectionId, ChatMessage, NarrativeNode)
- `types/lens.ts` - Custom lens and archetype types
- `types/engagement.ts` - Engagement bus events, state, triggers

### Utils
- `utils/engagementTriggers.ts` - Declarative trigger configuration engine
- `utils/threadGenerator.ts` - Journey thread generation
- `utils/topicRouter.ts` - Topic hub query routing
- `utils/encryption.ts` - AES-256 encryption for custom lens data

### Backend
- `server.js` - Express API, GCS integration, all REST endpoints

### Configuration
- `vite.config.ts` - Build config, dev server (port 3000)
- `Dockerfile` - Multi-stage build for Cloud Run
- `cloudbuild.yaml` - GCP Cloud Build pipeline

---

## Narrative Engine (Complete)

**Goal:** Transform the Terminal from reactive chatbot to proactive "Narrative Engine"

The Core Loop:
1. **Ingest** - Admin uploads markdown/text files (PDF support optional)
2. **Architect** - Gemini extracts concepts into directed graph
3. **Refine** - Admin edits via GUI (labels, prompts, connections)
4. **Publish** - Graph drives live Terminal experience

### Data Schema (types.ts)

```typescript
interface NarrativeNode {
  id: string;              // e.g., "uni-hedge"
  label: string;           // UI button text
  query: string;           // LLM instruction
  contextSnippet?: string; // RAG override (verbatim quote)
  next: string[];          // IDs of following nodes
  sectionId?: SectionId;   // Entry point for section
  sourceFile?: string;     // Traceability
}

interface NarrativeGraph {
  version: string;
  nodes: Record<string, NarrativeNode>;
}
```

### Narrative API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/narrative` | Fetch narratives.json from GCS |
| POST | `/api/admin/narrative` | Save narrative graph to GCS |
| POST | `/api/admin/generate-narrative` | Upload file (.md, .txt), extract graph via Gemini |

### Key Components

- `hooks/useNarrative.ts` - React hook for accessing narrative graph
- `components/AdminNarrativeConsole.tsx` - Admin UI for narrative management
- `components/NarrativeGraphView.tsx` - Visual graph editor
- `components/NarrativeNodeCard.tsx` - Individual node editor card
- `components/PromptHooks.tsx` - Dynamic prompt triggers from narrative graph
- `components/Terminal.tsx` - Graph-aware chat with curated follow-ups

---

## Design System

### Colors (Tailwind)
- `paper`: #FBFBF9 (cream background)
- `ink`: #1C1C1C (dark text)
- `ink-muted`: #575757
- `grove-forest`: #2F5C3B (primary green)
- `grove-clay`: #D95D39 (accent orange)

### Typography
- Display: Playfair Display (headers)
- Serif: Lora (body, editorial)
- Sans: Inter (UI)
- Mono: JetBrains Mono (code, terminal)

---

## Development Commands

```bash
# Local development
npm run dev          # Vite dev server (port 3000)

# Production build
npm run build        # Build to dist/
node server.js       # Run Express server (port 8080)

# Deploy
gcloud builds submit --config cloudbuild.yaml
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `GCS_BUCKET_NAME` | GCS bucket name | grove-assets |
| `PORT` | Server port | 8080 |

---

## Admin Access

Access admin dashboard: `?admin=true` query parameter

Tabs (6 total):
- **Narrative Engine** - Personas, cards, journey management
- **Flags** - Feature flag toggles
- **Topic Hubs** - Query routing configuration
- **Audio Studio** - TTS generation, track management
- **Knowledge Base** - RAG document management
- **Engagement** - Event bus monitor, trigger simulation

---

## Recent Commits (Context)

1. `296f3d7` - RAG Manager (Backend, Admin Console, dynamic Terminal context)
2. `84ed6cc` - GCS-backed Audio CMS, Classic Player style
3. `5b43fa2` - Audio playback fixes (WAV headers, streaming)
4. `d7a24ff` - Audio generation service, Docker, Cloud Build
5. `d8e011a` - Improved API key handling

---

## Completed Sprints: Narrative Engine

### Sprint 1: Foundation ✓
- [x] Define NarrativeNode/NarrativeGraph in types.ts
- [x] GET /api/narrative endpoint
- [x] POST /api/admin/narrative endpoint
- [x] Seed narratives.json with University Journey example

### Sprint 2: Generator ✓
- [x] Install pdf-parse, multer
- [x] Narrative Architect system prompt
- [x] POST /api/admin/generate-narrative endpoint
- [x] Basic AdminNarrativeConsole.tsx

### Sprint 3: Editor ✓
- [x] NarrativeNodeCard.tsx component
- [x] NarrativeGraphView.tsx component
- [x] Visual graph editor UI

### Sprint 4: Integration ✓
- [x] useNarrative hook
- [x] Refactor PromptHooks for dynamic data
- [x] Terminal graph-aware state
- [x] Curated follow-up chips

---

## Completed Sprints: Custom Lens Creator & Reveal System

### Sprint 5: Custom Lens Creator ✓
- [x] `types/lens.ts` - LensCandidate, UserInputs, WizardState types
- [x] `POST /api/generate-lens` - AI-powered lens generation endpoint
- [x] `components/Terminal/CustomLensWizard/` - Multi-step wizard UI
  - PrivacyStep, InputStep, GeneratingStep, SelectStep, ConfirmStep
- [x] `hooks/useCustomLens.ts` - Custom lens persistence (localStorage with encryption)
- [x] `utils/encryption.ts` - AES-256 encryption for sensitive lens data
- [x] LensPicker integration with custom lens creation
- [x] `utils/funnelAnalytics.ts` - Analytics tracking throughout wizard funnel

### Sprint 6: Reveal System ✓
- [x] `hooks/useRevealState.ts` - Reveal progression state management
- [x] `utils/revealTiming.ts` - Timing-based reveal triggers
- [x] `components/Terminal/Reveals/` - Reveal overlay components
  - SimulationReveal - "You're in a simulation" dramatic reveal
  - CustomLensOffer - Offer to create personalized lens
  - TerminatorMode - Unlock advanced "no guardrails" mode
  - FounderStory - Personal narrative from founder
- [x] `components/Terminal/ConversionCTA/` - Archetype-specific CTAs
- [x] Journey completion tracking with progressive reveals

### Key Custom Lens Files

| File | Purpose |
|------|---------|
| `types/lens.ts` | TypeScript types for lens wizard and candidates |
| `hooks/useCustomLens.ts` | Custom lens CRUD with encrypted localStorage |
| `hooks/useRevealState.ts` | Track reveal progression and session state |
| `utils/funnelAnalytics.ts` | Wizard funnel analytics tracking |
| `components/Terminal/CustomLensWizard/` | 5-step wizard components |
| `components/Terminal/Reveals/` | Dramatic reveal overlays |
| `components/Terminal/ConversionCTA/` | Archetype-specific conversion panels |

### Custom Lens API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/generate-lens` | Generate 3 personalized lens options from user inputs |

### Reveal Progression

1. **Simulation Reveal** - After 3+ exchanges, shows "you're in a simulation" message
2. **Custom Lens Offer** - After acknowledging simulation, offers personalized lens
3. **Terminator Mode** - After 10+ minutes active, unlocks "no guardrails" mode
4. **Founder Story** - After journey completion, shows personal narrative
5. **Conversion CTA** - Final archetype-specific call-to-action

---

## Completed Sprints: Engagement Bus (Sprint 8)

### Sprint 8: Unified Engagement State Machine ✓

**Problem Solved:** Three critical bugs in reveal system:
1. Alternative triggers never fired (missing function params)
2. React state timing issues (reveals checked before state updated)
3. Scattered engagement metrics across multiple hooks

**Architecture:** Event-driven singleton bus with declarative trigger configuration

- [x] `types/engagement.ts` - Full type system (events, state, triggers, conditions)
- [x] `hooks/useEngagementBus.ts` - Core singleton with 7 React hooks
- [x] `hooks/useEngagementBridge.ts` - Backward-compatible bridge (replaces useRevealState)
- [x] `utils/engagementTriggers.ts` - Declarative trigger configuration engine
- [x] `components/Admin/EngagementConsole.tsx` - Admin UI for monitoring/simulating
- [x] `docs/ENGAGEMENT_BUS_INTEGRATION.md` - Migration guide
- [x] Terminal.tsx integration with event emissions

### Key Engagement Bus Files

| File | Purpose |
|------|---------|
| `types/engagement.ts` | Type definitions for events, state, triggers |
| `hooks/useEngagementBus.ts` | Core singleton and 7 React hooks |
| `hooks/useEngagementBridge.ts` | Drop-in replacement for useRevealState |
| `utils/engagementTriggers.ts` | DEFAULT_TRIGGERS and evaluation engine |
| `components/Admin/EngagementConsole.tsx` | Admin monitoring/simulation UI |

### Event Types Emitted

```typescript
emit.exchangeSent(query, responseLength, cardId?)
emit.journeyStarted(lensId, threadLength)
emit.journeyCompleted(lensId, durationMinutes, cardsVisited)
emit.topicExplored(topicId, topicLabel)
emit.cardVisited(cardId, cardLabel, fromCard?)
emit.lensSelected(lensId, isCustom, archetypeId?)
emit.revealShown(revealType)
emit.revealDismissed(revealType, action)
```

### Trigger Configuration (Declarative)

```typescript
{
  id: 'simulation-reveal',
  reveal: 'simulation',
  priority: 100,
  enabled: true,
  conditions: {
    OR: [
      { field: 'journeysCompleted', value: { gte: 1 } },
      { field: 'exchangeCount', value: { gte: 5 } },
      { field: 'minutesActive', value: { gte: 3 } }
    ]
  },
  requiresAcknowledgment: []
}
```

### Admin Engagement Console

Access via `/foundation/engagement`:
- **Monitor**: Live metrics, event log, reveal queue status
- **Triggers**: Enable/disable triggers, view conditions
- **Simulate**: Manually emit events for testing

---

## Debugging Quick Reference

**Full debugging guide:** `docs/DEBUGGING.md`

### localStorage Keys (All User State)

| Key | Purpose |
|-----|---------|
| `grove-engagement-state` | Engagement metrics, reveals shown |
| `grove-event-history` | Last 100 events |
| `grove-terminal-lens` | Active lens ID |
| `grove-terminal-session` | Terminal session state |
| `grove-custom-lenses` | Encrypted custom lens data |
| `grove-streak-data` | Streak tracking |

### Full Reset (Browser Console)

```javascript
Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k));
location.reload();
```

### Common Issues

| Symptom | First Check |
|---------|-------------|
| Cards not appearing | Schema loaded? Journey active? Card has `next[]`? |
| Reveals not triggering | Engagement state metrics? Trigger enabled? Already shown? |
| Streak missing | Feature flag enabled? localStorage has streak data? |
| Custom lens not saving | Encryption key exists? API call succeeded? |
| Foundation not loading | Route correct? Build succeeded? |

### Debugging in Foundation

| Console | Debug Capability |
|---------|------------------|
| `/foundation/engagement` | Live metrics, event history, trigger status |
| `/foundation/tuner` | Feature flags, topic hub query testing |
| `/foundation/narrative` | Card connections, persona filtering |

### Key Data Flows

**Message → Response:**
```
Terminal.handleSendMessage() → chatService.streamChat()
  → server.js /api/chat → routeToHub() → Gemini API
  → Stream to client → useEngagementEmit().exchangeSent()
```

**Reveal Trigger:**
```
emit('EXCHANGE_SENT') → EngagementBus.processEvent()
  → updateState() → evaluateTriggers() → revealQueue
  → useRevealQueue() → Terminal renders reveal
```

---

## Completed Sprints: Surface/Foundation Migration (Sprints 9-12)

### Sprint 9 (Routing + Tailwind): ✓
- React Router v7 installed
- Tailwind migrated from CDN to npm
- Route-based navigation (`/`, `/foundation/*`)
- Legacy `?admin=true` redirect

### Sprint 10 (Foundation Layout): ✓
- HUDHeader, NavSidebar, GridViewport components
- Foundation design system (obsidian, holo-cyan)
- DataPanel, GlowButton, MetricCard base components

### Sprint 11 (Console Migration): ✓
- NarrativeArchitect (from NarrativeConsole)
- EngagementBridge (from EngagementConsole)
- KnowledgeVault (from AdminRAGConsole)
- RealityTuner (merged FeatureFlags + TopicHubs)
- AudioStudio (from AdminAudioConsole)

### Sprint 12 (Core Extraction): ✓
- `src/core/schema/` - All type definitions
- `src/core/engine/` - triggerEvaluator, topicRouter
- `src/core/config/` - All defaults
- Path aliases: `@core`, `@surface`, `@foundation`
- Backward compatibility shims

---

## Completed Sprints: Tiered RAG Architecture (Sprint 13)

### Sprint 13: Tiered RAG with Topic Hub Routing ✓

**Problem Solved:** Monolithic RAG loading (557KB → 50KB truncation with alphabetical loading) → lost relevant content

**Solution:** Intelligent tiered loading with Topic Hub routing
- **Before**: 28,313 bytes (~7K tokens), alphabetical, no relevance
- **After**: 12,333 bytes Tier 1 + 27,259 bytes Tier 2 when hub matches (~10K tokens total)
- **Result**: ~90% token reduction for generic queries, ~100% relevance improvement

### Architecture

```
User Query → Topic Router → Tag Matching → Hub Selection
                                              ↓
                              ┌───────────────┴───────────────┐
                              │                               │
                         Tier 1 (~15KB)                  Tier 2 (~30KB)
                         Always loaded                   If hub matches
                         - grove-overview.md             - Hub primary file
                         - key-concepts.md               - Supporting files
                         - visionary-narrative.md
```

### Key Files

| File | Purpose |
|------|---------|
| `src/core/schema/rag.ts` | HubsManifest, TieredContextResult types |
| `src/core/engine/ragLoader.ts` | TypeScript tiered loader |
| `docs/knowledge/hubs.json` | Declarative manifest (8 hubs) - also in GCS |
| `server.js` | Production tiered RAG implementation |
| `src/core/config/defaults.ts` | 8 TopicHub definitions with tags |

### Topic Hubs (8 total)

| Hub ID | Tags (sample) |
|--------|---------------|
| `ratchet-effect` | ratchet, 21 months, 7 month, doubling |
| `infrastructure-bet` | $380 billion, hyperscaler, datacenter |
| `observer-dynamic` | observer, gardener, simulation, watching |
| `meta-philosophy` | meta, architecture, inside, already here |
| `cognitive-split` | cognitive split, hierarchical, local, cloud |
| `diary-system` | diary, memory, narrative, tamagotchi |
| `technical-arch` | technical, NATS, CRDT, distributed |
| `governance` | governance, foundation, knowledge commons |

### GCS Data Files

- `gs://grove-assets/knowledge/hubs.json` - Manifest (5-min cache TTL)
- `gs://grove-assets/knowledge/_default/` - Tier 1 files
- `gs://grove-assets/knowledge/*.md` - Tier 2 knowledge files (hashed names)

### Cache Invalidation

- Manifest cache: 5-min TTL, invalidates on admin save via `/api/admin/narrative`
- File cache: 10-min TTL per file

---

## Completed Sprints: A/B Testing & Genesis Dashboard (Sprint 14)

### Sprint 14: A/B Testing Infrastructure + Genesis Dashboard ✓

**Features Added:**
- Deterministic A/B variant selection based on session ID
- Hook variant support for prompt hooks across all sections
- CTA variant support for Get Involved buttons
- Genesis dashboard for metrics visualization

### Key Files

| File | Purpose |
|------|---------|
| `src/core/schema/ab-testing.ts` | HookVariant, ABTest, VariantSelection types |
| `utils/abTesting.ts` | selectVariant(), getSessionId(), getHookVariant() |
| `utils/genesisMetrics.ts` | aggregateGenesisMetrics(), getVariantPerformance() |
| `src/foundation/consoles/Genesis.tsx` | Genesis dashboard with 3 tabs |

### A/B Testing Architecture

```
Session ID (localStorage) + Element ID
         ↓
    Hash Function (deterministic)
         ↓
    Weight-based Selection
         ↓
    Same variant every time for same user
```

### Variant Configuration

Variants are defined in `constants.ts`:

```typescript
// Hook variants in SECTION_HOOKS
{
  text: "What is the Ratchet Effect?",
  prompt: "...",
  variants: [
    { id: "ratchet-1a", text: "What is the Ratchet Effect?", weight: 50 },
    { id: "ratchet-1b", text: "Explain the Ratchet", weight: 50 }
  ]
}

// CTA variants in CTA_VARIANTS
{
  readResearch: {
    id: 'cta-read-research',
    variants: [
      { id: 'read-1a', text: 'Read on Notion', weight: 50 },
      { id: 'read-1b', text: 'View White Paper', weight: 50 }
    ]
  }
}
```

### Genesis Dashboard

Access via `/foundation/genesis`:

| Tab | Purpose |
|-----|---------|
| Overview | Core metrics grid, top hooks, section engagement |
| Variants | Variant performance table, click distribution |
| Funnel | Wizard conversion funnel visualization |

### Telemetry Integration

`trackPromptHookClicked()` now includes:
- `variantId` - Which variant was shown
- `experimentId` - Which experiment the variant belongs to

---

## Completed Sprints: Sprout System (Sprint 15)

### Sprint 15: Sprout System MVP

**Goal:** Transform the Terminal from a content delivery interface into a content refinement engine where users can capture valuable LLM responses as "sprouts" with full provenance.

### Key Files

| File | Purpose |
|------|---------|
| `src/core/schema/sprout.ts` | Sprout, SproutStorage, SproutStats types |
| `hooks/useSproutStorage.ts` | localStorage CRUD for sprout persistence |
| `hooks/useSproutCapture.ts` | Capture hook with flag parsing |
| `hooks/useSproutStats.ts` | Aggregated statistics |
| `components/Terminal/CommandInput/commands/sprout.ts` | /sprout command |
| `components/Terminal/CommandInput/commands/garden.ts` | /garden command |
| `components/Terminal/Modals/GardenModal.tsx` | Garden modal UI |
| `docs/SPROUT_SYSTEM.md` | Academic architecture document |

### Commands Added

| Command | Aliases | Description |
|---------|---------|-------------|
| `/sprout` | `/capture`, `/save` | Capture last response as a sprout |
| `/garden` | `/sprouts`, `/contributions` | View captured sprouts |

### Sprout Command Flags

```bash
/sprout                          # Capture with no tags
/sprout --tag=ratchet            # Capture with single tag
/sprout --tags=ratchet,infra     # Capture with multiple tags
/sprout --note="Great framing"   # Capture with annotation
```

### localStorage Keys

| Key | Purpose |
|-----|---------|
| `grove-sprouts` | All captured sprouts with provenance |
| `grove-session-id` | Anonymous session identifier |

### Data Model

```typescript
interface Sprout {
  id: string;           // UUID
  capturedAt: string;   // ISO timestamp
  response: string;     // Verbatim LLM output
  query: string;        // User's original query
  personaId: string;    // Active lens
  journeyId: string;    // Active journey
  hubId: string;        // Topic hub matched
  nodeId: string;       // Card/node triggered
  status: 'sprout';     // Lifecycle stage (MVP: always 'sprout')
  tags: string[];       // User annotations
  notes: string;        // Human commentary
  sessionId: string;    // Anonymous session
  creatorId: string;    // Future: Grove ID
}
```

### StatsModal Integration

The `/stats` command now includes a "Your Garden" section showing:
- Total sprouts captured
- Contribution lifecycle visualization
- Sprouts by tag breakdown
- Network Impact placeholder (future)

### Future Phases

| Phase | Capability |
|-------|------------|
| 2 | Grove ID integration, claim anonymous sprouts |
| 3 | Server-side storage, admin review workflow |
| 4 | Network propagation, credit attribution |

---

## CI/CD and Deployment

### Git Worktree Setup

This project uses Claude Code worktrees. The main repository is at:
- **Main repo**: `C:\GitHub\the-grove-foundation` (branch: main)
- **Worktrees**: `C:\Users\jim\.claude-worktrees\the-grove-foundation\<branch-name>`

### Deployment Checklist

**CRITICAL**: Cloud Build runs from the main repo, NOT worktrees.

1. **Develop in worktree**
   ```bash
   cd C:\Users\jim\.claude-worktrees\the-grove-foundation\<branch>
   # Make changes, test locally
   ```

2. **Commit and push**
   ```bash
   git add . && git commit -m "..." && git push origin <branch>
   ```

3. **Create PR and merge**
   ```bash
   gh pr create --title "..." --body "..."
   gh pr merge <number> --merge
   ```

4. **Sync main repo and deploy**
   ```bash
   cd C:\GitHub\the-grove-foundation
   git fetch origin && git pull origin main
   gcloud builds submit --config cloudbuild.yaml
   ```

5. **Verify deployment**
   ```bash
   gcloud run services describe grove-foundation --region=us-central1 \
     --format="value(status.latestReadyRevisionName)"
   ```

### Post-Deployment Testing

Run the RAG test matrix after each deployment:

| Query | Expected Hub | Expected Behavior |
|-------|--------------|-------------------|
| "Tell me about the Ratchet" | ratchet-effect | Tier 2 loads, ~40KB total |
| "Observer dynamic" | observer-dynamic | Tier 2 loads |
| "How does Grove work?" | (none) | Tier 1 only, ~12KB |
| "$380 billion" | infrastructure-bet | Tier 2 loads |
| "Inside Grove?" | meta-philosophy | Tier 2 loads |

Check logs to verify:
```bash
gcloud logging read "resource.type=cloud_run_revision AND textPayload:RAG" --limit=10
```

Expected log pattern:
```
[RAG] Manifest loaded: 8 hubs
[RAG] Loading Tier 1 (budget: 15000 bytes)
[RAG] Tier 1 loaded: 12333 bytes from 3 files
[RAG] Loading Tier 2: <hub-id> (budget: X bytes)
[RAG] Tier 2 loaded: X bytes
[RAG] Total context: X bytes (~Y tokens)
```

### Common Deployment Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Old code in production | Built from worktree not main | Pull to main repo, rebuild |
| Manifest not loading | GCS file missing/corrupt | Check `gs://grove-assets/knowledge/hubs.json` |
| File not found | Filename mismatch (spaces, hashes) | Check `gcsFileMapping` in manifest |
| Rate limit errors | Gemini quota exhausted | Wait ~60s, retry |

### GCS Data Sync

When updating manifest or knowledge files:
```bash
# Upload manifest
gcloud storage cp docs/knowledge/hubs.json gs://grove-assets/knowledge/hubs.json

# Verify
gcloud storage cat gs://grove-assets/knowledge/hubs.json | head -20
```
