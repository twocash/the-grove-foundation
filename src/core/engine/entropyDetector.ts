// src/core/engine/entropyDetector.ts
// Entropy detection for Cognitive Bridge - measures conversation complexity
// to determine when to offer structured journeys

import { TopicHub } from '../schema';

// ============================================================================
// TYPES
// ============================================================================

export interface EntropyResult {
  score: number;
  classification: 'low' | 'medium' | 'high';
  matchedTags: string[];
  dominantCluster: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface EntropyState {
  lastScore: number;
  lastClassification: 'low' | 'medium' | 'high';
  injectionCount: number;
  cooldownRemaining: number;  // Exchanges until next injection allowed
  lastInjectionExchange: number;  // Exchange count when last injection occurred
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Depth markers indicate sophisticated inquiry
const DEPTH_MARKERS = [
  'exactly', 'specifically', 'underlying', 'mechanism', 'why does',
  'how does', 'what happens when', 'implications', 'game-theoretic',
  'attack surface', 'failure mode', 'edge case', 'trade-off', 'tradeoff',
  'limitation', 'constraint', 'assumption', 'depends on', 'what if'
];

// Reference chaining indicates building on prior context
const REFERENCE_PHRASES = [
  'you mentioned', 'you said', 'earlier', 'that point', 'the part about',
  'going back to', 'related to what', 'building on', 'following up',
  'as you noted', 'regarding what'
];

// Topic clusters map to structured journeys
// V2.1: Aligned with hub tags from narratives.json
export const TOPIC_CLUSTERS: Record<string, string[]> = {
  'ratchet': [
    // ratchet-effect hub tags + expanded vocabulary
    'doubling', 'ratchet', 'frontier', '21 months', '7 months', 'capability',
    'metr', 'propagation', 'edge', 'local model', 'catching up', 'lag'
  ],
  'economics': [
    // infrastructure-bet hub tags + expanded vocabulary
    '$380', 'billion', 'capex', 'rent', 'ownership', 'efficiency tax',
    'credits', 'enlightenment', 'incentives', 'cloud costs', 'sink',
    'genesis', 'maturity', 'floor', 'tax rate', 'hyperscaler', 'datacenter'
  ],
  'architecture': [
    // Technical architecture concepts
    'hybrid', 'split', 'local model', 'cloud', 'pivotal', 'routine', 'cognitive',
    'hum', 'breakthrough', 'routing', 'tier', 'village', 'crdt', 'nats', 'distributed'
  ],
  'knowledge-commons': [
    // Knowledge commons and governance concepts
    'publishing', 'attribution', 'validation', 'innovation', 'propagation',
    'commons', 'network', 'sharing', 'collective', 'civilization', 'governance'
  ],
  'observer': [
    // meta-philosophy hub tags + expanded vocabulary
    'meta', 'architecture', 'simulation', 'observer', 'terminal', 'cosmology',
    'diary', 'agents', 'village', 'gardener', 'watching', 'asymmetric',
    'theology', 'recursive', 'already here', 'inside'
  ]
};

// Cluster to journey mapping
// V2.1: Maps to actual journey IDs in narratives.json
export const CLUSTER_JOURNEY_MAP: Record<string, string> = {
  'ratchet': 'ratchet',           // → linkedHubId: 'ratchet-effect'
  'economics': 'stakes',          // → linkedHubId: 'infrastructure-bet'
  'architecture': 'stakes',       // Technical architecture relates to stakes journey
  'knowledge-commons': 'stakes',  // Knowledge commons relates to stakes journey
  'observer': 'simulation'        // → linkedHubId: 'meta-philosophy'
};

// Scoring thresholds
export const ENTROPY_THRESHOLDS = {
  LOW: 30,      // Below this: stay in freestyle ('low' classification)
  MEDIUM: 60,   // At or above this: 'high' classification
  // Note: 30-59 = 'medium' classification - triggers injection
};

// Cooldown and limits
export const ENTROPY_LIMITS = {
  MAX_INJECTIONS_PER_SESSION: 2,
  COOLDOWN_EXCHANGES: 5,
};

// Default entropy state
export const DEFAULT_ENTROPY_STATE: EntropyState = {
  lastScore: 0,
  lastClassification: 'low',
  injectionCount: 0,
  cooldownRemaining: 0,
  lastInjectionExchange: 0,
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate entropy score for a message in context
 *
 * Scoring breakdown:
 * - +30: exchangeCount >= 3 (depth threshold)
 * - +15: each TopicHub tag match (technical vocabulary)
 * - +20: depth marker present (sophisticated inquiry)
 * - +25: reference chaining (building on context)
 */
export function calculateEntropy(
  message: string,
  history: ChatMessage[],
  topicHubs: TopicHub[],
  exchangeCount: number
): EntropyResult {
  let score = 0;
  const matchedTags: string[] = [];
  const messageLower = message.toLowerCase();

  // 1. Exchange depth bonus (+30 if >= 3 exchanges)
  if (exchangeCount >= 3) {
    score += 30;
  }

  // 2. Technical vocabulary from TopicHubs (+15 per match, capped at 3)
  // V2.1 hubs use `status: 'active'`, legacy hubs use `enabled: true`
  let tagMatches = 0;
  for (const hub of topicHubs) {
    // Skip disabled hubs: V2.1 uses status, legacy uses enabled
    const isEnabled = hub.enabled !== false && (!('status' in hub) || (hub as { status?: string }).status === 'active');
    if (!isEnabled) continue;
    for (const tag of hub.tags) {
      if (tagMatches >= 3) break; // Cap at 3 matches to prevent runaway scores
      const tagLower = tag.toLowerCase();
      if (messageLower.includes(tagLower) && !matchedTags.includes(tag)) {
        matchedTags.push(tag);
        score += 15;
        tagMatches++;
      }
    }
  }

  // 3. Depth markers (+20 if any present)
  const hasDepthMarker = DEPTH_MARKERS.some(marker =>
    messageLower.includes(marker)
  );
  if (hasDepthMarker) {
    score += 20;
  }

  // 4. Reference chaining (+25 if references previous content)
  const hasReference = REFERENCE_PHRASES.some(phrase =>
    messageLower.includes(phrase)
  );
  if (hasReference) {
    score += 25;
  }

  // 5. Identify dominant cluster from full conversation
  const fullConversation = history
    .map(m => m.text)
    .join(' ')
    .toLowerCase() + ' ' + messageLower;

  const clusterScores: Record<string, number> = {};
  for (const [cluster, terms] of Object.entries(TOPIC_CLUSTERS)) {
    clusterScores[cluster] = terms.filter(term =>
      fullConversation.includes(term)
    ).length;
  }

  // Find cluster with most matches
  const dominantCluster = Object.entries(clusterScores)
    .sort(([, a], [, b]) => b - a)
    .find(([, count]) => count > 0)?.[0] || null;

  // 6. Classify based on thresholds
  const classification: 'low' | 'medium' | 'high' =
    score >= ENTROPY_THRESHOLDS.MEDIUM ? 'high' :
    score >= ENTROPY_THRESHOLDS.LOW ? 'medium' : 'low';

  return {
    score,
    classification,
    matchedTags,
    dominantCluster
  };
}

/**
 * Determine if an injection should occur
 *
 * Conditions:
 * - Entropy classification is 'high'
 * - Cooldown is not active
 * - Haven't exceeded max injections per session
 * - There's a dominant cluster to route to
 */
export function shouldInject(
  entropy: EntropyResult,
  state: EntropyState
): boolean {
  // Verbose logging for debugging
  console.log('[Entropy shouldInject] Checking conditions:', {
    score: entropy.score,
    classification: entropy.classification,
    dominantCluster: entropy.dominantCluster,
    cooldownRemaining: state.cooldownRemaining,
    injectionCount: state.injectionCount,
    maxInjections: ENTROPY_LIMITS.MAX_INJECTIONS_PER_SESSION
  });

  // Check cooldown
  if (state.cooldownRemaining > 0) {
    console.log('[Entropy shouldInject] BLOCKED: Cooldown active', state.cooldownRemaining);
    return false;
  }

  // Check max injections
  if (state.injectionCount >= ENTROPY_LIMITS.MAX_INJECTIONS_PER_SESSION) {
    console.log('[Entropy shouldInject] BLOCKED: Max injections reached', state.injectionCount);
    return false;
  }

  // Check classification - trigger on 'medium' or 'high'
  // (MEDIUM threshold = 60 indicates readiness for guided journey)
  if (entropy.classification === 'low') {
    console.log('[Entropy shouldInject] BLOCKED: Classification is low', entropy.classification);
    return false;
  }

  // Need a dominant cluster to route to a journey
  if (!entropy.dominantCluster) {
    console.log('[Entropy shouldInject] BLOCKED: No dominant cluster');
    return false;
  }

  console.log('[Entropy shouldInject] APPROVED: All conditions met');
  return true;
}

/**
 * Get journey ID for a cluster
 */
export function getJourneyForCluster(cluster: string): string | null {
  return CLUSTER_JOURNEY_MAP[cluster] || null;
}

/**
 * Update entropy state after an exchange
 */
export function updateEntropyState(
  currentState: EntropyState,
  entropy: EntropyResult,
  didInject: boolean,
  currentExchangeCount: number
): EntropyState {
  const newState: EntropyState = {
    ...currentState,
    lastScore: entropy.score,
    lastClassification: entropy.classification,
    // Decrement cooldown if active
    cooldownRemaining: Math.max(0, currentState.cooldownRemaining - 1),
  };

  if (didInject) {
    newState.injectionCount = currentState.injectionCount + 1;
    newState.cooldownRemaining = ENTROPY_LIMITS.COOLDOWN_EXCHANGES;
    newState.lastInjectionExchange = currentExchangeCount;
  }

  return newState;
}

/**
 * Update entropy state after user dismisses the bridge
 */
export function dismissEntropy(
  currentState: EntropyState,
  currentExchangeCount: number
): EntropyState {
  return {
    ...currentState,
    cooldownRemaining: ENTROPY_LIMITS.COOLDOWN_EXCHANGES,
    lastInjectionExchange: currentExchangeCount,
  };
}

export default calculateEntropy;
