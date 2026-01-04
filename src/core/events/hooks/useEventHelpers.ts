// src/core/events/hooks/useEventHelpers.ts
// Sprint: bedrock-event-hooks-v1

import { useCallback, useMemo } from 'react';
import { useGroveEvents } from './useGroveEvents';
import { useDispatch } from './useDispatch';
import type {
  SessionStartedEvent,
  SessionResumedEvent,
  LensActivatedEvent,
  QuerySubmittedEvent,
  ResponseCompletedEvent,
  ForkSelectedEvent,
  PivotTriggeredEvent,
  HubEnteredEvent,
  JourneyStartedEvent,
  JourneyAdvancedEvent,
  JourneyCompletedEvent,
  TopicExploredEvent,
  InsightCapturedEvent,
  MomentSurfacedEvent,
  MomentResolvedEvent,
} from '../types';

type LensSource = 'url' | 'selection' | 'system' | 'localStorage';
type HubSource = 'query' | 'pivot' | 'fork' | 'navigation';
type ForkType = 'deep_dive' | 'tangent' | 'related' | 'contrast';
type MomentSurface = 'inline' | 'modal' | 'toast' | 'panel';
type MomentResolution = 'actioned' | 'dismissed' | 'expired' | 'superseded';

/**
 * Typed helper methods for emitting Grove events.
 * Automatically populates base fields (fieldId, timestamp, sessionId).
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { emit } = useEventHelpers();
 *
 *   const handleLensSelect = (lensId: string) => {
 *     emit.lensActivated(lensId, 'selection', false);
 *   };
 *
 *   return <button onClick={() => handleLensSelect('engineer')}>Select</button>;
 * }
 * ```
 */
export function useEventHelpers() {
  const log = useGroveEvents();
  const dispatch = useDispatch();

  // Helper to create base fields
  const createBase = useCallback(() => ({
    fieldId: log.fieldId,
    timestamp: Date.now(),
    sessionId: log.currentSessionId,
  }), [log.fieldId, log.currentSessionId]);

  const emit = useMemo(() => ({
    // Session Events
    sessionStarted: (isReturning: boolean, previousSessionId?: string) => {
      const event: SessionStartedEvent = {
        ...createBase(),
        type: 'SESSION_STARTED',
        isReturning,
        ...(previousSessionId && { previousSessionId }),
      };
      dispatch(event);
    },

    sessionResumed: (previousSessionId: string, minutesSinceLastActivity: number) => {
      const event: SessionResumedEvent = {
        ...createBase(),
        type: 'SESSION_RESUMED',
        previousSessionId,
        minutesSinceLastActivity,
      };
      dispatch(event);
    },

    lensActivated: (lensId: string, source: LensSource, isCustom: boolean, archetypeId?: string) => {
      const event: LensActivatedEvent = {
        ...createBase(),
        type: 'LENS_ACTIVATED',
        lensId,
        source,
        isCustom,
        ...(archetypeId && { archetypeId }),
      };
      dispatch(event);
    },

    // Exploration Events
    querySubmitted: (
      queryId: string,
      content: string,
      intent?: string,
      sourceResponseId?: string
    ) => {
      const event: QuerySubmittedEvent = {
        ...createBase(),
        type: 'QUERY_SUBMITTED',
        queryId,
        content,
        ...(intent && { intent }),
        ...(sourceResponseId && { sourceResponseId }),
      };
      dispatch(event);
    },

    responseCompleted: (
      responseId: string,
      queryId: string,
      hasNavigation: boolean,
      spanCount: number,
      hubId?: string,
      nodeId?: string
    ) => {
      const event: ResponseCompletedEvent = {
        ...createBase(),
        type: 'RESPONSE_COMPLETED',
        responseId,
        queryId,
        hasNavigation,
        spanCount,
        ...(hubId && { hubId }),
        ...(nodeId && { nodeId }),
      };
      dispatch(event);
    },

    forkSelected: (
      forkId: string,
      forkType: ForkType,
      label: string,
      responseId: string
    ) => {
      const event: ForkSelectedEvent = {
        ...createBase(),
        type: 'FORK_SELECTED',
        forkId,
        forkType,
        label,
        responseId,
      };
      dispatch(event);
    },

    pivotTriggered: (conceptId: string, sourceText: string, responseId: string) => {
      const event: PivotTriggeredEvent = {
        ...createBase(),
        type: 'PIVOT_TRIGGERED',
        conceptId,
        sourceText,
        responseId,
      };
      dispatch(event);
    },

    hubEntered: (hubId: string, source: HubSource, queryTrigger?: string) => {
      const event: HubEnteredEvent = {
        ...createBase(),
        type: 'HUB_ENTERED',
        hubId,
        source,
        ...(queryTrigger && { queryTrigger }),
      };
      dispatch(event);
    },

    // Journey Events
    journeyStarted: (journeyId: string, lensId: string, waypointCount: number) => {
      const event: JourneyStartedEvent = {
        ...createBase(),
        type: 'JOURNEY_STARTED',
        journeyId,
        lensId,
        waypointCount,
      };
      dispatch(event);
    },

    journeyAdvanced: (journeyId: string, waypointId: string, position: number) => {
      const event: JourneyAdvancedEvent = {
        ...createBase(),
        type: 'JOURNEY_ADVANCED',
        journeyId,
        waypointId,
        position,
      };
      dispatch(event);
    },

    journeyCompleted: (
      journeyId: string,
      durationMs?: number,
      waypointsVisited?: number
    ) => {
      const event: JourneyCompletedEvent = {
        ...createBase(),
        type: 'JOURNEY_COMPLETED',
        journeyId,
        ...(durationMs !== undefined && { durationMs }),
        ...(waypointsVisited !== undefined && { waypointsVisited }),
      };
      dispatch(event);
    },

    // Cumulative Events
    topicExplored: (topicId: string, hubId: string, queryTrigger?: string) => {
      const event: TopicExploredEvent = {
        ...createBase(),
        type: 'TOPIC_EXPLORED',
        topicId,
        hubId,
        ...(queryTrigger && { queryTrigger }),
      };
      dispatch(event);
    },

    insightCaptured: (
      sproutId: string,
      journeyId?: string,
      hubId?: string,
      responseId?: string
    ) => {
      const event: InsightCapturedEvent = {
        ...createBase(),
        type: 'INSIGHT_CAPTURED',
        sproutId,
        ...(journeyId && { journeyId }),
        ...(hubId && { hubId }),
        ...(responseId && { responseId }),
      };
      dispatch(event);
    },

    // Moment Events
    momentSurfaced: (momentId: string, surface: MomentSurface, priority: number) => {
      const event: MomentSurfacedEvent = {
        ...createBase(),
        type: 'MOMENT_SURFACED',
        momentId,
        surface,
        priority,
      };
      dispatch(event);
    },

    momentResolved: (
      momentId: string,
      resolution: MomentResolution,
      actionId?: string,
      actionType?: string
    ) => {
      const event: MomentResolvedEvent = {
        ...createBase(),
        type: 'MOMENT_RESOLVED',
        momentId,
        resolution,
        ...(actionId && { actionId }),
        ...(actionType && { actionType }),
      };
      dispatch(event);
    },
  }), [createBase, dispatch]);

  return { emit };
}
