// src/lib/workspace-state.ts
// Persistent state management for Grove Workspace
// Complements NarrativeEngineContext (which handles lens/journey state)

const STORAGE_KEY = 'grove-workspace-state';

export interface WorkspacePreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  inspectorWidth: number;
  lastVisitedSection: string | null;
}

export interface WorkspaceSession {
  sessionStartTime: number;
  lastActiveTime: number;
  viewHistory: string[]; // Track navigation for back/forward
}

export interface WorkspaceState {
  preferences: WorkspacePreferences;
  session: WorkspaceSession;
}

const DEFAULT_PREFERENCES: WorkspacePreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  inspectorWidth: 320,
  lastVisitedSection: null,
};

const DEFAULT_SESSION: WorkspaceSession = {
  sessionStartTime: Date.now(),
  lastActiveTime: Date.now(),
  viewHistory: [],
};

const DEFAULT_STATE: WorkspaceState = {
  preferences: DEFAULT_PREFERENCES,
  session: DEFAULT_SESSION,
};

// Load state from localStorage
export function loadWorkspaceState(): WorkspaceState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;

    const parsed = JSON.parse(stored) as Partial<WorkspaceState>;
    return {
      preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
      session: { ...DEFAULT_SESSION, ...parsed.session },
    };
  } catch (e) {
    console.error('[workspace-state] Failed to load:', e);
    return DEFAULT_STATE;
  }
}

// Save state to localStorage
export function saveWorkspaceState(state: WorkspaceState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[workspace-state] Failed to save:', e);
  }
}

// Update specific preferences
export function updatePreferences(
  current: WorkspaceState,
  updates: Partial<WorkspacePreferences>
): WorkspaceState {
  const newState = {
    ...current,
    preferences: { ...current.preferences, ...updates },
  };
  saveWorkspaceState(newState);
  return newState;
}

// Update session state
export function updateSession(
  current: WorkspaceState,
  updates: Partial<WorkspaceSession>
): WorkspaceState {
  const newState = {
    ...current,
    session: { ...current.session, ...updates, lastActiveTime: Date.now() },
  };
  saveWorkspaceState(newState);
  return newState;
}

// Add to view history (for back/forward navigation)
export function pushViewHistory(
  current: WorkspaceState,
  path: string
): WorkspaceState {
  const history = [...current.session.viewHistory];
  // Don't duplicate consecutive entries
  if (history[history.length - 1] !== path) {
    history.push(path);
    // Keep only last 50 entries
    if (history.length > 50) {
      history.shift();
    }
  }
  return updateSession(current, { viewHistory: history });
}

// Theme helpers
export function getEffectiveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Initialize theme on app load
export function initializeTheme(preferences: WorkspacePreferences): void {
  const effectiveTheme = getEffectiveTheme(preferences.theme);
  applyTheme(effectiveTheme);
}
