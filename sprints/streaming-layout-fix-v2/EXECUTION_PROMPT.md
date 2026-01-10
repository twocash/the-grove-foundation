# EXECUTION PROMPT: streaming-layout-fix-v2

**Sprint:** streaming-layout-fix-v2  
**Repository:** C:\GitHub\the-grove-foundation  
**Estimated time:** 30 minutes

---

## Context

You are fixing a visual jitter bug in the `/explore` chat streaming experience. The bug causes text to "bunch up and vibrate" during AI response streaming, then "explode" into final position when streaming completes.

**Root cause:** Framer Motion's `layout` prop animates container size changes during streaming, conflicting with CSS centering (`max-w-3xl mx-auto`).

**Solution:** Conditionally disable the `layout` prop while any response is actively streaming.

**IMPORTANT:** The file to modify is `KineticRenderer.tsx` (used by /explore), NOT `StreamRenderer.tsx` (used by Terminal/Genesis).

---

## Pre-Flight Checks

```bash
cd C:\GitHub\the-grove-foundation

# Ensure clean working directory
git status

# Verify on correct branch
git branch --show-current

# Install dependencies if needed
npm install

# Verify build works before changes
npm run build
```

---

## Implementation

### File to Modify

`src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

### Current Code (lines ~56-70)

```typescript
return (
  <div className="space-y-6" data-testid="kinetic-renderer">
    <AnimatePresence mode="popLayout">
      {allItems.map((item, index) => (
        <motion.div
          key={item.id}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
        >
```

### Changes Required

**Step 1:** Verify the import includes `ResponseStreamItem` (line ~7):

```typescript
import type { StreamItem, ResponseStreamItem, RhetoricalSpan, JourneyFork } from '@core/schema/stream';
```

If `ResponseStreamItem` is not imported, add it.

**Step 2:** Add streaming detection INSIDE `KineticRenderer` component, BEFORE the return statement (around line ~52):

```typescript
// Detect if any item is currently streaming to prevent layout thrashing
const isAnyStreaming = allItems.some(
  (item): item is ResponseStreamItem => 
    item.type === 'response' && item.isGenerating === true
);
```

**Step 3:** Modify the `motion.div` to use conditional layout (line ~63):

```typescript
<motion.div
  key={item.id}
  variants={variants}
  initial="hidden"
  animate="visible"
  exit="exit"
  layout={!isAnyStreaming}
>
```

### Complete Modified Section

After changes, lines ~52-70 should look like:

```typescript
// Detect if any item is currently streaming to prevent layout thrashing
const isAnyStreaming = allItems.some(
  (item): item is ResponseStreamItem => 
    item.type === 'response' && item.isGenerating === true
);

return (
  <div className="space-y-6" data-testid="kinetic-renderer">
    <AnimatePresence mode="popLayout">
      {allItems.map((item, index) => (
        <motion.div
          key={item.id}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout={!isAnyStreaming}
        >
```

---

## Verification

### Build Gate

```bash
# Must pass before committing
npm run build
npm test
npx playwright test
```

### Manual Testing (Required)

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:5173/explore`

3. Submit a prompt that triggers AI response (e.g., "What is Grove?")

4. **During streaming, verify:**
   - Text appears smoothly
   - NO bunching or vibration
   - NO jitter or shaking

5. **At completion, verify:**
   - Text settles naturally
   - NO "explosion" or sudden snap into position

6. Navigate away (e.g., to `/`) and back to `/explore`

7. Submit another prompt

8. **Verify entrance animation** still works:
   - New message should fade/slide in
   - Not just pop into existence

---

## Troubleshooting

### If TypeScript error on `isGenerating`:

The `ResponseStreamItem` type has `isGenerating?: boolean`. Verify:
1. Import includes `ResponseStreamItem` from `@core/schema/stream`
2. Type guard syntax is correct: `(item): item is ResponseStreamItem =>`

### If layout still jitters:

Add debug logging:
```typescript
console.log('isAnyStreaming:', isAnyStreaming, 'items:', allItems.map(i => ({ type: i.type, isGen: (i as any).isGenerating })));
```

Verify `isAnyStreaming` is `true` during streaming, `false` after.

### If entrance animations break:

Try alternative that only disables for actively generating responses:
```typescript
layout={item.type !== 'response' || !(item as ResponseStreamItem).isGenerating}
```

---

## Commit

```bash
git add src/surface/components/KineticStream/Stream/KineticRenderer.tsx
git commit -m "fix: disable layout animation during streaming to prevent jitter

- Add isAnyStreaming detection in KineticRenderer
- Conditionally apply layout prop only when not streaming
- Preserves entrance/exit animations
- Resolves bunching/explosion effect on /explore

Sprint: streaming-layout-fix-v2"
```

---

## DEVLOG Entry

Create `sprints/streaming-layout-fix-v2/DEVLOG.md`:

```markdown
# DEVLOG — streaming-layout-fix-v2

## [DATE]

### Implementation Complete

**Change:** Added conditional `layout` prop to KineticRenderer.tsx

**Files modified:**
- `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Verification:**
- [ ] Build passes
- [ ] Type check passes  
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual verification: no jitter during streaming on /explore
- [ ] Manual verification: no explosion on completion
- [ ] Manual verification: entrance animations preserved

**Notes:**
[Add observations here]
```

---

## Success Checklist

- [ ] `ResponseStreamItem` imported
- [ ] `isAnyStreaming` detection added before return
- [ ] `layout={!isAnyStreaming}` applied to motion.div
- [ ] No TypeScript errors
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npx playwright test` passes
- [ ] Manual test on /explore: streaming is smooth
- [ ] Manual test on /explore: completion is smooth
- [ ] Manual test on /explore: entrance animations work
- [ ] Committed with proper message
- [ ] DEVLOG.md created
