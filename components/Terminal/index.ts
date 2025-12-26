// Terminal components barrel export
// V2.2: Added TerminalPill for minimize-to-pill functionality (v0.12)
// V2.3: Added LensGrid and WelcomeInterstitial for welcome/switching split (v0.12d)
// V2.4: Added CommandInput and Modals for command palette (v0.16)
// V2.5: Removed LensPicker - now using unified src/explore/LensPicker.tsx (Sprint 7.3)
// V2.6: Added types for Terminal Architecture Refactor v1.0
export { default as LensGrid } from './LensGrid';
export { default as WelcomeInterstitial } from './WelcomeInterstitial';
export { default as LensBadge } from './LensBadge';
export { default as CustomLensWizard } from './CustomLensWizard';
export { default as JourneyCard } from './JourneyCard';
export { default as JourneyCompletion } from './JourneyCompletion';
export { default as JourneyNav } from './JourneyNav';
export { default as LoadingIndicator } from './LoadingIndicator';
export { default as TerminalPill } from './TerminalPill';
export { default as TerminalHeader } from './TerminalHeader';
export { default as TerminalWelcome } from './TerminalWelcome';
export { default as TerminalControls } from './TerminalControls';
export { default as SuggestionChip } from './SuggestionChip';

// Command Palette components (v0.16)
export { CommandInput, commandRegistry, useCommandParser } from './CommandInput';
export type { Command, CommandContext, CommandResult } from './CommandInput';
export { HelpModal, StatsModal, GardenModal } from './Modals';

// Terminal Architecture Refactor v1.0 - Types
export type {
  BridgeState,
  TerminalFlowState,
  RevealStates,
  ModalStates,
  TerminalUIState,
  TerminalActions,
  TerminalShellHandle,
  TerminalShellProps,
  TerminalChatProps,
  TerminalFlowProps,
  V21JourneyContext,
  SproutContext,
  LastResponseData
} from './types';
export {
  INITIAL_BRIDGE_STATE,
  INITIAL_REVEAL_STATES,
  INITIAL_MODAL_STATES,
  INITIAL_TERMINAL_UI_STATE
} from './types';

// Terminal Architecture Refactor v1.0 - State Hook
export { useTerminalState } from './useTerminalState';
export type { UseTerminalStateOptions } from './useTerminalState';

// Terminal Architecture Refactor v1.0 - Extracted Components
export { default as TerminalShell } from './TerminalShell';
export { default as TerminalChat, MarkdownRenderer, parseInline } from './TerminalChat';
export { default as TerminalFlow } from './TerminalFlow';

// Overlay system (Sprint: terminal-overlay-machine-v1)
export { TerminalOverlayRenderer } from './TerminalOverlayRenderer';
export type { OverlayHandlers } from './TerminalOverlayRenderer';
export { OVERLAY_REGISTRY } from './overlay-registry';
export { shouldShowInput, isOverlayActive, getOverlayAnalytics } from './overlay-helpers';
export type { TerminalOverlay, OverlayType } from './types';
export { INITIAL_OVERLAY } from './types';
