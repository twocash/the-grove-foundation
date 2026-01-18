# The Grove Foundation - Context Bridge

> Living Research Platform | AI Terminal Companion | Narrative Engine

## Project Overview

**The Grove – Living Research** is an interactive, immersive research platform presenting the Grove white paper through visual storytelling and a persistent AI terminal companion. The core thesis: AI communities (agents) should run on locally-owned hardware rather than being rented from cloud providers.

**Live URL:** Deployed on Google Cloud Run
**Primary User:** Researchers, academics, and technologists exploring distributed AI ownership models

---

## Multi-Model Context

This document serves as shared context for all agents working on Grove Foundation, regardless of underlying model:

- **Claude** (via Claude Code) - Primary development agent
- **Gemini** (via API) - Planning and analysis
- **Local models** (Kimik2, etc.) - Specialized tasks

All agents share this context. Model-specific behaviors live in skill files (`.agent/skills/` in repo, synced to `~/.claude/skills/`), not here.

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
| AI | Multi-model (Gemini, Claude, local) | 2.0-flash / 2.5-flash |
| Language | TypeScript | 5.8.2 |

### json-render Pattern (Mandatory)

**Reference:** `docs/JSON_RENDER_PATTERN_GUIDE.md`

> **"Read = json-render. Write = React."**

| UI Purpose | Pattern |
|------------|---------|
| Displays data | json-render (dashboards, status, analytics, reports) |
| Edits data | React (forms, editors, wizards, inputs) |

**No exceptions. No debates.**

**Established Catalogs:**
| Catalog | Location | Purpose |
|---------|----------|---------|
| SignalsCatalog | `src/bedrock/consoles/ExperienceConsole/json-render/` | Analytics dashboards |
| ResearchCatalog | `src/surface/components/modals/SproutFinishingRoom/json-render/` | AI-generated documents |
| JobStatusCatalog | Same as SignalsCatalog | Job execution status |

**Pattern:** Catalog (Zod schemas) → Registry (React components) → Transform (domain → render tree)

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
| `/foundation/tuner` | RealityTuner | Flags + Cognitive domains |
| `/foundation/audio` | AudioStudio | TTS generation |

**Legacy Redirect:** `?admin=true` → `/foundation`

---

## Key Files Reference

### Core Module (`src/core/`)
- `schema/base.ts` - SectionId, ChatMessage, NarrativeNode
- `schema/narrative.ts` - Persona, Card, GlobalSettings, CognitiveDomain
- `schema/engagement.ts` - EngagementState, Events, Triggers
- `schema/lens.ts` - CustomLens, Archetype, UserInputs
- `engine/triggerEvaluator.ts` - Reveal trigger evaluation
- `engine/topicRouter.ts` - Query-to-cognitive-domain routing
- `config/defaults.ts` - All DEFAULT_* values

### Foundation Consoles (`src/foundation/consoles/`)
- `NarrativeArchitect.tsx` - Persona/card management
- `EngagementBridge.tsx` - Event bus monitor
- `KnowledgeVault.tsx` - RAG management
 innumerable- `RealityTuner.tsx` - Feature flags + Cognitive domains
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
- `hooks/useNarrativeEngine.ts` - Primary v2 hook for lens/experience sequence state
- `hooks/useEngagementBus.ts` - Core engagement bus singleton (7 React hooks)
- `hooks/useEngagementBridge.ts` - Backward-compatible bridge (replaces useRevealState)
- `hooks/useCustomLens.ts` - Custom lens CRUD with encrypted localStorage
- `hooks/useFeatureFlags.ts` - Feature flag access from globalSettings
- `hooks/useStreakTracking.ts` - User-local streak data persistence

### Types
- `types.ts` - Legacy v1 types (SectionId, ChatMessage, ExperienceMoment)
- `types/lens.ts` - Custom lens and archetype types
- `types/engagement.ts` - Engagement bus events, state, triggers

