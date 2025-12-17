// src/core/engine/topicRouter.ts
// Topic routing logic - no React dependencies

import { TopicHub } from '../schema';
import { CLUSTER_JOURNEY_MAP } from './entropyDetector';

// ============================================================================
// TYPES
// ============================================================================

export interface TopicMatchResult {
  hub: TopicHub;
  score: number;
  matchedTags: string[];
}

// ============================================================================
// TOPIC ROUTER ENGINE
// ============================================================================

/**
 * Score a query against a topic hub's tags
 * Multi-word tag matches score higher than single-word matches
 */
function scoreHubMatch(query: string, hub: TopicHub): TopicMatchResult | null {
  if (!hub.enabled) return null;

  const queryLower = query.toLowerCase();
  const matchedTags: string[] = [];
  let score = 0;

  for (const tag of hub.tags) {
    const tagLower = tag.toLowerCase();

    if (queryLower.includes(tagLower)) {
      matchedTags.push(tag);

      // Multi-word tags score higher (more specific)
      const wordCount = tag.split(' ').length;
      score += wordCount * 2;

      // Exact phrase matches get bonus
      if (queryLower === tagLower) {
        score += 5;
      }
    }
  }

  if (matchedTags.length === 0) return null;

  // Apply hub priority multiplier
  score = score * (hub.priority / 5);

  return { hub, score, matchedTags };
}

/**
 * Find the best matching topic hub for a query
 * Returns null if no hub matches the query
 */
export function routeToHub(query: string, hubs: TopicHub[]): TopicHub | null {
  const matches = hubs
    .map(hub => scoreHubMatch(query, hub))
    .filter((result): result is TopicMatchResult => result !== null)
    .sort((a, b) => b.score - a.score);

  return matches.length > 0 ? matches[0].hub : null;
}

/**
 * Get detailed match info for debugging/testing
 */
export function getMatchDetails(query: string, hubs: TopicHub[]): TopicMatchResult[] {
  return hubs
    .map(hub => scoreHubMatch(query, hub))
    .filter((result): result is TopicMatchResult => result !== null)
    .sort((a, b) => b.score - a.score);
}

/**
 * Build enhanced system prompt when a topic hub matches
 * Injects expert framing and key points into the prompt
 */
export function buildHubEnhancedPrompt(
  basePrompt: string,
  hub: TopicHub,
  personaId?: string
): string {
  const parts: string[] = [];

  // Add expert framing
  parts.push(`[TOPIC FOCUS: ${hub.title}]`);
  parts.push(hub.expertFraming);

  // Add persona-specific override if available
  if (personaId && hub.personaOverrides?.[personaId]) {
    parts.push(`[PERSONA-SPECIFIC FRAMING]`);
    parts.push(hub.personaOverrides[personaId]);
  }

  // Add key points guidance
  if (hub.keyPoints.length > 0) {
    parts.push('[KEY POINTS TO ADDRESS]');
    hub.keyPoints.forEach((point, i) => {
      parts.push(`${i + 1}. ${point}`);
    });
  }

  // Add common misconceptions if any
  if (hub.commonMisconceptions && hub.commonMisconceptions.length > 0) {
    parts.push('[COMMON MISCONCEPTIONS TO ADDRESS]');
    hub.commonMisconceptions.forEach(misconception => {
      parts.push(`- ${misconception}`);
    });
  }

  return `${basePrompt}\n\n${parts.join('\n')}`;
}

/**
 * Test if a query would match any hub (for admin testing)
 */
export function testQueryMatch(query: string, hubs: TopicHub[]): {
  matched: boolean;
  hub: TopicHub | null;
  score: number;
  matchedTags: string[];
} {
  const matches = getMatchDetails(query, hubs);

  if (matches.length === 0) {
    return { matched: false, hub: null, score: 0, matchedTags: [] };
  }

  const best = matches[0];
  return {
    matched: true,
    hub: best.hub,
    score: best.score,
    matchedTags: best.matchedTags
  };
}

/**
 * Route a query to a journey ID via topic hub matching
 * Returns the journey ID if a matching cluster is found, null otherwise
 */
export function routeToJourney(
  query: string,
  hubs: TopicHub[]
): { journeyId: string; hubId: string; hubTitle: string } | null {
  const hub = routeToHub(query, hubs);
  if (!hub) return null;

  // Map hub ID to cluster key
  // Hub IDs like 'ratchet-effect' map to cluster 'ratchet'
  const clusterKey = hub.id.split('-')[0];
  const journeyId = CLUSTER_JOURNEY_MAP[clusterKey];

  if (!journeyId) return null;

  return {
    journeyId,
    hubId: hub.id,
    hubTitle: hub.title
  };
}

export default routeToHub;
