// components/Terminal/types.ts
// Shared types for the refactored Terminal architecture
// Sprint: Terminal Architecture Refactor v1.0

import { ChatMessage } from '../../types';
import { Persona, Card, JourneyNode, Journey } from '../../data/narratives-schema';
import { ArchetypeId } from '../../types/lens';

// ============================================================================
// BRIDGE STATE (Cognitive Bridge)
// ============================================================================

/**
 * State for the Cognitive Bridge component that appears when
 * entropy triggers suggest a journey would be valuable
 */
export interface BridgeState {
  visible: boolean;
  journeyId: string | null;
  topicMatch: string | null;
  afterMessageId: string | null;  // Message ID after which to show the bridge
  shownAt: number | null;         // Timestamp when bridge was shown (for timing analytics)
  entropyScore: number | null;    // Entropy score that triggered the bridge
  exchangeCount: number | null;   // Exchange count when bridge triggered
}

export const INITIAL_BRIDGE_STATE: BridgeState = {
  visible: false,
  journeyId: null,
  topicMatch: null,
  afterMessageId: null,
  shownAt: null,
  entropyScore: null,
  exchangeCount: null
};

// ============================================================================
// FLOW STATES
// ============================================================================

/**
 * The current flow state of the Terminal
 * - idle: No active interstitial or overlay
 * - welcome: Showing WelcomeInterstitial for first-time users
 * - selecting: Showing LensPicker for lens selection
 * - wizard: Showing CustomLensWizard for lens creation
 * - active: Normal chat mode with active lens
 */
export type TerminalFlowState = 'idle' | 'welcome' | 'selecting' | 'wizard' | 'active';

// ============================================================================
// REVEAL STATES
// ============================================================================

/**
 * Grouped reveal visibility states
 */
export interface RevealStates {
  simulation: boolean;
  customLensOffer: boolean;
  terminator: boolean;
  founderStory: boolean;
  conversionCTA: boolean;
  journeyCompletion: boolean;
}

export const INITIAL_REVEAL_STATES: RevealStates = {
  simulation: false,
  customLensOffer: false,
  terminator: false,
  founderStory: false,
  conversionCTA: false,
  journeyCompletion: false
};

// ============================================================================
// MODAL STATES
// ============================================================================

/**
 * Grouped modal visibility states
 */
export interface ModalStates {
  help: boolean;
  journeys: boolean;
  stats: boolean;
  garden: boolean;
}

export const INITIAL_MODAL_STATES: ModalStates = {
  help: false,
  journeys: false,
  stats: false,
  garden: false
};

// ============================================================================
// TERMINAL UI STATE
// ============================================================================

/**
 * Consolidated UI state for the Terminal component
 * This groups the 25+ useState hooks into a coherent structure
 */
export interface TerminalUIState {
  // Flow states
  flowState: TerminalFlowState;
  showLensPicker: boolean;
  showJourneyPicker: boolean;
  showCustomLensWizard: boolean;
  showWelcomeInterstitial: boolean;
  hasShownWelcome: boolean;

  // Cognitive Bridge
  bridgeState: BridgeState;

  // Reveal states
  reveals: RevealStates;

  // Modal states
  modals: ModalStates;

  // Input states
  input: string;
  isVerboseMode: boolean;
  dynamicSuggestion: string;
  currentTopic: string;

  // Navigation states
  currentNodeId: string | null;

  // Journey completion
  completedJourneyTitle: string | null;
  journeyStartTime: number;
}

export const INITIAL_TERMINAL_UI_STATE: TerminalUIState = {
  flowState: 'idle',
  showLensPicker: false,
  showJourneyPicker: false,
  showCustomLensWizard: false,
  showWelcomeInterstitial: false,
  hasShownWelcome: false,
  bridgeState: INITIAL_BRIDGE_STATE,
  reveals: INITIAL_REVEAL_STATES,
  modals: INITIAL_MODAL_STATES,
  input: '',
  isVerboseMode: false,
  dynamicSuggestion: '',
  currentTopic: '',
  currentNodeId: null,
  completedJourneyTitle: null,
  journeyStartTime: Date.now()
};

// ============================================================================
// TERMINAL ACTIONS
// ============================================================================

/**
 * Action dispatchers for Terminal state management
 */
export interface TerminalActions {
  // Flow actions
  setFlowState: (state: TerminalFlowState) => void;
  showLensPicker: () => void;
  hideLensPicker: () => void;
  showJourneyPicker: () => void;
  hideJourneyPicker: () => void;
  showCustomLensWizard: () => void;
  hideCustomLensWizard: () => void;
  showWelcomeInterstitial: () => void;
  hideWelcomeInterstitial: () => void;

  // Bridge actions
  setBridgeState: (state: BridgeState) => void;
  dismissBridge: () => void;

  // Reveal actions
  setReveal: (reveal: keyof RevealStates, visible: boolean) => void;
  dismissAllReveals: () => void;

  // Modal actions
  openModal: (modal: keyof ModalStates) => void;
  closeModal: (modal: keyof ModalStates) => void;
  closeAllModals: () => void;

  // Input actions
  setInput: (value: string) => void;
  toggleVerboseMode: () => void;
  setDynamicSuggestion: (value: string) => void;
  setCurrentTopic: (value: string) => void;

