# Sprint 7: Terminal Flow Cleanup

**Version:** 1.0
**Status:** Ready for Execution
**Dependencies:** Sprint 6 (Chat Styling) - COMPLETE

## Overview

This sprint completes the Terminal UX modernization by:
1. Fixing header persistence issues
2. Showing actual journey names in header pills
3. Redesigning the inline JourneyCard to be minimal
4. Moving JourneyCompletion from floating modal to inline chat

## Problem Statement

After Sprint 6, several UX issues remain:

### Issue 1: Header Disappears After Chat Engagement
- **Observed:** Header with context pills visible on fresh load, disappears after user engages
- **Expected:** Header should always be visible during chat

### Issue 2: Journey Pill Shows Generic Label
- **Current:** "Guided Journey" (hardcoded)
- **Expected:** Actual journey name (e.g., "The Ghost in the Machine")

### Issue 3: JourneyCard is Redundant and Verbose
- **Current:** Large panel showing lens name, journey title, progress bar, "explore freely" option
- **Problem:** Context now lives in header - card duplicates information
- **Expected:** Minimal suggestion-style prompt showing only the next card query

### Issue 4: JourneyCompletion Floats Outside Viewport
- **Current:** `fixed inset-0` modal positioned absolutely
- **Problem:** In embedded workspace context, appears outside the center column
- **Expected:** Renders inline within chat messages area

## Target State

### Header (Always Visible)
```
┌────────────────────────────────────────────────────────────────────┐
│ ☰  Your Grove   [Freestyle ▼]  [Ghost in the Machine ▼]   🔥3  ─ ✕ │
└────────────────────────────────────────────────────────────────────┘
```

### Inline Journey Prompt (Minimal)
```
CONTINUE THE JOURNEY                                           1/8
┌────────────────────────────────────────────────────────────────────┐
│ Wait. Where are we, exactly?                                    → │
└────────────────────────────────────────────────────────────────────┘
```

### Journey Completion (Inline)
Renders as a special message in the chat flow, not a floating modal.

## Implementation Plan

### Task 1: Fix Header Persistence

**File:** `components/Terminal.tsx`

**Investigation needed:** 
- Check if `showLensPicker`, `showWelcomeInterstitial`, or `showCustomLensWizard` states are incorrectly triggered
- Verify CSS overrides in `ExploreChat.tsx` aren't hiding the header
- Check if there's scroll behavior hiding the header

**Hypothesis:** The header IS rendering but something is causing it not to display. Possible causes:
- CSS class collision with workspace overrides
- State change after first message sent
- Conditional rendering based on message count

### Task 2: Journey Name in Header

**File:** `components/Terminal.tsx` (~line 1076)

**Current code:**
```tsx
journeyName={currentThread.length > 0 ? 'Guided Journey' : 'Self-Guided'}
```

**Change to:**
```tsx
journeyName={
  activeJourney?.title || 
  (currentThread.length > 0 ? 'Guided' : 'Self-Guided')
}
```

**Required:** Get active journey data. Check if `useNarrativeEngine` provides this or if we need to look it up from the schema.

### Task 3: Redesign JourneyCard

**File:** `components/Terminal/JourneyCard.tsx`

**Current structure (97 lines):**
- Header with "CONTINUE YOUR JOURNEY" + card count
- Button with journey title, card label, progress bar
- "Explore freely" option

**New structure (~40 lines):**
```tsx
const JourneyCard: React.FC<JourneyCardProps> = ({
  currentPosition,
  totalCards,
  currentCard,
  onResume,
}) => {
  if (!currentCard) return null;

  return (
    <div className="mb-4">
      {/* Minimal header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Continue the Journey
        </span>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          {currentPosition + 1}/{totalCards}
        </span>
      </div>
      
      {/* Single suggestion chip */}
      <button
        onClick={onResume}
        className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 
          bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-primary/5 
          dark:hover:bg-primary/10 transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
            {currentCard.label}
          </span>
          <span className="text-slate-400 group-hover:text-primary transition-colors">→</span>
        </div>
      </button>
    </div>
  );
};
```

