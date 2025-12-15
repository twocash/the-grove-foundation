// analytics/funnelAnalytics.ts — Event Tracking Implementation

import { ArchetypeId, FunnelEvent, FunnelEventType } from '../types/lens';

// ============================================================
// CONFIGURATION
// ============================================================

const ANALYTICS_ENDPOINT = '/api/analytics/events';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;

// ============================================================
// SESSION MANAGEMENT
// ============================================================

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getOrCreateSessionId(): string {
  const stored = sessionStorage.getItem('grove-session-id');
  if (stored) return stored;
  
  const newId = generateSessionId();
  sessionStorage.setItem('grove-session-id', newId);
  return newId;
}

// ============================================================
// EVENT QUEUE
// ============================================================

let eventQueue: FunnelEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

function queueEvent(event: FunnelEvent): void {
  eventQueue.push(event);
  
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushEvents, FLUSH_INTERVAL_MS);
  }
}

async function flushEvents(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend }),
    });
  } catch (error) {
    // Re-queue on failure (with limit to prevent infinite growth)
    if (eventQueue.length < 100) {
      eventQueue = [...eventsToSend, ...eventQueue];
    }
    console.warn('Failed to flush analytics events:', error);
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0) {
      // Use sendBeacon for reliability on page close
      navigator.sendBeacon(
        ANALYTICS_ENDPOINT,
        JSON.stringify({ events: eventQueue })
      );
    }
  });
}

// ============================================================
// EVENT TRACKING FUNCTIONS
// ============================================================

function createEvent(
  eventType: FunnelEventType,
  metadata?: Record<string, unknown>
): FunnelEvent {
  return {
    eventType,
    sessionId: getOrCreateSessionId(),
    timestamp: new Date().toISOString(),
    ...metadata,
  };
}

// --- Session Events ---

export function trackSessionStarted(): void {
  queueEvent(createEvent('session_started'));
}

// --- Lens Events ---

export function trackLensPickerViewed(): void {
  queueEvent(createEvent('lens_picker_viewed'));
}

export function trackArchetypalLensSelected(archetypeId: ArchetypeId): void {
  queueEvent(createEvent('archetypal_lens_selected', { archetypeId }));
}

export function trackCustomLensWizardStarted(): void {
  queueEvent(createEvent('custom_lens_wizard_started'));
}

export function trackCustomLensStepCompleted(
  stepNumber: number,
  stepName: string
): void {
  queueEvent(createEvent('custom_lens_step_completed', {
    stepNumber,
    metadata: { stepName },
  }));
}

export function trackCustomLensCreated(
  customLensId: string,
  archetypeMapping: ArchetypeId
): void {
  queueEvent(createEvent('custom_lens_created', {
    customLensId,
    archetypeId: archetypeMapping,
  }));
}

// --- Journey Events ---

export function trackJourneyStarted(
  archetypeId?: ArchetypeId,
  customLensId?: string
): void {
  queueEvent(createEvent('journey_started', {
    archetypeId,
    customLensId,
  }));
}

export function trackCardViewed(
  cardId: string,
  journeyIndex: number
): void {
  queueEvent(createEvent('card_viewed', {
    cardId,
    journeyIndex,
  }));
}

export function trackJourneyCompleted(
  journeyIndex: number,
  archetypeId?: ArchetypeId,
  customLensId?: string
): void {
  queueEvent(createEvent('journey_completed', {
    journeyIndex,
    archetypeId,
    customLensId,
  }));
}

// --- Reveal Events ---

export function trackSimulationRevealReached(): void {
  queueEvent(createEvent('simulation_reveal_reached'));
}

export function trackSimulationRevealClicked(action: string): void {
  queueEvent(createEvent('simulation_reveal_clicked', {
    metadata: { action },
  }));
}

export function trackTerminatorModeActivated(): void {
  queueEvent(createEvent('terminator_mode_activated'));
}

export function trackFounderStoryViewed(): void {
  queueEvent(createEvent('founder_story_viewed'));
}

// --- Conversion Events ---

export function trackCTAViewed(
  ctaId: string,
  archetypeId: ArchetypeId
): void {
  queueEvent(createEvent('cta_viewed', {
    ctaId,
    archetypeId,
  }));
}

export function trackCTAClicked(
  ctaId: string,
  archetypeId: ArchetypeId,
  customLensId?: string
): void {
  queueEvent(createEvent('cta_clicked', {
    ctaId,
    archetypeId,
    customLensId,
  }));
}

export function trackInvitationSent(
  archetypeId: ArchetypeId,
  invitationType: string
): void {
  queueEvent(createEvent('invitation_sent', {
    archetypeId,
    metadata: { invitationType },
  }));
}