### Utils
- `utils/engagementTriggers.ts` - Declarative trigger configuration engine
- `utils/threadGenerator.ts` - Experience sequence thread generation
- `utils/topicRouter.ts` - Cognitive domain query routing
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
interface ExperienceMoment {
  id: string;              // e.g., "uni-hedge"
  label: string;           // UI button text
  query: string;           // LLM instruction
  contextSnippet?: string; // RAG override (verbatim quote)
  next: string[];          // IDs of following moments
  sectionId?: SectionId;   // Entry point for section
  sourceFile?: string;     // Traceability
}

interface NarrativeGraph {
  version: string;
  moments: Record<string, ExperienceMoment>;
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
- `components/NarrativeNodeCard.tsx` - Individual experience moment editor card
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
- **Narrative Engine** - Personas, cards, experience sequence management
- **Flags** - Feature flag toggles
- **Cognitive Domains** - Query routing configuration
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

## Completed Sprints (Summary)

| Sprint | Key Deliverables | Primary Files |
|--------|------------------|---------------|
| 1-4: Narrative Engine | Graph-based narrative system, admin console | `hooks/useNarrative.ts`, `types.ts` |
| 5-6: Custom Lens & Reveals | Lens wizard, reveal overlays, encryption | `components/Terminal/CustomLensWizard/`, `hooks/useRevealState.ts` |
| 8: Engagement Bus | Event-driven state machine, triggers | `hooks/useEngagementBus.ts`, `types/engagement.ts` |
| 9-12: Surface/Foundation | Route-based architecture, Tailwind npm | `src/surface/`, `src/foundation/` |
| 13: Tiered RAG | Cognitive domain routing, two-tier context loading | `src/core/engine/ragLoader.ts`, `docs/knowledge/hubs.json` |
| 14: A/B Testing | Deterministic variants, Genesis dashboard | `utils/abTesting.ts`, Genesis console |
| 15: Sprout System | Capture responses with provenance | `src/core/schema/sprout.ts`, `hooks/useSproutStorage.ts` |
| 16: Kinetic Commands | Declarative command system, palette | `src/core/commands/`, `components/Terminal/CommandPalette.tsx` |

**Key APIs added across sprints:**

| Endpoint | Purpose |
|----------|---------|
| `POST /api/generate-lens` | AI lens generation |
| `POST /api/admin/narrative` | Save narrative graph |
| `POST /api/admin/generate-narrative` | Extract graph from file |

**Engagement Bus Events:** `exchangeSent`, `sequenceStarted`, `sequenceCompleted`, `domainExplored`, `cardVisited`, `lensSelected`, `revealShown`, `revealDismissed`

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
| Cards not appearing | Schema loaded? Experience sequence active? Card has `next[]`? |
| Reveals not triggering | Engagement state metrics? Trigger enabled? Already shown? |
| Streak missing | Feature flag enabled? localStorage has streak data? |
| Custom lens not saving | Encryption key exists? API call succeeded? |
| Foundation not loading | Route correct? Build succeeded? |

### Debugging in Foundation

| Console | Debug Capability |
|---------|------------------|
| `/foundation/engagement` | Live metrics, event history, trigger status |
| `/foundation/tuner` | Feature flags, cognitive domain query testing |
| `/foundation/narrative` | Card connections, persona filtering |

### Key Data Flows

**Message → Response:**
```
Terminal.handleSendMessage() → chatService.streamChat()
  → server.js /api/chat → routeToDomain() → Gemini API
  → Stream to client → useEngagementEmit().exchangeSent()
```

**Reveal Trigger:**
```
emit('EXCHANGE_SENT') → EngagementBus.processEvent()
  → updateState() → evaluateTriggers() → revealQueue
  → useRevealQueue() → Terminal renders reveal
```

---

## CI/CD and Deployment

**Full source control protocol:** `.agent/protocols/source-control.md`

### Worktree Setup

- **Main repo:** `C:\GitHub\the-grove-foundation` (branch: main)
- **Worktrees:** `C:\Users\jim\.claude-worktrees\the-grove-foundation\<branch>`

**CRITICAL:** Cloud Build runs from main repo, NOT worktrees.

### Deploy Sequence

```bash
# After PR merged
cd C:\GitHub\the-grove-foundation
git fetch origin && git pull origin main
gcloud builds submit --config cloudbuild.yaml
```

### Common Issues

| Issue | Fix |
|-------|-----|
| Old code in production | Pull to main repo, rebuild |
| Manifest not loading | Check `gs://grove-assets/knowledge/domains.json` |
| Rate limit errors | Wait ~60s, retry |

---

## Notion Sprint Workflow

### Grove Feature Roadmap Database

Sprints are tracked in the **Grove Feature Roadmap** database in Notion:
- **Database ID:** `cb49453c-022c-477d-a35b-744531e7d161`
- **Data Source:** `collection://d94fde99-e81e-4a70-8cfa-9bc3317267c5`

### Sprint Status Values

| Status | Meaning |
|--------|---------|
| 💡 idea | Initial concept, not yet planned |
| 📝 draft-spec | Specification being written |
| 🔍 needs-audit | Requires review before proceeding |
| 🎯 ready | Artifacts complete, ready for execution |
| 🚀 in-progress | Currently being implemented |
| ✅ complete | Implementation finished |
| 📦 archived | No longer active |
| blocked | Waiting on dependencies |

### Sprint Preparation Workflow

When preparing a sprint, follow this sequence:

1. **User Story Refinery** → Create user stories in Notion under sprint page
2. **Foundation Loop** → Create artifacts in `docs/sprints/{sprint-name}/`
3. **Update Notion Status** → Change database property from `💡 idea` to `🎯 ready`
4. **Grove Execution Protocol** → Execute using `EXECUTION_PROMPT.md`

### Updating Sprint Status

**IMPORTANT:** When sprint artifacts are complete, update BOTH:
1. **Page content** - Add "Sprint Status" section with artifact links
2. **Database property** - Update `Status` field to match actual state

```
# Example: Update status to ready
mcp__plugin_Notion_notion__notion-update-page({
  page_id: "sprint-page-id",
  command: "update_properties",
  properties: { "Status": "🎯 ready" }
})
```

### Sprint Artifact Locations

| Location | Purpose |
|----------|---------|
| Notion page content | High-level overview, stakeholder visibility |
| `docs/sprints/{name}/` | Detailed artifacts for execution |
| `docs/sprints/{name}/EXECUTION_PROMPT.md` | Self-contained handoff |

### Quick Reference: Sprint Page Update

After completing Foundation Loop, update the sprint page:
1. Add Sprint Status section to page content
2. Add artifacts table with local paths
3. Add epics checklist
4. Update database Status property to `🎯 ready`

### Epic Organization

Epics group related sprints into a coherent feature delivery. The Grove Feature Roadmap uses a hierarchical structure:

```
Epic (🏔️ large feature)
├── Sprint 1 (foundation)
├── Sprint 2 (display/data)
├── Sprint 3 (actions/integration)
└── Sprint N (polish/testing)
```

**Database Fields for Epic Tracking:**

| Field | Purpose | Example |
|-------|---------|---------|
| **Effort** | Set to `🏔️ epic` for parent epic entries | `🏔️ epic` |
| **Parent Spec** | Text field linking sprint to parent epic | `Sprout Finishing Room v1` |
| **Status** | Track overall epic progress via child sprint statuses | `✅ complete` |

### Naming Conventions

**Epic Naming:** `Feature Name vX`
- Example: `Sprout Finishing Room v1`, `Research Lifecycle v1`, `Knowledge Commons Pipeline v1`

**Sprint Naming:** `SN-EPIC-SprintName` or `SN||EPIC-SprintName`
- `SN` = Sprint number within the epic (S1, S2, S3...)
- `EPIC` = 2-4 letter abbreviation of the epic name
- `SprintName` = Descriptive name for the sprint's focus

**Examples (SFR Epic):**
```
Epic: Sprout Finishing Room v1
├── S1-SFR-Shell        # Foundation sprint
├── S2||SFR-Display     # Display sprint
└── S3||SFR-Actions     # Actions sprint
```

**Examples (Research Lifecycle Epic):**
```
Epic: Research Lifecycle v1
├── S1-RL-Evidence      # Evidence collection
├── S2-RL-Writer        # Writer agent
├── S3-RL-Pipeline      # Pipeline integration
└── S7-RL-Polish        # Demo prep (non-sequential OK)
```

### Epic Completion Workflow

1. **Mark child sprints complete** as they finish
2. **Update epic status** when all child sprints complete
3. **Archive status entries** for completed sprints
4. **Document epic in closure report** (see `.agent/status/SPRINT_CLOSURE_*.md`)

### Finding What's Next

To identify the next sprint in an epic:
1. Query Grove Feature Roadmap with `Parent Spec` = epic name
2. Filter by `Status` != `✅ complete`
3. Sort by sprint number (S1, S2, S3...)

```
# Example: Find incomplete SFR sprints
Search: "Parent Spec: Sprout Finishing Room v1" + Status != complete
```

---

## Agent Coordination System

### Skills Inventory

| Skill | Triggers | Purpose |
|-------|----------|---------|
| `/randy` | "chief-of-staff", "cos", "infrastructure check" | Infrastructure health, protocol validation (run FIRST) |
| `/sprintmaster` | "let's roll", "sprint status", "what's cooking" | Session warmup, pipeline dashboard, agent dispatch |
| `/grove-foundation-loop` | "plan sprint", "Foundation Loop", "Trellis" | Sprint planning with tier selection |
| `/grove-execution-protocol` | "sprint", "implement", "build feature" | Execution contracts, DEX compliance |
| `/user-story-refinery` | "user stories", "acceptance criteria" | Generate Gherkin ACs from requirements |
| `/dex-master` | post-commit, manual scan | Code review → Fix Queue + Strategic Notes |
| `/mine-sweeper` | "test cleanup", "fix tests", "clear fixme" | Test debt cleanup with strangler fig boundaries |
| `/product-manager` | "product vision", "draft brief", "roadmap" | Strategic product ownership, DEX-aligned briefs |
| `/ui-ux-designer` | "wireframe", "mockup", "design system" | Interface design, pattern documentation |
| `/user-experience-chief` | (with Product Pod) | DEX guardian, approval authority |

### Status Log System

**Location:** `.agent/status/current/{NNN}-{timestamp}-{agent}.md`

**Template:** `.agent/status/ENTRY_TEMPLATE.md`

**Status values:** STARTED → IN_PROGRESS → COMPLETE (with BLOCKED branch)

**Heartbeat:** Update `heartbeat:` field in-place every 5 min during active work. 30-min staleness threshold.

### Agent Startup Sequence

```
1. /randy              # FIRST - infrastructure health check
2. /sprintmaster       # Pipeline dashboard, agent dispatch
3. Developer/QA/etc.   # As dispatched per sprint queue
```

**Chief of Staff runs first.** If infrastructure is unhealthy, fix before spawning other agents.

### Key File Locations

| Location | Purpose | Git |
|----------|---------|-----|
| `.agent/skills/` | Skill definitions (source of truth) | **Tracked** |
| `~/.claude/skills/` | Skill runtime (synced from repo) | Local |
| `.agent/roles/` | Role definitions | Tracked |
| `.agent/config/` | Coordination config | Tracked |
| `.agent/status/current/` | Active entries | **Gitignored** |
| `.agent/status/archive/` | Historical entries | Tracked |
| `~/.claude/notes/grove-runbook.md` | Central agent reference | Local |

### Skills Sync

Skills are version-controlled in `.agent/skills/` and synced to local:

```bash
# After clone or pull
./scripts/sync-skills.sh

# After local development
./scripts/sync-skills.sh --reverse
```

**Documentation:** `docs/SKILLS_SYNC.md` | **Authoring guide:** `.agent/skills/README.md`

### Product Pod Workflow

The Product Pod is a collaborative team of three skills for new product initiatives:

**Members:**
- **User Experience Chief** - DEX guardian, takes first draft, approval authority
- **Product Manager** - Reviews for details, UX elegance, roadmap fit
- **UI/UX Designer** - Wireframes, pattern documentation, accessibility

**Workflow:**
```
Initiative triggered
       │
       ▼
┌─────────────────┐
│   UX Chief      │ ◄─── Drafts Product Brief
│                 │      Consults Advisory Council
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Product Manager │ ◄─── Reviews for details, UX elegance, roadmap fit
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  UI/UX Designer │ ◄─── Creates wireframes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   UX Chief      │ ◄─── Final DEX sign-off
│   APPROVAL      │
└────────┬────────┘
         │
         ▼
   User Review → user-story-refinery
```

**Spawn Command:**
```
spawn product-pod {initiative}
```

### DEX Pillars (verified by UX Chief)

| Pillar | Verification |
|--------|--------------|
| **Declarative Sovereignty** | Can behavior be changed via config, not code? |
| **Capability Agnosticism** | Does it work regardless of which model executes? |
| **Provenance as Infrastructure** | Is origin/authorship tracked for all data? |
| **Organic Scalability** | Does structure support growth without redesign? |

### UX Chief: Drift Detector (v1.0 Strangler Fig)

**Purpose:** Proactively detect and block backwards drift toward frozen legacy code during the strangler fig migration from MVP (Foundation/Terminal) to v1.0 reference implementation (Bedrock/Explore).

#### ❌ Frozen Zones (NEVER Reference)

| Frozen Path | Status | Reason |
|-------------|--------|--------|
| `/foundation/*` | FROZEN | Legacy admin UI, locked for migration |
| `/terminal/*` | FROZEN | MVP chat interface, superseded by /explore |
| `src/foundation/consoles/*` | FROZEN | All Foundation consoles locked |
| `server.js` GCS loaders | DEPRECATED | v1.0 uses GroveDataProvider |
| `components/AdminNarrativeConsole.tsx` | FROZEN | Legacy admin tooling |

#### ✅ v1.0 Patterns (ALWAYS Use)

| Pattern | v1.0 Implementation |
|---------|---------------------|
| Admin UI | `/bedrock/consoles/ExperienceConsole` |
| User Chat | `/explore` |
| Config Storage | Supabase tables (NOT GCS files) |
| Data Access | `useGroveData()` hook |
| Console Pattern | ExperienceConsole factory |

#### 🚨 High-Risk Terminology

When these terms appear in briefs/specs, **IMMEDIATELY ASK** for clarification:

| Term | Legacy Meaning | v1.0 Equivalent |
|------|----------------|-----------------|
| **RealityTuner** | Foundation console | ExperienceConsole (if ported) |
| **Terminal** | MVP chat interface | /explore |
| **AdminNarrativeConsole** | Foundation editor | N/A (deprecated) |
| **GCS infrastructure files** | `infrastructure/*.json` | Supabase tables |
| **server.js endpoints** | `/api/admin/*` routes | Supabase + GroveDataProvider |
| **Foundation theme** | Old design system | Quantum Glass v1.0 |

#### Pre-Approval Checklist

Before UX Chief sign-off, VERIFY:

- [ ] NO references to /foundation or /terminal paths
- [ ] NO GCS file storage for new configs
- [ ] NO custom CRUD (uses useGroveData pattern)
- [ ] NO Foundation-specific components
- [ ] Design system specified as Quantum Glass v1.0 (NOT Living Glass v2)
- [ ] Console integration uses ExperienceConsole factory
- [ ] SINGLETON enforcement via factory (not manual)

**IF ANY FAIL → BLOCK APPROVAL**

**Full protocol:** `.agent/roles/user-experience-chief-DRIFT_DETECTOR.md`

**Motto:** *"Frozen means frozen. Detect drift early, block drift firmly."*
