# Repository Audit: wizard-engine-v1

**Purpose:** Analyze existing CustomLensWizard to inform engine extraction.

---

## Current Implementation Analysis

### File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `components/Terminal/CustomLensWizard/index.tsx` | 283 | Main orchestrator |
| `components/Terminal/CustomLensWizard/PrivacyStep.tsx` | 145 | Consent/privacy step |
| `components/Terminal/CustomLensWizard/InputStep.tsx` | 316 | Multi-question input step |
| `components/Terminal/CustomLensWizard/GeneratingStep.tsx` | ~80 | AI generation loading |
| `components/Terminal/CustomLensWizard/SelectStep.tsx` | 266 | Generated option selection |
| `components/Terminal/CustomLensWizard/ConfirmStep.tsx` | 152 | Final confirmation |
| `types/lens.ts` | 49 | Type re-exports (shim) |
| `src/core/schema/lens.ts` | 344 | Core type definitions |

**Total:** ~1,635 lines across 8 files

### What's Already Declarative (Good Bones)

**InputStep.tsx has semi-declarative config:**
```typescript
const STEP_CONFIG: Record<string, {
  question: string;
  subtext?: string;
  options: OptionConfig[];
  inputKey: keyof UserInputs;
  otherKey?: keyof UserInputs;
  progress: number;
}> = {
  'input-motivation': {
    question: 'What brings you to thinking about AI infrastructure?',
    options: MOTIVATION_OPTIONS,
    inputKey: 'motivation',
    otherKey: 'motivationOther',
    progress: 1
  },
  // ... 4 more steps
};
```

**Option arrays are already data:**
```typescript
const MOTIVATION_OPTIONS: OptionConfig[] = [
  { value: 'worried-about-ai', label: "I'm worried about where AI is heading" },
  { value: 'researching-distributed-systems', label: "I'm researching distributed systems" },
  // ...
];
```

### What's Still Imperative (Needs Extraction)

**Flow logic hardcoded in event handler:**
```typescript
const handleInputComplete = useCallback((step: WizardStep) => {
  // Special handling for motivation - skip concerns if not worried
  if (step === 'input-motivation') {
    const motivation = state.userInputs.motivation;
    if (motivation === 'worried-about-ai') {
      goToStep('input-concerns');
    } else {
      goToStep('input-outlook');  // ← HARDCODED SKIP
    }
    return;
  }
  // ...
}, [state.userInputs, goToStep]);
```

**Step rendering is switch-based:**
```typescript
const renderStep = () => {
  switch (state.currentStep) {
    case 'privacy':
      return <PrivacyStep onAccept={handlePrivacyAccept} onCancel={onCancel} />;
    case 'input-motivation':
    case 'input-concerns':
      return <InputStep step={state.currentStep} ... />;
    // ... 6 more cases
  }
};
```

**API endpoint hardcoded:**
```typescript
const response = await fetch('/api/generate-lens', {
  method: 'POST',
  // ...
});
```

### Type Definitions (Reusable)

**WizardStep type:**
```typescript
export type WizardStep =
  | 'privacy'
  | 'input-motivation'
  | 'input-concerns'
  | 'input-outlook'
  | 'input-professional'
  | 'input-worldview'
  | 'generating'
  | 'select'
  | 'confirm';
```

**WizardState type:**
```typescript
export interface WizardState {
  currentStep: WizardStep;
  userInputs: Partial<UserInputs>;
  generatedOptions: LensCandidate[];
  selectedOption: LensCandidate | null;
  isGenerating: boolean;
  error: string | null;
}
```

### Analytics Integration

**Already has event tracking:**
```typescript
import {
  trackWizardStart,
  trackPrivacyAccepted,
  trackInputProvided,
  trackGenerationStarted,
  trackCandidatesShown,
  trackLensSelected,
  trackWizardAbandoned
} from '../../../utils/funnelAnalytics';
```

---

## Dependencies & Integration Points

### State Management
- Uses local `useState` for wizard state
- Does NOT use engagement machine for wizard flow
- `onComplete` callback connects to parent state

### API
- `/api/generate-lens` — POST with userInputs, returns lensOptions[]

### Styling
- Tailwind classes inline
- Uses `bg-paper`, `text-ink`, `text-ink-muted` design tokens
- `bg-purple-*` for accent colors
- `bg-grove-forest` for primary actions

### Icons
- Inline SVG components (not from icon library)
- `ArrowLeftIcon`, `ArrowRightIcon`, `CheckIcon`, etc.

---

## Extraction Opportunities

### What Can Become Schema

| Current Location | Schema Location |
|------------------|-----------------|
| `STEP_CONFIG` object | `steps[]` array in wizard JSON |
| `MOTIVATION_OPTIONS` | `steps[n].options[]` |
| `handleInputComplete` conditionals | `steps[n].next.conditions[]` |
| Progress numbers | `steps[n].progress` |
| API endpoint | `generation.endpoint` |
| Analytics event names | `analytics.{startEvent, stepEvent, ...}` |

### What Stays as Engine Code

- `useWizardState` hook (state management)
- Step renderer components (generic, schema-driven)
- `WizardEngine` orchestrator
- Condition evaluator (interprets `if` expressions)
- Transform functions (convert wizard output to domain types)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Feature parity gap | Medium | High | Create comparison checklist |
| Condition expression bugs | Low | Medium | Use simple equality, not eval() |
| Analytics regression | Low | Medium | Map existing events to schema |
| Type safety loss | Medium | Medium | Generate types from schema |

---

## Success Criteria

- [ ] All 9 wizard steps render from schema
- [ ] Conditional flow (skip concerns) works from schema
- [ ] Generation endpoint configurable via schema
- [ ] Analytics events fire correctly
- [ ] Visual appearance unchanged
- [ ] CustomLensWizard code reduced by ~60%

---

*Audit completed: December 2024*
