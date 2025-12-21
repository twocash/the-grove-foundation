// useSproutCapture.ts - Hook Sketch
// Sprint: Sprout System
// Purpose: Capture LLM responses as sprouts with full provenance

import { useCallback } from 'react';
import { useSproutStorage } from './useSproutStorage';
import { Sprout } from '../src/core/schema/sprout';

interface CaptureOptions {
  tags?: string[];
  notes?: string;
}

interface CaptureContext {
  response: string;
  query: string;
  personaId: string | null;
  journeyId: string | null;
  hubId: string | null;
  nodeId: string | null;
}

export function useSproutCapture() {
  const { addSprout, getSprouts, getSessionSprouts, sessionId } = useSproutStorage();

  /**
   * Capture a response as a sprout
   * @param context - The generation context (response, query, persona, etc.)
   * @param options - Optional tags and notes
   * @returns The created Sprout or null if capture failed
   */
  const capture = useCallback((
    context: CaptureContext,
    options: CaptureOptions = {}
  ): Sprout | null => {
    // Validate required fields
    if (!context.response || !context.query) {
      console.warn('[Sprout] Cannot capture: missing response or query');
      return null;
    }

    // Build sprout with full provenance
    const sprout: Sprout = {
      id: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),
      
      // Preserved content (VERBATIM)
      response: context.response,
      query: context.query,
      
      // Generation context (provenance)
      personaId: context.personaId,
      journeyId: context.journeyId,
      hubId: context.hubId,
      nodeId: context.nodeId,
      
      // Lifecycle
      status: 'sprout',
      tags: options.tags || [],
      notes: options.notes || null,
      
      // Attribution
      sessionId: sessionId,
      creatorId: null, // Future: Grove ID
    };

    // Persist to storage
    const success = addSprout(sprout);
    
    if (success) {
      console.log('[Sprout] Captured:', {
        id: sprout.id.slice(0, 8),
        query: sprout.query.slice(0, 50),
        tags: sprout.tags
      });
      return sprout;
    }

    return null;
  }, [addSprout, sessionId]);

  /**
   * Parse command flags from /sprout command
   * Example: /sprout --tag=ratchet --note="Great explanation"
   */
  const parseFlags = useCallback((args: string): CaptureOptions => {
    const options: CaptureOptions = {
      tags: [],
      notes: undefined
    };

    // Parse --tag=X flags (can have multiple)
    const tagMatches = args.matchAll(/--tag[s]?=([^\s"]+|"[^"]*")/g);
    for (const match of tagMatches) {
      const tag = match[1].replace(/"/g, '').trim();
      if (tag) options.tags!.push(tag);
    }

    // Parse --note="X" flag
    const noteMatch = args.match(/--note[s]?=("[^"]*"|[^\s]+)/);
    if (noteMatch) {
      options.notes = noteMatch[1].replace(/"/g, '').trim();
    }

    return options;
  }, []);

  return {
    capture,
    parseFlags,
    getSprouts,
    getSessionSprouts
  };
}

export default useSproutCapture;
