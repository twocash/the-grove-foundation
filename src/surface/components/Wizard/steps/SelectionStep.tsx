// SelectionStep - Select from generated options
// Sprint: wizard-engine-v1

import React, { useState } from 'react';
import { SelectionStepSchema } from '@core/wizard';

// Icons
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
);

export interface SelectionOption {
  id: string;
  title: string;
  description: string;
  preview?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SelectionStepProps {
  schema: SelectionStepSchema;
  options: SelectionOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onConfirm: () => void;
  onRefine?: () => void;
}

interface OptionCardProps {
  option: SelectionOption;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
}

function OptionCard({
  option,
  isSelected,
  isExpanded,
  onSelect,
  onExpand
}: OptionCardProps) {
  return (
    <div
      className={`rounded-lg border transition-all duration-200 overflow-hidden
        ${isSelected
          ? 'bg-purple-50 border-purple-300 border-2 shadow-md'
          : 'bg-white border-ink/10 hover:border-ink/20 hover:shadow-sm'
        }`}
    >
      {/* Main card content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-display text-base ${isSelected ? 'text-purple-700' : 'text-ink'}`}>
            {option.title}
          </h3>
          {isSelected && (
            <div className="flex-shrink-0 ml-2">
              <CheckIcon className="w-5 h-5 text-purple-600" />
            </div>
          )}
        </div>

        <p className="font-serif text-sm text-ink-muted italic mb-3">
          {option.description}
        </p>

        {/* Tags */}
        {option.tags && option.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {option.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-purple-100 text-[10px] font-mono text-purple-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {option.preview && (
            <button
              onClick={onExpand}
              className="flex items-center space-x-1 text-xs text-ink-muted hover:text-ink transition-colors"
            >
              <EyeIcon className="w-3.5 h-3.5" />
              <span>{isExpanded ? 'Hide details' : 'Preview'}</span>
            </button>
          )}
          {!isSelected && (
            <button
              onClick={onSelect}
              className="ml-auto px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Expanded preview */}
      {isExpanded && option.preview && (
        <div className="border-t border-ink/5 p-4 bg-ink/[0.02]">
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-2">
            Preview
          </p>
          <p className="font-serif text-xs text-ink-muted leading-relaxed">
            {option.preview.slice(0, 200)}
            {option.preview.length > 200 && '...'}
          </p>
        </div>
      )}
    </div>
  );
}

export function SelectionStep({
  schema,
  options,
  selectedIndex,
  onSelect,
  onConfirm,
  onRefine
}: SelectionStepProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto">
          <p className="font-serif text-sm text-ink-muted text-center mb-6">
            {schema.instructionText}
          </p>

          {/* Option cards */}
          <div className="space-y-3">
            {options.map((option, index) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={selectedIndex === index}
                isExpanded={expandedIndex === index}
                onSelect={() => onSelect(index)}
                onExpand={() => handleExpand(index)}
              />
            ))}
          </div>

          {/* Refine option */}
          {schema.allowRefine && onRefine && (
            <div className="mt-6 text-center">
              <button
                onClick={onRefine}
                className="inline-flex items-center space-x-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
                <span>{schema.refineLabel || "None of these fit? Try again"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <button
          onClick={onConfirm}
          disabled={selectedIndex === null}
          className={`w-full py-3 px-4 rounded-lg font-sans font-medium text-sm transition-colors
            ${selectedIndex !== null
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-ink/10 text-ink/40 cursor-not-allowed'
            }`}
        >
          {schema.confirmLabel || 'Continue with selection'}
        </button>
      </div>
    </div>
  );
}
