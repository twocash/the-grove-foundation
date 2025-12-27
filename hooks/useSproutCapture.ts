// hooks/useSproutCapture.ts
// Sprint: Sprout System
// Hook for capturing LLM responses as sprouts with full provenance

import { useCallback } from 'react';
import { useSproutStorage } from './useSproutStorage';
import { telemetryCollector } from '../src/lib/telemetry';
import {
  Sprout,
  SproutCaptureOptions,
  SproutCaptureContext,
  SproutProvenance
} from '../src/core/schema/sprout';

/**
 * Hook for capturing LLM responses as sprouts
 *
 * Provides methods to capture responses with full provenance tracking
 * and flag/note parsing for the /sprout command.
 */
export function useSproutCapture() {
  const {
    addSprout,
    getSprouts,
    getSessionSprouts,
    sessionId
  } = useSproutStorage();

  /**
   * Capture a response as a sprout
   * @param context - The generation context (response, query, provenance)
   * @param options - Optional tags and notes
   * @returns The created Sprout or null if capture failed
   */
  const capture = useCallback((
    context: SproutCaptureContext,
    options: SproutCaptureOptions = {}
  ): Sprout | null => {
    // Validate required fields
    if (!context.response || !context.query) {
      console.warn('[Sprout] Cannot capture: missing response or query');
      return null;
    }

    const { provenance } = context;

    // Build sprout with full provenance
    const sprout: Sprout = {
      id: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),

      // Preserved content (VERBATIM)
      response: context.response,
      query: context.query,

      // Human-readable provenance (v2+)
      provenance,

      // Legacy fields (deprecated but kept for backward compatibility)
      personaId: provenance.lens?.id || null,
      journeyId: provenance.journey?.id || null,
      hubId: provenance.hub?.id || null,
      nodeId: provenance.node?.id || null,

      // Lifecycle
      status: 'sprout',
      tags: options.tags || [],
      notes: options.notes || null,

      // Attribution
      sessionId: sessionId,
      creatorId: null // Future: Grove ID
    };

    // Persist to storage
    const success = addSprout(sprout);

    if (success) {
      console.log('[Sprout] Captured:', {
        id: sprout.id.slice(0, 8),
        query: sprout.query.slice(0, 50),
        tags: sprout.tags,
        lens: provenance.lens?.name
      });
      // Track sprout capture for adaptive engagement telemetry
      telemetryCollector.update({ type: 'sprout' });
      return sprout;
    }

    return null;
  }, [addSprout, sessionId]);

  /**
   * Parse command flags from /sprout command arguments
   *
   * Supports:
   *   /sprout
   *   /sprout --tag=ratchet
   *   /sprout --tags=ratchet,infrastructure
   *   /sprout --tag=ratchet --note="Great explanation"
   *
   * @param args - Raw argument string after command
   * @returns Parsed options
   */
  const parseFlags = useCallback((args: string): SproutCaptureOptions => {
    const options: SproutCaptureOptions = {
      tags: [],
      notes: undefined
    };

    if (!args.trim()) return options;

    // Parse --tag=X or --tags=X,Y flags (can have multiple)
    const tagMatches = args.matchAll(/--tags?=([^\s"]+|"[^"]*")/g);
    for (const match of tagMatches) {
      const tagValue = match[1].replace(/"/g, '').trim();
      // Support comma-separated tags
      const tags = tagValue.split(',').map(t => t.trim()).filter(Boolean);
      options.tags!.push(...tags);
    }

    // Parse --note="X" or --notes="X" flag
    const noteMatch = args.match(/--notes?=("[^"]*"|[^\s]+)/);
    if (noteMatch) {
      options.notes = noteMatch[1].replace(/"/g, '').trim();
    }

    return options;
  }, []);

  return {
    capture,
    parseFlags,
    getSprouts,
    getSessionSprouts,
    sessionId
  };
}

export default useSproutCapture;
