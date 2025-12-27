// src/data/journeys/grove-fundamentals.ts
// Introduction journey for new users
// Sprint: adaptive-engagement-v1

import type { Journey } from '../../core/schema/journey';

export const groveFundamentalsJourney: Journey = {
  id: 'grove-fundamentals',
  title: 'Understanding The Grove',
  description: 'A guided introduction to distributed AI infrastructure',
  estimatedTime: '15 minutes',
  lensAffinity: ['curious-citizen', 'tech-explorer', 'freestyle'],
  allowImplicitEntry: true,
  ambientTracking: true,

  waypoints: [
    {
      id: 'why',
      title: 'The Why',
      prompt: 'Why are we building The Grove?',
      hub: 'grove-thesis',
      successCriteria: {
        minExchanges: 2,
      },
      entryPatterns: [
        'why.*grove',
        'why.*building',
        'what.*problem.*solving',
        'purpose.*distributed',
      ],
    },
    {
      id: 'how',
      title: 'The How',
      prompt: 'How does distributed AI actually work?',
      hub: 'technical-architecture',
      successCriteria: {
        minExchanges: 2,
      },
      entryPatterns: [
        'how.*work',
        'technical.*architecture',
        'distributed.*ai.*work',
        'explain.*system',
      ],
    },
    {
      id: 'what',
      title: 'The What',
      prompt: 'What can I do with Grove today?',
      hub: 'current-capabilities',
      successCriteria: {
        minExchanges: 1,
      },
      entryPatterns: [
        'what.*can.*do',
        'capabilities',
        'features',
        'use.*grove',
      ],
    },
    {
      id: 'you',
      title: 'Your Turn',
      prompt: 'What aspect interests you most?',
      successCriteria: {
        minExchanges: 1,
      },
    },
  ],

  completionMessage: "You've completed the fundamentals! Ready to explore on your own, or continue with a deeper dive?",
  nextJourneys: ['deep-dive-agents', 'grove-economics'],
};
