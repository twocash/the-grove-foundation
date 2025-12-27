// src/lib/session.ts
// Anonymous session ID management for sprout grouping

const SESSION_KEY = 'grove-session-id';

/**
 * Get or create a session ID for the current browser session
 * Used to group sprouts from the same user without authentication
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Clear the current session ID (for testing)
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
