// ConsentStep - Privacy/consent step for wizard
// Sprint: wizard-engine-v1

import React from 'react';
import { ConsentStepSchema } from '@core/wizard';

// Icons
const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

interface ConsentStepProps {
  schema: ConsentStepSchema;
  onAccept: () => void;
}

export function ConsentStep({ schema, onAccept }: ConsentStepProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-md mx-auto">
        {/* Shield icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-grove-forest/10">
            <ShieldIcon className="w-10 h-10 text-grove-forest" />
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-xl text-ink text-center mb-3">
          {schema.title}
        </h2>

        {/* Guarantees */}
        <div className="space-y-4 mb-8">
          {schema.guarantees.map((guarantee, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-paper border border-ink/5">
              <LockIcon className="w-5 h-5 text-grove-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-sm text-ink font-medium">
                  {guarantee.title}
                </p>
                <p className="font-serif text-xs text-ink-muted mt-0.5">
                  {guarantee.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Process steps */}
        {schema.processSteps && (
          <div className="mb-8">
            <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-3">
              How it works
            </p>
            <div className="flex items-center justify-between text-xs">
              {schema.processSteps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center font-mono text-ink/60 mb-1">
                      {index + 1}
                    </div>
                    <span className="text-ink-muted">{step}</span>
                  </div>
                  {index < schema.processSteps!.length - 1 && (
                    <div className="flex-1 border-t border-dashed border-ink/20 mx-2" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Accept button */}
        <button
          onClick={onAccept}
          className="w-full py-3 px-4 rounded-lg bg-grove-forest text-white font-sans font-medium text-sm hover:bg-grove-forest/90 transition-colors"
        >
          {schema.acceptLabel}
        </button>

        {schema.footerText && (
          <p className="text-[10px] text-ink-muted text-center mt-3">
            {schema.footerText}
          </p>
        )}
      </div>
    </div>
  );
}
