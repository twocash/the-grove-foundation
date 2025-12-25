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
  const isEmbedded = variant === 'embedded';

  return (
    <div className={`rounded-2xl p-6 max-w-[640px] mx-auto ${
      isEmbedded
        ? 'bg-[var(--chat-surface)] border border-[var(--chat-border)]'
        : 'glass-welcome-card'
    }`}>
      <h2 className={`text-xl font-medium mb-3 ${
        isEmbedded ? 'text-[var(--chat-text)]' : 'text-[var(--glass-text-primary)]'
      }`}>
        {welcome.heading}
      </h2>
      <p className={`mb-6 leading-relaxed ${
        isEmbedded ? 'text-[var(--chat-text-muted)]' : 'text-[var(--glass-text-body)]'
      }`}>
        {welcome.thesis}
      </p>

      <div className="space-y-2 mb-4">
        {welcome.prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onPromptClick(prompt)}
            className={`block w-full text-left rounded-lg px-4 py-3 text-sm cursor-pointer transition-all ${
              isEmbedded
                ? 'bg-[var(--chat-glass)] border border-[var(--chat-glass-border)] text-[var(--chat-text)] hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)]'
                : 'glass-welcome-prompt'
            }`}
          >
            <span className={`mr-2 ${isEmbedded ? 'text-[var(--chat-accent)]' : 'text-[var(--neon-green)]'}`}>→</span>
            {prompt}
          </button>
        ))}
      </div>

      <p className={`text-xs ${
        isEmbedded ? 'text-[var(--chat-text-dim)]' : 'text-[var(--glass-text-subtle)]'
      }`}>
        {welcome.footer}
      </p>
    </div>
  );
};

export default TerminalWelcome;
