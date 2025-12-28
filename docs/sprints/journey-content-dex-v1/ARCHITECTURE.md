# ARCHITECTURE.md
# Sprint: journey-content-dex-v1
# Date: 2024-12-28

## Design Philosophy

This component demonstrates the **DEX Pattern for UI Rendering**:

```
Schema Definition → Interpreter Component → Rendered Output
     (JSON)              (React)              (DOM)
```

The interpreter NEVER hardcodes domain content. All labels, actions, and display options come from schema with sensible defaults.

## System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        Terminal.tsx                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │ useJourney   │───▶│ JourneyContent   │───▶│ Rendered UI   │ │
│  │ State()      │    │ (Interpreter)    │    │               │ │
│  │              │    │                  │    │ - Progress    │ │
│  │ isActive ────│───▶│ Reads:           │    │ - Waypoint    │ │
│  │ journey ─────│───▶│ - journey.display│    │ - Actions     │ │
│  │ waypoint ────│───▶│ - waypoint.actions│   │               │ │
│  │ progress ────│───▶│                  │    │               │ │
│  └──────────────┘    │ Emits:           │    └───────────────┘ │
│                      │ - onAction()     │                       │
│                      │ - onExit()       │                       │
│                      └──────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### JourneyContent (Interpreter Component)

```typescript
interface JourneyContentProps {
  // Data (from XState)
  journey: Journey;
  currentWaypoint: JourneyWaypoint;
  journeyProgress: number;
  journeyTotal: number;
  
  // Callbacks (to Terminal)
  onAction: (action: WaypointAction, provenance: JourneyProvenance) => void;
  onExit: () => void;
}
```

**Interpretation Rules:**

1. **Display Config** — Read `journey.display`, merge with defaults
2. **Actions** — Read `waypoint.actions`, fallback to default actions
3. **Labels** — Read from config, fallback to hardcoded defaults
4. **Styling** — Map `variant` to Tailwind classes

### Default Values (Fallback Chain)

```typescript
const DEFAULT_DISPLAY: JourneyDisplayConfig = {
  showProgressBar: true,
  showExitButton: true,
  showWaypointCount: true,
  progressBarColor: 'emerald',
  labels: {
    sectionTitle: 'Journey',
    exitButton: 'Exit',
  },
};

const DEFAULT_ACTIONS: WaypointAction[] = [
  { type: 'explore', label: 'Explore This', variant: 'primary' },
  { type: 'advance', label: 'Next →', variant: 'secondary' },
];

const FINAL_WAYPOINT_ACTIONS: WaypointAction[] = [
  { type: 'explore', label: 'Explore This', variant: 'primary' },
  { type: 'complete', label: 'Complete Journey', variant: 'primary' },
];
```

## Schema Extensions

### File: `src/core/schema/journey.ts`

```typescript
// ADD: Display configuration
export interface JourneyDisplayConfig {
  showProgressBar?: boolean;
  showExitButton?: boolean;
  showWaypointCount?: boolean;
  progressBarColor?: 'emerald' | 'cyan' | 'amber' | 'blue' | 'purple';
  
  labels?: {
    sectionTitle?: string;
    exitButton?: string;
  };
}

// ADD: Waypoint action
export interface WaypointAction {
  type: 'explore' | 'advance' | 'complete' | 'branch' | 'custom';
  label: string;
  variant?: 'primary' | 'secondary' | 'subtle';
  targetWaypoint?: string;  // For 'branch'
  command?: string;         // For 'custom'
}

// EXTEND: Journey interface
export interface Journey {
  // ... existing fields
  display?: JourneyDisplayConfig;
}

// EXTEND: JourneyWaypoint interface
export interface JourneyWaypoint {
  // ... existing fields
  actions?: WaypointAction[];
}
```

### File: `src/core/schema/journey-provenance.ts` (NEW)

```typescript
/**
 * Provenance for journey-related interactions
 * Used to track which journey/waypoint triggered an insight
 */
export interface JourneyProvenance {
  journey: {
    id: string;
    title: string;
  };
  waypoint: {
    id: string;
    title: string;
    index: number;
  };
  action: {
    type: string;
    label: string;
    timestamp: string;
  };
}
```

