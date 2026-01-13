# Execution Prompt: Progress Streaming UI v1

**Sprint:** progress-streaming-ui-v1
**Status:** Ready for Execution
**Tier:** Feature (4-6 hours)
**Domain:** explore

---

## BINDING CONTRACT: Grove Execution Protocol

**This contract MUST be acknowledged before any code changes.**

By executing this sprint, you agree to the following binding requirements:

### Article I: Sprint Sovereignty

1. **SPEC.md is authoritative** — All acceptance criteria come from the SPEC. If ambiguous, ask before proceeding.
2. **No scope creep** — Only implement what's in the ACs. Do not add features, refactor unrelated code, or "improve" things not mentioned.
3. **Attention anchoring** — Re-read SPEC.md before each epic. Re-read after every 10 tool calls.

### Article II: Code Integrity

1. **Extend, don't replace** — Modify existing files per the migration map. Do not create parallel implementations.
2. **Pattern compliance** — Use existing patterns from `GardenInspector.tsx` and `useResearchAgent.ts`.
3. **Type safety** — All new code must be fully typed. No `any` types.
4. **No magic strings** — Use constants or types for event type checks.

### Article III: Visual Verification

Per Bedrock Sprint Contract Article IX:

1. **Screenshots required** — Capture all states listed in SPEC.md Section "Required Screenshots"
2. **REVIEW.html required** — Map every AC to visual evidence
3. **No code-only completion** — Build passing is NOT proof features work

### Article IV: Build Gates

Before marking complete:
- [ ] `npm run build` exits 0
- [ ] No TypeScript errors
- [ ] No console errors on page load
- [ ] All screenshots captured
- [ ] REVIEW.html complete with sign-off

### Article V: Commit Protocol

- Commit message format: `feat(explore): {description}`
- Include `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
- Do NOT commit until visual verification complete

---

## Acknowledgment

Before proceeding, execute this command to confirm contract acceptance:

```bash
echo "Grove Execution Protocol acknowledged for progress-streaming-ui-v1 at $(date -Iseconds)" >> docs/sprints/progress-streaming-ui-v1/DEVLOG.md
```

---

## Pre-Execution Checklist

```bash
# 1. Verify you're on the correct branch
git branch --show-current

# 2. Verify Sprint 3 is merged (pipeline exists)
ls src/explore/services/research-pipeline.ts

# 3. Verify GardenInspector exists
ls src/explore/GardenInspector.tsx

# 4. Verify build passes before starting
npm run build

# 5. Create DEVLOG if not exists
touch docs/sprints/progress-streaming-ui-v1/DEVLOG.md
```

---

## Context Summary

### What We're Building

Real-time progress visualization for the Research Lifecycle pipeline. When a user has an active research sprout, they should see:

1. Live search queries as they execute
2. Sources appearing as they're discovered
3. Phase transitions (Researching → Writing → Complete)
4. Smooth animations throughout

### What Already Exists

| File | Contains |
|------|----------|
| `research-pipeline.ts` | `PipelineProgressEvent` types, `onProgress` callback |
| `research-agent.ts` | `ResearchProgressEvent` types |
| `useResearchAgent.ts` | Agent execution hook with basic progress state |
| `GardenInspector.tsx` | Sprout list and confirmation views |
| `ResearchSproutContext.tsx` | Sprout state management |

### What We're Creating

| File | Purpose |
|------|---------|
| `useResearchProgress.ts` | Progress state management with event buffering |
| `ResearchProgressView.tsx` | Main progress display component |
| `SourceList.tsx` | Animated source discovery list |
| `PhaseIndicator.tsx` | Phase badge with animation |

---

## Phase 1: Progress State Hook (US-PS001)

**Goal:** Create hook to track progress events during active research.

### Step 1.1: Create the Hook File

```bash
# Create the new hook file
touch src/explore/hooks/useResearchProgress.ts
```

### Step 1.2: Implement useResearchProgress

**File:** `src/explore/hooks/useResearchProgress.ts`

```typescript
// src/explore/hooks/useResearchProgress.ts
// Progress state management for Research Lifecycle UI
// Sprint: progress-streaming-ui-v1
//
// DEX: Provenance as Infrastructure
// Every event includes timestamp for debugging and metrics.

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PipelineProgressEvent } from '../services/research-pipeline';

