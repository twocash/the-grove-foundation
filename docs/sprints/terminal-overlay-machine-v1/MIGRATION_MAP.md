# Migration Map: terminal-overlay-machine-v1

## File Change Summary

| File | Action | Lines Changed | Risk |
|------|--------|---------------|------|
| `components/Terminal/types.ts` | Modify | ~60 | Low |
| `components/Terminal/overlay-registry.ts` | Create | ~50 | Low |
| `components/Terminal/TerminalOverlayRenderer.tsx` | Create | ~80 | Low |
| `components/Terminal/overlay-helpers.ts` | Create | ~30 | Low |
| `components/Terminal/useTerminalState.ts` | Modify | ~80 | Medium |
| `components/Terminal/index.ts` | Modify | ~5 | Low |
| `components/Terminal.tsx` | Modify | ~100 | Medium |

## Detailed Changes

### 1. types.ts

**Location:** `components/Terminal/types.ts`

**Add (after FLOW STATES section):**
```typescript
// ============================================================================
// OVERLAY STATE MACHINE
// ============================================================================

/**
 * Terminal overlay state - only one overlay active at a time.
 * Replaces: flowState + showLensPicker + showJourneyPicker + 
 *           showCustomLensWizard + showWelcomeInterstitial
 */
export type TerminalOverlay = 
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string }
  | { type: 'field-picker' };

export type OverlayType = TerminalOverlay['type'];

export const INITIAL_OVERLAY: TerminalOverlay = { type: 'none' };
```

**Remove from TerminalUIState:**
```typescript
// REMOVE these fields:
flowState: TerminalFlowState;
showLensPicker: boolean;
showJourneyPicker: boolean;
showCustomLensWizard: boolean;
showWelcomeInterstitial: boolean;
```

**Add to TerminalUIState:**
```typescript
// ADD this field:
overlay: TerminalOverlay;
```

**Update INITIAL_TERMINAL_UI_STATE:**
```typescript
export const INITIAL_TERMINAL_UI_STATE: TerminalUIState = {
  overlay: INITIAL_OVERLAY,  // Replaces 5 fields
  hasShownWelcome: false,
  // ... rest unchanged
};
```

**Remove from TerminalActions:**
```typescript
// REMOVE these actions:
setFlowState: (state: TerminalFlowState) => void;
showLensPicker: () => void;
hideLensPicker: () => void;
showJourneyPicker: () => void;
hideJourneyPicker: () => void;
showCustomLensWizard: () => void;
hideCustomLensWizard: () => void;
showWelcomeInterstitial: () => void;
hideWelcomeInterstitial: () => void;
```

**Add to TerminalActions:**
```typescript
// ADD these actions:
setOverlay: (overlay: TerminalOverlay) => void;
dismissOverlay: () => void;
```

**Remove TerminalFlowState type:**
```typescript
// REMOVE entire type:
export type TerminalFlowState = 'idle' | 'welcome' | 'selecting' | 'wizard' | 'active';
```

---

### 2. overlay-registry.ts (NEW FILE)

**Location:** `components/Terminal/overlay-registry.ts`

```typescript
// components/Terminal/overlay-registry.ts
// Declarative registry mapping overlay types to components and config
// Sprint: terminal-overlay-machine-v1

import { ComponentType } from 'react';
import { OverlayType } from './types';
import WelcomeInterstitial from './WelcomeInterstitial';
import { LensPicker } from '../../src/explore/LensPicker';
import { JourneyList } from '../../src/explore/JourneyList';
import { CustomLensWizard } from './index';

export interface OverlayConfig {
  /** Component to render for this overlay */
  component: ComponentType<any>;
  
  /** Static props always passed to the component */
  props?: Record<string, unknown>;
  
  /** Whether to hide the CommandInput when this overlay is active */
  hideInput: boolean;
  
  /** Analytics event name emitted when overlay is shown */
  analytics?: string;
}

/**
 * Registry of overlay configurations.
 * Add new overlays here - no other file changes needed.
 */
export const OVERLAY_REGISTRY: Partial<Record<OverlayType, OverlayConfig>> = {
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
  // 'field-picker': Future addition
};
```

