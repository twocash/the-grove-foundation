// src/data/journeys/index.ts
// Journey registry
// Sprint: adaptive-engagement-v1

import type { Journey } from '../../core/schema/journey';
import { groveFundamentalsJourney } from './grove-fundamentals';

export const journeys: Journey[] = [
  groveFundamentalsJourney,
  // Add more journeys here
];

export function getJourneyById(id: string): Journey | undefined {
  return journeys.find(j => j.id === id);
}

export function getJourneysForLens(lensId: string | null): Journey[] {
  return journeys.filter(j => {
    if (j.lensExclude?.includes(lensId ?? '')) return false;
    if (j.lensAffinity && j.lensAffinity.length > 0) {
      if (!lensId) return true; // Show to users without lens
      return j.lensAffinity.includes(lensId);
    }
    return true;
  });
}
