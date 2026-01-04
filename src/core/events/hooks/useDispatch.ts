// src/core/events/hooks/useDispatch.ts
// Sprint: bedrock-event-hooks-v1

import { useContext, useCallback } from 'react';
import { GroveEventContext } from './context';
import type { GroveEvent } from '../types';

/**
 * Get the dispatch function for emitting events.
 * Events are validated via Zod before being added to the log.
 *
 * @returns Dispatch function
 * @throws Error if used outside provider
 * @throws ZodError if event is invalid
 *
 * @example
 * ```tsx
 * function LensSelector() {
 *   const dispatch = useDispatch();
 *
 *   const handleSelect = (lensId: string) => {
 *     dispatch({
 *       type: 'LENS_ACTIVATED',
 *       fieldId: 'grove',
 *       timestamp: Date.now(),
 *       sessionId: currentSessionId,
 *       lensId,
 *       source: 'selection',
 *       isCustom: false,
 *     });
 *   };
 *
 *   return <button onClick={() => handleSelect('engineer')}>Select</button>;
 * }
 * ```
 */
export function useDispatch(): (event: GroveEvent) => void {
  const context = useContext(GroveEventContext);

  if (!context) {
    throw new Error(
      'useDispatch must be used within a GroveEventProvider. ' +
      'Wrap your app with <GroveEventProvider> to use this hook.'
    );
  }

  return context.dispatch;
}

/**
 * Get the startNewSession function.
 * Clears session events and increments session count.
 *
 * @returns Function to start a new session
 * @throws Error if used outside provider
 */
export function useStartNewSession(): () => void {
  const context = useContext(GroveEventContext);

  if (!context) {
    throw new Error(
      'useStartNewSession must be used within a GroveEventProvider. ' +
      'Wrap your app with <GroveEventProvider> to use this hook.'
    );
  }

  return context.startNewSession;
}
