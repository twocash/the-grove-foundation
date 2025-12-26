# Sprint Breakdown: wizard-engine-v1

**Duration:** ~4-5 hours  
**Epics:** 8  
**Stories:** 18

---

## Epic 1: Core Types & Evaluator (~30 min)

**Goal:** Establish type foundation and condition evaluation logic.

### Story 1.1: Create wizard schema types
**File:** `src/core/wizard/schema.ts`  
**Task:** Define all TypeScript interfaces for wizard schemas  
**Tests:** Type-only (compile-time verification)  
**Acceptance:**
- [ ] WizardSchema interface complete
- [ ] All 6 step type interfaces complete
- [ ] StepAction and ConditionalAction types complete
- [ ] Exports via barrel file

### Story 1.2: Implement condition evaluator
**File:** `src/core/wizard/evaluator.ts`  
**Task:** Create safe expression parser for conditions  
**Tests:** Unit tests for each expression type  
**Acceptance:**
- [ ] Truthy check: `"key"` → `Boolean(inputs[key])`
- [ ] Falsy check: `"!key"` → `!inputs[key]`
- [ ] Equality: `"key === 'value'"` works
- [ ] Inequality: `"key !== 'value'"` works
- [ ] Invalid expressions return false (with warning)

### Story 1.3: Create barrel exports
**File:** `src/core/wizard/index.ts`  
**Task:** Export all types and functions  
**Acceptance:**
- [ ] All schema types exported
- [ ] evaluateCondition exported

**Build Gate:**
```bash
npm run build
npm run lint
```

---

## Epic 2: UI Primitives (~20 min)

**Goal:** Create header and progress bar components.

### Story 2.1: WizardHeader component
**File:** `src/surface/components/Wizard/WizardHeader.tsx`  
**Task:** Header with title, back button, close button  
**Acceptance:**
- [ ] Shows wizard title
- [ ] Back button (when canGoBack=true)
- [ ] Close/cancel button
- [ ] Matches existing visual style

### Story 2.2: WizardProgress component
**File:** `src/surface/components/Wizard/WizardProgress.tsx`  
**Task:** Progress bar showing step completion  
**Acceptance:**
- [ ] Shows current/total progress
- [ ] Animated width transition
- [ ] Configurable color via theme

**Build Gate:**
```bash
npm run build
```

---

## Epic 3: Step Components (~60 min)

**Goal:** Create all 6 generic step renderers.

### Story 3.1: ConsentStep component
**File:** `src/surface/components/Wizard/steps/ConsentStep.tsx`  
**Task:** Privacy/intro step with guarantees list  
**Acceptance:**
- [ ] Renders headline
- [ ] Renders guarantees with icons
- [ ] Accept button calls onAccept
- [ ] Cancel button calls onCancel
- [ ] Visual match with existing PrivacyStep

### Story 3.2: ChoiceStep component
**File:** `src/surface/components/Wizard/steps/ChoiceStep.tsx`  
**Task:** Single-choice question with options  
**Acceptance:**
- [ ] Renders question and subtext
- [ ] Renders all options as radio buttons
- [ ] Supports "other" option with text input
- [ ] Continue button enables when selection made
- [ ] Visual match with existing InputStep

### Story 3.3: TextStep component
**File:** `src/surface/components/Wizard/steps/TextStep.tsx`  
**Task:** Free text input with character limit  
**Acceptance:**
- [ ] Renders question and subtext
- [ ] Textarea with maxLength
- [ ] Character counter
- [ ] Optional field support (can skip)
- [ ] Visual match with existing worldview step

### Story 3.4: GenerationStep component
**File:** `src/surface/components/Wizard/steps/GenerationStep.tsx`  
**Task:** Loading state during AI generation  
**Acceptance:**
- [ ] Shows loading message and spinner
- [ ] Shows error message on failure
- [ ] Retry button calls onRetry
- [ ] Visual match with existing GeneratingStep

### Story 3.5: SelectionStep component
**File:** `src/surface/components/Wizard/steps/SelectionStep.tsx`  
**Task:** Display and select from generated options  
**Acceptance:**
- [ ] Renders headline and subtext
- [ ] Renders option cards (generic or custom)
- [ ] Selection highlights card
- [ ] Preview/expand functionality
- [ ] Refine link (optional)
- [ ] Continue enabled when selected
- [ ] Visual match with existing SelectStep

### Story 3.6: ConfirmationStep component
**File:** `src/surface/components/Wizard/steps/ConfirmationStep.tsx`  
**Task:** Final confirmation before completion  
**Acceptance:**
- [ ] Renders selected item details
- [ ] Renders benefits list
- [ ] Privacy reminder (if configured)
- [ ] Confirm button calls onConfirm
- [ ] Visual match with existing ConfirmStep

### Story 3.7: Step barrel export
**File:** `src/surface/components/Wizard/steps/index.ts`  
**Task:** Export all step components  

**Build Gate:**
```bash
npm run build
npm run lint
```

---

## Epic 4: State Management (~30 min)

**Goal:** Create useWizardState hook with reducer pattern.

### Story 4.1: Implement useWizardState hook
**File:** `src/surface/components/Wizard/hooks/useWizardState.ts`  
**Task:** State management with reducer  
**Acceptance:**
- [ ] Initializes from schema.initialStep
- [ ] goToStep adds to history
- [ ] goBack pops from history
- [ ] updateInputs merges partial updates
- [ ] setGeneratedOptions/setSelectedOption work
- [ ] setGenerating/setError work
- [ ] evaluateNextStep handles ConditionalAction
- [ ] getProgress returns current step progress
- [ ] canGoBack returns history.length > 0

