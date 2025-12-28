# EXECUTION_PROMPT.md
# Sprint: journey-content-dex-v1
# Date: 2024-12-28

## Context

You are implementing DEX-compliant journey content rendering for The Grove Foundation. This sprint fixes a bug where clicking journey pills does nothing, AND establishes the pattern for schema-driven UI rendering.

**Repository:** C:\GitHub\the-grove-foundation
**Branch:** main (commit on top of e5d82d2)

## Pre-Execution Checklist

Before starting, verify:
```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean
git log -1 --oneline  # Should show e5d82d2 or later
npm run build  # Should pass
npm run test  # Should show 217+ tests passing
```

## Execution Sequence

Execute these phases in order. Each phase should compile and pass tests before proceeding.

---

### PHASE 1: Schema Extension

**Goal:** Add DEX-compliant display and action types to journey schema.

#### Step 1.1: Extend journey.ts

Edit `src/core/schema/journey.ts`. Add these NEW types BEFORE the existing interfaces:

```typescript
// =============================================================================
// DEX Display Configuration
// Satisfies Trellis Pillar I: Declarative Sovereignty
// =============================================================================

/**
 * Schema-driven display configuration for journeys.
 * Non-technical users can customize UI by editing JSON.
 */
export interface JourneyDisplayConfig {
  /** Show progress bar. Default: true */
  showProgressBar?: boolean;
  /** Show exit button in header. Default: true */
  showExitButton?: boolean;
  /** Show waypoint count (e.g., "2 of 5"). Default: true */
  showWaypointCount?: boolean;
  /** Progress bar color. Default: 'emerald' */
  progressBarColor?: 'emerald' | 'cyan' | 'amber' | 'blue' | 'purple';
  /** Custom labels */
  labels?: {
    /** Header section title. Default: 'Journey' */
    sectionTitle?: string;
    /** Exit button text. Default: 'Exit' */
    exitButton?: string;
  };
}

/**
 * Schema-driven action definition for waypoints.
 * Actions are declarative - the interpreter component renders them.
 */
export interface WaypointAction {
  /** Action type determines handler behavior */
  type: 'explore' | 'advance' | 'complete' | 'branch' | 'custom';
  /** Button label text */
  label: string;
  /** Visual style variant. Default: 'secondary' */
  variant?: 'primary' | 'secondary' | 'subtle';
  /** For 'branch' type: target waypoint ID */
  targetWaypoint?: string;
  /** For 'custom' type: command to send */
  command?: string;
}
```

Then EXTEND the existing interfaces by adding these fields:

To `JourneyWaypoint` interface, add:
```typescript
  /** Custom actions for this waypoint. If undefined, defaults apply. */
  actions?: WaypointAction[];
```

To `Journey` interface, add:
```typescript
  /** Display configuration. If undefined, defaults apply. */
  display?: JourneyDisplayConfig;
```

#### Step 1.2: Create journey-provenance.ts

Create new file `src/core/schema/journey-provenance.ts`:

```typescript
/**
 * Journey Provenance
 * 
 * Satisfies Trellis Pillar III: Provenance as Infrastructure
 * "A fact without an origin is a bug."
 * 
 * Every journey-initiated interaction carries attribution back to
 * the specific journey, waypoint, and action that triggered it.
 */

import type { Journey, JourneyWaypoint, WaypointAction } from './journey';

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

/**
 * Create a provenance object for a journey action.
 * Use this when handling waypoint actions to maintain attribution chain.
 */
export function createJourneyProvenance(
  journey: Journey,
  waypoint: JourneyWaypoint,
  waypointIndex: number,
  action: WaypointAction
): JourneyProvenance {
  return {
    journey: {
      id: journey.id,
      title: journey.title,
    },
    waypoint: {
      id: waypoint.id,
      title: waypoint.title,
      index: waypointIndex,
    },
    action: {
      type: action.type,
      label: action.label,
      timestamp: new Date().toISOString(),
    },
  };
}
```

#### Step 1.3: Update schema exports

Edit `src/core/schema/index.ts` to add these exports:

```typescript
export * from './journey-provenance';
export type { JourneyDisplayConfig, WaypointAction } from './journey';
```

#### Verify Phase 1
```bash
npx tsc --noEmit  # Should pass
```

---

### PHASE 2: JourneyContent Component

**Goal:** Create the DEX interpreter component that reads schema and renders UI.

#### Step 2.1: Create JourneyContent.tsx

Create new file `components/Terminal/JourneyContent.tsx`:

