# Post-Sprint: Engagement Reveal Bug Fix

## Status: 📋 QUEUED
## Priority: High
## Prerequisite: Sprint 6 (Analytics) + Quantum Glass v1.2

---

## Overview

Two high-priority bugs are preventing the engagement reveal system from working. Users meet engagement thresholds but never see reveals. This sprint is queued to run AFTER analytics are in place (so we can verify fixes) and visual unification is complete (so we're not mixing concerns).

---

## BUG-001: Custom Lens Reveal Flow Not Connected

### Symptoms
- `showCustomLensOffer` computed as `true` in state
- Custom Lens Offer never appears to user
- Flow should be: Simulation Reveal → acknowledge → Custom Lens Offer appears

### Expected Flow
```
User engages deeply (5+ exchanges OR 3+ minutes OR 1 journey)
  ↓
Simulation Reveal appears
  ↓
User clicks "Continue"
  ↓
Custom Lens Offer should appear ← NOT HAPPENING
  ↓
User accepts (opens wizard) or declines
```

### Investigation Areas
- `hooks/useEngagementBridge.ts:30-44` — Queue-to-flag computation
- `Terminal.tsx:357-372` — useEffect that should watch `shouldShowLensOffer`
- `DEFAULT_TRIGGERS` — `requiresAcknowledgment: ['simulation']` may not be working

### Workaround
Users can manually open lens picker and click "Create Your Own" if `custom-lens-in-picker` flag is enabled.

---

## BUG-003: Engagement State Not Triggering Reveals

### Symptoms
From admin console STATE SNAPSHOT:
- `exchangeCount: 7` (meets ≥5 threshold) ✓
- `journeysCompleted: 1` (meets ≥1 threshold) ✓
- `minutesActive: 12` (meets ≥3 threshold) ✓
- `hasCustomLens: true` ✓
- BUT `revealsShown: []` is EMPTY ❌

### Root Cause Hypothesis
Trigger evaluation works (reveals enter queue), but React components don't respond to queue updates. Possible issues:
1. `shouldShowSimReveal` computed value not triggering useEffect
2. State subscription not properly connected
3. Render cycle issue with the bridge hook

### Investigation Areas
- `hooks/useEngagementBridge.ts` — Queue-to-flag computation
- `Terminal.tsx:340-347` — Simulation reveal trigger effect
- `hooks/useEngagementBus.ts:evaluateAndNotify` — Queue notification

---

## Debug Strategy

### Step 1: Add Instrumentation
```typescript
// In useEngagementBridge.ts
useEffect(() => {
  console.log('[EngagementBridge] Queue changed:', {
    queue: state.revealQueue,
    showSim: shouldShowSimReveal,
    showLens: shouldShowLensOffer
  });
}, [state.revealQueue]);

// In Terminal.tsx
useEffect(() => {
  console.log('[Terminal] Sim reveal check:', { shouldShowSimReveal, alreadyShown: hasShownSimReveal });
}, [shouldShowSimReveal]);
```

### Step 2: Trace the Flow
1. Open browser console
2. Engage with terminal (5+ exchanges)
3. Watch for:
   - `[EngagementBus] Threshold met: simulation-reveal`
   - `[EngagementBridge] Queue changed: [...]`
   - `[Terminal] Sim reveal check: { shouldShowSimReveal: true, ... }`

### Step 3: Identify Break Point
- If bus logs threshold but bridge doesn't see queue → subscription issue
- If bridge sees queue but Terminal doesn't react → computed value issue
- If Terminal logs true but nothing renders → JSX conditional issue

### Step 4: Fix and Verify
- Apply fix
- Check analytics dashboard for `reveal_shown` events
- Confirm full funnel: threshold → queue → display → acknowledge

---

## Success Criteria

- [ ] Simulation Reveal appears when thresholds met
- [ ] Custom Lens Offer appears after Simulation acknowledged
- [ ] `revealsShown` array populated correctly
- [ ] Analytics events: `simulation_reveal_shown`, `lens_offer_shown`
- [ ] Full flow works in incognito (clean state)

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Add instrumentation | 30 min |
| Reproduce and trace | 1 hour |
| Identify root cause | 1 hour |
| Implement fix | 1 hour |
| Verify with analytics | 30 min |
| **Total** | **4 hours** |

---

## Dependencies

- **Sprint 6 complete:** Analytics events wired so we can verify fixes work
- **Quantum Glass v1.2 complete:** Visual layer stable, not mixing concerns

---

*This sprint will be executed after Sprint 6 + Quantum Glass v1.2*
