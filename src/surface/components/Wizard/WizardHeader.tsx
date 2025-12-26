// WizardHeader - Header with back/close controls
// Sprint: wizard-engine-v1

import React from 'react';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

interface WizardHeaderProps {
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  onCancel: () => void;
}

export function WizardHeader({
  title,
  subtitle,
  canGoBack = false,
  onBack,
  onCancel
}: WizardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
      <div className="flex items-center space-x-2">
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-1 p-1.5 -ml-1.5 rounded-md hover:bg-ink/5 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-ink-muted" />
            <span className="text-xs text-ink-muted">Back</span>
          </button>
        )}
        {!canGoBack && (
          <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
            {title}
          </div>
        )}
      </div>
      {canGoBack && (
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          {subtitle || title}
        </div>
      )}
      <button
        onClick={onCancel}
        className="p-1.5 rounded-md hover:bg-ink/5 transition-colors"
        title="Cancel"
      >
        <XIcon className="w-4 h-4 text-ink-muted" />
      </button>
    </div>
  );
}
