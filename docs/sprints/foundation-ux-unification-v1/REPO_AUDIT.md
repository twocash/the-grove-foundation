# Repository Audit: Grove Foundation Refactor

**Generated:** December 21, 2025
**Sprint:** foundation-ux-unification-v1
**Purpose:** Document current state for Grove Widget implementation

---

## Executive Summary

The Grove Foundation codebase is well-organized with clear separation between Surface (user-facing), Foundation (admin), and Core (engine) layers. The Terminal is the primary user interface with comprehensive command infrastructure already in place. The Sprout System is fully implemented for response capture.

**Key Insight:** Most of the infrastructure for the Grove Widget already exists—we're reorganizing and unifying, not building from scratch.

---

## 1. Directory Structure

```
src/
├── core/                      # Pure TypeScript (no React)
│   ├── schema/               # Type definitions
│   │   ├── base.ts           # SectionId, ChatMessage, NarrativeNode
│   │   ├── narrative.ts      # Persona, Card, GlobalSettings
│   │   ├── lens.ts           # CustomLens, Archetype
│   │   ├── engagement.ts     # EngagementState, Events, Triggers
│   │   ├── rag.ts            # HubsManifest, TieredContextResult
│   │   ├── ab-testing.ts     # HookVariant, ABTest
│   │   └── sprout.ts         # Sprout data model [KEY]
│   ├── engine/               # Business logic
│   │   ├── triggerEvaluator.ts
│   │   ├── topicRouter.ts
│   │   └── ragLoader.ts
│   └── config/
│       └── defaults.ts       # All DEFAULT_* values
├── surface/                   # User-facing experience (placeholder)
├── foundation/                # Admin console
│   ├── layout/               # FoundationLayout, HUDHeader, NavSidebar
│   ├── components/           # DataPanel, GlowButton, MetricCard
│   └── consoles/             # 7 console modules
└── router/
    └── routes.tsx            # React Router configuration

components/                    # Legacy Surface components
├── Terminal.tsx              # Main Terminal (1,469 lines) [KEY]
├── Terminal/
│   ├── CommandInput/         # Command infrastructure [KEY]
│   │   ├── CommandRegistry.ts
│   │   ├── CommandInput.tsx
│   │   ├── CommandAutocomplete.tsx
│   │   └── commands/         # 7 registered commands
│   ├── Modals/               # Modal dialogs [KEY]
│   │   ├── GardenModal.tsx   # Sprout display
│   │   ├── StatsModal.tsx
│   │   ├── HelpModal.tsx
│   │   └── JourneysModal.tsx
│   ├── Reveals/              # Progressive reveals
│   ├── CustomLensWizard/     # 5-step wizard
│   └── ConversionCTA/        # Conversion flows

hooks/                         # Shared React hooks [KEY]
├── useSproutStorage.ts       # Sprout CRUD
├── useSproutCapture.ts       # Capture with context
├── useSproutStats.ts         # Statistics
├── useEngagementBus.ts       # Event bus singleton
├── useNarrativeEngine.ts     # V2.1 journey engine
└── useCustomLens.ts          # Custom lens CRUD

services/                      # API clients
├── chatService.ts            # Server-side chat
└── audioService.ts           # TTS

server.js                      # Express backend
```

---

## 2. Current Terminal Architecture

### Component: `components/Terminal.tsx`

**Size:** 1,469 lines
**Complexity:** High (many concerns mixed)

**Props:**
```typescript
interface TerminalProps {
  activeSection: SectionId;
  terminalState: TerminalState;
  setTerminalState: React.Dispatch<React.SetStateAction<TerminalState>>;
  externalQuery?: { nodeId?: string; display: string; query: string } | null;
  onQueryHandled?: () => void;
}
```

**Hooks Used:**
- `useNarrativeEngine()` - Journey/node navigation
- `useEngagementBridge()` - Engagement state + reveals
- `useCustomLens()` - Custom lens management
- `useFeatureFlags()` - Feature toggles
- `useStreakTracking()` - Streak persistence
- `useSproutCapture()` - Sprout capture

**Internal State:** 15+ useState hooks managing:
- Messages array
- Input value
- Modal visibility (help, journeys, stats, garden)
- Loading state
- Show welcome
- Show lens picker
- Custom lens wizard visibility
- Journey/free mode state
- Scholar mode toggle
- Bridge state

---

## 3. Sprout System Status

### Data Model (`src/core/schema/sprout.ts`)

```typescript
interface Sprout {
  id: string;
  capturedAt: string;
  response: string;
  query: string;
  personaId: string | null;
  journeyId: string | null;
  hubId: string | null;
  nodeId: string | null;
  status: 'sprout';
  tags: string[];
  notes: string | null;
  sessionId: string;
  creatorId: string | null;
}
```

### Hooks

| Hook | Purpose | Ready for Widget? |
|------|---------|-------------------|
| `useSproutStorage()` | localStorage CRUD | Yes |
| `useSproutCapture()` | Capture with context | Yes |
| `useSproutStats()` | Aggregations | Yes |

### Commands

| Command | Implementation | Ready? |
|---------|----------------|--------|
| `/sprout` | `commands/sprout.ts` | Yes |
| `/garden` | `commands/garden.ts` | Yes |

### UI

