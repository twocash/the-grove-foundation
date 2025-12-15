// InputStep - Conversational input collection for custom lens creation
// Handles all input steps with adaptive question flow

import React, { useState } from 'react';
import {
  WizardStep,
  UserInputs,
  MotivationType,
  ConcernType,
  FutureOutlookType,
  ProfessionalRelationshipType
} from '../../../types/lens';

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

interface InputStepProps {
  step: WizardStep;
  userInputs: Partial<UserInputs>;
  onUpdate: (updates: Partial<UserInputs>) => void;
  onComplete: () => void;
  onBack: () => void;
}

interface OptionConfig {
  value: string;
  label: string;
  description?: string;
}

// Question configurations
const MOTIVATION_OPTIONS: OptionConfig[] = [
  { value: 'worried-about-ai', label: "I'm worried about where AI is heading" },
  { value: 'researching-distributed-systems', label: "I'm researching distributed systems" },
  { value: 'someone-sent-link', label: 'Someone sent me this link' },
  { value: 'investment-opportunities', label: "I'm looking for investment opportunities" },
  { value: 'just-curious', label: 'Just curious' },
  { value: 'other', label: 'Something else...' }
];

const CONCERNS_OPTIONS: OptionConfig[] = [
  { value: 'big-tech-power', label: 'Big Tech having too much power' },
  { value: 'job-displacement', label: 'Job displacement' },
  { value: 'energy-environment', label: 'Energy and environmental costs' },
  { value: 'privacy', label: 'Loss of privacy' },
  { value: 'harder-to-articulate', label: 'Something harder to articulate' },
  { value: 'other', label: 'Something else...' }
];

const OUTLOOK_OPTIONS: OptionConfig[] = [
  { value: 'cautiously-optimistic', label: 'Cautiously optimistic' },
  { value: 'genuinely-worried', label: 'Genuinely worried' },
  { value: 'depends-on-control', label: 'Depends entirely on who controls it' },
  { value: 'building-conflicted', label: "I'm building it, so I'm conflicted" },
  { value: 'other', label: 'Something else...' }
];

const PROFESSIONAL_OPTIONS: OptionConfig[] = [
  { value: 'build-it', label: 'I build it' },
  { value: 'fund-invest', label: 'I fund or invest in it' },
  { value: 'study-regulate', label: 'I study or regulate it' },
  { value: 'use-dont-trust', label: "I use it but don't trust it" },
  { value: 'lead-orgs', label: 'I lead organizations that depend on it' },
  { value: 'other', label: 'Something else...' }
];

// Step configurations
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
  'input-concerns': {
    question: 'What concerns you most?',
    options: CONCERNS_OPTIONS,
    inputKey: 'concerns',
    otherKey: 'concernsOther',
    progress: 2
  },
  'input-outlook': {
    question: "When you imagine AI's role in society 10 years from now, what's your gut reaction?",
    options: OUTLOOK_OPTIONS,
    inputKey: 'futureOutlook',
    otherKey: 'futureOutlookOther',
    progress: 3
  },
  'input-professional': {
    question: "What's your relationship to technology professionally?",
    options: PROFESSIONAL_OPTIONS,
    inputKey: 'professionalRelationship',
    otherKey: 'professionalRelationshipOther',
    progress: 4
  },
  'input-worldview': {
    question: "In 2-3 sentences, describe how you see AI's role in the future.",
    subtext: "Optional, but helps us craft a lens that truly fits you.",
    options: [],
    inputKey: 'worldviewStatement',
    progress: 5
  }
};

