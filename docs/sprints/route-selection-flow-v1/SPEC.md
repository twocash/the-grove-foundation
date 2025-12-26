# Specification: route-selection-flow-v1

## Problem Statement

Grove modules use inline pickers for lens and journey selection. This creates:
- Duplicate components (LensGrid in WelcomeInterstitial vs LensPicker)
- Divergent styling (embedded variants)
- State complexity (preview states, modal overlays)
- Inconsistent UX across modules
- Maintenance burden (fix in multiple places)

## Goals

1. **Route-Based Selection** — Lens and journey selection happens at canonical routes
2. **Module Shell Architecture** — Consistent header pattern across all modules
3. **Flow Parameters** — Routes accept returnTo/ctaLabel for contextual navigation
4. **Simplify WelcomeInterstitial** — Remove embedded picker, use CTA
5. **Eliminate JourneysModal** — Use navigation instead of modal

## Non-Goals

- Changing lens/journey data models
- Modifying the actual selection UI in canonical routes
- Adding new lens or journey features
- Changing WorkspaceHeader or FoundationHeader

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Module headers | CollectionHeader | Add contextualFeatures slot |
| Token styling | Pattern 4 (Tokens) | Use existing `--glass-*` tokens |
| Route navigation | React Router | Add search param handling |

## New Patterns Implemented

| Pattern | Description |
|---------|-------------|
| Pattern 8: Canonical Source Rendering | Route-based selection flow |
| Pattern 9: Module Shell Architecture | ModuleHeader with search + features |

## Canonical Source Audit

| Capability | Canonical Home | Current Violation | Fix |
|------------|----------------|-------------------|-----|
| Lens selection | `/lenses` (LensPicker) | WelcomeInterstitial embeds LensGrid | Remove inline, CTA to /lenses |
| Journey selection | `/journeys` (JourneyList) | JourneysModal duplicates selection | Remove modal, navigate to /journeys |
| Module header | CollectionHeader | Missing contextual features | Create ModuleHeader extending it |

## Flow Parameters Specification

```typescript
interface SelectionFlowParams {
  returnTo?: string;           // URL to navigate after selection
  ctaLabel?: string;           // Button label (default: "Continue")
  ctaCondition?: 'on-select';  // When to show CTA
}
```

**URL Examples:**
- `/lenses?returnTo=/terminal&ctaLabel=Start%20Exploring`
- `/journeys?returnTo=/terminal&ctaLabel=Begin%20Journey`

**Behavior:**
1. Route parses search params on mount
2. If `returnTo` present, render contextual CTA after user selects
3. CTA navigates to `returnTo` URL
4. If no `returnTo`, selection applies but no CTA (browsing mode)

## User Flows

### First-Time Terminal User
```
/terminal (no lens active)
    ↓
WelcomeInterstitial shows copy + "Choose Your Lens" button
    ↓
Click → navigate to /lenses?returnTo=/terminal&ctaLabel=Start%20Exploring
    ↓
/lenses shows lens grid + (after selection) "Start Exploring" button
    ↓
Click → navigate to /terminal (lens now active in state)
```

### Returning User Changes Lens
```
/terminal (lens active) → Click lens badge in header
    ↓
Navigate to /lenses?returnTo=/terminal&ctaLabel=Apply
    ↓
Select new lens → "Apply" button appears
    ↓
Click → navigate to /terminal (new lens active)
```

### Browse Lenses (No Flow)
```
/lenses (direct navigation)
    ↓
Browse, select lens (applies immediately to state)
    ↓
No CTA shown (user is browsing, not in flow)
```

## Acceptance Criteria

### Route-Based Selection
- [ ] `/lenses` accepts `returnTo` and `ctaLabel` params
- [ ] `/journeys` accepts `returnTo` and `ctaLabel` params
- [ ] CTA appears only after selection when flow params present
- [ ] CTA navigates to returnTo URL
- [ ] Selection persists through navigation (lens/journey state)

### Module Shell Architecture
- [ ] ModuleHeader component created
- [ ] ModuleHeader has search slot (left)
- [ ] ModuleHeader has contextual features slot (right)
- [ ] ModuleHeader used by /lenses
- [ ] ModuleHeader used by /journeys

### WelcomeInterstitial Simplification
- [ ] WelcomeInterstitial no longer imports LensGrid
- [ ] WelcomeInterstitial shows "Choose Your Lens" CTA
- [ ] CTA navigates to /lenses with flow params
- [ ] Welcome copy preserved

### Journey Modal Removal
- [ ] JourneysModal removed from Terminal
- [ ] Terminal header journey button navigates to /journeys
- [ ] /journeys supports flow params

### Terminal Header Integration
- [ ] Lens badge in header shows active lens
- [ ] Clicking lens badge navigates to /lenses with returnTo
- [ ] Journey badge shows active journey
- [ ] Clicking journey badge navigates to /journeys with returnTo

## Test Plan

1. **E2E: First-time flow** — New user → WelcomeInterstitial → /lenses → /terminal
2. **E2E: Change lens flow** — Active terminal → lens badge → /lenses → /terminal
3. **E2E: Browse mode** — Direct to /lenses → select → no CTA
4. **Unit: Flow params** — Parse returnTo, ctaLabel from URL
5. **Unit: ModuleHeader** — Renders search + features slots

## Out of Scope

- Modifying lens card styling (handled in lens-hover-fix-v1)
- Adding search functionality to Terminal module
- Changing workspace layout
- Foundation console modifications
