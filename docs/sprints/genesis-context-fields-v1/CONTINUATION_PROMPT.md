# Continuation Prompt: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Last Updated:** January 2, 2026  
**Purpose:** Session handoff for fresh Claude context

---

## 🎯 Quick Context

You're picking up the **Context Fields** sprint for Grove. This replaces the Journey-based prompt system with 4-dimensional targeting (Stage, Entropy, Lens, Moment).

## 📍 Project Location

```
C:\github\the-grove-foundation
```

## 📂 Sprint Artifacts

**Read these in order:**

1. `docs/sprints/genesis-context-fields-v1/DEVLOG.md` — What's been done
2. `docs/sprints/genesis-context-fields-v1/EXECUTION_PROMPT.md` — How to execute
3. `docs/sprints/genesis-context-fields-v1/ARCHITECTURE.md` — System design
4. `docs/sprints/genesis-context-fields-v1/DECISIONS.md` — Key decisions

## 📊 Current Status

*Update this section each session*

| Epic | Status | Notes |
|------|--------|-------|
| 1. Core Types & Scoring | ⬜ | |
| 2. Data Layer | ⬜ | |
| 3. State Integration | ⬜ | |
| 4. Hook Rewrite | ⬜ | |
| 5. Generator | ⬜ | |
| 6. Deprecation | ⬜ | |
| 7. E2E & Polish | ⬜ | |

**Last Completed:** Sprint planning (all artifacts)  
**Currently Working On:** Ready for Epic 1

## 🔑 Key Files

**New (to create/modify):**
```
src/core/context-fields/
├── types.ts          # PromptObject, ContextTargeting, etc.
├── scoring.ts        # calculateRelevance(), applyHardFilters()
├── collection.ts     # PromptCollection
├── generator.ts      # Rule-based generation
├── telemetry.ts      # Session telemetry
└── index.ts          # Barrel

hooks/
├── useContextState.ts       # Aggregates 4D context
├── useSuggestedPrompts.ts   # REWRITE
└── usePromptCollection.ts   # Prompt access
```

**Existing (reference):**
```
src/core/engagement/context.tsx    # Add computedEntropy
src/core/schema/engagement.ts      # Add fields
src/core/engine/entropyCalculator.ts  # Existing, use it
hooks/useEngagementBus.ts          # Consumes engagement state
```

## ✅ Success Criteria

- [ ] Prompts surface based on 4D context
- [ ] Dr. Chiang lens delivers custom prompts
- [ ] High entropy triggers stabilization
- [ ] All tests pass
- [ ] Build succeeds

## 🚫 Forbidden Actions

- No new React contexts
- No imperative `if (type === 'foo')` patterns
- No Bedrock modifications
- No imports from deprecated `stage-prompts.ts`

## 🧭 Next Actions

1. Check DEVLOG.md for current status
2. Resume from last incomplete epic
3. Follow EXECUTION_PROMPT.md for implementation details
4. Run build gate after each epic
5. Update DEVLOG.md before ending session

## 🧪 Build Gates

```bash
# After each epic
npm test && npm run build

# Final verification
npm test && npx playwright test && npm run build
```

## 📝 Session Handoff Checklist

Before ending your session:

- [ ] Update DEVLOG.md with completed tasks
- [ ] Update this file's "Current Status" section
- [ ] Note any blockers or issues
- [ ] Commit work with proper message format
- [ ] Run build gate for current epic

---

*This document is for AI-to-AI handoff. Keep it current.*
