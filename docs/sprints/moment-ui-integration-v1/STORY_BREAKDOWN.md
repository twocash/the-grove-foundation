# STORY_BREAKDOWN.md — moment-ui-integration-v1

**Sprint:** moment-ui-integration-v1
**Created:** 2024-12-29

---

## Epic 1: Surface Components

### Story 1.1: MomentOverlay Component

**Task:** Create overlay component for modal moments

**Files:**
- CREATE: `src/surface/components/MomentRenderer/MomentOverlay.tsx`
- MODIFY: `src/surface/components/MomentRenderer/index.ts`

**Implementation:**
```typescript
// MomentOverlay.tsx
interface MomentOverlayProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  activeLens?: string | null;
}

export function MomentOverlay({ moment, onAction, onDismiss, activeLens }: MomentOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onDismiss(moment.meta.id)}
      />
      {/* Content */}
      <div className="relative z-10 max-w-lg w-full mx-4 animate-in fade-in zoom-in-95">
        <GlassContainer intensity="elevated" className="p-6">
          <MomentCard 
            moment={moment} 
            onAction={onAction} 
            onDismiss={onDismiss}
            activeLens={activeLens}
          />
        </GlassContainer>
      </div>
    </div>
  );
}
```

**Acceptance:**
- Renders with backdrop blur
- Centers content
- Dismisses on backdrop click
- Passes actions to parent

---

### Story 1.2: MomentToast Component

**Task:** Create toast component for transient notifications

**Files:**
- CREATE: `src/surface/components/MomentRenderer/MomentToast.tsx`

**Implementation:**
```typescript
// MomentToast.tsx
interface MomentToastProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
}

export function MomentToast({ moment, onAction, onDismiss }: MomentToastProps) {
  useEffect(() => {
    // Auto-dismiss after 5 seconds if no action
    const timer = setTimeout(() => onDismiss(moment.meta.id), 5000);
    return () => clearTimeout(timer);
  }, [moment.meta.id, onDismiss]);

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-sm animate-in slide-in-from-right">
      <GlassContainer intensity="default" className="p-4">
        {/* Compact content */}
      </GlassContainer>
    </div>
  );
}
```

**Acceptance:**
- Positioned bottom-right above command console
- Auto-dismisses after 5 seconds
- Slide-in animation

---

### Story 1.3: MomentInline Component

**Task:** Create inline component for stream injection

**Files:**
- CREATE: `src/surface/components/MomentRenderer/MomentInline.tsx`

**Implementation:**
- Card that fits stream visual language
- Uses GlassContainer with subtle intensity
- Standard action buttons

**Acceptance:**
- Renders within stream layout
- Matches stream item styling
- Actions work correctly

---

## Epic 2: Reveal Components

### Story 2.1: SimulationReveal Component

**Task:** Create the simulation reveal content

**Files:**
- CREATE: `src/surface/components/MomentRenderer/reveals/SimulationReveal.tsx`

**Implementation:**
```typescript
interface SimulationRevealProps {
  moment: Moment;
  opening?: string;
}

export function SimulationReveal({ moment, opening }: SimulationRevealProps) {
  const defaultOpening = "This terminal is proof that distributed AI works.";
  
  return (
    <div className="space-y-4">
      <div className="text-3xl">✨</div>
      <h3 className="font-display text-xl text-[var(--glass-text-primary)]">
        {moment.payload.content.heading || "You're Already Inside"}
      </h3>
      <p className="text-[var(--glass-text-body)]">
        {opening || defaultOpening}
      </p>
    </div>
  );
}
```

**Acceptance:**
- Renders with lens-specific opening text
- Falls back to default
- Visual polish with icon

---

### Story 2.2: Component Registry Population

**Task:** Register reveal components

**Files:**
- MODIFY: `src/surface/components/MomentRenderer/component-registry.ts`

