# Sprint 6A + Quantum Glass v1.2
## SPRINTS.md

**Date:** 2025-12-25
**Estimated Total:** 6-8 hours

---

## Sprint 6A: Analytics & Tuning

### Story 6A.1: Verify Cognitive Bridge Events
**Estimate:** 45 min
**Priority:** P1

**Tasks:**
- [ ] Open browser console, trigger bridge flow
- [ ] Verify `trackCognitiveBridgeShown()` fires on mount
- [ ] Verify `trackCognitiveBridgeAccepted()` fires on accept
- [ ] Verify `trackCognitiveBridgeDismissed()` fires on dismiss
- [ ] Check `localStorage.getItem('grove-analytics-events')`
- [ ] Document any missing wiring

**Acceptance:**
- Bridge events appear in localStorage with correct properties
- `journeyId`, `entropyScore`, `cluster`, `exchangeCount` included

---

### Story 6A.2: Consolidate ENTROPY_CONFIG
**Estimate:** 30 min
**Priority:** P1

**Tasks:**
- [ ] Merge properties from `src/core/engagement/config.ts` into `constants.ts`
- [ ] Update `src/core/engagement/config.ts` to re-export from constants
- [ ] Search codebase for other ENTROPY_CONFIG imports
- [ ] Update imports to point to canonical source
- [ ] Verify build succeeds

**Acceptance:**
- Single ENTROPY_CONFIG definition
- No duplicate config files
- All imports resolved

---

### Story 6A.3: Document Baseline Metrics
**Estimate:** 30 min
**Priority:** P2

**Tasks:**
- [ ] Run `getAnalyticsReport()` in console
- [ ] Document event counts by type
- [ ] Note any gaps in funnel coverage
- [ ] Create `docs/analytics/BASELINE_METRICS.md`

**Acceptance:**
- Baseline snapshot saved
- Known gaps documented
- Foundation for post-fix comparison

---

## Quantum Glass v1.2: Visual Unification

### Story v1.2.1: Chat Container + Welcome Card
**Estimate:** 45 min
**Priority:** P1

**Tasks:**
- [ ] Add `.glass-chat-container` class to globals.css
- [ ] Apply to Terminal chat wrapper
- [ ] Style Welcome card with glass tokens
- [ ] Update suggestion chips to glass-btn-secondary

**Files:**
- `styles/globals.css`
- `components/Terminal.tsx`
- `components/Terminal/WelcomeInterstitial.tsx` (if exists)

**Acceptance:**
- Chat background is `--glass-void`
- Welcome card uses glass-card pattern
- Suggestions are subtle glass buttons

---

### Story v1.2.2: Message Bubbles
**Estimate:** 60 min
**Priority:** P1

**Tasks:**
- [ ] Add `.glass-message-user` class
- [ ] Add `.glass-message-assistant` class
- [ ] Update MarkdownRenderer wrapper for messages
- [ ] Apply appropriate alignment (user right, assistant left)
- [ ] Test with long messages and code blocks

**Files:**
- `styles/globals.css`
- `components/Terminal/MarkdownRenderer.tsx`
- `components/Terminal.tsx`

**Acceptance:**
- User messages clearly differentiated
- Assistant messages use glass-panel
- Code blocks remain readable
- Long messages wrap correctly

---

### Story v1.2.3: Input Field + Send Button
**Estimate:** 30 min
**Priority:** P1

**Tasks:**
- [ ] Add `.glass-input-field` class
- [ ] Style send button with `--neon-green`
- [ ] Update focus states
- [ ] Apply to CommandInput component

**Files:**
- `styles/globals.css`
- `components/Terminal/CommandInput.tsx`

**Acceptance:**
- Input has glass-solid background
- Border uses glass-border tokens
- Focus ring is cyan
- Send button glows on hover

---

### Story v1.2.4: Inspector Content Panels
**Estimate:** 45 min
**Priority:** P1

**Tasks:**
- [ ] Update section header styling
- [ ] Apply glass tokens to metadata blocks
- [ ] Update property grid labels/values
- [ ] Style action buttons (glass-btn-secondary)

**Files:**
- `src/workspace/Inspector.tsx`
- `src/explore/JourneyInspector.tsx`
- `src/explore/LensInspector.tsx`
- `src/explore/NodeGrid.tsx` (inspector portion)

**Acceptance:**
- Content matches frame aesthetic
- Headers use glass-section-header
- Buttons follow glass pattern

---

### Story v1.2.5: Diary View Glass Styling
**Estimate:** 45 min
**Priority:** P2

**Tasks:**
- [ ] Update DiaryList cards to glass-card pattern
- [ ] Apply glass tokens to DiaryInspector
- [ ] Style entry metadata (date, mood, agent)
- [ ] Update empty state

**Files:**
- `src/explore/DiaryList.tsx`
- `src/explore/DiaryInspector.tsx`

**Acceptance:**
- Diary cards match Journey/Lens cards
- Inspector content uses glass tokens
- Consistent with workspace aesthetic

---

### Story v1.2.6: Sprout View Glass Styling
**Estimate:** 45 min
**Priority:** P2

**Tasks:**
- [ ] Update SproutGrid cards to glass-card pattern
- [ ] Apply glass tokens to SproutInspector
- [ ] Verify stage badges (already glass)
- [ ] Update action buttons

**Files:**
- `src/cultivate/SproutGrid.tsx`
- `src/cultivate/SproutInspector.tsx`

**Acceptance:**
- Sprout cards match other collection views
- Inspector uses glass tokens
- Stage progression visible

---

## Story Dependency Graph

```
Sprint 6A:
  6A.1 (verify events)
       ↓
  6A.2 (consolidate config) → 6A.3 (baseline metrics)

Quantum Glass v1.2:
  v1.2.1 (container) → v1.2.2 (messages) → v1.2.3 (input)
                              ↓
                       v1.2.4 (inspector)
                              ↓
                    ┌─────────┴─────────┐
               v1.2.5 (diary)      v1.2.6 (sprout)
```

---

## Total Estimates

| Workstream | Stories | Time |
|------------|---------|------|
| Sprint 6A | 3 | 1.75 hrs |
| Quantum Glass v1.2 | 6 | 4.5 hrs |
| **Total** | **9** | **~6.25 hrs** |

Buffer for debugging/testing: +1 hour
**Target:** 7-8 hours
