// src/core/schema/journey-adapter.ts
// Sprint: journey-schema-unification-v1
// Adapts legacy NarrativeEngine journeys to canonical format

import type { Journey, JourneyWaypoint } from './journey';

// Legacy types from NarrativeEngine schema
interface LegacyJourney {
  id: string;
  title: string;
  description: string;
  entryNode: string;
  targetAha: string;
  linkedHubId?: string;
  estimatedMinutes: number;
  icon?: string;
  color?: string;
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface JourneyNode {
  id: string;
  label: string;
  query: string;
  contextSnippet?: string;
  sectionId?: string;
  journeyId: string;
  sequenceOrder?: number;
  primaryNext?: string;
  alternateNext?: string[];
}

/**
 * Adapts a legacy NarrativeEngine journey to canonical format.
 *
 * Legacy journeys have entryNode + separate JourneyNode[].
 * Canonical journeys have embedded waypoints[].
 *
 * @param legacy - Legacy journey from NarrativeEngine schema
 * @param nodes - All nodes from schema (will be filtered by journeyId)
 * @returns Canonical Journey with waypoints, or null if adaptation fails
 */
export function adaptLegacyJourney(
  legacy: LegacyJourney,
  nodes: JourneyNode[]
): Journey | null {
  // Filter and sort nodes for this journey
  const journeyNodes = nodes
    .filter(n => n.journeyId === legacy.id)
    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

  if (journeyNodes.length === 0) {
    console.warn(`[JourneyAdapter] No nodes found for journey: ${legacy.id}`);
    return null;
  }

  // Convert nodes to waypoints
  const waypoints: JourneyWaypoint[] = journeyNodes.map(node => ({
    id: node.id,
    title: node.label,
    prompt: node.query,
    hub: node.sectionId,
  }));

  return {
    id: legacy.id,
    title: legacy.title,
    description: legacy.description,
    estimatedTime: legacy.estimatedMinutes ? `${legacy.estimatedMinutes} minutes` : undefined,
    waypoints,
    completionMessage: legacy.targetAha ?? 'Journey complete.',
    lensAffinity: undefined,
    lensExclude: undefined,
    nextJourneys: undefined,
    allowImplicitEntry: false,
    ambientTracking: false,
  };
}