**Implementation:**
```typescript
import { lazy } from 'react';

const componentMap: Record<string, ComponentType<any>> = {
  SimulationReveal: lazy(() => import('./reveals/SimulationReveal')),
  CustomLensOffer: lazy(() => import('./reveals/CustomLensOffer')),
  EntropyJourneyOffer: lazy(() => import('./reveals/EntropyJourneyOffer')),
};
```

**Acceptance:**
- Components lazy-loaded
- getMomentComponent returns correct components
- Fallback to card rendering if not found

---

## Epic 3: Integration

### Story 3.1: ExploreShell Integration

**Task:** Add MomentOverlay to ExploreShell

**Files:**
- MODIFY: `src/surface/components/KineticStream/ExploreShell.tsx`

**Implementation:**
```typescript
// Add imports
import { useOverlayMoment, useMoments } from '@surface/hooks/useMoments';
import { MomentOverlay } from '../MomentRenderer/MomentOverlay';

// In component
const { activeMoment: overlayMoment, executeAction, dismissMoment } = useMoments({ 
  surface: 'overlay' 
});

// In render
{overlayMoment && (
  <MomentOverlay
    moment={overlayMoment}
    onAction={executeAction}
    onDismiss={dismissMoment}
    activeLens={lens}
  />
)}
```

**Acceptance:**
- Overlay renders when eligible moment exists
- Actions update flags correctly
- Overlay dismisses properly

---

### Story 3.2: KineticWelcome Integration

**Task:** Wire welcome moments to KineticWelcome

**Files:**
- MODIFY: `src/surface/components/KineticStream/KineticWelcome.tsx`
- MODIFY: `src/surface/components/KineticStream/ExploreShell.tsx`

**Implementation:**
```typescript
// In ExploreShell
const { moments: welcomeMoments } = useMoments({ surface: 'welcome' });

// Convert to prompt format
const momentPrompts = welcomeMoments.map(m => ({
  id: m.meta.id,
  text: m.payload.content.heading || m.meta.title,
  isMoment: true,
  moment: m,
}));

// Pass combined prompts to KineticWelcome
```

**Acceptance:**
- Moment prompts appear in welcome
- Clicking moment prompt triggers action
- Priority ordering respected

---

### Story 3.3: Journey Start Wiring

**Task:** Connect startJourney action to engagement machine

**Files:**
- CREATE: `src/surface/hooks/useMomentActions.ts`
- MODIFY: `src/surface/hooks/useMoments.ts`

**Implementation:**
```typescript
// useMomentActions.ts
export function useMomentActions() {
  const { actor } = useEngagement();
  const { startJourney } = useJourneyState({ actor });
  
  const execute = useCallback((action: MomentAction) => {
    switch (action.type) {
      case 'startJourney':
        if (action.journeyId) {
          const journey = getJourneyById(action.journeyId);
          if (journey) {
            startJourney(journey);
          }
        }
        break;
      // Other action types...
    }
  }, [startJourney]);
  
  return { execute };
}
```

**Acceptance:**
- `startJourney` action starts actual journey
- XState machine transitions to journeyActive
- Console logs confirm journey started

---

## Epic 4: Testing

### Story 4.1: E2E Moment Display Tests

**Task:** Add Playwright tests for moment system

**Files:**
- CREATE: `tests/e2e/moments.spec.ts`

**Tests:**
1. Overlay displays when trigger conditions met
2. Actions update flags correctly
3. Toast auto-dismisses
4. Journey starts on action

---

## Build Gate

```bash
npm run build          # Compiles
npm run dev            # Manual verification
npx playwright test    # E2E tests pass
```

---

## Sprint Summary

| Epic | Stories | New Files | Modified Files |
|------|---------|-----------|----------------|
| 1. Surface Components | 3 | 3 | 1 |
| 2. Reveal Components | 2 | 3 | 1 |
| 3. Integration | 3 | 1 | 3 |
| 4. Testing | 1 | 1 | 0 |
| **Total** | **9** | **8** | **5** |
