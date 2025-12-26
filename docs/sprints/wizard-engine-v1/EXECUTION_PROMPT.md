# Execution Prompt: wizard-engine-v1

**Sprint:** Declarative Wizard Engine  
**Duration:** ~4-5 hours  
**Prerequisites:** Node.js, npm, Grove Foundation repo at `C:\GitHub\the-grove-foundation`

---

## Mission

Extract the CustomLensWizard's implicit architecture into a **Declarative Wizard Engine** that renders any multi-step personalization flow from JSON schema.

**Success:** CustomLensWizard works identically but is now ~30 lines calling WizardEngine with a JSON schema.

---

## Pre-Flight Check

```bash
cd C:\GitHub\the-grove-foundation
git status                    # Clean working directory
npm run build                 # Compiles successfully
npm test                      # Tests pass
```

---

## Architecture Reference

```
src/
├── core/wizard/              # Types, evaluator, transforms
│   ├── index.ts
│   ├── schema.ts
│   ├── evaluator.ts
│   └── transforms.ts
│
├── surface/components/Wizard/ # UI components
│   ├── index.ts
│   ├── WizardEngine.tsx
│   ├── WizardHeader.tsx
│   ├── WizardProgress.tsx
│   ├── StepRenderer.tsx
│   ├── steps/
│   │   ├── index.ts
│   │   ├── ConsentStep.tsx
│   │   ├── ChoiceStep.tsx
│   │   ├── TextStep.tsx
│   │   ├── GenerationStep.tsx
│   │   ├── SelectionStep.tsx
│   │   └── ConfirmationStep.tsx
│   └── hooks/
│       └── useWizardState.ts
│
└── data/wizards/
    └── custom-lens.wizard.json
```

---

## Epic 1: Core Types & Evaluator

### 1.1 Create `src/core/wizard/schema.ts`

```typescript
// Wizard Schema Types - Declarative definition for multi-step flows

// ============================================================================
// TOP-LEVEL SCHEMA
// ============================================================================

export interface WizardSchema {
  id: string;
  version: string;
  title: string;
  description?: string;
  steps: WizardStepSchema[];
  initialStep: string;
  generation?: GenerationConfig;
  output: OutputConfig;
  analytics?: AnalyticsConfig;
  theme?: ThemeConfig;
}

export interface GenerationConfig {
  endpoint: string;
  method: 'POST';
  inputMapping: Record<string, string>;
  outputKey: string;
}

export interface OutputConfig {
  type: string;
  transform?: string;
}

export interface AnalyticsConfig {
  startEvent: string;
  stepEvent: string;
  completeEvent: string;
  abandonEvent: string;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor?: string;
}

// ============================================================================
// STEP SCHEMAS
// ============================================================================

export type WizardStepSchema =
  | ConsentStepSchema
  | ChoiceStepSchema
  | TextStepSchema
  | GenerationStepSchema
  | SelectionStepSchema
  | ConfirmationStepSchema;

interface BaseStepSchema {
  id: string;
  type: string;
  title?: string;
  progress?: number;
}

export interface ConsentStepSchema extends BaseStepSchema {
  type: 'consent';
  headline: string;
  guarantees: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  acceptLabel: string;
  acceptAction: StepAction;
  cancelLabel?: string;
}

export interface ChoiceStepSchema extends BaseStepSchema {
  type: 'choice';
  question: string;
  subtext?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  inputKey: string;
  allowOther?: boolean;
  otherKey?: string;
  next: ConditionalAction;
}

export interface TextStepSchema extends BaseStepSchema {
  type: 'text';
  question: string;
  subtext?: string;
  inputKey: string;
  placeholder?: string;
  maxLength?: number;
  optional?: boolean;
  next: StepAction;
}

export interface GenerationStepSchema extends BaseStepSchema {
  type: 'generation';
  loadingMessage: string;
  errorMessage: string;
  retryLabel: string;
  next: StepAction;
}

export interface SelectionStepSchema extends BaseStepSchema {
  type: 'selection';
  headline: string;
  subtext?: string;
  optionsKey: string;
  outputKey: string;
  cardRenderer?: string;
  refineLabel?: string;
  refineAction?: StepAction;
  next: StepAction;
}

export interface ConfirmationStepSchema extends BaseStepSchema {
  type: 'confirmation';
  headline: string;
  displayKey: string;
  benefits: string[];
  privacyReminder?: string;
  confirmLabel: string;
  next: { complete: true };
}

// ============================================================================
// ACTIONS
// ============================================================================

export type StepAction =
  | { next: string }
  | { complete: true }
  | { exit: true };

export interface ConditionalAction {
  conditions?: Array<{
    if: string;
    then: string;
  }>;
  default: string;
}

// ============================================================================
// ENGINE STATE
// ============================================================================

export interface WizardEngineState {
  currentStep: string;
  stepHistory: string[];
  inputs: Record<string, unknown>;
  generatedOptions: unknown[];
  selectedOption: unknown | null;
  isGenerating: boolean;
  error: string | null;
}
```