| Component | Location | Notes |
|-----------|----------|-------|
| `GardenModal` | `Terminal/Modals/GardenModal.tsx` | Modal—needs conversion to view |

---

## 4. Command Infrastructure

### Pattern

Commands use a registry pattern in `CommandRegistry.ts`:

```typescript
interface Command {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  execute: (context: CommandContext, args?: string) => CommandResult;
}
```

### Registered Commands (7)

| ID | Aliases | Type |
|----|---------|------|
| `help` | `/help`, `/?` | Modal |
| `welcome` | `/welcome` | Action |
| `lens` | `/lens`, `/persona` | Action |
| `journeys` | `/journeys`, `/paths` | Modal |
| `stats` | `/stats` | Modal |
| `sprout` | `/sprout`, `/capture`, `/save` | Action |
| `garden` | `/garden`, `/sprouts` | Modal |

### Integration Points

- `CommandContext` provides: `openModal()`, `switchLens()`, `showToast()`, `captureSprout()`
- Commands return: `{ type: 'modal' | 'action' | 'error', ... }`
- Easy to add new commands: `/explore`, `/chat`

---

## 5. Foundation Console Structure

### Layout Components

| Component | Path | Purpose |
|-----------|------|---------|
| `FoundationLayout` | `src/foundation/layout/FoundationLayout.tsx` | Wrapper with Outlet |
| `HUDHeader` | `src/foundation/layout/HUDHeader.tsx` | Top bar |
| `NavSidebar` | `src/foundation/layout/NavSidebar.tsx` | Left navigation |
| `GridViewport` | `src/foundation/layout/GridViewport.tsx` | Content wrapper |

### Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `DataPanel` | `src/foundation/components/DataPanel.tsx` | Card wrapper |
| `GlowButton` | `src/foundation/components/GlowButton.tsx` | Styled button |
| `MetricCard` | `src/foundation/components/MetricCard.tsx` | Metric display |

### Design System

- Colors: `holo-cyan`, `holo-red`, `holo-lime`, `holo-amber`
- Background: `obsidian`, `obsidian-raised`
- Typography: `font-mono` (headers), `font-sans` (content)

---

## 6. localStorage Keys

| Key | Purpose | Owner |
|-----|---------|-------|
| `grove-sprouts` | Sprout data | useSproutStorage |
| `grove-session-id` | Session tracking | useSproutCapture |
| `grove-terminal-lens` | Active lens | Terminal |
| `grove-terminal-session` | Terminal state | Terminal |
| `grove-custom-lenses` | Custom lens data (encrypted) | useCustomLens |
| `grove-engagement-state` | Engagement metrics | useEngagementBus |
| `grove-event-history` | Recent events | useEngagementBus |
| `grove-streak-data` | Streak tracking | useStreakTracking |

**Widget Keys (to add):**
- `grove-widget-mode` - Current widget mode
- `grove-widget-session` - Widget session state

---

## 7. What Exists vs. What We Need

### Exists (Reusable)

| Component/Hook | Location | Reuse Strategy |
|----------------|----------|----------------|
| Sprout storage | `hooks/useSproutStorage.ts` | Direct use |
| Sprout capture | `hooks/useSproutCapture.ts` | Direct use |
| Sprout stats | `hooks/useSproutStats.ts` | Direct use |
| Command registry | `Terminal/CommandInput/CommandRegistry.ts` | Extend with new commands |
| Command input | `Terminal/CommandInput/CommandInput.tsx` | Adapt for widget |
| GardenModal content | `Terminal/Modals/GardenModal.tsx` | Extract to GardenView |
| Engagement bus | `hooks/useEngagementBus.ts` | Direct use |
| Journey engine | `hooks/useNarrativeEngine.ts` | Direct use |

### Needs Creation

| Component | Priority | Description |
|-----------|----------|-------------|
| `GroveWidget.tsx` | P0 | Unified container |
| `WidgetUIContext.tsx` | P0 | Mode/inspector state |
| `WidgetHeader.tsx` | P0 | Ambient status bar |
| `ModeToggle.tsx` | P0 | Footer mode switcher |
| `CommandPalette.tsx` | P0 | Full-screen command picker |
| `GardenView.tsx` | P1 | Garden mode content |
| `ExploreView.tsx` | P1 | Explore mode content (Terminal extraction) |
| `ChatPlaceholder.tsx` | P2 | Coming soon view |
| `GrowthStageGroup.tsx` | P1 | Sprout grouping by stage |
| `SproutCard.tsx` | P1 | Individual sprout display |

---

## 8. Risk Assessment

### Low Risk
- Sprout system is stable and well-tested
- Command infrastructure is extensible
- Foundation patterns are established

### Medium Risk
- Terminal.tsx is 1,469 lines—extraction requires care
- Modal → View conversion needs planning
- Mode switching UX is new interaction pattern

### High Risk
- None identified—this is primarily a reorganization

---

## 9. Recommended Approach

1. **Phase 1: Shell** - Build GroveWidget container with mode switching before touching Terminal
2. **Phase 2: Garden** - Extract GardenModal content to GardenView
3. **Phase 3: Explore** - Wrap existing Terminal in ExploreView
4. **Phase 4: Unify** - Migrate Terminal internals to widget pattern

This preserves the working Terminal while building the new structure.

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-21 | Claude | Initial audit |
