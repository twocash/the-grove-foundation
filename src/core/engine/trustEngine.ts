// src/core/engine/trustEngine.ts
// Trust Engine - S9-SL-Federation-v1
// Handles trust score calculation and trust relationship management

import type {
  TrustLevel,
  TrustComponents,
  TrustRelationshipPayload,
  FederatedGrovePayload,
  FederationExchangePayload,
  ExchangeStatus
} from '../schema/federation';

import {
  TRUST_THRESHOLDS,
  TRUST_LEVEL_CONFIGS,
  getTrustLevel as schemaGetTrustLevel,
  getTrustMultiplier as schemaGetTrustMultiplier,
  calculateTrustScore as schemaCalculateTrustScore,
  orderGroveIds
} from '../schema/federation';

/**
 * Trust history entry for tracking changes over time.
 */
export interface TrustHistoryEntry {
  timestamp: string;
  previousScore: number;
  newScore: number;
  previousLevel: TrustLevel;
  newLevel: TrustLevel;
  reason: string;
  exchangeId?: string;
}

/**
 * Exchange outcome types for trust updates.
 */
export type ExchangeOutcome = 'success' | 'failure' | 'partial' | 'timeout';

/**
 * Trust update result.
 */
export interface TrustUpdateResult {
  previousScore: number;
  newScore: number;
  previousLevel: TrustLevel;
  newLevel: TrustLevel;
  components: TrustComponents;
  levelChanged: boolean;
}

/**
 * Weights for trust component calculation.
 */
const COMPONENT_WEIGHTS = {
  exchangeSuccess: 0.35,
  tierAccuracy: 0.25,
  responseTime: 0.15,
  contentQuality: 0.25
};

/**
 * Score adjustments for exchange outcomes.
 */
const OUTCOME_ADJUSTMENTS = {
  success: { exchangeSuccess: 5, contentQuality: 3 },
  failure: { exchangeSuccess: -10, contentQuality: -5 },
  partial: { exchangeSuccess: 0, contentQuality: -2 },
  timeout: { exchangeSuccess: -5, contentQuality: 0 }
};

/**
 * TrustEngine - Core engine for trust operations.
 */
export class TrustEngine {
  private trustHistory: Map<string, TrustHistoryEntry[]> = new Map();

  /**
   * Calculate overall trust score from components.
   */
  calculateTrustScore(components: TrustComponents): number {
    return schemaCalculateTrustScore(components);
  }

  /**
   * Get trust level from score.
   */
  getTrustLevel(score: number): TrustLevel {
    return schemaGetTrustLevel(score);
  }

  /**
   * Get trust multiplier for exchange value calculation.
   */
  getTrustMultiplier(level: TrustLevel): number {
    return schemaGetTrustMultiplier(level);
  }

  /**
   * Get trust level configuration.
   */
  getTrustLevelConfig(level: TrustLevel) {
    return TRUST_LEVEL_CONFIGS[level];
  }

  /**
   * Calculate initial trust components for a new relationship.
   */
  getInitialTrustComponents(): TrustComponents {
    return {
      exchangeSuccess: 50,  // Neutral starting point
      tierAccuracy: 50,     // Unknown accuracy
      responseTime: 50,     // Unknown response time
      contentQuality: 50    // Unknown quality
    };
  }

  /**
   * Create initial trust relationship between two groves.
   */
  createInitialRelationship(
    groveId1: string,
    groveId2: string
  ): TrustRelationshipPayload {
    const orderedIds = orderGroveIds(groveId1, groveId2);
    const components = this.getInitialTrustComponents();
    const score = this.calculateTrustScore(components);

    return {
      groveIds: orderedIds,
      overallScore: score,
      components,
      exchangeCount: 0,
      successfulExchanges: 0,
      level: this.getTrustLevel(score)
    };
  }

  /**
   * Update trust based on exchange outcome.
   */
  updateTrustFromExchange(
    relationship: TrustRelationshipPayload,
    outcome: ExchangeOutcome,
    exchangeId?: string
  ): TrustUpdateResult {
    const previousScore = relationship.overallScore;
    const previousLevel = relationship.level;

    // Clone components for modification
    const newComponents: TrustComponents = {
      ...relationship.components
    };

    // Apply outcome adjustments
    const adjustments = OUTCOME_ADJUSTMENTS[outcome];
    newComponents.exchangeSuccess = this.clampScore(
      newComponents.exchangeSuccess + adjustments.exchangeSuccess
    );
    newComponents.contentQuality = this.clampScore(
      newComponents.contentQuality + adjustments.contentQuality
    );

    // Calculate new overall score
    const newScore = this.calculateTrustScore(newComponents);
    const newLevel = this.getTrustLevel(newScore);

    // Record history
    const relationshipKey = relationship.groveIds.join('-');
    this.recordHistory(relationshipKey, {
      timestamp: new Date().toISOString(),
      previousScore,
      newScore,
      previousLevel,
      newLevel,
      reason: `Exchange ${outcome}`,
      exchangeId
    });

    return {
      previousScore,
      newScore,
      previousLevel,
      newLevel,
      components: newComponents,
      levelChanged: previousLevel !== newLevel
    };
  }

