// src/core/schema/widget.ts
// Grove Widget type definitions

/**
 * Widget mode determines which content area is visible
 */
export type WidgetMode = 'explore' | 'garden' | 'chat';

/**
 * Inspector mode for right-drawer context
 */
export type InspectorMode =
  | 'none'
  | 'sprout'      // Viewing a Sprout's properties
  | 'node'        // Viewing a Node in journey
  | 'journey'     // Viewing a Journey
  | 'settings';   // Widget settings

/**
 * Widget session state for persistence
 */
export interface WidgetSession {
  mode: WidgetMode;
  sessionStartTime: string;  // ISO timestamp
  sproutCount: number;
  lastActivity: string;      // ISO timestamp
}

/**
 * Widget state for context provider
 */
export interface WidgetState {
  // Mode
  currentMode: WidgetMode;

  // Session
  sessionStartTime: Date;
  sproutCount: number;

  // Inspector
  inspectorMode: InspectorMode;
  inspectorEntityId: string | null;

  // Command palette
  isCommandPaletteOpen: boolean;
}

/**
 * Widget actions for context provider
 */
export interface WidgetActions {
  setMode: (mode: WidgetMode) => void;
  openInspector: (mode: InspectorMode, entityId: string) => void;
  closeInspector: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  incrementSproutCount: () => void;
}

/**
 * Combined context type
 */
export interface WidgetUIContextType extends WidgetState, WidgetActions {}

/**
 * localStorage keys for widget state
 */
export const WIDGET_MODE_KEY = 'grove-widget-mode';
export const WIDGET_SESSION_KEY = 'grove-widget-session';

/**
 * Type guard for WidgetMode
 */
export function isWidgetMode(value: unknown): value is WidgetMode {
  return value === 'explore' || value === 'garden' || value === 'chat';
}

/**
 * Mode display labels
 */
export const MODE_LABELS: Record<WidgetMode, string> = {
  explore: 'Exploring',
  garden: 'Gardening',
  chat: 'Chatting',
};

/**
 * Mode configuration
 */
export interface ModeConfig {
  id: WidgetMode;
  label: string;
  activeLabel: string;
  disabled?: boolean;
  hint?: string;
}

export const MODE_CONFIGS: ModeConfig[] = [
  { id: 'explore', label: 'Explore', activeLabel: 'Exploring' },
  { id: 'garden', label: 'Garden', activeLabel: 'Gardening' },
  { id: 'chat', label: 'Chat', activeLabel: 'Chatting', disabled: true, hint: 'Coming Soon' },
];
