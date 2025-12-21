// useExplorationStats - Aggregate exploration statistics for stats display
// Sprint v0.16: Command Palette feature

import { useMemo } from 'react';
import { useStreakTracking } from './useStreakTracking';
import { useNarrativeEngine } from './useNarrativeEngine';
import { useEngagementBridge } from './useEngagementBridge';

export interface ExplorationStats {
  // Streak data
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;

  // Journey progress
  journeysCompleted: number;
  totalMinutesActive: number;
  cardsVisited: number;

  // Session data
  exchangeCount: number;
  topicsExplored: number;

  // Calculated fields
  engagementLevel: 'new' | 'exploring' | 'engaged' | 'dedicated';
}

function calculateEngagementLevel(
  exchangeCount: number,
  journeysCompleted: number,
  totalMinutes: number
): ExplorationStats['engagementLevel'] {
  // Dedicated: 10+ journeys or 100+ minutes or 50+ exchanges
  if (journeysCompleted >= 10 || totalMinutes >= 100 || exchangeCount >= 50) {
    return 'dedicated';
  }
  // Engaged: 3+ journeys or 30+ minutes or 20+ exchanges
  if (journeysCompleted >= 3 || totalMinutes >= 30 || exchangeCount >= 20) {
    return 'engaged';
  }
  // Exploring: 1+ journey or 10+ minutes or 5+ exchanges
  if (journeysCompleted >= 1 || totalMinutes >= 10 || exchangeCount >= 5) {
    return 'exploring';
  }
  // New: just getting started
  return 'new';
}

export function useExplorationStats(): ExplorationStats {
  const {
    currentStreak,
    longestStreak,
    journeysCompleted: streakJourneysCompleted,
    totalMinutesActive,
    isActiveToday,
    loaded: streakLoaded
  } = useStreakTracking();

  const { session, visitedNodes } = useNarrativeEngine();

  // Get engagement state from bridge
  const { sessionState } = useEngagementBridge();

  // Get exchange count from session (engagement bus tracks journeys/topics, not individual exchanges)
  const exchangeCount = session?.exchangeCount || 0;
  const topicsExplored = sessionState?.topicsExplored || 0;

  const stats = useMemo<ExplorationStats>(() => ({
    currentStreak,
    longestStreak,
    isActiveToday,
    journeysCompleted: streakJourneysCompleted,
    totalMinutesActive,
    cardsVisited: visitedNodes.length,
    exchangeCount,
    topicsExplored,
    engagementLevel: calculateEngagementLevel(
      exchangeCount,
      streakJourneysCompleted,
      totalMinutesActive
    )
  }), [
    currentStreak,
    longestStreak,
    isActiveToday,
    streakJourneysCompleted,
    totalMinutesActive,
    visitedNodes.length,
    exchangeCount,
    topicsExplored
  ]);

  return stats;
}

export default useExplorationStats;
