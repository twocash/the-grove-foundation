# SPEC.md
# Sprint: journey-content-dex-v1
# Date: 2024-12-28

## Overview

Implement DEX-compliant journey content rendering. When a user clicks a journey pill, they should see the current waypoint content with schema-driven presentation and actions.

## Goals

| ID | Goal | Trellis Alignment |
|----|------|-------------------|
| G1 | Journey content renders when `isJourneyActive` | Primary Directive |
| G2 | Display configuration lives in schema | Pillar I: Declarative Sovereignty |
| G3 | Actions defined declaratively, rendered dynamically | Pillar I |
| G4 | Waypoint interactions capture provenance | Pillar III |
| G5 | Support future branching (don't block it) | Pillar IV |

## Non-Goals

- Deprecating old `JourneyCard` component (separate sprint)
- Implementing actual branching logic (schema supports it, UI doesn't yet)
- Visual design system overhaul
- Journey analytics dashboard

## User Stories

### US-1: See Journey Content
**As a** user who clicked a journey pill  
**I want to** see the current waypoint content  
**So that** I understand what this journey is about and how to proceed

### US-2: Explore a Waypoint
**As a** user viewing a waypoint  
**I want to** send the waypoint prompt to the chat  
**So that** I can learn about this topic in depth

### US-3: Advance Through Journey
**As a** user who has explored a waypoint  
**I want to** move to the next waypoint  
**So that** I can continue the guided journey

### US-4: Exit Journey
**As a** user in a journey  
**I want to** exit at any time  
**So that** I can explore freely without constraint

### US-5: Complete Journey
**As a** user who reaches the final waypoint  
**I want to** see a completion message  
**So that** I feel a sense of accomplishment

## Schema Extension

### Current Journey Schema
```typescript
interface Journey {
  id: string;
  title: string;
  description: string;
  waypoints: JourneyWaypoint[];
  completionMessage: string;
  // ... other fields
}
```

### Extended Journey Schema (DEX-Compliant)
```typescript
interface Journey {
  // ... existing fields
  
  display?: JourneyDisplayConfig;
}

interface JourneyDisplayConfig {
  showProgressBar?: boolean;        // default: true
  showExitButton?: boolean;         // default: true
  showWaypointCount?: boolean;      // default: true
  progressBarColor?: string;        // default: 'emerald'
  
  labels?: {
    sectionTitle?: string;          // default: 'Journey'
    exitButton?: string;            // default: 'Exit'
  };
}

interface JourneyWaypoint {
  // ... existing fields
  
  actions?: WaypointAction[];       // default: [explore, advance]
}

interface WaypointAction {
  type: 'explore' | 'advance' | 'complete' | 'branch' | 'custom';
  label: string;
  variant?: 'primary' | 'secondary' | 'subtle';
  
  // For 'branch' type
  targetWaypoint?: string;
  
  // For 'custom' type
  command?: string;
}
```

## Acceptance Criteria

### AC-1: Content Renders
- [ ] When `isJourneyActive === true`, JourneyContent component renders
- [ ] Component displays journey title, waypoint title, waypoint prompt
- [ ] Progress bar shows current position

### AC-2: Schema-Driven Display
- [ ] `journey.display.showProgressBar: false` hides progress bar
- [ ] `journey.display.labels.sectionTitle` changes header text
- [ ] Default values work when `display` is undefined

### AC-3: Schema-Driven Actions
- [ ] If `waypoint.actions` undefined, show default [Explore, Next/Complete]
- [ ] If `waypoint.actions` defined, render only those actions
- [ ] Action `variant` maps to visual style

### AC-4: Provenance Captured
- [ ] "Explore" action sends prompt with journey/waypoint provenance
- [ ] Provenance structure matches SproutProvenance schema

### AC-5: State Transitions
- [ ] "Advance" calls `advanceStep()` on XState
- [ ] "Exit" calls `exitJourney()` on XState
- [ ] Final waypoint shows "Complete" instead of "Next"
- [ ] Completion triggers `completeJourney()` and shows completion modal

### AC-6: Non-Breaking
- [ ] Old JourneyCard still works for Card-based journeys
- [ ] Existing journey definitions work without `display` config
- [ ] All 217+ tests pass

## Technical Requirements

### TR-1: Component Location
`components/Terminal/JourneyContent.tsx`

### TR-2: Schema Location
Extend `src/core/schema/journey.ts`

### TR-3: Integration Point
`components/Terminal.tsx` render logic, before `JourneyCard` check

### TR-4: Provenance Integration
Use existing `SproutProvenance` type from `src/core/schema/sprout.ts`

## Test Strategy

### Unit Tests
- JourneyContent renders with minimal props
- JourneyContent respects display config
- JourneyContent renders custom actions
- Default actions work when none specified

### Integration Tests
- Journey click → content appears
- Explore action → prompt sent with provenance
- Advance action → progress increments
- Exit action → journey cleared

### E2E Tests
- Already have `journey-screenshots.spec.ts` ready
- Will capture baselines after this sprint

## Success Metrics

1. **Functional:** Journey pills lead to visible content
2. **DEX Compliance:** Non-dev can change labels via schema
3. **Test Coverage:** New component has unit tests
4. **No Regressions:** 217+ existing tests pass
