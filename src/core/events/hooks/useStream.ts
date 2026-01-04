// src/core/events/hooks/useStream.ts
// Sprint: bedrock-event-hooks-v1

import { useMemo } from 'react';
import { useGroveEvents } from './useGroveEvents';
import { projectStream } from '../projections';
import type { StreamHistoryState } from '../projections/types';

// Re-export type for convenience
export type { StreamHistoryState };

/**
 * Get the conversation stream history derived from events.
 * Reconstructs query/response pairs for UI rendering.
 *
 * @returns StreamHistoryState with conversation history
 *
 * @example
 * ```tsx
 * function ConversationHistory() {
 *   const stream = useStream();
 *
 *   return (
 *     <div>
 *       {stream.items.map((item, i) => (
 *         <div key={i}>
 *           {item.type === 'query' && <UserMessage>{item.content}</UserMessage>}
 *           {item.type === 'response' && <AIMessage>{item.content}</AIMessage>}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStream(): StreamHistoryState {
  const log = useGroveEvents();

  return useMemo(
    () => projectStream(log.sessionEvents),
    [log.sessionEvents]
  );
}
