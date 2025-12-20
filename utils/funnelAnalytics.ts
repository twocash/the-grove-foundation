// funnelAnalytics - Analytics tracking for custom lens funnel
// Tracks user progression through lens creation and reveal sequences

import { FunnelEventType, ArchetypeId } from '../types/lens';

// Analytics event structure
interface AnalyticsEvent {
  event: FunnelEventType;
  timestamp: string;
  sessionId: string;
  properties: Record<string, unknown>;
}

// Local event queue for batching
let eventQueue: AnalyticsEvent[] = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('grove-analytics-session');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('grove-analytics-session', sessionId);
  }
  return sessionId;
};

// Core tracking function
export const trackFunnelEvent = (
  event: FunnelEventType,
  properties: Record<string, unknown> = {}
): void => {
  const analyticsEvent: AnalyticsEvent = {
    event,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    properties: {
      ...properties,
      url: window.location.pathname,
      userAgent: navigator.userAgent
    }
  };

  // Add to queue
  eventQueue.push(analyticsEvent);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }

  // Flush if queue is full
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }
};

// Flush events to backend (or third-party analytics)
const flushEvents = async (): Promise<void> => {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    // In production, this would send to an analytics endpoint
    // For now, we'll store locally for debugging
    const existingEvents = JSON.parse(localStorage.getItem('grove-analytics-events') || '[]');
    const updatedEvents = [...existingEvents, ...eventsToSend].slice(-100); // Keep last 100 events
    localStorage.setItem('grove-analytics-events', JSON.stringify(updatedEvents));

    // Uncomment to send to backend:
    // await fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events: eventsToSend })
    // });
  } catch (err) {
    console.error('[Analytics] Failed to flush events:', err);
    // Put events back in queue
    eventQueue = [...eventsToSend, ...eventQueue];
  }
};

// Set up periodic flush
if (typeof window !== 'undefined') {
  setInterval(flushEvents, FLUSH_INTERVAL);
  // Flush on page unload
  window.addEventListener('beforeunload', flushEvents);
}

// Convenience functions for specific events
export const trackWizardStart = (): void => {
  trackFunnelEvent('wizard_start');
};

export const trackPrivacyAccepted = (): void => {
  trackFunnelEvent('privacy_accepted');
};

export const trackInputProvided = (questionId: string, hasValue: boolean): void => {
  trackFunnelEvent('input_provided', { questionId, hasValue });
};

export const trackGenerationStarted = (): void => {
  trackFunnelEvent('generation_started');
};

export const trackCandidatesShown = (candidateCount: number): void => {
  trackFunnelEvent('candidates_shown', { candidateCount });
};

export const trackLensSelected = (lensName: string, archetypeId: ArchetypeId): void => {
  trackFunnelEvent('lens_selected', { lensName, archetypeId });
};

export const trackLensActivated = (lensId: string, isCustom: boolean): void => {
  trackFunnelEvent('lens_activated', { lensId, isCustom });
};

export const trackWizardAbandoned = (step: string): void => {
  trackFunnelEvent('wizard_abandoned', { step });
};

export const trackSimulationRevealShown = (archetypeId: ArchetypeId): void => {
  trackFunnelEvent('simulation_reveal_shown', { archetypeId });
};

export const trackSimulationRevealAcknowledged = (archetypeId: ArchetypeId): void => {
  trackFunnelEvent('simulation_reveal_acknowledged', { archetypeId });
};

export const trackTerminatorModeUnlocked = (): void => {
  trackFunnelEvent('terminator_mode_unlocked');
};

export const trackTerminatorModeActivated = (): void => {
  trackFunnelEvent('terminator_mode_activated');
};

export const trackFounderStoryViewed = (archetypeId: ArchetypeId): void => {
  trackFunnelEvent('founder_story_viewed', { archetypeId });
};

export const trackCtaViewed = (archetypeId: ArchetypeId, ctaId: string): void => {
  trackFunnelEvent('cta_viewed', { archetypeId, ctaId });
};