### 1.2 Create `src/core/wizard/evaluator.ts`

```typescript
/**
 * Condition Expression Evaluator
 * 
 * Safely evaluates simple condition expressions without using eval().
 * 
 * Supported expressions:
 * - "key"              → truthy check
 * - "!key"             → falsy check  
 * - "key === 'value'"  → equality
 * - "key !== 'value'"  → inequality
 */

export function evaluateCondition(
  expression: string,
  inputs: Record<string, unknown>
): boolean {
  const trimmed = expression.trim();

  // Truthy check: "key"
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return Boolean(inputs[trimmed]);
  }

  // Falsy check: "!key"
  if (/^![a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    const key = trimmed.slice(1);
    return !inputs[key];
  }

  // Equality: "key === 'value'" or 'key === "value"'
  const eqMatch = trimmed.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*===\s*['"](.+)['"]$/
  );
  if (eqMatch) {
    const [, key, value] = eqMatch;
    return inputs[key] === value;
  }

  // Inequality: "key !== 'value'"
  const neqMatch = trimmed.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*!==\s*['"](.+)['"]$/
  );
  if (neqMatch) {
    const [, key, value] = neqMatch;
    return inputs[key] !== value;
  }

  console.warn(`[WizardEngine] Invalid condition expression: "${expression}"`);
  return false;
}

/**
 * Evaluate a ConditionalAction and return the target step ID
 */
export function evaluateNextStep(
  action: { conditions?: Array<{ if: string; then: string }>; default: string },
  inputs: Record<string, unknown>
): string {
  if (action.conditions) {
    for (const condition of action.conditions) {
      if (evaluateCondition(condition.if, inputs)) {
        return condition.then;
      }
    }
  }
  return action.default;
}
```

### 1.3 Create `src/core/wizard/index.ts`

```typescript
// Wizard Engine - Core exports

export * from './schema';
export { evaluateCondition, evaluateNextStep } from './evaluator';
```

**Checkpoint:**
```bash
npm run build
```

---

## Epic 2: UI Primitives

### 2.1 Create `src/surface/components/Wizard/WizardHeader.tsx`

Reference existing style from `components/Terminal/CustomLensWizard/PrivacyStep.tsx` for visual consistency.

```typescript
import React from 'react';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

interface WizardHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  onCancel: () => void;
}

export function WizardHeader({
  title,
  subtitle,
  canGoBack = false,
  onBack,
  onCancel
}: WizardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
      <div className="flex items-center space-x-2">
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-1 p-1.5 -ml-1.5 rounded-md hover:bg-ink/5 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-ink-muted" />
            <span className="text-xs text-ink-muted">Back</span>
          </button>
        )}
        {!canGoBack && (
          <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
            {title}
          </div>
        )}
      </div>
      {canGoBack && (
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          {subtitle || title}
        </div>
      )}
      <button
        onClick={onCancel}
        className="p-1.5 rounded-md hover:bg-ink/5 transition-colors"
        title="Cancel"
      >
        <XIcon className="w-4 h-4 text-ink-muted" />
      </button>
    </div>
  );
}
```

### 2.2 Create `src/surface/components/Wizard/WizardProgress.tsx`

```typescript
import React from 'react';

interface WizardProgressProps {
  current: number;
  total: number;
  color?: string;
}

export function WizardProgress({ current, total, color = 'purple' }: WizardProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="h-1 bg-ink/5">
      <div
        className={`h-full bg-${color}-500 transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

