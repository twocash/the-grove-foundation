// src/surface/components/modals/SproutFinishingRoom/components/CognitiveRoutingSection.tsx
// Sprint: S2-SFR-Display - US-B002 Cognitive Routing with expandable details

import React, { useState } from 'react';
import type { CognitiveRouting } from '@core/schema/cognitive-routing';

export interface CognitiveRoutingSectionProps {
  routing: CognitiveRouting;
}

/**
 * CognitiveRoutingSection - Expandable cognitive routing display
 *
 * US-B002: Shows collapsed summary, expands to show full routing details.
 * Clicking toggles between expanded and collapsed states.
 */
export const CognitiveRoutingSection: React.FC<CognitiveRoutingSectionProps> = ({
  routing
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="p-4 border-b border-ink/10 dark:border-white/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left group"
        aria-expanded={expanded}
        aria-controls="cognitive-routing-details"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="Cognitive routing">
            🧠
          </span>
          <div>
            <span className="text-sm font-medium text-ink dark:text-paper">
              Cognitive Routing
            </span>
            <p className="text-xs text-ink-muted dark:text-paper/50 font-mono">
              {routing.path}
            </p>
          </div>
        </div>
        <span
          className={`text-ink-muted dark:text-paper/50 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <dl
          id="cognitive-routing-details"
          className="mt-3 ml-7 space-y-2 text-sm"
        >
          <div>
            <dt className="text-ink-muted dark:text-paper/50 text-xs uppercase">
              Path
            </dt>
            <dd className="font-mono text-ink dark:text-paper">{routing.path}</dd>
          </div>
          <div>
            <dt className="text-ink-muted dark:text-paper/50 text-xs uppercase">
              Prompt
            </dt>
            <dd className="text-ink dark:text-paper">{routing.prompt}</dd>
          </div>
          <div>
            <dt className="text-ink-muted dark:text-paper/50 text-xs uppercase">
              Inspiration
            </dt>
            <dd className="text-ink dark:text-paper">{routing.inspiration}</dd>
          </div>
          {routing.domain && (
            <div>
              <dt className="text-ink-muted dark:text-paper/50 text-xs uppercase">
                Domain
              </dt>
              <dd className="text-ink dark:text-paper">{routing.domain}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
};

export default CognitiveRoutingSection;
