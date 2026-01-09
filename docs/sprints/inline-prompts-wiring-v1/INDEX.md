# Sprint: inline-prompts-wiring-v1

**Status:** ✅ COMPLETE  
**Tier:** Bugfix  
**Branch:** bedrock  
**Domain Contract:** Bedrock Sprint Contract (light compliance - bugfix tier)

---

## Summary

Fixed destructuring bug preventing inline navigation prompts from loading, plus UX fix to show forks only on most recent response.

**Root Cause:** `useNavigationPrompts` destructured `{ data }` from `useGroveData` which returns `{ objects }`.

---

## Artifacts

| Artifact | Purpose |
|----------|---------|
| `INDEX.md` | This file - sprint overview |
| `SPEC.md` | Technical specification |
| `REPO_AUDIT.md` | Data flow analysis and diagnostics |
| `DEVLOG.md` | Session-by-session development log |
| `EXECUTION_PROMPT.md` | Original execution prompt |
| `VERIFICATION_PROMPT.md` | Post-fix verification checklist |

---

## Fixes Applied

### 1. Destructuring Bug (3 files)

```diff
- const { data: allPrompts, loading } = useGroveData<PromptPayload>('prompt');
+ const { objects: allPrompts, loading } = useGroveData<PromptPayload>('prompt');
```

Files:
- `src/explore/hooks/useNavigationPrompts.ts:108`
- `src/explore/hooks/usePromptSuggestions.ts:56`
- `src/explore/hooks/useSequence.ts:67`

### 2. Fork Duplication UX Fix (2 files)

Added `isLast` prop to `ResponseObject` - forks only render on most recent response.

Files:
- `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx`
- `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

---

## Key Learning: Genesis-Welcome Mechanism

The declarative mechanism for genesis prompts:

```
Supabase prompts table
├── payload.genesisOrder: 1, 2, 3...  ← Explicit sequence
├── tags: ['genesis-welcome']          ← Filter criterion
└── source: 'user'                     ← Distinguishes from legacy
```

**No code changes needed to modify genesis prompts** - edit Supabase fields directly. This is DEX compliance.

---

## Verification

```bash
npm run dev
# Navigate to /bedrock/experiences
# 1. Send message → fork appears
# 2. Send another → only ONE fork (on newest response)
```

---

## Commit Message

```
fix(prompts): destructure objects from useGroveData, show forks only on last response

- Fix destructuring in useNavigationPrompts, usePromptSuggestions, useSequence
- Add isLast prop to ResponseObject to prevent fork duplication
- Sprint: inline-prompts-wiring-v1
```
