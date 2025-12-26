# Architecture: route-selection-flow-v1

## Current State

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT: INLINE SELECTION                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /terminal                                                       │
│  ├── WelcomeInterstitial                                         │
│  │   ├── Welcome copy                                            │
│  │   └── LensGrid (EMBEDDED) ← Duplicate rendering context       │
│  │       ├── Preview state management                            │
│  │       └── Select handler                                      │
│  └── TerminalHeader                                              │
│      └── JourneysModal (MODAL) ← Duplicate selection logic       │
│                                                                  │
│  /lenses                                                         │
│  └── LensPicker                                                  │
│      └── LensGrid (CANONICAL) ← Different styling                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Target State

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET: ROUTE-BASED FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /terminal (no lens)                                             │
│  └── WelcomeInterstitial                                         │
│      ├── Welcome copy                                            │
│      └── CTA: "Choose Your Lens" → /lenses?returnTo=/terminal    │
│                                                                  │
│  /terminal (lens active)                                         │
│  └── TerminalHeader                                              │
│      ├── LensBadge → /lenses?returnTo=/terminal                  │
│      └── JourneyBadge → /journeys?returnTo=/terminal             │
│                                                                  │
│  /lenses                                                         │
│  └── LensesView                                                  │
│      ├── ModuleHeader (search + features)                        │
│      ├── LensGrid (SINGLE CANONICAL)                             │
│      └── FlowCTA (if returnTo present)                           │
│                                                                  │
│  /journeys                                                       │
│  └── JourneysView                                                │
│      ├── ModuleHeader (search + features)                        │
│      ├── JourneyList (SINGLE CANONICAL)                          │
│      └── FlowCTA (if returnTo present)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### ModuleHeader

Extends CollectionHeader with contextual features slot.

```typescript
// src/shared/ModuleHeader.tsx

interface ModuleHeaderProps {
  // Title section (optional - some modules skip this)
  title?: string;
  description?: string;
  
  // Search (always left)
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  
  // Contextual features (always right)
  contextualFeatures?: React.ReactNode;
  
  // Optional filter/sort (between search and features)
  filterOptions?: FilterOption[];
  sortOptions?: SortOption[];
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Title (optional)]                                              │
│  [Description (optional)]                                        │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Search...] [Filter ▼] [Sort ▼]    [Contextual Features]    │
└─────────────────────────────────────────────────────────────────┘
```

### useFlowParams Hook

Parses and manages route-based selection flow.

```typescript
// src/shared/hooks/useFlowParams.ts

interface FlowParams {
  returnTo: string | null;
  ctaLabel: string;
  isInFlow: boolean;
}

function useFlowParams(): FlowParams {
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

### FlowCTA Component

Contextual CTA shown when in selection flow.

```typescript
// src/shared/FlowCTA.tsx

interface FlowCTAProps {
  label: string;
  returnTo: string;
  disabled?: boolean;
  className?: string;
}

function FlowCTA({ label, returnTo, disabled, className }: FlowCTAProps) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(returnTo)}
      disabled={disabled}
      className={cn(
        'glass-select-button glass-select-button--solid',
        'fixed bottom-6 right-6 px-6 py-3 text-sm',
        className
      )}
    >
      {label}
    </button>
  );
}
```

### LensBadge Enhancement

Terminal header badge that navigates to canonical route.

```typescript
// components/Terminal/LensBadge.tsx (enhanced)

interface LensBadgeProps {
  lens: Persona | CustomLens | null;
  onClick?: () => void;
  navigateOnClick?: boolean;  // NEW: enable route-based flow
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
  
  // ... render
}
```

## Data Flow

### Selection Flow with Return

```
User at /terminal (no lens)
    │
    ▼
WelcomeInterstitial renders
    │
    ▼
Click "Choose Your Lens"
    │
    ▼
navigate('/lenses?returnTo=/terminal&ctaLabel=Start%20Exploring')
    │
    ▼
/lenses mounts, useFlowParams() returns { isInFlow: true }
    │
    ▼
User clicks lens card
    │
    ▼
Engagement machine: send({ type: 'SELECT_LENS', lensId })
    │
    ▼
FlowCTA appears: "Start Exploring"
    │
    ▼
Click CTA → navigate('/terminal')
    │
    ▼
/terminal mounts, lens is active in engagement machine state
```

### State Persistence

Lens and journey state persists in engagement machine (XState), which survives navigation. No need to pass state through URL—URL is for flow control only.

```typescript
// State lives in engagement machine
const { currentLens, currentJourney } = useEngagement();

// URL is for flow control
const { returnTo, ctaLabel, isInFlow } = useFlowParams();
```

## Module Shell Implementation

### Terminal Module

```typescript
// ModuleHeader usage in Terminal
<ModuleHeader
  searchPlaceholder="Search conversation..."
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  contextualFeatures={
    <>
      <LensBadge lens={currentLens} navigateOnClick />
      <JourneyBadge journey={currentJourney} navigateOnClick />
      <button onClick={clearChat}>Clear</button>
    </>
  }
/>
```

### Lenses Module

```typescript
// ModuleHeader usage in Lenses
<ModuleHeader
  title="Lenses"
  description="Choose how to explore Grove's ideas"
  searchPlaceholder="Filter lenses..."
  searchValue={filter}
  onSearchChange={setFilter}
  contextualFeatures={
    <>
      <button onClick={openCreateLens}>Create Lens</button>
      <SortButton options={sortOptions} />
      <ViewToggle mode={viewMode} onChange={setViewMode} />
    </>
  }
/>

{/* Show FlowCTA if in selection flow and lens selected */}
{isInFlow && selectedLens && (
  <FlowCTA label={ctaLabel} returnTo={returnTo} />
)}
```

## DEX Compliance

### Declarative Sovereignty
- Flow parameters are URL-based (declarative)
- ModuleHeader accepts features as ReactNode slot (configuration)
- CTA label is configurable per flow

### Capability Agnosticism
- Flow works regardless of AI model
- Selection persists in XState machine (model-independent)

### Provenance
- Selection tracked via engagement machine events
- Flow transitions visible in URL history

### Organic Scalability
- New modules adopt ModuleHeader pattern
- New selection types add flow param support
- Pattern generalizes to any selection → return flow
