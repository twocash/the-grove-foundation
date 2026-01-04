# Sprint Breakdown — hybrid-search-toggle-v1

## Sprint Overview
**Name:** hybrid-search-toggle-v1
**Duration:** 0.5 days
**Goal:** Expose hybrid search capability via UI toggle

---

## Epic 1: Service Layer Wiring

### Story 1.1: Extend ChatOptions Interface
**Task:** Add `useHybridSearch?: boolean` to ChatOptions
**File:** `services/chatService.ts`
**Lines:** 22-28
**Tests:** TypeScript compilation

### Story 1.2: Include Flag in Request Body
**Task:** Add `useHybridSearch` to sendMessageStream requestBody
**File:** `services/chatService.ts`
**Lines:** 87-97
**Tests:** TypeScript compilation

### Build Gate (Epic 1)
```bash
npm run build
```

---

## Epic 2: Stream Hook Wiring

### Story 2.1: Add Options Interface to useKineticStream
**Task:** Create `UseKineticStreamOptions` interface, accept as parameter
**File:** `src/surface/components/KineticStream/hooks/useKineticStream.ts`
**Lines:** 38-45
**Tests:** TypeScript compilation

### Story 2.2: Pass Flag to sendMessageStream
**Task:** Include `useHybridSearch` in ChatOptions when calling service
**File:** `src/surface/components/KineticStream/hooks/useKineticStream.ts`
**Lines:** ~90
**Tests:** TypeScript compilation

### Build Gate (Epic 2)
```bash
npm run build
```

---

## Epic 3: Header UI

### Story 3.1: Extend KineticHeaderProps
**Task:** Add `useHybridSearch` and `onHybridSearchToggle` props
**File:** `src/surface/components/KineticStream/KineticHeader.tsx`
**Lines:** 22-30
**Tests:** TypeScript compilation

### Story 3.2: Render Toggle Button
**Task:** Add toggle UI between stage badge and context pills
**File:** `src/surface/components/KineticStream/KineticHeader.tsx`
**Lines:** ~75-85
**Tests:** Visual verification at /explore

### Build Gate (Epic 3)
```bash
npm run build
# Manual: Visit localhost:8080/explore, verify toggle renders
```

---

## Epic 4: Container State Management

### Story 4.1: Add State Hook in ExploreShell
**Task:** Add useState for hybrid search with localStorage initialization
**File:** `src/surface/components/KineticStream/ExploreShell.tsx`
**Lines:** ~48
**Tests:** Console log on toggle

### Story 4.2: Add Toggle Handler
**Task:** Create handleHybridSearchToggle callback with localStorage sync
**File:** `src/surface/components/KineticStream/ExploreShell.tsx`
**Lines:** ~55
**Tests:** Console log + localStorage update

### Story 4.3: Wire State to Hook
**Task:** Pass useHybridSearch to useKineticStream options
**File:** `src/surface/components/KineticStream/ExploreShell.tsx`
**Lines:** ~50
**Tests:** TypeScript compilation

### Story 4.4: Wire State to Header
**Task:** Pass useHybridSearch and handler to KineticHeader
**File:** `src/surface/components/KineticStream/ExploreShell.tsx`
**Lines:** ~340
**Tests:** Toggle click changes state

### Build Gate (Epic 4)
```bash
npm run build
# Manual: Click toggle, verify console log, verify localStorage in DevTools
```

---

## Epic 5: E2E Tests

### Story 5.1: Create Test File
**Task:** Create explore-hybrid-toggle.spec.ts with Playwright tests
**File:** `tests/e2e/explore-hybrid-toggle.spec.ts`
**Tests:**
- Toggle visible on page load
- Toggle changes state on click
- Toggle state persists after refresh

### Build Gate (Epic 5)
```bash
npx playwright test tests/e2e/explore-hybrid-toggle.spec.ts
```

---

## Commit Sequence
```
1. feat(chatService): add useHybridSearch to ChatOptions
2. feat(useKineticStream): accept and pass hybrid search option
3. feat(KineticHeader): add hybrid search toggle UI
4. feat(ExploreShell): wire hybrid search state and toggle
5. test(e2e): add hybrid search toggle tests
```

## Build Gates Summary
| After | Command | Expected |
|-------|---------|----------|
| Epic 1 | `npm run build` | Compiles |
| Epic 2 | `npm run build` | Compiles |
| Epic 3 | `npm run build` + manual | Toggle visible |
| Epic 4 | `npm run build` + manual | Toggle functional |
| Epic 5 | `npx playwright test explore-hybrid-toggle` | 3 tests pass |

## Smoke Test Checklist
- [ ] Toggle visible in /explore header
- [ ] Toggle shows OFF state by default (first visit)
- [ ] Click toggle → console shows "Hybrid search: ON"
- [ ] Refresh page → toggle remembers ON state
- [ ] Submit query → API request includes `useHybridSearch: true`
- [ ] All E2E tests pass
