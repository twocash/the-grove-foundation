# Sprint: prompt-library-readonly-v1

## Status: Ready for Execution

## Architectural Decision

**Runtime merge, not data copy.** Library prompts merged at display time, not stored in data layer.

## Epics

### Epic 0: Merge Library Prompts at Display Time (PREREQUISITE)
- [ ] Story 0.1: Export promptToGroveObject from defaults.ts
- [ ] Story 0.2: Update usePromptData to merge library prompts  
- [ ] Story 0.3: Add data-source attribute to PromptCard

### Epic 1: Read-Only Mode for Library Prompts
- [ ] Story 1.1: Add isReadOnly logic to PromptEditor
- [ ] Story 1.2: Add read-only visual indicator (blue banner)
- [ ] Story 1.3: Conditional footer buttons

### Epic 2: Duplicate Creates User Prompt  
- [ ] Story 2.1: Update duplicate() to set source: 'user'
- [ ] Story 2.2: Update PromptProvenance type (if needed)

### Epic 3: Testing
- [ ] Story 3.1: Unit tests for read-only mode

## Build Gates

After each epic:
```bash
npm run build
npm test
```

After Epic 0:
```bash
npm run dev
# Verify: library prompts visible in /bedrock/prompts
```

## Files Modified

| File | Epic | Change |
|------|------|--------|
| `src/core/data/defaults.ts` | 0 | Export promptToGroveObject and LegacyPrompt |
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | 0, 2 | Merge library prompts; fix duplicate() |
| `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx` | 0 | Add data-source attribute |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | 1 | Read-only mode, banner, conditional footer |
| `src/core/context-fields/types.ts` | 2 | Add duplicatedFrom to PromptProvenance |
| `tests/unit/PromptEditor.test.tsx` | 3 | Unit tests |

## Strangler Fig Verification

After ALL epics, verify legacy unchanged:
```bash
npm run dev
# 1. Terminal kinetic highlights still work
# 2. Navigation forks still work
# 3. No changes to src/explore/hooks/usePromptForHighlight.ts
```

## Execution

```bash
cd C:\GitHub\the-grove-foundation
claude "Read docs/sprints/prompt-library-readonly-v1/EXECUTION_PROMPT.md and execute the sprint"
```
