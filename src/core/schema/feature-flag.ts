/**
 * Feature Flag Schema
 * Sprint: feature-flags-v1
 *
 * GroveObject<FeatureFlagPayload> pattern for admin-configurable feature flags.
 * Instance cardinality: many flags active simultaneously.
 */

/**
 * Changelog entry for tracking availability changes.
 * Only tracks `available` field changes, not every edit.
 */
export interface FlagChangelogEntry {
  /** ISO timestamp of the change */
  timestamp: string;

  /** Field that changed - only 'available' is tracked */
  field: 'available';

  /** Previous value */
  oldValue: boolean;

  /** New value */
  newValue: boolean;

  /** Optional reason for the change */
  reason?: string;
}

/**
 * Feature flag categories for grouping and filtering.
 */
export type FeatureFlagCategory =
  | 'experience'   // User-facing experience features
  | 'research'     // Research/sprout-related features
  | 'experimental' // Experimental/beta features
  | 'internal';    // Internal/developer features

/**
 * Model variant for A/B testing different lifecycle models.
 */
export interface ModelVariant {
  /** Unique identifier for the variant */
  variantId: string;

  /** Display name for the variant */
  name: string;

  /** Description of what makes this variant different */
  description?: string;

  /** Percentage of traffic to allocate (0-100) */
  trafficAllocation: number;

  /** ID of the lifecycle model to use for this variant */
  modelId?: string;

  /** Custom configuration for this variant */
  config?: Record<string, unknown>;
}

/**
 * Performance metrics for tracking A/B test results.
 */
export interface VariantPerformanceMetrics {
  /** Total impressions */
  impressions: number;

  /** Total conversions */
  conversions: number;

  /** Conversion rate (0-1) */
  conversionRate: number;

  /** Average engagement time (ms) */
  avgEngagementTime: number;

  /** Success rate (0-1) */
  successRate: number;

  /** User satisfaction score (0-1) */
  satisfactionScore: number;

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Payload for a feature flag GroveObject.
 *
 * Key design decisions:
 * - flagId is immutable (no rename capability in editor)
 * - changelog only tracks `available` changes
 * - user preferences preserved in localStorage, respect `available` state
 */
export interface FeatureFlagPayload {
  /**
   * Unique immutable identifier (e.g., 'sprout-research').
   * Used as the key for localStorage preferences.
   * Cannot be changed after creation.
   */
  flagId: string;

  /**
   * Whether flag is available for use (admin kill switch).
   * When false, feature is disabled regardless of user preference.
   */
  available: boolean;

  /**
   * Default state when user has no preference.
   * User can override in their preferences if available=true.
   */
  defaultEnabled: boolean;

  /**
   * Whether to show this flag as a toggle in the Explore header.
   */
  showInExploreHeader: boolean;

  /**
   * Label text for the header toggle.
   * Null if not shown in header.
   */
  headerLabel: string | null;

  /**
   * Sort order in header (lower = left).
   * Used when showInExploreHeader is true.
   */
  headerOrder: number;

  /**
   * Grouping category for organization and filtering.
   */
  category: FeatureFlagCategory;

  /**
   * Availability change log.
   * Only records when `available` field changes.
   */
  changelog: FlagChangelogEntry[];

  /**
   * Model variants for A/B testing (Sprint: EPIC4-SL-MultiModel v1).
   * When present, the flag becomes a model variant test.
   */
  modelVariants?: ModelVariant[];

  /**
   * Performance metrics for each variant (Sprint: EPIC4-SL-MultiModel v1).
   * Keyed by variantId for easy lookup.
   */
  variantPerformance?: Record<string, VariantPerformanceMetrics>;

  /**
   * Whether to enable deterministic assignment (Sprint: EPIC4-SL-MultiModel v1).
   * When true, users get consistent variant assignments.
   */
  deterministicAssignment: boolean;

