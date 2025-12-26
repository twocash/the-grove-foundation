# Post-Sprout System Roadmap

**Created:** 2025-12-26
**Last Updated:** 2025-12-26
**Owner:** Jim Calhoun
**Status:** Active Planning

---

## Strategic Context

The Sprout System provides the **capture primitive** that enables content refinement. Before building narrative features (Diary System), we need to:

1. **Wire existing infrastructure** — Sprout System is 80% built, needs connection
2. **Surface sprouts in dashboard** — Visibility without mode-switching
3. **Polish UX touchpoints** — Journeys, lenses, welcome prompts need cleanup
4. **Then** build narrative exposure (Diaries)

This sequencing ensures a complete, demo-ready UX before adding complexity.

---

## Phase 1: Complete Sprout System (Current Sprint)

**Sprint:** `sprout-system-wiring-v1`
**Status:** 🔄 In Progress
**Estimated:** 2-3 hours

### Scope
- Wire Terminal → Sprout capture (CommandContext methods)
- Add human-readable provenance to schema
- Garden as MODE (not modal) per Foundation Refactor spec
- Stats integration with Garden section

### Deliverables
- [ ] Schema: `SproutProvenance` interface with lens/hub/journey names
- [ ] Terminal: `captureSprout()`, `getLastResponse()`, `getSessionContext()`
- [ ] GardenView: Real implementation replacing placeholder
- [ ] StatsModal: Garden section with sprout counts
- [ ] `/garden` command switches mode (not opens modal)

### Acceptance Criteria
- [ ] `/sprout` captures with toast confirmation
- [ ] `/sprout --tag=X --note="Y"` works
- [ ] `/garden` switches to Garden mode
- [ ] Garden shows sprouts with provenance (lens name, hub name)
- [ ] `/stats` shows Garden section
- [ ] Persists across sessions (localStorage)

---

## Phase 2: Dashboard Sprout Widget

**Sprint:** `dashboard-sprout-widget-v1`
**Status:** 🔄 In Progress
**Estimated:** 1-2 hours
**Depends on:** Phase 1 complete

### Scope
Pull Garden statistics into Grove Project dashboard for at-a-glance visibility.

---

## Phase 2.5: Server-Side Capture

**Sprint:** `server-side-capture-v1`
**Status:** 📋 Queued (see `docs/sprints/server-side-capture-v1/`)
**Estimated:** 6-8 hours
**Depends on:** Phase 2 complete

### Scope
Add optional server-side persistence for sprouts with vector search capability:
- Feature flag (`NEXT_PUBLIC_SPROUT_STORAGE=server|local`)
- Supabase Postgres + pg_vector storage
- OpenAI embeddings for semantic search
- API routes for CRUD + similarity search
- Fallback to localStorage when server unavailable

### Why Now
- Closes the "how does collective knowledge grow?" loop
- Enables demo: "Look at what the community discovered"
- Forward-compatible foundation for Knowledge Commons
- Vector search enables "find related insights" feature

### Key Deliverables
- [ ] Supabase schema with vector embeddings
- [ ] API routes: POST/GET /api/sprouts, POST /api/sprouts/search
- [ ] Feature flag in useSproutStorage hook
- [ ] Embedding generation via OpenAI ada-002
- [ ] Graceful fallback to localStorage

---

## Phase 3: UX Polish Sprint (Pre-Narrative)

**Sprint:** `terminal-ux-polish-v1`
**Status:** 📋 Planned
**Estimated:** 4-6 hours

Before narrative features, these inline implementations need refinement:

### 3.1 Journey Flow Polish
| Item | Current State | Target State |
|------|---------------|--------------|
| Journey picker | Basic modal | Inline selection with preview |
| Journey progress | Header badge | Ambient progress indicator |
| Journey completion | No feedback | Celebration + next suggestion |
| Journey restart | Manual | Clear "Start Over" action |

### 3.2 Personal Lens Creation
| Item | Current State | Target State |
|------|---------------|--------------|
| Custom lens | Not implemented | "Create Your Lens" flow |
| Lens editing | Admin only | User can edit their custom lenses |
| Lens saving | Server-side | localStorage for MVP |
| Lens presets | None | "Start from template" option |

### 3.3 Suggested Topics
| Item | Current State | Target State |
|------|---------------|--------------|
| Topic suggestions | Static welcome | Context-aware based on lens |
| "You might explore" | None | After each response |
| Hub highlighting | Subtle | Clear visual connection to topics |
| Related questions | None | "Others also asked" pattern |

### 3.4 Welcome Experience
| Item | Current State | Target State |
|------|---------------|--------------|
| Initial welcome | Generic message | Lens-specific greeting |
| Onboarding flow | None | Optional guided first steps |
| Return visit | Same as new | "Welcome back" with context |
| Empty state | Starter questions | Personalized suggestions |

### Success Criteria
- [ ] New user can pick a lens and start exploring in <30 seconds
- [ ] Journey progress is visible and encouraging
- [ ] Topic suggestions feel contextual, not random
- [ ] Return visitors see continuity, not blank slate

---

## Phase 4: Version History UI

**Sprint:** `version-history-ui-v1`
**Status:** 📋 Planned
**Estimated:** 2-3 hours
**Depends on:** Object versioning infrastructure (complete)

### Scope
Surface the versioning infrastructure built in `object-versioning-v1`:
- Version history panel in inspector
- Diff view between versions
- Restore previous version action
- "Last edited" timestamp display

