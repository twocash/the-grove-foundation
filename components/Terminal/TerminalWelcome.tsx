// components/Terminal/TerminalWelcome.tsx
// Declarative welcome card consuming reality.terminal
// Sprint: terminal-quantum-welcome-v1

import React from 'react';
import { TerminalWelcome as TerminalWelcomeType } from '../../src/core/schema/narrative';

interface TerminalWelcomeProps {
  welcome: TerminalWelcomeType;
  onPromptClick: (prompt: string) => void;
  variant?: 'overlay' | 'embedded';
}

const TerminalWelcome: React.FC<TerminalWelcomeProps> = ({
  welcome,
  onPromptClick,
  variant = 'overlay'
}) => {
  return (
    <div className="glass-welcome-card">
      <h2 className="text-xl font-medium text-[var(--glass-text-primary)] mb-3">
        {welcome.heading}
      </h2>
      <p className="text-[var(--glass-text-body)] mb-6 leading-relaxed">
        {welcome.thesis}
      </p>

      <div className="space-y-2 mb-4">
        {welcome.prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onPromptClick(prompt)}
            className="glass-welcome-prompt"
          >
            <span className="text-[var(--neon-green)] mr-2">→</span>
            {prompt}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--glass-text-subtle)]">
        {welcome.footer}
      </p>
    </div>
  );
};

export default TerminalWelcome;
