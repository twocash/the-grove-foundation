# Pull Request: Chat-Native Sprout Research System v1.0

**Sprint:** `sprout-research-v1`
**Branch:** `feature/sprout-research-v1` → `bedrock`
**Merge Strategy:** Squash (32 commits → 1)
**Date:** January 11, 2026

---

## Objective

Transform the Explore interface into a **chat-native research platform** where users can:
1. Type `sprout: <topic>` to initiate structured research
2. Review AI-generated research branches via Garden Inspector dialog
3. Track research lifecycle from pending → active → completed

This sprint implements the **Prompt Architect** pattern—intercepting natural language commands and transforming them into structured research manifests with full provenance tracking.

---

## Phase Completion Summary

| Phase | Status | Description |
|-------|--------|-------------|
| **0** | ✅ Complete | Route verification, pattern audit, checkpoint tag |
| **1** | ✅ Complete | PromptArchitectConfig schema, inference rules, quality gates |
| **2** | ✅ Complete | ResearchSprout object model, Supabase migrations, context provider |
| **3** | ✅ Complete | Prompt Architect pipeline, command parser, ExploreShell integration |
| **4** | ✅ Complete | Garden Inspector panel, status grouping, toast notifications |
| **5** | ✅ Complete | Research Agent lifecycle (queue → execute → results → spawn) |
| **6** | ✅ Complete | Isolation audit, legacy deprecation flags, frozen zone verification |

---

## Files Summary

| Metric | Count |
|--------|-------|
| **Files Added** | 52 |
| **Files Modified** | 18 |
| **Total Files Changed** | 70 |
| **Lines Added** | 14,690 |
| **Lines Removed** | 103 |

### Key New Files

**Core Schema (`src/core/schema/`)**
- `prompt-architect-config.ts` - PromptArchitectConfig interface
- `research-sprout-registry.ts` - ResearchSprout types with provenance

**Explore Services (`src/explore/services/`)**
- `sprout-command-parser.ts` - Command detection and parsing
- `prompt-architect-agent.ts` - AI-powered branch generation
- `prompt-architect-pipeline.ts` - Orchestration pipeline
- `research-queue-consumer.ts` - Pull-based execution queue
- `research-agent.ts` - Branch execution with progress
- `research-results-processor.ts` - Synthesis generation
- `research-child-spawner.ts` - Child manifest spawning
- `research-integration-test.ts` - Full lifecycle test

**Explore Context (`src/explore/context/`)**
- `ResearchSproutContext.tsx` - React state management
- `research-sprout-storage.ts` - IndexedDB persistence

**Explore Hooks (`src/explore/hooks/`)**
- `useResearchSprout.ts` - Primary research hook
- `useResearchQueueConsumer.ts` - Queue binding
- `useResearchAgent.ts` - Agent execution binding

**UI Components**
- `src/explore/GardenInspector.tsx` - Confirmation dialog (MVP: title + prompt)

**Database Migrations**
- `supabase/migrations/010_research_sprouts.sql` - UP migration
- `supabase/migrations/010_research_sprouts_down.sql` - DOWN migration

**Documentation**
- `docs/sprints/sprout-research-v1/INDEX.md` - Sprint index
- `docs/sprints/sprout-research-v1/ISOLATION_AUDIT.md` - Strangler fig compliance
- `docs/sprints/sprout-research-v1/CONTINUATION_PROMPT.md` - Session handoff

---

## Feature Flags Required

All new functionality is gated behind feature flags. **Default: disabled (false)**.

| Flag ID | Purpose |
|---------|---------|
| `sprout-research` | Enable `sprout:` command interception in Explore |
| `garden-inspector` | Enable Garden Inspector confirmation dialog |
| `research-agent-auto-execute` | Auto-execute research on sprout creation |
| `legacy-sprout-disabled` | Mark legacy `/sprout` Terminal command deprecated |

**To activate:** Set flags to `true` in Foundation → Reality Tuner or update `narratives-schema.ts`.

