# Specification — Active Grove E2E Test Suite v2

## Overview

Enhance the Active Grove E2E tests to validate the complete lens-reactive content transformation flow, including XState integration, quantum interface hooks, and content rail animations.

## Background

Epic 7 migrated state management from NarrativeEngineContext to XState-based engagement hooks. Production bugs revealed gaps in test coverage where:

1. `useQuantumInterface` read stale `session.activeLens` instead of XState machine state
2. Left column content transformation failed silently (no visual feedback)
3. Terminal opened but content rail didn't trigger `WaveformCollapse` animation

This sprint adds comprehensive E2E tests to prevent regression.

## Goals

1. **Validate lens selection triggers content transformation** — Seedling click → XState update → quantum interface → new content
2. **Test WaveformCollapse animation triggers** — GenesisPage state machine transitions visible
3. **Verify data flow integrity** — From `engSelectLens()` through `useLensState()` to `useQuantumInterface()`
4. **Simulate realistic user behaviors** — Multi-lens switching, page reloads, URL hydration
5. **Add health check integration** — Active Grove checks in health-config.json

## Non-Goals

- Testing LLM output quality (mock Gemini responses)
- Visual regression testing (separate tooling)
- Performance benchmarking (separate concern)
- Mobile gesture testing (manual QA)

## Success Criteria

After this sprint:

1. `npx playwright test active-grove` validates complete content transformation flow
2. Health check dashboard shows Active Grove transformation status
3. Future Epic 7-style migrations cannot break left column without test failure
4. Clear error messages when state machine / quantum interface desync

## Acceptance Criteria

### Infrastructure Tests (Must Have)
- [ ] AC-1: EngagementProvider renders without error
- [ ] AC-2: XState actor is accessible via `useEngagement()`
- [ ] AC-3: `useLensState()` returns reactive lens value

### Lens Selection Flow (Must Have)
- [ ] AC-4: Seedling click triggers lens picker display
- [ ] AC-5: Lens picker selection updates XState machine
- [ ] AC-6: XState lens change triggers `useQuantumInterface` re-evaluation
- [ ] AC-7: Quantum interface returns lens-specific reality

### Content Transformation (Must Have)
- [ ] AC-8: GenesisPage receives `activeLens` from quantum interface
- [ ] AC-9: `activeLens` !== null triggers `WaveformCollapse` component
- [ ] AC-10: Content rail displays lens-specific headline
- [ ] AC-11: Reality object contains `headline`, `subheadline`, `tagline`

### State Persistence (Must Have)
- [ ] AC-12: Lens selection persists in localStorage
- [ ] AC-13: Page reload restores lens from storage
- [ ] AC-14: Restored lens triggers content transformation

### URL Hydration (Must Have)
- [ ] AC-15: `?lens=engineer` sets XState lens on mount
- [ ] AC-16: URL lens skips lens picker
- [ ] AC-17: URL lens triggers immediate content transformation

### User Behavior Simulation (Should Have)
- [ ] AC-18: Rapid lens switching doesn't cause race conditions
- [ ] AC-19: Back button navigation preserves lens state
- [ ] AC-20: Multiple seedling clicks are idempotent
- [ ] AC-21: Closing terminal preserves lens selection

### Health Check Integration (Must Have)
- [ ] AC-22: health-config.json includes Active Grove checks
- [ ] AC-23: Health report shows transformation pipeline status
- [ ] AC-24: Failed transformation check provides clear remediation