**Checkpoint:**
```bash
npm run build
```

---

## Epic 3: Step Components

Create each step component in `src/surface/components/Wizard/steps/`.

**IMPORTANT:** Reference existing components for exact styling:
- `ConsentStep` → `components/Terminal/CustomLensWizard/PrivacyStep.tsx`
- `ChoiceStep` → `components/Terminal/CustomLensWizard/InputStep.tsx`
- `TextStep` → `components/Terminal/CustomLensWizard/InputStep.tsx` (worldview mode)
- `GenerationStep` → `components/Terminal/CustomLensWizard/GeneratingStep.tsx`
- `SelectionStep` → `components/Terminal/CustomLensWizard/SelectStep.tsx`
- `ConfirmationStep` → `components/Terminal/CustomLensWizard/ConfirmStep.tsx`

Each component should:
1. Accept schema as prop (typed appropriately)
2. Accept callbacks for actions
3. Match visual styling exactly
4. Be self-contained (no external state dependencies)

### 3.7 Create `src/surface/components/Wizard/steps/index.ts`

```typescript
export { ConsentStep } from './ConsentStep';
export { ChoiceStep } from './ChoiceStep';
export { TextStep } from './TextStep';
export { GenerationStep } from './GenerationStep';
export { SelectionStep } from './SelectionStep';
export { ConfirmationStep } from './ConfirmationStep';
```

**Checkpoint:**
```bash
npm run build
```

---

## Epic 4: State Management

### 4.1 Create `src/surface/components/Wizard/hooks/useWizardState.ts`

See ARCHITECTURE.md for full implementation. Key points:
- useReducer for state management
- Step history for back navigation
- evaluateNextStep for conditional routing

**Checkpoint:**
```bash
npm run build
npm test
```

---

## Epic 5: Step Router

### 5.1 Create `src/surface/components/Wizard/StepRenderer.tsx`

See ARCHITECTURE.md for implementation. Routes step.type to correct component.

**Checkpoint:**
```bash
npm run build
```

---

## Epic 6: WizardEngine

### 6.1 Create `src/surface/components/Wizard/WizardEngine.tsx`

See ARCHITECTURE.md for full implementation. Key responsibilities:
- Initialize state from schema
- Handle step completion
- Handle generation API calls
- Fire analytics events
- Manage back navigation

### 6.2 Create `src/core/wizard/transforms.ts`

```typescript
import { WizardEngineState, OutputConfig } from './schema';
import { LensCandidate, CustomLens } from '../schema/lens';

export function transformOutput<T>(
  state: WizardEngineState,
  config: OutputConfig
): T {
  // For now, return the selected option directly
  // Transform functions can be registered for specific output types
  return state.selectedOption as T;
}

export function createCustomLensFromWizard(
  candidate: LensCandidate,
  inputs: Record<string, unknown>
): CustomLens {
  // Transform LensCandidate to CustomLens format
  // This preserves the existing transformation logic
  return {
    id: `custom-${Date.now()}`,
    publicLabel: candidate.publicLabel,
    description: candidate.description,
    toneGuidance: candidate.toneGuidance,
    narrativeStyle: candidate.narrativeStyle,
    arcEmphasis: candidate.arcEmphasis,
    openingPhase: candidate.openingPhase,
    archetypeMapping: candidate.archetypeMapping,
    isCustom: true,
    createdAt: new Date().toISOString(),
    userInputs: inputs
  };
}
```

### 6.3 Create `src/surface/components/Wizard/index.ts`

```typescript
export { WizardEngine } from './WizardEngine';
export type { WizardEngineProps } from './WizardEngine';
```

**Checkpoint:**
```bash
npm run build
```

---

## Epic 7: Lens Wizard Schema

### 7.1 Create `src/data/wizards/custom-lens.wizard.json`

Extract from current CustomLensWizard. Full schema in `docs/patterns/pattern-10-declarative-wizard-engine.md`.

Key sections:
- 9 steps (privacy, 5 inputs, generating, select, confirm)
- Conditional: motivation=worried → concerns, else → outlook
- Generation: POST /api/generate-lens
- Analytics: existing event names

**Checkpoint:**
```bash
npm run build  # Verify JSON imports correctly
```

---

## Epic 8: Migration

