# Execution Prompt: terminal-overlay-machine-v1

## Context

You are an execution agent implementing a refactor of Terminal's overlay state management. The goal is to convert imperative boolean flags into a declarative state machine with registry-based component rendering.

**Read these documents before starting:**
1. `docs/sprints/terminal-overlay-machine-v1/INDEX.md` — Overview
2. `docs/sprints/terminal-overlay-machine-v1/ARCHITECTURE.md` — Technical design
3. `docs/sprints/terminal-overlay-machine-v1/MIGRATION_MAP.md` — Detailed file changes
4. `docs/sprints/terminal-overlay-machine-v1/SPRINTS.md` — Epic breakdown

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation

# 1. Verify build works before changes
npm run build

# 2. Check current Terminal state
cat components/Terminal/types.ts | head -150
cat components/Terminal/useTerminalState.ts | head -100
```

---

## Execution Steps

### Epic 1: Type Foundation (Stories 1.1-1.3)

#### Step 1: Add TerminalOverlay type to types.ts

Open `components/Terminal/types.ts` and add after the FLOW STATES section:

```typescript
// ============================================================================
// OVERLAY STATE MACHINE
// ============================================================================

/**
 * Terminal overlay state - only one overlay active at a time.
 * Discriminated union enforces mutual exclusivity.
 * 
 * Sprint: terminal-overlay-machine-v1
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

#### Step 2: Create overlay-registry.ts

Create new file `components/Terminal/overlay-registry.ts`:

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
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  hideInput: boolean;
  analytics?: string;
}

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
};
```

#### Step 3: Create overlay-helpers.ts

Create new file `components/Terminal/overlay-helpers.ts`:

```typescript
// components/Terminal/overlay-helpers.ts
// Derived state helpers for overlay system
// Sprint: terminal-overlay-machine-v1

import { TerminalOverlay } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';

export function shouldShowInput(overlay: TerminalOverlay): boolean {
  if (overlay.type === 'none') return true;
  return !(OVERLAY_REGISTRY[overlay.type]?.hideInput ?? false);
}

export function isOverlayActive(overlay: TerminalOverlay): boolean {
  return overlay.type !== 'none';
}

export function getOverlayAnalytics(overlay: TerminalOverlay): string | undefined {
  if (overlay.type === 'none') return undefined;
  return OVERLAY_REGISTRY[overlay.type]?.analytics;
}
```

#### Build Gate 1

```bash
npm run build  # Should pass - additive changes only
```

---

### Epic 2: Renderer Component (Stories 2.1-2.2)

#### Step 4: Create TerminalOverlayRenderer.tsx

Create new file `components/Terminal/TerminalOverlayRenderer.tsx`:

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
      return { ...base, onChooseLens: handlers.onWelcomeChooseLens };
    case 'lens-picker':
      return { ...base, onBack: handlers.onDismiss, onAfterSelect: handlers.onLensSelect };
    case 'journey-picker':
      return { ...base, onBack: handlers.onDismiss };
    case 'wizard':
      return { ...base, onComplete: handlers.onWizardComplete, onCancel: handlers.onWizardCancel };
    default:
      return base;
  }
}
```

#### Step 5: Update index.ts exports

Add to `components/Terminal/index.ts`:

```typescript
// Overlay system (Sprint: terminal-overlay-machine-v1)
export { TerminalOverlayRenderer } from './TerminalOverlayRenderer';
export type { OverlayHandlers } from './TerminalOverlayRenderer';
export { OVERLAY_REGISTRY } from './overlay-registry';
export { shouldShowInput, isOverlayActive, getOverlayAnalytics } from './overlay-helpers';
export type { TerminalOverlay, OverlayType } from './types';
```

#### Build Gate 2

```bash
npm run build  # Should pass
```

---

### Epic 3: State Migration (Stories 3.1-3.3)

#### Step 6: Add overlay state to useTerminalState.ts

In `components/Terminal/useTerminalState.ts`:

**Add import:**
```typescript
import { TerminalOverlay, INITIAL_OVERLAY } from './types';
import { getOverlayAnalytics } from './overlay-helpers';
```

**Add useState (after existing flow states):**
```typescript
// Overlay state machine (replaces boolean flags)
const [overlay, setOverlayInternal] = useState<TerminalOverlay>(
  showWelcome ? { type: 'welcome' } : INITIAL_OVERLAY
);
```

**Add actions:**
```typescript
const setOverlay = useCallback((newOverlay: TerminalOverlay) => {
  setOverlayInternal(newOverlay);
  
  // Dual-write to legacy booleans during migration
  setShowLensPicker(newOverlay.type === 'lens-picker');
  setShowJourneyPicker(newOverlay.type === 'journey-picker');
  setShowCustomLensWizard(newOverlay.type === 'wizard');
  setShowWelcomeInterstitial(newOverlay.type === 'welcome');
  
  // Update hasShownWelcome when leaving welcome
  if (newOverlay.type !== 'welcome' && newOverlay.type !== 'none') {
    setHasShownWelcome(true);
  }
}, []);

const dismissOverlay = useCallback(() => {
  setOverlayInternal(INITIAL_OVERLAY);
  setShowLensPicker(false);
  setShowJourneyPicker(false);
  setShowCustomLensWizard(false);
  setShowWelcomeInterstitial(false);
}, []);
```

**Update state memo to include overlay:**
```typescript
overlay,  // Add to the useMemo dependencies and return object
```

**Update actions memo to include new actions:**
```typescript
setOverlay,
dismissOverlay,
```

#### Step 7: Update Terminal.tsx

**Add imports:**
```typescript
import { TerminalOverlayRenderer, OverlayHandlers } from './Terminal/TerminalOverlayRenderer';
import { shouldShowInput } from './Terminal/overlay-helpers';
```

**Get overlay from state:**
```typescript
const { overlay, /* existing destructuring */ } = uiState;
```

**Create handlers (inside component, with useMemo):**
```typescript
const overlayHandlers: OverlayHandlers = useMemo(() => ({
  onDismiss: () => actions.dismissOverlay(),
  onLensSelect: (personaId: string) => {
    localStorage.setItem('grove-terminal-welcomed', 'true');
    localStorage.setItem('grove-session-established', 'true');
    trackLensActivated(personaId, personaId.startsWith('custom-'));
    emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
    emit.journeyStarted(personaId, currentThread.length || 5);
    if (personaId.startsWith('custom-')) {
      updateCustomLensUsage(personaId);
    }
    if (onLensSelected) {
      onLensSelected(personaId);
    }
    actions.dismissOverlay();
  },
  onWelcomeChooseLens: () => actions.setOverlay({ type: 'lens-picker' }),
  onWizardComplete: handleCustomLensComplete,
  onWizardCancel: () => actions.dismissOverlay()
}), [actions, emit, currentArchetypeId, currentThread.length, onLensSelected, handleCustomLensComplete]);
```

**Replace ternary cascade (find the section with showWelcomeInterstitial ternary):**

Replace:
```tsx
{showWelcomeInterstitial ? (
  <WelcomeInterstitial ... />
) : showLensPicker ? (
  <LensPicker ... />
) : showJourneyPicker ? (
  <JourneyList ... />
) : (
  /* chat content */
)}
```

With:
```tsx
{overlay.type !== 'none' ? (
  <TerminalOverlayRenderer overlay={overlay} handlers={overlayHandlers} />
) : (
  /* chat content - unchanged */
)}
```

**Replace input visibility (find the CommandInput section):**

Replace:
```tsx
{!showCustomLensWizard && !showWelcomeInterstitial && !showLensPicker && !showJourneyPicker && (
```

With:
```tsx
{shouldShowInput(overlay) && (
```

**Update header click handlers:**
```typescript
onLensClick={() => actions.setOverlay({ type: 'lens-picker' })}
onJourneyClick={() => actions.setOverlay({ type: 'journey-picker' })}
```

#### Build Gate 3

```bash
npm run build
```

**Manual Test:**
1. Open Terminal → Welcome should appear
2. Click lens pill → LensPicker appears
3. Select lens → Chat returns
4. Click journey pill → JourneyList appears

---

### Epic 4: Cleanup (Stories 4.1-4.3)

#### Step 8: Remove dual-write from setOverlay

In `useTerminalState.ts`, simplify setOverlay:

```typescript
const setOverlay = useCallback((newOverlay: TerminalOverlay) => {
  setOverlayInternal(newOverlay);
  if (newOverlay.type !== 'welcome' && newOverlay.type !== 'none') {
    setHasShownWelcome(true);
  }
}, []);

const dismissOverlay = useCallback(() => {
  setOverlayInternal(INITIAL_OVERLAY);
}, []);
```

#### Step 9: Remove legacy state from useTerminalState.ts

**Remove useState declarations:**
- `flowState` / `setFlowStateInternal`
- `showLensPicker` / `setShowLensPicker`
- `showJourneyPicker` / `setShowJourneyPicker`
- `showCustomLensWizard` / `setShowCustomLensWizard`
- `showWelcomeInterstitial` / `setShowWelcomeInterstitial`

**Remove legacy actions:**
- `setFlowState`
- `showLensPickerAction` / `hideLensPicker`
- `showJourneyPickerAction` / `hideJourneyPicker`
- `showCustomLensWizardAction` / `hideCustomLensWizard`
- `showWelcomeInterstitialAction` / `hideWelcomeInterstitial`

**Update state and actions memos** to remove legacy fields.

#### Step 10: Remove legacy types from types.ts

**Remove:**
- `TerminalFlowState` type
- Boolean fields from `TerminalUIState`
- Legacy actions from `TerminalActions`
- Update `INITIAL_TERMINAL_UI_STATE`

#### Final Build Gate

```bash
npm run build
npm test  # If tests exist
```

---

## Post-Execution Verification

### Functional Tests

```bash
# Start dev server
npm run dev
```

1. **New user flow:** Clear localStorage, open Terminal → Welcome → Choose Lens → Chat
2. **Lens switching:** Click lens pill → Select → Returns to chat
3. **Journey switching:** Click journey pill → Select → Returns to chat
4. **Custom wizard:** Trigger → Complete → Returns with new lens
5. **Input visibility:** Verify input hides during overlays, shows in chat

### Check for Errors

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check browser console for runtime errors
```

---

## Troubleshooting

### Build Error: Cannot find module './overlay-registry'

**Cause:** Circular import between overlay-registry.ts and index.ts

**Fix:** Import CustomLensWizard directly:
```typescript
import CustomLensWizard from './CustomLensWizard';
```

### Runtime Error: Cannot read property 'type' of undefined

**Cause:** overlay state not initialized

**Fix:** Verify INITIAL_OVERLAY is used in useState initialization

### Overlay doesn't dismiss

**Cause:** dismissOverlay not connected properly

**Fix:** Check handlers object in Terminal.tsx

---

## Commit Message

```
refactor(terminal): declarative overlay state machine

- Replace 4 boolean flags with TerminalOverlay discriminated union
- Add OVERLAY_REGISTRY for declarative component mapping
- Create TerminalOverlayRenderer for unified rendering
- Derive input visibility from overlay config
- Remove legacy flowState and boolean actions

DEX compliance: Declarative sovereignty via registry config
Pattern: Simplification of Pattern 2 (Engagement Machine)

Sprint: terminal-overlay-machine-v1
```

---

## Completion Checklist

- [ ] All 4 epics completed
- [ ] All build gates passed
- [ ] Manual QA completed
- [ ] No console errors
- [ ] Committed with proper message
- [ ] DEVLOG.md updated with completion notes
