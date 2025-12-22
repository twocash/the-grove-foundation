# Terminal Flow Cleanup Sprint

**Goal:** Fix header persistence, show actual journey names, redesign inline journey card, and move journey completion inline.

**Priority:** HIGH - Core Terminal UX issues affecting user experience

**Depends on:** Sprint 6 (Chat Styling) ✅ Complete

---

## Issues to Fix

### Issue 1: Header Disappears After Chat Engagement
**Severity:** HIGH

**Current behavior:** The "Your Grove" header with context pills (Freestyle, Self-Guided, 🔥1) disappears once user engages with chat input or clicks a suggestion.

**Expected behavior:** Header should ALWAYS be visible when in chat view, regardless of message count or interaction state.

**Root cause hypothesis:** Likely a conditional render or CSS override hiding the header. Need to investigate:
- `showLensPicker` conditional in Terminal.tsx
- CSS overrides in ExploreChat.tsx
- Feature flag `enableControlsBelow` interaction

### Issue 2: Journey Pill Shows Generic Label
**Severity:** MEDIUM

**Current behavior:** Header shows "Guided Journey" when on a journey.

**Expected behavior:** Header should show actual journey name (e.g., "The Ghost in the Machine").

**Location:** `components/Terminal.tsx` ~line 1076

**Current code:**
```tsx
journeyName={currentThread.length > 0 ? 'Guided Journey' : 'Self-Guided'}
```

**Fix:**
```tsx
journeyName={activeJourney?.title || (currentThread.length > 0 ? 'Guided' : 'Self-Guided')}
```

### Issue 3: JourneyCard Is Redundant and Cluttered
**Severity:** MEDIUM

**Current behavior:** Large inline panel showing:
- "CONTINUE YOUR JOURNEY" header
- "Freestyle Journey" title (redundant - lens is in header now)
- Current card query in quotes
- "8 cards remaining" 
- Progress bar
- "Or explore freely below" link
- "Ask the Grove" / "Resume" button

**Expected behavior:** Minimal suggestion-style prompt since context now lives in header. Should look like a suggestion chip, not a control panel.

**Location:** `components/Terminal/JourneyCard.tsx`

### Issue 4: JourneyCompletion Renders as Floating Modal
**Severity:** MEDIUM

**Current behavior:** "Journey Complete!" celebration card renders as floating modal at bottom of viewport, outside the chat area.

**Expected behavior:** Should render inline within chat messages area, styled consistently with assistant messages.

**Location:** `components/Terminal/JourneyCompletion.tsx` and wherever it's rendered in `Terminal.tsx`

---

## Design Specifications

### Header (Target State)
```
┌─────────────────────────────────────────────────────────────────────┐
│ ☰  Your Grove   [Concerned Citizen ▼] [The Ghost in the Machine ▼] │  🔥3  ─  ✕
└─────────────────────────────────────────────────────────────────────┘
```

- Always visible when in chat
- Lens pill: Shows lens name with colored dot
- Journey pill: Shows actual journey title (truncated if needed)
- Both pills clickable for selection

### JourneyCard (Redesigned)

**Option A: Minimal Header + Suggestion**
```
CONTINUE THE JOURNEY                                    Step 3 of 8
┌─────────────────────────────────────────────────────────────────┐
│ Wait. Where are we, exactly?                                  → │
└─────────────────────────────────────────────────────────────────┘
```

**Option B: Just a Suggestion Chip** (preferred)
Render the current card prompt as a suggestion chip matching the existing "You might start with:" styling. No special container needed.

```tsx
// In the suggestions area, add journey continuation as first option
{hasActiveJourney && currentCard && (
  <SuggestionChip
    label={currentCard.label}
    onClick={onResume}
    variant="journey" // optional styling variant
  />
)}
```

### JourneyCompletion (Inline)

Render as a message in the chat flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                            🎉                                    │
│                    Journey Complete!                             │
│              The Ghost in the Machine                            │
│                                                                  │
│     You've explored this topic in depth. Time: 12 minutes       │
│                                                                  │
│     How was this journey?                                        │
│     😐  🙂  😊  🤩  🤯                                           │
│      1   2   3   4   5                                          │
│                                                                  │
│     [What resonated? What was confusing?          ]             │
│                                                                  │
│              [Skip]              [Continue]                      │
└─────────────────────────────────────────────────────────────────┘
```

Style to match assistant message bubbles but centered content.

---

## Implementation Steps

### Step 1: Fix Header Persistence

1. In `components/Terminal.tsx`, find where `TerminalHeader` is rendered
2. Check the conditional `showLensPicker ? ... : (` - header should render outside this
3. Verify CSS in `src/explore/ExploreChat.tsx` isn't hiding header elements
4. Test that header persists after:
   - Clicking a suggestion
   - Typing a query
   - Receiving a response
   - Multiple back-and-forth messages

### Step 2: Fix Journey Name in Header

1. In `components/Terminal.tsx`, locate the `journeyName` prop passed to `TerminalHeader`
2. Access the active journey object to get its title
3. Update prop to show actual journey name

### Step 3: Redesign JourneyCard

1. Simplify `components/Terminal/JourneyCard.tsx` to minimal design
2. Remove redundant context (journey title - it's in header now)
3. Remove progress bar (position shown in header)
4. Keep only: label indicating journey continuation + current card prompt + click action
5. Style to match suggestion chips

### Step 4: Move JourneyCompletion Inline

1. Find where `JourneyCompletion` is rendered in `Terminal.tsx`
2. Move from positioned/modal to inline in messages area
3. Update styling to match chat message aesthetic
4. Ensure it appears after the final journey card response

### Step 5: Dark Mode Verification

All changes must work in dark mode (workspace uses dark theme).

---

## Files to Modify

| File | Changes |
|------|---------|
| `components/Terminal.tsx` | Fix header render location, update journey name prop, adjust JourneyCompletion render position |
| `components/Terminal/TerminalHeader.tsx` | Possibly add journey click handler |
| `components/Terminal/JourneyCard.tsx` | Complete redesign to minimal suggestion |
| `components/Terminal/JourneyCompletion.tsx` | Restyle for inline chat appearance |
| `src/explore/ExploreChat.tsx` | Check/fix CSS overrides if blocking header |

---

## Acceptance Criteria

- [ ] Header visible at ALL times when in chat view (not just initial state)
- [ ] Header shows actual journey name, not "Guided Journey"
- [ ] Journey pill is clickable and navigates to Journeys view (or shows selection)
- [ ] JourneyCard is minimal - no redundant context, suggestion-chip style
- [ ] JourneyCompletion renders inline in chat, not as floating modal
- [ ] All components styled correctly in dark mode
- [ ] Build passes
- [ ] Tests pass
- [ ] No regressions in chat functionality

---

## Testing Checklist

1. **Fresh start:** Open /explore, verify header shows
2. **Click suggestion:** Header persists after clicking "What does distributed AI mean?"
3. **Type query:** Header persists after typing and submitting
4. **Multi-turn:** Header persists through 5+ message exchanges
5. **Journey start:** Select a guided journey, verify journey name shows in header
6. **Journey card:** Verify minimal design, clicking advances journey
7. **Journey complete:** Finish journey, verify celebration appears inline
8. **Dark mode:** All above in dark mode (default workspace theme)
