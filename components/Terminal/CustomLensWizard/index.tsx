// CustomLensWizard - Multi-step wizard for creating personalized lenses
// Handles privacy, input collection, AI generation, and lens selection

import React, { useState, useCallback, useEffect } from 'react';
import {
  WizardStep,
  WizardState,
  UserInputs,
  LensCandidate,
  DEFAULT_WIZARD_STATE
} from '../../../types/lens';
import PrivacyStep from './PrivacyStep';
import InputStep from './InputStep';
import GeneratingStep from './GeneratingStep';
import SelectStep from './SelectStep';
import ConfirmStep from './ConfirmStep';
import {
  trackWizardStart,
  trackPrivacyAccepted,
  trackInputProvided,
  trackGenerationStarted,
  trackCandidatesShown,
  trackLensSelected,
  trackWizardAbandoned
} from '../../../utils/funnelAnalytics';

interface CustomLensWizardProps {
  onComplete: (candidate: LensCandidate, userInputs: UserInputs) => void;
  onCancel: () => void;
}

const CustomLensWizard: React.FC<CustomLensWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD_STATE);

  // Track wizard start on mount
  useEffect(() => {
    trackWizardStart();
  }, []);

  // Track abandonment on unmount if not completed
  useEffect(() => {
    return () => {
      if (state.currentStep !== 'confirm' || !state.selectedOption) {
        trackWizardAbandoned(state.currentStep);
      }
    };
  }, [state.currentStep, state.selectedOption]);

  // Step navigation
  const goToStep = useCallback((step: WizardStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  // Input handling
  const updateInputs = useCallback((updates: Partial<UserInputs>) => {
    setState(prev => ({
      ...prev,
      userInputs: { ...prev.userInputs, ...updates }
    }));
  }, []);

  // Handle privacy acknowledgment
  const handlePrivacyAccept = useCallback(() => {
    trackPrivacyAccepted();
    goToStep('input-motivation');
  }, [goToStep]);

  // Handle input step completion - navigate to next input or generate
  const handleInputComplete = useCallback((step: WizardStep) => {
    // Track input provided
    const stepToQuestion: Record<string, string> = {
      'input-motivation': 'motivation',
      'input-concerns': 'concerns',
      'input-outlook': 'outlook',
      'input-professional': 'professional',
      'input-worldview': 'worldview'
    };
    const questionId = stepToQuestion[step];
    if (questionId) {
      const inputKey = questionId as keyof UserInputs;
      const hasValue = !!state.userInputs[inputKey];
      trackInputProvided(questionId, hasValue);
    }

    const inputSteps: WizardStep[] = [
      'input-motivation',
      'input-concerns',
      'input-outlook',
      'input-professional',
      'input-worldview'
    ];

    const currentIndex = inputSteps.indexOf(step);

    // Special handling for motivation - skip concerns if not worried
    if (step === 'input-motivation') {
      const motivation = state.userInputs.motivation;
      if (motivation === 'worried-about-ai') {
        goToStep('input-concerns');
      } else {
        goToStep('input-outlook');
      }
      return;
    }

    // For other steps, go to next in sequence
    if (currentIndex < inputSteps.length - 1) {
      goToStep(inputSteps[currentIndex + 1]);
    } else {
      // All inputs collected - start generation
      handleStartGeneration();
    }
  }, [state.userInputs, goToStep]);

  // Handle going back in wizard
  const handleBack = useCallback(() => {
    const stepOrder: WizardStep[] = [
      'privacy',
      'input-motivation',
      'input-concerns',
      'input-outlook',
      'input-professional',
      'input-worldview',
      'generating',
      'select',
      'confirm'
    ];

    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      // Skip concerns if we didn't show it going forward
      let prevStep = stepOrder[currentIndex - 1];
      if (prevStep === 'input-concerns' && state.userInputs.motivation !== 'worried-about-ai') {
        prevStep = 'input-motivation';
      }
      goToStep(prevStep);
    }
  }, [state.currentStep, state.userInputs.motivation, goToStep]);

  // Generate lens options
  const handleStartGeneration = useCallback(async () => {
    trackGenerationStarted();

    setState(prev => ({
      ...prev,
      currentStep: 'generating',
      isGenerating: true,
      error: null
    }));

    try {
      const response = await fetch('/api/generate-lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInputs: state.userInputs })
      });

      if (!response.ok) {
        throw new Error('Failed to generate lens options');
      }

      const data = await response.json();

      trackCandidatesShown(data.lensOptions?.length || 0);

      setState(prev => ({
        ...prev,
        currentStep: 'select',
        isGenerating: false,
        generatedOptions: data.lensOptions
      }));
    } catch (error) {
      console.error('Lens generation failed:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      }));
    }
  }, [state.userInputs]);

  // Handle lens selection
  const handleSelectLens = useCallback((candidate: LensCandidate) => {
    trackLensSelected(candidate.name, candidate.archetypeId);
    setState(prev => ({
      ...prev,
      selectedOption: candidate,
      currentStep: 'confirm'
    }));
  }, []);

  // Handle final confirmation
  const handleConfirm = useCallback(() => {
    if (state.selectedOption && state.userInputs) {
      onComplete(state.selectedOption, state.userInputs as UserInputs);
    }
  }, [state.selectedOption, state.userInputs, onComplete]);

  // Handle refine (go back to inputs)
  const handleRefine = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'input-motivation',
      generatedOptions: [],
      selectedOption: null,
      error: null
    }));
  }, []);

  // Render current step
  const renderStep = () => {
    switch (state.currentStep) {
      case 'privacy':
        return (
          <PrivacyStep
            onAccept={handlePrivacyAccept}
            onCancel={onCancel}
          />
        );

      case 'input-motivation':
      case 'input-concerns':
      case 'input-outlook':
      case 'input-professional':
      case 'input-worldview':
        return (
          <InputStep
            step={state.currentStep}
            userInputs={state.userInputs}
            onUpdate={updateInputs}
            onComplete={() => handleInputComplete(state.currentStep)}
            onBack={handleBack}
          />
        );

      case 'generating':
        return (
          <GeneratingStep
            error={state.error}
            onRetry={handleStartGeneration}
            onCancel={onCancel}
          />
        );

      case 'select':
        return (
          <SelectStep
            options={state.generatedOptions}
            onSelect={handleSelectLens}
            onRefine={handleRefine}
            onBack={handleBack}
          />
        );

      case 'confirm':
        return (
          <ConfirmStep
            selectedLens={state.selectedOption!}
            onConfirm={handleConfirm}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      {renderStep()}
    </div>
  );
};

export default CustomLensWizard;
