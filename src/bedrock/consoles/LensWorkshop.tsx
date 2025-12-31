// src/bedrock/consoles/LensWorkshop.tsx
// Lens Workshop Console - Create and manage exploration lenses
// Sprint: bedrock-alignment-v1 (Story 3.2)

import React from 'react';
import { BedrockLayout, GlassPanel } from '../primitives';

export function LensWorkshop() {
  return (
    <BedrockLayout
      consoleId="lens-workshop"
      title="Lens Workshop"
      description="Create and manage exploration lenses"
      navigation={<div />}
      content={
        <GlassPanel tier="panel" className="m-4 h-[calc(100%-2rem)]">
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[var(--neon-violet)]/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl text-[var(--neon-violet)]">
                tune
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
              Coming Soon
            </h3>
            <p className="text-sm text-[var(--glass-text-muted)] max-w-md mb-8">
              The Lens Workshop will provide a visual editor for creating and managing
              exploration lenses, with AI-assisted prompt optimization and testing.
            </p>

            {/* Feature Preview */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-border)]">
                <span className="material-symbols-outlined text-base text-[var(--neon-cyan)]">
                  auto_awesome
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">AI Suggestions</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-border)]">
                <span className="material-symbols-outlined text-base text-[var(--neon-amber)]">
                  edit_note
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">Prompt Editor</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-border)]">
                <span className="material-symbols-outlined text-base text-[var(--neon-green)]">
                  science
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">Test Runner</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      }
      navWidth={0}
    />
  );
}

export default LensWorkshop;
