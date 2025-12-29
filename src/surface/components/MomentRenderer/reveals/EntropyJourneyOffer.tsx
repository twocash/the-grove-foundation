// src/surface/components/MomentRenderer/reveals/EntropyJourneyOffer.tsx
// Entropy journey offer content component
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';

export interface EntropyJourneyOfferProps {
  moment: Moment;
}

export function EntropyJourneyOffer({ moment }: EntropyJourneyOfferProps) {
  const content = moment.payload.content;
  return (
    <div className="entropy-journey-offer space-y-3">
      <div className="text-3xl">🧭</div>
      <h3 className="font-display text-lg text-[var(--glass-text-primary)]">
        {content.heading || "Take a Guided Journey"}
      </h3>
      <p className="text-[var(--glass-text-body)]">
        {content.body || "Your exploration is getting complex. Want a structured path?"}
      </p>
    </div>
  );
}

export default EntropyJourneyOffer;
