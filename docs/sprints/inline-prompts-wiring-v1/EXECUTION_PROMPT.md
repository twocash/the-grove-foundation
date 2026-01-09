# Execution Prompt: inline-prompts-wiring-v1

## Context

Inline suggested prompts are not appearing after LLM responses. The pipeline exists but something is broken. Your job is to add diagnostic logging, identify the break point, and fix it.

## Architecture Summary

```
Supabase prompts → useGroveData → grovePromptToPromptObject → selectPromptsWithScoring → promptsToForks → NavigationObject
```

Key files:
- `src/explore/hooks/useNavigationPrompts.ts` - Main hook
- `src/core/context-fields/scoring.ts` - 4D scoring functions
- `src/core/context-fields/adapters.ts` - promptsToForks converter
- `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx` - Renders prompts

## Step 1: Add Diagnostic Logging

Edit `src/explore/hooks/useNavigationPrompts.ts`:

```typescript
// Inside useNavigationPrompts hook, update the useMemo block:

const result = useMemo(() => {
  // === DIAGNOSTIC LOGGING START ===
  console.log('[NavigationPrompts] Loading:', loading, 'Total prompts:', allPrompts.length);
  
  if (loading) {
    console.log('[NavigationPrompts] Still loading from Supabase...');
    return { forks: [], scoredPrompts: [], eligibleCount: 0 };
  }
  
  if (!allPrompts.length) {
    console.log('[NavigationPrompts] WARNING: No prompts from Supabase!');
    return { forks: [], scoredPrompts: [], eligibleCount: 0 };
  }

  // Get prompt pool - filter to active if requested
  const grovePool = activeOnly 
    ? allPrompts.filter(p => p.meta.status === 'active')
    : allPrompts;
  
  console.log('[NavigationPrompts] Active prompts:', grovePool.length);

  // Convert to flat PromptObject format for scoring functions
  const pool = grovePool.map(grovePromptToPromptObject);
  
  console.log('[NavigationPrompts] Converted pool sample:', pool[0]?.label, pool[0]?.targeting);
  console.log('[NavigationPrompts] Context:', JSON.stringify(context, null, 2));

  // Select prompts using 4D scoring
  const scoredPrompts = selectPromptsWithScoring(pool, context, { maxPrompts, minScore });
  
  console.log('[NavigationPrompts] Scored prompts:', scoredPrompts.length);
  if (scoredPrompts.length > 0) {
    console.log('[NavigationPrompts] Top prompt:', scoredPrompts[0].prompt.label, 'score:', scoredPrompts[0].score);
  } else {
    console.log('[NavigationPrompts] WARNING: No prompts passed scoring!');
    // Log why - check stage targeting
    const stageMatches = pool.filter(p => 
      !p.targeting.stages || p.targeting.stages.length === 0 || p.targeting.stages.includes(context.stage)
    );
    console.log('[NavigationPrompts] Stage-eligible prompts:', stageMatches.length, 'for stage:', context.stage);
  }

  // Convert to navigation forks
  const forks = promptsToForks(scoredPrompts.map(sp => sp.prompt));
  
  console.log('[NavigationPrompts] Forks:', forks.length);
  // === DIAGNOSTIC LOGGING END ===

  return {
    forks,
    scoredPrompts,
    eligibleCount: scoredPrompts.length
  };
}, [allPrompts, loading, context, maxPrompts, minScore, activeOnly]);
```

## Step 2: Build and Test

```bash
cd C:\github\the-grove-foundation
npm run build
npm run dev
```

1. Open http://localhost:3002/explore in browser
2. Open DevTools Console
3. Send a message to trigger LLM response
4. Look for `[NavigationPrompts]` log lines

## Step 3: Interpret Results

### Scenario A: "No prompts from Supabase"
**Issue:** `useGroveData` not returning data
**Check:** 
- Verify Supabase connection in `.env`
- Check browser Network tab for Supabase requests
- Verify `prompts` table has data

### Scenario B: "Stage-eligible prompts: 0"
**Issue:** All prompts have stage targeting that excludes current stage
**Fix:** Either:
1. Update prompts in Supabase to include current stage in targeting
2. Or ensure some prompts have empty `targeting.stages` (matches all stages)

Query to check:
```sql
SELECT id, title, payload->'targeting'->'stages' as stages
FROM prompts
WHERE status = 'active'
LIMIT 20;
```

### Scenario C: "No prompts passed scoring"
**Issue:** Hard filters rejecting all prompts
**Check:** Look at `context` logged - what is the current:
- `stage` value
- `activeLensId` value
- `interactionCount` value

Compare against prompt targeting requirements.

### Scenario D: "Forks: N" but nothing renders
**Issue:** Rendering blocked by feature flag or condition
**Check:** In `ResponseObject.tsx`:
- Is `isInlineNavEnabled` true?
- Is `isReady` true?
- Does `hasNavigation(item)` return false?

## Step 4: Apply Fix

Based on diagnosis, apply the appropriate fix. Most likely scenarios:

### If stage mismatch (Scenario B):

The Supabase prompts likely have `targeting.stages: ['genesis']` which excludes users who have already interacted (stage becomes 'exploration').

**Fix Option 1:** Update prompts in Supabase to include more stages:
```sql
UPDATE prompts 
SET payload = jsonb_set(
  payload, 
  '{targeting,stages}', 
  '["genesis", "exploration", "synthesis"]'
)
WHERE payload->'targeting'->'stages' @> '["genesis"]';
```

**Fix Option 2:** Ensure some prompts match all stages (empty stages array):
```sql
UPDATE prompts 
SET payload = jsonb_set(payload, '{targeting,stages}', '[]')
WHERE id IN (SELECT id FROM prompts WHERE status = 'active' LIMIT 10);
```

### If format conversion issue:

Check `grovePromptToPromptObject` function - verify it correctly maps:
- `gp.meta.title` → `label`
- `gp.payload.targeting` → `targeting`
- `gp.meta.status` → `status`

## Step 5: Verify Fix

After applying fix:

1. Refresh browser
2. Send new message
3. Console should show:
   - `[NavigationPrompts] Scored prompts: 1` (or more)
   - `[NavigationPrompts] Forks: 1` (or more)
4. UI should show orange-styled prompt(s) below response

## Step 6: Clean Up

Once working:
1. Reduce logging verbosity (remove detailed object dumps)
2. Keep essential flow logging for future debugging
3. Commit with message: `fix: wire inline prompts to Supabase (inline-prompts-wiring-v1)`

## Success Criteria

- [ ] Console shows prompts loading from Supabase
- [ ] Console shows prompts passing scoring
- [ ] Prompts appear after LLM response
- [ ] Clicking prompt fires execution

## DEVLOG

Track progress in `docs/sprints/inline-prompts-wiring-v1/DEVLOG.md`
