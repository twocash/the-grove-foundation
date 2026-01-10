# Sprint: dedupe-prompts-v1

## Problem Statement

When a user receives a response in `/explore`, the same prompt suggestion appears twice with different styling:

1. **Gray pill** (`kinetic-fork--secondary`) - `pivot` type fork
2. **Orange pill** (`kinetic-fork--primary`) - `deep_dive` type fork with "↓" icon

Both show identical text (e.g., "Building AI Villages Instead of AI Empires").

## Root Cause Analysis

Two independent prompt sources feed `NavigationObject`:

| Source | Location | Fork Types Generated |
|--------|----------|---------------------|
| LLM Parsing | `item.navigation` on `ResponseStreamItem` | Parsed from response text, assigns types heuristically |
| 4D Scoring | `useSafeNavigationPrompts()` hook | Scores from prompt library, assigns `deep_dive` by default |

The `navigationForks` useMemo in `ResponseObject.tsx` (lines 70-95) selects ONE source based on `journeyMode` flag, but both sources can contain the same prompt text with different `type` values.

**Key insight:** Deduplication must happen by **label text**, not by `id`, since the same prompt gets different IDs from different sources.

---

## Files Involved

### Primary (modify)

```
src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx
```
- Lines 70-95: `navigationForks` useMemo - add deduplication logic here
- This is the single point where fork sources are merged/selected

### Secondary (reference only)

```
src/surface/components/KineticStream/Stream/blocks/NavigationObject.tsx
```
- Renders forks grouped by type
- No changes needed - it renders what it's given

```
src/explore/hooks/useNavigationPrompts.ts
```
- Returns `forks` array from 4D scoring
- Reference to understand fork structure

```
styles/globals.css (lines 1648-1694)
```
- Fork styling by type (primary=orange, secondary=gray)

---

## Acceptance Criteria

1. **No duplicate labels** - If two forks have identical `label` text, only one renders
2. **Priority order** - When deduplicating, prefer `deep_dive` > `pivot` > `apply` > `challenge`
3. **Preserve count** - Target 3 prompts shown; if deduplication reduces count, that's acceptable
4. **No regression** - RAG/JOURNEY toggles, kinetic highlights, genesis prompts still work
5. **Clean compile** - `npm run dev` starts without errors

---

## Implementation Approach

### DEX Compliance Notes

This fix is **partially DEX-compliant**:

- ✅ **Declarative Sovereignty**: Fix lives in component, doesn't require config changes
- ✅ **Capability Agnostic**: Works regardless of which LLM generates responses  
- ⚠️ **Provenance Tracking**: We lose provenance of which source the prompt came from
- ✅ **Organic Scalability**: Simple O(n) deduplication scales with prompt count

**TODO stub for proper fix:** A fully DEX-compliant solution would track provenance by adding a `source: 'llm-parsed' | '4d-scored'` field to `JourneyFork`, allowing telemetry to record which source performed better. This requires schema changes to `JourneyFork` type and updates to both prompt sources. Estimated scope: separate sprint.

### Code Change

In `ResponseObject.tsx`, after the `navigationForks` useMemo (around line 95), add deduplication:

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

Then update the render to use `deduplicatedForks` instead of `navigationForks`:

```typescript
{deduplicatedForks.length > 0 && !item.isGenerating && isLast && (
  <div className="mt-4 w-full max-w-[90%]">
    <NavigationObject forks={deduplicatedForks} onSelect={handleForkSelect} />
  </div>
)}
```

### Import Addition

Add to imports at top of file:

```typescript
import type { JourneyForkType } from '@core/schema/stream';
```

---

## Verification Steps

1. `npm run dev` - confirm clean compile
2. Navigate to `http://localhost:3000/explore`
3. Select "Concerned Citizen" lens
4. Submit: "The Trillion-Dollar Groupthink: How Epistemic Capture Creates Systemic AI Risk"
5. Receive response
6. **Verify**: No prompt text appears in both gray AND orange styling
7. **Verify**: RAG ON / JOURNEY ON toggles still functional
8. **Verify**: Kinetic highlights (cyan links) still render in response text
9. **Verify**: Genesis prompts appear in welcome card when starting fresh session

---

## Out of Scope

- Telemetry tracking of prompt sources (requires schema change)
- Topic bridging / `topicInterests` on personas (stash work)
- Genesis sequence ordering (stash work)
- Performance-aware scoring (stash work)

---

## Estimated Effort

**30 minutes** - Single file change, ~20 lines of code, straightforward verification.
