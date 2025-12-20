# SPRINTS.md — Grove Main Page Voice Revision
**Generated:** 2025-12-19
**Sprint Count:** 1 (content revision, low structural risk)

---

## SPRINT 1: Narrator Voice Integration

**Duration:** 1 day
**Theme:** Replace landing page copy with Narrator voice, add prompt hook telemetry

---

### EPIC 1: Telemetry Infrastructure

#### Story 1.1: Add `trackPromptHookClicked` Function
**File:** `utils/funnelAnalytics.ts`

**Acceptance Criteria:**
- [ ] New function `trackPromptHookClicked` exists
- [ ] Function fires event with `sectionId`, `hookText`, `nodeId`, `source`
- [ ] Function is exported in default export object

**Commit:** `core: add trackPromptHookClicked telemetry function`

---

#### Story 1.2: Integrate Telemetry in App.tsx
**File:** `App.tsx`

**Acceptance Criteria:**
- [ ] `trackPromptHookClicked` is imported
- [ ] `handlePromptHook` accepts optional `sectionId` parameter
- [ ] `handlePromptHook` calls `trackPromptHookClicked` before opening Terminal
- [ ] All `<PromptHooks>` calls pass sectionId in callback

**Commit:** `surface: integrate prompt hook telemetry in App.tsx`

---

### EPIC 2: Constants Content Update

#### Story 2.1: Update SECTION_HOOKS
**File:** `constants.ts`

**Acceptance Criteria:**
- [ ] All 8 sections' hooks updated with new text/prompts
- [ ] GET_INVOLVED has 2 hooks (add one)
- [ ] All prompts match revision doc content

**Commit:** `core: update SECTION_HOOKS with Narrator voice content`

---

#### Story 2.2: Update INITIAL_TERMINAL_MESSAGE
**File:** `constants.ts`

**Acceptance Criteria:**
- [ ] Message starts with "The Terminal."
- [ ] Message includes one-sentence thesis
- [ ] Message includes three `→` suggested prompts

**Commit:** `core: update INITIAL_TERMINAL_MESSAGE with Narrator voice`

---

### EPIC 3: App.tsx Section Content

#### Story 3.1: Update Hero Section
**File:** `App.tsx` (lines 246-282)
**Commit:** `surface: update Hero section with Narrator voice`

#### Story 3.2: Update Ratchet Section
**File:** `App.tsx` (lines 286-327)
**Commit:** `surface: update Ratchet section with Narrator voice`

#### Story 3.3: Update Architecture Section
**File:** `App.tsx` (lines 330-358)
**Commit:** `surface: update Architecture section with Narrator voice`

#### Story 3.4: Update Economics Section
**File:** `App.tsx` (lines 361-386)
**Commit:** `surface: update Economics section with Narrator voice`

#### Story 3.5: Update Network Section
**File:** `App.tsx` (lines 453-513)
**Commit:** `surface: update Network section with Narrator voice`

#### Story 3.6: Update Get Involved Section
**File:** `App.tsx` (lines 516-575)
**Commit:** `surface: update Get Involved section with Narrator voice`

---

### EPIC 4: Carousel Content Update

#### Story 4.1: Update Carousel Slides 1-3
**File:** `components/WhatIsGroveCarousel.tsx` (lines 12-86)
**Commit:** `surface: update Carousel slides 1-3 with Narrator voice`

#### Story 4.2: Update Carousel Slides 4-6
**File:** `components/WhatIsGroveCarousel.tsx` (lines 87-196)
**Commit:** `surface: update Carousel slides 4-6 with Narrator voice`

---

### EPIC 5: Verification

#### Story 5.1: Build Verification
```bash
npm run build
```
**Commit:** `docs: verify build and update DEVLOG`

#### Story 5.2: Smoke Test
- [ ] All 8 sections render with new content
- [ ] Carousel navigates through 6 slides
- [ ] Hook clicks fire telemetry events
- [ ] Terminal opens with new initial message

**Commit:** `docs: complete smoke test, sprint done`

---

## COMMIT STRATEGY

| Prefix | Scope |
|--------|-------|
| `core:` | `constants.ts`, `utils/funnelAnalytics.ts` |
| `surface:` | `App.tsx`, `WhatIsGroveCarousel.tsx` |
| `docs:` | Documentation, DEVLOG |

---

## SPRINT STATUS: READY FOR EXECUTION ✓
