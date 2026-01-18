// src/core/engine/knowledgeExchange.ts
// Knowledge Exchange - S9-SL-Federation-v1
// Handles request/offer protocol for cross-grove content sharing

import type {
  FederationExchangePayload,
  FederationExchange,
  ExchangeType,
  ExchangeContentType,
  ExchangeStatus,
  TierMappingPayload,
  TrustRelationshipPayload
} from '../schema/federation';

import type { GroveObjectMeta } from '../schema/grove-object';
import { getTierMappingEngine } from './tierMappingEngine';
import { getTrustEngine } from './trustEngine';

/**
 * Parameters for creating an exchange request.
 */
export interface CreateExchangeParams {
  targetGroveId: string;
  contentType: ExchangeContentType;
  query?: string;
  contentId?: string;
  sourceTier?: string;
}

/**
 * Parameters for creating an exchange offer.
 */
export interface CreateOfferParams {
  targetGroveId: string;
  contentId: string;
  contentType: ExchangeContentType;
  sourceTier: string;
}

/**
 * Result of exchange processing.
 */
export interface ExchangeProcessResult {
  exchange: FederationExchangePayload;
  success: boolean;
  message: string;
  tokenValue?: number;
}

/**
 * Exchange validation result.
 */
export interface ExchangeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  trustLevel?: string;
  mappedTier?: string;
}

/**
 * Content preview for exchange decisions.
 */
export interface ContentPreview {
  contentId: string;
  contentType: ExchangeContentType;
  title: string;
  summary: string;
  tier: string;
  qualityScore?: number;
}

/**
 * Base token values by content type.
 */
const BASE_TOKEN_VALUES: Record<ExchangeContentType, number> = {
  sprout: 10,
  concept: 25,
  research: 50,
  insight: 75
};

/**
 * KnowledgeExchange - Core engine for content exchange operations.
 */
export class KnowledgeExchange {
  private myGroveId: string;

  constructor(myGroveId: string = 'local-grove') {
    this.myGroveId = myGroveId;
  }

  /**
   * Set the local grove ID.
   */
  setMyGroveId(groveId: string): void {
    this.myGroveId = groveId;
  }

  /**
   * Get the local grove ID.
   */
  getMyGroveId(): string {
    return this.myGroveId;
  }

  /**
   * Create an exchange request for content from another grove.
   */
  createRequest(params: CreateExchangeParams): FederationExchangePayload {
    const now = new Date().toISOString();

    return {
      requestingGroveId: this.myGroveId,
      providingGroveId: params.targetGroveId,
      type: 'request',
      contentType: params.contentType,
      contentId: params.contentId,
      query: params.query,
      status: 'pending',
      sourceTier: params.sourceTier || '',
      initiatedAt: now
    };
  }

  /**
   * Create an offer to share content with another grove.
   */
  createOffer(params: CreateOfferParams): FederationExchangePayload {
    const now = new Date().toISOString();

    return {
      requestingGroveId: this.myGroveId,
      providingGroveId: params.targetGroveId,
      type: 'offer',
      contentType: params.contentType,
      contentId: params.contentId,
      status: 'pending',
      sourceTier: params.sourceTier,
      initiatedAt: now
    };
  }

