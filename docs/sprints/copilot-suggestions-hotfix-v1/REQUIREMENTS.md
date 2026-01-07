# REQUIREMENTS.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Created**: 2026-01-06
> **Type**: Hotfix
> **Parent Sprint**: prompt-wiring-v1

---

## Problem Statement

The `prompt-wiring-v1` sprint SPEC defined clickable suggestions for `/make-compelling` and `/suggest-targeting` actions, but the implementation only returns text messages with "Copy the full title..." instructions. Users must manually copy/paste instead of clicking to apply.

**Spec said:**
```typescript
return {
  message: `Here are 3 title variants...`,
  suggestions: variants.map(v => ({
    label: v.title,
    template: `set title to ${v.title}`,
  })),
};
```

**Implementation returned:**
```typescript
return {
  message: `...Copy the full title, e.g.:\nset title to ${title}`,
  // NO suggestions array
};
```

---

## User Stories

### US-1: Clickable Title Suggestions
**As a** prompt curator  
**I want** to click on title suggestions from `/make-compelling`  
**So that** I can apply them without copy-pasting

**Acceptance Criteria:**
- `/make-compelling` returns 3 clickable buttons
- Clicking a button populates the Copilot input with `set title to {title}`
- User can then press Enter to apply

### US-2: Clickable Targeting Suggestions
**As a** prompt curator  
**I want** to click "Apply" on targeting suggestions  
**So that** stages are applied with one action

**Acceptance Criteria:**
- `/suggest-targeting` returns clickable "Apply suggested stages" button
- Clicking populates input with appropriate command
- User confirms and applies

---

## Scope

### In Scope
- Add `suggestions` field to action result types
- Render suggestions as clickable buttons in BedrockCopilot
- Update `/make-compelling` handler to return suggestions
- Update `/suggest-targeting` handler to return suggestions

### Out of Scope
- New Copilot features
- UI redesign
- Additional actions
- Backend API changes

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Clickable suggestions appear | 100% |
| Click populates input correctly | 100% |
| No TypeScript errors | 0 |
| No visual regressions | 0 |

---

## Dependencies

- `@core/copilot/schema.ts` - SuggestedAction type exists ✅
- `TitleTransforms.ts` - generateVariants() exists ✅
- `TargetingInference.ts` - inferTargetingFromSalience() exists ✅
