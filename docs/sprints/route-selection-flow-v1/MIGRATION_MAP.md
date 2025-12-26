# Migration Map: route-selection-flow-v1

## Overview

| Action | Count |
|--------|-------|
| Create | 4 |
| Modify | 8 |
| Delete | 1 |

## File Changes

### Create: src/shared/ModuleHeader.tsx

**Purpose:** Reusable module header with search + contextual features.

```typescript
// src/shared/ModuleHeader.tsx
import { type ReactNode } from 'react';
import { SearchInput } from './SearchInput';
import { FilterButton, FilterOption } from './FilterButton';
import { SortButton, SortOption } from './SortButton';

interface ModuleHeaderProps {
  title?: string;
  description?: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions?: FilterOption[];
  activeFilters?: string[];
  onFilterChange?: (filters: string[]) => void;
  sortOptions?: SortOption[];
  activeSort?: string;
  onSortChange?: (sortId: string) => void;
  contextualFeatures?: ReactNode;
}

export function ModuleHeader({ ... }: ModuleHeaderProps) {
  return (
    <div className="mb-6">
      {/* Optional title/description */}
      {title && (
        <>
          <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-3">
            {title}
          </h1>
          {description && (
            <p className="text-[var(--glass-text-muted)] mb-8 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </>
      )}

      {/* Search / Filter / Sort / Features Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search + Filter + Sort */}
        <div className="flex items-center gap-2 flex-1">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange}
            className="max-w-xs"
          />
          {filterOptions && ...}
          {sortOptions && ...}
        </div>
        
        {/* Right: Contextual Features */}
        {contextualFeatures && (
          <div className="flex items-center gap-2">
            {contextualFeatures}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Lines:** ~80

---

### Create: src/shared/hooks/useFlowParams.ts

**Purpose:** Parse and manage selection flow params from URL.

```typescript
// src/shared/hooks/useFlowParams.ts
import { useSearchParams } from 'react-router-dom';

export interface FlowParams {
  returnTo: string | null;
  ctaLabel: string;
  isInFlow: boolean;
}

export function useFlowParams(): FlowParams {
  const [searchParams] = useSearchParams();
  
  const returnTo = searchParams.get('returnTo');
  const ctaLabel = searchParams.get('ctaLabel') || 'Continue';
  
  return {
    returnTo,
    ctaLabel,
    isInFlow: !!returnTo,
  };
}
```

**Lines:** ~20

---

### Create: src/shared/FlowCTA.tsx

**Purpose:** Contextual CTA for selection flows.

```typescript
// src/shared/FlowCTA.tsx
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface FlowCTAProps {
  label: string;
  returnTo: string;
  disabled?: boolean;
  className?: string;
}

export function FlowCTA({ label, returnTo, disabled, className }: FlowCTAProps) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(returnTo)}
      disabled={disabled}
      className={cn(
        'glass-select-button glass-select-button--solid',
        'fixed bottom-6 right-6 px-6 py-3 text-sm font-medium',
        'shadow-lg shadow-[var(--neon-green)]/20',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {label}
    </button>
  );
}
```

**Lines:** ~30

---

### Create: src/shared/index.ts (update exports)

**Changes:** Add exports for new components.

```typescript
// Add to existing exports
export { ModuleHeader } from './ModuleHeader';
export { FlowCTA } from './FlowCTA';
export { useFlowParams } from './hooks/useFlowParams';
```

---

### Modify: components/Terminal/WelcomeInterstitial.tsx

**Purpose:** Remove embedded LensGrid, add CTA to /lenses.

**Before (92 lines):**
```typescript
import LensGrid from './LensGrid';
// ... imports LensGrid and renders it inline
```

**After (~50 lines):**
```typescript
import { useNavigate } from 'react-router-dom';