**Tests:**
```typescript
describe('useWizardState', () => {
  it('initializes with schema.initialStep');
  it('navigates forward and tracks history');
  it('navigates back through history');
  it('evaluates conditional next step');
});
```

**Build Gate:**
```bash
npm run build
npm test
```

---

## Epic 5: Step Router (~20 min)

**Goal:** Create StepRenderer that routes to correct component.

### Story 5.1: Implement StepRenderer
**File:** `src/surface/components/Wizard/StepRenderer.tsx`  
**Task:** Route step schema to correct component  
**Acceptance:**
- [ ] Routes 'consent' → ConsentStep
- [ ] Routes 'choice' → ChoiceStep
- [ ] Routes 'text' → TextStep
- [ ] Routes 'generation' → GenerationStep
- [ ] Routes 'selection' → SelectionStep
- [ ] Routes 'confirmation' → ConfirmationStep
- [ ] Handles unknown type gracefully

**Build Gate:**
```bash
npm run build
```

---

## Epic 6: WizardEngine Orchestrator (~45 min)

**Goal:** Create main engine component that ties everything together.

### Story 6.1: Implement WizardEngine
**File:** `src/surface/components/Wizard/WizardEngine.tsx`  
**Task:** Main orchestrator component  
**Acceptance:**
- [ ] Accepts schema, onComplete, onCancel props
- [ ] Uses useWizardState for state management
- [ ] Renders WizardHeader with navigation
- [ ] Renders WizardProgress
- [ ] Renders StepRenderer with current step
- [ ] handleStepComplete routes to next step or completes
- [ ] handleGenerate calls API per schema config
- [ ] Analytics events fire per schema config
- [ ] Back navigation works through history

### Story 6.2: Create transforms module
**File:** `src/core/wizard/transforms.ts`  
**Task:** Output transform functions  
**Acceptance:**
- [ ] transformOutput extracts result from state
- [ ] createCustomLensFromWizard transforms to CustomLens

### Story 6.3: Wizard barrel export
**File:** `src/surface/components/Wizard/index.ts`  
**Task:** Export WizardEngine and types  

**Build Gate:**
```bash
npm run build
npm run lint
```

---

## Epic 7: Lens Wizard Schema (~30 min)

**Goal:** Extract current wizard definition to JSON.

### Story 7.1: Create custom-lens.wizard.json
**File:** `src/data/wizards/custom-lens.wizard.json`  
**Task:** Full wizard schema for lens creation  
**Acceptance:**
- [ ] All 9 steps defined
- [ ] All questions and options match current
- [ ] Conditional flow (motivation → concerns/outlook) works
- [ ] Generation config points to /api/generate-lens
- [ ] Analytics events match current
- [ ] Progress values set correctly

### Story 7.2: Validate schema loads correctly
**Task:** Verify JSON imports and type-checks  
**Acceptance:**
- [ ] JSON imports without error
- [ ] TypeScript accepts as WizardSchema

**Build Gate:**
```bash
npm run build
```

---

## Epic 8: Migration & Verification (~45 min)

**Goal:** Replace CustomLensWizard with WizardEngine.

### Story 8.1: Refactor CustomLensWizard
**File:** `components/Terminal/CustomLensWizard/index.tsx`  
**Task:** Replace implementation with WizardEngine wrapper  
**Acceptance:**
- [ ] Imports WizardEngine and schema
- [ ] Passes schema to WizardEngine
- [ ] handleComplete transforms and calls original onComplete
- [ ] onCancel passed through
- [ ] Component reduced to ~30 lines

### Story 8.2: Manual verification
**Task:** Test all wizard flows manually  
**Acceptance:**
- [ ] Privacy step renders
- [ ] All 5 input steps work
- [ ] Conditional skip works (non-worried → skip concerns)
- [ ] Generation calls API
- [ ] Selection shows 3 options
- [ ] Preview/expand works
- [ ] Refine navigates back
- [ ] Confirmation shows selection
- [ ] Complete creates lens
- [ ] Analytics events fire (check console)
- [ ] Back navigation works at each step
- [ ] Cancel exits wizard
- [ ] Visual appearance matches original

### Story 8.3: Update exports
**Files:** `src/core/schema/index.ts`, `src/surface/components/index.ts`  
**Task:** Add wizard exports to barrel files  

**Final Build Gate:**
```bash
npm run build
npm run lint
npm test
npx playwright test  # If E2E tests exist
```

---

## Summary

| Epic | Stories | Est. Time |
|------|---------|-----------|
| 1. Core Types | 3 | 30 min |
| 2. UI Primitives | 2 | 20 min |
| 3. Step Components | 7 | 60 min |
| 4. State Management | 1 | 30 min |
| 5. Step Router | 1 | 20 min |
| 6. WizardEngine | 3 | 45 min |
| 7. Schema | 2 | 30 min |
| 8. Migration | 3 | 45 min |
| **Total** | **22** | **~4.5 hrs** |

---

## Commit Sequence

```bash
# Epic 1
git commit -m "feat(wizard): add schema types and condition evaluator"

# Epic 2
git commit -m "feat(wizard): add WizardHeader and WizardProgress components"

# Epic 3
git commit -m "feat(wizard): add step components (consent, choice, text, generation, selection, confirmation)"

# Epic 4
git commit -m "feat(wizard): add useWizardState hook with reducer pattern"

# Epic 5
git commit -m "feat(wizard): add StepRenderer component"

# Epic 6
git commit -m "feat(wizard): add WizardEngine orchestrator"

# Epic 7
git commit -m "feat(wizard): add custom-lens.wizard.json schema"

# Epic 8
git commit -m "refactor(lens-wizard): migrate to declarative WizardEngine"
```

---

*Sprint breakdown finalized: December 2024*
