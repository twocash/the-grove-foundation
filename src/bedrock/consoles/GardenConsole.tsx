// src/bedrock/consoles/GardenConsole.tsx
// Knowledge Garden Console - Sprout moderation and curation
// Sprint: bedrock-alignment-v1 (Story 3.1)

import React from 'react';
import { BedrockLayout, GlassPanel } from '../primitives';

export function GardenConsole() {
  return (
    <BedrockLayout
      consoleId="garden"
      title="Knowledge Garden"
      description="Sprout moderation and curation"
      navigation={<div />}
      content={
        <GlassPanel tier="panel" className="m-4 h-[calc(100%-2rem)]">
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[var(--neon-green)]/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl text-[var(--neon-green)]">
                eco
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
              Coming Soon
            </h3>
            <p className="text-sm text-[var(--glass-text-muted)] max-w-md mb-8">
              The Knowledge Garden console will provide a full moderation workflow for
              reviewing user-submitted sprouts, with AI-assisted categorization and
              duplicate detection.
            </p>

            {/* Feature Preview */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-border)]">
                <span className="material-symbols-outlined text-base text-[var(--neon-cyan)]">
                  rate_review
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">Review Queue</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-border)]">
                <span className="material-symbols-outlined text-base text-[var(--neon-violet)]">
                  category
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">Auto-Categorize</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-elevated)] border border-[var(--glass-border)]">
                <span className="material-symbols-outlined text-base text-[var(--neon-amber)]">
                  content_copy
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">Deduplication</span>
              </div>
            </div>
          </div>
        </GlassPanel>
      }
      navWidth={0}
    />
  );
}

export default GardenConsole;
