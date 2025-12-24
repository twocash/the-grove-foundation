# Execution Prompt — Epic 6: Consumer Migration

## Context

Epics 1-5 created the complete engagement infrastructure. Epic 6 wires this into the application by installing EngagementProvider and migrating components from NarrativeEngineContext to the new hooks.

**This epic is discovery-oriented.** You'll audit the codebase to find consumers, then migrate them systematically.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-6-consumer-migration/`:
- `REPO_AUDIT.md` — Migration strategy overview
- `SPEC.md` — Requirements and goals
- `ARCHITECTURE.md` — Provider installation, migration patterns, API mapping
- `MIGRATION_MAP.md` — Process-oriented guide
- `DECISIONS.md` — ADRs for migration patterns (067-071)
- `SPRINTS.md` — Task breakdown

## Execution Order

### Phase 1: Audit (15 min)

Find NarrativeEngineContext consumers:

```bash
# Find imports
grep -r "useNarrativeEngine" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v ".test."

# Check engagement usage
grep -rn "lens\|journey\|entropy" --include="*.tsx" . | grep -v node_modules | grep -v test
```

Document findings:
- Which components use `lens`?
- Which components use `journey`?
- Which components use `entropy`?

### Phase 2: Install Provider (15 min)

Add EngagementProvider to app root:

```typescript
// app/layout.tsx or providers.tsx
import { EngagementProvider } from '@/core/engagement';

<NarrativeEngineProvider>
  <EngagementProvider>
    {children}
  </EngagementProvider>
</NarrativeEngineProvider>
```

**Verify:** `npm run dev` — app loads without errors

### Phase 3: Migrate First Consumer (30 min)

Choose simplest consumer (single state type):

**Before:**
```typescript
const { lens, setLens } = useNarrativeEngine();
```

**After:**
```typescript
import { useEngagement, useLensState } from '@/core/engagement';

const { actor } = useEngagement();
const { lens, selectLens } = useLensState({ actor });
```

**API Mapping:**
| Old | New |
|-----|-----|
| `setLens(v)` | `selectLens(v)` |
| `isJourneyActive` | `isActive` |
| `advanceJourney()` | `advanceStep()` |

### Phase 4: Migrate Additional Consumers (Variable)

Repeat Phase 3 for each consumer. Migrate fully—don't mix old and new for same state.

### Phase 5: E2E Tests (15 min)

Create `tests/e2e/engagement-migration.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('engagement migration', () => {
  test('app loads with EngagementProvider', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  // Add tests for migrated functionality
});
```

---

## Test Verification

```bash
npm test              # All unit tests pass
npx playwright test   # All E2E tests pass
npm run health        # Health passes
```

---

## Success Criteria

- [ ] NarrativeEngineContext consumers audited
- [ ] EngagementProvider installed at app root
- [ ] At least one component migrated
- [ ] E2E test added for migration
- [ ] All tests pass

---

## Forbidden Actions

- Do NOT remove NarrativeEngineContext (Epic 7)
- Do NOT migrate non-engagement features (messages, loading)
- Do NOT mix old and new for same state in one component

---

## API Reference

### Lens
| NarrativeEngine | Engagement |
|-----------------|------------|
| `lens` | `lens` |
| `setLens(v)` | `selectLens(v)` |

### Journey
| NarrativeEngine | Engagement |
|-----------------|------------|
| `journey` | `journey` |
| `journeyProgress` | `journeyProgress` |
| `isJourneyActive` | `isActive` |
| `startJourney(j)` | `startJourney(j)` |
| `advanceJourney()` | `advanceStep()` |
| `completeJourney()` | `completeJourney()` |
| `exitJourney()` | `exitJourney()` |

### Entropy
| NarrativeEngine | Engagement |
|-----------------|------------|
| `entropy` | `entropy` |
| `entropyThreshold` | `entropyThreshold` |
| `updateEntropy(d)` | `updateEntropy(d)` |
| `resetEntropy()` | `resetEntropy()` |

---

## Troubleshooting

### "useEngagement must be used within EngagementProvider"
Provider not installed correctly. Check app/layout.tsx.

### State not syncing
Don't mix old and new:
```typescript
// BAD
const { lens } = useNarrativeEngine();
const { selectLens } = useLensState({ actor });

// GOOD
const { lens, selectLens } = useLensState({ actor });
```

### Types mismatch
Check API mapping—some names changed (setLens → selectLens).

---

## Commit Message Template

```
feat(app): install EngagementProvider at root

- Add EngagementProvider inside NarrativeEngineProvider
- Both contexts coexist during migration
- Enables new engagement hooks throughout app
```

```
refactor(ComponentName): migrate to engagement hooks

- Replace useNarrativeEngine with useEngagement + useLensState
- Update API calls (setLens → selectLens)
- Full migration - no mixing old/new
```
