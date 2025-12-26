// WizardEngine - Main orchestrator for declarative wizards
// Sprint: wizard-engine-v1

import React, { useCallback, useEffect } from 'react';
import {
  WizardSchema,
  StepAction,
  GenerationStepSchema
} from '@core/wizard';
import { mapInputs, transformOutput } from '@core/wizard';
import { useWizardState } from './hooks/useWizardState';
import { WizardHeader } from './WizardHeader';
import { WizardProgress } from './WizardProgress';
import { StepRenderer } from './StepRenderer';

// ============================================================================
// TYPES
// ============================================================================

export interface WizardEngineProps<T = unknown> {
  schema: WizardSchema;
  onComplete: (result: { selectedOption: T; inputs: Record<string, unknown> }) => void;
  onCancel: () => void;
  initialInputs?: Record<string, unknown>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WizardEngine<T = unknown>({
  schema,
  onComplete,
  onCancel,
  initialInputs
}: WizardEngineProps<T>) {
  const {
    state,
    currentStepSchema,
    goToStep,
    goBack,
    canGoBack,
    updateInputs,
    setGeneratedOptions,
    setSelectedIndex,
    setGenerating,
    setError,
    getProgress,
    getMaxProgress
  } = useWizardState(schema, initialInputs);

  // Analytics: Track wizard start
  useEffect(() => {
    if (schema.analytics?.startEvent) {
      // trackEvent would be called here if analytics is configured
      console.log('[Wizard] Start event:', schema.analytics.startEvent);
    }
  }, [schema.analytics?.startEvent]);

  // Handle step completion
  const handleStepComplete = useCallback((action: StepAction) => {
    if ('complete' in action && action.complete) {
      // Transform output and complete wizard
      const result = transformOutput<T>(state, schema.output);

      if (schema.analytics?.completeEvent) {
        console.log('[Wizard] Complete event:', schema.analytics.completeEvent);
      }

      onComplete({
        selectedOption: result,
        inputs: state.inputs
      });
    } else if ('exit' in action && action.exit) {
      if (schema.analytics?.abandonEvent) {
        console.log('[Wizard] Abandon event:', schema.analytics.abandonEvent);
      }
      onCancel();
    } else if ('next' in action) {
      if (schema.analytics?.stepEvent) {
        console.log('[Wizard] Step event:', schema.analytics.stepEvent, { step: state.currentStep });
      }
      goToStep(action.next);
    }
  }, [state, schema, goToStep, onComplete, onCancel]);

  // Handle generation API call
  const handleGenerate = useCallback(async () => {
    if (!schema.generation) {
      console.error('[Wizard] No generation config found');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Map inputs according to schema config
      const body = mapInputs(state.inputs, schema.generation.inputMapping);

      const response = await fetch(schema.generation.endpoint, {
        method: schema.generation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const options = data[schema.generation.outputKey] || data;

      setGeneratedOptions(Array.isArray(options) ? options : [options]);

      // Auto-advance to next step
      const genStep = currentStepSchema as GenerationStepSchema;
      if (genStep?.next) {
        handleStepComplete(genStep.next);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      setError(message);
    } finally {
      setGenerating(false);
    }
  }, [schema.generation, state.inputs, currentStepSchema, setGenerating, setError, setGeneratedOptions, handleStepComplete]);

  // Handle cancel with analytics
  const handleCancel = useCallback(() => {
    if (schema.analytics?.abandonEvent) {
      console.log('[Wizard] Abandon event:', schema.analytics.abandonEvent);
    }
    onCancel();
  }, [schema.analytics?.abandonEvent, onCancel]);

  // Guard: No step schema found
  if (!currentStepSchema) {
    return (
      <div className="flex flex-col h-full bg-paper">
        <WizardHeader
          title={schema.title}
          onCancel={handleCancel}
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-ink-muted">Step not found: {state.currentStep}</p>
        </div>
      </div>
    );
  }

  // Get current step title for header
  const currentStepTitle = currentStepSchema.title || schema.title;

  return (
    <div className="flex flex-col h-full bg-paper">
      <WizardHeader
        title={schema.title}
        subtitle={currentStepTitle}
        canGoBack={canGoBack}
        onBack={goBack}
        onCancel={handleCancel}
      />
      <WizardProgress
        current={getProgress()}
        total={getMaxProgress()}
        color={schema.theme?.primaryColor}
      />
      <StepRenderer
        schema={currentStepSchema}
        state={{ ...state, selectedIndex: state.selectedIndex ?? null }}
        onUpdateInputs={updateInputs}
        onComplete={handleStepComplete}
        onGenerate={handleGenerate}
        onSelectIndex={setSelectedIndex}
        onCancel={handleCancel}
      />
    </div>
  );
}
