// src/core/telemetry/client.ts
// Prompt Telemetry API Client
// Sprint: 4d-prompt-refactor-telemetry-v1

import type {
  PromptTelemetryEvent,
  PromptTelemetryStats,
  TelemetrySubmitResponse,
  TelemetryBatchResponse,
  TelemetryPerformanceResponse,
} from './types';

const TELEMETRY_BASE_URL = '/api/telemetry';

// =============================================================================
// SUBMISSION FUNCTIONS
// =============================================================================

/**
 * Submit a single telemetry event
 */
export async function submitTelemetryEvent(
  event: PromptTelemetryEvent
): Promise<TelemetrySubmitResponse> {
  const response = await fetch(`${TELEMETRY_BASE_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Telemetry submission failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Submit batch of telemetry events (for impressions)
 */
export async function submitTelemetryBatch(
  events: PromptTelemetryEvent[]
): Promise<TelemetryBatchResponse> {
  const response = await fetch(`${TELEMETRY_BASE_URL}/prompt/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });

  if (!response.ok) {
    throw new Error(`Telemetry batch failed: ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get stats for a specific prompt
 */
export async function getPromptStats(promptId: string): Promise<PromptTelemetryStats> {
  const response = await fetch(
    `${TELEMETRY_BASE_URL}/prompt/${encodeURIComponent(promptId)}/stats`
  );

  if (!response.ok) {
    throw new Error(`Stats fetch failed: ${response.status}`);
  }

  return response.json();
}

/**
 * List all prompt performance
 */
export async function listPromptPerformance(options?: {
  limit?: number;
  sort?: keyof PromptTelemetryStats;
  order?: 'asc' | 'desc';
}): Promise<TelemetryPerformanceResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.sort) params.set('sort', options.sort);
  if (options?.order) params.set('order', options.order);

  const url = `${TELEMETRY_BASE_URL}/prompts/performance${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Performance list failed: ${response.status}`);
  }

  return response.json();
}