---

## Phase 5: Diary System (Narrative Layer)

**Status:** 📝 Notes captured (see below)
**Depends on:** Phases 1-4 complete

The Diary System is the **core engagement hook** per Advisory Council consensus. However, it requires:
- Clean UX foundation (Phases 3-4)
- Working sprout capture (Phase 1)
- Dashboard visibility (Phase 2)

Deferring until UX polish is complete ensures diaries land in a coherent experience.

---

## Sprint Spec: Dashboard Sprout Widget v1

### Overview
Add a Garden summary widget to the Grove Project dashboard, showing sprout statistics and quick access to Garden mode.

### User Story
**As a** Grove user viewing my project dashboard
**I want** to see my sprout statistics at a glance
**So that** I know my contribution status without switching modes

### Location
`src/workspace/views/ProjectDashboard.tsx` (or equivalent dashboard component)

### Design

```
┌─────────────────────────────────────────┐
│ 🌱 Your Garden                    View →│
├─────────────────────────────────────────┤
│                                         │
│   12        0         0                 │
│ Sprouts  Saplings   Trees              │
│                                         │
│ ─────────────────────────────────────── │
│ Latest: "The Ratchet effect explains..." │
│ 2 hours ago · #infrastructure           │
│                                         │
└─────────────────────────────────────────┘
```

### Components

**GardenWidget.tsx** (new)
```typescript
interface GardenWidgetProps {
  onViewGarden: () => void;  // Navigate to Garden mode
}

// Uses useSproutStats() hook
// Shows: totalSprouts, sessionSprouts, recentSprouts[0] preview
// "View →" button calls onViewGarden
```

### Implementation Steps

1. **Create component:** `src/workspace/components/GardenWidget.tsx`
2. **Import hook:** `useSproutStats` from `hooks/useSproutStats`
3. **Wire navigation:** `setMode('garden')` from WidgetUIContext
4. **Add to dashboard:** Import and place in ProjectDashboard grid
5. **Style:** Use existing `glass-card` pattern

### Files to Modify
- Create: `src/workspace/components/GardenWidget.tsx`
- Modify: Dashboard component (identify exact location)
- Modify: Dashboard grid layout

### Acceptance Criteria
- [ ] Widget shows total sprout count
- [ ] Widget shows lifecycle breakdown (sprouts/saplings/trees)
- [ ] Widget shows most recent sprout preview
- [ ] "View" button navigates to Garden mode
- [ ] Empty state shows "Plant your first sprout" message
- [ ] Matches glass-card aesthetic

### Build Gate
`npm run build` must pass

---

## Diary System Notes (Deferred)

### Advisory Council Consensus
> "Diary system is the core engagement hook" — 6+ advisors agree

### Architecture Reference
- `Grove_Diary_System_Deep_Dive.docx` in project knowledge
- `Grove_Simulation_Deep_Dive.docx` — engagement mechanics

### Emily Short's Structure
Diaries need: **context → events → emotion → reflection → forward look**

### Key Design Questions (To Resolve Later)
1. **Who writes diaries?** Agents? The Grove itself? User's "research journal"?
2. **When generated?** Daily? After significant interactions? On-demand?
3. **Voice differentiation:** How do different agents/lenses sound different?
4. **Sprout connection:** How do user sprouts influence diary content?

### Technical Dependencies
- Agent simulation (not yet implemented)
- Voice/persona system (partially implemented via lenses)
- Time progression model (not yet implemented)

### MVP Scope (When Ready)
- Single "Grove Journal" voice (not multiple agents)
- Generated after user sessions (not real-time)
- Reflects sprouts user planted
- Shows in Diary view mode

---

## Roadmap Visualization

```
Current
   │
   ▼
┌──────────────────────────────────┐
│ Phase 1: Sprout System Wiring    │ ✅ Complete
│ - Wire Terminal → capture        │
│ - Garden as mode                 │
│ - Stats integration              │
└──────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Phase 2: Dashboard Widget        │ ◀── YOU ARE HERE
│ - Garden summary in dashboard    │
│ - Quick stats visibility         │
└──────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Phase 2.5: Server-Side Capture   │ 📋 QUEUED
│ - Supabase + pg_vector           │
│ - Vector similarity search       │
│ - Feature flag toggle            │
└──────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Phase 3: UX Polish               │
│ - Journey flow                   │
│ - Personal lens creation         │
│ - Suggested topics               │
│ - Welcome experience             │
└──────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Phase 4: Version History UI      │
│ - Surface versioning infra       │
│ - Restore/diff views             │
└──────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────┐
│ Phase 5: Diary System            │
│ - Narrative layer                │
│ - Engagement hook                │
│ - (Full spec TBD)                │
└──────────────────────────────────┘
```

---

## Success Metrics

| Phase | Key Metric |
|-------|------------|
| Phase 1 | Sprouts persist, Garden mode works |
| Phase 2 | Dashboard shows sprout stats |
| Phase 2.5 | Sprouts persist to server, vector search works |
| Phase 3 | New user completes first exploration in <30s |
| Phase 4 | User can restore previous lens configuration |
| Phase 5 | Users return to check "what happened" |

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-26 | Initial roadmap created |
| | Sprout System wiring sprint defined |
| | Dashboard widget spec drafted |
| | UX polish items catalogued |
| | Diary system deferred with notes |
