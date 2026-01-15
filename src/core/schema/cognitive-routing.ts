// src/core/schema/cognitive-routing.ts
// Sprint: S2-SFR-Display - US-B002 Cognitive Routing Schema
// 4D Experience Model: Cognitive Routing

import type { SproutProvenance } from './sprout';

/**
 * CognitiveRouting - 4D Experience Model
 *
 * Replaces deprecated Hub/Journey/Node provenance model with
 * a more intuitive path/prompt/inspiration structure.
 */
export interface CognitiveRouting {
  /** Experience path (e.g., "deep-dive → cost-dynamics") */
  path: string;

  /** Active prompt mode (e.g., "Analytical research mode") */
  prompt: string;

  /** Triggering context (e.g., "User query on ownership models") */
  inspiration: string;

  /** Optional cognitive domain */
  domain?: string;
}

/**
 * Build CognitiveRouting from legacy SproutProvenance
 *
 * Bridges old Hub/Journey/Node to new 4D model.
 * This adapter allows gradual migration from legacy provenance.
 */
export function buildCognitiveRouting(
  provenance: SproutProvenance | undefined
): CognitiveRouting {
  if (!provenance) {
    return {
      path: 'default',
      prompt: 'Standard exploration',
      inspiration: 'User query',
    };
  }

  // Map legacy fields to 4D model
  const pathParts = [
    provenance.journey?.name,
    provenance.node?.name,
  ].filter(Boolean);

  return {
    path: pathParts.length > 0 ? pathParts.join(' → ') : 'direct',
    prompt: provenance.lens?.name || 'Default lens',
    inspiration: 'User query',
    domain: provenance.hub?.name,
  };
}