## Test Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER ACTION                                        │
│                    Click Seedling → Select Lens                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENGAGEMENT LAYER                                     │
│                                                                              │
│  EngagementProvider → XState Actor → useLensState({ actor })                │
│                                              │                               │
│                              engSelectLens(lensId) ────────────────────┐    │
│                                              │                         │    │
│                              lens: string | null ◄────────────────────┘    │
│                                              │                               │
│                              (persists to localStorage)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        QUANTUM INTERFACE                                     │
│                                                                              │
│  useQuantumInterface() ──┬── activeLensFromMachine (from useLensState)      │
│                          │                                                   │
│                          ├── effectiveRealities (schema + fallback)         │
│                          │                                                   │
│                          └── resolveReality(lensId) ─────┐                  │
│                                                          │                   │
│                                  LensReality ◄───────────┘                  │
│                                      │                                       │
│                              { headline, subheadline, tagline, ... }        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GENESIS PAGE                                        │
│                                                                              │
│  GenesisPage ──── const { reality, activeLens } = useQuantumInterface()     │
│       │                                                                      │
│       │          if (activeLens !== null) → State: 'unlocked'               │
│       │                                                                      │
│       └────────► WaveformCollapse ◄──── reality.headline                    │
│                         │                                                    │
│                         └────► Animate headline transition                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Test Specifications

### Category 1: Step-by-Step Validation

| Test ID | Name | Steps | Expected | Severity |
|---------|------|-------|----------|----------|
| AG-1.1 | Initial Page Load | Navigate to `/` | Hero mode, terminal hidden, no split | Critical |
| AG-1.2 | Seedling Visibility | Locate seedling button | Button visible, has pulsing class | Critical |
| AG-1.3 | Seedling Click Split | Click seedling | Content rail has `.split`, terminal has `.visible` | Critical |
| AG-1.4 | Lens Picker Display | After seedling click | Lens picker options visible in terminal | Critical |
| AG-1.5 | Lens Selection Event | Click lens option | XState machine receives `SELECT_LENS` event | Critical |
| AG-1.6 | Quantum Interface Update | After lens selection | `useQuantumInterface().activeLens` matches selected lens | Critical |
| AG-1.7 | Reality Resolution | After quantum update | Reality object has headline, subheadline, tagline | Critical |
| AG-1.8 | Content Rail Update | After reality resolved | WaveformCollapse animates, new headline visible | Critical |
| AG-1.9 | State Persistence | Reload page | Lens restored, content transformation occurs | Critical |

### Category 2: User Behavior Simulation

| Test ID | Name | Scenario | Expected | Severity |
|---------|------|----------|----------|----------|
| AG-2.1 | Rapid Lens Switch | Select 3 lenses in 2 seconds | Final lens displayed, no race condition | High |
| AG-2.2 | Close/Reopen Terminal | Select lens, close terminal, reopen | Lens preserved, content still transformed | High |
| AG-2.3 | URL Deep Link | Navigate to `/?lens=engineer` | Lens picker skipped, engineer content shown | High |
| AG-2.4 | Invalid URL Lens | Navigate to `/?lens=invalid123` | Graceful fallback to default, no crash | Medium |
| AG-2.5 | Multiple Seedling Clicks | Click seedling 5 times rapidly | Terminal opens once, no flickering | Medium |
| AG-2.6 | Browser Back Button | Select lens, navigate away, press back | Lens state preserved | Medium |
| AG-2.7 | localStorage Corruption | Corrupt grove-engagement-persist, reload | Graceful recovery, default state | Medium |
| AG-2.8 | Concurrent Tab | Open 2 tabs, select different lenses | Each tab has independent state | Low |
| AG-2.9 | Offline Mode | Go offline, select lens | Local state works, no network errors | Low |

## Dependencies

- Existing `tests/e2e/active-grove.spec.ts` (extend, don't replace)
- `@playwright/test` ^1.40.0
- `@core/engagement` hooks
- `useQuantumInterface` hook

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Animation timing flaky | High | Medium | Use `waitForFunction` with generous timeout |
| XState state hard to assert | Medium | Medium | Expose debug state via data attributes |
| localStorage mock complexity | Low | Low | Use real localStorage, clear in beforeEach |

## Out of Scope

- Testing `realityCollapser.collapse()` LLM call (mock in E2E)
- Custom lens wizard flow (separate test file)
- Journey navigation (covered by engagement-behaviors.spec.ts)
- Audio playback testing
