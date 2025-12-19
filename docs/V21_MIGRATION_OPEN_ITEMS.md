# V2.1 Migration: Completed

> **Date**: 2025-12-18
> **Status**: ✅ MIGRATION COMPLETE
> **Context**: V2.1 Journey/Node architecture now canonical; V2.0 Thread/Card artifacts removed

## Migration Summary

The V2.1 migration has been completed across two sprints:

### Sprint 1: Journey Engine + Terminal Refactor ✅
- **useNarrativeEngine.ts**: Removed threadGenerator import, added V2.1 journey methods (`startJourney`, `advanceNode`, `exitJourney`, `getJourney`, `getNode`, `getNextNodes`)
- **Terminal.tsx**: Removed `suggestedTopics`, `suggestedLenses`, `JourneyEnd`; added inline Journey Complete panel
- **Session state**: Now uses `activeJourneyId`, `currentNodeId`, `visitedNodes` (deprecated fields kept as shims)
- **TRIPWIRE enforced**: Lens switching does NOT reset journey state

### Sprint 2: Admin Alignment + Cleanup ✅
- **Dead code removed**: `utils/threadGenerator.ts`, `components/Terminal/JourneyEnd.tsx`, `components/Terminal/ThreadProgress.tsx`
- **NarrativeArchitect.tsx**: Updated to V2.1-aware UI (Journeys/Nodes view for V2.1 schemas, Cards/Personas for V2.0)
- **Schema loading**: V2.1 schemas preserved without card backfill
- **Documentation**: Updated to reflect V2.1-only runtime

---

## V2.1 Canonical Model

```typescript
// Current canonical schema structure:
{
  version: "2.1",
  globalSettings: { ... },      // Feature flags, prompts, loading messages
  journeys: {                   // Narrative arcs
    "ratchet": {
      id: "ratchet",
      title: "The Ratchet",
      entryNode: "ratchet-hook",
      linkedHubId: "ratchet-effect"  // RAG context
    }
  },
  nodes: {                      // Content nodes
    "ratchet-hook": {
      id: "ratchet-hook",
      label: "The 7-month clock",
      query: "Explain the Ratchet Effect...",
      journeyId: "ratchet",
      primaryNext: "ratchet-gap",
      alternateNext: ["stakes-380b"]
    }
  },
  hubs: { ... }                 // Topic routing for RAG
}
```

---

## Files Changed

| File | Change | Status |
|------|--------|--------|
| `hooks/useNarrativeEngine.ts` | V2.1 journey methods, deprecated thread shims | ✅ Complete |
| `components/Terminal.tsx` | Removed V2.0 artifacts, inline journey panel | ✅ Complete |
| `components/Terminal/index.ts` | Removed JourneyEnd, ThreadProgress exports | ✅ Complete |
| `utils/threadGenerator.ts` | **DELETED** | ✅ Removed |
| `components/Terminal/JourneyEnd.tsx` | **DELETED** | ✅ Removed |
| `components/Terminal/ThreadProgress.tsx` | **DELETED** | ✅ Removed |
| `src/foundation/consoles/NarrativeArchitect.tsx` | V2.1 Journey/Node view | ✅ Complete |
| `data/narratives-schema.ts` | V2.1 types added | ✅ Complete |

---

## What Remains (By Design)

### DEFAULT_PERSONAS (Lenses as Tone Filters)
```typescript
// In data/default-personas.ts - KEPT
const DEFAULT_PERSONAS = {
  'freestyle': { toneGuidance: "...", ... },
  'concerned-citizen': { toneGuidance: "...", ... },
  // etc.
};
```
Lenses modify HOW content is presented (tone, vocabulary), not WHAT content is shown.

### V2.0 Backward Compatibility (Shims)
The following are kept as deprecated shims for backward compatibility:
- `currentThread`, `currentPosition` in session state
- `regenerateThread()`, `advanceThread()`, `getThreadCard()` methods
- `getPersonaCards()`, `getEntryPoints()`, `getNextCards()` for V2.0 schemas

### Entropy/Cognitive Bridge
Correctly suggests V2.1 journeys based on conversation entropy.

---

## Key Architecture Decisions

### 1. Lens ≠ Journey
Lenses are tonal modifiers only. Changing a lens mid-journey does NOT reset journey progress.

### 2. Journey State
```typescript
interface JourneySessionState {
  activeJourneyId: string | null;   // Current journey (null = freestyle)
  currentNodeId: string | null;     // Current position in journey
  visitedNodes: string[];           // Nodes visited in this session
}
```

### 3. Node Navigation
```typescript
// V2.1 node structure
interface JourneyNode {
  id: string;
  journeyId: string;
  primaryNext?: string;       // Main continuation
  alternateNext?: string[];   // Branch options
}
```

### 4. Admin Console
- V2.1 schemas show Journeys/Nodes tabs (read-only)
- V2.0 schemas show Cards/Personas tabs (editable)
- No automatic card backfill from V2.1 schemas

---

## Testing Checklist

- [x] Build passes: `npm run build`
- [x] V2.1 journey navigation works in Terminal
- [x] Lens switching preserves journey state
- [x] Cognitive Bridge triggers `startJourney()`
- [x] Journey completion shows inline panel
- [x] NarrativeArchitect loads V2.1 without crash
- [x] V2.0 schemas still functional (backward compat)

---

## Deployment Notes

After merging, deploy with:
```bash
cd C:\GitHub\the-grove-foundation
git fetch origin && git pull origin main
gcloud builds submit --config cloudbuild.yaml
```

Verify:
```bash
gcloud run services describe grove-foundation --region=us-central1 \
  --format="value(status.latestReadyRevisionName)"
```

---

*Completed: 2025-12-18 by Claude (modest-vaughan worktree)*
