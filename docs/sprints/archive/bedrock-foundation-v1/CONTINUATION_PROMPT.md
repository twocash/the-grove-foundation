# Continuation Prompt: bedrock-foundation-v1

**Sprint:** bedrock-foundation-v1  
**Last Updated:** December 30, 2025  
**Status:** Planning Complete — Ready for Execution

---

## Session Recovery Instructions

Copy this entire prompt into a fresh Claude context to resume work on this sprint.

---

## Context Summary

**What we're building:** Bedrock Sprint 1 — Grove's clean-room administrative interface.

**Key deliverables:**
1. Bedrock Primitives (BedrockLayout, Nav, Inspector, Copilot)
2. Capture Flow (XState machine for Sprout creation in /explore)
3. Collection View Pattern (useCollectionView hook)
4. Knowledge Garden Console (Sprout queue)
5. Lens Workshop Console (reference implementation)

**Branch:** `bedrock`

**Critical constraint:** NO imports from `src/foundation/` (strangler fig pattern)

---

## Artifacts Generated

All artifacts are in `docs/sprints/bedrock-foundation-v1/`:

| Artifact | Status | Purpose |
|----------|--------|---------|
| REPO_AUDIT.md | ✅ Complete | Codebase analysis |
| ARCHITECTURE.md | ✅ Complete | ADR records |
| SPEC.md | ✅ Complete | Full specification |
| SPRINTS.md | ✅ Complete | Epic/story breakdown |
| EXECUTION_PROMPT.md | ✅ Complete | Self-contained handoff |
| CONTINUATION_PROMPT.md | ✅ Complete | This file |
| DEVLOG.md | 🔄 Create during execution | Decision journal |

---

## Current State

**Planning Phase:** Complete  
**Execution Phase:** Not started

### What's Done
- Repository audited
- Architecture decisions documented (7 ADRs)
- DEX compliance verified
- Epics broken into stories with acceptance criteria
- Execution prompt created with code samples

### What's Next
1. Start execution on `bedrock` branch
2. Create `src/bedrock/` directory structure
3. Implement Epic 1: Bedrock Primitives
4. Continue through Epics 2-5
5. Document progress in DEVLOG.md

---

## Key Decisions Made

| Decision | Choice | ADR |
|----------|--------|-----|
| Layout wrapper | BedrockLayout wraps ThreeColumnLayout | ADR-001 |
| State management | XState for capture flow | ADR-002 |
| Collection filtering | useCollectionView hook | ADR-003 |
| Copilot context | BedrockCopilotContext protocol | ADR-004 |
| Sprout types | Declarative manifests | ADR-005 |
| Favorites storage | LocalStorage (API-ready interface) | ADR-006 |
| Routing | Nested under `/bedrock/*` | ADR-007 |

---

## Files to Create (Priority Order)

### Week 1: Primitives
```
src/bedrock/primitives/BedrockLayout.tsx
src/bedrock/primitives/BedrockNav.tsx
src/bedrock/primitives/BedrockInspector.tsx
src/bedrock/primitives/BedrockCopilot.tsx
src/bedrock/components/StatCard.tsx
src/bedrock/components/MetricsRow.tsx
src/bedrock/context/BedrockUIContext.tsx
src/bedrock/BedrockWorkspace.tsx
```

### Week 2: Capture Flow + Collection View
```
src/explore/machines/captureFlow.machine.ts
src/explore/hooks/useCaptureFlow.ts
src/explore/components/RightRail/SproutTypePicker.tsx
src/explore/components/RightRail/ManifestInspector.tsx
src/bedrock/patterns/useCollectionView.ts
src/bedrock/types/sprout.ts
src/bedrock/config/sprout-manifests.ts
```

### Week 3: Knowledge Garden
```
src/bedrock/consoles/KnowledgeGarden/KnowledgeGarden.tsx
src/bedrock/consoles/KnowledgeGarden/SproutQueue.tsx
src/bedrock/consoles/KnowledgeGarden/SproutCard.tsx
src/bedrock/consoles/KnowledgeGarden/SproutInspector.tsx
src/bedrock/consoles/KnowledgeGarden/garden.config.ts
```

### Week 4: Lens Workshop
```
src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx
src/bedrock/consoles/LensWorkshop/LensGrid.tsx
src/bedrock/consoles/LensWorkshop/LensCard.tsx
src/bedrock/consoles/LensWorkshop/LensEditor.tsx
src/bedrock/consoles/LensWorkshop/lens.config.ts
src/bedrock/consoles/LensWorkshop/lens.copilot.ts
src/bedrock/types/lens.ts
```

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Sprout types | document, insight, question, connection |
| Manifest fields | Defined in sprout-manifests.ts |
| Favorites persistence | LocalStorage for Sprint 1 |
| Copilot model indicator | Icon only (local/cloud) |

---

## Contract Compliance Checklist

```markdown
## Bedrock Sprint Contract v1.0

- [x] Constitutional references documented
- [x] DEX compliance matrix complete
- [x] Console implementation checklist ready
- [x] Copilot actions defined
- [x] Object types specified
- [x] Feature parity tracking in place
- [x] No foundation imports planned
```

---

## Quick Commands

```bash
# Switch to branch
git checkout bedrock

# Verify clean state
git status

# Build check
npm run build

# Run tests
npm test
npx playwright test

# Start dev server
npm run dev
```

---

## Reference Documents

Read these before continuing:

| Document | Priority | Location |
|----------|----------|----------|
| EXECUTION_PROMPT.md | **Read First** | Sprint folder |
| BEDROCK_SPRINT_CONTRACT.md | Required | `docs/` |
| PROJECT_PATTERNS.md | Required | Repository root |
| grove-object.ts | Reference | `src/core/schema/` |

---

## Handoff Notes

**For Execution Agent:**

The EXECUTION_PROMPT.md is self-contained. It includes:
- File structure to create
- Code samples for key components
- Verification commands
- Troubleshooting guide

Start by reading EXECUTION_PROMPT.md and then begin with Epic 1.

**For Planning Review:**

All Foundation Loop artifacts are complete. The sprint is ready for execution. Review ARCHITECTURE.md for key decisions and SPRINTS.md for the breakdown.

---

*This continuation prompt enables resumption with full context.*
