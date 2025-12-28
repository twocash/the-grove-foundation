// src/core/journey/service.ts
// Sprint: journey-schema-unification-v1
// Unified journey lookup that always returns canonical Journey type

import type { Journey } from '../schema/journey';
import { getJourneyById } from '../../data/journeys';
import { adaptLegacyJourney } from '../schema/journey-adapter';

/**
 * Schema type for NarrativeEngine data.
 * Used only for adapter fallback.
 */
interface NarrativeSchema {
  journeys?: Record<string, any>;
  nodes?: Record<string, any>;
}

/**
 * Unified journey lookup that always returns canonical Journey type.
 *
 * Priority:
 * 1. TypeScript registry (has waypoints, preferred)
 * 2. NarrativeEngine schema (adapted to canonical)
 *
 * @param id - Journey ID
 * @param schema - Optional NarrativeEngine schema for fallback
 * @returns Canonical Journey or null
 */
export function getCanonicalJourney(
  id: string,
  schema?: NarrativeSchema | null
): Journey | null {
  // 1. Try TypeScript registry first (always has waypoints)
  const registryJourney = getJourneyById(id);
  if (registryJourney) {
    console.log(`[JourneyService] Found in registry: ${id}`);
    return registryJourney;
  }

  // 2. Fallback to schema with adaptation
  if (schema?.journeys?.[id]) {
    const legacyJourney = schema.journeys[id];
    const nodes = Object.values(schema.nodes ?? {}) as any[];
    const adapted = adaptLegacyJourney(legacyJourney, nodes);
    if (adapted) {
      console.log(`[JourneyService] Adapted legacy journey: ${id}`);
      return adapted;
    }
  }

  console.warn(`[JourneyService] Journey not found: ${id}`);
  return null;
}
