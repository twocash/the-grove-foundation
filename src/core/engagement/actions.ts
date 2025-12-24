// src/core/engagement/actions.ts

import { assign } from 'xstate';
import type { EngagementContext, EngagementEvent, Journey } from './types';

// Action creators for use in machine definition
export const actions = {
  setLens: assign({
    lens: ({ event }) => {
      const e = event as EngagementEvent;
      if (e.type === 'SELECT_LENS') return e.lens;
      if (e.type === 'CHANGE_LENS') return e.lens;
      return null;
    },
    lensSource: ({ event }) => {
      const e = event as EngagementEvent;
      if (e.type === 'SELECT_LENS') return e.source;
      if (e.type === 'CHANGE_LENS') return 'selection' as const;
      return null;
    },
  }),

  startJourney: assign({
    journey: ({ event }) => {
      const e = event as Extract<EngagementEvent, { type: 'START_JOURNEY' }>;
      return e.journey;
    },
    journeyProgress: () => 0,
    journeyTotal: ({ event }) => {
      const e = event as Extract<EngagementEvent, { type: 'START_JOURNEY' }>;
      return e.journey.steps.length;
    },
  }),

  advanceStep: assign({
    journeyProgress: ({ context }) => (context as EngagementContext).journeyProgress + 1,
  }),

  completeJourney: assign({}),

  clearJourney: assign({
    journey: () => null as Journey | null,
    journeyProgress: () => 0,
    journeyTotal: () => 0,
  }),

  updateEntropy: assign({
    entropy: ({ event }) => {
      const e = event as Extract<EngagementEvent, { type: 'UPDATE_ENTROPY' }>;
      return e.value;
    },
  }),
};
