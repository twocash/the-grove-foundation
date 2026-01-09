# Sprint: inline-prompts-wiring-v1

## Classification
**Tier:** Bugfix (< 1 hour)
**Branch:** bedrock
**Domain Contract:** None (wiring fix, no new architecture)

## Problem Statement

Inline suggested prompts are not appearing after LLM responses in the explore route. The infrastructure exists but the wiring is broken somewhere in the pipeline.

### Current State
- Supabase `prompts` table contains hundreds of prompts with 4D targeting facets
- `useNavigationPrompts` hook exists and calls `useGroveData`
- `ResponseObject.tsx` calls `useSafeNavigationPrompts()` 
- Feature flag `inline-navigation-prompts` is enabled by default
- **Result:** No prompts appear after responses

### Evidence from Console
```
[Moments] Evaluating for surface: inline context: {exchangeCount: 1, stage: 'ORIENTED', ...}
[Moments] Eligible moments: []
```
Note: This is useMoments (overlay system), NOT useNavigationPrompts. The navigation prompts hook may not be logging at all.

## Root Cause Hypothesis

The pipeline from Supabase → scoring → rendering has a break. Possible causes:
1. `useGroveData` returns empty array (Supabase connection issue)
2. Format mismatch: GroveObject<PromptPayload> vs flat PromptObject
3. `applyHardFilters` filters ALL prompts (stage targeting mismatch)
4. `promptsToForks` conversion fails silently
5. `isReady` stays false, preventing fork rendering

## Architecture Flow

```
Supabase prompts table
        ↓
useGroveData<PromptPayload>('prompt')  ← Returns GroveObject<PromptPayload>[]
        ↓
grovePromptToPromptObject()            ← Converts to flat PromptObject[]
        ↓
selectPromptsWithScoring(pool, context) ← 4D scoring with hard/soft filters
        ↓
promptsToForks(scoredPrompts)          ← Converts to JourneyFork[]
        ↓
ResponseObject renders NavigationObject
```

## Success Criteria

1. Console shows: `[NavigationPrompts] Pool: N prompts from Supabase`
2. Console shows: `[NavigationPrompts] Context: {stage: 'exploration', ...}`
3. Console shows: `[NavigationPrompts] Scored: N prompts, top score: X`
4. After LLM response completes, 1-3 suggested prompts appear below it
5. Clicking a prompt sends its `executionPrompt` to the LLM

## Scope

### In Scope
- Add diagnostic logging to trace the pipeline
- Fix any identified wiring issues
- Verify prompts render after response

### Out of Scope
- Welcome screen genesis prompts (separate system, already working)
- New scoring algorithms
- New UI components
- Moments/overlay system

## Test Plan

1. Load `/explore` route
2. Send a message to trigger LLM response
3. Verify console logs show prompt flow
4. Verify prompts appear after response
5. Click prompt, verify execution

## Files to Modify

| File | Change |
|------|--------|
| `src/explore/hooks/useNavigationPrompts.ts` | Add diagnostic logging |
| (TBD based on diagnosis) | Fix identified issues |
