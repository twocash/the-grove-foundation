// HelpModal - Display available Terminal commands
// Sprint v0.16: Command Palette feature

import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const NAVIGATION_COMMANDS = [
  { command: '/help', description: 'Show this help menu' },
  { command: '/welcome', description: 'Return to welcome screen' },
  { command: '/lens', description: 'Open lens picker' },
  { command: '/journeys', description: 'View available journeys' }
];

const PROGRESS_COMMANDS = [
  { command: '/stats', description: 'View your exploration stats' }
];

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-md mx-4 rounded shadow-lg overflow-hidden">
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className="px-4 py-6 border-b border-ink/5">
            <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
              TERMINAL COMMANDS
            </div>
            <p className="font-serif text-sm text-ink-muted leading-relaxed">
              Use slash commands to navigate and control the Terminal.
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Navigation Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-3">
                Navigation
              </div>
              <div className="space-y-2">
                {NAVIGATION_COMMANDS.map(({ command, description }) => (
                  <div key={command} className="flex items-center gap-3">
                    <code className="font-mono text-sm text-grove-forest bg-grove-forest/5 px-2 py-0.5 rounded">
                      {command}
                    </code>
                    <span className="text-sm text-ink-muted">{description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-3">
                Progress
              </div>
              <div className="space-y-2">
                {PROGRESS_COMMANDS.map(({ command, description }) => (
                  <div key={command} className="flex items-center gap-3">
                    <code className="font-mono text-sm text-grove-forest bg-grove-forest/5 px-2 py-0.5 rounded">
                      {command}
                    </code>
                    <span className="text-sm text-ink-muted">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-ink-muted">
                Tip: Type <code className="font-mono">/</code> to see autocomplete suggestions
              </p>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-ink-muted hover:text-ink border border-ink/20 hover:border-ink/40 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
