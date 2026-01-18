// hooks/useAttributionCapture.ts
// Attribution capture hook for knowledge economy integration
// Sprint: S11-SL-Attribution v1

import { useCallback, useState } from 'react';
import type { Sprout, SproutStage } from '../src/core/schema/sprout';
import type {
  AttributionEvent,
  TokenBalance,
  ReputationScore,
  NetworkInfluence,
  AttributionChain,
  ContentTierLevel
} from '../src/core/schema/attribution';
import type { QualityScore } from '../src/core/quality/schema';
import {
  createAttributionEvent,
  updateTokenBalance,
  updateReputationFromAttribution,
  updateNetworkInfluence,
  createAttributionChain,
  addEventToChain,
  createEmptyTokenBalance,
  createEmptyReputationScore,
  DEFAULT_CALCULATOR_CONFIG
} from '../src/core/engine/attributionCalculator';

// =============================================================================
// Local Storage Keys
// =============================================================================

const STORAGE_KEYS = {
  TOKEN_BALANCES: 'grove-token-balances',
  REPUTATION_SCORES: 'grove-reputation-scores',
  ATTRIBUTION_EVENTS: 'grove-attribution-events',
  NETWORK_INFLUENCE: 'grove-network-influence',
  ATTRIBUTION_CHAINS: 'grove-attribution-chains'
} as const;

// =============================================================================
// Types
// =============================================================================

export interface AttributionCaptureInput {
  sprout: Sprout;
  qualityScore?: QualityScore;  // From S10-SL-AICuration
  targetGroveId?: string;  // For cross-grove attribution (default: self)
}

export interface AttributionCaptureResult {
  event: AttributionEvent;
  updatedBalance: TokenBalance;
  updatedReputation: ReputationScore;
  chain?: AttributionChain;
}

export interface AttributionStorage {
  tokenBalances: Record<string, TokenBalance>;
  reputationScores: Record<string, ReputationScore>;
  attributionEvents: AttributionEvent[];
  networkInfluence: Record<string, NetworkInfluence>;
  attributionChains: Record<string, AttributionChain>;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Map sprout stage to content tier level
 * tender/rooting → Sprout (tier 1)
 * branching/hardened → Sapling (tier 2)
 * grafted/established → Tree (tier 3)
 */
function mapStageToTier(stage: SproutStage | undefined, status?: string): ContentTierLevel {
  // Use new stage system first
  if (stage) {
    switch (stage) {
      case 'tender':
      case 'rooting':
        return 1; // Sprout
      case 'branching':
      case 'hardened':
        return 2; // Sapling
      case 'grafted':
      case 'established':
      case 'dormant':
        return 3; // Tree
      case 'withered':
      default:
        return 1; // Default to sprout
    }
  }

  // Fallback to legacy status
  switch (status) {
    case 'sprout':
      return 1;
    case 'sapling':
      return 2;
    case 'tree':
      return 3;
    default:
      return 1;
  }
}

/**
 * Convert S10 quality score (0-1) to attribution quality score (0-100)
 */
function convertQualityScore(s10Score?: QualityScore): number {
  if (!s10Score) return 50; // Default to median
  // S10 composite score is 0-1, attribution uses 0-100
  return Math.round(s10Score.compositeScore * 100);
}

/**
 * Get default grove ID (session-based for now)
 */
function getDefaultGroveId(): string {
  // Use session ID as grove ID for now (future: real grove auth)
  const sessionId = localStorage.getItem('grove-session-id');
  if (sessionId) return sessionId;

  // Generate one if not exists
  const newId = crypto.randomUUID();
  localStorage.setItem('grove-session-id', newId);
  return newId;
}

// =============================================================================
// Storage Functions
// =============================================================================

function loadStorage(): AttributionStorage {
  try {
    return {
      tokenBalances: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOKEN_BALANCES) || '{}'),
      reputationScores: JSON.parse(localStorage.getItem(STORAGE_KEYS.REPUTATION_SCORES) || '{}'),
      attributionEvents: JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTRIBUTION_EVENTS) || '[]'),
      networkInfluence: JSON.parse(localStorage.getItem(STORAGE_KEYS.NETWORK_INFLUENCE) || '{}'),
      attributionChains: JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTRIBUTION_CHAINS) || '{}')
    };
  } catch (error) {
    console.error('[Attribution] Failed to load storage:', error);
    return {
      tokenBalances: {},
      reputationScores: {},
      attributionEvents: [],
      networkInfluence: {},
      attributionChains: {}
    };
  }
}

