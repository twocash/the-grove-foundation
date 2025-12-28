// src/core/engagement/machine.ts
// Sprint: journey-system-v2 - Updated to use schema types (waypoints)

import { setup, assign } from 'xstate';
import { initialContext } from './types';
import type { EngagementContext, EngagementEvent } from './types';
import type { Journey } from '../schema/journey';

export const engagementMachine = setup({
  types: {
    context: {} as EngagementContext,
    events: {} as EngagementEvent,
  },
  guards: {
    hasLens: ({ context }) => context.lens !== null,
    notAtEnd: ({ context }) => context.journeyProgress < context.journeyTotal - 1,
    atEnd: ({ context }) => context.journeyProgress >= context.journeyTotal - 1,
    highEntropy: ({ context }) => context.entropy > context.entropyThreshold,
  },
  actions: {
    setLens: assign(({ event }) => {
      if (event.type === 'SELECT_LENS') {
        return { lens: event.lens, lensSource: event.source };
      }
      if (event.type === 'CHANGE_LENS') {
        return { lens: event.lens, lensSource: 'selection' as const };
      }
      return {};
    }),
    startJourney: assign(({ event }) => {
      if (event.type === 'START_JOURNEY') {
        return {
          journey: event.journey,
          journeyProgress: 0,
          journeyTotal: event.journey.waypoints.length,
        };
      }
      return {};
    }),
    advanceStep: assign(({ context }) => ({
      journeyProgress: context.journeyProgress + 1,
    })),
    completeJourney: assign(() => ({})),
    clearJourney: assign(() => ({
      journey: null as Journey | null,
      journeyProgress: 0,
      journeyTotal: 0,
    })),
    updateEntropy: assign(({ event }) => {
      if (event.type === 'UPDATE_ENTROPY') {
        return { entropy: event.value };
      }
      return {};
    }),
  },
}).createMachine({
  id: 'engagement',
  type: 'parallel',
  context: initialContext,
  states: {
    session: {
      initial: 'anonymous',
      states: {
        anonymous: {
          on: {
            SELECT_LENS: {
              target: 'lensActive',
              actions: 'setLens',
            },
          },
        },
        lensActive: {
          on: {
            CHANGE_LENS: {
              actions: 'setLens',
            },
            START_JOURNEY: {
              target: 'journeyActive',
              actions: 'startJourney',
              guard: 'hasLens',
            },
          },
        },
        journeyActive: {
          on: {
            CHANGE_LENS: {
              actions: 'setLens',
            },
            START_JOURNEY: {
              // Stay in journeyActive, just update the journey context
              actions: 'startJourney',
            },
            ADVANCE_STEP: {
              actions: 'advanceStep',
              guard: 'notAtEnd',
            },
            COMPLETE_JOURNEY: {
              target: 'journeyComplete',
              actions: 'completeJourney',
            },
            EXIT_JOURNEY: {
              target: 'lensActive',
              actions: 'clearJourney',
            },
          },
        },
        journeyComplete: {
          on: {
            CHANGE_LENS: {
              actions: 'setLens',
            },
            START_JOURNEY: {
              target: 'journeyActive',
              actions: 'startJourney',
            },
            EXIT_JOURNEY: {
              target: 'lensActive',
              actions: 'clearJourney',
            },
          },
        },
      },
    },
    terminal: {
      initial: 'closed',
      states: {
        closed: {
          on: { OPEN_TERMINAL: 'open' },
        },
        open: {
          on: { CLOSE_TERMINAL: 'closed' },
        },
      },
    },
  },
  on: {
    UPDATE_ENTROPY: {
      actions: 'updateEntropy',
    },
  },
});

export type EngagementMachine = typeof engagementMachine;
