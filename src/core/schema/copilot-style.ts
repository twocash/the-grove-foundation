// src/core/schema/copilot-style.ts
// Copilot Style System Object - Configurable terminal styling for Inspector Copilot
// Sprint: inspector-copilot-v1
//
// DEX Principle: Declarative Sovereignty
// Copilot appearance is driven by system configuration, not hardcoded values.
// Operators can customize the terminal aesthetic per grove.

// =============================================================================
// Types
// =============================================================================

/**
 * Terminal color theme for copilot
 * Defines the visual appearance of the mini-terminal
 */
export interface CopilotColorTheme {
  /** Background color (e.g., '#0d0d0d' for near-black) */
  background: string;
  /** Border color (e.g., '#1a1a1a') */
  border: string;
  /** Primary accent color - prompts, labels, active elements (e.g., '#00ff00' for terminal green) */
  accent: string;
  /** User input text color */
  userText: string;
  /** Assistant response text color */
  responseText: string;
  /** Muted/secondary text color */
  mutedText: string;
  /** Placeholder text color */
  placeholderText: string;
}

/**
 * Typography settings for copilot terminal
 */
export interface CopilotTypography {
  /** Font family (e.g., 'JetBrains Mono', 'Fira Code', 'monospace') */
  fontFamily: string;
  /** Base font size in pixels */
  fontSize: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Whether to use uppercase for labels */
  uppercaseLabels: boolean;
  /** Letter spacing for labels (in em) */
  labelTracking: number;
}

/**
 * Terminal decoration options
 */
export interface CopilotDecorations {
  /** Prompt character (e.g., '>', '$', '%', '▸') */
  promptChar: string;
  /** Collapsed indicator (e.g., '[+]', '▶') */
  collapsedIndicator: string;
  /** Expanded indicator (e.g., '[-]', '▼') */
  expandedIndicator: string;
  /** Submit indicator (e.g., '⏎', '↵', 'ENTER') */
  submitIndicator: string;
  /** Processing indicator animation */
  processingAnimation: 'pulse' | 'blink' | 'spin';
}

/**
 * Full Copilot Style Payload
 * System object for customizing inspector copilot appearance
 *
 * SINGLETON PATTERN: Only one active style per grove.
 * Follows versioning pattern from research-agent-config, writer-agent-config.
 */
export interface CopilotStylePayload {
  /** Unique style identifier */
  styleId: string;
  /** Theme preset name (for quick switching) */
  preset: 'terminal-green' | 'terminal-amber' | 'terminal-cyan' | 'custom';
  /** Color theme */
  colors: CopilotColorTheme;
  /** Typography settings */
  typography: CopilotTypography;
  /** Terminal decorations */
  decorations: CopilotDecorations;
  /** Maximum visible messages in history */
  maxDisplayMessages: number;
  /** Whether input is auto-focused after responses */
  autoFocusInput: boolean;
  /** Show suggestions as clickable buttons */
  showSuggestionButtons: boolean;

  // ==========================================================================
  // Versioning Fields (Singleton Pattern)
  // ==========================================================================

  /** Version number (starts at 1, increments on each save) */
  version: number;
  /** ID of previous version (for version history) */
  previousVersionId?: string;
  /** Changelog for this version */
  changelog?: string;
}

// =============================================================================
// Preset Themes
// =============================================================================

/** Classic terminal green (Matrix/hacker aesthetic) */
export const THEME_TERMINAL_GREEN: CopilotColorTheme = {
  background: '#0d0d0d',
  border: '#1a1a1a',
  accent: '#00ff00',
  userText: '#888888',
  responseText: '#aaaaaa',
  mutedText: '#666666',
  placeholderText: '#444444',
};

/** Warm amber terminal (retro CRT) */
export const THEME_TERMINAL_AMBER: CopilotColorTheme = {
  background: '#0d0a08',
  border: '#1a1410',
  accent: '#ffaa00',
  userText: '#998866',
  responseText: '#ccaa88',
  mutedText: '#665544',
  placeholderText: '#443322',
};

/** Cool cyan terminal (modern tech) */
export const THEME_TERMINAL_CYAN: CopilotColorTheme = {
  background: '#0a0d0d',
  border: '#141a1a',
  accent: '#00ffff',
  userText: '#668899',
  responseText: '#88aacc',
  mutedText: '#445566',
  placeholderText: '#223344',
};

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_COPILOT_TYPOGRAPHY: CopilotTypography = {
  fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.5,
  uppercaseLabels: true,
  labelTracking: 0.05,
};

export const DEFAULT_COPILOT_DECORATIONS: CopilotDecorations = {
  promptChar: '>',
  collapsedIndicator: '[+]',
  expandedIndicator: '[-]',
  submitIndicator: '⏎',
  processingAnimation: 'pulse',
};

/**
 * Default Copilot Style Payload
 * Terminal green preset - classic hacker aesthetic
 */
export const DEFAULT_COPILOT_STYLE_PAYLOAD: CopilotStylePayload = {
  styleId: 'default',
  preset: 'terminal-green',
  colors: THEME_TERMINAL_GREEN,
  typography: DEFAULT_COPILOT_TYPOGRAPHY,
  decorations: DEFAULT_COPILOT_DECORATIONS,
  maxDisplayMessages: 5,
  autoFocusInput: true,
  showSuggestionButtons: true,
  // Versioning (singleton pattern)
  version: 1,
};

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a CopilotStylePayload with a preset theme
 */
export function createCopilotStylePayload(
  preset: CopilotStylePayload['preset'] = 'terminal-green',
  overrides?: Partial<CopilotStylePayload>
): CopilotStylePayload {
  const presetThemes: Record<string, CopilotColorTheme> = {
    'terminal-green': THEME_TERMINAL_GREEN,
    'terminal-amber': THEME_TERMINAL_AMBER,
    'terminal-cyan': THEME_TERMINAL_CYAN,
    'custom': THEME_TERMINAL_GREEN, // Default to green for custom
  };

  return {
    ...DEFAULT_COPILOT_STYLE_PAYLOAD,
    preset,
    colors: presetThemes[preset] || THEME_TERMINAL_GREEN,
    ...overrides,
  };
}

/**
 * Generate CSS custom properties from a CopilotStylePayload
 * For use in inline styles or CSS-in-JS
 */
export function copilotStyleToCSSVars(style: CopilotStylePayload): Record<string, string> {
  return {
    '--copilot-bg': style.colors.background,
    '--copilot-border': style.colors.border,
    '--copilot-accent': style.colors.accent,
    '--copilot-user-text': style.colors.userText,
    '--copilot-response-text': style.colors.responseText,
    '--copilot-muted-text': style.colors.mutedText,
    '--copilot-placeholder': style.colors.placeholderText,
    '--copilot-font': style.typography.fontFamily,
    '--copilot-font-size': `${style.typography.fontSize}px`,
    '--copilot-line-height': String(style.typography.lineHeight),
  };
}