### 8.1 Refactor `components/Terminal/CustomLensWizard/index.tsx`

```typescript
import React, { useCallback } from 'react';
import { WizardEngine } from '@/surface/components/Wizard';
import { createCustomLensFromWizard } from '@/core/wizard/transforms';
import { LensCandidate, CustomLens, UserInputs } from '@/types/lens';
import customLensSchema from '@/data/wizards/custom-lens.wizard.json';
import { WizardSchema } from '@/core/wizard';

interface CustomLensWizardProps {
  onComplete: (lens: CustomLens, userInputs: Partial<UserInputs>) => void;
  onCancel: () => void;
}

const CustomLensWizard: React.FC<CustomLensWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const handleComplete = useCallback((result: { 
    selectedOption: LensCandidate; 
    inputs: Record<string, unknown> 
  }) => {
    const lens = createCustomLensFromWizard(
      result.selectedOption, 
      result.inputs
    );
    onComplete(lens, result.inputs as Partial<UserInputs>);
  }, [onComplete]);

  return (
    <WizardEngine
      schema={customLensSchema as WizardSchema}
      onComplete={handleComplete}
      onCancel={onCancel}
    />
  );
};

export default CustomLensWizard;
```

### 8.2 Manual Verification Checklist

Run the app and verify:

- [ ] **Privacy step** — Renders with guarantees, accept/cancel work
- [ ] **Motivation step** — All 6 options render, selection works
- [ ] **Conditional flow** — Select "worried" → shows concerns; others → skip to outlook
- [ ] **Concerns step** — Renders when applicable
- [ ] **Outlook step** — All options work
- [ ] **Professional step** — All options work
- [ ] **Worldview step** — Text input, character counter, optional skip
- [ ] **Generation** — Loading state, API call succeeds
- [ ] **Selection** — 3 options render, preview works, selection highlights
- [ ] **Refine** — "None fit" returns to motivation
- [ ] **Confirmation** — Shows selected lens, benefits list
- [ ] **Complete** — Creates lens, wizard closes
- [ ] **Back navigation** — Works at every step
- [ ] **Cancel** — Closes wizard from any step
- [ ] **Analytics** — Events fire (check Network/Console)
- [ ] **Visual parity** — Looks identical to before

**Final Build Gate:**
```bash
npm run build
npm run lint
npm test
```

---

## Troubleshooting

### JSON import fails
```typescript
// Add to tsconfig.json if needed
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

### Type errors on schema
```typescript
// Cast if TypeScript can't infer
import schema from './schema.json';
const typedSchema = schema as WizardSchema;
```

### Analytics not firing
- Check schema.analytics is defined
- Verify trackEvent import path
- Check console for errors

### Generation fails
- Verify API endpoint exists
- Check inputMapping matches schema keys
- Verify API response shape matches outputKey

---

## Commit Sequence

```bash
git add src/core/wizard/
git commit -m "feat(wizard): add schema types and condition evaluator"

git add src/surface/components/Wizard/WizardHeader.tsx src/surface/components/Wizard/WizardProgress.tsx
git commit -m "feat(wizard): add WizardHeader and WizardProgress components"

git add src/surface/components/Wizard/steps/
git commit -m "feat(wizard): add step components"

git add src/surface/components/Wizard/hooks/
git commit -m "feat(wizard): add useWizardState hook"

git add src/surface/components/Wizard/StepRenderer.tsx
git commit -m "feat(wizard): add StepRenderer"

git add src/surface/components/Wizard/WizardEngine.tsx src/surface/components/Wizard/index.ts
git commit -m "feat(wizard): add WizardEngine orchestrator"

git add src/data/wizards/
git commit -m "feat(wizard): add custom-lens.wizard.json schema"

git add components/Terminal/CustomLensWizard/
git commit -m "refactor(lens-wizard): migrate to declarative WizardEngine"
```

---

## Success Criteria

- [ ] All wizard steps render from JSON schema
- [ ] Conditional flow works from schema
- [ ] Generation endpoint configurable via schema
- [ ] Analytics events fire correctly
- [ ] Visual appearance unchanged
- [ ] CustomLensWizard reduced to ~30 lines
- [ ] Build passes, tests pass

---

*Execution prompt ready for handoff to Claude Code CLI*
