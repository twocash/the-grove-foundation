# FOUNDATION_LOOP.md — journey-offer-v1

## Sprint Summary

**Goal:** Add inline journey recommendations to Kinetic Stream, symmetric to lens-offer-v1.

**Pattern:** LLM generates `<journey_offer />` tags → Parser extracts → Component renders → Accept triggers journey start

## Artifact Status

| Artifact | Status | Notes |
|----------|--------|-------|
| REPO_AUDIT.md | ✅ Complete | Patterns identified, files mapped |
| SPEC.md | ✅ Complete | Quick reference for types and APIs |
| ARCH_DECISIONS.md | ✅ Complete | 5 ADRs + DEX compliance |
| MIGRATION_MAP.md | ✅ Complete | All code snippets |
| TEST_STRATEGY.md | ✅ Complete | Unit, component, integration, manual |
| SPRINTS.md | ✅ Complete | 5 epics, 10 stories, ~2 hours |
| EXECUTION_PROMPT.md | ✅ Complete | Self-contained for Claude Code |
| FOUNDATION_LOOP.md | ✅ Complete | This file |

## Files Summary

**Create (2):**
- `src/core/transformers/JourneyOfferParser.ts`
- `src/surface/components/KineticStream/Stream/blocks/JourneyOfferObject.tsx`

**Modify (4):**
- `src/core/schema/stream.ts` (add types)
- `src/core/transformers/index.ts` (add export)
- `src/surface/.../Stream/KineticRenderer.tsx` (add case)
- `src/surface/.../ExploreShell.tsx` (add handlers)

## Execution

```bash
# From project root
cat docs/sprints/journey-offer-v1/EXECUTION_PROMPT.md | claude
```

## Post-Execution

```bash
# Verify
npx tsc --noEmit
npm run build
npm run dev

# Test manually
# 1. Inject journey_offer tag in test response
# 2. Verify cyan styling
# 3. Test accept/dismiss

# Commit
git add .
git commit -m "feat(kinetic): add inline journey offers - sprint journey-offer-v1"
```

## Dependencies

- No new npm packages
- Requires existing: framer-motion, @core/schema/stream, @core/journey

## Estimated Duration

**Total: ~2 hours**

## Next Sprint

**kinetic-context-v1** - Header pills + welcome personalization
- KineticHeader with lens/journey selector pills
- KineticWelcome with personalized content
- Picker overlay system
- Stage-aware suggested prompts

---

*Foundation Loop complete. Ready for execution.*