**Props change:**
```tsx
// Old
interface JourneyCardProps {
  currentThread: string[];
  currentPosition: number;
  currentCard: Card | null;
  journeyTitle?: string;
  onResume: () => void;
  onExploreFreely?: () => void;
  isFirstCard?: boolean;
}

// New (simplified)
interface JourneyCardProps {
  currentPosition: number;
  totalCards: number;
  currentCard: Card | null;
  onResume: () => void;
}
```

**Update usage in Terminal.tsx (~line 1321):**
```tsx
<JourneyCard
  currentPosition={currentPosition}
  totalCards={currentThread.length}
  currentCard={getThreadCard(currentPosition)}
  onResume={() => {
    const card = getThreadCard(currentPosition);
    if (card) {
      handleSend(card.query, card.label, card.id);
      const nextCardId = advanceThread();
      if (nextCardId === null && currentPosition >= currentThread.length - 1) {
        setShowJourneyCompletion(true);
        recordJourneyCompleted();
        incrementJourneysCompleted();
      }
    }
  }}
/>
```

### Task 4: Inline JourneyCompletion

**File:** `components/Terminal/JourneyCompletion.tsx`

**Current:** Renders as a standalone component in a fixed modal
**Target:** Renders inline within the messages area

**Option A: Render as special message type**
Add the completion UI as a message in the chat flow instead of a modal.

**Option B: Render inline below messages**
Keep component separate but render within the scrollable messages area, not fixed positioned.

**Recommended: Option B** - Less invasive, keeps separation of concerns.

**File:** `components/Terminal.tsx` (~line 1412-1439)

**Current:**
```tsx
{showJourneyCompletion && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 backdrop-blur-sm">
    <div className="w-full max-w-md mx-4">
      <JourneyCompletion ... />
    </div>
  </div>
)}
```

**Change to:** Move inside the messages area, after the last message:
```tsx
{/* Inside messages area, after messages.map() */}
{showJourneyCompletion && (
  <div className="max-w-md mx-auto my-6">
    <JourneyCompletion ... />
  </div>
)}
```

**Style updates to JourneyCompletion.tsx:**
- Remove outer padding that assumed modal context
- Add dark mode styling
- Match chat bubble aesthetics

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `components/Terminal.tsx` | Fix header, journey name, move completion | HIGH |
| `components/Terminal/JourneyCard.tsx` | Complete redesign | HIGH |
| `components/Terminal/JourneyCompletion.tsx` | Dark mode + inline styling | MEDIUM |
| `components/Terminal/TerminalHeader.tsx` | Verify rendering (may not need changes) | LOW |

## Files to Read (Reference)

| File | Purpose |
|------|---------|
| `src/explore/ExploreChat.tsx` | CSS overrides for embedded Terminal |
| `hooks/useNarrativeEngine.ts` | Journey/thread state management |
| `data/narratives-schema.ts` | Journey data structure |

## Acceptance Criteria

### Must Have
- [ ] Header visible at all times during chat (doesn't disappear)
- [ ] Journey pill shows actual journey name, not "Guided Journey"
- [ ] JourneyCard is minimal - shows only card label as suggestion
- [ ] JourneyCompletion renders inline in chat, not floating modal
- [ ] All components styled for dark mode
- [ ] Build passes
- [ ] Tests pass

### Nice to Have
- [ ] Journey pill is clickable and navigates to Journeys view
- [ ] Smooth animation when completion card appears
- [ ] Progress indicator subtle but visible

## Design Tokens Reference

```css
/* Primary colors */
--grove-accent: #00d4aa;      /* Teal accent */
--grove-text: #e2e8f0;        /* Light text */
--grove-text-muted: #94a3b8;  /* Muted text */
--grove-border: #1e2a36;      /* Border color */
--grove-surface: #121a22;     /* Surface background */

/* Tailwind equivalents */
text-primary        → var(--grove-accent)
bg-primary          → var(--grove-accent)
border-slate-700    → var(--grove-border)
bg-slate-800        → var(--grove-surface)
```

## Testing Checklist

1. **Fresh load:** Header visible with pills
2. **After selecting lens:** Header persists, shows lens name
3. **After sending message:** Header still visible
4. **During guided journey:** Minimal card shows next prompt
5. **Journey completion:** Inline celebration, not modal
6. **Dark mode:** All elements properly styled
7. **Workspace embedded:** All functionality works in ExploreChat context
