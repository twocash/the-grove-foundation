# Grove Architecture Rules

When working on the Grove codebase, these rules prevent architectural violations that create technical debt and make the system harder to maintain.

## The Core Principle

**Declarative over Imperative:** Behavior should be defined in configuration, not hardcoded in handlers.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Declarative Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CONFIG (data)          ENGINE (code)           BEHAVIOR (result)          │
│   ─────────────          ─────────────           ────────────────           │
│   What to do        →    How to do it       →    What happens               │
│                                                                             │
│   "lens: engineer"       interpretConfig()       Show engineer view         │
│   "threshold: 0.7"       evaluateEntropy()       Suggest journey            │
│   "persist: true"        handlePersistence()     Save to localStorage       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Rule 1: No New Handlers

**WRONG:** Adding new `handle*` callbacks for each behavior

```typescript
// ❌ VIOLATION: Hardcoded handler
const handleLensChange = (lens: string) => {
  if (lens === 'engineer') {
    setShowTechnicalDetails(true);
  } else if (lens === 'academic') {
    setShowCitations(true);
  }
  // More conditionals as lenses grow...
};
```

**RIGHT:** Configuration defines behavior, engine interprets

```typescript
// ✅ CORRECT: Declarative config
// config/lens-config.json
{
  "engineer": {
    "showTechnicalDetails": true,
    "showCitations": false
  },
  "academic": {
    "showTechnicalDetails": false,
    "showCitations": true
  }
}

// Engine interprets config
const lensConfig = config[currentLens];
const { showTechnicalDetails, showCitations } = lensConfig;
```

## Rule 2: No Hardcoded Conditionals

**WRONG:** `if (type === 'foo')` scattered through code

```typescript
// ❌ VIOLATION: Hardcoded behavior
if (journey.type === 'tutorial') {
  showProgressBar();
} else if (journey.type === 'exploration') {
  showBreadcrumbs();
}
```

**RIGHT:** Type-specific behavior in config

```typescript
// ✅ CORRECT: Behavior in config
// config/journey-types.json
{
  "tutorial": {
    "ui": { "progressBar": true, "breadcrumbs": false }
  },
  "exploration": {
    "ui": { "progressBar": false, "breadcrumbs": true }
  }
}

// Engine reads config
const { ui } = journeyTypes[journey.type];
```

## Rule 3: State Machines Over Imperative Updates

**WRONG:** Manual state transitions with conditionals

```typescript
// ❌ VIOLATION: Imperative state management
const handleNext = () => {
  if (state === 'idle' && hasLens) {
    setState('ready');
  } else if (state === 'ready' && hasInput) {
    setState('processing');
  }
  // State explosion...
};
```

**RIGHT:** Declarative state machine

```typescript
// ✅ CORRECT: XState machine
const engagementMachine = createMachine({
  id: 'engagement',
  initial: 'anonymous',
  states: {
    anonymous: {
      on: { SELECT_LENS: 'lensActive' }
    },
    lensActive: {
      on: { 
        START_JOURNEY: 'journeyActive',
        CHANGE_LENS: 'lensActive'
      }
    },
    journeyActive: {
      on: { COMPLETE_JOURNEY: 'journeyComplete' }
    }
  }
});
```

## Rule 4: Behavior Tests Over Implementation Tests

**WRONG:** Testing internal state or CSS classes

```typescript
// ❌ VIOLATION: Testing implementation
expect(state.isOpen).toBe(true);
expect(element).toHaveClass('translate-x-0');
expect(mockHandler).toHaveBeenCalled();
```

**RIGHT:** Testing user-visible behavior

```typescript
// ✅ CORRECT: Testing behavior
await expect(terminal).toBeVisible();
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled();
```

**Why:** Implementation details change; user behavior is stable. Tests shouldn't break when you refactor CSS or rename internal state.

## Rule 5: Config-Driven Feature Flags

**WRONG:** Hardcoded feature checks

