# The Grove Foundation - Context Bridge

> Living Research Platform | AI Terminal Companion | Narrative Engine

## Project Overview

**The Grove – Living Research** is an interactive, immersive research platform presenting the Grove white paper through visual storytelling and a persistent AI terminal companion. The core thesis: AI communities (agents) should run on locally-owned hardware rather than being rented from cloud providers.

**Live URL:** Deployed on Google Cloud Run
**Primary User:** Researchers, academics, and technologists exploring distributed AI ownership models

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                     │
├─────────────────────────────────────────────────────────────────┤
│  App.tsx ─────────────────────────────────────────────────────  │
│    ├── WhatIsGroveCarousel.tsx   (Interactive concept slides)   │
│    ├── ArchitectureDiagram.tsx   (Visual system explanation)    │
│    ├── EconomicsSlider.tsx       (Interactive economics viz)    │
│    ├── Terminal.tsx              (AI chat interface)            │
│    │    ├── LensPicker.tsx       (Persona/lens selection)       │
│    │    ├── CustomLensWizard/    (5-step lens creator)          │
│    │    ├── Reveals/             (Progressive reveal overlays)  │
│    │    └── ConversionCTA/       (Archetype-specific CTAs)      │
│    ├── PromptHooks.tsx           (Interactive prompt triggers)  │
│    ├── AudioPlayer.tsx           (CMS-driven audio playback)    │
│    └── Admin Dashboard                                          │
│         ├── AdminAudioConsole.tsx    (TTS generation)           │
│         ├── AdminRAGConsole.tsx      (Knowledge management)     │
│         └── AdminNarrativeConsole.tsx (Narrative Engine)        │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND (Express/Node)                    │
├─────────────────────────────────────────────────────────────────┤
│  server.js                                                       │
│    ├── GET  /api/manifest          (Audio track manifest)       │
│    ├── POST /api/admin/manifest    (Save audio manifest)        │
│    ├── GET  /api/context           (RAG knowledge base)         │
│    ├── GET  /api/admin/knowledge   (List knowledge files)       │
│    ├── DELETE /api/admin/knowledge/:file                        │
│    ├── GET  /api/narrative         (Narrative graph)            │
│    ├── POST /api/admin/narrative   (Save narrative)             │
│    ├── POST /api/admin/generate-narrative (AI extract)          │
│    └── POST /api/generate-lens     (Custom lens generation)     │
├─────────────────────────────────────────────────────────────────┤
│                     CLOUD SERVICES (GCP)                         │
├─────────────────────────────────────────────────────────────────┤
│  Google Cloud Storage (grove-assets bucket)                      │
│    ├── manifest.json       (Audio CMS data)                     │
│    ├── narratives.json     (Narrative graph) [NEW]              │
│    ├── knowledge/*.md      (RAG documents)                      │
│    └── audio/*.wav         (Generated audio files)              │
│                                                                  │
│  Google Gemini API                                               │
│    ├── gemini-2.0-flash    (Chat completions)                   │
│    └── gemini-2.5-flash-preview-tts (Audio generation)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.2.3 |
| Build | Vite | 6.2.0 |
| Styling | Tailwind CSS | 4.x (CDN) |
| Backend | Express | 4.21.2 |
| Runtime | Node.js | 20 (Alpine) |
| Cloud | GCP (Cloud Run, GCS) | - |
| AI | Google Gemini | 2.0-flash / 2.5-flash |
| Language | TypeScript | 5.8.2 |

---

## Key Files Reference

### Core Application
- `App.tsx` - Main React component, section navigation, admin dashboard
- `Terminal.tsx` - AI chat interface with streaming, markdown rendering
- `constants.ts` - Knowledge base, section hooks, system prompts
- `types.ts` - TypeScript interfaces (SectionId, ChatMessage, NarrativeNode)

### Services
- `services/geminiService.ts` - Gemini API wrapper, chat sessions, streaming
- `services/audioService.ts` - TTS generation, WAV header handling

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

Tabs:
- **Audio** - TTS generation, track management
- **RAG** - Knowledge base file management
- **Narrative** - Graph editor (Sprint 3+)

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