export const trackCtaClicked = (archetypeId: ArchetypeId, ctaId: string, ctaAction: string): void => {
  trackFunnelEvent('cta_clicked', { archetypeId, ctaId, ctaAction });
};

export const trackConversionCompleted = (
  archetypeId: ArchetypeId,
  conversionType: string,
  email?: string
): void => {
  trackFunnelEvent('conversion_completed', {
    archetypeId,
    conversionType,
    hasEmail: !!email
  });
};

export const trackJourneyCompleted = (
  archetypeId: ArchetypeId | null,
  cardsVisited: number,
  minutesActive: number
): void => {
  trackFunnelEvent('journey_completed', {
    archetypeId,
    cardsVisited,
    minutesActive
  });
};

// Cognitive Bridge events
export const trackCognitiveBridgeShown = (data: {
  journeyId: string;
  entropyScore: number;
  cluster: string;
  exchangeCount: number;
}): void => {
  trackFunnelEvent('cognitive_bridge_shown', {
    journeyId: data.journeyId,
    topicCluster: data.cluster,
    entropyScore: data.entropyScore,
    exchangeCount: data.exchangeCount
  });
};

export const trackCognitiveBridgeAccepted = (data: {
  journeyId: string;
  timeToDecisionMs: number;
}): void => {
  trackFunnelEvent('cognitive_bridge_accepted', {
    journeyId: data.journeyId,
    timeToDecisionMs: data.timeToDecisionMs
  });
};

export const trackCognitiveBridgeDismissed = (data: {
  journeyId: string;
  timeToDecisionMs: number;
}): void => {
  trackFunnelEvent('cognitive_bridge_dismissed', {
    journeyId: data.journeyId,
    timeToDecisionMs: data.timeToDecisionMs
  });
};

export const trackEntropyHighDetected = (
  entropyScore: number,
  dominantCluster: string | null,
  exchangeCount: number
): void => {
  trackFunnelEvent('entropy_high_detected', {
    entropyScore,
    dominantCluster,
    exchangeCount
  });
};

// Prompt hook clicks from landing page
export const trackPromptHookClicked = (data: {
  sectionId: string;
  hookText: string;
  nodeId?: string;
  variantId?: string;
  experimentId?: string;
}): void => {
  trackFunnelEvent('prompt_hook_clicked', {
    sectionId: data.sectionId,
    hookText: data.hookText,
    nodeId: data.nodeId || null,
    variantId: data.variantId || null,
    experimentId: data.experimentId || null,
    source: 'landing_page'
  });
};

// Get analytics report (for admin/debugging)
export const getAnalyticsReport = (): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  recentEvents: AnalyticsEvent[];
} => {
  const events: AnalyticsEvent[] = JSON.parse(
    localStorage.getItem('grove-analytics-events') || '[]'
  );

  const eventsByType: Record<string, number> = {};
  events.forEach(e => {
    eventsByType[e.event] = (eventsByType[e.event] || 0) + 1;
  });

  return {
    totalEvents: events.length,
    eventsByType,
    recentEvents: events.slice(-10)
  };
};

// Clear analytics data (for testing)
export const clearAnalytics = (): void => {
  localStorage.removeItem('grove-analytics-events');
  sessionStorage.removeItem('grove-analytics-session');
  eventQueue = [];
};

export default {
  trackFunnelEvent,
  trackWizardStart,
  trackPrivacyAccepted,
  trackInputProvided,
  trackGenerationStarted,
  trackCandidatesShown,
  trackLensSelected,
  trackLensActivated,
  trackWizardAbandoned,
  trackSimulationRevealShown,
  trackSimulationRevealAcknowledged,
  trackTerminatorModeUnlocked,
  trackTerminatorModeActivated,
  trackFounderStoryViewed,
  trackCtaViewed,
  trackCtaClicked,
  trackConversionCompleted,
  trackJourneyCompleted,
  trackCognitiveBridgeShown,
  trackCognitiveBridgeAccepted,
  trackCognitiveBridgeDismissed,
  trackEntropyHighDetected,
  trackPromptHookClicked,
  getAnalyticsReport,
  clearAnalytics
};
