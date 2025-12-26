# Execution Prompt: route-selection-flow-v1

## Context

You are implementing route-based selection flow and Module Shell Architecture for The Grove Foundation.

**Problem:** Inline pickers (WelcomeInterstitial, JourneysModal) duplicate canonical routes, creating maintenance burden and inconsistent UX.

**Solution:** Replace inline pickers with navigation to canonical routes. Add flow params (returnTo, ctaLabel) for contextual CTAs. Implement ModuleHeader for consistent module experience.

## Project Location

```
C:\GitHub\the-grove-foundation
```

## Pre-Execution Checklist

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean
npm run build  # Should pass
```

## Patterns Implemented

- **Pattern 8:** Canonical Source Rendering (route-based selection)
- **Pattern 9:** Module Shell Architecture (ModuleHeader)

---

## Phase 1: Shared Components

### Step 1.1: Create useFlowParams Hook

**Create:** `src/shared/hooks/useFlowParams.ts`

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

**Verify:** `npm run build`

---

### Step 1.2: Create FlowCTA Component

**Create:** `src/shared/FlowCTA.tsx`

```typescript
// src/shared/FlowCTA.tsx
import { useNavigate } from 'react-router-dom';

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
      className={`
        glass-select-button glass-select-button--solid
        fixed bottom-6 right-6 px-6 py-3 text-sm font-medium
        shadow-lg shadow-[var(--neon-green)]/20
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className || ''}
      `}
    >
      {label}
    </button>
  );
}
```

**Verify:** `npm run build`

---

### Step 1.3: Create ModuleHeader Component

**Create:** `src/shared/ModuleHeader.tsx`

```typescript
// src/shared/ModuleHeader.tsx
import { type ReactNode } from 'react';
import { SearchInput } from './SearchInput';

interface ModuleHeaderProps {
  title?: string;
  description?: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  contextualFeatures?: ReactNode;
}

