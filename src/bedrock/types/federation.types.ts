// src/bedrock/types/federation.types.ts
// Federation Object Type Registry - Defines all federation entity types for FederationConsole
// Sprint: S9-SL-Federation v1
//
// DEX Principle: Organic Scalability
// New federation entity types are added to this registry without code changes to console-factory.
// DEX Principle: Declarative Sovereignty
// Console behavior is driven by registry configuration, not hardcoded in components.

import type {
  FederatedGrovePayload,
  TierMappingPayload,
  FederationExchangePayload,
  TrustRelationshipPayload,
} from '@core/schema/federation';

// =============================================================================
// Console Configuration Types (for polymorphic console)
// =============================================================================

/**
 * Metric definition for console header metrics row
 * DEX: Generated dynamically from registry at runtime
 */
export interface FederationMetricDefinition {
  /** Unique metric ID */
  id: string;
  /** Display label */
  label: string;
  /** Material icon name */
  icon: string;
  /** Pseudo-query for counting (e.g., 'count(where: status=active)') */
  query: string;
  /** Only count objects of this type (optional) */
  typeFilter?: string;
}

/**
 * Filter definition for console filter bar
 */
export interface FederationFilterDefinition {
  /** Field path to filter on (e.g., 'meta.status', 'payload.connectionStatus') */
  field: string;
  /** Display label */
  label: string;
  /** Filter input type */
  type: 'select' | 'boolean';
  /** Options for select type */
  options?: string[];
}

/**
 * Sort option definition for console sort dropdown
 */
