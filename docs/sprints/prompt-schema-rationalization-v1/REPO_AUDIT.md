# Repository Audit: prompt-schema-rationalization-v1

**Sprint:** prompt-schema-rationalization-v1  
**Date:** 2026-01-03  
**Auditor:** Claude (Foundation Loop)

---

## Executive Summary

This sprint rationalizes the Prompt schema to eliminate redundancy between `meta` and `payload` fields, extends sequence support for cross-sequence analytics, documents wizard unification patterns, and adds Copilot actions to satisfy Bedrock Contract Article III.

---

## Files to Modify

### Core Schema

| File | Changes | Risk |
|------|---------|------|
| `src/core/schema/prompt.ts` | Remove redundant fields, add wizardConfig, add sequence stats | Medium |
| `src/core/schema/grove-object.ts` | Verify GroveObjectMeta covers all display needs | Low |

### Console Components

| File | Changes | Risk |
|------|---------|------|
| `src/bedrock/consoles/PromptWorkshop/index.ts` | No changes needed | None |
| `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx` | Read from meta instead of payload for display fields | Low |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Update field paths, add wizardConfig tab | Medium |
| `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts` | Update metric queries, add sequence filter | Low |
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | Update createDefaultPrompt | Low |

### New Files

| File | Purpose |
|------|---------|
| `src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts` | Copilot action handlers (Bedrock mandate) |
| `src/core/schema/wizard-integration.md` | Documentation for future wizard unification |
| `scripts/migrate-prompts-v2.ts` | Data migration script |

### Data Files

| File | Changes | Risk |
|------|---------|------|
| `scripts/seed-prompts.ts` | Update to new schema structure | Low |
| Supabase `public.prompts` | Schema unchanged (payload is JSONB) | None |

---

## Current Schema Analysis

### Redundant Fields (payload duplicates meta)

```typescript
// Current PromptPayload has these redundant fields:
label: string;           // Duplicates meta.title
description?: string;    // Duplicates meta.description
icon?: string;           // Duplicates meta.icon
tags: string[];          // Duplicates meta.tags
```

### Fields That Should Stay in Payload

```typescript
// These are prompt-specific, not display metadata:
executionPrompt: string;
systemContext?: string;
variant?: 'default' | 'glow' | 'subtle' | 'urgent';
topicAffinities: TopicAffinity[];
lensAffinities: LensAffinity[];
targeting: PromptTargeting;
baseWeight?: number;
sequences?: PromptSequence[];
stats: PromptStats;
source: 'library' | 'generated' | 'user';
generatedFrom?: PromptGenerationContext;
cooldownMs?: number;
maxShows?: number;
```

---

## Dependency Analysis

### Imports of PromptPayload

```
src/bedrock/consoles/PromptWorkshop/PromptCard.tsx
src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
src/bedrock/consoles/PromptWorkshop/usePromptData.ts
src/bedrock/consoles/PromptWorkshop/index.ts
src/explore/utils/scorePrompt.ts
src/explore/hooks/usePromptSuggestions.ts
```

### Imports of Prompt Type

```
src/core/schema/prompt.ts (defines it)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data migration fails | Low | High | Test on local data first, backup Supabase |
| Breaking existing prompts | Medium | Medium | Migration script handles both formats |
| Copilot actions incomplete | Low | Medium | Follow LensCopilotActions pattern exactly |
| Wizard documentation unclear | Low | Low | Include concrete examples |

---

## Test Coverage

### Existing Tests

```
tests/unit/prompt.test.ts - Does this exist? Need to verify
tests/e2e/prompt-workshop.spec.ts - Does this exist? Need to verify
```

### Tests Needed

| Test | Type | Purpose |
|------|------|---------|
| Schema validation | Unit | Verify new schema shape |
| Migration script | Unit | Verify old→new conversion |
| PromptCard rendering | Unit | Verify reads from meta |
| Copilot actions | Unit | Verify patch generation |

---

## Build Verification Commands

```bash
# Type check
npm run typecheck

# Unit tests
npm test

# E2E tests
npx playwright test

# Dev server
npm run dev
```

---

## Files Examined

- [x] `src/core/schema/prompt.ts`
- [x] `src/core/schema/grove-object.ts`
- [x] `src/bedrock/consoles/PromptWorkshop/*`
- [x] `src/bedrock/consoles/LensWorkshop/*` (reference)
- [x] `src/bedrock/patterns/console-factory.tsx`
- [x] `scripts/seed-prompts.ts`
- [x] `PROJECT_PATTERNS.md`
- [x] `docs/contracts/BEDROCK-SPRINT-CONTRACT.md`
