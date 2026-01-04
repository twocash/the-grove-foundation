// src/core/events/hooks/index.ts
// Sprint: bedrock-event-hooks-v1
// Public API for Grove Event hooks

// Context and Provider
export { GroveEventContext, STORAGE_KEY, LEGACY_STORAGE_KEY } from './context';
export type { GroveEventContextValue } from './context';
export { GroveEventProvider } from './provider';
export type { GroveEventProviderProps } from './provider';

// Core Hooks
export { useGroveEvents } from './useGroveEvents';
export { useDispatch, useStartNewSession } from './useDispatch';
export { useEventHelpers } from './useEventHelpers';

// Projection Hooks
export { useSession } from './useSession';
export type { SessionState } from './useSession';

export { useContextState } from './useContextState';
export type { ContextState } from './useContextState';

export { useTelemetry } from './useTelemetry';
export type { TelemetryResult, CumulativeMetricsV2, ComputedMetrics } from './useTelemetry';

export { useMomentContext } from './useMomentContext';
export type { MomentEvaluationContext } from './useMomentContext';

export { useStream } from './useStream';
export type { StreamHistoryState } from './useStream';
