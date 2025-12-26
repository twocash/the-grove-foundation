# Execution Prompt — Dashboard Sprout Widget v1

## Context

The Sprout System wiring is complete. Users can capture sprouts via `/sprout` and view them in Garden mode. This sprint surfaces sprout statistics in the Grove Project dashboard for at-a-glance visibility without mode-switching.

## Prerequisites

Before running this sprint, verify:
- [ ] `/sprout` command captures responses with toast
- [ ] `/garden` switches to Garden mode (not modal)
- [ ] `useSproutStats()` hook returns valid data
- [ ] localStorage has `grove-sprouts` key

## Repository Intelligence

Verify these locations before making changes:

```bash
# Dashboard location (find the project dashboard)
find src -name "*Dashboard*" -o -name "*Project*" | grep -v node_modules

# Existing widget patterns
ls src/workspace/components/

# Sprout stats hook
cat hooks/useSproutStats.ts

# Widget UI context (for mode switching)
cat src/widget/WidgetUIContext.tsx
```

## Design

```
┌─────────────────────────────────────────┐
│ 🌱 Your Garden                    View →│
├─────────────────────────────────────────┤
│                                         │
│   12        0         0                 │
│ Sprouts  Saplings   Trees              │
│                                         │
│ ─────────────────────────────────────── │
│ Latest: "The Ratchet effect explains..." │
│ 2 hours ago · #infrastructure           │
│                                         │
└─────────────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────────────┐
│ 🌱 Your Garden                    View →│
├─────────────────────────────────────────┤
│                                         │
│         Plant your first sprout         │
│                                         │
│   Use /sprout in Explore mode to        │
│   capture valuable insights             │
│                                         │
└─────────────────────────────────────────┘
```

## Implementation

### Phase 1: Create GardenWidget Component

**File:** `src/workspace/components/GardenWidget.tsx`

```typescript
// GardenWidget.tsx - Dashboard widget showing sprout statistics
// Sprint: dashboard-sprout-widget-v1

import { useSproutStats } from '../../../hooks/useSproutStats';

interface GardenWidgetProps {
  onViewGarden: () => void;
}

export function GardenWidget({ onViewGarden }: GardenWidgetProps) {
  const stats = useSproutStats();
  const latestSprout = stats.recentSprouts[0];
  const isEmpty = stats.totalSprouts === 0;

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-mono text-xs text-[var(--glass-text-muted)] uppercase tracking-wider">
            Your Garden
          </span>
        </div>
        <button
          onClick={onViewGarden}
          className="text-xs text-[var(--neon-cyan)] hover:underline"
        >
          View →
        </button>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="text-center py-4">
          <p className="text-[var(--glass-text-secondary)] text-sm mb-2">
            Plant your first sprout
          </p>
          <p className="text-[var(--glass-text-muted)] text-xs">
            Use <code className="text-[var(--neon-cyan)]">/sprout</code> in Explore mode
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-mono text-[var(--neon-green)]">
                {stats.totalSprouts}
              </div>
              <div className="text-[10px] text-[var(--glass-text-muted)] uppercase">
                Sprouts
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono text-[var(--glass-text-muted)]">
                0
              </div>
              <div className="text-[10px] text-[var(--glass-text-muted)] uppercase">
                Saplings
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono text-[var(--glass-text-muted)]">
                0
              </div>
              <div className="text-[10px] text-[var(--glass-text-muted)] uppercase">
                Trees
              </div>
            </div>
          </div>

          {/* Latest Sprout Preview */}
          {latestSprout && (
            <div className="border-t border-[var(--glass-border)] pt-3">
              <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-2 mb-1">
                "{latestSprout.response.slice(0, 100)}..."
              </p>
              <div className="flex items-center gap-2 text-[10px] text-[var(--glass-text-muted)]">
                <span>{formatTimeAgo(latestSprout.capturedAt)}</span>
                {latestSprout.tags.length > 0 && (
                  <span>· #{latestSprout.tags[0]}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default GardenWidget;
```

### Phase 2: Export from Components Index

**File:** `src/workspace/components/index.ts`

Add export:
```typescript
export { GardenWidget } from './GardenWidget';
```

### Phase 3: Integrate into Dashboard

**File:** Identify dashboard component (likely `src/workspace/views/ProjectView.tsx` or similar)

1. Import `GardenWidget` and `useWidgetUI`
2. Add widget to dashboard grid
3. Wire `onViewGarden` to `setMode('garden')`

```typescript
import { GardenWidget } from '../components/GardenWidget';
import { useWidgetUI } from '../../widget/WidgetUIContext';

// Inside component:
const { setMode } = useWidgetUI();

// In JSX:
<GardenWidget onViewGarden={() => setMode('garden')} />
```

### Phase 4: Handle Non-Widget Context

If the dashboard can be accessed outside WidgetUIProvider context, add fallback:

```typescript
import { useWidgetUI } from '../../widget/WidgetUIContext';
import { useNavigate } from 'react-router-dom';

// Inside component:
const navigate = useNavigate();
let setMode: ((mode: string) => void) | undefined;

try {
  const widgetUI = useWidgetUI();
  setMode = widgetUI.setMode;
} catch {
  // Not in widget context
}

const handleViewGarden = () => {
  if (setMode) {
    setMode('garden');
  } else {
    navigate('/terminal?mode=garden');
  }
};
```

## Build Gate

Run after each phase:
```bash
npm run build
```

Must pass before continuing.

## Smoke Test Checklist

- [ ] Dashboard loads without errors
- [ ] Widget shows "Plant your first sprout" when no sprouts exist
- [ ] Widget shows sprout count after capturing sprouts
- [ ] Widget shows latest sprout preview with timestamp
- [ ] "View →" navigates to Garden mode
- [ ] Widget matches glass-card aesthetic

## Forbidden Actions

- Do NOT modify sprout storage schema
- Do NOT modify useSproutStats hook (use as-is)
- Do NOT add new npm dependencies
- Do NOT skip build verification

## Files Summary

| File | Action |
|------|--------|
| `src/workspace/components/GardenWidget.tsx` | CREATE |
| `src/workspace/components/index.ts` | MODIFY (add export) |
| Dashboard component (TBD) | MODIFY (add widget) |

## Success Criteria

- [ ] Widget displays in dashboard
- [ ] Stats are accurate (matches Garden mode)
- [ ] Navigation to Garden works
- [ ] Empty state is helpful
- [ ] Build passes
- [ ] No console errors
