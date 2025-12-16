// useFeatureFlags - Hook for accessing feature flag state from system settings
// Feature flags are stored in globalSettings.featureFlags and persist to GCS

import { useMemo } from 'react';
import { useNarrativeEngine } from './useNarrativeEngine';
import { FeatureFlag, DEFAULT_FEATURE_FLAGS } from '../data/narratives-schema';

interface UseFeatureFlagsReturn {
  // Get a single flag value
  getFlag: (flagId: string) => boolean;

  // Get all flags
  getAllFlags: () => FeatureFlag[];

  // Check if flags are loaded
  isLoading: boolean;
}

/**
 * Hook to read feature flags from the narrative schema
 * Feature flags are admin-configurable via the ?admin=true interface
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { schema, loading } = useNarrativeEngine();

  // Get all flags with fallback to defaults
  const allFlags = useMemo((): FeatureFlag[] => {
    if (!schema?.globalSettings?.featureFlags) {
      return DEFAULT_FEATURE_FLAGS;
    }

    // Merge with defaults to ensure new flags are available
    const storedFlags = schema.globalSettings.featureFlags;
    const mergedFlags: FeatureFlag[] = DEFAULT_FEATURE_FLAGS.map(defaultFlag => {
      const storedFlag = storedFlags.find(f => f.id === defaultFlag.id);
      return storedFlag || defaultFlag;
    });

    // Also include any flags that exist in storage but not in defaults
    storedFlags.forEach(storedFlag => {
      if (!mergedFlags.find(f => f.id === storedFlag.id)) {
        mergedFlags.push(storedFlag);
      }
    });

    return mergedFlags;
  }, [schema]);

  // Get a single flag value by ID
  const getFlag = (flagId: string): boolean => {
    const flag = allFlags.find(f => f.id === flagId);
    if (!flag) {
      // Check defaults if not found
      const defaultFlag = DEFAULT_FEATURE_FLAGS.find(f => f.id === flagId);
      return defaultFlag?.enabled ?? false;
    }
    return flag.enabled;
  };

  // Get all flags
  const getAllFlags = (): FeatureFlag[] => {
    return allFlags;
  };

  return {
    getFlag,
    getAllFlags,
    isLoading: loading
  };
}

/**
 * Convenience hook to check a single feature flag
 * Usage: const showCustomLens = useFeatureFlag('custom-lens-in-picker');
 */
export function useFeatureFlag(flagId: string): boolean {
  const { getFlag, isLoading } = useFeatureFlags();

  // While loading, return the default value from DEFAULT_FEATURE_FLAGS
  if (isLoading) {
    const defaultFlag = DEFAULT_FEATURE_FLAGS.find(f => f.id === flagId);
    return defaultFlag?.enabled ?? false;
  }

  return getFlag(flagId);
}

export default useFeatureFlags;
