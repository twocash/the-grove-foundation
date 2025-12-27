// hooks/useSessionTelemetry.ts
// React hook for session telemetry
// Sprint: adaptive-engagement-v1

import { useState, useEffect, useCallback } from 'react';
import { telemetryCollector } from '../src/lib/telemetry';
import type { SessionTelemetry, SessionStage } from '../src/core/schema/session-telemetry';

interface UseSessionTelemetryResult {
  telemetry: SessionTelemetry;
  stage: SessionStage;
  trackExchange: () => void;
  trackTopic: (topicId: string) => void;
  trackSprout: () => void;
  refresh: () => void;
}

export function useSessionTelemetry(): UseSessionTelemetryResult {
  const [telemetry, setTelemetry] = useState<SessionTelemetry>(
    telemetryCollector.get()
  );

  useEffect(() => {
    const unsubscribe = telemetryCollector.subscribe(setTelemetry);
    return unsubscribe;
  }, []);

  const trackExchange = useCallback(() => {
    telemetryCollector.update({ type: 'exchange' });
  }, []);

  const trackTopic = useCallback((topicId: string) => {
    telemetryCollector.update({ type: 'topic', payload: { topicId } });
  }, []);

  const trackSprout = useCallback(() => {
    telemetryCollector.update({ type: 'sprout' });
  }, []);

  const refresh = useCallback(() => {
    setTelemetry(telemetryCollector.get());
  }, []);

  return {
    telemetry,
    stage: telemetry.stage,
    trackExchange,
    trackTopic,
    trackSprout,
    refresh,
  };
}
