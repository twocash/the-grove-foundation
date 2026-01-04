# Specification — hybrid-search-toggle-v1

## Overview

Add a UI toggle to the /explore header enabling users to switch between basic vector search and hybrid search (vector + keyword + utility + temporal scoring). The toggle persists across sessions via localStorage.

## Domain Contract

**Applicable contract:** None (main branch)
**Contract version:** N/A
**Additional requirements:** None

## Patterns Extended (MANDATORY)

**Per PROJECT_PATTERNS.md Phase 0 requirements:**

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Toggle UI in header | Pattern 9: Module Shell | Add to KineticHeader contextual features area |
| Styling for toggle | Pattern 4: Styling Tokens | Use existing `--glass-*` and `--neon-*` tokens |
| State propagation | Pattern 2: Engagement Machine | NOT using XState—simple useState is appropriate for feature flags |
| Service interface | N/A (chatService) | Extend ChatOptions with useHybridSearch boolean |

### New Patterns Proposed

None required. All needs met by extending existing patterns.

## Goals
1. Expose hybrid search capability to users via simple toggle
2. Persist user preference across sessions
3. Enable A/B testing of search quality

## Non-Goals
- Automatic hybrid search optimization
- Per-query search mode selection
- Search mode analytics/telemetry

## Success Criteria
After this sprint:
1. Toggle visible in /explore header, right of stage badge
2. Toggle state persists across page refreshes
3. Hybrid search activates when toggle is ON
4. Console logs confirm hybrid flag reaches backend

## Acceptance Criteria

### Functional Requirements
- [ ] AC-1: Toggle renders in KineticHeader between stage and lens pills
- [ ] AC-2: Toggle shows visual distinction for ON/OFF states
- [ ] AC-3: Clicking toggle changes search mode
- [ ] AC-4: localStorage stores preference as `grove-hybrid-search`
- [ ] AC-5: Page refresh restores previous toggle state

### Test Requirements (MANDATORY)
- [ ] AC-T1: E2E test verifies toggle is visible
- [ ] AC-T2: E2E test verifies toggle changes state on click
- [ ] AC-T3: Tests use behavior assertions (`toBeVisible()`, `toBeChecked()`)
- [ ] AC-T4: All tests pass: `npm test && npx playwright test`

### DEX Compliance
- [ ] AC-D1: Toggle is UI chrome, not domain config (acceptable)
- [ ] AC-D2: No new handlers—toggle uses standard React state
- [ ] AC-D3: Non-technical user can observe mode via UI feedback

## Dependencies
| Package | Purpose | Version |
|---------|---------|---------|
| None | All dependencies already present | N/A |

## Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Toggle clutters header | Low | Low | Small pill-style toggle with tooltip |
| Users confused by toggle | Medium | Low | Clear label + tooltip explaining purpose |

## Out of Scope
- Backend hybrid search implementation (already complete)
- Search analytics dashboard
- Per-route default configurations
