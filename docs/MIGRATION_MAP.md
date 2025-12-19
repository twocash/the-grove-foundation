# MIGRATION MAP - V2.1 Implementation

> **Status:** ✅ MIGRATION COMPLETE
> **Completed:** 2025-12-18

This document tracks the V2.0 → V2.1 migration. All items below have been implemented.

---

## Deletions / Deprecations ✅

| Item | Status | Notes |
|------|--------|-------|
| `utils/threadGenerator.ts` | ✅ DELETED | Thread-based scoring obsolete under V2.1 |
| `components/Terminal/JourneyEnd.tsx` | ✅ DELETED | Replaced with inline Journey Complete panel |
| `components/Terminal/ThreadProgress.tsx` | ✅ DELETED | Progress now via journey node position |
| V2.0 session fields | ✅ DEPRECATED | `currentThread`, `currentPosition` kept as shims only |

---

## Engine Refactor ✅

| Item | Status | Implementation |
|------|--------|----------------|
| V2.1 schema loading | ✅ DONE | `useNarrativeEngine` preserves V2.1 without backfill |
| Journey APIs | ✅ DONE | `startJourney`, `advanceNode`, `exitJourney`, `getNode`, `getJourney`, `getNextNodes` |
| Journey state persistence | ✅ DONE | `activeJourneyId`, `currentNodeId`, `visitedNodes` in session |
| Entropy bridge | ✅ PRESERVED | Triggers `startJourney()` when hub detected |

---

## Terminal UI Changes ✅

| Item | Status | Implementation |
|------|--------|----------------|
| `suggestedTopics` | ✅ REMOVED | No longer in Terminal.tsx |
| `suggestedLenses` | ✅ REMOVED | No longer in Terminal.tsx |
| Thread progress UI | ✅ REMOVED | ThreadProgress.tsx deleted |
| JourneyEnd | ✅ REPLACED | Inline Journey Complete panel added |
| Navigation buttons | ✅ DONE | "Continue the Journey" chips for primaryNext/alternateNext |

---

## Admin Updates ✅

| Item | Status | Implementation |
|------|--------|----------------|
| Stop card backfill | ✅ DONE | NarrativeArchitect preserves V2.1 schema directly |
| Journey/Node view | ✅ DONE | V2.1 schemas show Journeys/Nodes tabs (read-only) |
| V2.0 compatibility | ✅ PRESERVED | Cards/Personas tabs for V2.0 schemas |

---

## Data Contracts ✅

### API Schema (`/api/narrative`)
```typescript
// V2.1 canonical shape:
{
  version: "2.1",
  globalSettings: GlobalSettings,
  journeys: Record<string, Journey>,
  nodes: Record<string, JourneyNode>,
  hubs: Record<string, TopicHub>
}
```

### Session State (localStorage)
```typescript
interface TerminalSession {
  activeLens: string | null;
  scholarMode: boolean;

  // V2.1 Journey State
  activeJourneyId: string | null;
  currentNodeId: string | null;
  visitedNodes: string[];

  // Deprecated (kept for backward compat)
  currentThread: string[];
  currentPosition: number;
  visitedCards: string[];
  exchangeCount: number;
}
```

### localStorage Keys
| Key | Content |
|-----|---------|
| `grove-terminal-lens` | Active lens ID |
| `grove-terminal-session` | Session state with journey fields |
| `grove-engagement-state` | Engagement metrics |
| `grove-entropy-state` | Entropy/bridge cooldowns |

---

## Key Architectural Decisions

1. **Lenses ≠ Journeys**: Lenses are tonal modifiers only. Changing lens does NOT reset journey progress.

2. **Node Navigation**: Journeys define paths via `primaryNext` and `alternateNext` on each node.

3. **Cognitive Bridge**: Entropy detection triggers `startJourney()` to begin a relevant journey.

4. **Admin Read-Only**: V2.1 admin console is read-only for journeys/nodes (editing to be added in future sprint).

---

*Completed: 2025-12-18 by Claude (modest-vaughan worktree)*
