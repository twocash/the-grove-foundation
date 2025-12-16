// useStreakTracking - Track user engagement streaks and journey stats
// Data is stored locally, not in system settings

import { useState, useEffect, useCallback } from 'react';

interface StreakData {
  currentStreak: number;         // Days in a row
  longestStreak: number;         // All-time longest streak
  lastActivityDate: string;      // ISO date (YYYY-MM-DD)
  journeysCompleted: number;     // Total journeys finished
  totalMinutesActive: number;    // Total engagement time
}

const STORAGE_KEY = 'grove-streak-data';

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: '',
  journeysCompleted: 0,
  totalMinutesActive: 0
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function useStreakTracking() {
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK_DATA);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStreakData(parsed);
      }
      setLoaded(true);
    } catch (e) {
      console.error('Failed to load streak data:', e);
      setLoaded(true);
    }
  }, []);

  // Save to localStorage
  const saveData = useCallback((data: StreakData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStreakData(data);
    } catch (e) {
      console.error('Failed to save streak data:', e);
    }
  }, []);

  // Record activity for today - updates streak
  const recordActivity = useCallback(() => {
    const today = getToday();

    if (streakData.lastActivityDate === today) {
      // Already recorded today
      return;
    }

    const daysSinceLast = streakData.lastActivityDate
      ? getDaysBetween(streakData.lastActivityDate, today)
      : 0;

    let newStreak: number;
    if (daysSinceLast === 1) {
      // Consecutive day - increment streak
      newStreak = streakData.currentStreak + 1;
    } else if (daysSinceLast === 0 || !streakData.lastActivityDate) {
      // First activity or same day
      newStreak = streakData.currentStreak || 1;
    } else {
      // Gap of 2+ days - reset streak
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, streakData.longestStreak);

    saveData({
      ...streakData,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today
    });
  }, [streakData, saveData]);

  // Increment journey completed count
  const recordJourneyCompleted = useCallback(() => {
    saveData({
      ...streakData,
      journeysCompleted: streakData.journeysCompleted + 1
    });
  }, [streakData, saveData]);

  // Add active minutes
  const addActiveMinutes = useCallback((minutes: number) => {
    saveData({
      ...streakData,
      totalMinutesActive: streakData.totalMinutesActive + minutes
    });
  }, [streakData, saveData]);

  // Check if today's activity has been recorded
  const isActiveToday = streakData.lastActivityDate === getToday();

  return {
    // Current data
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    journeysCompleted: streakData.journeysCompleted,
    totalMinutesActive: streakData.totalMinutesActive,
    isActiveToday,
    loaded,

    // Actions
    recordActivity,
    recordJourneyCompleted,
    addActiveMinutes
  };
}

export default useStreakTracking;
