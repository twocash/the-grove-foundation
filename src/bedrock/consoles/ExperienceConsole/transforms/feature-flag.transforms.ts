// src/bedrock/consoles/ExperienceConsole/transforms/feature-flag.transforms.ts
// Transform functions for Feature Flags
// Sprint: feature-flags-v1
//
// DEX Principle: Declarative Sovereignty
// Flag creation is transformed via registered function, not inline logic.

import type { FeatureFlagPayload, FeatureFlagCategory } from '@core/schema/feature-flag';
import { createFeatureFlagPayload } from '@core/schema/feature-flag';
import type { FeatureFlag as LegacyFeatureFlag } from '../../../../data/narratives-schema';

/**
 * Wizard output shape for feature flag creation
 */
export interface FeatureFlagWizardOutput {
  flagId: string;
  title?: string;
  description?: string;
  available?: boolean;
  defaultEnabled?: boolean;
  showInExploreHeader?: boolean;
  headerLabel?: string;
  headerOrder?: number;
  category?: string;
}

/**
 * Transform wizard output to FeatureFlagPayload
 *
 * @param wizardData - Raw output from wizard/form
 * @returns Valid FeatureFlagPayload ready for object creation
 */
export function createFeatureFlagFromWizard(
  wizardData: FeatureFlagWizardOutput
): FeatureFlagPayload {
  // Validate category
  const category: FeatureFlagCategory =
    wizardData.category === 'experience' ||
    wizardData.category === 'research' ||
    wizardData.category === 'experimental' ||
    wizardData.category === 'internal'
      ? wizardData.category
      : 'experimental';

  return createFeatureFlagPayload(wizardData.flagId, {
    available: wizardData.available ?? true,
    defaultEnabled: wizardData.defaultEnabled ?? false,
    showInExploreHeader: wizardData.showInExploreHeader ?? false,
    headerLabel: wizardData.headerLabel ?? null,
    headerOrder: wizardData.headerOrder ?? 0,
    category,
  });
}

/**
 * Validate wizard output before transform
 * Returns array of error messages (empty if valid)
 */
export function validateFeatureFlagWizardOutput(
  wizardData: FeatureFlagWizardOutput
): string[] {
  const errors: string[] = [];

  // flagId is required and must be valid format
  if (!wizardData.flagId?.trim()) {
    errors.push('Flag ID is required');
  } else if (!/^[a-z0-9-]+$/.test(wizardData.flagId)) {
    errors.push('Flag ID must contain only lowercase letters, numbers, and hyphens');
  }

  // headerLabel required if showInExploreHeader is true
  if (wizardData.showInExploreHeader && !wizardData.headerLabel?.trim()) {
    errors.push('Header label is required when showing in Explore header');
  }

  return errors;
}

// =============================================================================
// Migration Transforms (Legacy GCS to Supabase)
// =============================================================================

/**
 * Transform legacy FeatureFlag to FeatureFlagPayload
 * Used for migrating from GCS globalSettings.featureFlags to Supabase
 *
 * @param legacy - Legacy FeatureFlag from narratives-schema
 * @returns FeatureFlagPayload with sensible defaults for new fields
 */
export function migrateLegacyFeatureFlag(
  legacy: LegacyFeatureFlag
): FeatureFlagPayload {
  return createFeatureFlagPayload(legacy.id, {
    available: true, // All legacy flags were available
    defaultEnabled: legacy.enabled,
    showInExploreHeader: false, // Need explicit opt-in for header
    headerLabel: legacy.name,
    headerOrder: 0,
    category: 'experience', // Default category for migrated flags
  });
}

/**
 * Batch migrate legacy feature flags
 *
 * @param legacyFlags - Array of legacy FeatureFlags
 * @returns Array of FeatureFlagPayloads
 */
export function migrateLegacyFeatureFlags(
  legacyFlags: LegacyFeatureFlag[]
): FeatureFlagPayload[] {
  return legacyFlags.map(migrateLegacyFeatureFlag);
}
