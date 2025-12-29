# EXECUTION_PROMPT.md — moment-ui-integration-v1

**Sprint:** moment-ui-integration-v1
**Generated:** 2024-12-29
**Target:** Claude Code CLI

---

## Context

You are continuing development on The Grove AI Foundation project. The previous sprint (`engagement-orchestrator-v1`, commit c1df11b) created a declarative moment system with:

- Moment schema following GroveObject pattern (meta.id, payload.trigger, etc.)
- 5 moment JSON files in `src/data/moments/`
- Trigger evaluator in `src/core/engagement/moment-evaluator.ts`
- useMoments hook in `src/surface/hooks/useMoments.ts`
- MomentCard component in `src/surface/components/MomentRenderer/`
- XState machine with flags and cooldowns

**This sprint wires the moment system to actual UI surfaces.**

---

## Repository

```
C:\GitHub\the-grove-foundation
```

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation
npm run build
# Verify previous sprint files exist
ls src/data/moments/
ls src/surface/hooks/useMoments.ts
ls src/surface/components/MomentRenderer/
```

---

## Critical Schema Pattern

**ALWAYS access moment data via `meta` and `payload`:**

```typescript
// ✅ CORRECT
moment.meta.id
moment.meta.title
moment.payload.trigger
moment.payload.surface
moment.payload.actions

// ❌ WRONG - These don't exist
moment.id
moment.trigger
moment.surface
```

---

## Epic 1: Surface Components

### Task 1.1: Create MomentOverlay.tsx

**File:** `src/surface/components/MomentRenderer/MomentOverlay.tsx`

```typescript
// src/surface/components/MomentRenderer/MomentOverlay.tsx
// Overlay component for modal moments
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';
import { MomentCard } from './MomentCard';
import { GlassContainer } from '../KineticStream/Stream/motion/GlassContainer';

export interface MomentOverlayProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  activeLens?: string | null;
}

export function MomentOverlay({ 
  moment, 
  onAction, 
  onDismiss, 
  activeLens 
}: MomentOverlayProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDismiss(moment.meta.id);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 max-w-lg w-full animate-in fade-in zoom-in-95 duration-200">
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

export default MomentOverlay;
```

### Task 1.2: Create MomentToast.tsx

**File:** `src/surface/components/MomentRenderer/MomentToast.tsx`

```typescript
// src/surface/components/MomentRenderer/MomentToast.tsx
// Toast component for transient moment notifications
// Sprint: moment-ui-integration-v1

import React, { useEffect } from 'react';
import type { Moment } from '@core/schema/moment';
import { GlassContainer } from '../KineticStream/Stream/motion/GlassContainer';

export interface MomentToastProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  autoHideDuration?: number;
}

export function MomentToast({ 
  moment, 
  onAction, 
  onDismiss,
  autoHideDuration = 5000
}: MomentToastProps) {
  const { content, actions } = moment.payload;

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss(moment.meta.id);
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [moment.meta.id, autoHideDuration, onDismiss]);

  const primaryAction = actions.find(a => a.variant === 'primary') || actions[0];

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-sm animate-in slide-in-from-right duration-300">
      <GlassContainer intensity="default" className="p-4">
        <div className="flex items-start gap-3">
          {content.icon && (
            <span className="text-xl flex-shrink-0">{content.icon}</span>
          )}
          <div className="flex-1 min-w-0">
            {content.heading && (
              <p className="font-medium text-[var(--glass-text-primary)] text-sm">
                {content.heading}
              </p>
            )}
            {content.body && (
              <p className="text-[var(--glass-text-subtle)] text-xs mt-1 line-clamp-2">
                {content.body}
              </p>
            )}
          </div>
          {primaryAction && (
            <button
              onClick={() => onAction(moment.meta.id, primaryAction.id)}
              className="text-[var(--neon-cyan)] text-sm hover:underline flex-shrink-0"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </GlassContainer>
    </div>
  );
}

