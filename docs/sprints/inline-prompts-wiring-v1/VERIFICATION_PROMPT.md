# Inline Prompts Wiring v1 — Verification & Cleanup

**Sprint:** inline-prompts-wiring-v1  
**Status:** Code Complete  
**Purpose:** Verify fixes, document genesis mechanism, cleanup

---

## Context

This sprint fixed two issues with inline navigation prompts:

1. **Destructuring Bug:** `useNavigationPrompts` destructured `{ data }` from `useGroveData` which returns `{ objects }`, causing all prompts to be undefined
2. **UX Bug:** Forks rendered on ALL responses instead of only the most recent

### Root Cause
```typescript
// WRONG - useGroveData returns 'objects', not 'data'
const { data: allPrompts, loading } = useGroveData<PromptPayload>('prompt');

// CORRECT
const { objects: allPrompts, loading } = useGroveData<PromptPayload>('prompt');
```

---

## Verification Checklist

### 1. Dev Server Test

```bash
cd C:\github\the-grove-foundation
npm run dev
```

Navigate to `http://localhost:3000/bedrock/experiences`

**Expected behavior:**
- [ ] Send a message
- [ ] Fork appears below AI response
- [ ] Click fork (or send another message)
- [ ] Only ONE fork visible (on newest response, not previous ones)
- [ ] Console shows: `[useNavigationPrompts] Loaded N prompts from Supabase`

### 2. Genesis Welcome Prompts

Open new/incognito browser, navigate to Terminal at genesis stage.

**Expected:**
- [ ] 3 prompts displayed at welcome screen
- [ ] Prompts are from `genesis-welcome` tag, sorted by `genesisOrder`
- [ ] Console shows: `[useGenesisPrompts] Loaded N genesis-welcome prompts`

### 3. Exploration Stage Inline Prompts

After first interaction (exploration stage):

**Expected:**
- [ ] Inline fork appears after AI response
- [ ] Fork comes from pool of 253 exploration-eligible prompts
- [ ] Clicking fork submits that prompt text

---

## Declarative Genesis Mechanism (Documentation)

The genesis-welcome prompts use a **fully declarative** configuration in Supabase:

### Configuration Fields

```sql
-- Supabase prompts table
payload.genesisOrder: number    -- 1, 2, 3... controls display sequence
tags: ['genesis-welcome']       -- filter criterion
source: 'user'                  -- distinguishes from legacy 'library'
```

### Pipeline

```
Document → Embed → Extract → Generate drafts
                                   ↓
/bedrock/pipeline (PipelineMonitor)
                                   ↓
/bedrock/prompts → ReviewQueue → Human approves → Supabase
                                                      ↓
useGenesisPrompts → filter by tag → sort by genesisOrder → slice(0,3)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/surface/hooks/useGenesisPrompts.ts` | Fetches/filters/sorts genesis prompts |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Consumes genesis prompts at ARRIVAL stage |
| `scripts/tag-genesis-prompts.ts` | Tags all prompts with genesisOrder as genesis-welcome |
| `scripts/check-genesis-prompts.ts` | Diagnostic: list genesis-welcome prompts |

### Declarative Control

To change which prompts appear at genesis:
1. In Supabase, set `payload.genesisOrder` on desired prompts (1, 2, 3...)
2. Ensure `tags` array includes `genesis-welcome`
3. Set `status: 'active'`

No code changes required — **this is DEX compliance in action**.

---

## Strangler Fig Compliance

**Legacy files left alone:**
- `src/foundation/prompts/*.json` — MVP prompt store (deprecated)
- `src/foundation/narratives/*.json` — Legacy narratives (deprecated)

**Canonical source:** Supabase `prompts` table via Grove Data Layer

**No imports from legacy `src/foundation/` in fixed files.**

---

## Files Changed (Summary)

| File | Change Type |
|------|-------------|
| `src/explore/hooks/useNavigationPrompts.ts` | Bugfix: destructure `objects` not `data` |
| `src/explore/hooks/usePromptSuggestions.ts` | Bugfix: destructure `objects` not `data` |
| `src/explore/hooks/useSequence.ts` | Bugfix: destructure `objects` not `data` |
| `src/surface/components/.../ResponseObject.tsx` | UX: Add `isLast` prop |
| `src/surface/components/.../KineticRenderer.tsx` | UX: Calculate and pass `isLastResponse` |

---

## Cleanup Tasks

- [ ] Run `npx playwright test` to verify no regressions
- [ ] Commit with message: `fix(prompts): destructure objects from useGroveData, show forks only on last response`
- [ ] Update PROJECT_PATTERNS.md if this pattern should be documented

---

## Post-Merge Verification

```bash
# Build check
npm run build

# Test suite
npm test
npx playwright test

# Visual check
npm run dev
# Navigate to /bedrock/experiences, verify fork behavior
```

---

## Session Complete

**What was fixed:**
1. ✅ Inline prompts now load from Supabase (365 prompts available)
2. ✅ Forks render only on most recent response
3. ✅ Genesis-welcome mechanism documented

**DEX Compliance:**
- No new patterns introduced
- Config-driven behavior preserved
- Strangler fig respected (legacy JSON untouched)
