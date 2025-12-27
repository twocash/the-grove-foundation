// components/Terminal/TerminalWelcome.tsx
// Declarative welcome card with adaptive prompts
// Sprint: terminal-quantum-welcome-v1
// Sprint: adaptive-engagement-v1 - Added stage-aware prompts
// Sprint: engagement-consolidation-v1 - Uses unified EngagementBus state

import React from 'react';
import { TerminalWelcome as TerminalWelcomeType } from '../../src/core/schema/narrative';
import { useSuggestedPrompts } from '../../hooks/useSuggestedPrompts';
import { useEngagementState } from '../../hooks/useEngagementBus';

interface TerminalWelcomeProps {
  welcome: TerminalWelcomeType;
  onPromptClick: (prompt: string, command?: string, journeyId?: string) => void;
  lensId?: string | null;
  lensName?: string;
  variant?: 'overlay' | 'embedded';
}

// Stage indicator labels
const STAGE_LABELS: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'Getting Started' },
  ORIENTED: { emoji: '🧭', label: 'Orienting' },
  EXPLORING: { emoji: '🔍', label: 'Exploring' },
  ENGAGED: { emoji: '🌲', label: 'Engaged' },
};

const TerminalWelcome: React.FC<TerminalWelcomeProps> = ({
  welcome,
  onPromptClick,
  lensId,
  lensName,
  variant = 'overlay'
}) => {
  // Get stage and prompts from unified EngagementBus
  const engagementState = useEngagementState();
  const { prompts: adaptivePrompts, stage } = useSuggestedPrompts({
    lensId,
    lensName,
  });

  // Debug logging
  console.log('[TerminalWelcome] Stage:', engagementState.stage, 'Prompts:', adaptivePrompts.length);

  // Use adaptive prompts if available, fallback to static
  const displayPrompts: Array<{ id: string; text: string; command?: string; journeyId?: string }> =
    adaptivePrompts.length > 0
      ? adaptivePrompts.map(p => ({ id: p.id, text: p.text, command: p.command, journeyId: p.journeyId }))
      : welcome.prompts.map((text, i) => ({ id: `static-${i}`, text }));

  console.log('[TerminalWelcome] displayPrompts:', displayPrompts.map(p => p.text));

  const stageInfo = STAGE_LABELS[stage] ?? STAGE_LABELS.ARRIVAL;

  const handlePromptClick = (prompt: { text: string; command?: string; journeyId?: string }) => {
    onPromptClick(prompt.text, prompt.command, prompt.journeyId);
  };

  return (
    <div className="glass-welcome-card">
      {/* Stage indicator */}
      <div className="text-xs text-[var(--glass-text-subtle)] mb-2 flex items-center gap-2">
        <span>{stageInfo.emoji}</span>
        <span>{stageInfo.label}</span>
        {engagementState.exchangeCount > 0 && (
          <span className="opacity-50">• {engagementState.exchangeCount} exchanges</span>
        )}
      </div>

      <h2 className="text-xl font-medium text-[var(--glass-text-primary)] mb-3">
        {welcome.heading}
      </h2>
      <p className="text-[var(--glass-text-body)] mb-6 leading-relaxed">
        {welcome.thesis}
      </p>

      <div className="space-y-2 mb-4">
        {displayPrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => handlePromptClick(prompt)}
            className="glass-welcome-prompt"
          >
            <span className="text-[var(--neon-cyan)] mr-2">→</span>
            {prompt.text}
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