const WelcomeInterstitial: React.FC<WelcomeInterstitialProps> = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      {/* Welcome Copy */}
      <div className="max-w-xl text-center space-y-4 mb-8">
        {WELCOME_COPY.split('\n\n').map((p, i) => (
          <p key={i} className={...}>{p}</p>
        ))}
      </div>
      
      {/* CTA to Lenses */}
      <button
        onClick={() => navigate('/lenses?returnTo=/terminal&ctaLabel=Start%20Exploring')}
        className="glass-select-button glass-select-button--solid px-8 py-3"
      >
        Choose Your Lens
      </button>
    </div>
  );
};
```

**Props removed:** personas, customLenses, onSelect, onCreateCustomLens, onDeleteCustomLens, showCreateOption

---

### Modify: src/explore/LensPicker.tsx

**Purpose:** Add flow param support and FlowCTA.

**Changes:**
1. Import useFlowParams, FlowCTA
2. Parse flow params on mount
3. Render FlowCTA when isInFlow && selectedLens

```typescript
import { useFlowParams, FlowCTA } from '../shared';

export function LensPicker() {
  const { returnTo, ctaLabel, isInFlow } = useFlowParams();
  const { currentLens } = useEngagement();
  
  return (
    <>
      <ModuleHeader
        title="Lenses"
        description="Choose how to explore Grove's ideas"
        searchPlaceholder="Filter lenses..."
        ...
      />
      
      <LensGrid ... />
      
      {isInFlow && currentLens && (
        <FlowCTA label={ctaLabel} returnTo={returnTo!} />
      )}
    </>
  );
}
```

---

### Modify: src/explore/JourneyList.tsx

**Purpose:** Add flow param support and FlowCTA.

**Changes:** Same pattern as LensPicker.

---

### Modify: components/Terminal/LensBadge.tsx

**Purpose:** Add navigateOnClick prop for route-based flow.

**Changes:**
```typescript
interface LensBadgeProps {
  lens: Persona | CustomLens | null;
  onClick?: () => void;
  navigateOnClick?: boolean;  // NEW
}

function LensBadge({ lens, onClick, navigateOnClick }: LensBadgeProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (navigateOnClick) {
      navigate('/lenses?returnTo=/terminal&ctaLabel=Apply');
    } else {
      onClick?.();
    }
  };
  // ...
}
```

---

### Modify: components/Terminal/TerminalHeader.tsx

**Purpose:** Replace JourneysModal with navigation.

**Before:**
```typescript
import { JourneysModal } from './Modals';
// ... renders modal on button click
```

**After:**
```typescript
// Remove JourneysModal import
<button onClick={() => navigate('/journeys?returnTo=/terminal&ctaLabel=Begin%20Journey')}>
  Journeys
</button>
```

---

### Modify: components/Terminal/TerminalFlow.tsx

**Purpose:** Update WelcomeInterstitial usage (remove props).

**Changes:**
```typescript
// Before
<WelcomeInterstitial
  personas={personas}
  customLenses={customLenses}
  onSelect={handleLensSelect}
  ...
/>

// After
<WelcomeInterstitial />
```

---

### Delete: components/Terminal/Modals/JourneysModal.tsx

**Purpose:** No longer needed; replaced by route navigation.

**Note:** Update Modals/index.ts to remove export.

---

### Modify: components/Terminal/LensGrid.tsx

**Purpose:** Remove `embedded` prop and variant styling.

**Changes:**
1. Remove `embedded` prop from interface
2. Remove embedded styling branches
3. Simplify to single glass token styling

**Note:** This can happen after WelcomeInterstitial no longer uses LensGrid.

---

## Execution Order

1. **Create shared components** (no dependencies)
   - ModuleHeader.tsx
   - useFlowParams.ts
   - FlowCTA.tsx
   - Update shared/index.ts

2. **Update canonical routes** (use new components)
   - LensPicker.tsx
   - JourneyList.tsx

3. **Update Terminal** (remove inline pickers)
   - WelcomeInterstitial.tsx
   - LensBadge.tsx
   - TerminalHeader.tsx
   - TerminalFlow.tsx

4. **Cleanup** (remove dead code)
   - Delete JourneysModal.tsx
   - Remove embedded variant from LensGrid.tsx

## Rollback Plan

1. Revert WelcomeInterstitial to inline LensGrid
2. Restore JourneysModal
3. Remove flow param support from routes
4. Keep ModuleHeader (no harm)

## Verification Commands

```bash
# After each phase
npm run build
npm run lint

# Final verification
npm run test
npm run build
```