```typescript
'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { 
  Journey, 
  JourneyWaypoint, 
  WaypointAction,
  JourneyDisplayConfig 
} from '@/core/schema/journey';
import { 
  JourneyProvenance, 
  createJourneyProvenance 
} from '@/core/schema/journey-provenance';

// =============================================================================
// DEX Default Configurations
// These are the fallback values when schema doesn't specify
// =============================================================================

const DEFAULT_DISPLAY: Required<JourneyDisplayConfig> = {
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

// =============================================================================
// Style Mappings (variant → Tailwind classes)
// =============================================================================

const ACTION_STYLES: Record<string, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white font-medium',
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

// =============================================================================
// Component Props
// =============================================================================

export interface JourneyContentProps {
  /** The active journey */
  journey: Journey;
  /** Current waypoint being displayed */
  currentWaypoint: JourneyWaypoint;
  /** Zero-based index of current waypoint */
  journeyProgress: number;
  /** Total number of waypoints */
  journeyTotal: number;
  /** Callback when user clicks an action button */
  onAction: (action: WaypointAction, provenance: JourneyProvenance) => void;
  /** Callback when user exits the journey */
  onExit: () => void;
}

// =============================================================================
// JourneyContent Component
// DEX Interpreter: Reads schema configuration, renders UI
// =============================================================================

export function JourneyContent({
  journey,
  currentWaypoint,
  journeyProgress,
  journeyTotal,
  onAction,
  onExit,
}: JourneyContentProps) {
  // Merge schema display config with defaults
  const display = {
    ...DEFAULT_DISPLAY,
    ...journey.display,
    labels: {
      ...DEFAULT_DISPLAY.labels,
      ...journey.display?.labels,
    },
  };

  // Determine if this is the final waypoint
  const isLastWaypoint = journeyProgress >= journeyTotal - 1;

  // Get actions: schema-defined or defaults
  const actions: WaypointAction[] = currentWaypoint.actions 
    ?? (isLastWaypoint ? FINAL_WAYPOINT_ACTIONS : DEFAULT_ACTIONS);

  // Calculate progress percentage
  const progressPercent = journeyTotal > 0 
    ? ((journeyProgress + 1) / journeyTotal) * 100 
    : 0;

  // Build provenance for an action
  const buildProvenance = (action: WaypointAction): JourneyProvenance => {
    return createJourneyProvenance(
      journey,
      currentWaypoint,
      journeyProgress,
      action
    );
  };

  // Handle action button click
  const handleActionClick = (action: WaypointAction) => {
    const provenance = buildProvenance(action);
    console.log('[JourneyContent] Action clicked:', action.type, provenance);
    onAction(action, provenance);
  };

  return (
    <div className="mb-6 rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-4">
      {/* Header: Section title and exit button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
            {display.labels.sectionTitle}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-sm text-slate-300 font-medium">
            {journey.title}
          </span>
        </div>
        
        {display.showExitButton && (
          <button
            onClick={onExit}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={display.labels.exitButton}
          >
            <X className="w-3 h-3" />
            <span>{display.labels.exitButton}</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {display.showProgressBar && (
        <div className="mb-4">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${PROGRESS_COLORS[display.progressBarColor]} transition-all duration-500 ease-out`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {display.showWaypointCount && (
            <div className="mt-1 text-xs text-slate-500 text-right">
              {journeyProgress + 1} of {journeyTotal}
            </div>
          )}
        </div>
      )}

      {/* Waypoint content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          {currentWaypoint.title}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {currentWaypoint.prompt}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={`${action.type}-${index}`}
            onClick={() => handleActionClick(action)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              ACTION_STYLES[action.variant || 'secondary']
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default JourneyContent;
```

#### Step 2.2: Export from index

Edit `components/Terminal/index.ts`. If it doesn't exist, create it. Add:

```typescript
export { JourneyContent } from './JourneyContent';
export type { JourneyContentProps } from './JourneyContent';
```

#### Verify Phase 2
```bash
npx tsc --noEmit  # Should pass
```

---

### PHASE 3: Terminal Integration

**Goal:** Wire JourneyContent into Terminal.tsx render logic.

#### Step 3.1: Add imports

At the top of `components/Terminal.tsx`, add these imports:

```typescript
import { JourneyContent } from './Terminal/JourneyContent';
import type { WaypointAction } from '@/core/schema/journey';
import type { JourneyProvenance } from '@/core/schema/journey-provenance';
```

#### Step 3.2: Extend state extraction

Find the `useJourneyState` call (around line 167). Expand the destructuring:

```typescript
const {
  journey: engJourney,
  isActive: isJourneyActive,
  currentWaypoint,
  journeyProgress,
  journeyTotal,
  startJourney: engStartJourney,
  advanceStep,
  completeJourney,
  exitJourney: engExitJourney,
} = useJourneyState({ actor });
```

#### Step 3.3: Add action handler

Find the handlers section (around line 700, near other `useCallback` handlers). Add:

```typescript
/**
 * Handle journey action from JourneyContent component.
 * Routes action types to appropriate XState transitions and side effects.
 */
const handleJourneyAction = useCallback((
  action: WaypointAction,
  provenance: JourneyProvenance
) => {
  console.log('[Terminal] Journey action:', action.type, 'provenance:', provenance);
  
  switch (action.type) {
    case 'explore':
      // Send the waypoint prompt to chat
      // TODO: Attach provenance to message for Sprout tracking
      if (currentWaypoint?.prompt) {
        handleSend(currentWaypoint.prompt);
      }
      break;
      
    case 'advance':
      advanceStep();
      break;
      
    case 'complete':
      completeJourney();
      // Trigger completion UI elements
      if (actions?.setReveal) {
        actions.setReveal('journeyCompletion', true);
      }
      if (actions?.setCompletedJourneyTitle) {
        actions.setCompletedJourneyTitle(engJourney?.title || '');
      }
      // Record analytics if available
      if (typeof recordJourneyCompleted === 'function') {
        recordJourneyCompleted();
      }
      if (typeof incrementJourneysCompleted === 'function') {
        incrementJourneysCompleted();
      }
      if (emit?.journeyCompleted) {
        emit.journeyCompleted(engJourney?.id || '');
      }
      break;
      
    case 'branch':
      console.warn('[Terminal] Branch action not yet implemented:', action.targetWaypoint);
      break;
      
    case 'custom':
      if (action.command) {
        handleSend(action.command);
      }
      break;
      
    default:
      console.warn('[Terminal] Unknown journey action type:', action.type);
  }
}, [
  currentWaypoint,
  advanceStep,
  completeJourney,
  engJourney,
  handleSend,
  actions,
  emit,
]);
```

Note: Some of these functions (recordJourneyCompleted, incrementJourneysCompleted, emit) may or may not exist in your codebase. Check their availability and adjust accordingly.

#### Step 3.4: Add render logic

Find the render section where journey/suggestion content is rendered (around line 1585-1610). Add the JourneyContent render BEFORE the existing conditions:

Look for a pattern like:
```typescript
) : nextNodes.length > 0 ? (
```

And add BEFORE it:

```typescript
{/* DEX-Compliant Journey Content (new XState-based system) */}
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
```

The full structure should look something like:
```typescript
{isJourneyActive && engJourney && currentWaypoint ? (
  <JourneyContent ... />
) : nextNodes.length > 0 ? (
  <SuggestionChips ... />
) : currentThread.length > 0 ? (
  <JourneyCard ... />  // Old system, still works
) : stagePrompts.length > 0 ? (
  // Stage prompts
) : null}
```

#### Verify Phase 3
```bash
npx tsc --noEmit  # Should pass
npm run build     # Should pass
npm run test      # Should pass (217+ tests)
```

---

### PHASE 4: Unit Tests

**Goal:** Add unit tests for JourneyContent component.

#### Step 4.1: Create test file

Create `components/Terminal/JourneyContent.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyContent } from './JourneyContent';
import type { Journey, JourneyWaypoint } from '@/core/schema/journey';

