// src/core/schema/workspace.ts
// Grove Workspace type definitions

/**
 * Navigation path represents the current location in the nav tree
 * e.g., ['explore', 'nodes', 'ratchet']
 */
export type NavigationPath = string[];

/**
 * Entity types that can be inspected
 */
export type EntityType = 'node' | 'journey' | 'lens' | 'sprout' | 'diary-entry' | 'chat-context';

/**
 * Inspector mode determines what's shown in the right panel
 */
export type InspectorMode =
  | { type: 'none' }
  | { type: 'node'; nodeId: string }
  | { type: 'journey'; journeyId: string }
  | { type: 'lens'; lensId: string }
  | { type: 'sprout'; sproutId: string }
  | { type: 'diary-entry'; entryId: string }
  | { type: 'chat-context'; context: ChatContext };

/**
 * Chat context for inspector
 */
export interface ChatContext {
  activeLens: string | null;
  loadedRagFiles: string[];
  sessionMinutes: number;
  exchangeCount: number;
}

/**
 * Navigation tree item
 */
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  view?: string;  // Which view to show in center
  children?: Record<string, NavItem>;
  badge?: string | number;  // Optional badge (e.g., sprout count)
  comingSoon?: boolean;  // Dimmed, shows placeholder
}

/**
 * Navigation state
 */
export interface NavigationState {
  activePath: NavigationPath;
  expandedGroups: Set<string>;
  selectedEntityId: string | null;
  selectedEntityType: EntityType | null;
}

/**
 * Inspector state
 */
export interface InspectorState {
  mode: InspectorMode;
  isOpen: boolean;
}

/**
 * Session state (carried forward from widget)
 */
export interface SessionState {
  startTime: Date;
  sproutCount: number;
}

/**
 * Combined workspace UI state
 */
export interface WorkspaceUIState {
  navigation: NavigationState;
  inspector: InspectorState;
  session: SessionState;
  isCommandPaletteOpen: boolean;
}

/**
 * Workspace UI actions
 */
export interface WorkspaceUIActions {
  // Navigation
  navigateTo: (path: NavigationPath) => void;
  toggleGroup: (groupPath: string) => void;

  // Inspector
  openInspector: (mode: InspectorMode) => void;
  closeInspector: () => void;
  toggleInspector: () => void;

  // Selection
  selectEntity: (id: string, type: EntityType) => void;
  clearSelection: () => void;

  // Command Palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Session
  incrementSproutCount: () => void;
}

/**
 * Combined context type
 */
export interface WorkspaceUIContextType extends WorkspaceUIState, WorkspaceUIActions {}

/**
 * View identifier for center content
 */
export type ViewId =
  | 'terminal'           // Main Terminal (Explore)
  | 'node-grid'
  | 'node-detail'
  | 'journey-list'
  | 'lens-picker'
  | 'chat-placeholder'   // Do > Chat
  | 'apps-placeholder'   // Do > Apps
  | 'agents-placeholder' // Do > Agents
  | 'sprout-grid'
  | 'commons-feed'
  | 'village-feed';

/**
 * localStorage keys
 */
export const WORKSPACE_NAV_KEY = 'grove-workspace-nav';
export const WORKSPACE_EXPANDED_KEY = 'grove-workspace-expanded';

/**
 * Default navigation path - Explore shows Terminal directly
 */
export const DEFAULT_NAV_PATH: NavigationPath = ['explore'];
