// hooks/useSproutCapture.ts
// Sprint: Sprout System
// Sprint: kinetic-cultivation-v1 - Uses XState for telemetry
// Sprint: S11-SL-Attribution v1 - Knowledge economy integration
// Hook for capturing LLM responses as sprouts with full provenance

import { useCallback } from 'react';
import { useSproutStorage } from './useSproutStorage';
import { useEngagement } from '../src/core/engagement/context';
import { useAttributionCapture, type AttributionCaptureResult } from './useAttributionCapture';
import type { QualityScore } from '../src/core/quality/schema';
import {
  Sprout,
  SproutCaptureOptions,
  SproutCaptureContext,
  SproutProvenance,
  SproutStage
} from '../src/core/schema/sprout';

/**
 * Extended capture options including quality score from S10
 */
export interface ExtendedSproutCaptureOptions extends SproutCaptureOptions {
  /** Quality score from S10-SL-AICuration (optional) */
  qualityScore?: QualityScore;
  /** Target grove ID for cross-grove attribution (optional) */
  targetGroveId?: string;
  /** Skip attribution capture (for imports/migrations) */
  skipAttribution?: boolean;
}

/**
 * Extended capture result including attribution data
 */
export interface SproutCaptureResult {
  sprout: Sprout;
  attribution?: AttributionCaptureResult;
}

/**
 * Hook for capturing LLM responses as sprouts
 *
 * Provides methods to capture responses with full provenance tracking
 * and flag/note parsing for the /sprout command.
 *
 * Sprint: S11-SL-Attribution v1 - Now integrates with knowledge economy
 */
export function useSproutCapture() {
  const {
    addSprout,
    getSprouts,
    getSessionSprouts,
    sessionId
  } = useSproutStorage();
  const { actor } = useEngagement();
  const { captureAttribution, getTokenBalance, getReputationScore } = useAttributionCapture();

  /**
   * Capture a response as a sprout with attribution
   * @param context - The generation context (response, query, provenance)
   * @param options - Optional tags, notes, and attribution settings
   * @returns The created Sprout with attribution data, or null if capture failed
   *
   * Sprint: S11-SL-Attribution v1 - Now returns attribution result
   */
  const capture = useCallback((
    context: SproutCaptureContext,
    options: ExtendedSproutCaptureOptions = {}
  ): SproutCaptureResult | null => {
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
      stage: 'tender',  // New sprouts start at 'tender' stage
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
      // Sprint: kinetic-cultivation-v1 - Track sprout capture via XState
      actor.send({
        type: 'SPROUT_CAPTURED',
        sproutId: sprout.id,
        journeyId: provenance.journey?.id,
        hubId: provenance.hub?.id
      });

      // Sprint: S11-SL-Attribution v1 - Capture attribution for knowledge economy
      let attributionResult: AttributionCaptureResult | undefined;
      if (!options.skipAttribution) {
        const result = captureAttribution({
          sprout,
          qualityScore: options.qualityScore,
          targetGroveId: options.targetGroveId
        });
        if (result) {
          attributionResult = result;
          console.log('[Sprout] Attribution captured:', {
            tokens: result.event.finalTokens,
            tier: result.updatedReputation.currentTier,
            balance: result.updatedBalance.currentBalance
          });
        }
      }

      return { sprout, attribution: attributionResult };
    }

    return null;
  }, [addSprout, sessionId, actor, captureAttribution]);

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
    // Sprout capture
    capture,
    parseFlags,
    getSprouts,
    getSessionSprouts,
    sessionId,

    // Attribution (S11-SL-Attribution v1)
    getTokenBalance,
    getReputationScore
  };
}

export default useSproutCapture;
