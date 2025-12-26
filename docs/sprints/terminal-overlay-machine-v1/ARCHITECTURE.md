# Architecture: terminal-overlay-machine-v1

## Design Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CURRENT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌────────────────────────────────────────────┐ │
│  │   TerminalUI     │    │         Boolean Flags (types.ts)           │ │
│  │     State        │    │  showLensPicker: boolean                   │ │
│  │                  │    │  showJourneyPicker: boolean                │ │
│  │  flowState ──────┼────│  showCustomLensWizard: boolean             │ │
│  │  (enum)          │    │  showWelcomeInterstitial: boolean          │ │
│  └──────────────────┘    └────────────────────────────────────────────┘ │
│           │                              │                               │
│           ▼                              ▼                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Manual Sync in setFlowState()                  │   │
│  │    switch(state) { case 'selecting': setShowLensPicker(true) }   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Terminal.tsx Ternary Cascade                  │   │
│  │  {showWelcome ? <A/> : showLens ? <B/> : showJourney ? <C/> ...} │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ REFACTOR TO ↓

┌─────────────────────────────────────────────────────────────────────────┐
│                          TARGET ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              TerminalOverlay (Discriminated Union)                │   │
│  │                                                                    │   │
│  │   | { type: 'none' }                                              │   │
│  │   | { type: 'welcome' }                                           │   │
│  │   | { type: 'lens-picker' }                                       │   │
│  │   | { type: 'journey-picker' }                                    │   │
│  │   | { type: 'wizard', wizardId?: string }                         │   │
│  │                                                                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│         ┌────────────────────┼───────────────────────┐                  │
│         ▼                    ▼                       ▼                  │
│  ┌─────────────┐   ┌──────────────────┐   ┌────────────────────────┐   │
│  │ setOverlay  │   │  OVERLAY_REGISTRY │   │ Derived: shouldShow   │   │
│  │  (action)   │   │   (config)        │   │   Input, analytics    │   │
│  └─────────────┘   └──────────────────┘   └────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  TerminalOverlayRenderer                          │   │
│  │   const config = OVERLAY_REGISTRY[overlay.type];                 │   │
│  │   return config ? <config.component {...} /> : null;             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Type Definitions

### TerminalOverlay (New)

```typescript
// components/Terminal/types.ts

/**
 * Terminal overlay state machine.
 * Only one overlay can be active at a time (enforced by discriminated union).
 */
export type TerminalOverlay = 
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string }
  | { type: 'field-picker' };  // Placeholder for future

export const INITIAL_OVERLAY: TerminalOverlay = { type: 'none' };

// Helper type for registry keys
export type OverlayType = TerminalOverlay['type'];
```

### OverlayConfig (New)

```typescript
// components/Terminal/overlay-registry.ts

import { ComponentType } from 'react';

export interface OverlayConfig {
  /** Component to render */
  component: ComponentType<any>;
  
  /** Static props passed to component */
  props?: Record<string, unknown>;
  
  /** Whether to hide CommandInput when this overlay is active */
  hideInput: boolean;
  
  /** Analytics event name for when overlay is shown */
  analytics?: string;
}

export const OVERLAY_REGISTRY: Partial<Record<OverlayType, OverlayConfig>> = {
  // 'none' has no config (renders null)
  'welcome': {
    component: WelcomeInterstitial,
    hideInput: true,
    analytics: 'terminal_welcome_shown'
  },
  'lens-picker': {
    component: LensPicker,
    props: { mode: 'compact' },
    hideInput: true,
    analytics: 'terminal_lens_picker_opened'
  },
  'journey-picker': {
    component: JourneyList,
    props: { mode: 'compact' },
    hideInput: true,
    analytics: 'terminal_journey_picker_opened'
  },
  'wizard': {
    component: CustomLensWizard,
    hideInput: true,
    analytics: 'terminal_wizard_started'
  }
};
```

### TerminalUIState (Updated)

```typescript
// components/Terminal/types.ts

export interface TerminalUIState {
  // REPLACED: flowState, showLensPicker, showJourneyPicker, 
  //           showCustomLensWizard, showWelcomeInterstitial
  overlay: TerminalOverlay;
  
  // KEPT: Not overlay-related
  hasShownWelcome: boolean;
  bridgeState: BridgeState;
  reveals: RevealStates;
  modals: ModalStates;
  input: string;
  isVerboseMode: boolean;
  dynamicSuggestion: string;
  currentTopic: string;
  currentNodeId: string | null;
  completedJourneyTitle: string | null;
  journeyStartTime: number;
}
```

### TerminalActions (Updated)

```typescript
// components/Terminal/types.ts

export interface TerminalActions {
  // REPLACED: showLensPicker, hideLensPicker, showJourneyPicker, 
  //           hideJourneyPicker, showCustomLensWizard, hideCustomLensWizard,
  //           showWelcomeInterstitial, hideWelcomeInterstitial, setFlowState
  setOverlay: (overlay: TerminalOverlay) => void;
  dismissOverlay: () => void;
  
  // KEPT: All other actions unchanged
  setBridgeState: (state: BridgeState) => void;
  dismissBridge: () => void;
  setReveal: (reveal: keyof RevealStates, visible: boolean) => void;
  // ...
}
```