// =============================================================================
// Types
// =============================================================================

export interface ProgressSource {
  url: string;
  title: string;
  domain: string;
  timestamp: string;
}

export interface TimestampedEvent {
  event: PipelineProgressEvent;
  timestamp: string;
}

export type ProgressPhase = 'idle' | 'research' | 'writing' | 'complete' | 'error';

export interface ResearchProgressState {
  /** Whether research is currently active */
  isActive: boolean;

  /** Current pipeline phase */
  currentPhase: ProgressPhase;

  /** Recent progress events (max 10, FIFO) */
  events: TimestampedEvent[];

  /** Discovered sources */
  sources: ProgressSource[];

  /** Current search query (if searching) */
  currentQuery: string | null;

  /** Current branch being processed */
  currentBranch: { id: string; label: string } | null;

  /** Error message (if failed) */
  error: string | null;

  /** Completion data (if complete) */
  completion: {
    documentId?: string;
    duration: number;
    sourceCount: number;
  } | null;
}

export interface UseResearchProgressResult {
  state: ResearchProgressState;
  pushEvent: (event: PipelineProgressEvent) => void;
  reset: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_EVENTS = 10;

const INITIAL_STATE: ResearchProgressState = {
  isActive: false,
  currentPhase: 'idle',
  events: [],
  sources: [],
  currentQuery: null,
  currentBranch: null,
  error: null,
  completion: null,
};

// =============================================================================
// Utilities
// =============================================================================

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 30);
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useResearchProgress(): UseResearchProgressResult {
  const [state, setState] = useState<ResearchProgressState>(INITIAL_STATE);
  const eventsRef = useRef<TimestampedEvent[]>([]);
  const sourcesRef = useRef<ProgressSource[]>([]);

  // Push a new event and update state
  const pushEvent = useCallback((event: PipelineProgressEvent) => {
    const timestamp = new Date().toISOString();
    const timestampedEvent: TimestampedEvent = { event, timestamp };

    // Add to events buffer (FIFO)
    eventsRef.current = [...eventsRef.current.slice(-(MAX_EVENTS - 1)), timestampedEvent];

    setState(prev => {
      const newState = { ...prev, isActive: true };
      newState.events = eventsRef.current;

      // Update phase based on event type
      if (event.type === 'phase-started') {
        newState.currentPhase = event.phase;
        newState.error = null;
      } else if (event.type === 'pipeline-complete') {
        newState.currentPhase = 'complete';
        newState.isActive = false;
        newState.completion = {
          duration: event.totalDuration,
          sourceCount: sourcesRef.current.length,
        };
      } else if (event.type === 'pipeline-error') {
        newState.currentPhase = 'error';
        newState.isActive = false;
        newState.error = event.message;
      }

      // Handle research agent events
      if ('type' in event) {
        switch (event.type) {
          case 'search-started':
            newState.currentQuery = (event as { query: string }).query;
            break;

          case 'source-discovered': {
            const discovered = event as { url: string; title: string };
            const source: ProgressSource = {
              url: discovered.url,
              title: discovered.title,
              domain: extractDomain(discovered.url),
              timestamp,
            };
            sourcesRef.current = [...sourcesRef.current, source];
            newState.sources = sourcesRef.current;
            break;
          }

          case 'branch-started': {
            const branch = event as { branchId: string; label: string };
            newState.currentBranch = { id: branch.branchId, label: branch.label };
            break;
          }

          case 'branch-completed':
            newState.currentBranch = null;
            newState.currentQuery = null;
            break;

          case 'research-complete': {
            const complete = event as { totalEvidence: number };
            newState.completion = {
              ...newState.completion,
              sourceCount: complete.totalEvidence,
              duration: newState.completion?.duration ?? 0,
            };
            break;
          }
        }
      }

      return newState;
    });
  }, []);

  // Reset state for new execution
  const reset = useCallback(() => {
    eventsRef.current = [];
    sourcesRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  return { state, pushEvent, reset };
}

// =============================================================================
// Export
// =============================================================================

export default useResearchProgress;
```

### Step 1.3: Export from Index

**File:** `src/explore/hooks/index.ts`

Add to exports:
```typescript
export { useResearchProgress, type ResearchProgressState } from './useResearchProgress';
```

### Verification 1.1

```bash
npm run build
# Should pass with no errors
```

---

## Phase 2: Progress Display Components (US-PS002, US-PS004)

**Goal:** Create the visual components for progress display.

### Step 2.1: Create PhaseIndicator Component

**File:** `src/explore/components/PhaseIndicator.tsx`

```typescript
// src/explore/components/PhaseIndicator.tsx
// Phase indicator badge for research progress
// Sprint: progress-streaming-ui-v1

import type { ProgressPhase } from '../hooks/useResearchProgress';

interface PhaseIndicatorProps {
  phase: ProgressPhase;
  className?: string;
}

const PHASE_CONFIG: Record<ProgressPhase, {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  animate: boolean;
}> = {
  idle: {
    icon: 'hourglass_empty',
    label: 'Waiting',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    animate: false,
  },
  research: {
    icon: 'science',
    label: 'Researching',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    animate: true,
  },
  writing: {
    icon: 'edit_note',
    label: 'Writing',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    animate: true,
  },
  complete: {
    icon: 'check_circle',
    label: 'Complete',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    animate: false,
  },
  error: {
    icon: 'error',
    label: 'Failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    animate: false,
  },
};

export function PhaseIndicator({ phase, className = '' }: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${config.bgColor} ${config.color}
        ${config.animate ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <span className="material-symbols-outlined text-lg">
        {config.icon}
      </span>
      <span className="text-sm font-medium">
        {config.label}
      </span>
    </div>
  );
}

export default PhaseIndicator;
```

### Step 2.2: Create SourceList Component

**File:** `src/explore/components/SourceList.tsx`

```typescript
// src/explore/components/SourceList.tsx
// Animated source discovery list
// Sprint: progress-streaming-ui-v1

import type { ProgressSource } from '../hooks/useResearchProgress';

interface SourceListProps {
  sources: ProgressSource[];
  maxVisible?: number;
  onSourceClick?: (url: string) => void;
}

const MAX_VISIBLE_DEFAULT = 8;

export function SourceList({
  sources,
  maxVisible = MAX_VISIBLE_DEFAULT,
  onSourceClick,
}: SourceListProps) {
  const visibleSources = sources.slice(-maxVisible);
  const hiddenCount = Math.max(0, sources.length - maxVisible);

  if (sources.length === 0) {
    return (
      <div className="text-sm text-slate-400 dark:text-slate-500 italic py-2">
        No sources discovered yet...
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Source count header */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="material-symbols-outlined text-sm">link</span>
        <span>Found {sources.length} source{sources.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Source list */}
      <div className="space-y-1">
        {visibleSources.map((source, index) => (
          <SourceItem
            key={`${source.url}-${index}`}
            source={source}
            isNew={index === visibleSources.length - 1}
            onClick={() => onSourceClick?.(source.url)}
          />
        ))}
      </div>

      {/* Hidden count indicator */}
      {hiddenCount > 0 && (
        <button
          className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
          onClick={() => {/* TODO: Expand to show all */}}
        >
          +{hiddenCount} more source{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

interface SourceItemProps {
  source: ProgressSource;
  isNew: boolean;
  onClick?: () => void;
}

function SourceItem({ source, isNew, onClick }: SourceItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
        text-left text-sm transition-all
        hover:bg-slate-100 dark:hover:bg-slate-800
        ${isNew ? 'animate-slide-in-left' : ''}
      `}
    >
      {/* Domain badge */}
      <span className="shrink-0 px-1.5 py-0.5 text-xs font-mono rounded
                       bg-slate-100 dark:bg-slate-800
                       text-slate-600 dark:text-slate-400">
        {source.domain}
      </span>

      {/* Title (truncated) */}
      <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
        {source.title.slice(0, 40)}
        {source.title.length > 40 ? '...' : ''}
      </span>

      {/* External link icon */}
      <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">
        open_in_new
      </span>
    </button>
  );
}

export default SourceList;
```

### Step 2.3: Create ResearchProgressView Component

**File:** `src/explore/components/ResearchProgressView.tsx`

```typescript
// src/explore/components/ResearchProgressView.tsx
// Main progress display for active research
// Sprint: progress-streaming-ui-v1
//
// DEX: Capability Agnosticism
// This component only consumes events - works regardless of underlying model.

import { useEffect } from 'react';
import { PhaseIndicator } from './PhaseIndicator';
import { SourceList } from './SourceList';
import type { ResearchProgressState, ProgressPhase } from '../hooks/useResearchProgress';

interface ResearchProgressViewProps {
  state: ResearchProgressState;
  onComplete?: (documentId?: string) => void;
  onRetry?: () => void;
  onSourceClick?: (url: string) => void;
}

export function ResearchProgressView({
  state,
  onComplete,
  onRetry,
  onSourceClick,
}: ResearchProgressViewProps) {
  // Trigger onComplete when phase changes to complete
  useEffect(() => {
    if (state.currentPhase === 'complete' && onComplete) {
      onComplete(state.completion?.documentId);
    }
  }, [state.currentPhase, state.completion?.documentId, onComplete]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30
                            border border-slate-200 dark:border-slate-700
                            flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-lg">
                monitoring
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Research Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getSubtitle(state)}
              </p>
            </div>
          </div>

          <PhaseIndicator phase={state.currentPhase} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current search query */}
        {state.currentQuery && (
          <CurrentQueryDisplay query={state.currentQuery} />
        )}

        {/* Branch progress */}
        {state.currentBranch && (
          <BranchProgress branch={state.currentBranch} />
        )}

        {/* Source list */}
        <div className="pt-2">
          <SourceList
            sources={state.sources}
            onSourceClick={onSourceClick || ((url) => window.open(url, '_blank'))}
          />
        </div>

        {/* Error state */}
        {state.currentPhase === 'error' && state.error && (
          <ErrorDisplay error={state.error} onRetry={onRetry} />
        )}

        {/* Completion state */}
        {state.currentPhase === 'complete' && state.completion && (
          <CompletionDisplay
            duration={state.completion.duration}
            sourceCount={state.completion.sourceCount}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Subcomponents
// =============================================================================

function getSubtitle(state: ResearchProgressState): string {
  switch (state.currentPhase) {
    case 'idle':
      return 'Waiting to start...';
    case 'research':
      return state.currentBranch
        ? `Branch: ${state.currentBranch.label}`
        : 'Collecting evidence...';
    case 'writing':
      return 'Generating document...';
    case 'complete':
      return `Completed in ${formatDuration(state.completion?.duration ?? 0)}`;
    case 'error':
      return 'Research failed';
    default:
      return '';
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

interface CurrentQueryDisplayProps {
  query: string;
}

function CurrentQueryDisplay({ query }: CurrentQueryDisplayProps) {
  const truncated = query.length > 50 ? query.slice(0, 47) + '...' : query;

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg
                    bg-blue-50 dark:bg-blue-900/20
                    border border-blue-200 dark:border-blue-800/50">
      <span className="material-symbols-outlined text-blue-500 animate-pulse">
        search
      </span>
      <div>
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">
          Searching
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
          "{truncated}"
        </p>
      </div>
    </div>
  );
}

interface BranchProgressProps {
  branch: { id: string; label: string };
}

function BranchProgress({ branch }: BranchProgressProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="material-symbols-outlined text-sm">account_tree</span>
      <span>Processing: {branch.label}</span>
    </div>
  );
}

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20
                    border border-red-200 dark:border-red-800/50">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-red-500 text-xl">
          error
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Research Failed
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-1.5 text-sm font-medium
                         bg-red-100 dark:bg-red-900/40
                         text-red-700 dark:text-red-300
                         rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60
                         transition-colors"
            >
              Retry Research
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface CompletionDisplayProps {
  duration: number;
  sourceCount: number;
}

function CompletionDisplay({ duration, sourceCount }: CompletionDisplayProps) {
  return (
    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20
                    border border-green-200 dark:border-green-800/50
                    animate-scale-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40
                        flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">
            check_circle
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Research Complete
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {sourceCount} sources analyzed in {formatDuration(duration)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResearchProgressView;
```

### Step 2.4: Add CSS Animations

**File:** `tailwind.config.ts`

Add to the `extend.keyframes` and `extend.animation` sections:

```typescript
// Add to keyframes:
'slide-in-left': {
  '0%': { transform: 'translateX(-10px)', opacity: '0' },
  '100%': { transform: 'translateX(0)', opacity: '1' },
},
'scale-in': {
  '0%': { transform: 'scale(0.95)', opacity: '0' },
  '100%': { transform: 'scale(1)', opacity: '1' },
},

// Add to animation:
'slide-in-left': 'slide-in-left 200ms ease-out',
'scale-in': 'scale-in 300ms ease-out',
```

### Verification 2.4

```bash
npm run build
```

---

## Phase 3: GardenInspector Integration (US-PS005)

**Goal:** Wire progress view into GardenInspector.

### Step 3.1: Modify GardenInspector

**File:** `src/explore/GardenInspector.tsx`

Add imports at top:
```typescript
import { ResearchProgressView } from './components/ResearchProgressView';
import { useResearchProgress } from './hooks/useResearchProgress';
```

Update ViewMode type:
```typescript
type ViewMode = 'confirmation' | 'list' | 'progress';
```

Add to component body (after existing state):
```typescript
// Progress state for active sprouts
const { state: progressState, pushEvent, reset: resetProgress } = useResearchProgress();

// Get selected sprout from context
const { selectedSproutId, sprouts } = useResearchSprouts();
const selectedSprout = sprouts.find(s => s.id === selectedSproutId);

// Determine view mode
const viewMode: ViewMode = useMemo(() => {
  if (architectState === 'confirming') return 'confirmation';
  if (selectedSprout?.status === 'active') return 'progress';
  return 'list';
}, [architectState, selectedSprout?.status]);
```

Add progress view to render:
```tsx
{viewMode === 'progress' && selectedSprout && (
  <ResearchProgressView
    state={progressState}
    onRetry={() => {/* TODO: Trigger retry */}}
    onSourceClick={(url) => window.open(url, '_blank')}
  />
)}
```

### Verification 3.1

```bash
npm run build
npm run dev
# Navigate to /explore with an active sprout
```

---

## Phase 4: Visual QA & Screenshots (US-PS007)

**Goal:** Capture visual evidence for all acceptance criteria.

### Step 4.1: Create Visual QA Test

**File:** `tests/visual-qa/progress-streaming.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/progress-streaming-ui-v1/screenshots';

test.describe('Progress Streaming UI Visual QA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
  });

  test('01 - Progress panel research phase', async ({ page }) => {
    // Note: This requires an active sprout - may need mock data
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-progress-research-phase.png`,
      fullPage: false,
    });
  });

  test('02 - Progress panel with search query', async ({ page }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-progress-search-query.png`,
    });
  });

  test('03 - Progress panel with sources', async ({ page }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-progress-sources.png`,
    });
  });

  test('04 - Progress panel writing phase', async ({ page }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-progress-writing-phase.png`,
    });
  });

  test('05 - Progress panel completion', async ({ page }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-progress-complete.png`,
    });
  });

  test('06 - Progress panel error state', async ({ page }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-progress-error.png`,
    });
  });
});
```

### Step 4.2: Create REVIEW.html

**File:** `docs/sprints/progress-streaming-ui-v1/REVIEW.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Progress Streaming UI v1 - Visual Review</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #f8f9fa; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 1rem; }
    h2 { color: #333; margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: white; }
    th, td { padding: 0.75rem; text-align: left; border: 1px solid #e0e0e0; }
    th { background: #f0f0f0; }
    .pass { background: #d4edda; color: #155724; }
    .fail { background: #f8d7da; color: #721c24; }
    .pending { background: #fff3cd; color: #856404; }
    img { max-width: 100%; border: 1px solid #ddd; margin: 1rem 0; }
    .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; }
    .screenshot-card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>Progress Streaming UI v1 - Visual Review</h1>
  <p><strong>Sprint:</strong> progress-streaming-ui-v1</p>
  <p><strong>Date:</strong> 2026-01-13</p>

  <h2>Acceptance Criteria Verification</h2>
  <table>
    <thead>
      <tr>
        <th>AC</th>
        <th>Description</th>
        <th>Status</th>
        <th>Evidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>AC-1</td>
        <td>Progress events captured during active research</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #01</td>
      </tr>
      <tr>
        <td>AC-2</td>
        <td>Event buffer limited to 10 most recent (FIFO)</td>
        <td class="pending">PENDING</td>
        <td>Code review</td>
      </tr>
      <tr>
        <td>AC-3</td>
        <td>Progress state resets on new execution</td>
        <td class="pending">PENDING</td>
        <td>Manual test</td>
      </tr>
      <tr>
        <td>AC-4</td>
        <td>Pipeline phase tracked (research | writing)</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #01, #04</td>
      </tr>
      <tr>
        <td>AC-5</td>
        <td>Progress panel renders for active sprouts</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #01</td>
      </tr>
      <tr>
        <td>AC-6</td>
        <td>Phase indicator shows current pipeline phase</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #01, #04</td>
      </tr>
      <tr>
        <td>AC-7</td>
        <td>Search queries display with truncation</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #02</td>
      </tr>
      <tr>
        <td>AC-8</td>
        <td>Source count displayed</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #03</td>
      </tr>
      <tr>
        <td>AC-9</td>
        <td>Completion state shows success indicator</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #05</td>
      </tr>
      <tr>
        <td>AC-10</td>
        <td>Sources animate in as discovered</td>
        <td class="pending">PENDING</td>
        <td>Manual verification</td>
      </tr>
      <tr>
        <td>AC-11</td>
        <td>Sources show domain and truncated title</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #03</td>
      </tr>
      <tr>
        <td>AC-12</td>
        <td>Source overflow handled with "+N more"</td>
        <td class="pending">PENDING</td>
        <td>Code review</td>
      </tr>
      <tr>
        <td>AC-13</td>
        <td>Progress view replaces details for active sprouts</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #01</td>
      </tr>
      <tr>
        <td>AC-14</td>
        <td>View transitions when status changes</td>
        <td class="pending">PENDING</td>
        <td>Manual verification</td>
      </tr>
      <tr>
        <td>AC-15</td>
        <td>Error state shows with retry option</td>
        <td class="pending">PENDING</td>
        <td>Screenshot #06</td>
      </tr>
      <tr>
        <td>AC-16</td>
        <td>npm run build passes</td>
        <td class="pending">PENDING</td>
        <td>Build log</td>
      </tr>
      <tr>
        <td>AC-17</td>
        <td>No TypeScript errors</td>
        <td class="pending">PENDING</td>
        <td>Build log</td>
      </tr>
      <tr>
        <td>AC-18</td>
        <td>No console errors on load</td>
        <td class="pending">PENDING</td>
        <td>DevTools</td>
      </tr>
      <tr>
        <td>AC-19</td>
        <td>Visual QA screenshots captured</td>
        <td class="pending">PENDING</td>
        <td>This document</td>
      </tr>
    </tbody>
  </table>

  <h2>Visual Evidence</h2>
  <div class="screenshot-grid">
    <div class="screenshot-card">
      <h3>01 - Research Phase</h3>
      <img src="screenshots/01-progress-research-phase.png" alt="Research phase">
    </div>
    <div class="screenshot-card">
      <h3>02 - Search Query</h3>
      <img src="screenshots/02-progress-search-query.png" alt="Search query">
    </div>
    <div class="screenshot-card">
      <h3>03 - Sources</h3>
      <img src="screenshots/03-progress-sources.png" alt="Sources">
    </div>
    <div class="screenshot-card">
      <h3>04 - Writing Phase</h3>
      <img src="screenshots/04-progress-writing-phase.png" alt="Writing phase">
    </div>
    <div class="screenshot-card">
      <h3>05 - Complete</h3>
      <img src="screenshots/05-progress-complete.png" alt="Complete">
    </div>
    <div class="screenshot-card">
      <h3>06 - Error State</h3>
      <img src="screenshots/06-progress-error.png" alt="Error state">
    </div>
  </div>

  <h2>Build Verification</h2>
  <pre>
$ npm run build
# [Build output here]
  </pre>

  <h2>Sign-off</h2>
  <p><strong>Verified by:</strong> [Name]</p>
  <p><strong>Timestamp:</strong> [ISO 8601]</p>
</body>
</html>
```

---

## Post-Epic Checklist

After each epic, verify:

```bash
# 1. Build passes
npm run build

# 2. Update DEVLOG
echo "Epic N complete. Build: PASS" >> docs/sprints/progress-streaming-ui-v1/DEVLOG.md

# 3. Re-read SPEC.md (Attention Anchor)
cat docs/sprints/progress-streaming-ui-v1/SPEC.md | head -40
```

---

## Final Verification

Before marking sprint complete:

```bash
# 1. Full build
npm run build

# 2. Run visual QA tests
npx playwright test tests/visual-qa/progress-streaming.spec.ts

# 3. Verify screenshots exist
ls docs/sprints/progress-streaming-ui-v1/screenshots/

# 4. Update REVIEW.html with PASS/FAIL status

# 5. Commit
git add .
git commit -m "$(cat <<'EOF'
feat(explore): Progress Streaming UI v1 - Real-time research visibility

Sprint: progress-streaming-ui-v1

## Summary
- Add useResearchProgress hook for progress state management
- Create ResearchProgressView component with phase indicators
- Create SourceList component with animations
- Integrate into GardenInspector for active sprouts

## Key Changes
- New: src/explore/hooks/useResearchProgress.ts
- New: src/explore/components/ResearchProgressView.tsx
- New: src/explore/components/SourceList.tsx
- New: src/explore/components/PhaseIndicator.tsx
- Modified: src/explore/GardenInspector.tsx (progress view mode)
- Modified: tailwind.config.ts (animations)

## Visual QA
All acceptance criteria verified via REVIEW.html

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Troubleshooting

### Events not appearing

1. Verify pipeline is calling `onProgress` callback
2. Check that `pushEvent` is being called from context
3. Add console.log in `pushEvent` to trace events

### Sources not animating

1. Verify `animate-slide-in-left` class is in tailwind config
2. Check browser DevTools for CSS errors
3. Ensure source has `isNew` prop set correctly

### Phase not updating

1. Check that `phase-started` events are being emitted
2. Verify event type matching in switch statement
3. Add logging to trace phase transitions

---

## Summary

| Phase | Goal | Key Files |
|-------|------|-----------|
| 1 | Progress state hook | `useResearchProgress.ts` |
| 2 | Display components | `ResearchProgressView.tsx`, `SourceList.tsx`, `PhaseIndicator.tsx` |
| 3 | Integration | `GardenInspector.tsx` modifications |
| 4 | Visual QA | Screenshots, `REVIEW.html` |

**Estimated Time:** 4-6 hours

**Critical Path:** Hook → Components → Integration → Visual QA

---

*This execution prompt follows Grove Execution Protocol and Bedrock Sprint Contract v1.2 requirements.*
