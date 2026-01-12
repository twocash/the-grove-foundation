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
    Array.isArray(payload.changelog)
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