function saveStorage(storage: Partial<AttributionStorage>): void {
  try {
    if (storage.tokenBalances !== undefined) {
      localStorage.setItem(STORAGE_KEYS.TOKEN_BALANCES, JSON.stringify(storage.tokenBalances));
    }
    if (storage.reputationScores !== undefined) {
      localStorage.setItem(STORAGE_KEYS.REPUTATION_SCORES, JSON.stringify(storage.reputationScores));
    }
    if (storage.attributionEvents !== undefined) {
      localStorage.setItem(STORAGE_KEYS.ATTRIBUTION_EVENTS, JSON.stringify(storage.attributionEvents));
    }
    if (storage.networkInfluence !== undefined) {
      localStorage.setItem(STORAGE_KEYS.NETWORK_INFLUENCE, JSON.stringify(storage.networkInfluence));
    }
    if (storage.attributionChains !== undefined) {
      localStorage.setItem(STORAGE_KEYS.ATTRIBUTION_CHAINS, JSON.stringify(storage.attributionChains));
    }
  } catch (error) {
    console.error('[Attribution] Failed to save storage:', error);
  }
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for capturing attribution events from sprout creation
 *
 * Integrates with:
 * - Sprout capture (sprout → attribution event)
 * - S10 Quality scoring (quality score → multiplier)
 * - Token economy (tokens earned)
 * - Reputation system (tier progression)
 */
export function useAttributionCapture() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastEvent, setLastEvent] = useState<AttributionEvent | null>(null);

  /**
   * Capture attribution for a sprout
   */
  const captureAttribution = useCallback((
    input: AttributionCaptureInput
  ): AttributionCaptureResult | null => {
    const { sprout, qualityScore, targetGroveId } = input;

    setIsProcessing(true);

    try {
      const storage = loadStorage();

      // Determine grove IDs
      const sourceGroveId = getDefaultGroveId();
      const actualTargetGroveId = targetGroveId || sourceGroveId; // Self-contribution if not specified

      // Get tier level from sprout stage/status
      const tierLevel = mapStageToTier(sprout.stage, sprout.status);

      // Convert S10 quality score to 0-100 scale
      const qualityScoreValue = convertQualityScore(qualityScore);

      // Get existing reputation for the source grove
      let sourceReputation = storage.reputationScores[sourceGroveId];
      if (!sourceReputation) {
        sourceReputation = createEmptyReputationScore(sourceGroveId);
      }

      // Get existing network influence (if cross-grove)
      const influenceKey = `${sourceGroveId}:${actualTargetGroveId}`;
      const networkInfluence = storage.networkInfluence[influenceKey] || null;

      // Create the attribution event
      const event = createAttributionEvent({
        sourceGroveId,
        targetGroveId: actualTargetGroveId,
        contentId: sprout.id,
        tierLevel,
        qualityScore: qualityScoreValue,
        networkInfluence,
        sourceReputation
      }, DEFAULT_CALCULATOR_CONFIG);

      // Update token balance for source grove
      let tokenBalance = storage.tokenBalances[sourceGroveId];
      if (!tokenBalance) {
        tokenBalance = createEmptyTokenBalance(sourceGroveId);
      }
      const updatedBalance = updateTokenBalance(tokenBalance, event.finalTokens);

      // Update reputation for source grove
      const updatedReputation = updateReputationFromAttribution(
        sourceReputation,
        qualityScoreValue,
        event.attributionStrength
      );

      // Update network influence (if cross-grove)
      if (sourceGroveId !== actualTargetGroveId) {
        const updatedInfluence = updateNetworkInfluence(networkInfluence, event.finalTokens);
        updatedInfluence.sourceGroveId = sourceGroveId;
        updatedInfluence.targetGroveId = actualTargetGroveId;
        storage.networkInfluence[influenceKey] = updatedInfluence;
      }

      // Update or create attribution chain for the sprout content
      let chain = storage.attributionChains[sprout.id];
      if (!chain) {
        chain = createAttributionChain(sprout.id, event);
      } else {
        chain = addEventToChain(chain, event);
      }

      // Save all updates
      storage.tokenBalances[sourceGroveId] = updatedBalance;
      storage.reputationScores[sourceGroveId] = updatedReputation;
      storage.attributionEvents.push(event);
      storage.attributionChains[sprout.id] = chain;

      saveStorage(storage);

      // Update state
      setLastEvent(event);
      setIsProcessing(false);

      console.log('[Attribution] Captured:', {
        sproutId: sprout.id.slice(0, 8),
        tierLevel,
        qualityScore: qualityScoreValue,
        finalTokens: event.finalTokens,
        newBalance: updatedBalance.currentBalance,
        reputationTier: updatedReputation.currentTier
      });

      return {
        event,
        updatedBalance,
        updatedReputation,
        chain
      };
    } catch (error) {
      console.error('[Attribution] Capture failed:', error);
      setIsProcessing(false);
      return null;
    }
  }, []);

  /**
   * Get token balance for a grove
   */
  const getTokenBalance = useCallback((groveId?: string): TokenBalance => {
    const id = groveId || getDefaultGroveId();
    const storage = loadStorage();
    return storage.tokenBalances[id] || createEmptyTokenBalance(id);
  }, []);

  /**
   * Get reputation score for a grove
   */
  const getReputationScore = useCallback((groveId?: string): ReputationScore => {
    const id = groveId || getDefaultGroveId();
    const storage = loadStorage();
    return storage.reputationScores[id] || createEmptyReputationScore(id);
  }, []);

  /**
   * Get attribution events for a content ID
   */
  const getAttributionEvents = useCallback((contentId?: string): AttributionEvent[] => {
    const storage = loadStorage();
    if (!contentId) return storage.attributionEvents;
    return storage.attributionEvents.filter(e => e.contentId === contentId);
  }, []);

  /**
   * Get attribution chain for a content ID
   */
  const getAttributionChain = useCallback((contentId: string): AttributionChain | null => {
    const storage = loadStorage();
    return storage.attributionChains[contentId] || null;
  }, []);

  /**
   * Get current grove ID
   */
  const getCurrentGroveId = useCallback((): string => {
    return getDefaultGroveId();
  }, []);

  /**
   * Get all attribution data (for debugging/dashboard)
   */
  const getAttributionData = useCallback((): AttributionStorage => {
    return loadStorage();
  }, []);

  /**
   * Clear all attribution data (for testing/reset)
   */
  const clearAttributionData = useCallback((): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    setLastEvent(null);
    console.log('[Attribution] Data cleared');
  }, []);

  return {
    // Actions
    captureAttribution,
    clearAttributionData,

    // Queries
    getTokenBalance,
    getReputationScore,
    getAttributionEvents,
    getAttributionChain,
    getCurrentGroveId,
    getAttributionData,

    // State
    isProcessing,
    lastEvent
  };
}

export default useAttributionCapture;
