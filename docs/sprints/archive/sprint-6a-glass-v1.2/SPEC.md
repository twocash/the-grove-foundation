# Sprint 6A + Quantum Glass v1.2
## SPEC.md

**Date:** 2025-12-25
**Version:** 1.0

---

## Overview

This sprint combines two complementary workstreams:
1. **Sprint 6A:** Complete analytics wiring and consolidate tuning parameters
2. **Quantum Glass v1.2:** Apply glass design system to remaining views

The goal is measurement capability + visual consistency before tackling engagement bugs.

---

## Sprint 6A: Analytics & Tuning

### 6A.1 Verify Cognitive Bridge Events

**Current State:**
- `trackCognitiveBridgeShown()`, `trackCognitiveBridgeAccepted()`, `trackCognitiveBridgeDismissed()` defined
- Events imported in Terminal.tsx
- Need to verify they fire at the right moments

**Requirement:**
- Bridge shown event fires when CognitiveBridge component mounts
- Accepted event fires when user clicks "Start Journey"
- Dismissed event fires when user clicks dismiss/X
- Events include: journeyId, entropyScore, cluster, exchangeCount

**Verification:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('grove-analytics-events'))
  .filter(e => e.event.includes('bridge'))
```

### 6A.2 Consolidate ENTROPY_CONFIG

**Current State (Duplication):**

`constants.ts` (detailed):
```typescript
export const ENTROPY_CONFIG = {
  THRESHOLDS: { LOW: 30, MEDIUM: 60 },
  LIMITS: { MAX_INJECTIONS_PER_SESSION: 2, COOLDOWN_EXCHANGES: 5 },
  SCORING: { ... }
};
```

`src/core/engagement/config.ts` (minimal):
```typescript
export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
};
```

**Action:**
1. Keep `constants.ts` ENTROPY_CONFIG (comprehensive)
2. Update `src/core/engagement/config.ts` to re-export from constants
3. Or delete the engagement config version entirely if unused

### 6A.3 Document Baseline Metrics

**Output:** `docs/analytics/BASELINE_METRICS.md`
- Current event counts by type
- Typical session flow
- Known gaps in funnel

---

## Quantum Glass v1.2: Visual Unification

### v1.2.1 Terminal Chat Styling

**Components:**
- Message bubbles (user vs assistant)
- Input field and send button
- Typing indicator
- Welcome card

**Token Mapping:**
| Element | Current | Target |
|---------|---------|--------|
| Background | Light cream | --glass-void |
| User bubble | Light gray | --glass-elevated |
| Assistant bubble | White | --glass-panel |
| Input bg | White | --glass-solid |
| Input border | Gray | --glass-border |
| Send button | Green | --neon-green |

**CSS Classes to Add:**
```css
.glass-message-user { }
.glass-message-assistant { }
.glass-input-field { }
.glass-chat-container { }
```

### v1.2.2 Inspector Content Panels

**Current State:**
- Inspector frame uses glass-panel ✓
- Inner content uses old grove-* tokens ✗

**Components to Update:**
- Metadata sections
- Property grids
- Action buttons
- Tab headers

### v1.2.3 Diary View

**Components:**
- DiaryList card styling
- DiaryInspector content
- Entry metadata (date, mood, agent)

### v1.2.4 Sprout View

**Components:**
- SproutGrid cards
- SproutInspector content
- Stage badges (already glass)
- Action buttons

---

## Acceptance Criteria

### Sprint 6A
- [ ] `getAnalyticsReport()` shows bridge events in localStorage
- [ ] Single ENTROPY_CONFIG source (no duplication)
- [ ] Tuning parameters documented in one place
- [ ] Baseline metrics snapshot saved

### Quantum Glass v1.2
- [ ] Terminal chat has glass aesthetic (dark void, subtle borders)
- [ ] Message bubbles differentiated (user vs assistant)
- [ ] Input field matches glass-input pattern
- [ ] Inspector content matches inspector frame
- [ ] Diary cards follow glass-card pattern
- [ ] Sprout cards follow glass-card pattern
- [ ] No light-mode colors visible in dark workspace

---

## Out of Scope

- Engagement reveal bug fixes (deferred to post-sprint)
- Journey-first architecture changes
- New analytics dashboard UI
- A/B testing infrastructure
