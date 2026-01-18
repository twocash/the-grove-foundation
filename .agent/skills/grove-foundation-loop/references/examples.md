# Example Sprints

Real-world examples of the Foundation Loop methodology applied to actual development work, demonstrating testing as process and declarative architecture.

## Example 1: Health Integration (Epic 0)

**Sprint:** `engagement-phase2-epic0`
**Problem:** E2E tests and Health system are disconnected; no unified view of system health
**Solution:** Playwright reporter that POSTs results to Health API

### REPO_AUDIT Key Findings
- Health system: Declarative checks in `health-config.json`, engine interprets
- E2E tests: 34 passing, but results only in HTML report
- Gap: No connection between behavioral tests and Health monitoring

### Key Decisions (ADRs)
- **ADR-026:** Custom Playwright reporter (not post-test script)
- **ADR-027:** Graceful degradation (never fail tests if Health unavailable)
- **ADR-028:** `e2e-behavior` check type links Health to tests
- **ADR-029:** POST to API (not direct file write)
- **ADR-030:** Test reference format: `file.spec.ts:test name`

### Test Strategy
```typescript
// Behavior-focused E2E tests
test('lens selection persists across sessions', async ({ page }) => {
  await selectLens(page, 'engineer');
  await page.reload();
  await expect(page.getByText('Engineer perspective')).toBeVisible();
});

// Health check references the behavior test
{
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:lens selection persists"
}
```

### Lessons Learned
- Tests verify behavior (`toBeVisible()`), not implementation (`toHaveClass()`)
- Health system becomes single source of truth for ALL health
- Declarative pattern: Config defines which tests matter, engine evaluates

---

## Example 2: Engagement Context Refactor (Phase 2)

**Sprint:** `engagement-migration-v1`
**Problem:** 694-line monolithic NarrativeEngineContext with 40+ handlers
**Solution:** Declarative EngagementContext with XState machine

### REPO_AUDIT Key Findings

**DEX Violations Found:**
```typescript
// ❌ Hardcoded handlers (40+ of these)
const handleLensSelect = useCallback((lens) => {
  setCurrentLens(lens);
  localStorage.setItem('lens', lens);
  // More imperative logic...
}, []);
```

**Test Quality Issues:**
```typescript
// ❌ Implementation-focused test
expect(element).toHaveClass('translate-x-0');

// Needed: Behavior-focused test
await expect(terminal).toBeVisible();
```

### Key Decisions (ADRs)
- **ADR-020:** XState machine for state transitions
- **ADR-021:** Declarative engagement config
- **ADR-022:** Behavior tests as safety net
- **ADR-023:** Adapter pattern for gradual migration

### Target Architecture
```
src/core/engagement/
├── EngagementContext.tsx      # Thin coordinator (~100 lines)
├── machine.ts                 # XState state machine
├── config/engagement-config.json  # Declarative behaviors
└── hooks/
    ├── useLensState.ts        # Extracted, focused
    ├── useJourneyState.ts
    └── useEntropyState.ts
```

### Test Strategy

**Behavior Tests (safety net):**
```typescript
// These verify user experience, survive refactoring
test('selecting lens updates view', async ({ page }) => {
  await page.getByRole('button', { name: 'Engineer' }).click();
  await expect(page.getByText('Technical details')).toBeVisible();
});
```

**Migration Tests (track progress):**
```json
{
  "id": "legacy-context-removed",
  "type": "file-not-exists",
  "file": "hooks/NarrativeEngineContext.tsx"
}
```

### Story Structure
| Epic | Focus | Health Checks |
|------|-------|---------------|
| 0 | Health integration | E2E → Health reporting |
| 1 | State machine | Machine transitions valid |
| 2 | Lens extraction | Lens state integrity |
| 3 | Journey extraction | Journey transitions |
| 4 | Entropy extraction | Entropy calculation |
| 5 | Context assembly | All behaviors work |
| 6 | Consumer migration | No legacy imports |
| 7 | Legacy deletion | Files removed |

---

## Example 3: Knowledge Architecture Refactoring

**Sprint:** `knowledge-architecture-v1`
**Problem:** Monolithic 773-line JSON file mixing 8 different concerns
**Solution:** Split into domain-specific files with schema validation

### REPO_AUDIT Key Findings
- Single file `narratives.json` contained: journeys, nodes, hubs, lenses
- DEX violation: All domain logic in one file, hard to configure
- No tests for schema integrity

### Key Decisions (ADRs)
- **ADR-001:** Split by domain (exploration/, knowledge/, infrastructure/)
- **ADR-002:** Schema validation as Health checks
- **ADR-003:** Backward compatibility via fallback

### Test Strategy

