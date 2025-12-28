// src/core/engagement/machine.ts
// Sprint: journey-system-v2 - Updated to use schema types (waypoints)
// Sprint: kinetic-stream-schema-v1 - Added stream state and actions

import { setup, assign } from 'xstate';
import { initialContext } from './types';
import type { EngagementContext, EngagementEvent } from './types';
import type { Journey } from '../schema/journey';
import type { StreamItem } from '../schema/stream';
import { parse } from '../transformers/RhetoricalParser';

// ─────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

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

    // Stream actions (Sprint: kinetic-stream-schema-v1)
    createQueryItem: assign(({ event }) => {
      if (event.type === 'START_QUERY') {
        const item: StreamItem = {
          id: generateId(),
          type: 'query',
          content: event.prompt || '',
          timestamp: Date.now(),
          createdBy: 'user',
          role: 'user'
        };
        return { currentStreamItem: item };
      }
      return {};
    }),

    createResponseItem: assign(({ context }) => {
      const item: StreamItem = {
        id: generateId(),
        type: 'response',
        content: '',
        timestamp: Date.now(),
        createdBy: 'ai',
        role: 'assistant',
        isGenerating: true
      };
      // Add query to history before creating response
      const newHistory = context.currentStreamItem?.type === 'query'
        ? [...context.streamHistory, context.currentStreamItem]
        : context.streamHistory;
      return {
        currentStreamItem: item,
        streamHistory: newHistory
      };
    }),

    appendToResponse: assign(({ context, event }) => {
      if (event.type === 'STREAM_CHUNK' && context.currentStreamItem) {
        return {
          currentStreamItem: {
            ...context.currentStreamItem,
            content: context.currentStreamItem.content + (event.chunk || '')
          }
        };
      }
      return {};
    }),

    finalizeResponse: assign(({ context }) => {
      if (!context.currentStreamItem) return {};
      const { spans } = parse(context.currentStreamItem.content);
      const finalizedItem: StreamItem = {
        ...context.currentStreamItem,
        isGenerating: false,
        parsedSpans: spans
      };
      return {
        currentStreamItem: finalizedItem,
        streamHistory: [...context.streamHistory, finalizedItem]
      };
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
    // Stream events (Sprint: kinetic-stream-schema-v1)
    START_QUERY: {
      actions: 'createQueryItem',
    },
    START_RESPONSE: {
      actions: 'createResponseItem',
    },
    STREAM_CHUNK: {
      actions: 'appendToResponse',
    },
    FINALIZE_RESPONSE: {
      actions: 'finalizeResponse',
    },
  },
});

export type EngagementMachine = typeof engagementMachine;
