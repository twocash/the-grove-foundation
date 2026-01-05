// src/core/engagement/machine.ts
// Sprint: journey-system-v2 - Updated to use schema types (waypoints)
// Sprint: kinetic-stream-schema-v1 - Added stream state and actions
// Sprint: kinetic-stream-reset-v2 - Added pivot/fork events and NavigationParser

import { setup, assign } from 'xstate';
import { initialContext } from './types';
import type { EngagementContext, EngagementEvent } from './types';
import type { Journey } from '../schema/journey';
import type { StreamItem, QueryStreamItem, ResponseStreamItem } from '../schema/stream';
import type {
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';
import { parse } from '../transformers/RhetoricalParser';
import { parseNavigation } from '../transformers/NavigationParser';
import { setCumulativeMetricsV2, getHydratedContextOverrides } from './persistence';

// Sprint: dex-telemetry-compliance-v1 - Field scoping
const DEFAULT_FIELD_ID = 'grove';

// ─────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Sprint: xstate-telemetry-v1
function isCustomLensId(lensId: string | null): boolean {
  if (!lensId) return false;
  return lensId.startsWith('custom-') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lensId);
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
      const item = context.currentStreamItem;
      // Only append to response items
      if (event.type === 'STREAM_CHUNK' && item && item.type === 'response') {
        return {
          currentStreamItem: {
            ...item,
            content: item.content + (event.chunk || '')
          }
        };
      }
      return {};
    }),

    finalizeResponse: assign(({ context }) => {
      const item = context.currentStreamItem;
      // Only finalize response items
      if (!item || item.type !== 'response') return {};

      // Parse navigation block first, then rhetoric on clean content
      const { forks, cleanContent } = parseNavigation(item.content);
      const { spans } = parse(cleanContent);

      const finalizedItem: ResponseStreamItem = {
        ...item,
        content: cleanContent,
        isGenerating: false,
        parsedSpans: spans,
        navigation: forks.length > 0 ? forks : undefined
      };
      return {
        currentStreamItem: finalizedItem,
        streamHistory: [...context.streamHistory, finalizedItem]
      };
    }),

    // Pivot click action (Sprint: kinetic-stream-reset-v2)
    handlePivotClick: assign(({ context, event }) => {
      if (event.type !== 'USER.CLICK_PIVOT') return {};

      const pivotQuery: QueryStreamItem = {
        id: generateId(),
        type: 'query',
        content: `Tell me more about ${event.span.text}`,
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user',
        pivot: {
          sourceResponseId: event.responseId,
          sourceText: event.span.text,
          sourceContext: '',
          targetId: event.span.conceptId
        }
      };

      return {
        currentStreamItem: pivotQuery,
        streamHistory: [...context.streamHistory, pivotQuery]
      };
    }),

    // Fork select action (Sprint: kinetic-stream-reset-v2)
    // Sprint: prompt-progression-v1 - Also track selected prompts
    handleForkSelect: assign(({ context, event }) => {
      if (event.type !== 'USER.SELECT_FORK') return {};

      const forkQuery: QueryStreamItem = {
        id: generateId(),
        type: 'query',
        content: event.fork.queryPayload || event.fork.label,
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user',
        intent: event.fork.type
      };

      // Track prompt selection for progression (Sprint: prompt-progression-v1)
      const updatedPromptsSelected = context.promptsSelected.includes(event.fork.id)
        ? context.promptsSelected
        : [...context.promptsSelected, event.fork.id];

      return {
        currentStreamItem: forkQuery,
        streamHistory: [...context.streamHistory, forkQuery],
        promptsSelected: updatedPromptsSelected
      };
    }),

    // Moment orchestration actions (Sprint: engagement-orchestrator-v1)
    setFlag: assign(({ context, event }) => {
      if (event.type !== 'SET_FLAG') return {};
      return {
        flags: { ...context.flags, [event.key]: event.value }
      };
    }),

    setCooldown: assign(({ context, event }) => {
      if (event.type !== 'SET_COOLDOWN') return {};
      return {
        momentCooldowns: { ...context.momentCooldowns, [event.momentId]: event.timestamp }
      };
    }),

    clearFlags: assign(() => ({
      flags: {}
    })),

    clearCooldowns: assign(() => ({
      momentCooldowns: {}
    })),

    // Hub tracking actions (Sprint: entropy-calculation-v1)
    hubVisited: assign(({ context, event }) => {
      if (event.type !== 'HUB_VISITED') return {};
      const hubs = new Set(context.hubsVisited);
      hubs.add(event.hubId);
      return {
        hubsVisited: Array.from(hubs),
        consecutiveHubRepeats: event.hubId === context.lastHubId
          ? context.consecutiveHubRepeats + 1
          : 0,
        lastHubId: event.hubId
      };
    }),

    pivotClicked: assign(({ context }) => ({
      pivotCount: context.pivotCount + 1
    })),

    resetHubTracking: assign(() => ({
      hubsVisited: [],
      lastHubId: null,
      consecutiveHubRepeats: 0,
      pivotCount: 0
    })),

    // Sprint: dex-telemetry-compliance-v1 - Provenance-tracked metrics
    addJourneyCompletion: assign(({ context, event }) => {
      if (event.type !== 'JOURNEY_COMPLETED_TRACKED') return {};
      const completion: JourneyCompletion = {
        fieldId: DEFAULT_FIELD_ID,
        timestamp: Date.now(),
        journeyId: event.journeyId,
        durationMs: event.durationMs,
      };
      return { journeyCompletions: [...context.journeyCompletions, completion] };
    }),

    addSproutCapture: assign(({ context, event }) => {
      if (event.type !== 'SPROUT_CAPTURED') return {};
      const capture: SproutCapture = {
        fieldId: DEFAULT_FIELD_ID,
        timestamp: Date.now(),
        sproutId: event.sproutId,
        journeyId: event.journeyId,
        hubId: event.hubId,
      };
      return { sproutCaptures: [...context.sproutCaptures, capture] };
    }),

    addTopicExploration: assign(({ context, event }) => {
      if (event.type !== 'TOPIC_EXPLORED') return {};
      const exists = context.topicExplorations.some(t => t.topicId === event.topicId);
      if (exists) return {};
      const exploration: TopicExploration = {
        fieldId: DEFAULT_FIELD_ID,
        timestamp: Date.now(),
        topicId: event.topicId,
        hubId: event.hubId,
      };
      return { topicExplorations: [...context.topicExplorations, exploration] };
    }),

    updateHasCustomLens: assign(({ context }) => ({
      hasCustomLens: isCustomLensId(context.lens),
    })),

    persistMetrics: ({ context }) => {
      setCumulativeMetricsV2({
        version: 2,
        fieldId: DEFAULT_FIELD_ID,
        journeyCompletions: context.journeyCompletions,
        topicExplorations: context.topicExplorations,
        sproutCaptures: context.sproutCaptures,
        sessionCount: context.sessionCount,
        lastSessionAt: Date.now(),
      });
    },

    // Sprint: xstate-telemetry-v1 - Telemetry logging
    logMomentShown: ({ event }) => {
      if (event.type !== 'MOMENT_SHOWN') return;
      console.log('[Telemetry] Moment shown:', event.momentId, event.surface);
    },

    logMomentActioned: ({ event }) => {
      if (event.type !== 'MOMENT_ACTIONED') return;
      console.log('[Telemetry] Moment actioned:', event.momentId, event.actionId, event.actionType);
    },

    logMomentDismissed: ({ event }) => {
      if (event.type !== 'MOMENT_DISMISSED') return;
      console.log('[Telemetry] Moment dismissed:', event.momentId);
    },
  },
}).createMachine({
  id: 'engagement',
  type: 'parallel',
  // Sprint: xstate-telemetry-v1 - Hydrate context from localStorage on machine creation
  context: () => ({
    ...initialContext,
    ...getHydratedContextOverrides(),
  }),
  states: {
    session: {
      initial: 'anonymous',
      states: {
        anonymous: {
          on: {
            SELECT_LENS: {
              target: 'lensActive',
              actions: ['setLens', 'updateHasCustomLens'],
            },
          },
        },
        lensActive: {
          on: {
            CHANGE_LENS: {
              actions: ['setLens', 'updateHasCustomLens'],
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
              actions: ['setLens', 'updateHasCustomLens'],
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
              actions: ['setLens', 'updateHasCustomLens'],
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
    // Kinetic stream events (Sprint: kinetic-stream-reset-v2)
    'USER.CLICK_PIVOT': {
      actions: 'handlePivotClick',
    },
    'USER.SELECT_FORK': {
      actions: 'handleForkSelect',
    },
    // Moment orchestration events (Sprint: engagement-orchestrator-v1)
    SET_FLAG: {
      actions: 'setFlag',
    },
    SET_COOLDOWN: {
      actions: 'setCooldown',
    },
    CLEAR_FLAGS: {
      actions: 'clearFlags',
    },
    CLEAR_COOLDOWNS: {
      actions: 'clearCooldowns',
    },
    // Hub tracking events (Sprint: entropy-calculation-v1)
    HUB_VISITED: {
      actions: 'hubVisited',
    },
    PIVOT_CLICKED: {
      actions: 'pivotClicked',
    },
    RESET_HUB_TRACKING: {
      actions: 'resetHubTracking',
    },
    // Sprint: dex-telemetry-compliance-v1 - Cumulative metric events with provenance
    JOURNEY_COMPLETED_TRACKED: {
      actions: ['addJourneyCompletion', 'persistMetrics'],
    },
    SPROUT_CAPTURED: {
      actions: ['addSproutCapture', 'persistMetrics'],
    },
    TOPIC_EXPLORED: {
      actions: ['addTopicExploration', 'persistMetrics'],
    },
    // Sprint: xstate-telemetry-v1 - Telemetry events (logging only)
    MOMENT_SHOWN: {
      actions: 'logMomentShown',
    },
    MOMENT_ACTIONED: {
      actions: 'logMomentActioned',
    },
    MOMENT_DISMISSED: {
      actions: 'logMomentDismissed',
    },
  },
});

export type EngagementMachine = typeof engagementMachine;
