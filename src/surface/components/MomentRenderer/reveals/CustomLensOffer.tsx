// src/surface/components/MomentRenderer/reveals/CustomLensOffer.tsx
// Custom lens offer content component
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';

export interface CustomLensOfferProps {
  moment: Moment;
}

export function CustomLensOffer({ moment }: CustomLensOfferProps) {
  const content = moment.payload.content;
  return (
    <div className="custom-lens-offer space-y-3">
      <div className="text-3xl">🎭</div>
      <h3 className="font-display text-lg text-[var(--glass-text-primary)]">
        {content.heading || "Create Your Lens"}
      </h3>
      <p className="text-[var(--glass-text-body)]">
        {content.body || "Build a personalized lens that matches your perspective."}
      </p>
    </div>
  );
}

export default CustomLensOffer;