export function trackLensShared(customLensId?: string): void {
  queueEvent(createEvent('lens_shared', { customLensId }));
}

// ============================================================
// REACT HOOK
// ============================================================

import { useEffect, useCallback } from 'react';

export function useFunnelAnalytics() {
  // Track session start on mount
  useEffect(() => {
    trackSessionStarted();
  }, []);
  
  return {
    // Lens events
    trackLensPickerViewed: useCallback(trackLensPickerViewed, []),
    trackArchetypalLensSelected: useCallback(trackArchetypalLensSelected, []),
    trackCustomLensWizardStarted: useCallback(trackCustomLensWizardStarted, []),
    trackCustomLensStepCompleted: useCallback(trackCustomLensStepCompleted, []),
    trackCustomLensCreated: useCallback(trackCustomLensCreated, []),
    
    // Journey events
    trackJourneyStarted: useCallback(trackJourneyStarted, []),
    trackCardViewed: useCallback(trackCardViewed, []),
    trackJourneyCompleted: useCallback(trackJourneyCompleted, []),
    
    // Reveal events
    trackSimulationRevealReached: useCallback(trackSimulationRevealReached, []),
    trackSimulationRevealClicked: useCallback(trackSimulationRevealClicked, []),
    trackTerminatorModeActivated: useCallback(trackTerminatorModeActivated, []),
    trackFounderStoryViewed: useCallback(trackFounderStoryViewed, []),
    
    // Conversion events
    trackCTAViewed: useCallback(trackCTAViewed, []),
    trackCTAClicked: useCallback(trackCTAClicked, []),
    trackInvitationSent: useCallback(trackInvitationSent, []),
    trackLensShared: useCallback(trackLensShared, []),
  };
}

// ============================================================
// API ROUTE (for reference)
// ============================================================

/*
// app/api/analytics/events/route.ts

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { events } = await req.json();
  
  // Store events in your analytics backend
  // Options: 
  // - Vercel Analytics
  // - PostHog
  // - Mixpanel
  // - Simple database table
  // - BigQuery for scale
  
  // For MVP, just log to console or simple storage
  console.log('Analytics events:', events);
  
  // Example: Store in Supabase
  // await supabase.from('funnel_events').insert(events);
  
  return Response.json({ success: true, count: events.length });
}
*/

// ============================================================
// DASHBOARD QUERIES (for reference)
// ============================================================

/*
Key metrics to track:

1. FUNNEL CONVERSION RATES
   - Session → Lens Selected: X%
   - Lens Selected → Journey Completed: X%
   - Journey Completed → Simulation Reveal: X%
   - Simulation Reveal → Custom Lens Created: X%
   - Custom Lens → Terminator Mode: X%
   - Any Reveal → CTA Clicked: X%

2. BY ARCHETYPE
   - Which archetypes have highest completion rates?
   - Which archetypes click CTAs most?
   - Which archetypes create custom lenses?

3. CONVERSION PATH EFFECTIVENESS
   - Nomination rate by archetype
   - Briefing request rate by archetype
   - GitHub contribution rate for engineers

4. TIME-BASED
   - Average time to first reveal
   - Average time to CTA click
   - Session duration by archetype

5. VIRAL COEFFICIENT
   - Invitations sent per converted user
   - Invitation → Terminal visit rate
   - Invitation → conversion rate

SQL Examples:

-- Funnel conversion by archetype
SELECT 
  archetype_id,
  COUNT(DISTINCT CASE WHEN event_type = 'lens_picker_viewed' THEN session_id END) as started,
  COUNT(DISTINCT CASE WHEN event_type = 'journey_completed' THEN session_id END) as completed_journey,
  COUNT(DISTINCT CASE WHEN event_type = 'simulation_reveal_reached' THEN session_id END) as reached_reveal,
  COUNT(DISTINCT CASE WHEN event_type = 'cta_clicked' THEN session_id END) as clicked_cta
FROM funnel_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY archetype_id;

-- Viral coefficient
SELECT 
  archetype_id,
  COUNT(DISTINCT CASE WHEN event_type = 'invitation_sent' THEN session_id END) as inviters,
  COUNT(CASE WHEN event_type = 'invitation_sent' THEN 1 END) as invitations_sent,
  ROUND(
    COUNT(CASE WHEN event_type = 'invitation_sent' THEN 1 END)::numeric / 
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'cta_clicked' THEN session_id END), 0),
    2
  ) as invites_per_converter
FROM funnel_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY archetype_id;
*/
