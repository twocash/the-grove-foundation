# Sprout Research v1 - Continuation Prompt

## Session State

**Last completed:** Phase 5g - Visual verification complete
**Next action:** Phase 6a - Deprecation & Isolation
**Git branch:** `feature/sprout-research-v1`
**Blocking issues:** None

## Phase 5 Summary (Complete)

| Sub-phase | Status | Description |
|-----------|--------|-------------|
| 5a | ✅ Complete | Queue consumer for pending status |
| 5b | ✅ Complete | Research execution logic (simulated) |
| 5c | ✅ Complete | Results population with synthesis |
| 5d | ✅ Complete | Child manifest spawning |
| 5e | ✅ Complete | Research Agent auto-execute flag |
| 5f | ✅ Complete | Integration test (5-step lifecycle) |
| 5g | ✅ Complete | Visual verification: MVP confirmation dialog |

## MVP Simplification (Phase 5g)

GardenInspector confirmation dialog simplified to MVP scope:
- **KEPT:** Title field, Instructions/Prompt field, Create/Cancel buttons
- **COMMENTED OUT:** Research Branches, Strategy, Tags sections
- See `src/explore/GardenInspector.tsx` for TODO markers

## Files Created in Phase 5

| File | Phase | Description |
|------|-------|-------------|
| `src/explore/services/research-queue-consumer.ts` | 5a | Pull-based consumer with polling |
| `src/explore/hooks/useResearchQueueConsumer.ts` | 5a | React hook binding |
| `src/explore/services/research-agent.ts` | 5b | Agent with progress callbacks |
| `src/explore/hooks/useResearchAgent.ts` | 5b | React execution hook |
| `src/explore/services/research-results-processor.ts` | 5c | Synthesis and completion |
| `src/explore/services/research-child-spawner.ts` | 5d | Child sprout spawning |
| `src/explore/services/research-integration-test.ts` | 5f | Full lifecycle test |

## Files Modified in Phase 5

| File | Phase | Description |
|------|-------|-------------|
| `src/explore/context/ResearchSproutContext.tsx` | 5c, 5d | Added updateResults(), addChildSproutId() |
| `src/explore/hooks/index.ts` | 5a, 5b | Export new hooks |
| `data/narratives-schema.ts` | 5e | Added research-agent-auto-execute flag |
| `src/core/schema/research-sprout-registry.ts` | 5e | Updated flag constant docs |

## Integration Test Results (Phase 5f)

The integration test (`research-integration-test.ts`) verifies:

1. **Create Sprout** - Creates sprout with branches from spark
2. **Queue Consumer** - Claims pending sprout, transitions to active
3. **Research Agent** - Executes branches, collects evidence
4. **Results Processor** - Generates synthesis, completes sprout
5. **Final State** - Verifies completed status, evidence, synthesis

Run manually in browser console:
```javascript
import('/src/explore/services/research-integration-test.ts').then(m => m.runFromConsole())
```

## Feature Flags

| Flag ID | Default | Description |
|---------|---------|-------------|
| `sprout-research` | false | Master flag for sprout: command |
| `garden-inspector` | false | Garden Inspector panel |
| `research-agent-auto-execute` | false | Auto-execute on sprout creation |

## Verification Status

- [x] Phase 0: Route verification and pattern audit
- [x] Phase 1: PromptArchitectConfig schema
- [x] Phase 2: ResearchSprout object model and storage
- [x] Phase 3: Prompt Architect Agent pipeline
- [x] Phase 4: Garden Inspector Panel
- [x] Phase 5: Research Agent (5a-5g complete)
- [ ] Phase 6: Deprecation & Isolation

## Screenshots

Visual verification screenshots saved to `docs/sprints/sprout-research-v1/screenshots/`:
- `4g-garden-inspector-flow.gif` - Original Garden Inspector flow
- `5g-mvp-confirmation-dialog-flow.gif` - MVP simplified dialog
- `review.html` - Browser-viewable review page

## To Resume

1. Read `docs/sprints/sprout-research-v1/INDEX.md` for phase checklist
2. Run `npm run build` to verify baseline
3. Continue Phase 6a: Feature flag LEGACY_SPROUT_DISABLED

## Key Context

**Integration Point:**
- File: `src/surface/components/KineticStream/ExploreShell.tsx`
- Function: `handleSubmit()` - runs Prompt Architect pipeline and opens GardenInspector
- Overlay type: `garden-inspector`

**Frozen Zones:**
- `components/Terminal/`: 77 files - DO NOT TOUCH
- `src/foundation/`: 23 files - DO NOT TOUCH

**Phase 6 Preview:**
- 6a: Feature flag: LEGACY_SPROUT_DISABLED
- 6b: Verify sprout-command-parser.ts intercepts 'sprout:' in /explore
- 6c: Verify legacy Terminal command files unreachable from /explore
- 6d: Confirm PlantSelectionTooltip not rendered in /explore
- 6e: Document legacy files as "dead code in Explore context"
- 6f: Update help documentation

## Screenshot Routes

IMPORTANT: Only capture screenshots at these routes:
- `/explore` - Main explore page
- `/bedrock/*` - Bedrock admin routes

NEVER navigate to or capture at:
- `/foundation/*` - Frozen zone
- `/terminal/*` - Frozen zone
