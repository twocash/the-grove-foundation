// src/core/events/projections/stream.ts
// Sprint: bedrock-event-architecture-v1

import type { GroveEvent } from '../types';
import type { StreamHistoryState } from './types';
import type { StreamItem, QueryStreamItem, ResponseStreamItem } from '../../schema/stream';
import { INITIAL_STREAM_STATE } from './types';

/**
 * Project stream history from events.
 * Reconstructs the conversation history from query/response events.
 *
 * @param events - Array of events to process
 * @returns Reconstructed stream history
 */
export function projectStream(events: GroveEvent[]): StreamHistoryState {
  const items: StreamItem[] = [];
  let currentQuery: QueryStreamItem | null = null;
  let currentResponse: ResponseStreamItem | null = null;
  let exchangeCount = 0;

  for (const event of events) {
    switch (event.type) {
      case 'QUERY_SUBMITTED':
        // Create query stream item
        currentQuery = {
          id: event.queryId,
          type: 'query',
          timestamp: event.timestamp,
          content: event.content,
          role: 'user',
          createdBy: 'user',
          pivot: event.sourceResponseId
            ? {
                sourceResponseId: event.sourceResponseId,
                sourceText: '',
                sourceContext: event.intent ?? '',
              }
            : undefined,
        };
        items.push(currentQuery);
        break;

      case 'RESPONSE_COMPLETED':
        // Create response stream item
        currentResponse = {
          id: event.responseId,
          type: 'response',
          timestamp: event.timestamp,
          content: '', // Content not stored in events
          isGenerating: false,
          role: 'assistant',
          createdBy: 'ai',
          navigation: event.hasNavigation ? [] : undefined,
        };
        items.push(currentResponse);
        exchangeCount++;
        break;

      case 'FORK_SELECTED':
        // Link fork to response
        const responseIdx = items.findIndex(
          i => i.type === 'response' && i.id === event.responseId
        );
        if (responseIdx !== -1 && items[responseIdx].type === 'response') {
          const response = items[responseIdx] as ResponseStreamItem;
          response.navigation = response.navigation ?? [];
          response.navigation.push({
            id: event.forkId,
            type: event.forkType,
            label: event.label,
            queryPayload: event.label,
          });
        }
        break;

      case 'PIVOT_TRIGGERED':
        // Link pivot to response
        const pivotResponseIdx = items.findIndex(
          i => i.type === 'response' && i.id === event.responseId
        );
        if (pivotResponseIdx !== -1 && items[pivotResponseIdx].type === 'response') {
          const response = items[pivotResponseIdx] as ResponseStreamItem;
          response.parsedSpans = response.parsedSpans ?? [];
          response.parsedSpans.push({
            type: 'concept',
            text: event.sourceText,
            metadata: { conceptId: event.conceptId },
          });
        }
        break;
    }
  }

  return {
    items,
    currentItem: currentResponse,
    exchangeCount,
  };
}

/**
 * Get last N stream items from events.
 *
 * @param events - Array of events to process
 * @param n - Number of items to return
 * @returns Last N stream items
 */
export function getLastStreamItems(events: GroveEvent[], n: number): StreamItem[] {
  const { items } = projectStream(events);
  return items.slice(-n);
}

/**
 * Get query-response pairs from events.
 *
 * @param events - Array of events to process
 * @returns Array of [query, response] tuples
 */
export function getQueryResponsePairs(
  events: GroveEvent[]
): Array<[QueryStreamItem, ResponseStreamItem]> {
  const { items } = projectStream(events);
  const pairs: Array<[QueryStreamItem, ResponseStreamItem]> = [];

  for (let i = 0; i < items.length - 1; i++) {
    if (items[i].type === 'query' && items[i + 1].type === 'response') {
      pairs.push([items[i] as QueryStreamItem, items[i + 1] as ResponseStreamItem]);
    }
  }

  return pairs;
}

/**
 * Check if there's an active (unanswered) query.
 */
export function hasActiveQuery(events: GroveEvent[]): boolean {
  let queryCount = 0;
  let responseCount = 0;

  for (const event of events) {
    if (event.type === 'QUERY_SUBMITTED') queryCount++;
    if (event.type === 'RESPONSE_COMPLETED') responseCount++;
  }

  return queryCount > responseCount;
}