export default MomentToast;
```

### Task 1.3: Create MomentInline.tsx

**File:** `src/surface/components/MomentRenderer/MomentInline.tsx`

```typescript
// src/surface/components/MomentRenderer/MomentInline.tsx
// Inline component for in-stream moment cards
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';
import { MomentCard } from './MomentCard';
import { GlassContainer } from '../KineticStream/Stream/motion/GlassContainer';

export interface MomentInlineProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  activeLens?: string | null;
}

export function MomentInline({ 
  moment, 
  onAction, 
  onDismiss, 
  activeLens 
}: MomentInlineProps) {
  return (
    <div className="moment-inline my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <GlassContainer intensity="subtle" className="p-4">
        <MomentCard 
          moment={moment} 
          onAction={onAction} 
          onDismiss={onDismiss}
          activeLens={activeLens}
        />
      </GlassContainer>
    </div>
  );
}

export default MomentInline;
```

---

## Epic 2: Reveal Components

### Task 2.1: Create SimulationReveal.tsx

**File:** `src/surface/components/MomentRenderer/reveals/SimulationReveal.tsx`

```typescript
// src/surface/components/MomentRenderer/reveals/SimulationReveal.tsx
// Simulation reveal content component
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';

export interface SimulationRevealProps {
  moment: Moment;
  opening?: string;
}

export function SimulationReveal({ moment, opening }: SimulationRevealProps) {
  const defaultOpening = "This terminal is proof that distributed AI works.";
  const content = moment.payload.content;
  
  return (
    <div className="simulation-reveal space-y-4">
      <div className="text-4xl">✨</div>
      <h3 className="font-display text-xl text-[var(--glass-text-primary)]">
        {content.heading || "You're Already Inside"}
      </h3>
      <p className="text-[var(--glass-text-body)] leading-relaxed">
        {opening || defaultOpening}
      </p>
      <div className="pt-2 text-sm text-[var(--glass-text-subtle)]">
        <p>The architecture you've been exploring?</p>
        <p className="font-medium text-[var(--neon-cyan)]">You're running on it.</p>
      </div>
    </div>
  );
}

export default SimulationReveal;
```

### Task 2.2: Create placeholder reveals

**File:** `src/surface/components/MomentRenderer/reveals/CustomLensOffer.tsx`

```typescript
// src/surface/components/MomentRenderer/reveals/CustomLensOffer.tsx
import React from 'react';
import type { Moment } from '@core/schema/moment';

export interface CustomLensOfferProps {
  moment: Moment;
}

export function CustomLensOffer({ moment }: CustomLensOfferProps) {
  const content = moment.payload.content;
  return (
    <div className="custom-lens-offer space-y-3">
      <div className="text-3xl">🎭</div>
      <h3 className="font-display text-lg text-[var(--glass-text-primary)]">
        {content.heading || "Create Your Lens"}
      </h3>
      <p className="text-[var(--glass-text-body)]">
        {content.body || "Build a personalized lens that matches your perspective."}
      </p>
    </div>
  );
}

export default CustomLensOffer;
```

**File:** `src/surface/components/MomentRenderer/reveals/EntropyJourneyOffer.tsx`

```typescript
// src/surface/components/MomentRenderer/reveals/EntropyJourneyOffer.tsx
import React from 'react';
import type { Moment } from '@core/schema/moment';

export interface EntropyJourneyOfferProps {
  moment: Moment;
}

export function EntropyJourneyOffer({ moment }: EntropyJourneyOfferProps) {
  const content = moment.payload.content;
  return (
    <div className="entropy-journey-offer space-y-3">
      <div className="text-3xl">🧭</div>
      <h3 className="font-display text-lg text-[var(--glass-text-primary)]">
        {content.heading || "Take a Guided Journey"}
      </h3>
      <p className="text-[var(--glass-text-body)]">
        {content.body || "Your exploration is getting complex. Want a structured path?"}
      </p>
    </div>
  );
}

export default EntropyJourneyOffer;
```

### Task 2.3: Create reveals index

**File:** `src/surface/components/MomentRenderer/reveals/index.ts`

```typescript
// src/surface/components/MomentRenderer/reveals/index.ts
export { SimulationReveal } from './SimulationReveal';
export { CustomLensOffer } from './CustomLensOffer';
export { EntropyJourneyOffer } from './EntropyJourneyOffer';
```

### Task 2.4: Update component-registry.ts

**File:** `src/surface/components/MomentRenderer/component-registry.ts`

Replace the placeholder content with actual imports:

```typescript
// src/surface/components/MomentRenderer/component-registry.ts
// Lazy Component Registry for Moment Rendering
// Sprint: moment-ui-integration-v1

