# Kinetic Wizard Integration Sprint

## Problem Statement

When clicking "Create My Lens" from the inline moment offer in `/explore`, the navigation breaks the experience by redirecting to:

```
/?lens=custom&wizard=true
```

This completely exits the Kinetic Stream experience and lands on the legacy Surface route, losing all conversation context.

## Current Behavior

1. User engages in `/explore` (KineticStream)
2. After 1+ exchanges, `custom-lens-offer` moment appears inline
3. User clicks "Create My Lens"
4. `useMomentStream` calls `onNavigate('wizard')`
5. `ExploreShell.handleMomentNavigate` does `window.location.href = '/?lens=custom&wizard=true'`
6. **Result**: Full page navigation to legacy route, context lost

## Desired Behavior

The Custom Lens Wizard should appear as an overlay or modal within the `/explore` experience, preserving:
- Current conversation stream
- Engagement state (exchangeCount, entropy, flags)
- Session continuity

After wizard completion, the new custom lens should be applied and the user should continue exploring seamlessly.

## Technical Options

### Option A: Wizard Overlay in ExploreShell ⭐ RECOMMENDED
- Add `CustomLensWizard` as an overlay state in `ExploreShell`
- Similar to existing `LensPicker` overlay pattern
- Pros: Simple, follows existing patterns
- Cons: May need to adapt wizard for overlay context

### Option B: Wizard as Route with State Preservation
- Create `/explore/wizard` nested route
- Preserve stream state via context/localStorage
- Pros: Clean URL, back button works
- Cons: More complex state management

### Option C: Wizard as StreamItem (Inline)
- Render wizard steps as special `StreamItem` types
- Conversational wizard flow within the stream
- Pros: Most immersive, fits kinetic philosophy
- Cons: Significant refactor of wizard UI

---

## Brainstorming Notes (2024-12-29)

### Recommendation: Option A

**Why Option A is the clear winner:**

1. **Pattern already exists** - ExploreShell already has overlay system:
   ```typescript
   type OverlayType = 'none' | 'lens-picker' | 'journey-picker';
   ```
   Just add `| 'custom-lens-wizard'`

2. **LensPicker is the template** - Lines 260-270 in ExploreShell.tsx show exactly how:
   ```tsx
   {overlay.type === 'lens-picker' && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
       <div className="bg-[var(--glass-solid)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
         <LensPicker
           mode="compact"
           onBack={() => setOverlay({ type: 'none' })}
           onAfterSelect={handleLensAfterSelect}
         />
       </div>
     </div>
   )}
   ```

3. **CustomLensWizard is already modular** - It takes clean callbacks:
   ```typescript
   interface CustomLensWizardProps {
     onComplete: (candidate: LensCandidate, userInputs: UserInputs) => void;
     onCancel: () => void;
   }
   ```

4. **useCustomLens provides the CRUD** - `saveCustomLens()` handles encryption and storage

### Implementation Plan

**Step 1: Update OverlayType**
```typescript
type OverlayType = 'none' | 'lens-picker' | 'journey-picker' | 'custom-lens-wizard';
```

**Step 2: Update handleMomentNavigate**
```typescript
case 'wizard':
  setOverlay({ type: 'custom-lens-wizard' });
  break;
```

**Step 3: Add useCustomLens hook to ExploreShell**
```typescript
import { useCustomLens } from '@hooks/useCustomLens';
// ...
const { saveCustomLens } = useCustomLens();
```

**Step 4: Add wizard completion handler**
```typescript
const handleWizardComplete = useCallback(async (
  candidate: LensCandidate, 
  userInputs: UserInputs
) => {
  const newLens = await saveCustomLens(candidate, userInputs);
  selectLens(newLens.id);
  setOverlay({ type: 'none' });
  // Set flag to prevent re-offering
  actor.send({ type: 'SET_FLAG', key: 'customLensCreated', value: true });
}, [saveCustomLens, selectLens, actor]);
```

**Step 5: Render wizard overlay**
```tsx
{overlay.type === 'custom-lens-wizard' && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-[var(--glass-solid)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
      <CustomLensWizard
        onComplete={handleWizardComplete}
        onCancel={() => setOverlay({ type: 'none' })}
      />
    </div>
  </div>
)}
```

### Sizing Notes

- LensPicker uses `max-w-md` (28rem)
- Wizard has 5 steps with more content, use `max-w-2xl` (42rem)
- Wizard may need `max-h-[90vh]` vs LensPicker's `max-h-[80vh]`

### Flag Integration

After wizard completes:
1. Set `customLensCreated: true` flag in XState
2. Update `custom-lens-offer.moment.json` trigger to check this flag:
   ```json
   "trigger": {
     "flags": { "customLensCreated": false }
   }
   ```
3. This prevents the offer from reappearing after lens creation

### Estimated Effort

**Low complexity** - ~30 minutes of coding:
- 1 import
- 1 type addition
- 1 case statement change
- 1 callback handler
- 1 JSX block (copy-paste from LensPicker pattern)

---

## Files Involved

| File | Current Role |
|------|--------------|
| `src/surface/components/KineticStream/ExploreShell.tsx:60-76` | `handleMomentNavigate` - currently does `window.location.href` |
| `components/Terminal/CustomLensWizard/` | Existing 5-step wizard components |
| `hooks/useCustomLens.ts` | Custom lens CRUD with encrypted localStorage |
| `src/surface/hooks/useMomentStream.ts` | Bridge calling `onNavigate` |

## Acceptance Criteria

- [ ] Clicking "Create My Lens" opens wizard without leaving `/explore`
- [ ] Stream content remains visible (blurred/dimmed behind wizard)
- [ ] Wizard completion applies lens and returns to stream
- [ ] Wizard dismissal returns to stream without changes
- [ ] Engagement state preserved throughout
- [ ] `customLensCreated` flag prevents re-offering

## Dependencies

- Custom Lens Wizard components may need adaptation for overlay context
- May need to extract wizard logic from Terminal-specific assumptions

## Sprint Estimate

**Low complexity** - follows existing LensPicker overlay pattern exactly.

---

*Created: 2024-12-29*
*Updated: 2024-12-29 (added brainstorming notes)*
*Sprint: kinetic-wizard-integration-v1*
*Blocking: moment-ui-integration-v1 (wizard navigation)*