---

### 3. TerminalOverlayRenderer.tsx (NEW FILE)

**Location:** `components/Terminal/TerminalOverlayRenderer.tsx`

```typescript
// components/Terminal/TerminalOverlayRenderer.tsx
// Unified overlay renderer using declarative registry
// Sprint: terminal-overlay-machine-v1

import React from 'react';
import { TerminalOverlay } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';

export interface OverlayHandlers {
  onDismiss: () => void;
  onLensSelect: (personaId: string) => void;
  onWelcomeChooseLens: () => void;
  onWizardComplete: (candidate: any, inputs: any) => Promise<void>;
  onWizardCancel: () => void;
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
  const props = getPropsForOverlay(overlay, handlers, config.props);
  
  return <Component {...props} />;
}

function getPropsForOverlay(
  overlay: TerminalOverlay,
  handlers: OverlayHandlers,
  staticProps?: Record<string, unknown>
): Record<string, unknown> {
  const base = { ...staticProps };
  
  switch (overlay.type) {
    case 'welcome':
      return {
        ...base,
        onChooseLens: handlers.onWelcomeChooseLens
      };
    
    case 'lens-picker':
      return {
        ...base,
        onBack: handlers.onDismiss,
        onAfterSelect: handlers.onLensSelect
      };
    
    case 'journey-picker':
      return {
        ...base,
        onBack: handlers.onDismiss
      };
    
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

---

### 4. overlay-helpers.ts (NEW FILE)

**Location:** `components/Terminal/overlay-helpers.ts`

```typescript
// components/Terminal/overlay-helpers.ts
// Derived state helpers for overlay system
// Sprint: terminal-overlay-machine-v1

import { TerminalOverlay } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';

/**
 * Determine if CommandInput should be visible based on overlay state.
 * Returns true if no overlay or overlay doesn't hide input.
 */
export function shouldShowInput(overlay: TerminalOverlay): boolean {
  if (overlay.type === 'none') return true;
  const config = OVERLAY_REGISTRY[overlay.type];
  return !(config?.hideInput ?? false);
}

/**
 * Get analytics event name for an overlay, if configured.
 */
export function getOverlayAnalytics(overlay: TerminalOverlay): string | undefined {
  if (overlay.type === 'none') return undefined;
  return OVERLAY_REGISTRY[overlay.type]?.analytics;
}

/**
 * Check if any overlay is currently active.
 */
export function isOverlayActive(overlay: TerminalOverlay): boolean {
  return overlay.type !== 'none';
}
```

---

### 5. useTerminalState.ts

**Location:** `components/Terminal/useTerminalState.ts`

**Remove useState declarations:**
```typescript
// REMOVE:
const [flowState, setFlowStateInternal] = useState<TerminalFlowState>(initialFlowState);
const [showLensPicker, setShowLensPicker] = useState(false);
const [showJourneyPicker, setShowJourneyPicker] = useState(false);
const [showCustomLensWizard, setShowCustomLensWizard] = useState(false);
const [showWelcomeInterstitial, setShowWelcomeInterstitial] = useState(showWelcome);
```

**Add useState declaration:**
```typescript
// ADD:
const [overlay, setOverlayInternal] = useState<TerminalOverlay>(
  showWelcome ? { type: 'welcome' } : INITIAL_OVERLAY
);
```

**Remove old actions:**
```typescript
// REMOVE: setFlowState, showLensPickerAction, hideLensPicker,
//         showJourneyPickerAction, hideJourneyPicker,
//         showCustomLensWizardAction, hideCustomLensWizard,
//         showWelcomeInterstitialAction, hideWelcomeInterstitial
// (approximately 50 lines of callbacks)
```

**Add new actions:**
```typescript
// ADD:
const setOverlay = useCallback((newOverlay: TerminalOverlay) => {
  setOverlayInternal(newOverlay);
  
  // Analytics (optional)
  const analytics = getOverlayAnalytics(newOverlay);
  if (analytics) {
    // emit analytics event if needed
  }
  
  // Update hasShownWelcome when dismissing welcome
  if (newOverlay.type !== 'welcome') {
    setHasShownWelcome(true);
  }
}, []);

