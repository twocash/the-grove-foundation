// components/Terminal/JourneyCompletionCard.tsx
// Celebration when journey completes
// Sprint: adaptive-engagement-v1

import React from 'react';
import type { Journey } from '../../src/core/schema/journey';
import { getJourneyById } from '../../src/data/journeys';

interface JourneyCompletionCardProps {
  journey: Journey;
  onDismiss: () => void;
  onStartNext?: (journeyId: string) => void;
}

export const JourneyCompletionCard: React.FC<JourneyCompletionCardProps> = ({
  journey,
  onDismiss,
  onStartNext,
}) => {
  const nextJourneys = journey.nextJourneys
    ?.map(id => getJourneyById(id))
    .filter(Boolean) as Journey[] | undefined;

  return (
    <div className="glass-welcome-card">
      <div className="text-center mb-4">
        <span className="text-4xl">🎉</span>
      </div>

      <h3 className="text-lg font-medium text-[var(--glass-text-primary)] text-center mb-2">
        Journey Complete!
      </h3>

      <p className="text-[var(--glass-text-body)] text-center mb-4">
        {journey.completionMessage}
      </p>

      {nextJourneys && nextJourneys.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-[var(--glass-text-subtle)] text-center">
            Continue your exploration:
          </p>
          {nextJourneys.map(next => (
            <button
              key={next.id}
              onClick={() => onStartNext?.(next.id)}
              className="glass-welcome-prompt w-full"
            >
              <span className="text-[var(--neon-cyan)] mr-2">→</span>
              {next.title}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onDismiss}
        className="w-full text-center text-xs text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-body)]"
      >
        Explore freely
      </button>
    </div>
  );
};