  // Navigation actions
  setCurrentNodeId: (id: string | null) => void;

  // Journey actions
  setCompletedJourneyTitle: (title: string | null) => void;
  resetJourneyStartTime: () => void;
}

// ============================================================================
// TERMINAL SHELL HANDLE (for ref-based control)
// ============================================================================

/**
 * Imperative handle for controlling the Terminal shell from parent components
 * Used for programmatic focus, scrolling, and message injection
 */
export interface TerminalShellHandle {
  /** Focus the input field */
  focusInput: () => void;
  /** Scroll messages area to bottom */
  scrollToBottom: () => void;
  /** Inject a system message into the chat */
  injectSystemMessage: (text: string) => void;
  /** Get current input value */
  getInput: () => string;
  /** Set input value */
  setInput: (value: string) => void;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Props for TerminalShell component
 */
export interface TerminalShellProps {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading?: boolean;           // Loading state for pill indicator
  enableMinimize?: boolean;      // Feature flag to show/hide minimize
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  onToggle: () => void;          // Toggle open/close
  children: React.ReactNode;
  // Optional ref for programmatic control
  shellRef?: React.Ref<TerminalShellHandle>;
}

/**
 * Props for TerminalChat component
 */
export interface TerminalChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (query: string, display?: string, nodeId?: string) => void;
  suggestions: Array<Card | JourneyNode>;
  onSuggestionClick: (node: Card | JourneyNode) => void;
  dynamicSuggestion: string;
  activeLensData: Persona | null;
  // Inline bridge support
  bridgeState: BridgeState;
  onBridgeAccept: () => void;
  onBridgeDismiss: () => void;
  // V2.1 Journey context
  v21JourneyContext: V21JourneyContext | null;
  isJourneyEnd: boolean;
  // Refs for parent control
  inputRef: React.RefObject<HTMLInputElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  // Loading messages from settings
  loadingMessages?: string[];
  // Bold text click handler
  onPromptClick?: (prompt: string) => void;
}

/**
 * V2.1 Journey context for incomplete/in-progress journeys
 */
export interface V21JourneyContext {
  journeyId: string;
  journeyTitle: string;
  journeyDescription?: string;
  hasPendingNext: boolean;
  pendingNextId?: string;
  totalNodes: number;
  currentPosition: number;
  isIncomplete: boolean;
}

/**
 * Props for TerminalFlow component
 */
export interface TerminalFlowProps {
  // Flow state visibility
  showWelcome: boolean;
  showLensPicker: boolean;
  showCustomLensWizard: boolean;

  // Reveal states
  showSimulationReveal: boolean;
  showCustomLensOffer: boolean;
  showTerminatorPrompt: boolean;
  showFounderStory: boolean;
  showConversionCTA: boolean;
  showJourneyCompletion: boolean;
  terminatorModeActive: boolean;

  // Modal states
  showHelpModal: boolean;
  showStatsModal: boolean;
  showGardenModal: boolean;

  // Data
  currentArchetypeId: ArchetypeId | null;
  activeLensData: Persona | null;
  enabledPersonas: Persona[];
  customLenses: any[];  // CustomLens[]
  completedJourneyTitle: string | null;
  journeyStartTime: number;
  activeJourneyId: string | null;

  // Feature flags
  showCustomLensInPicker: boolean;
  showJourneyRatings: boolean;
  showFeedbackTransmission: boolean;

  // Handlers - Lens selection
  onLensSelect: (id: string | null) => void;
  onWelcomeLensSelect: (id: string | null) => void;
  onCreateCustomLens: () => void;
  onDeleteCustomLens: (id: string) => void;
  onCustomLensComplete: (candidate: any, inputs: any) => Promise<void>;  // LensCandidate, UserInputs
  onCustomLensCancel: () => void;

  // Handlers - Reveals
  onSimulationContinue: () => void;
  onCustomLensOfferAccept: () => void;
  onCustomLensOfferDecline: () => void;
  onTerminatorAccept: () => void;
  onTerminatorDecline: () => void;
  onFounderStoryContinue: () => void;
  onConversionDismiss: () => void;
  onConversionCTAClick: (ctaId: string) => void;

  // Handlers - Journey completion
  onJourneyCompletionSubmit: (rating: number, feedback: string, sendToFoundation: boolean) => void;
  onJourneyCompletionSkip: () => void;

  // Handlers - Modals
  onCloseHelpModal: () => void;
  onCloseStatsModal: () => void;
  onCloseGardenModal: () => void;
  onViewFullStats: () => void;

  // Handlers - LensPicker
  onLensPickerBack: () => void;
  onLensPickerAfterSelect: (personaId: string) => void;

  // URL lens support
  urlLensId?: string | null;
}

// ============================================================================
// SPROUT SYSTEM TYPES (for command handlers)
// ============================================================================

/**
 * Context for sprout capture
 */
export interface SproutContext {
  personaId: string | null;
  journeyId: string | null;
  hubId: string | null;
  nodeId: string | null;
}

/**
 * Last response data for sprout capture
 */
export interface LastResponseData {
  text: string;
  query: string;
}
