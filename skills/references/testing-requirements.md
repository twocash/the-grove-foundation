# Testing Requirements

Every sprint MUST include tests for new/modified functionality. Testing is Phase 8 of the Foundation Loop and is mandatory.

## Test Pyramid

```
        ┌─────────────┐
        │   E2E (5)   │  Browser tests, critical paths only
        │  ~60 sec    │  Run on deploy
        ├─────────────┤
        │ Integration │  API contracts, data flows
        │    (15)     │  Run on commit
        │  ~10 sec    │
        ├─────────────┤
        │    Unit     │  Pure logic, no I/O
        │    (30+)    │  Fast, isolated
        │   ~5 sec    │
        └─────────────┘
```

## Required Tests by Change Type

| Change Type | Required Tests |
|-------------|----------------|
| Schema/Data changes | Schema validation, cross-reference tests |
| API changes | Contract tests for affected endpoints |
| Frontend changes | E2E smoke tests |
| Logic changes | Unit tests for new/modified functions |
| Refactoring | Existing tests still pass, no regressions |

## Test File Organization

```
tests/
├── unit/           # Pure logic, no I/O, fast
├── integration/    # API calls, data flows, needs server
├── e2e/            # Browser tests (Playwright)
├── fixtures/       # Test data
└── utils/          # Test helpers
```

## Acceptance Criteria Must Include

Every SPEC.md MUST include these test-related acceptance criteria:

```markdown
## Acceptance Criteria
- [ ] AC-X: Tests pass: `npm test`
- [ ] AC-Y: Health check passes: `npm run health`
- [ ] AC-Z: {Specific test for the feature}
```

## Writing Good Tests

### Schema Validation Tests
```typescript
describe('Schema Validation', () => {
  test('all references resolve', () => {
    for (const [id, item] of Object.entries(items)) {
      expect(relatedItems[item.relatedId],
        `Item "${id}" references non-existent related "${item.relatedId}"`
      ).toBeDefined()
    }
  })
})
```

### API Contract Tests
```typescript
describe('GET /api/resource', () => {
  test('returns expected shape', async () => {
    const response = await fetch('/api/resource')
    const data = await response.json()
    
    expect(data.items).toBeDefined()
    expect(Array.isArray(data.items)).toBe(true)
  })
})
```

### Journey/Flow Tests
```typescript
describe('User Flow', () => {
  test.each([
    ['flow-a', 5],
    ['flow-b', 3],
  ])('%s has %d steps', (flowId, expected) => {
    const steps = getFlowSteps(flowId)
    expect(steps).toHaveLength(expected)
  })
})
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
npm run build    # TypeScript compiles
npm test         # Unit tests pass
npm run health   # Health check passes
```

Before deploy:
```bash
npm run test:all  # All tests including E2E
npm run health    # Final health check
```

## CI Integration

```yaml
name: Tests
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run health -- --json > health-report.json
      - uses: actions/upload-artifact@v4
        with:
          name: health-report
          path: health-report.json
```

## What NOT to Test

- LLM output quality (non-deterministic)
- Third-party API implementations (mock at boundary)
- Every edge case (focus on critical paths)
- Styling/visual details (unless critical)

## Test Checklist for Sprint

Before marking a sprint complete:

- [ ] Tests written for new functionality
- [ ] Existing tests still pass
- [ ] `npm test` completes in <30 seconds
- [ ] `npm run health` shows no regressions
- [ ] Test coverage for critical paths documented