```typescript
// ❌ VIOLATION: Hardcoded features
if (SHOW_NEW_FEATURE) {
  renderNewFeature();
}
```

**RIGHT:** Feature flags in config

```typescript
// ✅ CORRECT: Config-driven
// config/features.json
{
  "newFeature": {
    "enabled": true,
    "rolloutPercent": 50
  }
}

// Engine evaluates
const features = useFeatures();
if (features.isEnabled('newFeature')) {
  renderNewFeature();
}
```

## Rule 6: Single Source of Truth

**WRONG:** Same data defined in multiple places

```typescript
// ❌ VIOLATION: Duplicated definitions
// In component A
const LENSES = ['engineer', 'academic', 'citizen'];

// In component B  
const validLenses = ['engineer', 'academic', 'citizen'];

// In validation
if (!['engineer', 'academic', 'citizen'].includes(lens)) { ... }
```

**RIGHT:** Config is the source, code references it

```typescript
// ✅ CORRECT: Single source
// config/lenses.json
["engineer", "academic", "citizen"]

// All code references config
import lenses from './config/lenses.json';
const LENSES = lenses;
const validLenses = lenses;
const isValid = lenses.includes(lens);
```

## Applying to Existing Code: Migration Pattern

When you encounter violations in existing code, migrate using this pattern:

### Step 1: Extract to Config
```typescript
// Before: Hardcoded
if (type === 'A') return 'red';
if (type === 'B') return 'blue';

// After: Config
// config/type-colors.json
{ "A": "red", "B": "blue" }

const color = typeColors[type];
```

### Step 2: Create Adapter (Temporary)
```typescript
// Adapter bridges old and new
function getColor(type: string): string {
  // New: config-driven
  if (typeColors[type]) return typeColors[type];
  // Old: fallback during migration
  return legacyGetColor(type);
}
```

### Step 3: Migrate Consumers
Update all callers to use new pattern, then remove adapter.

### Step 4: Delete Legacy Code
Once all consumers migrated, remove the old implementation.

## Testing Declarative Systems

### Test Config Validity
```typescript
test('all lens configs have required fields', () => {
  for (const [id, config] of Object.entries(lensConfigs)) {
    expect(config.label).toBeDefined();
    expect(config.description).toBeDefined();
  }
});
```

### Test Engine Interpretation
```typescript
test('engine applies lens config correctly', () => {
  const result = applyLensConfig('engineer');
  expect(result.showTechnicalDetails).toBe(true);
});
```

### Test User Behavior (E2E)
```typescript
test('selecting engineer lens shows technical details', async ({ page }) => {
  await selectLens(page, 'engineer');
  await expect(page.getByTestId('technical-details')).toBeVisible();
});
```

## Health Integration

Declarative health checks should reference behavioral tests:

```json
{
  "id": "lens-selection-works",
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:lens selection persists",
  "impact": "Users cannot select viewing perspective",
  "inspect": "npx playwright test -g 'lens selection'"
}
```

This creates a chain: **Config → Engine → Behavior → Test → Health Check**

## Checklist Before Committing

Before any Grove commit, verify:

- [ ] No new `handle*` callbacks for domain logic
- [ ] No new `if (type === 'foo')` conditionals
- [ ] Behavior defined in config, not code
- [ ] Tests verify user behavior, not implementation
- [ ] State transitions are declarative (XState or config)
- [ ] Single source of truth for all definitions

## When Rules Can Be Bent

These rules can be relaxed for:

1. **Performance-critical paths** where config lookup is too slow
2. **Framework constraints** where the framework requires handlers
3. **Transitional code** during migration (with TODO and timeline)

Document exceptions in ADRs with rationale and migration plan.

## References

- `lib/health-validator.js` — Example declarative engine
- `data/infrastructure/health-config.json` — Example declarative config
- `docs/roadmaps/ENGAGEMENT_PHASE2_ROADMAP.md` — Migration from monolith to declarative
