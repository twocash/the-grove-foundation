# Engagement Phase 2 - Continuation Prompt

**Last Updated:** 2024-12-24
**Current Epic:** 7 - Context Cleanup

---

## Quick Context

You are continuing work on the **Grove Foundation engagement system**. 

**Phase 2 Status:**
- ✅ Epic 0-5: Core engagement infrastructure (152 tests)
- ✅ Epic 6.1: React 19 test fix (Vitest 3.2.4)
- ✅ Epic 6: Consumer migration (4 components migrated)
- 🟡 **Epic 7: Context cleanup** ← CURRENT

---

## Current Sprint

**Epic 7: Context Cleanup**

Remove ~200 lines of duplicate state from NarrativeEngineContext now that engagement hooks handle lens, journey, and entropy state.

### Sprint Documents

```
docs/sprints/engagement-phase2/epic-7-context-cleanup/
├── REPO_AUDIT.md       # What to remove vs keep
├── SPEC.md             # Success criteria  
├── ARCHITECTURE.md     # Before/after structure
├── MIGRATION_MAP.md    # Exact code changes
├── DECISIONS.md        # ADRs (082-087)
├── SPRINTS.md          # Story breakdown
├── EXECUTION_PROMPT.md # CLI handoff instructions
└── DEVLOG.md           # Track progress here
```

### Key Files

- `hooks/NarrativeEngineContext.tsx` (694 → ~500 lines)
- `components/Terminal.tsx` (import cleanup)

---

## To Resume Work

1. Read `EXECUTION_PROMPT.md` for full instructions
2. Check `DEVLOG.md` for progress
3. Continue from the last completed phase

### If Starting Fresh

```bash
cd C:\GitHub\the-grove-foundation
# Follow EXECUTION_PROMPT.md phases in order
```

---

## Build Commands

```bash
npm run build        # TypeScript compilation
npm test            # Run all 152 unit tests
npm run dev         # Start dev server
```

---

## What's Being Removed

From NarrativeEngineContext:
- Lens state: `selectLens` callback
- Journey state: `startJourney`, `advanceNode`, `exitJourney`, `activeJourneyId`, `currentNodeId`, `visitedNodes`
- Entropy state: `entropyState`, all entropy callbacks

What's staying:
- Schema loading and getters
- Session tracking (exchangeCount, visitedCards)
- First-time user detection
- Legacy thread methods (deprecated but used)

---

## After Epic 7

Phase 2 will be **complete**. The engagement system is fully integrated:
- Modular hooks (useLensState, useJourneyState, useEntropyState)
- State machine architecture (XState)
- Clean provider separation (schema vs state)
- 152+ tests passing
