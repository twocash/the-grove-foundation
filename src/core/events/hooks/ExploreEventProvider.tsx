// src/core/events/hooks/ExploreEventProvider.tsx
// Sprint: bedrock-event-integration-v1
// Wrapper that conditionally enables GroveEventProvider based on feature flag

import React, { ReactNode } from 'react';
import { GroveEventProvider } from './provider';

// Feature flag ID for the new event system
export const GROVE_EVENT_SYSTEM_FLAG = 'grove-event-system';

interface ExploreEventProviderProps {
  children: ReactNode;
  /** Override feature flag for testing */
  forceEnabled?: boolean;
}

/**
 * Conditional provider wrapper for explore routes.
 *
 * When the 'grove-event-system' feature flag is enabled:
 * - Wraps children with GroveEventProvider
 * - Enables new event hooks (useEventHelpers, useSession, etc.)
 *
 * When disabled:
 * - Passes through children without modification
 * - Legacy engagement machine continues to work
 *
 * @example
 * ```tsx
 * // In ExplorePage or router
 * <ExploreEventProvider>
 *   <EngagementProvider>
 *     <ExploreContent />
 *   </EngagementProvider>
 * </ExploreEventProvider>
 * ```
 */
export function ExploreEventProvider({
  children,
  forceEnabled
}: ExploreEventProviderProps) {
  // Note: We use a simple localStorage check here instead of useFeatureFlag
  // because useFeatureFlag requires NarrativeEngine context which may not
  // be available at the route level. The admin panel writes flags to GCS
  // and they're loaded into the schema, but we need a simpler check here.

  // For now, use forceEnabled or check localStorage for a simple override
  const isEnabled = forceEnabled ?? checkLocalOverride();

  if (isEnabled) {
    console.info('[GroveEvents] New event system enabled for explore routes');
    return (
      <GroveEventProvider>
        {children}
      </GroveEventProvider>
    );
  }

  // Pass through without wrapping
  return <>{children}</>;
}

/**
 * Check for local override of feature flag.
 * This allows testing without modifying GCS.
 */
function checkLocalOverride(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check URL param first (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('grove-events') === 'true') return true;
    if (urlParams.get('grove-events') === 'false') return false;

    // Check localStorage override
    const override = localStorage.getItem('grove-event-system-override');
    if (override === 'true') return true;
    if (override === 'false') return false;

    // Default: disabled
    return false;
  } catch {
    return false;
  }
}

/**
 * Hook to check if the new event system is enabled.
 * Safe to call outside of provider context.
 */
export function useIsEventSystemEnabled(): boolean {
  // Use the same check as the provider
  return checkLocalOverride();
}
