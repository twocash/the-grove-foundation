// src/surface/hooks/useMomentStream.ts
// Bridge between Moment system and Stream rendering
// Sprint: moment-ui-integration-v1

import { useState, useCallback, useEffect, useRef } from 'react';
import type { MomentStreamItem, MomentStreamStatus } from '@core/schema/stream';
import type { Moment } from '@core/schema/moment';
import { useMoments } from './useMoments';

export interface UseMomentStreamOptions {
  /** Callback when a navigate action is triggered */
  onNavigate?: (target: string) => void;
}

export interface UseMomentStreamReturn {
  /** Stream items derived from inline moments */
  momentItems: MomentStreamItem[];
  /** Handle action on a moment (updates status and executes action) */
  handleMomentAction: (momentId: string, actionId: string) => void;
  /** Handle dismiss on a moment */
  handleMomentDismiss: (momentId: string) => void;
}

/**
 * Hook that bridges the Moment system to Stream rendering.
 *
 * - Watches for eligible inline moments via useMoments
 * - Tracks which moments have been injected (to avoid duplicates)
 * - Converts moments to MomentStreamItem for rendering
 * - Handles action/dismiss to update item status
 */
export function useMomentStream(options: UseMomentStreamOptions = {}): UseMomentStreamReturn {
  const { onNavigate } = options;
  const { moments, executeAction, dismissMoment } = useMoments({ surface: 'inline' });

  // Track injected moment IDs to avoid duplicates
  const injectedRef = useRef<Set<string>>(new Set());

  // Track moment stream items with their status
  const [momentItems, setMomentItems] = useState<MomentStreamItem[]>([]);

  // When new moments become eligible, add them to the stream
  useEffect(() => {
    const newItems: MomentStreamItem[] = [];

    for (const moment of moments) {
      const momentId = moment.meta.id;

      // Skip if already injected
      if (injectedRef.current.has(momentId)) {
        continue;
      }

      // Mark as injected
      injectedRef.current.add(momentId);

      // Convert to stream item
      const streamItem = momentToStreamItem(moment);
      newItems.push(streamItem);
    }

    if (newItems.length > 0) {
      setMomentItems(prev => [...prev, ...newItems]);
      console.log('[MomentStream] Injected moments:', newItems.map(i => i.momentId));
    }
  }, [moments]);

  // Handle action execution
  const handleMomentAction = useCallback((momentId: string, actionId: string) => {
    // Execute the action via useMoments - returns the action that was executed
    const action = executeAction(momentId, actionId);

    // Handle navigate actions
    if (action?.type === 'navigate' && action.target && onNavigate) {
      console.log('[MomentStream] Triggering navigation:', action.target);
      onNavigate(action.target);
    }

    // Update stream item status
    setMomentItems(prev => prev.map(item => {
      if (item.momentId === momentId) {
        return { ...item, status: 'actioned' as MomentStreamStatus };
      }
      return item;
    }));
  }, [executeAction, onNavigate]);

  // Handle dismiss
  const handleMomentDismiss = useCallback((momentId: string) => {
    // Dismiss via useMoments
    dismissMoment(momentId);

    // Update stream item status
    setMomentItems(prev => prev.map(item => {
      if (item.momentId === momentId) {
        return { ...item, status: 'dismissed' as MomentStreamStatus };
      }
      return item;
    }));
  }, [dismissMoment]);

  return {
    momentItems,
    handleMomentAction,
    handleMomentDismiss
  };
}

/**
 * Convert a Moment to a MomentStreamItem
 */
function momentToStreamItem(moment: Moment): MomentStreamItem {
  return {
    id: `moment-stream-${moment.meta.id}-${Date.now()}`,
    type: 'moment',
    timestamp: Date.now(),
    momentId: moment.meta.id,
    momentTitle: moment.meta.title,
    content: {
      heading: moment.payload.content.heading,
      body: moment.payload.content.body,
      icon: moment.payload.content.icon
    },
    actions: moment.payload.actions.map(action => ({
      id: action.id,
      label: action.label,
      type: action.type,
      variant: action.variant,
      journeyId: action.journeyId,
      lensId: action.lensId
    })),
    status: 'pending'
  };
}