export interface FederationSortDefinition {
  /** Field path to sort on */
  field: string;
  /** Display label */
  label: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

// =============================================================================
// Registry Types
// =============================================================================

/**
 * Definition for a federation entity type
 * Each type registered here can be managed via FederationConsole
 */
export interface FederationTypeDefinition<T = unknown> {
  /** Unique type identifier (matches GroveObjectType) */
  type: string;
  /** Human-readable label */
  label: string;
  /** Plural label */
  labelPlural: string;
  /** Material icon name */
  icon: string;
  /** Brief description of what this type controls */
  description: string;
  /** Default payload for new objects of this type */
  defaultPayload: T;
  /** Editor component name for inspector panel */
  editorComponent: string;
  /** Card component name for grid/list view */
  cardComponent: string;
  /** Data hook name for CRUD operations */
  dataHookName: string;
  /** Whether multiple can be active simultaneously */
  allowMultipleActive: boolean;
  /** Tab index in console navigation */
  tabIndex: number;
  /** Accent color for badges/cards */
  color: string;
  /** Type-specific metrics */
  metrics?: FederationMetricDefinition[];
  /** Type-specific filters */
  filters?: FederationFilterDefinition[];
  /** Type-specific sort options */
  sortOptions?: FederationSortDefinition[];
  /** Search fields for this type */
  searchFields?: string[];
}

// =============================================================================
// Default Payloads
// =============================================================================

/**
 * Default payload for new federated grove
 */
export const DEFAULT_FEDERATED_GROVE_PAYLOAD: Omit<FederatedGrovePayload, 'groveId'> = {
  name: 'New Grove',
  description: '',
  endpoint: '',
  status: 'active',
  connectionStatus: 'none',
  tierSystem: {
    name: 'Default',
    tiers: [
      { id: 'tier-1', name: 'Tier 1', level: 1, icon: '1', color: '#94a3b8' },
    ],
  },
  trustScore: 0,
  trustLevel: 'new',
  sproutCount: 0,
  exchangeCount: 0,
  capabilities: [],
};

/**
 * Default payload for new tier mapping
 */
export const DEFAULT_TIER_MAPPING_PAYLOAD: Omit<TierMappingPayload, 'sourceGroveId' | 'targetGroveId'> = {
  mappings: [],
  status: 'draft',
  confidenceScore: 0,
};

/**
 * Default payload for new federation exchange
 */
export const DEFAULT_FEDERATION_EXCHANGE_PAYLOAD: Omit<FederationExchangePayload, 'requestingGroveId' | 'providingGroveId'> = {
  type: 'request',
  contentType: 'sprout',
  status: 'pending',
  sourceTier: '',
  initiatedAt: new Date().toISOString(),
};

/**
 * Default payload for new trust relationship
 */
export const DEFAULT_TRUST_RELATIONSHIP_PAYLOAD: Omit<TrustRelationshipPayload, 'groveIds'> = {
  overallScore: 50,
  components: {
    exchangeSuccess: 50,
    tierAccuracy: 50,
    responseTime: 50,
    contentQuality: 50,
  },
  exchangeCount: 0,
  successfulExchanges: 0,
  level: 'new',
};

// =============================================================================
// Registry
// =============================================================================

/**
 * Federation Entity Type Registry
 *
 * Add new federation entity types here to make them manageable via FederationConsole.
 * The console will automatically support CRUD, filtering, and display.
 */
export const FEDERATION_TYPE_REGISTRY = {
  'federated-grove': {
    type: 'federated-grove',
    label: 'Federated Grove',
    labelPlural: 'Federated Groves',
    icon: 'forest',
    description: 'External grove communities registered for federation',
    defaultPayload: DEFAULT_FEDERATED_GROVE_PAYLOAD,
    editorComponent: 'GroveEditor',
    cardComponent: 'GroveCard',
    dataHookName: 'useFederatedGrovesData',
    allowMultipleActive: true,
    tabIndex: 0,
    color: '#4ade80', // Green for groves
    searchFields: ['payload.groveId', 'payload.name', 'payload.description', 'payload.endpoint'],
    metrics: [
      { id: 'total', label: 'Total Groves', icon: 'forest', query: 'count(*)' },
      { id: 'connected', label: 'Connected', icon: 'link', query: 'count(where: connectionStatus=connected)' },
      { id: 'pending', label: 'Pending', icon: 'hourglass_empty', query: 'count(where: connectionStatus=pending)' },
    ],
    filters: [
      { field: 'payload.status', label: 'Status', type: 'select', options: ['active', 'inactive', 'degraded', 'blocked'] },
      { field: 'payload.connectionStatus', label: 'Connection', type: 'select', options: ['connected', 'pending', 'blocked', 'none'] },
      { field: 'payload.trustLevel', label: 'Trust Level', type: 'select', options: ['new', 'established', 'trusted', 'verified'] },
    ],
    sortOptions: [
      { field: 'payload.name', label: 'Name', direction: 'asc' },
      { field: 'payload.trustScore', label: 'Trust Score', direction: 'desc' },
      { field: 'payload.exchangeCount', label: 'Exchanges', direction: 'desc' },
    ],
  } satisfies FederationTypeDefinition<Omit<FederatedGrovePayload, 'groveId'>>,

  'tier-mapping': {
    type: 'tier-mapping',
    label: 'Tier Mapping',
    labelPlural: 'Tier Mappings',
    icon: 'compare_arrows',
    description: 'Semantic tier equivalence mappings between groves',
    defaultPayload: DEFAULT_TIER_MAPPING_PAYLOAD,
    editorComponent: 'TierMappingEditor',
    cardComponent: 'TierMappingCard',
    dataHookName: 'useTierMappingsData',
    allowMultipleActive: true,
    tabIndex: 1,
    color: '#60a5fa', // Blue for mappings
    searchFields: ['payload.sourceGroveId', 'payload.targetGroveId'],
    metrics: [
      { id: 'total', label: 'Total Mappings', icon: 'compare_arrows', query: 'count(*)' },
      { id: 'accepted', label: 'Accepted', icon: 'check_circle', query: 'count(where: status=accepted)' },
      { id: 'proposed', label: 'Proposed', icon: 'pending', query: 'count(where: status=proposed)' },
    ],
    filters: [
      { field: 'payload.status', label: 'Status', type: 'select', options: ['draft', 'proposed', 'accepted', 'rejected'] },
    ],
    sortOptions: [
      { field: 'payload.confidenceScore', label: 'Confidence', direction: 'desc' },
      { field: 'meta.updatedAt', label: 'Updated', direction: 'desc' },
    ],
  } satisfies FederationTypeDefinition<Omit<TierMappingPayload, 'sourceGroveId' | 'targetGroveId'>>,

  'federation-exchange': {
    type: 'federation-exchange',
    label: 'Exchange',
    labelPlural: 'Exchanges',
    icon: 'swap_horiz',
    description: 'Knowledge exchange requests and offers between groves',
    defaultPayload: DEFAULT_FEDERATION_EXCHANGE_PAYLOAD,
    editorComponent: 'ExchangeEditor',
    cardComponent: 'ExchangeCard',
    dataHookName: 'useFederationExchangesData',
    allowMultipleActive: true,
    tabIndex: 2,
    color: '#f59e0b', // Amber for exchanges
    searchFields: ['payload.requestingGroveId', 'payload.providingGroveId', 'payload.query', 'payload.contentId'],
    metrics: [
      { id: 'total', label: 'Total Exchanges', icon: 'swap_horiz', query: 'count(*)' },
      { id: 'pending', label: 'Pending', icon: 'hourglass_empty', query: 'count(where: status=pending)' },
      { id: 'completed', label: 'Completed', icon: 'check_circle', query: 'count(where: status=completed)' },
    ],
    filters: [
      { field: 'payload.type', label: 'Type', type: 'select', options: ['request', 'offer'] },
      { field: 'payload.status', label: 'Status', type: 'select', options: ['pending', 'approved', 'completed', 'rejected', 'expired'] },
      { field: 'payload.contentType', label: 'Content', type: 'select', options: ['sprout', 'concept', 'research', 'insight'] },
    ],
    sortOptions: [
      { field: 'payload.initiatedAt', label: 'Date', direction: 'desc' },
      { field: 'payload.tokenValue', label: 'Token Value', direction: 'desc' },
    ],
  } satisfies FederationTypeDefinition<Omit<FederationExchangePayload, 'requestingGroveId' | 'providingGroveId'>>,

  'trust-relationship': {
    type: 'trust-relationship',
    label: 'Trust Relationship',
    labelPlural: 'Trust Relationships',
    icon: 'verified_user',
    description: 'Bidirectional trust scores between grove pairs',
    defaultPayload: DEFAULT_TRUST_RELATIONSHIP_PAYLOAD,
    editorComponent: 'TrustEditor',
    cardComponent: 'TrustCard',
    dataHookName: 'useTrustRelationshipsData',
    allowMultipleActive: true,
    tabIndex: 3,
    color: '#a78bfa', // Purple for trust
    searchFields: ['payload.groveIds'],
    metrics: [
      { id: 'total', label: 'Relationships', icon: 'verified_user', query: 'count(*)' },
      { id: 'verified', label: 'Verified', icon: 'workspace_premium', query: 'count(where: level=verified)' },
      { id: 'trusted', label: 'Trusted', icon: 'thumb_up', query: 'count(where: level=trusted)' },
    ],
    filters: [
      { field: 'payload.level', label: 'Level', type: 'select', options: ['new', 'established', 'trusted', 'verified'] },
    ],
    sortOptions: [
      { field: 'payload.overallScore', label: 'Score', direction: 'desc' },
      { field: 'payload.exchangeCount', label: 'Exchanges', direction: 'desc' },
      { field: 'meta.updatedAt', label: 'Updated', direction: 'desc' },
    ],
  } satisfies FederationTypeDefinition<Omit<TrustRelationshipPayload, 'groveIds'>>,
} as const;

// =============================================================================
// Type Utilities
// =============================================================================

/**
 * Union type of all registered federation entity types
 */
export type FederationEntityType = keyof typeof FEDERATION_TYPE_REGISTRY;

/**
 * Maps federation entity types to their payload interfaces.
 * Enables type-safe payload access based on object type.
 */
export interface FederationPayloadMap {
  'federated-grove': FederatedGrovePayload;
  'tier-mapping': TierMappingPayload;
  'federation-exchange': FederationExchangePayload;
  'trust-relationship': TrustRelationshipPayload;
}

/**
 * Get type definition by type key
 */
export function getFederationTypeDefinition<T extends FederationEntityType>(
  type: T
): (typeof FEDERATION_TYPE_REGISTRY)[T] {
  return FEDERATION_TYPE_REGISTRY[type];
}

/**
 * Check if a type key is a valid federation entity type
 */
export function isFederationEntityType(type: string): type is FederationEntityType {
  return type in FEDERATION_TYPE_REGISTRY;
}

/**
 * Get all registered type definitions as array
 */
export function getAllFederationTypes(): FederationTypeDefinition[] {
  return Object.values(FEDERATION_TYPE_REGISTRY);
}

/**
 * Get federation types sorted by tab index
 */
export function getFederationTypesByTabOrder(): FederationTypeDefinition[] {
  return getAllFederationTypes().sort((a, b) => a.tabIndex - b.tabIndex);
}
