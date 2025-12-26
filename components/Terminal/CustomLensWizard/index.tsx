// CustomLensWizard - Multi-step wizard for creating personalized lenses
// Migrated to use declarative WizardEngine
// Sprint: wizard-engine-v1

import React, { useCallback } from 'react';
import { WizardEngine } from '@surface/components/Wizard';
import { WizardSchema } from '@core/wizard';
import { LensCandidate, UserInputs } from '../../../types/lens';
import customLensSchema from '../../../src/data/wizards/custom-lens.wizard.json';

interface CustomLensWizardProps {
  onComplete: (candidate: LensCandidate, userInputs: UserInputs) => void;
  onCancel: () => void;
}

const CustomLensWizard: React.FC<CustomLensWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const handleComplete = useCallback((result: {
    selectedOption: LensCandidate;
    inputs: Record<string, unknown>;
  }) => {
    // Pass the candidate and inputs to the parent
    // The parent (useCustomLens) handles the encryption
    onComplete(result.selectedOption, result.inputs as unknown as UserInputs);
  }, [onComplete]);

  return (
    <WizardEngine
      schema={customLensSchema as unknown as WizardSchema}
      onComplete={handleComplete}
      onCancel={onCancel}
    />
  );
};

// Named export for workspace imports
export { CustomLensWizard };

export default CustomLensWizard;