---

## Testing Instructions

### Prerequisites
```bash
npm run build   # Verify baseline compiles
npm run dev     # Start dev server on port 3000
```

### Manual Testing (Flag-Enabled)

1. **Enable flags** (temporarily hardcode or via Foundation):
   ```typescript
   // src/surface/components/KineticStream/ExploreShell.tsx
   const isSproutResearchEnabled = true;  // temporarily
   const isGardenInspectorEnabled = true; // temporarily
   ```

2. **Navigate to** `http://localhost:3000/explore`

3. **Type** `sprout: What is the ratchet effect?`

4. **Expected behavior:**
   - Garden Inspector dialog opens
   - Title field shows "What is the ratchet effect?"
   - Instructions field shows AI-suggested research prompt
   - Create button creates sprout in IndexedDB
   - Toast notification confirms creation

### Integration Test (Browser Console)

```javascript
import('/src/explore/services/research-integration-test.ts')
  .then(m => m.runFromConsole())
```

Verifies 5-step lifecycle:
1. Create sprout with branches
2. Queue consumer claims pending
3. Research agent executes
4. Results processor synthesizes
5. Final state: completed with evidence

### Isolation Verification

```bash
# Verify no Terminal imports in explore
grep -r "from.*Terminal/" src/explore/
# Expected: No matches

# Verify frozen zones untouched
git diff bedrock -- components/Terminal/
git diff bedrock -- src/foundation/
# Expected: No changes
```

---

## Screenshots

Visual verification evidence in `docs/sprints/sprout-research-v1/screenshots/`:

| File | Description |
|------|-------------|
| `phase6-review.html` | Browser-viewable gallery of all evidence |
| `5g-mvp-confirmation-dialog-flow.gif` | MVP dialog flow (title + prompt) |
| `6-isolation-verification-sprout-intercept.gif` | Sprout interception working |
| `4g-garden-inspector-flow.gif` | Original Garden Inspector flow |

---

## Merge Commands

```bash
# Squash merge (recommended for cleaner history)
git checkout bedrock
git merge --squash feature/sprout-research-v1
git commit -m "feat(sprout-research): Chat-Native Sprout Research System v1.0

Implements chat-native research platform for Explore interface:
- sprout: command interception with Prompt Architect pipeline
- Garden Inspector confirmation dialog (MVP: title + prompt)
- ResearchSprout lifecycle: pending → active → completed
- Full IndexedDB persistence with provenance tracking
- Supabase migrations for future server-side storage
- Strangler fig compliant: zero changes to frozen zones

Feature flags (all default false):
- sprout-research: Enable command interception
- garden-inspector: Enable confirmation dialog
- research-agent-auto-execute: Auto-execute on creation
- legacy-sprout-disabled: Deprecate legacy command

70 files changed, 14690 insertions(+), 103 deletions(-)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Update recovery baseline
git tag -f checkpoint-pre-sprout-research-20260110 bedrock~1
```

---

## Post-Merge Checklist

- [ ] Verify build succeeds on bedrock
- [ ] Deploy to staging environment
- [ ] Test with flags enabled in staging
- [ ] Update CLAUDE.md if needed
- [ ] Archive sprint branch (optional)

---

## Architectural Notes

### Strangler Fig Pattern

This sprint demonstrates strict strangler fig compliance:
- **New system** built entirely in `src/explore/`
- **Legacy system** in `components/Terminal/` untouched (77 files)
- **Frozen zones** verified via grep and git diff
- **Feature flags** control activation—no code paths change until flags enabled

### DEX Alignment

| Pillar | Implementation |
|--------|----------------|
| Declarative Sovereignty | Schema-first with PromptArchitectConfig |
| Capability Agnosticism | Prompt Architect works with any LLM |
| Provenance | Full ResearchSprout provenance tracking |
| Organic Scalability | IndexedDB → Supabase migration path ready |

---

*Generated: January 11, 2026*
