# Sprint Stories — v0.12b Terminal Polish

## Epic 0: Diagnose Clickable Bold Text (P0 — BLOCKING)

> **CONTEXT:** Commit 80d63ae added clickable bold text feature, but production testing shows it's not working. Must diagnose and fix before proceeding.

### Story 0.1: Add Diagnostic Logging to parseInline
**File:** `components/Terminal.tsx`
**Lines:** 52-90
**Task:** Add console.log statements to trace:
- Whether `onBoldClick` handler is passed
- Whether bold text (`**phrase**`) is detected by regex
- Whether button vs static span is rendered
**Commit:** `debug: add logging to parseInline for bold click diagnosis`

### Story 0.2: Add Diagnostic Logging to MarkdownRenderer
**File:** `components/Terminal.tsx`
**Lines:** 92-100
**Task:** Log at component render:
- `contentLength`
- `hasOnPromptClick` (boolean)
**Commit:** `debug: add logging to MarkdownRenderer`

### Story 0.3: Verify handleSuggestion Wiring
**File:** `components/Terminal.tsx`
**Lines:** 813-816, 985-990
**Task:** 
- Confirm `onPromptClick={handleSuggestion}` in MarkdownRenderer usage
- Add logging to handleSuggestion when called
**Commit:** `debug: verify handleSuggestion wiring`

### Story 0.4: Test AI Response Format
**Task:** Manual testing in browser:
1. Send message to Terminal
2. Check if AI response contains `**bold**` markdown syntax
3. If not, issue is AI prompt not encouraging markdown
**Output:** Document whether AI uses markdown in responses

### Story 0.5: Identify and Fix Root Cause
**Task:** Based on logging output, identify failure point:
- `onBoldClick` not passed → Fix prop chain
- Regex not matching → Fix split pattern
- AI not using markdown → Update system prompt guidance
- Button not rendered → Fix conditional rendering
**Commit:** `fix: [description based on root cause]`

### Story 0.6: Clean Up Diagnostic Logging
**File:** `components/Terminal.tsx`
**Task:** Remove or reduce console.logs to essential telemetry
**Commit:** `chore: remove diagnostic logging after bold click fix`

**Build Gate:** `npm run build` ✓ — Must verify clicks work before proceeding

---

## Epic 1: Animation Unification (P0)

### Story 1.1: Unify Drawer Animation Timing
**File:** `components/Terminal.tsx`
**Lines:** ~906
**Task:** Change drawer animation from `duration-500 ease-in-out` to `duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`
**Commit:** `style: unify drawer animation to spring timing`

---

## Epic 2: CTA Arrow Removal (P0)

### Story 2.1: Remove Arrow from ProductReveal CTA
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Lines:** 241-254
**Task:** Remove the `<svg>` element after "See it in action" text
**Commit:** `style(genesis): remove arrow from ProductReveal CTA`

### Story 2.2: Remove Arrow from AhaDemo CTA
**File:** `src/surface/components/genesis/AhaDemo.tsx`
**Lines:** 79-83
**Task:** Remove the `<svg>` element after "Go deeper" text
**Commit:** `style(genesis): remove arrow from AhaDemo CTA`

### Story 2.3: Remove Arrows from Foundation CTAs
**File:** `src/surface/components/genesis/Foundation.tsx`
**Lines:** 80-83, 89-92, 98-101, 114-118
**Task:** Remove `<svg>` elements from "The Ratchet", "The Economics", "The Vision", and "Explore" buttons
**Commit:** `style(genesis): remove arrows from Foundation CTAs`

---

## Epic 3: CognitiveBridge Enhancement (P1)

### Story 3.1: Add Typing Animation Hook
**File:** `components/Terminal/CognitiveBridge.tsx`
**Lines:** 52-70
**Task:** Add state and effect for character-by-character typing animation
**Commit:** `feat(terminal): add typing animation to CognitiveBridge`

### Story 3.2: Update CognitiveBridge Copy and Layout
**File:** `components/Terminal/CognitiveBridge.tsx`
**Lines:** 83-100
**Task:** Replace static context message with typed warm invitation, show card after typing completes
**Commit:** `content(terminal): warm conversational copy for CognitiveBridge`

