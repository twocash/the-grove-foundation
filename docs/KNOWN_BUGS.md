# Known Bugs & Issues

> Last updated: December 16, 2025 (Sprint 8)

## High Priority

### BUG-001: Personal Lens Reveal Flow Not Connected
**Status:** Not Started
**Severity:** High
**Location:** `Terminal.tsx`, `hooks/useEngagementBridge.ts`

**Description:**
The Custom Lens Offer reveal (`showCustomLensOffer`) is computed by the Engagement Bus but never displayed to the user. The reveal should appear after the user acknowledges the Simulation Reveal.

**Expected Flow:**
1. User engages deeply (5+ exchanges OR 3+ minutes OR 1 journey)
2. Simulation Reveal appears → User clicks "Continue"
3. Custom Lens Offer should appear → User can accept (opens wizard) or decline

**Current Behavior:**
- Simulation Reveal works
- Custom Lens Offer never appears despite `showCustomLensOffer` being true in state

**Root Cause:**
The `useEngagementBridge` hook computes `showCustomLensOffer` from the queue, but the trigger in `DEFAULT_TRIGGERS` requires `requiresAcknowledgment: ['simulation']`. The acknowledgment is being tracked but the reveal isn't being displayed.

**Files to Fix:**
- `Terminal.tsx:357-372` - Add useEffect to watch `shouldShowLensOffer`
- `components/Terminal/Reveals/CustomLensOffer.tsx` - Verify component renders

**Workaround:**
Users can manually open lens picker and click "Create Your Own" if `custom-lens-in-picker` flag is enabled.

---

### BUG-002: Scholar Mode Voice Doesn't Revert When Disabled
**Status:** Not Started
**Severity:** Medium
**Location:** `Terminal.tsx`, `server.js` (chat API)

**Description:**
When Scholar Mode (verbose mode) is toggled OFF, the terminal continues to give long, detailed responses instead of reverting to "short, memorable, pithy answers."

**Expected Behavior:**
- Scholar Mode ON: Detailed, academic, thorough responses
- Scholar Mode OFF: Concise, punchy, memorable responses

**Current Behavior:**
- Toggling OFF doesn't change the response style
- The `--verbose` flag is removed from display but the server may still be using cached session context

**Root Cause:**
The `verboseMode` flag is sent to the server on each request, but:
1. The chat session may cache the previous tone
2. The system prompt may not have a strong "non-verbose" instruction

**Files to Fix:**
- `server.js:TERMINAL_SYSTEM_PROMPT` - Add explicit "concise mode" instruction
- `Terminal.tsx:handleSend` - Verify `verboseMode` is correctly passed
- Consider resetting chat session when verbosity changes

**Proposed Fix:**
```typescript
// In Terminal.tsx - reset session when verbose mode changes
useEffect(() => {
  resetChatSession();
}, [isVerboseMode]);
```

---

### BUG-003: Engagement State Not Reflected in User Experience
**Status:** Not Started
**Severity:** High
**Location:** Multiple files

**Description:**
Despite deep engagement (7+ exchanges, 12+ minutes, custom lens selected, topics explored), the user doesn't see any evidence of this engagement translating to reveals or special experiences.

**Symptoms:**
- Simulation Reveal not appearing despite meeting criteria
- No visual feedback of engagement progress
- Admin console shows state but user sees nothing

**Analysis from Screenshot:**
The STATE SNAPSHOT shows:
- `exchangeCount: 7` (meets ≥5 threshold)
- `journeysCompleted: 1` (meets ≥1 threshold)
- `minutesActive: 12` (meets ≥3 threshold)
- `hasCustomLens: true`
- BUT `revealsShown: []` is empty!

**Root Cause:**
The trigger evaluation is working (reveals enter the queue), but the React components aren't responding to the queue updates. Possible issues:
1. `shouldShowSimReveal` computed value not triggering useEffect
2. State subscription not properly connected
3. Render cycle issue with the bridge hook

**Files to Investigate:**
- `hooks/useEngagementBridge.ts:30-44` - Queue-to-flag computation
- `Terminal.tsx:340-347` - Simulation reveal trigger effect
- `hooks/useEngagementBus.ts:evaluateAndNotify` - Queue notification

**Debug Steps:**
1. Open browser console
2. Add `console.log` in `useEngagementBridge` to track queue changes
3. Verify `showSimulationReveal` boolean updates when queue changes

---

## Medium Priority

### BUG-004: Time Tracking May Not Update minutesActive
**Status:** Needs Verification
**Severity:** Medium
**Location:** `hooks/useEngagementBus.ts`

**Description:**
The `minutesActive` field may not be updating correctly. The time tracking interval runs every 30 seconds, but the value shown in admin console may be stale.

**Investigation Needed:**
- Verify `startTimeTracking()` is called on singleton init
- Check if `setInterval` is being cleared on unmount
- Confirm `calculateMinutesActive()` uses correct session start time

---

### BUG-005: Reveal Queue Not Clearing After Display
**Status:** Needs Verification
**Severity:** Low
**Location:** `hooks/useEngagementBus.ts`

**Description:**
Once a reveal is shown, it should be removed from the queue. Currently unclear if this is happening correctly.

---

## Low Priority / Enhancements

### ENH-001: Add User-Facing Engagement Progress Indicator
**Status:** Idea
**Description:**
Consider adding a subtle visual indicator showing engagement level to users, similar to a "profile completion" meter.

### ENH-002: Persist Trigger Configuration to GCS
**Status:** Idea
**Description:**
Currently triggers are hardcoded in `DEFAULT_TRIGGERS`. Allow admin to modify and save triggers to `narratives.json`.

---

## Resolved

(None yet)
