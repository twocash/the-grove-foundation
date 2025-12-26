# Architecture: wizard-engine-v1

**Sprint:** Declarative Wizard Engine  
**Version:** 1.0

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DECLARATIVE WIZARD ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   src/data/wizards/               src/core/wizard/                       │
│   ┌────────────────────┐         ┌─────────────────────────────────┐    │
│   │ custom-lens.json   │         │ schema.ts (types)               │    │
│   │ {                  │         │ evaluator.ts (conditions)       │    │
│   │   id, steps, ...   │────────▶│ transforms.ts (output)          │    │
│   │ }                  │         └─────────────────────────────────┘    │
│   └────────────────────┘                       │                         │
│                                                ▼                         │
│                         src/surface/components/Wizard/                   │
│                         ┌─────────────────────────────────┐             │
│                         │ WizardEngine.tsx                │             │
│                         │ ┌─────────────────────────────┐ │             │
│                         │ │ useWizardState()            │ │             │
│                         │ └─────────────────────────────┘ │             │
│                         │              │                  │             │
│                         │              ▼                  │             │
│                         │ ┌─────────────────────────────┐ │             │
│                         │ │ StepRenderer                │ │             │
│                         │ └─────────────────────────────┘ │             │
│                         └─────────────────────────────────┘             │
│                                        │                                 │
│           ┌────────────────────────────┼────────────────────────────┐   │
│           ▼              ▼             ▼             ▼              ▼   │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│     │ Consent  │  │ Choice   │  │  Text    │  │Generation│  │Confirm │ │
│     │  Step    │  │  Step    │  │  Step    │  │  Step    │  │ Step   │ │
│     └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── core/
│   └── wizard/
│       ├── index.ts              # Barrel export
│       ├── schema.ts             # TypeScript interfaces
│       ├── evaluator.ts          # Condition expression evaluator
│       └── transforms.ts         # Output transform functions
│
├── surface/
│   └── components/
│       └── Wizard/
│           ├── index.ts          # Barrel export
│           ├── WizardEngine.tsx  # Main orchestrator
│           ├── WizardHeader.tsx  # Header with back/close
│           ├── WizardProgress.tsx # Progress bar
│           ├── StepRenderer.tsx  # Step type router
│           ├── steps/
│           │   ├── index.ts
│           │   ├── ConsentStep.tsx
│           │   ├── ChoiceStep.tsx
│           │   ├── TextStep.tsx
│           │   ├── GenerationStep.tsx
│           │   ├── SelectionStep.tsx
│           │   └── ConfirmationStep.tsx
│           └── hooks/
│               └── useWizardState.ts
│
└── data/
    └── wizards/
        └── custom-lens.wizard.json
```

---

## Core Components

### 1. WizardEngine (Orchestrator)

```typescript
// src/surface/components/Wizard/WizardEngine.tsx

interface WizardEngineProps<T> {
  schema: WizardSchema;
  onComplete: (result: T) => void;
  onCancel: () => void;
  initialInputs?: Record<string, unknown>;
}

