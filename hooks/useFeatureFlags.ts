// useFeatureFlags - Hook for accessing feature flag state
// Sprint: feature-flags-v1
//
// Priority order:
// 1. Supabase feature_flags table (admin source of truth)
// 2. Legacy GCS globalSettings.featureFlags (backward compatibility)
// 3. DEFAULT_FEATURE_FLAGS (fallback)
//
// User preferences are stored in localStorage and overlay on defaultEnabled
// when available=true. When available=false, the flag is disabled regardless.

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useNarrativeEngine } from './useNarrativeEngine';
import { FeatureFlag, DEFAULT_FEATURE_FLAGS } from '../data/narratives-schema';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { FeatureFlagPayload } from '@core/schema/feature-flag';

// =============================================================================
// Constants
// =============================================================================

const USER_PREFS_KEY = 'grove-feature-flags-prefs';

// =============================================================================
// Types
// =============================================================================

/**
 * Resolved feature flag state (combines admin config + user preferences)
 */
interface ResolvedFlag {
  /** Unique identifier (matches flagId in Supabase, id in legacy) */
  id: string;
  /** Display name */
  name: string;
  /** Description of what the flag controls */
  description: string;
  /** Whether the flag is currently enabled for this user */
  enabled: boolean;
  /** Whether admin allows this flag to be used (kill switch) */
  available: boolean;
  /** Default state when user has no preference */
  defaultEnabled: boolean;
  /** Whether to show in Explore header */
  showInExploreHeader: boolean;
  /** Label for header toggle */
  headerLabel: string | null;
  /** Sort order in header */
  headerOrder: number;
}

/**
 * User preferences stored in localStorage
 */
interface UserFlagPreferences {
  [flagId: string]: boolean;
}

interface UseFeatureFlagsReturn {
  /** Get a single flag's enabled state */
  getFlag: (flagId: string) => boolean;

  /** Get all resolved flags */
  getAllFlags: () => ResolvedFlag[];

  /** Get flags for Explore header display */
  getHeaderFlags: () => ResolvedFlag[];

  /** Set user preference for a flag (persists to localStorage) */
  setUserPreference: (flagId: string, enabled: boolean) => void;

  /** Clear user preference for a flag (reverts to default) */
  clearUserPreference: (flagId: string) => void;

  /** Check if user has a preference set for a flag */
  hasUserPreference: (flagId: string) => boolean;

  /** Check if flags are loaded */
  isLoading: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Load user preferences from localStorage
 */
function loadUserPreferences(): UserFlagPreferences {
  try {
    const stored = localStorage.getItem(USER_PREFS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save user preferences to localStorage
 */
function saveUserPreferences(prefs: UserFlagPreferences): void {
  try {
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[useFeatureFlags] Failed to save preferences:', e);
  }
}

/**
 * Convert Supabase GroveObject<FeatureFlagPayload> to ResolvedFlag
 */
function supabaseFlagToResolved(
  flag: GroveObject<FeatureFlagPayload>,
  userPrefs: UserFlagPreferences
): ResolvedFlag {
  const { payload, meta } = flag;

  // Determine enabled state:
  // - If not available, always false (admin kill switch)
  // - If user has preference, use it
  // - Otherwise use defaultEnabled
  const userPref = userPrefs[payload.flagId];
  const enabled = payload.available
    ? (userPref !== undefined ? userPref : payload.defaultEnabled)
    : false;

  return {
    id: payload.flagId,
    name: meta.title,
    description: meta.description || '',
    enabled,
    available: payload.available,
    defaultEnabled: payload.defaultEnabled,
    showInExploreHeader: payload.showInExploreHeader,
    headerLabel: payload.headerLabel,
    headerOrder: payload.headerOrder,
  };
}

/**
 * Convert legacy FeatureFlag to ResolvedFlag
 */
function legacyFlagToResolved(
  flag: FeatureFlag,
  userPrefs: UserFlagPreferences
): ResolvedFlag {
  // Legacy flags are always available, enabled maps to defaultEnabled
  const userPref = userPrefs[flag.id];
  const enabled = userPref !== undefined ? userPref : flag.enabled;

  return {
    id: flag.id,
    name: flag.name,
    description: flag.description,
    enabled,
    available: true, // Legacy flags are always available
    defaultEnabled: flag.enabled,
    showInExploreHeader: false, // Legacy flags don't show in header
    headerLabel: null,
    headerOrder: 0,
  };
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to read feature flags with user preferences
 *
 * Prioritizes Supabase flags when available, falls back to legacy GCS flags.
 * User preferences are stored in localStorage and respect the available state.
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  // Supabase flags (new source of truth)
  const supabaseData = useGroveData<FeatureFlagPayload>('feature-flag');

  // Legacy flags (backward compatibility)
  const { schema, loading: legacyLoading } = useNarrativeEngine();

  // User preferences state
  const [userPrefs, setUserPrefs] = useState<UserFlagPreferences>(() => loadUserPreferences());

  // Sync preferences to localStorage when they change
  useEffect(() => {
    saveUserPreferences(userPrefs);
  }, [userPrefs]);

  // Determine which source to use
  const useSupabase = supabaseData.objects.length > 0 && !supabaseData.loading;
  const isLoading = supabaseData.loading || (supabaseData.objects.length === 0 && legacyLoading);

  // Resolve all flags
  const allFlags = useMemo((): ResolvedFlag[] => {
    if (supabaseData.objects.length > 0) {
      // Use Supabase flags
      return supabaseData.objects
        .filter(obj => obj.meta.status === 'active')
        .map(flag => supabaseFlagToResolved(flag, userPrefs));
    }

    // Fall back to legacy flags
    const legacyFlags = schema?.globalSettings?.featureFlags || DEFAULT_FEATURE_FLAGS;
    return legacyFlags.map(flag => legacyFlagToResolved(flag, userPrefs));
  }, [supabaseData.objects, schema, userPrefs]);

  // Get a single flag value by ID
  const getFlag = useCallback(
    (flagId: string): boolean => {
      const flag = allFlags.find(f => f.id === flagId);
      if (flag) {
        return flag.enabled;
      }

      // Check defaults if not found
      const defaultFlag = DEFAULT_FEATURE_FLAGS.find(f => f.id === flagId);
      return defaultFlag?.enabled ?? false;
    },
    [allFlags]
  );

  // Get all flags
  const getAllFlags = useCallback((): ResolvedFlag[] => {
    return allFlags;
  }, [allFlags]);

  // Get flags for Explore header display
  const getHeaderFlags = useCallback((): ResolvedFlag[] => {
    return allFlags
      .filter(f => f.showInExploreHeader && f.available)
      .sort((a, b) => a.headerOrder - b.headerOrder);
  }, [allFlags]);

  // Set user preference
  const setUserPreference = useCallback((flagId: string, enabled: boolean) => {
    setUserPrefs(prev => ({
      ...prev,
      [flagId]: enabled,
    }));
  }, []);

  // Clear user preference
  const clearUserPreference = useCallback((flagId: string) => {
    setUserPrefs(prev => {
      const next = { ...prev };
      delete next[flagId];
      return next;
    });
  }, []);

  // Check if user has preference
  const hasUserPreference = useCallback(
    (flagId: string): boolean => {
      return userPrefs[flagId] !== undefined;
    },
    [userPrefs]
  );

  return {
    getFlag,
    getAllFlags,
    getHeaderFlags,
    setUserPreference,
    clearUserPreference,
    hasUserPreference,
    isLoading,
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