  /**
   * Update tier accuracy component based on mapping validation.
   */
  updateTierAccuracy(
    relationship: TrustRelationshipPayload,
    isAccurate: boolean
  ): TrustUpdateResult {
    const previousScore = relationship.overallScore;
    const previousLevel = relationship.level;

    const newComponents: TrustComponents = {
      ...relationship.components
    };

    // Adjust tier accuracy
    newComponents.tierAccuracy = this.clampScore(
      newComponents.tierAccuracy + (isAccurate ? 3 : -5)
    );

    const newScore = this.calculateTrustScore(newComponents);
    const newLevel = this.getTrustLevel(newScore);

    const relationshipKey = relationship.groveIds.join('-');
    this.recordHistory(relationshipKey, {
      timestamp: new Date().toISOString(),
      previousScore,
      newScore,
      previousLevel,
      newLevel,
      reason: `Tier mapping ${isAccurate ? 'verified' : 'failed'}`
    });

    return {
      previousScore,
      newScore,
      previousLevel,
      newLevel,
      components: newComponents,
      levelChanged: previousLevel !== newLevel
    };
  }

  /**
   * Update response time component.
   */
  updateResponseTime(
    relationship: TrustRelationshipPayload,
    responseTimeMs: number,
    expectedTimeMs: number = 5000
  ): TrustUpdateResult {
    const previousScore = relationship.overallScore;
    const previousLevel = relationship.level;

    const newComponents: TrustComponents = {
      ...relationship.components
    };

    // Calculate response time score (100 = instant, 0 = 10x expected)
    const ratio = responseTimeMs / expectedTimeMs;
    const responseScore = Math.max(0, Math.min(100, 100 - (ratio - 1) * 20));

    // Blend with existing score (exponential moving average)
    newComponents.responseTime = Math.round(
      newComponents.responseTime * 0.7 + responseScore * 0.3
    );

    const newScore = this.calculateTrustScore(newComponents);
    const newLevel = this.getTrustLevel(newScore);

    const relationshipKey = relationship.groveIds.join('-');
    this.recordHistory(relationshipKey, {
      timestamp: new Date().toISOString(),
      previousScore,
      newScore,
      previousLevel,
      newLevel,
      reason: `Response time: ${responseTimeMs}ms`
    });

    return {
      previousScore,
      newScore,
      previousLevel,
      newLevel,
      components: newComponents,
      levelChanged: previousLevel !== newLevel
    };
  }

  /**
   * Get trust history for a relationship.
   */
  getTrustHistory(groveId1: string, groveId2: string): TrustHistoryEntry[] {
    const orderedIds = orderGroveIds(groveId1, groveId2);
    const key = orderedIds.join('-');
    return this.trustHistory.get(key) || [];
  }

  /**
   * Clear trust history (for testing).
   */
  clearHistory(): void {
    this.trustHistory.clear();
  }

  /**
   * Calculate aggregate trust score from multiple relationships.
   */
  calculateAggregateTrust(relationships: TrustRelationshipPayload[]): number {
    if (relationships.length === 0) return 0;

    // Weighted average based on exchange count
    const totalExchanges = relationships.reduce((sum, r) => sum + r.exchangeCount, 0);

    if (totalExchanges === 0) {
      // Simple average if no exchanges
      return Math.round(
        relationships.reduce((sum, r) => sum + r.overallScore, 0) / relationships.length
      );
    }

    // Weighted average
    const weightedSum = relationships.reduce(
      (sum, r) => sum + r.overallScore * r.exchangeCount,
      0
    );
    return Math.round(weightedSum / totalExchanges);
  }

  /**
   * Determine if a grove meets minimum trust for an operation.
   */
  meetsTrustRequirement(
    relationship: TrustRelationshipPayload | undefined,
    minimumLevel: TrustLevel
  ): boolean {
    if (!relationship) return false;

    const levelOrder: TrustLevel[] = ['new', 'established', 'trusted', 'verified'];
    const currentIndex = levelOrder.indexOf(relationship.level);
    const requiredIndex = levelOrder.indexOf(minimumLevel);

    return currentIndex >= requiredIndex;
  }

  /**
   * Get human-readable trust description.
   */
  getTrustDescription(relationship: TrustRelationshipPayload): string {
    const config = TRUST_LEVEL_CONFIGS[relationship.level];
    const successRate = relationship.exchangeCount > 0
      ? Math.round((relationship.successfulExchanges / relationship.exchangeCount) * 100)
      : 0;

    return `${config.icon} ${config.label} (${relationship.overallScore}%) - ${successRate}% success rate over ${relationship.exchangeCount} exchanges`;
  }

  /**
   * Clamp score to 0-100 range.
   */
  private clampScore(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Record a history entry.
   */
  private recordHistory(key: string, entry: TrustHistoryEntry): void {
    const history = this.trustHistory.get(key) || [];
    history.push(entry);

    // Keep last 100 entries
    if (history.length > 100) {
      history.shift();
    }

    this.trustHistory.set(key, history);
  }
}

// Singleton instance
let trustEngineInstance: TrustEngine | null = null;

/**
 * Get singleton instance of TrustEngine.
 */
export function getTrustEngine(): TrustEngine {
  if (!trustEngineInstance) {
    trustEngineInstance = new TrustEngine();
  }
  return trustEngineInstance;
}

// Export for testing
export { TrustEngine };

// Re-export schema utilities for convenience
export {
  TRUST_THRESHOLDS,
  TRUST_LEVEL_CONFIGS,
  orderGroveIds
};