## Component Design

### TerminalOverlayRenderer

```tsx
// components/Terminal/TerminalOverlayRenderer.tsx

import { TerminalOverlay, OverlayType } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';

interface OverlayHandlers {
  onDismiss: () => void;
  onLensSelect: (personaId: string) => void;
  onJourneySelect: (journeyId: string) => void;
  onWizardComplete: (candidate: any, inputs: any) => Promise<void>;
  onWizardCancel: () => void;
  onWelcomeChooseLens: () => void;
}

interface Props {
  overlay: TerminalOverlay;
  handlers: OverlayHandlers;
}

export function TerminalOverlayRenderer({ overlay, handlers }: Props) {
  if (overlay.type === 'none') return null;
  
  const config = OVERLAY_REGISTRY[overlay.type];
  if (!config) return null;
  
  const Component = config.component;
  
  // Map handlers based on overlay type
  const overlayProps = getPropsForOverlay(overlay, handlers, config.props);
  
  return <Component {...overlayProps} />;
}

function getPropsForOverlay(
  overlay: TerminalOverlay,
  handlers: OverlayHandlers,
  staticProps?: Record<string, unknown>
): Record<string, unknown> {
  const base = { ...staticProps };
  
  switch (overlay.type) {
    case 'welcome':
      return { ...base, onChooseLens: handlers.onWelcomeChooseLens };
    
    case 'lens-picker':
      return { 
        ...base, 
        onBack: handlers.onDismiss,
        onAfterSelect: handlers.onLensSelect 
      };
    
    case 'journey-picker':
      return { ...base, onBack: handlers.onDismiss };
    
    case 'wizard':
      return {
        ...base,
        onComplete: handlers.onWizardComplete,
        onCancel: handlers.onWizardCancel
      };
    
    default:
      return base;
  }
}
```

### Derived State Helper

```typescript
// components/Terminal/overlay-helpers.ts

import { TerminalOverlay } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';

/**
 * Determine if CommandInput should be visible
 */
export function shouldShowInput(overlay: TerminalOverlay): boolean {
  if (overlay.type === 'none') return true;
  return !(OVERLAY_REGISTRY[overlay.type]?.hideInput ?? false);
}

/**
 * Get analytics event name for overlay transition
 */
export function getOverlayAnalytics(overlay: TerminalOverlay): string | undefined {
  if (overlay.type === 'none') return undefined;
  return OVERLAY_REGISTRY[overlay.type]?.analytics;
}
```

## DEX Compliance

### Declarative Sovereignty

- **Config-driven:** `OVERLAY_REGISTRY` defines behavior without code changes
- **Non-engineer modifiable:** Adding `hideInput: false` or changing `analytics` requires no code
- **Domain logic separated:** Component choice is configuration, not hardcoded switches

### Capability Agnosticism

- **Model-independent:** Overlay state is pure UI; works with any AI backend
- **No capability assumptions:** Same pattern works whether using GPT-4 or local model

### Provenance

- **Transition tracking:** Every `setOverlay` call can log via `analytics` config
- **State audit trail:** Single state variable makes history clear

### Organic Scalability

- **Easy extension:** New overlay = type + registry entry
- **No restructuring:** Same architecture handles 4 or 40 overlays
- **Sensible defaults:** `hideInput: false` is default if not specified

## Migration Strategy

### Phase 1: Add New Infrastructure (Additive)

1. Add `TerminalOverlay` type alongside existing
2. Add `overlay` state alongside existing booleans
3. Create `OVERLAY_REGISTRY` and `TerminalOverlayRenderer`
4. Create `setOverlay` action alongside existing actions

### Phase 2: Dual-Write (Bridge)

1. Modify existing actions to also set `overlay`:
   ```typescript
   const showLensPickerAction = () => {
     setShowLensPicker(true);      // Legacy
     setOverlay({ type: 'lens-picker' }); // New
   };
   ```
2. Terminal.tsx uses new renderer but legacy state still works

### Phase 3: Migrate Consumers (Convert)

1. Update all call sites to use `setOverlay`
2. Remove legacy boolean reads from Terminal.tsx
3. Remove legacy booleans from state

### Phase 4: Cleanup (Remove)

1. Remove legacy actions from `TerminalActions`
2. Remove legacy booleans from `TerminalUIState`
3. Remove `flowState` (now redundant)
4. Remove dual-write logic

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `types.ts` | Modify | Add TerminalOverlay, update TerminalUIState, update TerminalActions |
| `overlay-registry.ts` | Create | OVERLAY_REGISTRY config |
| `TerminalOverlayRenderer.tsx` | Create | Renderer component |
| `overlay-helpers.ts` | Create | shouldShowInput, getOverlayAnalytics |
| `useTerminalState.ts` | Modify | Add overlay state + setOverlay action |
| `Terminal.tsx` | Modify | Use TerminalOverlayRenderer, derived input visibility |
| `index.ts` | Modify | Export new components |