export function ModuleHeader({
  title,
  description,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  contextualFeatures,
}: ModuleHeaderProps) {
  return (
    <div className="mb-6">
      {/* Optional title/description */}
      {title && (
        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-3">
          {title}
        </h1>
      )}
      {description && (
        <p className="text-[var(--glass-text-muted)] mb-6 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}

      {/* Search / Features Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search */}
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange}
          />
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

**Verify:** `npm run build`

---

### Step 1.4: Update Shared Exports

**File:** `src/shared/index.ts`

**Add exports:**
```typescript
export { ModuleHeader } from './ModuleHeader';
export { FlowCTA } from './FlowCTA';
export { useFlowParams } from './hooks/useFlowParams';
export type { FlowParams } from './hooks/useFlowParams';
```

**Verify:** `npm run build`

---

## Phase 2: Lenses Route

### Step 2.1: Update LensPicker

**File:** `src/explore/LensPicker.tsx`

**Add imports:**
```typescript
import { useFlowParams, FlowCTA, ModuleHeader } from '../shared';
```

**Add to component:**
```typescript
const { returnTo, ctaLabel, isInFlow } = useFlowParams();
const { currentLens } = useEngagement();
```

**Add FlowCTA at end of return:**
```typescript
{isInFlow && currentLens && (
  <FlowCTA label={ctaLabel} returnTo={returnTo!} />
)}
```

**Replace header with ModuleHeader** (adapt to existing structure).

**Verify:** `npm run build`

---

## Phase 3: Journeys Route

### Step 3.1: Update JourneyList

**File:** `src/explore/JourneyList.tsx`

Same pattern as LensPicker:
1. Import useFlowParams, FlowCTA, ModuleHeader
2. Call useFlowParams()
3. Add FlowCTA when isInFlow && currentJourney
4. Replace header with ModuleHeader

**Verify:** `npm run build`

---

## Phase 4: Terminal Integration

### Step 4.1: Simplify WelcomeInterstitial

**File:** `components/Terminal/WelcomeInterstitial.tsx`

**Replace entire file with:**
```typescript
// WelcomeInterstitial - First-open experience for new Terminal users
// Sprint: route-selection-flow-v1 - Simplified to copy + CTA

import React from 'react';
import { useNavigate } from 'react-router-dom';

const WELCOME_COPY = `Welcome to The Grove.

You're inside the Terminal — engaging with your own personal AI. In this demo, we explore complex ideas through conversation. Everything written about The Grove Foundation is indexed here.

Choose a lens to shape how we explore the subject matter in a way most relevant to you. Each lens emphasizes different aspects of this groundbreaking initiative.`;

const WelcomeInterstitial: React.FC = () => {
  const navigate = useNavigate();
  
  const handleChooseLens = () => {
    navigate('/lenses?returnTo=/terminal&ctaLabel=Start%20Exploring');
  };
  
  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      {/* Welcome Copy */}
      <div className="max-w-xl text-center space-y-4 mb-8">
        {WELCOME_COPY.split('\n\n').map((paragraph, i) => (
          <p 
            key={i} 
            className={`font-serif text-sm leading-relaxed ${
              i === 0 
                ? 'text-[var(--glass-text-primary)] font-medium' 
                : 'text-[var(--glass-text-muted)]'
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>
      
      {/* CTA to Lenses */}
      <button
        onClick={handleChooseLens}
        className="glass-select-button glass-select-button--solid px-8 py-3 text-sm"
      >
        Choose Your Lens
      </button>
    </div>
  );
};

export default WelcomeInterstitial;
```

**Verify:** `npm run build`

---

### Step 4.2: Update TerminalFlow

**File:** `components/Terminal/TerminalFlow.tsx`

**Find WelcomeInterstitial usage and remove props:**
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

**Verify:** `npm run build`

---

### Step 4.3: Update LensBadge

**File:** `components/Terminal/LensBadge.tsx`

**Add prop and navigation:**
```typescript
import { useNavigate } from 'react-router-dom';

interface LensBadgeProps {
  // ... existing props
  navigateOnClick?: boolean;
}

// In component:
const navigate = useNavigate();

const handleClick = () => {
  if (navigateOnClick) {
    navigate('/lenses?returnTo=/terminal&ctaLabel=Apply');
  } else if (onClick) {
    onClick();
  }
};
```

**Update usage in Terminal to pass navigateOnClick={true}**

**Verify:** `npm run build`

---

### Step 4.4: Replace JourneysModal with Navigation

**File:** `components/Terminal/TerminalHeader.tsx`

**Remove:**
- JourneysModal import
- Modal state
- Modal render

**Replace journey button:**
```typescript
<button 
  onClick={() => navigate('/journeys?returnTo=/terminal&ctaLabel=Begin%20Journey')}
  ...
>
  Journeys
</button>
```

**Verify:** `npm run build`

---

## Phase 5: Cleanup

### Step 5.1: Delete JourneysModal

```bash
# Delete the file
rm components/Terminal/Modals/JourneysModal.tsx

# Update Modals/index.ts to remove export
```

**Verify:** `npm run build`

---

### Step 5.2: Remove LensGrid Embedded Variant

**File:** `components/Terminal/LensGrid.tsx`

1. Remove `embedded` prop from interface
2. Remove `embedded` parameter from function
3. Remove all `embedded ?` conditional styling
4. Use glass tokens for all styling

**Verify:** `npm run build`

---

## Phase 6: Manual Verification

1. Start dev server: `npm run dev`
2. Test flows:
   - [ ] New user: /terminal → CTA → /lenses → select → "Start Exploring" → /terminal
   - [ ] Change lens: /terminal → badge → /lenses → select → "Apply" → /terminal
   - [ ] Browse: /lenses direct → select → no CTA
   - [ ] Journey: /terminal → badge → /journeys → select → CTA → /terminal

---

## Final Commit

```bash
git add .
git commit -m "feat: implement route-based selection flow and Module Shell Architecture

BREAKING: WelcomeInterstitial no longer accepts lens props
BREAKING: JourneysModal removed

- Add useFlowParams hook for flow param parsing
- Add FlowCTA component for contextual navigation
- Add ModuleHeader component for consistent module experience
- Update LensPicker with flow support
- Update JourneyList with flow support
- Simplify WelcomeInterstitial to copy + CTA
- Replace JourneysModal with route navigation
- Remove LensGrid embedded variant

Implements: Pattern 8 (Canonical Source Rendering)
Implements: Pattern 9 (Module Shell Architecture)
Sprint: route-selection-flow-v1"
```

---

## Troubleshooting

### Build fails after WelcomeInterstitial change
- Check TerminalFlow for remaining prop usage
- Check widget/ChatView if it uses WelcomeInterstitial

### Navigation doesn't work
- Ensure useNavigate is imported from 'react-router-dom'
- Check route is wrapped in Router context

### FlowCTA not showing
- Check isInFlow === true (verify URL has returnTo)
- Check currentLens/currentJourney is set after selection

### State lost on navigation
- Engagement machine should persist
- Check useEngagement hook is at app level
