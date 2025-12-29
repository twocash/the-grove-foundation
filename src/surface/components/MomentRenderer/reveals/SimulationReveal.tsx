// src/surface/components/MomentRenderer/reveals/SimulationReveal.tsx
// Simulation reveal content component
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';

export interface SimulationRevealProps {
  moment: Moment;
  opening?: string;
}

export function SimulationReveal({ moment, opening }: SimulationRevealProps) {
  const defaultOpening = "This terminal is proof that distributed AI works.";
  const content = moment.payload.content;

  return (
    <div className="simulation-reveal space-y-4">
      <div className="text-4xl">✨</div>
      <h3 className="font-display text-xl text-[var(--glass-text-primary)]">
        {content.heading || "You're Already Inside"}
      </h3>
      <p className="text-[var(--glass-text-body)] leading-relaxed">
        {opening || defaultOpening}
      </p>
      <div className="pt-2 text-sm text-[var(--glass-text-subtle)]">
        <p>The architecture you've been exploring?</p>
        <p className="font-medium text-[var(--neon-cyan)]">You're running on it.</p>
      </div>
    </div>
  );
}

export default SimulationReveal;