  /**
   * Seed for deterministic assignment (Sprint: EPIC4-SL-MultiModel v1).
   * Ensures reproducible variant selection.
   */
  assignmentSeed?: string;
}

/**
 * Type guard for FeatureFlagPayload validation.
 */
export function isFeatureFlagPayload(obj: unknown): obj is FeatureFlagPayload {
  if (typeof obj !== 'object' || obj === null) return false;

  const payload = obj as Record<string, unknown>;

  return (
    typeof payload.flagId === 'string' &&
    typeof payload.available === 'boolean' &&
    typeof payload.defaultEnabled === 'boolean' &&
    typeof payload.showInExploreHeader === 'boolean' &&
    (payload.headerLabel === null || typeof payload.headerLabel === 'string') &&
    typeof payload.headerOrder === 'number' &&
    ['experience', 'research', 'experimental', 'internal'].includes(
      payload.category as string
    ) &&
    Array.isArray(payload.changelog) &&
    (payload.modelVariants === undefined || Array.isArray(payload.modelVariants)) &&
    (payload.variantPerformance === undefined || typeof payload.variantPerformance === 'object') &&
    typeof payload.deterministicAssignment === 'boolean'
  );
}

/**
 * Create a new FeatureFlagPayload with defaults.
 */
export function createFeatureFlagPayload(
  flagId: string,
  options?: Partial<Omit<FeatureFlagPayload, 'flagId' | 'changelog'>>
): FeatureFlagPayload {
  return {
    flagId,
    available: options?.available ?? true,
    defaultEnabled: options?.defaultEnabled ?? false,
    showInExploreHeader: options?.showInExploreHeader ?? false,
    headerLabel: options?.headerLabel ?? null,
    headerOrder: options?.headerOrder ?? 0,
    category: options?.category ?? 'experimental',
    changelog: [],
    modelVariants: options?.modelVariants,
    variantPerformance: options?.variantPerformance,
    deterministicAssignment: options?.deterministicAssignment ?? true,
    assignmentSeed: options?.assignmentSeed,
  };
}

/**
 * Add a changelog entry when availability changes.
 */
export function addAvailabilityChange(
  payload: FeatureFlagPayload,
  newValue: boolean,
  reason?: string
): FeatureFlagPayload {
  if (payload.available === newValue) return payload;

  const entry: FlagChangelogEntry = {
    timestamp: new Date().toISOString(),
    field: 'available',
    oldValue: payload.available,
    newValue,
    reason,
  };

  return {
    ...payload,
    available: newValue,
    changelog: [...payload.changelog, entry],
  };
}

/**
 * Select a variant based on traffic allocation (Sprint: EPIC4-SL-MultiModel v1).
 * Uses deterministic assignment if enabled, otherwise random assignment.
 */
export function selectVariant(
  variants: ModelVariant[],
  userId: string,
  deterministic: boolean = true,
  seed?: string
): ModelVariant | null {
  if (!variants || variants.length === 0) return null;

  if (!deterministic) {
    // Random assignment
    const random = Math.random() * 100;
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.trafficAllocation;
      if (random <= cumulative) {
        return variant;
      }
    }
    return variants[0]; // Fallback
  }

  // Deterministic assignment using hash of userId + seed
  const hashSeed = seed || 'default-seed';
  const hash = simpleHash(`${userId}-${hashSeed}`);
  const normalized = (hash % 10000) / 100; // 0-100

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.trafficAllocation;
    if (normalized <= cumulative) {
      return variant;
    }
  }
  return variants[0]; // Fallback
}

/**
 * Simple hash function for deterministic variant assignment.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Update performance metrics for a variant (Sprint: EPIC4-SL-MultiModel v1).
 */
export function updateVariantPerformance(
  payload: FeatureFlagPayload,
  variantId: string,
  update: Partial<VariantPerformanceMetrics>
): FeatureFlagPayload {
  if (!payload.variantPerformance) {
    payload.variantPerformance = {};
  }

  const current = payload.variantPerformance[variantId] || {
    impressions: 0,
    conversions: 0,
    conversionRate: 0,
    avgEngagementTime: 0,
    successRate: 0,
    satisfactionScore: 0,
    lastUpdated: new Date().toISOString(),
  };

  const updated: VariantPerformanceMetrics = {
    ...current,
    ...update,
    lastUpdated: new Date().toISOString(),
  };

  // Recalculate derived metrics
  if (updated.impressions > 0) {
    updated.conversionRate = updated.conversions / updated.impressions;
  }

  return {
    ...payload,
    variantPerformance: {
      ...payload.variantPerformance,
      [variantId]: updated,
    },
  };
}

/**
 * Record an impression for a variant (Sprint: EPIC4-SL-MultiModel v1).
 */
export function recordVariantImpression(
  payload: FeatureFlagPayload,
  variantId: string
): FeatureFlagPayload {
  return updateVariantPerformance(payload, variantId, {
    impressions: (payload.variantPerformance?.[variantId]?.impressions || 0) + 1,
  });
}

/**
 * Record a conversion for a variant (Sprint: EPIC4-SL-MultiModel v1).
 */
export function recordVariantConversion(
  payload: FeatureFlagPayload,
  variantId: string
): FeatureFlagPayload {
  const current = payload.variantPerformance?.[variantId];
  const currentConversions = current?.conversions || 0;
  const currentImpressions = current?.impressions || 0;

  return updateVariantPerformance(payload, variantId, {
    conversions: currentConversions + 1,
  });
}

/**
 * Create a model variant with defaults (Sprint: EPIC4-SL-MultiModel v1).
 */
export function createModelVariant(
  variantId: string,
  name: string,
  trafficAllocation: number,
  options?: Partial<ModelVariant>
): ModelVariant {
  return {
    variantId,
    name,
    trafficAllocation,
    description: options?.description,
    modelId: options?.modelId,
    config: options?.config,
  };
}

/**
 * Validate that traffic allocations sum to 100 (Sprint: EPIC4-SL-MultiModel v1).
 */
export function validateTrafficAllocation(variants: ModelVariant[]): boolean {
  const total = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
  return Math.abs(total - 100) < 0.01;
}

/**
 * Normalize traffic allocations to sum to 100 (Sprint: EPIC4-SL-MultiModel v1).
 */
export function normalizeTrafficAllocation(variants: ModelVariant[]): ModelVariant[] {
  const total = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
  if (total === 0) return variants;

  return variants.map(v => ({
    ...v,
    trafficAllocation: (v.trafficAllocation / total) * 100,
  }));
}
