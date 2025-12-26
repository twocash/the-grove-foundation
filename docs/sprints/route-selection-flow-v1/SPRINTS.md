# Sprint Breakdown: route-selection-flow-v1

## Overview

| Epic | Stories | Estimated |
|------|---------|-----------|
| Epic 1: Shared Components | 4 | 1 hour |
| Epic 2: Lenses Route Flow | 2 | 45 min |
| Epic 3: Journeys Route Flow | 2 | 30 min |
| Epic 4: Terminal Integration | 4 | 1 hour |
| Epic 5: Cleanup | 2 | 30 min |
| Epic 6: Verification | 2 | 30 min |
| **Total** | **16** | **~4.5 hours** |

---

## Epic 1: Shared Components

Create reusable components for route-based selection flow.

### Story 1.1: Create useFlowParams Hook

**Task:** Create hook to parse selection flow params from URL.

**File:** `src/shared/hooks/useFlowParams.ts`

**Implementation:**
```typescript
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

**Build Gate:** `npm run build`

---

### Story 1.2: Create FlowCTA Component

**Task:** Create contextual CTA for selection flows.

**File:** `src/shared/FlowCTA.tsx`

**Implementation:** See MIGRATION_MAP.md

**Build Gate:** `npm run build`

---

### Story 1.3: Create ModuleHeader Component

**Task:** Create reusable module header with search + contextual features.

**File:** `src/shared/ModuleHeader.tsx`

**Implementation:** See ARCHITECTURE.md

**Build Gate:** `npm run build`

---

### Story 1.4: Update Shared Exports

**Task:** Export new components from shared/index.ts.

**File:** `src/shared/index.ts`

**Changes:**
```typescript
export { ModuleHeader } from './ModuleHeader';
export { FlowCTA } from './FlowCTA';
export { useFlowParams } from './hooks/useFlowParams';
export type { FlowParams } from './hooks/useFlowParams';
```

**Build Gate:** `npm run build`

---

## Epic 2: Lenses Route Flow

Add flow param support to /lenses route.

### Story 2.1: Update LensPicker with Flow Support

**Task:** Add useFlowParams and FlowCTA to LensPicker.

**File:** `src/explore/LensPicker.tsx`

**Changes:**
1. Import useFlowParams, FlowCTA
2. Call useFlowParams() in component
3. Render FlowCTA when isInFlow && currentLens

**Build Gate:** `npm run build`

---

### Story 2.2: Add ModuleHeader to LensPicker

**Task:** Replace existing header with ModuleHeader.

**File:** `src/explore/LensPicker.tsx`

**Changes:**
```typescript
<ModuleHeader
  title="Lenses"
  description="Choose how to explore Grove's ideas. Each lens emphasizes different aspects."
  searchPlaceholder="Filter lenses..."
  searchValue={filter}
  onSearchChange={setFilter}
  contextualFeatures={
    <>
      <button onClick={openCreateLens}>Create Lens</button>
      <ViewToggle mode={viewMode} onChange={setViewMode} />
    </>
  }
/>
```

**Build Gate:** `npm run build`

---

## Epic 3: Journeys Route Flow

Add flow param support to /journeys route.

### Story 3.1: Update JourneyList with Flow Support

**Task:** Add useFlowParams and FlowCTA to JourneyList.

**File:** `src/explore/JourneyList.tsx`

**Changes:** Same pattern as LensPicker.

**Build Gate:** `npm run build`

---

### Story 3.2: Add ModuleHeader to JourneyList

**Task:** Replace existing header with ModuleHeader.

**File:** `src/explore/JourneyList.tsx`

**Changes:**
```typescript
<ModuleHeader
  title="Journeys"
  description="Structured explorations through Grove's key concepts."
  searchPlaceholder="Filter journeys..."
  searchValue={filter}
  onSearchChange={setFilter}
  contextualFeatures={
    <>
      <FilterButton options={progressOptions} ... />
    </>
  }
/>
```

**Build Gate:** `npm run build`

---

## Epic 4: Terminal Integration

Update Terminal to use route-based flows.

### Story 4.1: Simplify WelcomeInterstitial

**Task:** Remove embedded LensGrid, add CTA to /lenses.

**File:** `components/Terminal/WelcomeInterstitial.tsx`

**Changes:**
1. Remove LensGrid import
2. Remove personas/customLenses/onSelect props
3. Add useNavigate
4. Replace LensGrid with CTA button
5. Update styling for centered layout

**Build Gate:** `npm run build`

---

### Story 4.2: Update TerminalFlow Props

**Task:** Remove unused props from WelcomeInterstitial usage.

**File:** `components/Terminal/TerminalFlow.tsx`

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

**Build Gate:** `npm run build`

---

### Story 4.3: Update LensBadge for Navigation

**Task:** Add navigateOnClick prop to LensBadge.

**File:** `components/Terminal/LensBadge.tsx`

**Changes:**
1. Add navigateOnClick prop
2. Import useNavigate
3. Handle click to navigate when prop is true

**Build Gate:** `npm run build`

---

### Story 4.4: Replace JourneysModal with Navigation

**Task:** Update TerminalHeader to navigate instead of showing modal.

**File:** `components/Terminal/TerminalHeader.tsx`

**Changes:**
1. Remove JourneysModal import and state
2. Update journey button to navigate to /journeys

**Build Gate:** `npm run build`

---

## Epic 5: Cleanup

Remove dead code and simplify.

### Story 5.1: Delete JourneysModal

**Task:** Remove JourneysModal component.

**Files:**
- Delete `components/Terminal/Modals/JourneysModal.tsx`
- Update `components/Terminal/Modals/index.ts`

**Build Gate:** `npm run build`

---

### Story 5.2: Remove LensGrid Embedded Variant

**Task:** Remove embedded prop and styling from LensGrid.

**File:** `components/Terminal/LensGrid.tsx`

**Changes:**
1. Remove `embedded` prop from interface
2. Remove embedded-specific styling branches
3. Simplify to single glass token styling

**Build Gate:** `npm run build`

---

## Epic 6: Verification

### Story 6.1: Manual Testing

**Checklist:**
- [ ] First-time user: /terminal → WelcomeInterstitial → CTA → /lenses → select → CTA → /terminal (lens active)
- [ ] Change lens: /terminal → lens badge → /lenses → select → CTA → /terminal (new lens)
- [ ] Browse lenses: /lenses direct → select → no CTA (browse mode)
- [ ] Journey flow: /terminal → journey badge → /journeys → select → CTA → /terminal
- [ ] Back button works in all flows
- [ ] State persists through navigation

---

### Story 6.2: Build & Lint Verification

**Commands:**
```bash
npm run lint
npm run build
npm run test
```

**Expected:** All pass.

---

## Commit Strategy

### Atomic Commits

1. **feat(shared): add route-based selection flow components**
   - useFlowParams, FlowCTA, ModuleHeader
   
2. **feat(lenses): add flow param support and ModuleHeader**
   - LensPicker updates
   
3. **feat(journeys): add flow param support and ModuleHeader**
   - JourneyList updates
   
4. **refactor(terminal): use route-based lens selection**
   - WelcomeInterstitial, TerminalFlow, LensBadge
   
5. **refactor(terminal): use route-based journey selection**
   - TerminalHeader, remove JourneysModal
   
6. **chore: remove LensGrid embedded variant**
   - LensGrid simplification

---

## Definition of Done

- [ ] All build gates pass
- [ ] Manual testing checklist complete
- [ ] All commits pushed
- [ ] DEVLOG.md updated
- [ ] PROJECT_PATTERNS.md already updated with Patterns 8 & 9
