// src/explore/machines/captureFlow.machine.ts
// XState 5.x machine for Sprout capture flow
// Sprint: bedrock-foundation-v1

import { setup, assign, fromPromise } from 'xstate';

// =============================================================================
// Types
// =============================================================================

export type SproutType = 'document' | 'insight' | 'question' | 'connection';

export interface CaptureFlowContext {
  sproutType: SproutType | null;
  draft: Record<string, unknown>;
  error: string | null;
  createdId: string | null;
}

export type CaptureFlowEvent =
  | { type: 'OPEN_CAPTURE' }
  | { type: 'SELECT_TYPE'; sproutType: SproutType }
  | { type: 'UPDATE_DRAFT'; field: string; value: unknown }
  | { type: 'SUBMIT' }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | { type: 'CAPTURE_ANOTHER' }
  | { type: 'RETRY' };

// =============================================================================
// Submit Actor (service)
// =============================================================================

interface SubmitInput {
  sproutType: SproutType;
  draft: Record<string, unknown>;
}

const submitSprout = fromPromise<{ id: string }, SubmitInput>(async ({ input }) => {
  // In production, this would call the API
  // For now, simulate async creation
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate a new ID
  const id = crypto.randomUUID();

  // TODO: Call actual sprout API endpoint
  // const response = await fetch('/api/sprouts', {
  //   method: 'POST',
  //   body: JSON.stringify({ type: input.sproutType, ...input.draft }),
  // });
  // return response.json();

  return { id };
});

// =============================================================================
// Machine Definition
// =============================================================================

export const captureFlowMachine = setup({
  types: {
    context: {} as CaptureFlowContext,
    events: {} as CaptureFlowEvent,
  },
  actors: {
    submitSprout,
  },
  actions: {
    resetContext: assign({
      sproutType: null,
      draft: {},
      error: null,
      createdId: null,
    }),
    setType: assign({
      sproutType: ({ event }) => {
        if (event.type === 'SELECT_TYPE') {
          return event.sproutType;
        }
        return null;
      },
      draft: {},
    }),
    updateDraft: assign({
      draft: ({ context, event }) => {
        if (event.type === 'UPDATE_DRAFT') {
          return {
            ...context.draft,
            [event.field]: event.value,
          };
        }
        return context.draft;
      },
    }),
    clearDraft: assign({
      sproutType: null,
      draft: {},
    }),
    setCreatedId: assign({
      createdId: ({ event }) => {
        if (event.type === 'xstate.done.actor.submitSprout') {
          return (event as any).output?.id ?? null;
        }
        return null;
      },
    }),
    setError: assign({
      error: ({ event }) => {
        if (event.type === 'xstate.error.actor.submitSprout') {
          return (event as any).error?.message ?? 'An error occurred';
        }
        return null;
      },
    }),
    clearError: assign({
      error: null,
    }),
    clearForCapture: assign({
      draft: {},
      createdId: null,
    }),
  },
  guards: {
    hasDraft: ({ context }) => Object.keys(context.draft).length > 0,
    hasType: ({ context }) => context.sproutType !== null,
  },
}).createMachine({
  id: 'captureFlow',
  initial: 'browsing',
  context: {
    sproutType: null,
    draft: {},
    error: null,
    createdId: null,
  },
  states: {
    browsing: {
      on: {
        OPEN_CAPTURE: 'selectingType',
      },
    },
    selectingType: {
      on: {
        SELECT_TYPE: {
          target: 'editingManifest',
          actions: 'setType',
        },
        CANCEL: 'browsing',
      },
    },
    editingManifest: {
      on: {
        UPDATE_DRAFT: {
          actions: 'updateDraft',
        },
        SUBMIT: {
          target: 'submitting',
          guard: 'hasType',
        },
        CANCEL: {
          target: 'browsing',
          actions: 'clearDraft',
        },
      },
    },
    submitting: {
      invoke: {
        id: 'submitSprout',
        src: 'submitSprout',
        input: ({ context }) => ({
          sproutType: context.sproutType!,
          draft: context.draft,
        }),
        onDone: {
          target: 'success',
          actions: 'setCreatedId',
        },
        onError: {
          target: 'error',
          actions: 'setError',
        },
      },
    },
    success: {
      on: {
        RESET: {
          target: 'browsing',
          actions: 'resetContext',
        },
        CAPTURE_ANOTHER: {
          target: 'selectingType',
          actions: 'clearForCapture',
        },
      },
    },
    error: {
      on: {
        RETRY: 'submitting',
        CANCEL: {
          target: 'browsing',
          actions: ['clearError', 'resetContext'],
        },
      },
    },
  },
});

// =============================================================================
// Type Exports for Consumers
// =============================================================================

export type CaptureFlowState =
  | 'browsing'
  | 'selectingType'
  | 'editingManifest'
  | 'submitting'
  | 'success'
  | 'error';
