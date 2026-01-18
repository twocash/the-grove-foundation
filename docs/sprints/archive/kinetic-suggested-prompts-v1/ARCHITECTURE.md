# Kinetic Suggested Prompts v1 — Architecture

**Sprint:** kinetic-suggested-prompts-v1  
**Date:** January 4, 2026  
**Architecture Pattern:** Integration (wiring existing systems)

---

## Executive Summary

This sprint wires the **existing** 4D Context Fields infrastructure to inline navigation prompts. No new scoring algorithms, no new prompt schemas—just integration.

**What EXISTS (use it):**
- `ContextState` with stage/entropy/lens/moments
- `selectPrompts()` with hard filters + soft scoring  
- 70 prompts in library with full targeting metadata
- `NavigationBlock` component for rendering forks
- `JourneyFork` type for navigation objects

**What we CREATE:**
- `useContextState()` — aggregates EngagementContext → ContextState
- `useNavigationPrompts()` — calls selectPrompts() + converts to forks
- `promptToFork()` — adapter function
- ResponseBlock integration

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        EXISTING (Sprint 3)                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐ │
│  │ EngagementMachine│    │ PromptLibrary   │    │ NavigationBlock│ │
│  │ (XState)        │    │ (70 prompts)    │    │ (renders forks)│ │
│  │                 │    │                 │    │                │ │
│  │ • lens          │    │ • base.prompts  │    │ • fork buttons │ │
│  │ • entropy       │    │ • dr-chiang     │    │ • onClick      │ │
│  │ • streamHistory │    │ • wayne-turner  │    │ • styling      │ │
│  │ • sproutCaptures│    │                 │    │                │ │
│  └────────┬────────┘    └────────┬────────┘    └────────────────┘ │
│           │                      │                       ▲        │
├───────────┼──────────────────────┼───────────────────────┼────────┤
│           │          NEW (Sprint 4)                      │        │
├───────────┼──────────────────────┼───────────────────────┼────────┤
│           │                      │                       │        │
│           ▼                      ▼                       │        │
│  ┌─────────────────┐    ┌─────────────────┐             │        │
│  │ useContextState │    │ selectPrompts   │             │        │
│  │ (NEW hook)      │    │ (EXISTING)      │             │        │
│  │                 │    │                 │             │        │
│  │ Aggregates:     │    │ Filters + Ranks │             │        │
│  │ • stage         │───▶│ PromptObjects   │             │        │
│  │ • entropy       │    │                 │             │        │
│  │ • activeLensId  │    └────────┬────────┘             │        │
│  │ • activeMoments │             │                      │        │
│  └─────────────────┘             │                      │        │
│                                  ▼                      │        │
│                         ┌─────────────────┐             │        │
│                         │ promptsToForks  │             │        │
│                         │ (NEW adapter)   │             │        │
│                         │                 │             │        │
│                         │ PromptObject    │             │        │
│                         │ → JourneyFork   │             │        │
│                         └────────┬────────┘             │        │
│                                  │                      │        │
│                                  ▼                      │        │
│                         ┌─────────────────┐             │        │
│                         │useNavigationPro │─────────────┘        │
│                         │(NEW hook)       │                      │
│                         │                 │                      │
│                         │ Returns forks   │                      │
│                         │ for rendering   │                      │
│                         └─────────────────┘                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Contracts

### 1. useContextState (NEW)

**Location:** `src/core/context-fields/useContextState.ts`

**Input:** EngagementContext (from XState machine)

**Output:** ContextState (4D aggregation)

```typescript
interface ContextState {
  stage: 'genesis' | 'exploration' | 'synthesis' | 'advocacy';
  entropy: number;           // 0.0-1.0
  activeLensId: string | null;
  activeMoments: string[];   // ['high_entropy', 'first_visit', etc.]
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}
```

**Derivation Logic:**
- `stage` = computed from interactionCount (0=genesis, 1-4=exploration, 5+=synthesis, sprouts=advocacy)
- `entropy` = direct from engagement machine
- `activeLensId` = direct from engagement machine  
- `activeMoments` = evaluated from context (entropy>0.7 = high_entropy, etc.)
- `interactionCount` = streamHistory.filter(query).length
- `topicsExplored` = topicExplorations.map(t => t.topicId)

### 2. promptsToForks (NEW)

**Location:** `src/core/context-fields/adapters.ts`

**Input:** PromptObject[]

**Output:** JourneyFork[]

**Fork Type Inference:**

| Condition | Fork Type |
|-----------|-----------|
| `entropyWindow.min > 0.6` | `challenge` |
| `variant === 'urgent'` | `challenge` |
| `topicAffinities.length > 0` | `pivot` |
| `tags.includes('synthesis')` | `apply` |
| Default | `deep_dive` |

### 3. useNavigationPrompts (NEW)

**Location:** `src/explore/hooks/useNavigationPrompts.ts`

**Input:** Options (maxPrompts, minScore)

**Output:** 
```typescript
{
  forks: JourneyFork[];
  isReady: boolean;
}
```

**Flow:**
1. Call `useContextState()` for 4D context
2. Call `selectPrompts(libraryPrompts, context, options)` 
3. Convert via `promptsToForks()`
4. Return for NavigationBlock

### 4. ResponseBlock Integration

**Location:** `src/components/explore/stream/ResponseBlock.tsx`

**Changes:**
- Import `useNavigationPrompts`
- Call hook when not streaming
- Merge with parsed navigation (prefer parsed if present)
- Pass to existing NavigationBlock
- Handle click → emit event + auto-submit

---

## File Mapping

| New File | Purpose | Depends On |
|----------|---------|------------|
| `useContextState.ts` | 4D aggregation | EngagementMachine |
| `adapters.ts` | Type conversion | PromptObject, JourneyFork |
| `useNavigationPrompts.ts` | Selection hook | useContextState, selectPrompts |

| Modified File | Changes |
|---------------|---------|
| `ResponseBlock.tsx` | Wire NavigationBlock to hook |
| `useEventBridge.ts` | Add forkSelected emit |
| `features.ts` | Add feature flags |

| Deprecated File | Action |
|-----------------|--------|
| `usePromptSuggestions.ts` | @deprecated annotation |
| `scorePrompt.ts` | @deprecated annotation |

---

## DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Prompts in JSON files. Scoring weights configurable. |
| **Capability Agnosticism** | No LLM calls. Works with any model. |
| **Provenance as Infrastructure** | FORK_SELECTED event tracks all clicks. |
| **Organic Scalability** | Add prompts to JSON. Add fork types to union. |

---

## Testing Strategy

### Unit Tests

```typescript
// useContextState
it('returns genesis stage when no interactions');
it('returns exploration stage with 1-4 interactions');
it('evaluates high_entropy moment when entropy > 0.7');

// adapters
it('infers deep_dive for default prompts');
it('infers pivot for topic-connected prompts');
it('infers challenge for high-entropy prompts');

// useNavigationPrompts
it('returns 3 forks by default');
it('respects maxPrompts option');
it('memoizes correctly');
```

### Integration Tests

```typescript
it('ResponseBlock renders NavigationBlock after response');
it('clicking fork emits FORK_SELECTED event');
it('clicking fork calls onPromptSubmit');
```

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| ContextState computed wrong | High | Medium | Unit test each derivation |
| Fork type inference wrong | Low | Low | Default to deep_dive |
| Performance regression | Medium | Low | Memoize hook |
| Feature flag not working | Medium | Low | Test both states |

---

*Architecture aligned with existing 4D Context Fields infrastructure.*
