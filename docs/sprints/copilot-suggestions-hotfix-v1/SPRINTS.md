# SPRINTS.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Created**: 2026-01-06
> **Type**: Hotfix

---

## Sprint Overview

| Attribute | Value |
|-----------|-------|
| Duration | ~1 hour |
| Complexity | Low |
| Risk | Low |
| Files Changed | 3 |

---

## Story Breakdown

### Story 1: Type System Update
**Estimate**: 10 min

| Task | File | Description |
|------|------|-------------|
| 1.1 | console-factory.types.ts | Add import for SuggestedAction |
| 1.2 | console-factory.types.ts | Add suggestions field to CopilotActionResult |

**Acceptance**: TypeScript compiles

---

### Story 2: BedrockCopilot UI
**Estimate**: 25 min

| Task | File | Description |
|------|------|-------------|
| 2.1 | BedrockCopilot.tsx | Add import for SuggestedAction |
| 2.2 | BedrockCopilot.tsx | Add suggestions to CopilotMessage interface |
| 2.3 | BedrockCopilot.tsx | Add suggestions to ActionResult interface |
| 2.4 | BedrockCopilot.tsx | Capture suggestions in handleSubmit |
| 2.5 | BedrockCopilot.tsx | Render suggestion buttons after message |

**Acceptance**: Buttons render (with hardcoded test data)

---

### Story 3: Handler Updates
**Estimate**: 20 min

| Task | File | Description |
|------|------|-------------|
| 3.1 | PromptCopilotActions.ts | Update make-compelling API success path |
| 3.2 | PromptCopilotActions.ts | Update make-compelling fallback paths (x2) |
| 3.3 | PromptCopilotActions.ts | Update suggest-targeting API success path |
| 3.4 | PromptCopilotActions.ts | Update suggest-targeting fallback paths (x2) |

**Acceptance**: `/make-compelling` and `/suggest-targeting` return suggestions

---

### Story 4: Manual Testing
**Estimate**: 10 min

| Test | Expected |
|------|----------|
| Type `/make-compelling` | 3 buttons appear |
| Click a title button | Input shows `set title to {title}` |
| Press Enter | Title updates |
| Type `/suggest-targeting` | Apply button appears |
| Click Apply | Input shows `set stages to ...` |

**Acceptance**: All manual tests pass

---

## Execution Order

```
1. Story 1 (types) - Foundation
   ↓
2. Story 2 (UI) - Can test with mock data
   ↓
3. Story 3 (handlers) - Wire real data
   ↓
4. Story 4 (testing) - Verify end-to-end
```

---

## Rollback Plan

If issues arise:
1. Revert changes to all 3 files
2. Suggestions field is additive (backward compatible)
3. Existing functionality unaffected

---

## Definition of Done

- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] `/make-compelling` shows clickable suggestions
- [ ] `/suggest-targeting` shows clickable suggestion
- [ ] Clicking populates input correctly
- [ ] Enter executes command
- [ ] DEVLOG updated