const dismissOverlay = useCallback(() => {
  setOverlayInternal(INITIAL_OVERLAY);
}, []);
```

**Update state memo:**
```typescript
// UPDATE to use overlay instead of 5 booleans
const state: TerminalUIState = useMemo(() => ({
  overlay,  // Replaces 5 fields
  hasShownWelcome,
  // ... rest unchanged
}), [overlay, hasShownWelcome, /* rest */]);
```

**Update actions memo:**
```typescript
// UPDATE to use setOverlay, dismissOverlay
const actions: TerminalActions = useMemo(() => ({
  setOverlay,
  dismissOverlay,
  // ... rest unchanged (bridge, reveals, modals, etc.)
}), [setOverlay, dismissOverlay, /* rest */]);
```

---

### 6. Terminal.tsx

**Location:** `components/Terminal.tsx`

**Update destructuring:**
```typescript
// BEFORE:
const {
  showLensPicker,
  showJourneyPicker,
  showCustomLensWizard,
  showWelcomeInterstitial,
  // ...
} = uiState;

// AFTER:
const { overlay, hasShownWelcome, /* ... */ } = uiState;
```

**Add imports:**
```typescript
import { TerminalOverlayRenderer, OverlayHandlers } from './Terminal/TerminalOverlayRenderer';
import { shouldShowInput } from './Terminal/overlay-helpers';
```

**Create handlers object:**
```typescript
const overlayHandlers: OverlayHandlers = useMemo(() => ({
  onDismiss: () => actions.dismissOverlay(),
  onLensSelect: handleLensSelect,  // existing handler
  onWelcomeChooseLens: () => actions.setOverlay({ type: 'lens-picker' }),
  onWizardComplete: handleCustomLensComplete,  // existing handler
  onWizardCancel: () => actions.dismissOverlay()
}), [actions, handleLensSelect, handleCustomLensComplete]);
```

**Replace ternary cascade (embedded variant ~line 920):**
```tsx
// BEFORE:
{showWelcomeInterstitial ? (
  <WelcomeInterstitial ... />
) : showLensPicker ? (
  <LensPicker ... />
) : showJourneyPicker ? (
  <JourneyList ... />
) : showCustomLensWizard ? (
  <CustomLensWizard ... />
) : (
  <ChatContent />
)}

// AFTER:
{overlay.type !== 'none' ? (
  <TerminalOverlayRenderer 
    overlay={overlay}
    handlers={overlayHandlers}
  />
) : (
  <ChatContent />
)}
```

**Replace input visibility check:**
```tsx
// BEFORE:
{!showCustomLensWizard && !showWelcomeInterstitial && !showLensPicker && !showJourneyPicker && (
  <CommandInput ... />
)}

// AFTER:
{shouldShowInput(overlay) && (
  <CommandInput ... />
)}
```

**Update action calls:**
```typescript
// BEFORE:
onLensClick={() => actions.showLensPicker()}
onJourneyClick={() => actions.showJourneyPicker()}

// AFTER:
onLensClick={() => actions.setOverlay({ type: 'lens-picker' })}
onJourneyClick={() => actions.setOverlay({ type: 'journey-picker' })}
```

---

### 7. index.ts

**Location:** `components/Terminal/index.ts`

**Add exports:**
```typescript
export { TerminalOverlayRenderer } from './TerminalOverlayRenderer';
export { OVERLAY_REGISTRY } from './overlay-registry';
export { shouldShowInput, isOverlayActive, getOverlayAnalytics } from './overlay-helpers';
export type { TerminalOverlay, OverlayType } from './types';
```

---

## Verification Checklist

After migration:

- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Terminal opens correctly (no overlay by default)
- [ ] Click Lens pill → LensPicker appears, input hidden
- [ ] Click Journey pill → JourneyList appears, input hidden
- [ ] Select lens → returns to chat, input visible
- [ ] Welcome flow works for new users
- [ ] Custom Lens wizard opens and completes
- [ ] No console errors or warnings
- [ ] Visual appearance unchanged
