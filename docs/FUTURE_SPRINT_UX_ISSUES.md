# Future Sprint: Journey UX Improvements

> **Date**: 2025-12-18
> **Context**: User feedback from V2.1 journey testing

## Issue 1: Journey Trigger Requires Too Many Exchanges

**Current Behavior:**
- User must complete 3 exchanges before Cognitive Bridge can trigger
- Even with core topic keywords (e.g., "ratchet effect"), first 2 exchanges are blocked by "low" classification
- The +30 bonus only kicks in at exchange 3

**User Expectation:**
- Knowledgeable users who jump in with core concepts should see the journey immediately
- "The core concepts should 'pop' if a knowledgeable user jumps into the Grove Terminal"

**Proposed Fix:**
- Add immediate tag matching for high-signal keywords
- If user mentions explicit topic tags (e.g., "ratchet", "$380 billion", "simulation"), bypass exchange count requirement
- Consider: If `matchedTags.length > 0`, immediately classify as "high" regardless of exchange count

**Files to modify:**
- `src/core/engine/entropyDetector.ts` - `calculateEntropy()` function
- Consider adding "instant trigger" tags in hub configuration

---

## Issue 2: Journey Start + Lens Selection Creates Disorientation

**Current Behavior:**
1. User explores in freestyle mode
2. Cognitive Bridge appears, user clicks "Start Journey"
3. Entry node query is sent (e.g., "stakes-380b")
4. User is then forced to pick a lens
5. Selecting a lens resets exchange count and context
6. User ends up "in the middle of nowhere"

**User Quote:**
- "I basically then get forced to pick a lens (after picking a journey) but I'm in the middle of nowhere again?"

**Root Cause:**
- Journey start and lens selection are decoupled
- V2.1 journeys don't require a lens (they're self-contained)
- But V1/V2.0 architecture still shows "choose a lens" nudge
- Lens selection resets session state

**Proposed Fix (Options):**

### Option A: Auto-assign Journey Lens
- When user starts a V2.1 journey, automatically assign a "journey mode" that:
  - Hides lens picker
  - Tracks journey progress separately
  - Shows journey-specific UI (node progress, not thread progress)

### Option B: Suppress Lens Nudge During Journey
- When `currentNodeId` is set (user is in a journey), suppress the lens nudge
- Only show nudge when user is truly in "freestyle" mode

### Option C: Journey-First Architecture
- V2.1 journeys are the primary navigation mode
- Lenses become optional "filters" within journeys
- Journey completion triggers "What's Next" options

**Files to modify:**
- `components/Terminal.tsx` - nudge logic, session state
- `hooks/useNarrativeEngine.ts` - journey vs lens state management

---

## Issue 3: Journey Progress Not Visible

**Current Behavior:**
- `threadLength: 0` always shown for V2.1 journeys
- No visual indication of where user is in the journey
- No clear signal that journey is "in progress"

**Proposed Fix:**
- Add V2.1-specific journey progress tracking
- Show: "Journey: The Ghost in the Machine (3/5 nodes)"
- Visual progress bar or breadcrumb trail

**Files to modify:**
- `components/Terminal/JourneyNav.tsx`
- Add V2.1 journey progress state to `useNarrativeEngine`

---

## Issue 4: Cooldown Stuck at 5 (Fixed)

**Status:** Fixed in commit `12a6a8b`

**Root Cause:**
- `tickEntropyCooldown()` wasn't being called on every exchange
- Cooldown only decremented when injection happened

**Fix Applied:**
- Added `tickEntropyCooldown()` function
- Called after every exchange completion

---

## Priority Order

1. **High**: Issue 2 (Journey + Lens disorientation) - Breaks core UX flow
2. **High**: Issue 3 (Journey progress visibility) - Users can't track where they are
3. **Medium**: Issue 1 (Trigger requires exchanges) - Suboptimal but not breaking

---

## Implementation Plan: Option C (Journeys Primary, Lenses as Filters)

