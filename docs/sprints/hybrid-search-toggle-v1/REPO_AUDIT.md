# Repository Audit — hybrid-search-toggle-v1

## Audit Date: 2025-01-04

## Current State Summary

The RAG hybrid search system is fully implemented at the backend but has no UI exposure. Users currently experience basic vector search without the ability to leverage keyword matching, utility scoring, or temporal freshness. This sprint adds a simple toggle to the /explore header enabling users to switch between basic and hybrid search modes.

## File Structure Analysis

### Key Files
| File | Purpose | Lines |
|------|---------|-------|
| `src/surface/components/KineticStream/KineticHeader.tsx` | Header with lens/journey pills | 118 |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Main container orchestrating /explore | 679 |
| `src/surface/components/KineticStream/hooks/useKineticStream.ts` | Stream state management, submit logic | 294 |
| `services/chatService.ts` | Frontend → server communication | 311 |
| `server.js` | /api/chat endpoint (already has useHybridSearch param) | ~5000 |
| `lib/knowledge/search.js` | getContextForQuery (already supports useHybrid) | ~300 |

### Dependencies
- React 18 (useState, useCallback)
- framer-motion (for animations if needed)
- localStorage API (for persistence)

## Architecture Assessment

### DEX Compliance
| Area | Status | Notes |
|------|--------|-------|
| Declarative config | ⚠️ | Toggle is UI state, not domain config—acceptable for feature flags |
| Capability agnostic | ✅ | Hybrid search works regardless of model |
| Single source of truth | ✅ | Toggle state lives in ExploreShell, passed down |

### Violations Found
None. This is a straightforward UI control wiring to existing backend capability.

## Test Coverage Assessment

### Current Test State
| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Unit | 0 | 0 | None for KineticHeader |
| Integration | 0 | 0 | None for hybrid search |
| E2E | 1 | ~5 | explore-baseline.spec.ts exists |

### Test Quality
- [x] Existing tests verify behavior (not implementation)
- [x] Tests use semantic queries
- [ ] Tests do not currently verify search mode

### Test Gaps
- No test verifies hybrid toggle renders
- No test verifies search mode persistence across refreshes
- No test verifies hybrid flag reaches backend

## Technical Debt
- KineticHeader has no props for feature toggles—needs contextual features slot
- chatService.ChatOptions lacks useHybridSearch field

## Risk Assessment
| Area | Current Risk | Notes |
|------|--------------|-------|
| Breaking existing UI | Low | Additive change to header |
| State sync issues | Low | Simple boolean, localStorage backup |
| Performance regression | Low | Toggle doesn't affect performance directly |

## Recommendations
1. Add toggle to KineticHeader as contextual feature (Pattern 9)
2. Wire state through ExploreShell → useKineticStream → chatService
3. Persist to localStorage so refresh remembers preference
4. Add E2E test for toggle visibility and state persistence
