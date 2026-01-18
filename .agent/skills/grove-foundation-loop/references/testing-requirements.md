# Testing Requirements

Testing is not a phase—it's a continuous process integrated throughout development. Every sprint MUST include tests that verify behavior and report to the Health system.

## Testing Philosophy

### Behavior Over Implementation

**The Core Insight:** Test what users see, not how you implemented it.

```typescript
// ❌ WRONG: Testing implementation
expect(state.isOpen).toBe(true);
expect(element).toHaveClass('translate-x-0');
expect(mockHandler).toHaveBeenCalledWith('foo');

// ✅ RIGHT: Testing behavior
await expect(terminal).toBeVisible();
await expect(page.getByText('Welcome')).toBeVisible();
await expect(submitButton).toBeEnabled();
```

**Why this matters:**
- Implementation changes don't break tests
- Tests document actual user experience
- Refactoring is safe when tests verify behavior
- Tests remain valid across CSS/state redesigns

### Testing as Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Testing as Continuous Process                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Developer    →    Write Code    →    Run Tests    →    Health Report      │
│       ↑                                                        │            │
│       │                                                        ↓            │
│       └────────────────── Fix if Failed ←────────────── Dashboard           │
│                                                                             │
│   Tests run automatically after code changes                                │
│   Results flow to unified Health system                                     │
│   Health dashboard shows complete system state                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Test Pyramid

```
        ┌─────────────┐
        │   E2E (5)   │  Behavior tests, critical paths only
        │  ~60 sec    │  What users actually experience
        ├─────────────┤
        │ Integration │  API contracts, data flows
        │    (15)     │  System boundaries work
        │  ~10 sec    │
        ├─────────────┤
        │    Unit     │  Pure logic, no I/O
        │    (30+)    │  Fast, isolated
        │   ~5 sec    │
        └─────────────┘
```

## Required Tests by Change Type

| Change Type | Required Tests | Focus |
|-------------|----------------|-------|
| UI changes | E2E behavior tests | What users see |
| API changes | Contract tests | Request/response shape |
| Schema changes | Validation tests | Data integrity |
| Logic changes | Unit tests | Input/output correctness |
| State changes | Behavior tests | User-visible outcomes |
| Refactoring | Existing tests pass | No regressions |

## E2E Test Patterns (Behavior-Focused)

### Pattern 1: User Flow Tests

```typescript
test('user can complete onboarding flow', async ({ page }) => {
  // Test the journey, not the implementation
  await page.goto('/');
  
  // User sees welcome
  await expect(page.getByText('Welcome')).toBeVisible();
  
  // User selects preference
  await page.getByRole('button', { name: 'Engineer' }).click();
  
  // User sees personalized content
  await expect(page.getByText('Technical Overview')).toBeVisible();
});
```

### Pattern 2: State Persistence Tests

```typescript
test('selections persist across sessions', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Engineer' }).click();
  
  // Simulate session change
  const newPage = await context.newPage();
  await newPage.goto('/');
  
  // Selection should persist
  await expect(newPage.getByText('Engineer view')).toBeVisible();
});
```

### Pattern 3: Error State Tests

```typescript
test('shows helpful message on invalid input', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('textbox').fill('');
  await page.getByRole('button', { name: 'Search' }).click();
  
  // User sees helpful error, not technical message
  await expect(page.getByText('Please enter a search term')).toBeVisible();
});
```

### Pattern 4: URL Parameter Tests

```typescript
test('URL parameters configure initial state', async ({ page }) => {
  await page.goto('/?lens=academic');
  
  // URL parameter applied
  await expect(page.getByText('Academic perspective')).toBeVisible();
});
```

## Test Helpers for Behavior Testing

```typescript
// tests/e2e/helpers.ts

/**
 * Wait for element to be visible (behavior-focused)
 */
export async function waitForContent(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}

/**
 * Select option and verify result (behavior-focused)
 */
export async function selectAndVerify(
  page: Page, 
  buttonName: string, 
  expectedText: string
) {
  await page.getByRole('button', { name: buttonName }).click();
  await expect(page.getByText(expectedText)).toBeVisible();
}

/**
 * Test navigation flow (behavior-focused)
 */
export async function testNavigationFlow(
  page: Page,
  steps: Array<{ click: string; expectVisible: string }>
) {
  for (const step of steps) {
    await page.getByRole('button', { name: step.click }).click();
    await expect(page.getByText(step.expectVisible)).toBeVisible();
  }
}
```

## Health System Integration

### Playwright Health Reporter

