// src/core/engagement/actions.ts
// Sprint: kinetic-stream-schema-v1 - Added stream actions

import { assign } from 'xstate';
import type { EngagementContext, EngagementEvent, Journey } from './types';
import type { StreamItem } from '../schema/stream';
import { parse } from '../transformers/RhetoricalParser';

// ─────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

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
      return e.journey.waypoints.length;
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

  // ─────────────────────────────────────────────────────────────────
  // STREAM ACTIONS (Sprint: kinetic-stream-schema-v1)
  // ─────────────────────────────────────────────────────────────────

  createQueryItem: assign({
    currentStreamItem: ({ event }) => {
      const e = event as Extract<EngagementEvent, { type: 'START_QUERY' }>;
      return {
        id: generateId(),
        type: 'query' as const,
        content: e.prompt || '',
        timestamp: Date.now(),
        createdBy: 'user' as const,
        role: 'user' as const
      } satisfies StreamItem;
    },
    streamHistory: ({ context }) => [...(context as EngagementContext).streamHistory],
  }),

  createResponseItem: assign({
    currentStreamItem: ({ context }) => {
      // First, add the query to history if it exists
      const ctx = context as EngagementContext;
      return {
        id: generateId(),
        type: 'response' as const,
        content: '',
        timestamp: Date.now(),
        createdBy: 'ai' as const,
        role: 'assistant' as const,
        isGenerating: true
      } satisfies StreamItem;
    },
    streamHistory: ({ context }) => {
      const ctx = context as EngagementContext;
      if (ctx.currentStreamItem && ctx.currentStreamItem.type === 'query') {
        return [...ctx.streamHistory, ctx.currentStreamItem];
      }
      return ctx.streamHistory;
    },
  }),

  appendToResponse: assign({
    currentStreamItem: ({ context, event }) => {
      const ctx = context as EngagementContext;
      const e = event as Extract<EngagementEvent, { type: 'STREAM_CHUNK' }>;
      const item = ctx.currentStreamItem;
      // Only append to response items
      if (!item || item.type !== 'response') return item;
      return {
        ...item,
        content: item.content + (e.chunk || '')
      };
    },
  }),

  finalizeResponse: assign({
    currentStreamItem: ({ context }) => {
      const ctx = context as EngagementContext;
      const item = ctx.currentStreamItem;
      // Only finalize response items
      if (!item || item.type !== 'response') return item;
      const { spans } = parse(item.content);
      return {
        ...item,
        isGenerating: false,
        parsedSpans: spans
      };
    },
    streamHistory: ({ context }) => {
      const ctx = context as EngagementContext;
      const item = ctx.currentStreamItem;
      // Only finalize response items
      if (!item || item.type !== 'response') return ctx.streamHistory;
      const { spans } = parse(item.content);
      const finalizedItem = {
        ...item,
        isGenerating: false,
        parsedSpans: spans
      };
      return [...ctx.streamHistory, finalizedItem];
    },
  }),
};
