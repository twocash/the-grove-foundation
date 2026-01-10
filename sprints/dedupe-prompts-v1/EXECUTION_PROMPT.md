# Execution Prompt: dedupe-prompts-v1

## Context

You are implementing a bug fix to eliminate duplicate prompt suggestions in the `/explore` experience. Currently, the same prompt text appears twice with different styling (gray pill and orange pill) because two independent sources feed prompts into `NavigationObject`.

**Sprint spec:** `sprints/dedupe-prompts-v1/SPRINT_SPEC.md`

## Pattern Compliance

This fix extends **Pattern 8: Canonical Source Rendering**. The `ResponseObject.tsx` is the canonical merge point for navigation forks. We add deduplication at this merge point, NOT in:
- `NavigationObject.tsx` (renders what it's given)
- `useNavigationPrompts.ts` (provides raw data)

## Implementation

### File to Modify

```
src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx
```

### Step 1: Add Import

Add to existing imports at top of file (around line 9):

```typescript
import type { JourneyForkType } from '@core/schema/stream';
```

### Step 2: Add Deduplication Logic

After the `navigationForks` constant (around line 72), add:

```typescript
// Sprint: dedupe-prompts-v1 - Deduplicate forks by label text
// Prefers deep_dive > pivot > apply > challenge when duplicates exist
// TODO: DEX-proper fix would add 'source' field to JourneyFork for provenance tracking
const TYPE_PRIORITY: Record<JourneyForkType, number> = {
  deep_dive: 4,
  pivot: 3,
  apply: 2,
  challenge: 1
};

const deduplicatedForks = useMemo(() => {
  const seen = new Map<string, JourneyFork>();
  
  for (const fork of navigationForks) {
    const key = fork.label.toLowerCase().trim();
    const existing = seen.get(key);
    
    if (!existing || TYPE_PRIORITY[fork.type] > TYPE_PRIORITY[existing.type]) {
      seen.set(key, fork);
    }
  }
  
  return Array.from(seen.values());
}, [navigationForks]);
```

### Step 3: Update Render

Find the render section (around line 127-130):

```typescript
// BEFORE:
{navigationForks.length > 0 && !item.isGenerating && isLast && (

// AFTER:
{deduplicatedForks.length > 0 && !item.isGenerating && isLast && (
```

And update the NavigationObject prop:

```typescript
// BEFORE:
<NavigationObject forks={navigationForks} onSelect={handleForkSelect} />

// AFTER:
<NavigationObject forks={deduplicatedForks} onSelect={handleForkSelect} />
```

## Verification Commands

```bash
# 1. Ensure clean compile
cd C:\github\the-grove-foundation
npm run dev

# 2. Wait for dev server to start, then test manually:
# - Navigate to http://localhost:3000/explore
# - Select "Concerned Citizen" lens
# - Submit: "The Trillion-Dollar Groupthink: How Epistemic Capture Creates Systemic AI Risk"
# - Receive response
# - VERIFY: No prompt text appears in both gray AND orange styling

# 3. Regression checks (in separate terminal):
npm test                     # Unit tests pass
npx playwright test          # E2E tests pass (if configured)
```

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] No TypeScript errors in `ResponseObject.tsx`
- [ ] Navigation prompts appear after response completes
- [ ] **No duplicate prompt labels** (same text in both gray and orange)
- [ ] RAG ON / JOURNEY ON toggles still functional
- [ ] Kinetic highlights (cyan links) render in response text
- [ ] Genesis prompts appear in welcome card on fresh session

## What NOT to Change

- `NavigationObject.tsx` — Renders what it receives; no filtering needed
- `useNavigationPrompts.ts` — Returns raw scored prompts; dedup happens at merge
- Fork styling in `globals.css` — Visual distinction is intentional

## Rollback

If issues arise, revert changes in `ResponseObject.tsx` to previous state:

```bash
git checkout HEAD -- src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx
```

## Sprint Attribution

- **Sprint:** dedupe-prompts-v1
- **Estimated effort:** 30 minutes
- **Pattern extended:** Pattern 8 (Canonical Source Rendering)
- **DEX compliance:** Documented in SPRINT_SPEC.md
