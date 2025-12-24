# Architecture — Epic 6: Consumer Migration

## Overview

Epic 6 connects the engagement infrastructure to the application. The EngagementProvider is installed at the root, and components are migrated from NarrativeEngineContext to the new hooks.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Epic 6 Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Before Migration                       After Migration                    │
│   ────────────────                       ───────────────                    │
│                                                                             │
│   ┌────────────────────┐                ┌────────────────────┐              │
│   │NarrativeEngineProvider              │NarrativeEngineProvider             │
│   │  ┌──────────────────────┐           │  ┌──────────────────────┐         │
│   │  │ App                  │           │  │EngagementProvider    │         │
│   │  │                      │           │  │  ┌──────────────────────┐      │
│   │  │ ┌──────────────┐     │           │  │  │ App                  │      │
│   │  │ │Component     │     │           │  │  │                      │      │
│   │  │ │uses          │     │           │  │  │ ┌──────────────┐     │      │
│   │  │ │useNarrative  │     │           │  │  │ │Component     │     │      │
│   │  │ │Engine()      │     │           │  │  │ │uses          │     │      │
│   │  │ └──────────────┘     │           │  │  │ │useEngagement │     │      │
│   │  │                      │           │  │  │ │+ hooks       │     │      │
│   │  └──────────────────────┘           │  │  │ └──────────────┘     │      │
│   └────────────────────┘                │  │  └──────────────────────┘      │
│                                         │  └──────────────────────┘         │
│                                         └────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Provider Installation

### Location Options

**Option A: app/layout.tsx**
```typescript
// app/layout.tsx
import { EngagementProvider } from '@/core/engagement';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NarrativeEngineProvider>
          <EngagementProvider>
            {children}
          </EngagementProvider>
        </NarrativeEngineProvider>
      </body>
    </html>
  );
}
```

**Option B: Centralized providers.tsx**
```typescript
// app/providers.tsx
import { EngagementProvider } from '@/core/engagement';

export function Providers({ children }) {
  return (
    <NarrativeEngineProvider>
      <EngagementProvider>
        {children}
      </EngagementProvider>
    </NarrativeEngineProvider>
  );
}
```

## Component Migration Pattern

### Before (NarrativeEngineContext)

```typescript
import { useNarrativeEngine } from '@/hooks/NarrativeEngineContext';

function LensSelector() {
  const { lens, setLens } = useNarrativeEngine();
  
  return (
    <select value={lens ?? ''} onChange={e => setLens(e.target.value)}>
      <option value="">Select lens...</option>
      <option value="academic">Academic</option>
      <option value="engineer">Engineer</option>
    </select>
  );
}
```

### After (Engagement Hooks)

```typescript
import { useEngagement, useLensState } from '@/core/engagement';

function LensSelector() {
  const { actor } = useEngagement();
  const { lens, selectLens } = useLensState({ actor });
  
  return (
    <select value={lens ?? ''} onChange={e => selectLens(e.target.value)}>
      <option value="">Select lens...</option>
      <option value="academic">Academic</option>
      <option value="engineer">Engineer</option>
    </select>
  );
}
```

## Migration Mapping

### Lens State

| NarrativeEngineContext | useLensState |
|------------------------|--------------|
| `lens` | `lens` |
| `setLens(value)` | `selectLens(value)` |
| - | `clearLens()` |
| - | `source` |

### Journey State

| NarrativeEngineContext | useJourneyState |
|------------------------|-----------------|
| `journey` | `journey` |
| `journeyProgress` | `journeyProgress` |
| `isJourneyActive` | `isActive` |
| `startJourney(j)` | `startJourney(j)` |
| `advanceJourney()` | `advanceStep()` |
| `completeJourney()` | `completeJourney()` |
| `exitJourney()` | `exitJourney()` |
| - | `currentStep` |
| - | `progressPercent` |
| - | `isComplete` |
| - | `isJourneyCompleted(id)` |
| - | `completedJourneys` |

### Entropy State

| NarrativeEngineContext | useEntropyState |
|------------------------|-----------------|
| `entropy` | `entropy` |
| `entropyThreshold` | `entropyThreshold` |
| `updateEntropy(delta)` | `updateEntropy(delta)` |
| `resetEntropy()` | `resetEntropy()` |
| - | `isHighEntropy` |
| - | `entropyPercent` |

## Consumer Audit Process

### Step 1: Find Imports

```bash
# Find all NarrativeEngineContext imports
grep -r "useNarrativeEngine" --include="*.tsx" --include="*.ts" .
```

### Step 2: Analyze Usage

For each file, identify which values are destructured:
- `lens`, `setLens` → migrate to useLensState
- `journey*` → migrate to useJourneyState
- `entropy*` → migrate to useEntropyState

### Step 3: Categorize

| Component | Uses | Priority |
|-----------|------|----------|
| Component A | lens | High |
| Component B | journey | High |
| Component C | lens + entropy | High |
| Component D | messages only | Skip (not migrating) |

## Coexistence Strategy

During migration, both contexts exist:

```typescript
function HybridComponent() {
  // OLD: Still using NarrativeEngine for messages
  const { messages, sendMessage } = useNarrativeEngine();
  
  // NEW: Using Engagement for lens/journey/entropy
  const { actor } = useEngagement();
  const { lens } = useLensState({ actor });
  const { journey } = useJourneyState({ actor });
  
  return <div>...</div>;
}
```

**Warning:** Don't mix old and new for the SAME state:
```typescript
// BAD: Mixing contexts for lens
const { lens } = useNarrativeEngine();  // OLD lens
const { selectLens } = useLensState({ actor });  // NEW action
// These won't sync!
```

## Test Strategy

### E2E Migration Test

```typescript
// tests/e2e/engagement-migration.spec.ts

test.describe('engagement migration', () => {
  test('app loads with EngagementProvider', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // No console errors
  });

  test('lens state works via new hooks', async ({ page }) => {
    await page.goto('/?lens=engineer');
    // Verify lens applied
    await expect(page.locator('[data-testid="lens-indicator"]'))
      .toContainText('engineer');
  });
});
```

## File Organization

```
app/
├── layout.tsx          # Add EngagementProvider wrapper
└── ...

components/
├── Terminal/
│   └── Terminal.tsx    # Migrate engagement state
├── LensSelector/
│   └── LensSelector.tsx # Migrate lens state
└── ...

tests/e2e/
├── engagement-behaviors.spec.ts  # Existing
└── engagement-migration.spec.ts  # NEW
```

## Rollback Plan

If migration causes issues:

1. **Revert provider installation:**
```typescript
// Remove EngagementProvider from layout.tsx
// Components fall back to NarrativeEngineContext
```

2. **Revert component changes:**
```bash
git checkout -- components/affected-component.tsx
```

Both providers can coexist, so partial rollback is safe.