export function WizardEngine<T>({
  schema,
  onComplete,
  onCancel,
  initialInputs
}: WizardEngineProps<T>) {
  const {
    state,
    currentStep,
    currentStepSchema,
    goToStep,
    goBack,
    updateInputs,
    setGeneratedOptions,
    setSelectedOption,
    setError,
    setGenerating,
    getProgress,
    canGoBack
  } = useWizardState(schema, initialInputs);

  // Analytics tracking
  useEffect(() => {
    if (schema.analytics?.startEvent) {
      trackEvent(schema.analytics.startEvent);
    }
  }, []);

  const handleStepComplete = useCallback(async (action: StepAction) => {
    if ('complete' in action && action.complete) {
      const result = transformOutput<T>(state, schema.output);
      if (schema.analytics?.completeEvent) {
        trackEvent(schema.analytics.completeEvent);
      }
      onComplete(result);
    } else if ('exit' in action && action.exit) {
      onCancel();
    } else if ('next' in action) {
      if (schema.analytics?.stepEvent) {
        trackEvent(schema.analytics.stepEvent, { step: currentStep });
      }
      goToStep(action.next);
    }
  }, [state, schema, currentStep, goToStep, onComplete, onCancel]);

  const handleGenerate = useCallback(async () => {
    if (!schema.generation) return;
    
    setGenerating(true);
    setError(null);

    try {
      const body = mapInputs(state.inputs, schema.generation.inputMapping);
      const response = await fetch(schema.generation.endpoint, {
        method: schema.generation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setGeneratedOptions(data[schema.generation.outputKey] || data);
      
      // Auto-advance to next step
      const genStep = currentStepSchema as GenerationStepSchema;
      handleStepComplete(genStep.next);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [schema, state.inputs, currentStepSchema]);

  return (
    <div className="flex flex-col h-full bg-paper">
      <WizardHeader
        title={schema.title}
        canGoBack={canGoBack}
        onBack={goBack}
        onCancel={onCancel}
        currentStep={currentStep}
      />
      <WizardProgress
        current={getProgress()}
        total={getMaxProgress(schema)}
        color={schema.theme?.primaryColor}
      />
      <StepRenderer
        schema={currentStepSchema}
        state={state}
        onUpdateInputs={updateInputs}
        onComplete={handleStepComplete}
        onGenerate={handleGenerate}
        onSelectOption={setSelectedOption}
      />
    </div>
  );
}
```

### 2. useWizardState (State Management)

```typescript
// src/surface/components/Wizard/hooks/useWizardState.ts

interface WizardEngineState {
  currentStep: string;
  stepHistory: string[];
  inputs: Record<string, unknown>;
  generatedOptions: unknown[];
  selectedOption: unknown | null;
  isGenerating: boolean;
  error: string | null;
}

type WizardAction =
  | { type: 'GO_TO_STEP'; stepId: string }
  | { type: 'GO_BACK' }
  | { type: 'UPDATE_INPUTS'; updates: Record<string, unknown> }
  | { type: 'SET_GENERATED_OPTIONS'; options: unknown[] }
  | { type: 'SET_SELECTED_OPTION'; option: unknown }
  | { type: 'SET_GENERATING'; value: boolean }
  | { type: 'SET_ERROR'; error: string | null };

function wizardReducer(
  state: WizardEngineState, 
  action: WizardAction
): WizardEngineState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.stepId,
        stepHistory: [...state.stepHistory, state.currentStep]
      };
    case 'GO_BACK':
      const newHistory = [...state.stepHistory];
      const prevStep = newHistory.pop();
      return {
        ...state,
        currentStep: prevStep || state.currentStep,
        stepHistory: newHistory
      };
    case 'UPDATE_INPUTS':
      return {
        ...state,
        inputs: { ...state.inputs, ...action.updates }
      };
    case 'SET_GENERATED_OPTIONS':
      return { ...state, generatedOptions: action.options };
    case 'SET_SELECTED_OPTION':
      return { ...state, selectedOption: action.option };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

export function useWizardState(
  schema: WizardSchema,
  initialInputs?: Record<string, unknown>
) {
  const [state, dispatch] = useReducer(wizardReducer, {
    currentStep: schema.initialStep,
    stepHistory: [],
    inputs: initialInputs || {},
    generatedOptions: [],
    selectedOption: null,
    isGenerating: false,
    error: null
  });

  const currentStepSchema = useMemo(() => 
    schema.steps.find(s => s.id === state.currentStep),
    [schema.steps, state.currentStep]
  );

  const goToStep = useCallback((stepId: string) => {
    dispatch({ type: 'GO_TO_STEP', stepId });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  // ... other actions

  const evaluateNextStep = useCallback((action: ConditionalAction): string => {
    if (action.conditions) {
      for (const condition of action.conditions) {
        if (evaluateCondition(condition.if, state.inputs)) {
          return condition.then;
        }
      }
    }
    return action.default;
  }, [state.inputs]);

  return {
    state,
    currentStep: state.currentStep,
    currentStepSchema,
    goToStep,
    goBack,
    updateInputs: (updates: Record<string, unknown>) => 
      dispatch({ type: 'UPDATE_INPUTS', updates }),
    setGeneratedOptions: (options: unknown[]) =>
      dispatch({ type: 'SET_GENERATED_OPTIONS', options }),
    setSelectedOption: (option: unknown) =>
      dispatch({ type: 'SET_SELECTED_OPTION', option }),
    setGenerating: (value: boolean) =>
      dispatch({ type: 'SET_GENERATING', value }),
    setError: (error: string | null) =>
      dispatch({ type: 'SET_ERROR', error }),
    evaluateNextStep,
    getProgress: () => currentStepSchema?.progress || 0,
    canGoBack: state.stepHistory.length > 0
  };
}
```

### 3. Condition Evaluator

```typescript
// src/core/wizard/evaluator.ts

/**
 * Evaluates simple condition expressions against input values.
 * 
 * Supported expressions:
 * - "key === 'value'"  (equality)
 * - "key !== 'value'"  (inequality)
 * - "key"              (truthy)
 * - "!key"             (falsy)
 * 
 * Security: Does NOT use eval(). Parses expressions safely.
 */
export function evaluateCondition(
  expression: string,
  inputs: Record<string, unknown>
): boolean {
  // Truthy check: "key"
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
    return Boolean(inputs[expression]);
  }

  // Falsy check: "!key"
  if (/^![a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
    const key = expression.slice(1);
    return !inputs[key];
  }

  // Equality: "key === 'value'" or "key === \"value\""
  const eqMatch = expression.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*===\s*['"](.+)['"]$/
  );
  if (eqMatch) {
    const [, key, value] = eqMatch;
    return inputs[key] === value;
  }

  // Inequality: "key !== 'value'"
  const neqMatch = expression.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*!==\s*['"](.+)['"]$/
  );
  if (neqMatch) {
    const [, key, value] = neqMatch;
    return inputs[key] !== value;
  }

  console.warn(`Invalid condition expression: ${expression}`);
  return false;
}
```


### 4. StepRenderer (Type Router)

```typescript
// src/surface/components/Wizard/StepRenderer.tsx

interface StepRendererProps {
  schema: WizardStepSchema;
  state: WizardEngineState;
  onUpdateInputs: (updates: Record<string, unknown>) => void;
  onComplete: (action: StepAction) => void;
  onGenerate: () => void;
  onSelectOption: (option: unknown) => void;
}

export function StepRenderer({
  schema,
  state,
  onUpdateInputs,
  onComplete,
  onGenerate,
  onSelectOption
}: StepRendererProps) {
  switch (schema.type) {
    case 'consent':
      return (
        <ConsentStep
          schema={schema}
          onAccept={() => onComplete(schema.acceptAction)}
          onCancel={() => onComplete({ exit: true })}
        />
      );

    case 'choice':
      return (
        <ChoiceStep
          schema={schema}
          value={state.inputs[schema.inputKey]}
          otherValue={schema.otherKey ? state.inputs[schema.otherKey] : undefined}
          onSelect={(value) => onUpdateInputs({ [schema.inputKey]: value })}
          onOtherChange={(value) => schema.otherKey && onUpdateInputs({ [schema.otherKey]: value })}
          onComplete={() => {
            const nextStep = evaluateNextStep(schema.next, state.inputs);
            onComplete({ next: nextStep });
          }}
        />
      );

    case 'text':
      return (
        <TextStep
          schema={schema}
          value={state.inputs[schema.inputKey] as string}
          onChange={(value) => onUpdateInputs({ [schema.inputKey]: value })}
          onComplete={() => onComplete(schema.next)}
        />
      );

    case 'generation':
      return (
        <GenerationStep
          schema={schema}
          isGenerating={state.isGenerating}
          error={state.error}
          onRetry={onGenerate}
          onCancel={() => onComplete({ exit: true })}
        />
      );

    case 'selection':
      return (
        <SelectionStep
          schema={schema}
          options={state.generatedOptions}
          selectedOption={state.selectedOption}
          onSelect={onSelectOption}
          onRefine={schema.refineAction ? () => onComplete(schema.refineAction!) : undefined}
          onComplete={() => onComplete(schema.next)}
        />
      );

    case 'confirmation':
      return (
        <ConfirmationStep
          schema={schema}
          selectedItem={state.selectedOption}
          onConfirm={() => onComplete(schema.next)}
        />
      );

    default:
      return <div>Unknown step type</div>;
  }
}
```

### 5. Step Components (Examples)

```typescript
// src/surface/components/Wizard/steps/ChoiceStep.tsx

interface ChoiceStepProps {
  schema: ChoiceStepSchema;
  value: unknown;
  otherValue?: unknown;
  onSelect: (value: string) => void;
  onOtherChange: (value: string) => void;
  onComplete: () => void;
}

export function ChoiceStep({
  schema,
  value,
  otherValue,
  onSelect,
  onOtherChange,
  onComplete
}: ChoiceStepProps) {
  const isOtherSelected = value === 'other';
  const canContinue = value && (!isOtherSelected || (otherValue as string)?.trim());

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <h2 className="font-display text-lg text-ink mb-2">
            {schema.question}
          </h2>
          {schema.subtext && (
            <p className="font-serif text-sm text-ink-muted italic mb-6">
              {schema.subtext}
            </p>
          )}

          <div className="space-y-2 mt-6">
            {schema.options.map((option) => (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all
                  ${value === option.value
                    ? 'bg-purple-50 border-purple-300 border-2'
                    : 'bg-white border-ink/10 hover:border-ink/20'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${value === option.value
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-ink/20'
                    }`}
                  >
                    {value === option.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-sans text-sm">
                    {option.label}
                  </span>
                </div>
              </button>
            ))}

            {isOtherSelected && schema.allowOther && (
              <input
                type="text"
                value={otherValue as string || ''}
                onChange={(e) => onOtherChange(e.target.value)}
                placeholder="Tell us more..."
                className="w-full mt-3 p-3 rounded-lg border border-purple-200"
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-ink/5">
        <button
          onClick={onComplete}
          disabled={!canContinue}
          className={`w-full py-3 rounded-lg font-medium
            ${canContinue
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-ink/10 text-ink/40 cursor-not-allowed'
            }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

---

## Schema Types

```typescript
// src/core/wizard/schema.ts

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
  cardRenderer: string;
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
```

---

## DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Wizard definition in JSON; engine interprets |
| **Capability Agnosticism** | Works regardless of AI model behind generation endpoint |
| **Provenance** | Each wizard run creates artifact with all inputs |
| **Organic Scalability** | New wizards = new JSON files, no code changes |

---

*Architecture finalized: December 2024*
