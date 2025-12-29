// src/surface/components/KineticStream/ActiveRhetoric/ConceptSpan.tsx
// Clickable concept highlight
// Sprint: kinetic-experience-v1

import React from 'react';
import type { RhetoricalSpan } from '@core/schema/stream';

export interface ConceptSpanProps {
  span: RhetoricalSpan;
  onClick?: (span: RhetoricalSpan) => void;
}

export const ConceptSpan: React.FC<ConceptSpanProps> = ({ span, onClick }) => {
  return (
    <span
      className="kinetic-concept"
      onClick={() => onClick?.(span)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(span);
        }
      }}
      data-testid="concept-span"
    >
      {span.text}
    </span>
  );
};

export default ConceptSpan;