> **Status**: Planned for future sprint
> **Complexity**: High (architectural change)
> **Prerequisite**: V2.1 journeys working correctly

### Current Architecture

```
User Opens Terminal
       ↓
   LensPicker          (Pick persona/lens)
       ↓
   Thread Generated    (Based on lens arcEmphasis)
       ↓
   Navigation          (Cards filtered by lens)
       ↓
   CognitiveBridge     (Entropy-based journey suggestions)
```

### Target Architecture (Option C)

```
User Opens Terminal
       ↓
   JourneyPicker       (Pick V2.1 journey OR freestyle)
       ↓
   Journey Mode        (Journey nodes drive navigation)
       ↓
   Optional: LensPicker (Lens as tone filter, not content filter)
       ↓
   Navigation          (Journey nodes + lens tone)
       ↓
   Journey Completion  (What's next options)
```

### Key Changes Required

#### 1. New Component: JourneyPicker
**File:** `components/Terminal/JourneyPicker.tsx`

```typescript
interface JourneyPickerProps {
  journeys: Journey[];          // From schema.journeys
  onSelect: (journeyId: string | null) => void;
  freestyleLens: Persona;       // The new 'freestyle' persona
}
```

Features:
- Grid of journey cards showing title, description, estimated time
- "Freestyle" option (uses freestyle persona with no journey)
- Visual indicators: icon, color, status (active/draft)

#### 2. Terminal.tsx Flow Changes
**File:** `components/Terminal.tsx`

1. On first open, show `JourneyPicker` instead of `LensPicker`
2. Add state: `activeJourney: string | null`
3. When journey selected:
   - Load journey nodes from schema
   - Set `currentNodeId` to journey's `entryNode`
   - Optionally show "Choose a tone" (lens as filter)
4. Journey progress tracked via nodes, not thread

#### 3. useNarrativeEngine Changes
**File:** `hooks/useNarrativeEngine.ts`

New methods:
```typescript
selectJourney: (journeyId: string | null) => void;
getJourney: (journeyId: string) => Journey | undefined;
getActiveJourneyData: () => Journey | null;
getJourneyNodes: (journeyId: string) => JourneyNode[];
```

State additions:
```typescript
activeJourney: string | null;   // V2.1 journey ID
journeyPosition: number;        // Progress in journey
```

#### 4. Lens Becomes Tone Filter Only
When both journey and lens are active:
- Journey nodes determine **what** content is shown
- Lens determines **how** content is presented (tone, vocabulary)
- System prompt includes: journey.linkedHub expertFraming + persona.toneGuidance

#### 5. Session Storage Changes
**Keys:**
- `grove-terminal-journey` - Active journey ID
- `grove-terminal-lens` - Optional lens ID (filter only)
- `grove-terminal-journey-position` - Progress in journey

### Migration Strategy

1. **Phase 1**: Add JourneyPicker as alternative to LensPicker
   - Feature flag: `journey-first-navigation`
   - Both paths work simultaneously

2. **Phase 2**: Default to JourneyPicker for new users
   - Existing lens users retain current flow
   - New users get journey-first flow

3. **Phase 3**: Unify UX
   - LensPicker becomes "Choose Your Tone" (optional step)
   - All users see journeys as primary navigation

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/Terminal/JourneyPicker.tsx` | Create | Journey selection UI |
| `components/Terminal.tsx` | Modify | Flow logic, state management |
| `hooks/useNarrativeEngine.ts` | Modify | Journey state, methods |
| `data/narratives-schema.ts` | Modify | Export Journey types |
| `types/engagement.ts` | Modify | Add journey events |

### Estimated Effort

- JourneyPicker component: ~2 hours
- Terminal.tsx flow changes: ~3 hours
- useNarrativeEngine additions: ~2 hours
- Testing & integration: ~2 hours
- **Total**: ~9 hours

---

*Last Updated: 2025-12-18*
