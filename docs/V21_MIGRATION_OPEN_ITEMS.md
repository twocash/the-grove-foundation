# V2.1 Migration: Open Items for Guided UX Fix

> **Date**: 2025-12-18
> **Status**: Architecture analysis complete, ready for comprehensive refactor
> **Context**: AI agent drift during V2.0→V2.1 migration created hybrid code that should be cleaned up

## Current State Summary

The codebase has **dual-model support** that should be deprecated. V2.1 is the canonical schema, but V2.0 artifacts remain throughout, causing:
- Token burn from compatibility checks
- Confusing UX flows (JourneyEnd forcing lens changes mid-journey)
- Broken admin consoles (NarrativeArchitect designed for V2.0 cards/personas)

## V2.1 Canonical Model

```typescript
// What SHOULD drive the experience:
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

## V2.0 Legacy (Should Be Removed)

```typescript
// What's STILL in the code but shouldn't drive V2.1:
{
  version: "2.0",
  personas: Record<string, Persona>,  // IN SCHEMA - should only be DEFAULT_PERSONAS
  cards: Record<string, Card>         // Replaced by nodes
}
```

---

## Open Items: Files to Refactor

### Priority 1: Terminal.tsx (Critical Path)

**Current issues:**
- `suggestedTopics` - calls `getEntryPoints()` which uses V2.0 cards
- `suggestedLenses` - suggests lens changes mid-journey
- `JourneyEnd` component - forces lens selection, breaks journey flow
- `currentThread` / `currentPosition` - V2.0 thread concept, not V2.1 node navigation
- `getNextCards()` - tries V2.0 cards before V2.1 nodes

**Target state:**
- Remove `suggestedTopics`, `suggestedLenses`
- Remove or radically simplify `JourneyEnd`
- Navigation driven by V2.1 `nodes[id].primaryNext` / `alternateNext`
- Progress tracked by journey node position, not thread index

### Priority 2: useNarrativeEngine.ts

**Current issues:**
- Loads `schema.cards` and `schema.personas` from API
- Falls back to V2.0 structure when V2.1 detected
- `getPersonaCards()`, `getEntryPoints()` - V2.0 concepts
- `currentThread`, `regenerateThread()` - V2.0 thread generation

**Target state:**
- Remove card/persona loading from schema
- Use `DEFAULT_PERSONAS` for lenses (tone filters only)
- Add `getJourney()`, `getJourneyNodes()`, `getNode()`
- Journey state: `activeJourney`, `visitedNodes`, `currentNodeId`

### Priority 3: threadGenerator.ts

**Current issues:**
- Entire file is V2.0 concept (generate threads from persona arcEmphasis)
- `suggestNewTopics()` - uses cards
- `detectBestLens()` - uses cards

**Target state:**
- **DELETE THIS FILE** or gut it completely
- V2.1 journeys define their own node sequences via `primaryNext`/`alternateNext`

### Priority 4: JourneyEnd.tsx

**Current issues:**
- Shows "Same Topic, New Lens" which kills journey
- Shows "Same Lens, New Topic" which requires V2.0 cards
- Designed for V2.0 card-based exploration

**Target state:**
- **DELETE or replace** with V2.1 journey completion component
- Options should be: "Continue Journey", "Start New Journey", "Freestyle"

### Priority 5: Admin Consoles

**NarrativeArchitect.tsx:**
- Built for V2.0 cards/personas
- Crashes on V2.1 (fixed with guards, but fundamentally wrong tool)
- Needs V2.1 Journey/Node editor instead

**RealityTuner.tsx:**
- Works with V2.1 after normalization fix
- Still references V2.0 fallback schema

---

## Files with V2.0 Dependencies

| File | V2.0 Artifacts | Action |
|------|----------------|--------|
| `components/Terminal.tsx` | suggestedTopics, suggestedLenses, JourneyEnd, currentThread | Refactor |
| `hooks/useNarrativeEngine.ts` | getPersonaCards, getEntryPoints, threadGenerator usage | Refactor |
| `utils/threadGenerator.ts` | Entire file is V2.0 | Delete |
| `components/Terminal/JourneyEnd.tsx` | Card-based suggestions | Delete/Replace |
| `components/Admin/NarrativeConsole.tsx` | V2.0 card editor | Legacy, ignore |
| `src/foundation/consoles/NarrativeArchitect.tsx` | V2.0 card/persona editor | Replace with V2.1 editor |
| `data/narratives-schema.ts` | NarrativeSchemaV2 includes cards/personas | Keep for types, remove runtime usage |
| `App.tsx` | V2.0 fallback schema | Update fallback |

---

## What SHOULD Remain

### DEFAULT_PERSONAS (Lenses as Tone Filters)
```typescript
// In data/default-personas.ts - KEEP THIS
const DEFAULT_PERSONAS = {
  'freestyle': { toneGuidance: "...", ... },
  'concerned-citizen': { toneGuidance: "...", ... },
  // etc.
};
```
Lenses modify HOW content is presented (tone, vocabulary), not WHAT content is shown.

### LensPicker Component
Keep but rename conceptually to "tone picker". User can change lens without affecting journey progress.

### Entropy/Cognitive Bridge
Keep - this correctly suggests V2.1 journeys based on conversation entropy.

---

## Proposed Refactor Steps

### Phase 1: Remove Dead Code
1. Delete `utils/threadGenerator.ts`
2. Delete `components/Terminal/JourneyEnd.tsx`
3. Remove `suggestedTopics`, `suggestedLenses` from Terminal.tsx
4. Remove `getPersonaCards`, `getEntryPoints` usage

### Phase 2: Simplify useNarrativeEngine
1. Remove card/persona schema loading
2. Add journey-focused methods:
   - `getJourney(id)` → Journey
   - `getNode(id)` → Node
   - `getNextNodes(nodeId)` → Node[] (from primaryNext/alternateNext)
3. Update session state:
   - Remove `currentThread`, `currentPosition`
   - Add `activeJourney`, `currentNodeId`, `visitedNodes`

### Phase 3: Update Terminal Navigation
1. Navigation driven by `nodes[id].primaryNext` / `alternateNext`
2. Journey progress shown as "Node X of Y"
3. Journey completion triggers "What's Next" (start new journey, freestyle)

### Phase 4: Admin Console
1. Create V2.1 Journey Editor (or update NarrativeArchitect)
2. Edit journeys, nodes, hubs directly
3. Remove V2.0 card/persona editing UI

---

## Deployment Verification

**Current production state (as of 2025-12-18):**
- Revision: `grove-foundation-00093-vhw`
- Main branch: `c4386e7`
- All worktree changes merged to main

**To verify:**
```bash
gcloud run services describe grove-foundation --region=us-central1 \
  --format="value(status.latestReadyRevisionName)"
```

---

## Next Session Checklist

- [ ] Start fresh Claude Code session
- [ ] Pull latest main: `git pull origin main`
- [ ] Review this document
- [ ] Execute Phase 1: Remove dead code
- [ ] Execute Phase 2: Simplify useNarrativeEngine
- [ ] Execute Phase 3: Update Terminal navigation
- [ ] Test V2.1 journey flow end-to-end
- [ ] Deploy and verify

---

*Last Updated: 2025-12-18 by Claude (beautiful-shamir worktree)*