import { lazy, ComponentType } from 'react';

// =============================================================================
// Component Map
// =============================================================================

const componentMap: Record<string, ComponentType<any>> = {
  SimulationReveal: lazy(() => import('./reveals/SimulationReveal')),
  CustomLensOffer: lazy(() => import('./reveals/CustomLensOffer')),
  EntropyJourneyOffer: lazy(() => import('./reveals/EntropyJourneyOffer')),
};

// =============================================================================
// Registry Functions
// =============================================================================

export function getMomentComponent(key: string): ComponentType<any> | null {
  return componentMap[key] ?? null;
}

export function registerMomentComponent(key: string, component: ComponentType<any>): void {
  componentMap[key] = component;
}

export function hasMomentComponent(key: string): boolean {
  return key in componentMap;
}

export function getRegisteredComponents(): string[] {
  return Object.keys(componentMap);
}
```

### Task 2.5: Update MomentRenderer index.ts

**File:** `src/surface/components/MomentRenderer/index.ts`

```typescript
// src/surface/components/MomentRenderer/index.ts
export { MomentCard } from './MomentCard';
export { MomentOverlay } from './MomentOverlay';
export { MomentToast } from './MomentToast';
export { MomentInline } from './MomentInline';
export { getMomentComponent, registerMomentComponent, hasMomentComponent } from './component-registry';
```

---

## Epic 3: Integration

### Task 3.1: Create useMomentActions.ts

**File:** `src/surface/hooks/useMomentActions.ts`

```typescript
// src/surface/hooks/useMomentActions.ts
// Action execution hook with journey/lens wiring
// Sprint: moment-ui-integration-v1

import { useCallback } from 'react';
import type { MomentAction } from '@core/schema/moment';
import { useEngagement, useJourneyState, useLensState } from '@core/engagement';
import { getJourneyById } from '../../data/journeys';

