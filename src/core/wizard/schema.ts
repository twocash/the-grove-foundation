// Wizard Schema Types - Declarative definition for multi-step flows
// Sprint: wizard-engine-v1

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
  title: string;
  guarantees: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
  processSteps?: string[];
  acceptLabel: string;
  acceptAction: StepAction;
  cancelLabel?: string;
  footerText?: string;
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
  required?: boolean;
  next: StepAction;
}

export interface GenerationStepSchema extends BaseStepSchema {
  type: 'generation';
  loadingTitle: string;
  loadingSubtext: string;
  progressStages?: string[];
  estimatedTime?: string;
  errorMessage?: string;
  retryLabel?: string;
  next: StepAction;
}

export interface SelectionStepSchema extends BaseStepSchema {
  type: 'selection';
  instructionText: string;
  optionsKey: string;
  outputKey: string;
  cardRenderer?: string;
  allowRefine?: boolean;
  refineLabel?: string;
  refineAction?: StepAction;
  confirmLabel?: string;
  next: StepAction;
}

export interface ConfirmationStepSchema extends BaseStepSchema {
  type: 'confirmation';
  displayKey: string;
  benefits?: string[];
  benefitsTitle?: string;
  privacyNote?: string;
  confirmLabel: string;
  footerText?: string;
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
