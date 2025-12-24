// src/core/engagement/persistence.ts

export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getLens(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.lens);
  } catch {
    return null;
  }
}

export function setLens(lens: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.lens, lens);
  } catch {
    console.warn('Failed to persist lens to localStorage');
  }
}

export function clearLens(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.lens);
  } catch {
    // Silently fail
  }
}

// Journey completion tracking
export function getCompletedJourneys(): string[] {
  if (!isBrowser()) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.completedJourneys);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markJourneyCompleted(journeyId: string): void {
  if (!isBrowser()) return;
  try {
    const completed = getCompletedJourneys();
    if (!completed.includes(journeyId)) {
      completed.push(journeyId);
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify(completed));
    }
  } catch {
    console.warn('Failed to persist journey completion');
  }
}

export function isJourneyCompleted(journeyId: string): boolean {
  return getCompletedJourneys().includes(journeyId);
}

export function clearCompletedJourneys(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.completedJourneys);
  } catch {
    // Silently fail
  }
}
