// src/surface/components/KineticStream/KineticWelcome.tsx
// Personalized welcome card with adaptive prompts
// Sprint: kinetic-context-v1

import React from 'react';
import type { TerminalWelcome } from '../../../core/schema/narrative';
import { GlassContainer } from './Stream/motion/GlassContainer';

const STAGE_LABELS: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'Getting Started' },
  ORIENTED: { emoji: '🧭', label: 'Orienting' },
  EXPLORING: { emoji: '🔍', label: 'Exploring' },
  ENGAGED: { emoji: '🌲', label: 'Engaged' },
};

export interface KineticWelcomeProps {
  content: TerminalWelcome;
  prompts?: Array<{ id: string; text: string; command?: string; journeyId?: string }>;
  stage?: string;
  exchangeCount?: number;
  onPromptClick: (prompt: string, command?: string, journeyId?: string) => void;
}

export const KineticWelcome: React.FC<KineticWelcomeProps> = ({
  content,
  prompts,
  stage = 'ARRIVAL',
  exchangeCount = 0,
  onPromptClick,
}) => {
  const stageInfo = STAGE_LABELS[stage] ?? STAGE_LABELS.ARRIVAL;

  const displayPrompts = prompts && prompts.length > 0
    ? prompts
    : content.prompts.map((text, i) => ({ id: `static-${i}`, text }));

  return (
    <GlassContainer
      intensity="elevated"
      variant="default"
      className="p-6"
    >
      {/* Stage indicator */}
      <div className="text-xs text-[var(--glass-text-subtle)] mb-3 flex items-center gap-2">
        <span>{stageInfo.emoji}</span>
        <span>{stageInfo.label}</span>
        {exchangeCount > 0 && (
          <span className="opacity-50">• {exchangeCount} exchanges</span>
        )}
      </div>

      {/* Heading */}
      <h2 className="text-xl font-semibold text-[#94a3b8] mb-3">
        {content.heading}
      </h2>

      {/* Thesis */}
      <p className="text-[#94a3b8] mb-6 leading-relaxed">
        {content.thesis}
      </p>

      {/* Prompts */}
      <div className="space-y-2 mb-4">
        {displayPrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onPromptClick(prompt.text, prompt.command, prompt.journeyId)}
            className="w-full text-left px-4 py-3 rounded-lg
              bg-[var(--glass-surface)]/50 border border-[var(--glass-border)]
              hover:bg-[var(--glass-surface)] hover:border-[var(--neon-cyan)]/30
              transition-colors group"
          >
            <span className="text-[var(--neon-cyan)] mr-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
            <span className="text-[var(--glass-text-secondary)]">{prompt.text}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      {content.footer && (
        <p className="text-xs text-[var(--glass-text-subtle)]">
          {content.footer}
        </p>
      )}
    </GlassContainer>
  );
};

export default KineticWelcome;
