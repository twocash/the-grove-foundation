// ChoiceStep - Multiple choice selection step
// Sprint: wizard-engine-v1

import React from 'react';
import { ChoiceStepSchema } from '@core/wizard';

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

interface ChoiceStepProps {
  schema: ChoiceStepSchema;
  currentValue: string | undefined;
  otherValue: string | undefined;
  onSelect: (value: string) => void;
  onOtherChange: (value: string) => void;
  onContinue: () => void;
}

export function ChoiceStep({
  schema,
  currentValue,
  otherValue,
  onSelect,
  onOtherChange,
  onContinue
}: ChoiceStepProps) {
  const isOtherSelected = currentValue === 'other';
  const hasOtherOption = schema.options.some(opt => opt.value === 'other');

  const canContinue = () => {
    if (!currentValue) return false;
    if (isOtherSelected && !otherValue?.trim()) return false;
    return true;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Question */}
          <h2 className="font-display text-lg text-ink mb-2">
            {schema.question}
          </h2>
          {schema.subtext && (
            <p className="font-serif text-sm text-ink-muted italic mb-6">
              {schema.subtext}
            </p>
          )}

          {/* Options */}
          <div className="space-y-2 mt-6">
            {schema.options.map((option) => (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
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
            {hasOtherOption && isOtherSelected && (
              <div className="mt-3 pl-7">
                <input
                  type="text"
                  value={otherValue || ''}
                  onChange={(e) => onOtherChange(e.target.value)}
                  placeholder="Tell us more..."
                  autoFocus
                  className="w-full p-3 rounded-lg border border-purple-200 bg-white font-sans text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <button
          onClick={onContinue}
          disabled={!canContinue()}
          className={`w-full py-3 px-4 rounded-lg font-sans font-medium text-sm flex items-center justify-center space-x-2 transition-colors
            ${canContinue()
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-ink/10 text-ink/40 cursor-not-allowed'
            }`}
        >
          <span>Continue</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