// Mock journey data
const mockJourney: Journey = {
  id: 'test-journey',
  title: 'Test Journey',
  description: 'A test journey',
  waypoints: [
    { id: 'wp-1', title: 'First Waypoint', prompt: 'Explore the first topic' },
    { id: 'wp-2', title: 'Second Waypoint', prompt: 'Explore the second topic' },
  ],
  completionMessage: 'Journey complete!',
};

const mockWaypoint: JourneyWaypoint = mockJourney.waypoints[0];

describe('JourneyContent', () => {
  it('renders with minimal props', () => {
    const onAction = vi.fn();
    const onExit = vi.fn();

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={onAction}
        onExit={onExit}
      />
    );

    expect(screen.getByText('Test Journey')).toBeInTheDocument();
    expect(screen.getByText('First Waypoint')).toBeInTheDocument();
    expect(screen.getByText('Explore the first topic')).toBeInTheDocument();
  });

  it('shows progress count by default', () => {
    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('renders default actions on non-final waypoint', () => {
    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Explore This')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  it('renders Complete button on final waypoint', () => {
    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockJourney.waypoints[1]}
        journeyProgress={1}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Complete Journey')).toBeInTheDocument();
    expect(screen.queryByText('Next →')).not.toBeInTheDocument();
  });

  it('calls onAction with provenance when action clicked', () => {
    const onAction = vi.fn();

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={onAction}
        onExit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Explore This'));

    expect(onAction).toHaveBeenCalledTimes(1);
    const [action, provenance] = onAction.mock.calls[0];
    expect(action.type).toBe('explore');
    expect(provenance.journey.id).toBe('test-journey');
    expect(provenance.waypoint.id).toBe('wp-1');
  });

  it('calls onExit when exit button clicked', () => {
    const onExit = vi.fn();

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={onExit}
      />
    );

    fireEvent.click(screen.getByText('Exit'));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('respects display.showProgressBar: false', () => {
    const journeyWithConfig: Journey = {
      ...mockJourney,
      display: { showProgressBar: false },
    };

    render(
      <JourneyContent
        journey={journeyWithConfig}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.queryByText('1 of 2')).not.toBeInTheDocument();
  });

  it('uses custom section title from display.labels', () => {
    const journeyWithConfig: Journey = {
      ...mockJourney,
      display: { labels: { sectionTitle: 'Guided Path' } },
    };

    render(
      <JourneyContent
        journey={journeyWithConfig}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Guided Path')).toBeInTheDocument();
  });

  it('renders custom actions from waypoint.actions', () => {
    const waypointWithActions: JourneyWaypoint = {
      ...mockWaypoint,
      actions: [
        { type: 'custom', label: 'Do Something', command: 'test' },
      ],
    };

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={waypointWithActions}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Do Something')).toBeInTheDocument();
    expect(screen.queryByText('Explore This')).not.toBeInTheDocument();
  });
});
```

#### Verify Phase 4
```bash
npm run test  # Should pass, including new tests
```

---

### PHASE 5: Final Verification

#### Step 5.1: Full build
```bash
npm run build
```

#### Step 5.2: Manual testing
```bash
npm run dev
```

1. Open browser to localhost:3000
2. Navigate to Terminal (click tree icon or go to /terminal)
3. Select a lens when prompted
4. Click a journey pill (e.g., "Stakes of Consolidation")
5. **VERIFY:** Journey content panel appears with:
   - Journey header with title and Exit button
   - Progress bar showing position
   - Waypoint title and prompt text
   - "Explore This" and "Next →" buttons
6. Click "Explore This" → prompt appears in chat
7. Click "Next →" → advances to next waypoint
8. Continue to final waypoint → "Complete Journey" button appears
9. Click "Complete Journey" → completion modal appears

#### Step 5.3: E2E screenshots
```bash
npx playwright test tests/e2e/journey-screenshots.spec.ts --update-snapshots
```

#### Step 5.4: Commit
```bash
git add -A
git commit -m "feat: DEX-compliant journey content rendering

Implements schema-driven journey UI that satisfies Trellis Pillar I
(Declarative Sovereignty) and Pillar III (Provenance as Infrastructure).

Changes:
- Add JourneyDisplayConfig and WaypointAction types to schema
- Add JourneyProvenance type for attribution tracking  
- Create JourneyContent interpreter component
- Wire into Terminal.tsx render logic
- Add comprehensive unit tests

The component reads display configuration from journey.display and
action definitions from waypoint.actions, falling back to sensible
defaults. All labels and behaviors can be customized via schema
without code changes.

DEX Compliance:
- Non-technical users can customize labels via JSON
- Provenance captured on every action
- Defaults work when config undefined
- No hardcoded domain content in component

Fixes: journey-content-not-rendering
Sprint: journey-content-dex-v1"

git push origin main
```

---

## Post-Execution Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run test` passes (220+ tests now)
- [ ] `npm run build` passes
- [ ] Manual verification complete
- [ ] E2E screenshots captured
- [ ] Committed and pushed

## Troubleshooting

### TypeScript errors in Terminal.tsx

The handler may reference functions that don't exist (recordJourneyCompleted, incrementJourneysCompleted, emit). Check if these exist in your codebase:

```typescript
// If they don't exist, make the calls conditional:
if (typeof recordJourneyCompleted === 'function') recordJourneyCompleted();
```

### Import path issues

If `@/core/schema` imports fail, check your `tsconfig.json` for path aliases. You may need:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### JourneyContent not rendering

Check console for errors. Verify:
1. `isJourneyActive` is true after clicking pill
2. `engJourney` is not null
3. `currentWaypoint` is not null

Add debug logging:
```typescript
console.log('[Terminal] Journey state:', { isJourneyActive, engJourney, currentWaypoint });
```

### Tests failing

If JourneyContent tests fail with import errors, ensure:
1. The test file can resolve `@/core/schema` paths
2. Testing library is properly configured
3. Mock data matches actual schema types