const InputStep: React.FC<InputStepProps> = ({
  step,
  userInputs,
  onUpdate,
  onComplete,
  onBack
}) => {
  const config = STEP_CONFIG[step];
  const [otherText, setOtherText] = useState(
    config.otherKey ? (userInputs[config.otherKey] as string || '') : ''
  );
  const [worldviewText, setWorldviewText] = useState(
    userInputs.worldviewStatement || ''
  );

  const currentValue = userInputs[config.inputKey] as string | undefined;
  const isOtherSelected = currentValue === 'other';
  const isWorldviewStep = step === 'input-worldview';

  // Get total steps (excluding concerns if not worried)
  const getTotalSteps = () => {
    if (userInputs.motivation === 'worried-about-ai') {
      return 5;
    }
    return 4;
  };

  // Get current step number (adjusted for skipped concerns)
  const getCurrentStepNumber = () => {
    if (userInputs.motivation !== 'worried-about-ai') {
      // Concerns step was skipped
      if (config.progress >= 3) {
        return config.progress - 1;
      }
    }
    return config.progress;
  };

  const handleOptionSelect = (value: string) => {
    onUpdate({ [config.inputKey]: value });
    if (value !== 'other' && config.otherKey) {
      onUpdate({ [config.otherKey]: undefined });
    }
  };

  const handleContinue = () => {
    // For worldview step, save text before continuing
    if (isWorldviewStep) {
      onUpdate({ worldviewStatement: worldviewText || undefined });
    }
    // For other steps, save the "other" text if selected
    if (isOtherSelected && config.otherKey) {
      onUpdate({ [config.otherKey]: otherText });
    }
    onComplete();
  };

  const canContinue = () => {
    if (isWorldviewStep) {
      return true; // Optional step
    }
    if (!currentValue) return false;
    if (isOtherSelected && !otherText.trim()) return false;
    return true;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 p-1.5 -ml-1.5 rounded-md hover:bg-ink/5 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 text-ink-muted" />
          <span className="text-xs text-ink-muted">Back</span>
        </button>
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          Step {getCurrentStepNumber()} of {getTotalSteps()}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-ink/5">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${(getCurrentStepNumber() / getTotalSteps()) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Question */}
          <h2 className="font-display text-lg text-ink mb-2">
            {config.question}
          </h2>
          {config.subtext && (
            <p className="font-serif text-sm text-ink-muted italic mb-6">
              {config.subtext}
            </p>
          )}

          {/* Options or Text Input */}
          {isWorldviewStep ? (
            <div className="mt-4">
              <textarea
                value={worldviewText}
                onChange={(e) => setWorldviewText(e.target.value.slice(0, 280))}
                placeholder="Share your perspective on AI's future..."
                className="w-full h-32 p-4 rounded-lg border border-ink/10 bg-white font-serif text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 resize-none"
              />
              <div className="text-right mt-1">
                <span className={`text-[10px] font-mono ${worldviewText.length > 250 ? 'text-amber-600' : 'text-ink-muted'}`}>
                  {worldviewText.length}/280
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mt-6">
              {config.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200
                    ${currentValue === option.value
                      ? 'bg-purple-50 border-purple-300 border-2'
                      : 'bg-white border-ink/10 hover:border-ink/20 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${currentValue === option.value
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-ink/20'
                      }`}
                    >
                      {currentValue === option.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`font-sans text-sm ${currentValue === option.value ? 'text-purple-700' : 'text-ink'}`}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}

              {/* "Other" text input */}
              {isOtherSelected && (
                <div className="mt-3 pl-7">
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Tell us more..."
                    autoFocus
                    className="w-full p-3 rounded-lg border border-purple-200 bg-white font-sans text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <button
          onClick={handleContinue}
          disabled={!canContinue()}
          className={`w-full py-3 px-4 rounded-lg font-sans font-medium text-sm flex items-center justify-center space-x-2 transition-colors
            ${canContinue()
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-ink/10 text-ink/40 cursor-not-allowed'
            }`}
        >
          <span>{isWorldviewStep ? 'Generate my lenses' : 'Continue'}</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
        {isWorldviewStep && (
          <p className="text-[10px] text-ink-muted text-center mt-2">
            Skip this step if you prefer
          </p>
        )}
      </div>
    </div>
  );
};

export default InputStep;