E2E tests should report to the Health system:

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'],
    ['list'],
    ['./tests/reporters/health-reporter.ts', {
      baseUrl: process.env.BASE_URL || 'http://localhost:5173'
    }]
  ],
});
```

### e2e-behavior Health Checks

Health config can reference E2E tests:

```json
{
  "id": "user-can-select-lens",
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:lens selection persists",
  "impact": "Users cannot personalize their experience",
  "inspect": "npx playwright test -g 'lens selection'"
}
```

### Unified Health View

```
Health Dashboard
├── Schema Integrity (data validation)
│   ├── JSON files parse ✅
│   └── References resolve ✅
├── E2E Tests (behavior verification)
│   ├── Lens selection works ✅
│   ├── Navigation flows ✅
│   └── Persistence works ✅
└── API Contracts (integration)
    ├── /api/health responds ✅
    └── /api/narrative returns data ✅
```

## Test File Organization

```
tests/
├── unit/                    # Pure logic, no I/O, fast
│   ├── utils.test.ts
│   └── validators.test.ts
├── integration/             # API contracts, needs server
│   ├── health-api.test.ts
│   └── narrative-api.test.ts
├── e2e/                     # Browser behavior tests
│   ├── smoke.spec.ts        # Critical path verification
│   ├── engagement-behaviors.spec.ts  # User behaviors
│   └── deprecated/          # Old tests being migrated
├── reporters/               # Custom reporters
│   └── health-reporter.ts   # E2E → Health integration
├── fixtures/                # Test data
└── utils/                   # Test helpers
    └── helpers.ts
```

## SPRINTS.md Test Requirements

Every sprint's SPRINTS.md must include test tasks:

```markdown
## Epic 1: {Feature Name}

### Story 1.1: Implement {feature}
**Task:** Build the feature
**Tests:** 
- Add behavior test: `tests/e2e/feature.spec.ts`
- Verify: `npx playwright test feature`

### Story 1.2: Write tests for {feature}
**Task:** Add behavior-focused E2E tests
**Checklist:**
- [ ] Test user-visible outcomes, not implementation
- [ ] Use `toBeVisible()`, `toBeEnabled()`, `getByRole()`
- [ ] Avoid `toHaveClass()`, internal state checks
- [ ] Tests report to Health system

### Build Gate
```bash
npm run build
npm test
npx playwright test
npm run health
```
```

## Acceptance Criteria Must Include Tests

Every SPEC.md acceptance criteria section:

```markdown
## Acceptance Criteria

### Functional
- [ ] AC-1: User can {do thing}
- [ ] AC-2: System shows {expected result}

### Tests
- [ ] AC-T1: E2E test verifies user flow
- [ ] AC-T2: Tests use behavior assertions (`toBeVisible()`)
- [ ] AC-T3: All tests pass: `npm test && npx playwright test`
- [ ] AC-T4: Health check passes: `npm run health`
```

## Test Scripts in package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e",
    "health": "node scripts/health-check.js"
  }
}
```

## Build Gates

After each epic:
```bash
npm run build        # TypeScript compiles
npm test             # Unit tests pass
npx playwright test  # E2E behaviors verified
npm run health       # Health check passes
```

Before deploy:
```bash
npm run test:all     # All tests including E2E
npm run health       # Final health check
```

## What NOT to Test

- LLM output quality (non-deterministic)
- CSS class names (implementation detail)
- Internal state shape (implementation detail)
- Mock call counts (implementation detail)
- Third-party API internals (mock at boundary)
- Every edge case (focus on critical paths)

## Migration: Implementation → Behavior Tests

When updating existing tests:

### Before (Implementation)
```typescript
test('terminal opens', async ({ page }) => {
  await page.click('[data-testid="tree"]');
  expect(await page.$eval('.terminal', el => 
    el.classList.contains('translate-x-0')
  )).toBe(true);
});
```

### After (Behavior)
```typescript
test('clicking tree opens terminal', async ({ page }) => {
  await page.getByTestId('tree').click();
  await expect(page.getByRole('region', { name: 'Terminal' })).toBeVisible();
});
```

## Test Checklist for Sprint

Before marking a sprint complete:

- [ ] Tests written for new functionality
- [ ] Tests verify behavior, not implementation
- [ ] Tests use semantic queries (`getByRole`, `getByText`)
- [ ] Existing tests still pass
- [ ] Tests report to Health system (if configured)
- [ ] `npm test` completes in <30 seconds
- [ ] `npx playwright test` completes in <2 minutes
- [ ] `npm run health` shows no regressions
- [ ] Test coverage for critical paths documented
