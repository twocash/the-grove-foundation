// StepRenderer - Routes step types to appropriate components
// Sprint: wizard-engine-v1

import React from 'react';
import {
  WizardStepSchema,
  WizardEngineState,
  StepAction,
  ConditionalAction,
  ConsentStepSchema,
  ChoiceStepSchema,
  TextStepSchema,
  GenerationStepSchema,
  SelectionStepSchema,
  ConfirmationStepSchema
} from '@core/wizard';
import { evaluateNextStep } from '@core/wizard';
import {
  ConsentStep,
  ChoiceStep,
  TextStep,
  GenerationStep,
  SelectionStep,
  ConfirmationStep,
  SelectionOption,
  ConfirmationData
} from './steps';

interface StepRendererProps {
  schema: WizardStepSchema;
  state: WizardEngineState & { selectedIndex: number | null };
  onUpdateInputs: (updates: Record<string, unknown>) => void;
  onComplete: (action: StepAction) => void;
  onGenerate: () => void;
  onSelectIndex: (index: number) => void;
  onCancel: () => void;
}

export function StepRenderer({
  schema,
  state,
  onUpdateInputs,
  onComplete,
  onGenerate,
  onSelectIndex,
  onCancel
}: StepRendererProps) {
  switch (schema.type) {
    case 'consent': {
      const consentSchema = schema as ConsentStepSchema;
      return (
        <ConsentStep
          schema={consentSchema}
          onAccept={() => onComplete(consentSchema.acceptAction)}
        />
      );
    }

    case 'choice': {
      const choiceSchema = schema as ChoiceStepSchema;
      const currentValue = state.inputs[choiceSchema.inputKey] as string | undefined;
      const otherValue = choiceSchema.otherKey
        ? (state.inputs[choiceSchema.otherKey] as string | undefined)
        : undefined;

      return (
        <ChoiceStep
          schema={choiceSchema}
          currentValue={currentValue}
          otherValue={otherValue}
          onSelect={(value) => onUpdateInputs({ [choiceSchema.inputKey]: value })}
          onOtherChange={(value) => {
            if (choiceSchema.otherKey) {
              onUpdateInputs({ [choiceSchema.otherKey]: value });
            }
          }}
          onContinue={() => {
            const nextStep = evaluateNextStep(choiceSchema.next, state.inputs);
            onComplete({ next: nextStep });
          }}
        />
      );
    }

    case 'text': {
      const textSchema = schema as TextStepSchema;
      const value = (state.inputs[textSchema.inputKey] as string) || '';

      return (
        <TextStep
          schema={textSchema}
          value={value}
          onChange={(newValue) => onUpdateInputs({ [textSchema.inputKey]: newValue })}
          onContinue={() => onComplete(textSchema.next)}
        />
      );
    }

    case 'generation': {
      const genSchema = schema as GenerationStepSchema;

      // NOTE: Auto-trigger moved to GenerationStep component to avoid hooks violation
      return (
        <GenerationStep
          schema={genSchema}
          isGenerating={state.isGenerating}
          hasOptions={state.generatedOptions.length > 0}
          error={state.error}
          onGenerate={onGenerate}
          onRetry={onGenerate}
          onCancel={onCancel}
        />
      );
    }

    case 'selection': {
      const selSchema = schema as SelectionStepSchema;

      // Transform generated options to SelectionOption format
      const options: SelectionOption[] = state.generatedOptions.map((opt, index) => {
        // Handle LensCandidate-like objects
        const optObj = opt as Record<string, unknown>;
        return {
          id: (optObj.id as string) || `option-${index}`,
          title: (optObj.publicLabel as string) || (optObj.title as string) || `Option ${index + 1}`,
          description: (optObj.description as string) || '',
          preview: (optObj.toneGuidance as string) || (optObj.preview as string),
          tags: (optObj.tags as string[]) || [],
          metadata: optObj
        };
      });

      return (
        <SelectionStep
          schema={selSchema}
          options={options}
          selectedIndex={state.selectedIndex}
          onSelect={onSelectIndex}
          onConfirm={() => onComplete(selSchema.next)}
          onRefine={selSchema.refineAction ? () => onComplete(selSchema.refineAction!) : undefined}
        />
      );
    }

    case 'confirmation': {
      const confSchema = schema as ConfirmationStepSchema;

      // Get the selected item for display
      const selectedItem = state.selectedOption as Record<string, unknown> | null;

      const data: ConfirmationData = {
        title: (selectedItem?.publicLabel as string) || (selectedItem?.title as string) || 'Selected',
        description: (selectedItem?.description as string) || '',
        benefits: confSchema.benefits,
        metadata: selectedItem || undefined
      };

      return (
        <ConfirmationStep
          schema={confSchema}
          data={data}
          onConfirm={() => onComplete(confSchema.next)}
        />
      );
    }

    default:
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-ink-muted">Unknown step type: {(schema as { type: string }).type}</p>
        </div>
      );
  }
}