**Schema Validation Tests:**
```typescript
test('all journey references resolve', () => {
  for (const [id, journey] of Object.entries(journeys)) {
    expect(hubs[journey.hubId], 
      `Journey "${id}" references non-existent hub "${journey.hubId}"`
    ).toBeDefined();
  }
});
```

**Behavior Tests:**
```typescript
test('user can navigate journey', async ({ page }) => {
  await page.goto('/journey/grove-vision');
  await expect(page.getByText('Welcome')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Step 2')).toBeVisible();
});
```

### Lessons Learned
- Schema tests catch broken references before deploy
- Behavior tests verify user experience survives refactoring
- Health checks provide living documentation of system structure

---

## Example 4: Testing Infrastructure

**Sprint:** `automated-testing-v1`
**Problem:** Zero automated tests; bugs only found in production
**Solution:** Test framework + health report + behavior-focused tests

### Key Decisions (ADRs)
- **ADR-001:** Vitest for unit/integration (Vite-native)
- **ADR-002:** Playwright for E2E (reliable, semantic queries)
- **ADR-003:** Behavior over implementation (test what users see)
- **ADR-004:** Health report as first-class feature
- **ADR-005:** Tests report to Health system

### Test Philosophy Evolution

**Before (implementation-focused):**
```typescript
// ❌ Brittle: breaks on CSS changes
test('terminal opens', () => {
  expect(element).toHaveClass('translate-x-0');
  expect(state.isOpen).toBe(true);
});
```

**After (behavior-focused):**
```typescript
// ✅ Stable: survives refactoring
test('clicking tree opens terminal', async ({ page }) => {
  await page.getByTestId('tree').click();
  await expect(page.getByRole('region', { name: 'Terminal' })).toBeVisible();
});
```

### Test Categories Created
| Category | Tests | Focus |
|----------|-------|-------|
| Schema | 7 | Data integrity |
| Behavior | 15 | User experience |
| API | 6 | Contracts |
| Smoke | 3 | Critical paths |

---

## Sprint Checklist

Use this checklist when creating a new sprint:

### Planning Phase
- [ ] Created sprint folder: `docs/sprints/{name}/`
- [ ] REPO_AUDIT.md analyzes current state AND test coverage
- [ ] SPEC.md defines goals WITH test requirements
- [ ] ARCHITECTURE.md shows target state AND test architecture
- [ ] MIGRATION_MAP.md has file-by-file plan WITH test changes
- [ ] DECISIONS.md documents testing strategy (ADR required)
- [ ] SPRINTS.md breaks into stories WITH test tasks per epic
- [ ] EXECUTION_PROMPT.md is self-contained WITH test commands

### DEX Compliance
- [ ] No new hardcoded handlers
- [ ] Behavior in config, engine interprets
- [ ] Non-developer can modify behavior

### Testing Phase
- [ ] E2E tests verify user-visible behavior
- [ ] Tests use semantic queries (`getByRole`, `toBeVisible()`)
- [ ] No implementation tests (`toHaveClass()`, state checks)
- [ ] Tests report to Health system (if configured)
- [ ] Health checks reference behavior tests

### Execution Phase
- [ ] DEVLOG.md tracking progress AND test results
- [ ] Build gates verified after each epic
- [ ] All tests passing
- [ ] Health check passing

### Completion
- [ ] All acceptance criteria met
- [ ] Tests passing: `npm run test:all`
- [ ] Health check passing: `npm run health`
- [ ] No DEX violations introduced
- [ ] Documentation updated
- [ ] Ready for deploy

---

## Anti-Patterns to Avoid

### 1. Implementation-Focused Tests
```typescript
// ❌ WRONG
expect(element).toHaveClass('translate-x-0');
expect(state.isOpen).toBe(true);
expect(mockHandler).toHaveBeenCalled();

// ✅ RIGHT
await expect(terminal).toBeVisible();
await expect(page.getByText('Welcome')).toBeVisible();
```

### 2. Hardcoded Handlers
```typescript
// ❌ WRONG
const handleLensChange = (lens) => {
  if (lens === 'engineer') { ... }
};

// ✅ RIGHT
const lensConfig = config[lens];
applyConfig(lensConfig);
```

### 3. Testing Phase at End
```
// ❌ WRONG
Epic 1 → Epic 2 → Epic 3 → Epic 4: Write Tests

// ✅ RIGHT
Epic 1 + Tests → Epic 2 + Tests → Epic 3 + Tests
```

### 4. Disconnected Health Checks
```json
// ❌ WRONG: Manual check, no test reference
{ "name": "Lens works", "type": "manual" }

// ✅ RIGHT: References behavior test
{ "type": "e2e-behavior", "test": "engagement.spec.ts:lens selection" }
```