  /**
   * Validate an exchange before processing.
   */
  validateExchange(
    exchange: FederationExchangePayload,
    tierMapping?: TierMappingPayload,
    trustRelationship?: TrustRelationshipPayload
  ): ExchangeValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!exchange.requestingGroveId) {
      errors.push('Missing requesting grove ID');
    }
    if (!exchange.providingGroveId) {
      errors.push('Missing providing grove ID');
    }
    if (!exchange.contentType) {
      errors.push('Missing content type');
    }

    // Check for self-exchange
    if (exchange.requestingGroveId === exchange.providingGroveId) {
      errors.push('Cannot exchange with self');
    }

    // Check trust level
    let trustLevel: string | undefined;
    if (trustRelationship) {
      const trustEngine = getTrustEngine();
      trustLevel = trustRelationship.level;

      // High-value content requires higher trust
      if (exchange.contentType === 'research' || exchange.contentType === 'insight') {
        if (!trustEngine.meetsTrustRequirement(trustRelationship, 'trusted')) {
          warnings.push('High-value content exchange recommended with trusted groves');
        }
      }
    } else {
      warnings.push('No trust relationship established');
    }

    // Check tier mapping
    let mappedTier: string | undefined;
    if (tierMapping && exchange.sourceTier) {
      const tierEngine = getTierMappingEngine();
      const mapped = tierEngine.mapTier(
        tierMapping,
        exchange.sourceTier,
        'source-to-target'
      );
      if (mapped) {
        mappedTier = mapped;
      } else {
        warnings.push(`No tier mapping found for tier: ${exchange.sourceTier}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      trustLevel,
      mappedTier
    };
  }

  /**
   * Approve a pending exchange.
   */
  approveExchange(
    exchange: FederationExchangePayload,
    tierMapping?: TierMappingPayload
  ): ExchangeProcessResult {
    if (exchange.status !== 'pending') {
      return {
        exchange,
        success: false,
        message: `Cannot approve exchange with status: ${exchange.status}`
      };
    }

    // Apply tier mapping if available
    let mappedTier = exchange.mappedTier;
    if (!mappedTier && tierMapping && exchange.sourceTier) {
      const tierEngine = getTierMappingEngine();
      mappedTier = tierEngine.mapTier(
        tierMapping,
        exchange.sourceTier,
        'source-to-target'
      ) || undefined;
    }

    const updatedExchange: FederationExchangePayload = {
      ...exchange,
      status: 'approved',
      mappedTier
    };

    return {
      exchange: updatedExchange,
      success: true,
      message: 'Exchange approved'
    };
  }

  /**
   * Reject a pending exchange.
   */
  rejectExchange(
    exchange: FederationExchangePayload,
    reason?: string
  ): ExchangeProcessResult {
    if (exchange.status !== 'pending') {
      return {
        exchange,
        success: false,
        message: `Cannot reject exchange with status: ${exchange.status}`
      };
    }

    const updatedExchange: FederationExchangePayload = {
      ...exchange,
      status: 'rejected'
    };

    return {
      exchange: updatedExchange,
      success: true,
      message: reason || 'Exchange rejected'
    };
  }

  /**
   * Complete an approved exchange with token calculation.
   */
  completeExchange(
    exchange: FederationExchangePayload,
    trustRelationship?: TrustRelationshipPayload
  ): ExchangeProcessResult {
    if (exchange.status !== 'approved') {
      return {
        exchange,
        success: false,
        message: `Cannot complete exchange with status: ${exchange.status}`
      };
    }

    // Calculate token value
    const baseValue = BASE_TOKEN_VALUES[exchange.contentType];
    let tokenValue = baseValue;

    // Apply trust multiplier
    if (trustRelationship) {
      const trustEngine = getTrustEngine();
      const multiplier = trustEngine.getTrustMultiplier(trustRelationship.level);
      tokenValue = Math.round(baseValue * multiplier);
    }

    const now = new Date().toISOString();
    const updatedExchange: FederationExchangePayload = {
      ...exchange,
      status: 'completed',
      completedAt: now,
      tokenValue
    };

    return {
      exchange: updatedExchange,
      success: true,
      message: 'Exchange completed',
      tokenValue
    };
  }

  /**
   * Mark an exchange as expired.
   */
  expireExchange(exchange: FederationExchangePayload): ExchangeProcessResult {
    if (exchange.status === 'completed') {
      return {
        exchange,
        success: false,
        message: 'Cannot expire completed exchange'
      };
    }

    const updatedExchange: FederationExchangePayload = {
      ...exchange,
      status: 'expired'
    };

    return {
      exchange: updatedExchange,
      success: true,
      message: 'Exchange expired'
    };
  }

  /**
   * Calculate estimated token value for an exchange.
   */
  estimateTokenValue(
    contentType: ExchangeContentType,
    trustLevel?: string
  ): number {
    const baseValue = BASE_TOKEN_VALUES[contentType];

    if (trustLevel) {
      const trustEngine = getTrustEngine();
      const multiplier = trustEngine.getTrustMultiplier(trustLevel as any);
      return Math.round(baseValue * multiplier);
    }

    return baseValue;
  }

  /**
   * Get exchange statistics for a grove.
   */
  getExchangeStats(exchanges: FederationExchangePayload[]): {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    expired: number;
    totalTokensEarned: number;
    averageTokenValue: number;
  } {
    const stats = {
      total: exchanges.length,
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      expired: 0,
      totalTokensEarned: 0,
      averageTokenValue: 0
    };

    for (const exchange of exchanges) {
      stats[exchange.status]++;
      if (exchange.tokenValue) {
        stats.totalTokensEarned += exchange.tokenValue;
      }
    }

    if (stats.completed > 0) {
      stats.averageTokenValue = Math.round(stats.totalTokensEarned / stats.completed);
    }

    return stats;
  }

  /**
   * Filter exchanges by status.
   */
  filterByStatus(
    exchanges: FederationExchangePayload[],
    status: ExchangeStatus
  ): FederationExchangePayload[] {
    return exchanges.filter(e => e.status === status);
  }

  /**
   * Get exchanges involving a specific grove (as requester or provider).
   */
  getExchangesForGrove(
    exchanges: FederationExchangePayload[],
    groveId: string
  ): FederationExchangePayload[] {
    return exchanges.filter(
      e => e.requestingGroveId === groveId || e.providingGroveId === groveId
    );
  }

  /**
   * Get incoming requests (where we are the provider).
   */
  getIncomingRequests(
    exchanges: FederationExchangePayload[]
  ): FederationExchangePayload[] {
    return exchanges.filter(
      e => e.providingGroveId === this.myGroveId && e.type === 'request'
    );
  }

  /**
   * Get outgoing requests (where we are the requester).
   */
  getOutgoingRequests(
    exchanges: FederationExchangePayload[]
  ): FederationExchangePayload[] {
    return exchanges.filter(
      e => e.requestingGroveId === this.myGroveId && e.type === 'request'
    );
  }
}

// Singleton instance
let knowledgeExchangeInstance: KnowledgeExchange | null = null;

/**
 * Get singleton instance of KnowledgeExchange.
 */
export function getKnowledgeExchange(): KnowledgeExchange {
  if (!knowledgeExchangeInstance) {
    knowledgeExchangeInstance = new KnowledgeExchange();
  }
  return knowledgeExchangeInstance;
}

// Export for testing
export { KnowledgeExchange };

// Export base token values for UI display
export { BASE_TOKEN_VALUES };
