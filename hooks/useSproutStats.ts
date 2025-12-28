// hooks/useSproutStats.ts
// Sprint: Sprout System
// Aggregated sprout statistics for display

import { useMemo } from 'react';
import { useSproutStorage } from './useSproutStorage';
import { SproutStats, MAX_RECENT_SPROUTS } from '../src/core/schema/sprout';

/**
 * Hook for aggregated sprout statistics
 *
 * Provides computed stats from sprout storage for display in
 * StatsModal and GardenView.
 */
export function useSproutStats(): SproutStats {
  const { getSprouts, getSessionSprouts, sessionId } = useSproutStorage();

  return useMemo(() => {
    const allSprouts = getSprouts();
    const sessionSprouts = getSessionSprouts();

    // Count sprouts by hub
    const sproutsByHub: Record<string, number> = {};
    for (const sprout of allSprouts) {
      if (sprout.hubId) {
        sproutsByHub[sprout.hubId] = (sproutsByHub[sprout.hubId] || 0) + 1;
      }
    }

    // Count sprouts by tag
    const sproutsByTag: Record<string, number> = {};
    for (const sprout of allSprouts) {
      for (const tag of sprout.tags) {
        sproutsByTag[tag] = (sproutsByTag[tag] || 0) + 1;
      }
    }

    // Get recent sprouts (from current session, sorted by capture time)
    const recentSprouts = [...sessionSprouts]
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, MAX_RECENT_SPROUTS);

    return {
      totalSprouts: allSprouts.length,
      sessionSprouts: sessionSprouts.length,
      sproutsByHub,
      sproutsByTag,
      recentSprouts
    };
  }, [getSprouts, getSessionSprouts, sessionId]);
}

export default useSproutStats;
