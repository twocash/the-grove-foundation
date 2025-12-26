# Migration Map: wizard-engine-v1

**Sprint:** Declarative Wizard Engine

---

## File Operations Summary

| Operation | Count |
|-----------|-------|
| **Create** | 13 |
| **Modify** | 3 |
| **Delete** | 0 (deferred) |

---

## Create (13 files)

### Core Types & Logic

| File | Purpose | Lines |
|------|---------|-------|
| `src/core/wizard/index.ts` | Barrel export | ~15 |
| `src/core/wizard/schema.ts` | TypeScript interfaces | ~120 |
| `src/core/wizard/evaluator.ts` | Condition expression parser | ~50 |
| `src/core/wizard/transforms.ts` | Output transform functions | ~40 |

### Engine Components

| File | Purpose | Lines |
|------|---------|-------|
| `src/surface/components/Wizard/index.ts` | Barrel export | ~10 |
| `src/surface/components/Wizard/WizardEngine.tsx` | Main orchestrator | ~120 |
| `src/surface/components/Wizard/WizardHeader.tsx` | Header with navigation | ~50 |
| `src/surface/components/Wizard/WizardProgress.tsx` | Progress bar | ~30 |
| `src/surface/components/Wizard/StepRenderer.tsx` | Step type router | ~80 |
| `src/surface/components/Wizard/hooks/useWizardState.ts` | State management | ~100 |

### Step Components

| File | Purpose | Lines |
|------|---------|-------|
| `src/surface/components/Wizard/steps/index.ts` | Barrel export | ~10 |
| `src/surface/components/Wizard/steps/ConsentStep.tsx` | Privacy/consent step | ~80 |
| `src/surface/components/Wizard/steps/ChoiceStep.tsx` | Single choice step | ~100 |
| `src/surface/components/Wizard/steps/TextStep.tsx` | Free text input | ~70 |
| `src/surface/components/Wizard/steps/GenerationStep.tsx` | AI generation loading | ~60 |
| `src/surface/components/Wizard/steps/SelectionStep.tsx` | Option selection | ~120 |
| `src/surface/components/Wizard/steps/ConfirmationStep.tsx` | Final confirmation | ~90 |

### Data

| File | Purpose | Lines |
|------|---------|-------|
| `src/data/wizards/custom-lens.wizard.json` | Lens wizard schema | ~180 |

**Total New Lines:** ~1,325

---

## Modify (3 files)

### 1. `components/Terminal/CustomLensWizard/index.tsx`

**Current:** 283 lines of orchestration + state management

**Change:** Replace with WizardEngine wrapper

```typescript
// BEFORE (283 lines)
const CustomLensWizard: React.FC<CustomLensWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD_STATE);
  // ... 250+ lines of handlers, state management, rendering
};

// AFTER (~30 lines)
import { WizardEngine } from '@/surface/components/Wizard';
import customLensSchema from '@/data/wizards/custom-lens.wizard.json';
import { createCustomLensFromWizard } from '@/core/wizard/transforms';

const CustomLensWizard: React.FC<CustomLensWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const handleComplete = useCallback((result: WizardResult) => {
    const lens = createCustomLensFromWizard(result);
    onComplete(lens, result.inputs);
  }, [onComplete]);

  return (
    <WizardEngine
      schema={customLensSchema}
      onComplete={handleComplete}
      onCancel={onCancel}
    />
  );
};
```

**Net change:** -250 lines (~89% reduction)

### 2. `src/core/schema/index.ts`

**Change:** Add wizard schema exports

```typescript
// Add to exports
export * from './wizard';
```

### 3. `src/surface/components/index.ts`

**Change:** Add Wizard exports

```typescript
// Add to exports
export * from './Wizard';
```

---

## Deferred Deletion (Future Sprint)

After migration is validated and stable:

| File | Reason to Keep (For Now) |
|------|-------------------------|
| `components/Terminal/CustomLensWizard/PrivacyStep.tsx` | Reference for styling |
| `components/Terminal/CustomLensWizard/InputStep.tsx` | Reference for styling |
| `components/Terminal/CustomLensWizard/GeneratingStep.tsx` | Reference for styling |
| `components/Terminal/CustomLensWizard/SelectStep.tsx` | Reference for styling |
| `components/Terminal/CustomLensWizard/ConfirmStep.tsx` | Reference for styling |

**Deletion criteria:** 
- All tests pass
- Visual parity confirmed
- 1 week of production stability

---

## Dependency Graph

```
src/core/wizard/
├── schema.ts          ← No dependencies (types only)
├── evaluator.ts       ← No dependencies (pure functions)
└── transforms.ts      ← Depends on schema.ts

src/surface/components/Wizard/
├── hooks/
│   └── useWizardState.ts  ← Depends on core/wizard/schema, evaluator
├── steps/
│   └── *.tsx              ← Depend on core/wizard/schema
├── StepRenderer.tsx       ← Depends on steps/, core/wizard
├── WizardHeader.tsx       ← No dependencies
├── WizardProgress.tsx     ← No dependencies
└── WizardEngine.tsx       ← Depends on all above

components/Terminal/CustomLensWizard/
└── index.tsx              ← Depends on surface/components/Wizard
```

---

## Build Order

Execute in this order to avoid import errors:

1. **Epic 1:** Core types (`src/core/wizard/`)
2. **Epic 2:** UI primitives (`WizardHeader`, `WizardProgress`)
3. **Epic 3:** Step components (`steps/`)
4. **Epic 4:** State hook (`useWizardState`)
5. **Epic 5:** Step router (`StepRenderer`)
6. **Epic 6:** Engine (`WizardEngine`)
7. **Epic 7:** Schema file (`custom-lens.wizard.json`)
8. **Epic 8:** Migration (`CustomLensWizard` refactor)

---

## Verification Points

After each epic:

```bash
npm run build          # Must pass
npm run lint           # Must pass
npm test               # Must pass
```

After Epic 8 (migration):

```bash
# Manual verification
- [ ] Privacy step renders correctly
- [ ] All 5 input steps work
- [ ] Conditional flow (skip concerns) works
- [ ] Generation calls API
- [ ] Selection shows 3 options
- [ ] Confirmation shows selected lens
- [ ] Analytics events fire
- [ ] Back navigation works
- [ ] Visual appearance matches original
```

---

*Migration map finalized: December 2024*
