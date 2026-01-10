# SPRINTS: streaming-layout-fix-v2

**Sprint:** streaming-layout-fix-v2  
**Estimated total:** 30 minutes  
**Epics:** 1  
**Stories:** 2

---

## Epic 1: Disable Layout Animation During Streaming

**Goal:** Eliminate jitter on `/explore` by conditionally disabling Framer Motion layout animations while content is actively streaming.

**Files touched:**
- `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

---

### Story 1.1: Add Streaming Detection and Conditional Layout

**Estimate:** 15 minutes  
**File:** `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Task:**
1. Verify `ResponseStreamItem` is in the type import from `@core/schema/stream` (line ~7)
2. Inside `KineticRenderer` component, before the return statement (around line ~55), add:
   ```typescript
   const isAnyStreaming = allItems.some(
     (item): item is ResponseStreamItem => 
       item.type === 'response' && item.isGenerating === true
   );
   ```
3. Modify the `motion.div` (line ~63) to conditionally apply layout:
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

**Acceptance criteria:**
- [ ] No TypeScript errors
- [ ] `isAnyStreaming` is `true` during active streaming
- [ ] `isAnyStreaming` is `false` when streaming completes
- [ ] `layout` prop is `false` during streaming, `true` otherwise

---

### Story 1.2: Verify Behavior on /explore

**Estimate:** 15 minutes  
**Dependencies:** Story 1.1 complete

**Task:**
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173/explore`
3. Submit a prompt that triggers AI response
4. **Verify during streaming:**
   - Text appears smoothly without jitter
   - No bunching or vibration effect
5. **Verify at completion:**
   - Text settles naturally
   - No "explosion" or sudden snap
6. Navigate away and back to `/explore`
7. Submit another prompt
8. **Verify entrance animation** still works (message should fade/slide in)

**Acceptance criteria:**
- [ ] Streaming is smooth, no jitter
- [ ] Completion is smooth, no explosion
- [ ] Entrance animations preserved

---

## Build Gate

Run after implementation, before commit:

```bash
# TypeScript compilation
npm run build

# Unit tests
npm test

# E2E tests
npx playwright test

# Manual verification (required)
npm run dev
# Test on /explore per Story 1.2
```

---

## Definition of Done

- [ ] Code change implemented (Story 1.1)
- [ ] Manual verification passed (Story 1.2)
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`, `npx playwright test`)
- [ ] No TypeScript errors
- [ ] Committed with proper message
- [ ] DEVLOG.md updated
