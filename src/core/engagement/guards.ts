// src/core/engagement/guards.ts

import type { EngagementContext } from './types';

export const guards = {
  hasLens: ({ context }: { context: EngagementContext }): boolean => {
    return context.lens !== null;
  },

  notAtEnd: ({ context }: { context: EngagementContext }): boolean => {
    return context.journeyProgress < context.journeyTotal - 1;
  },

  atEnd: ({ context }: { context: EngagementContext }): boolean => {
    return context.journeyProgress >= context.journeyTotal - 1;
  },

  highEntropy: ({ context }: { context: EngagementContext }): boolean => {
    return context.entropy > context.entropyThreshold;
  },
};