## Integration Points

### Terminal.tsx Changes

**Location:** After `useJourneyState` destructuring (~line 167)

```typescript
const {
  journey: engJourney,
  isActive: isJourneyActive,
  currentWaypoint,        // ADD
  journeyProgress,        // ADD
  journeyTotal,           // ADD
  progressPercent,        // ADD
  startJourney: engStartJourney,
  advanceStep,
  completeJourney,        // ADD
  exitJourney: engExitJourney
} = useJourneyState({ actor });
```

**Location:** Render section (~line 1585)

```typescript
{/* DEX-Compliant Journey Content */}
{isJourneyActive && engJourney && currentWaypoint ? (
  <JourneyContent
    journey={engJourney}
    currentWaypoint={currentWaypoint}
    journeyProgress={journeyProgress}
    journeyTotal={journeyTotal}
    onAction={handleJourneyAction}
    onExit={engExitJourney}
  />
) : nextNodes.length > 0 ? (
  // ... existing code
```

**Location:** New handler function

```typescript
const handleJourneyAction = useCallback((
  action: WaypointAction,
  provenance: JourneyProvenance
) => {
  switch (action.type) {
    case 'explore':
      // Send waypoint prompt with provenance
      handleSendWithProvenance(currentWaypoint.prompt, provenance);
      break;
    case 'advance':
      advanceStep();
      break;
    case 'complete':
      completeJourney();
      actions.setReveal('journeyCompletion', true);
      actions.setCompletedJourneyTitle(engJourney?.title || '');
      recordJourneyCompleted();
      incrementJourneysCompleted();
      emit.journeyCompleted(engJourney?.id || '');
      break;
    case 'branch':
      // Future: Jump to specific waypoint
      console.warn('[Journey] Branch not yet implemented');
      break;
    case 'custom':
      if (action.command) {
        handleSend(action.command);
      }
      break;
  }
}, [currentWaypoint, advanceStep, completeJourney, ...]);
```

## File Structure

```
src/core/schema/
├── journey.ts              # MODIFY: Add display config, action types
├── journey-provenance.ts   # CREATE: Provenance type
└── index.ts                # MODIFY: Export new types

components/Terminal/
├── JourneyContent.tsx      # CREATE: DEX interpreter component
├── JourneyContent.test.tsx # CREATE: Unit tests
└── index.ts                # MODIFY: Export JourneyContent

components/
└── Terminal.tsx            # MODIFY: Wire JourneyContent
```

## Styling Strategy

Map `variant` to Tailwind classes:

```typescript
const ACTION_STYLES: Record<string, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
  subtle: 'bg-transparent hover:bg-slate-800 text-slate-400 border border-slate-700',
};

const PROGRESS_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};
```

## Data Flow

```
1. User clicks journey pill
   │
   ▼
2. getCanonicalJourney(id, schema) returns Journey with display config
   │
   ▼
3. engStartJourney(journey) updates XState
   │
   ▼
4. useJourneyState() returns { isActive: true, journey, currentWaypoint, ... }
   │
   ▼
5. Terminal.tsx renders <JourneyContent>
   │
   ▼
6. JourneyContent reads journey.display, waypoint.actions
   │
   ▼
7. User clicks action button
   │
   ▼
8. onAction(action, provenance) called
   │
   ▼
9. Terminal handles action (send prompt, advance, complete, etc.)
```

## Testing Strategy

### Unit Tests (JourneyContent.test.tsx)

```typescript
describe('JourneyContent', () => {
  it('renders with minimal props (defaults apply)');
  it('hides progress bar when display.showProgressBar is false');
  it('uses custom section title from display.labels');
  it('renders default actions when waypoint.actions undefined');
  it('renders custom actions from waypoint.actions');
  it('shows Complete button on final waypoint');
  it('calls onAction with correct provenance');
  it('calls onExit when exit button clicked');
});
```

### Integration (Terminal.tsx behavior)

```typescript
describe('Terminal Journey Integration', () => {
  it('shows JourneyContent when journey is active');
  it('hides JourneyContent when journey exits');
  it('sends prompt with provenance on explore action');
  it('advances XState on advance action');
  it('completes journey and shows modal on complete action');
});
```