export function useMomentActions() {
  const { actor } = useEngagement();
  const { startJourney } = useJourneyState({ actor });
  const { selectLens } = useLensState({ actor });

  const executeAction = useCallback((action: MomentAction): boolean => {
    console.log('[MomentActions] Executing action:', action.type, action);

    switch (action.type) {
      case 'startJourney':
        if (action.journeyId) {
          const journey = getJourneyById(action.journeyId);
          if (journey) {
            startJourney(journey);
            console.log('[MomentActions] Started journey:', journey.id);
            return true;
          }
          console.warn('[MomentActions] Journey not found:', action.journeyId);
        }
        break;

      case 'selectLens':
        if (action.lensId) {
          selectLens(action.lensId);
          console.log('[MomentActions] Selected lens:', action.lensId);
          return true;
        }
        break;

      case 'navigate':
        if (action.target) {
          // Use router or window.location
          window.location.href = action.target;
          return true;
        }
        break;

      case 'emit':
        if (action.event) {
          // Emit custom event - future implementation
          console.log('[MomentActions] Would emit:', action.event, action.eventPayload);
          return true;
        }
        break;

      case 'accept':
      case 'dismiss':
        // These are handled by useMoments
        return true;

      default:
        console.warn('[MomentActions] Unknown action type:', action.type);
    }

    return false;
  }, [startJourney, selectLens]);

  return { executeAction };
}
```

### Task 3.2: Update useMoments.ts

**File:** `src/surface/hooks/useMoments.ts`

Add import and wire action execution:

**At the top, add import:**
```typescript
import { useMomentActions } from './useMomentActions';
```

**Inside useMoments function, add:**
```typescript
const { executeAction: executeMomentAction } = useMomentActions();
```

**Update executeAction callback to include action execution:**
```typescript
// Execute action handler
const executeAction = useCallback((momentId: string, actionId: string): MomentAction | undefined => {
  const moment = allMoments.find(m => m.meta.id === momentId);
  const action = moment?.payload.actions.find(a => a.id === actionId);

  if (!moment || !action) {
    console.warn('[Moments] Action not found:', momentId, actionId);
    return undefined;
  }

  // Execute the action type-specific behavior
  executeMomentAction(action);

  // Apply flag side effects via XState
  if (action.setFlags) {
    Object.entries(action.setFlags).forEach(([key, value]) => {
      actor.send({ type: 'SET_FLAG', key, value: value as boolean });
    });
  }

  // Mark once moments as shown
  if (moment.payload.once) {
    actor.send({ type: 'SET_FLAG', key: `moment_${moment.meta.id}_shown`, value: true });
  }

  // Update cooldown
  if (moment.payload.cooldown) {
    actor.send({ type: 'SET_COOLDOWN', momentId: moment.meta.id, timestamp: Date.now() });
  }

  // Emit telemetry
  emit.momentActioned(momentId, actionId, action.type);

  return action;
}, [allMoments, actor, emit, executeMomentAction]);
```

### Task 3.3: Update ExploreShell.tsx

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Add imports at top:**
```typescript
import { useMoments } from '@surface/hooks/useMoments';
import { MomentOverlay } from '../MomentRenderer';
```

**Add moment hook usage inside component:**
```typescript
// Moment system
const { 
  activeMoment: overlayMoment, 
  executeAction: executeOverlayAction, 
  dismissMoment: dismissOverlay 
} = useMoments({ surface: 'overlay' });
```

**Add overlay rendering before closing div (but after LensPicker overlay):**
```typescript
{/* Moment Overlay */}
{overlayMoment && (
  <MomentOverlay
    moment={overlayMoment}
    onAction={executeOverlayAction}
    onDismiss={dismissOverlay}
    activeLens={lens}
  />
)}
```

---

## Verification Commands

After each epic, run:

```bash
npm run build
# Should compile without errors
```

After all epics:

```bash
npm run dev
# Navigate to /terminal
# Complete a journey to trigger simulation-reveal moment
# Verify overlay appears
```

---

## Troubleshooting

### Import Path Errors

If you see errors about `@surface` or `@core` paths:
- Check `tsconfig.json` has path aliases configured
- Verify `vite.config.ts` has corresponding resolve aliases

### GlassContainer Import

If GlassContainer import fails, it's located at:
```
src/surface/components/KineticStream/Stream/motion/GlassContainer.tsx
```

Use relative import if alias doesn't work:
```typescript
import { GlassContainer } from '../KineticStream/Stream/motion/GlassContainer';
```

### Journey Not Found

If startJourney action fails:
- Check journey ID matches one in `src/data/journeys/index.ts`
- Verify `getJourneyById` is imported correctly

---

## Commit Message

After completing all tasks:

```
feat(moments): wire moment system to UI surfaces

- Add MomentOverlay, MomentToast, MomentInline components
- Create reveal components (SimulationReveal, CustomLensOffer, EntropyJourneyOffer)
- Wire component registry with lazy imports
- Add useMomentActions hook for journey/lens actions
- Integrate overlay moments into ExploreShell

Sprint: moment-ui-integration-v1
```

---

## Files Summary

### New Files (9)
1. `src/surface/components/MomentRenderer/MomentOverlay.tsx`
2. `src/surface/components/MomentRenderer/MomentToast.tsx`
3. `src/surface/components/MomentRenderer/MomentInline.tsx`
4. `src/surface/components/MomentRenderer/reveals/SimulationReveal.tsx`
5. `src/surface/components/MomentRenderer/reveals/CustomLensOffer.tsx`
6. `src/surface/components/MomentRenderer/reveals/EntropyJourneyOffer.tsx`
7. `src/surface/components/MomentRenderer/reveals/index.ts`
8. `src/surface/hooks/useMomentActions.ts`

### Modified Files (4)
1. `src/surface/components/MomentRenderer/component-registry.ts`
2. `src/surface/components/MomentRenderer/index.ts`
3. `src/surface/hooks/useMoments.ts`
4. `src/surface/components/KineticStream/ExploreShell.tsx`
