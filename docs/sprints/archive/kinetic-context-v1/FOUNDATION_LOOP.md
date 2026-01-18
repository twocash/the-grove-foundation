# FOUNDATION_LOOP.md — kinetic-context-v1

## Sprint Summary

**Goal:** Migrate Terminal's context personalization patterns to Kinetic Stream, enabling header pills for lens/journey selection and personalized welcome experiences.

**Pattern:** Header pills → Overlay pickers → Context updates → Personalized content

## Artifact Status

| Artifact | Status | Notes |
|----------|--------|-------|
| REPO_AUDIT.md | ✅ Complete | Terminal patterns mapped |
| SPEC.md | ✅ Complete | Component APIs defined |
| ARCH_DECISIONS.md | ✅ Complete | 7 ADRs + DEX compliance |
| MIGRATION_MAP.md | ✅ Complete | Full code snippets |
| TEST_STRATEGY.md | ✅ Complete | Unit, component, integration |
| SPRINTS.md | ✅ Complete | 4 epics, 12 stories, ~4 hours |
| EXECUTION_PROMPT.md | ✅ Complete | Self-contained for Claude Code |
| FOUNDATION_LOOP.md | ✅ Complete | This file |

## Files Summary

**Create (2):**
- `src/surface/components/KineticStream/KineticHeader.tsx`
- `src/surface/components/KineticStream/KineticWelcome.tsx`

**Modify (2):**
- `src/surface/components/KineticStream/ExploreShell.tsx`
- `src/surface/components/KineticStream/index.ts`

## Execution

```bash
# From project root
cat docs/sprints/kinetic-context-v1/EXECUTION_PROMPT.md | claude
```

## Post-Execution

```bash
# Verify
npx tsc --noEmit
npm run build
npm run dev

# Test manually
# 1. Click lens pill → picker opens
# 2. Select lens → header and welcome update
# 3. Click prompt → query submits

# Commit
git add .
git commit -m "feat(kinetic): add header context and personalized welcome - sprint kinetic-context-v1"
```

## Dependencies

Imports from existing codebase:
- `@core/engagement` (useLensState, useJourneyState)
- `hooks/useSuggestedPrompts`
- `data/quantum-content`
- `data/default-personas`
- `data/narratives-schema`
- `components/Terminal/LensPicker` (reuse)

## Estimated Duration

**Total: ~4 hours**

## Sprint Sequence

| Order | Sprint | Duration | Description |
|-------|--------|----------|-------------|
| 1 | journey-offer-v1 | 2 hours | Inline journey recommendations |
| 2 | kinetic-context-v1 | 4 hours | Header pills + welcome |

## What This Enables

After these sprints, Kinetic Stream will have:

1. **Inline Context Suggestions**
   - Lens offers (done in lens-offer-v1)
   - Journey offers (journey-offer-v1)

2. **Header-Level Context**
   - Lens pill with picker
   - Journey pill with picker
   - Stage progression indicator

3. **Personalized Welcome**
   - Lens-specific heading and thesis
   - Adaptive prompts (stage-aware)
   - Journey-linked prompts

This completes the migration of Terminal's core personalization patterns to the new Kinetic Stream architecture.

---

*Foundation Loop complete. Ready for execution.*