---

## Epic 4: Scroll Indicator Redesign (P1)

### Story 4.1: Create ScrollIndicator Component (CSS Version)
**File:** Create `src/surface/components/genesis/ScrollIndicator.tsx`
**Task:** Seedling emoji with float animation, chevron hint
**Commit:** `feat(genesis): create ScrollIndicator component`

### Story 4.2: Add Float Animation to CSS
**File:** `styles/globals.css`
**Task:** Add `@keyframes float` and `.animate-float` class
**Commit:** `style: add float animation for scroll indicator`

### Story 4.3: Replace Scroll Indicators in Genesis Components
**Files:**
- `src/surface/components/genesis/HeroHook.tsx:64-77`
- `src/surface/components/genesis/ProblemStatement.tsx:127-136`
- `src/surface/components/genesis/ProductReveal.tsx:257-268`
- `src/surface/components/genesis/AhaDemo.tsx:99-109`
- `src/surface/components/genesis/Foundation.tsx:120-130`
**Task:** Replace bounce chevron with `<ScrollIndicator />` component
**Commit:** `refactor(genesis): use ScrollIndicator across all screens`

---

## Epic 5: ProductReveal YOUR Animation Fix (P1)

### Story 5.1: Simplify Animation Phases
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Lines:** 28-30, 57-87
**Task:** Remove 'knocking' phase, simplify to fade transition
**Commit:** `refactor(genesis): simplify ProductReveal animation phases`

### Story 5.2: Refactor YOUR Animation to Fade
**File:** `src/surface/components/genesis/ProductReveal.tsx`
**Lines:** 102-165
**Task:** 
- Remove fixed-width container
- THE and YOUR same position
- Crossfade via opacity
**Commit:** `fix(genesis): YOUR animation uses fade instead of knock-away`

---

## Commit Sequence

```
1. debug: add logging to parseInline for bold click diagnosis (Epic 0)
2. debug: add logging to MarkdownRenderer (Epic 0)
3. debug: verify handleSuggestion wiring (Epic 0)
4. fix: [root cause fix] (Epic 0)
5. chore: remove diagnostic logging after bold click fix (Epic 0)
6. style: unify drawer animation to spring timing (Epic 1)
7. style(genesis): remove arrow from ProductReveal CTA (Epic 2)
8. style(genesis): remove arrow from AhaDemo CTA (Epic 2)
9. style(genesis): remove arrows from Foundation CTAs (Epic 2)
10. feat(terminal): add typing animation to CognitiveBridge (Epic 3)
11. content(terminal): warm conversational copy for CognitiveBridge (Epic 3)
12. feat(genesis): create ScrollIndicator component (Epic 4)
13. style: add float animation for scroll indicator (Epic 4)
14. refactor(genesis): use ScrollIndicator across all screens (Epic 4)
15. refactor(genesis): simplify ProductReveal animation phases (Epic 5)
16. fix(genesis): YOUR animation uses fade instead of knock-away (Epic 5)
17. docs: update DEVLOG with v0.12b completion
```

## Build Gates
- After Epic 0: `npm run build` ✓ + **Manual verification clicks work**
- After Epic 1: `npm run build` ✓
- After Epic 2: `npm run build` ✓
- After Epic 3: `npm run build` ✓
- After Epic 4: `npm run build` ✓
- After Epic 5: `npm run build` ✓

## Smoke Test Checklist
- [ ] **Bold text in AI responses is clickable** ← P0, must work
- [ ] Clicking bold text fires telemetry and sends message
- [ ] Console shows diagnostic logs during testing (remove after)
- [ ] Drawer opens/closes with snappy spring animation
- [ ] No arrows visible on any green CTA buttons
- [ ] CognitiveBridge shows typing animation before card
- [ ] CognitiveBridge copy is warm and contextual
- [ ] Scroll indicators show seedling with float animation
- [ ] "STEP INTO YOUR GROVE" animation has no layout gap
- [ ] YOUR fades in cleanly without shifting GROVE
- [ ] All animations smooth on mobile
- [ ] No console errors (after diagnostic cleanup)
