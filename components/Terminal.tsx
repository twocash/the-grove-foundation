import React, { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerminalState, ChatMessage, SectionId } from '../types';
import {
  sendMessageStream,
  resetSession as resetChatSession,
  formatChatError
} from '../services/chatService';
import { SECTION_CONFIG, getInitialTerminalMessage, INITIAL_TERMINAL_MESSAGE } from '../constants';
import { useNarrative } from '../hooks/useNarrative';
import { useNarrativeEngine } from '../hooks/useNarrativeEngine';
import { useCustomLens } from '../hooks/useCustomLens';
import { useEngagementBridge } from '../hooks/useEngagementBridge';
import { useEngagement, useLensState, useJourneyState, useEntropyState } from '@core/engagement';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { LensBadge, CustomLensWizard, JourneyCard, JourneyCompletion, JourneyNav, LoadingIndicator, TerminalHeader, TerminalPill, SuggestionChip, MarkdownRenderer, TerminalShell, TerminalFlow, useTerminalState, TerminalWelcome, shouldShowInput, TerminalOverlayRenderer, isOverlayActive, JourneyContent } from './Terminal/index';
import type { WaypointAction } from '@core/schema/journey';
import type { JourneyProvenance } from '@core/schema/journey-provenance';
import { useCommands } from './Terminal/useCommands';
import type { OverlayHandlers } from './Terminal/index';
// Note: WelcomeInterstitial, LensPicker, JourneyList now rendered via TerminalOverlayRenderer
import CognitiveBridge from './Terminal/CognitiveBridge';
import { StatsModal } from './Terminal/Modals';
import { useStreakTracking } from '../hooks/useStreakTracking';
import { useSproutCapture } from '../hooks/useSproutCapture';
import { useSuggestedPrompts } from '../hooks/useSuggestedPrompts';
// telemetryCollector removed - using useEngagementEmit instead (engagement-consolidation-v1)
import { SproutProvenance } from '../src/core/schema/sprout';
import { useOptionalWidgetUI } from '../src/widget/WidgetUIContext';
import { Card, Persona, JourneyNode, Journey } from '../data/narratives-schema';
import { getPersona } from '../data/default-personas';
import { getCanonicalJourney } from '@core/journey';
import { getFormattedTerminalWelcome, getTerminalWelcome, DEFAULT_TERMINAL_WELCOME } from '../src/data/quantum-content';
import { useQuantumInterface } from '../src/surface/hooks/useQuantumInterface';
import { LensCandidate, UserInputs, isCustomLens, ArchetypeId } from '../types/lens';
// Reveal components now handled by TerminalFlow (Epic 4.3)
// SimulationReveal, CustomLensOffer, TerminatorMode, FounderStory, ConversionCTA
import { CommandInput } from './Terminal/CommandInput';
// Sprint: kinetic-stream-polish-v1 - Glass effects and animations
import { StreamRenderer } from './Terminal/Stream/StreamRenderer';
import { fromChatMessage, type StreamItem, type ResponseStreamItem } from '../src/core/schema/stream';
// Sprint: kinetic-stream-reset-v2 - Navigation and rhetoric parsing
import { parseNavigation } from '../src/core/transformers/NavigationParser';
import { parse as parseRhetoric } from '../src/core/transformers/RhetoricalParser';
// Modals now rendered by TerminalFlow (Epic 4.3)
import {
  trackLensActivated,
  trackSimulationRevealShown,
  trackSimulationRevealAcknowledged,
  trackTerminatorModeUnlocked,
  trackTerminatorModeActivated,
  trackFounderStoryViewed,
  trackCtaViewed,
  trackCtaClicked,
  trackJourneyCompleted,
  trackCognitiveBridgeShown,
  trackCognitiveBridgeAccepted,
  trackCognitiveBridgeDismissed,
  trackTerminalMinimized,
  trackTerminalExpanded,
  trackSuggestionClicked
} from '../utils/funnelAnalytics';

interface TerminalProps {
  activeSection: SectionId;
  terminalState: TerminalState;
  setTerminalState: React.Dispatch<React.SetStateAction<TerminalState>>;
  externalQuery?: { nodeId?: string; display: string; query: string } | null;
  onQueryHandled?: () => void;
  // Sprint: active-grove-v1 - Event callbacks for split layout integration
  onLensSelected?: (lensId: string) => void;
  variant?: 'overlay' | 'embedded';  // 'overlay' = default drawer, 'embedded' = split panel
}

// System prompt is now server-side in /api/chat
// See server.js TERMINAL_SYSTEM_PROMPT for the canonical version

// NOTE: MarkdownRenderer is now imported from ./Terminal/index
// (Sprint: Terminal Architecture Refactor v1.0 - Epic 4 integration)

const Terminal: React.FC<TerminalProps> = ({
  activeSection,
  terminalState,
  setTerminalState,
  externalQuery,
  onQueryHandled,
  onLensSelected,
  variant = 'overlay'
}) => {
  // Sprint: route-selection-flow-v1 - Navigation for flow-based selection
  const navigate = useNavigate();

  // Sprint: Terminal Architecture Refactor v1.0 - Epic 4.1
  // Consolidated state management via useTerminalState hook
  const { state: uiState, actions } = useTerminalState();

  // Destructure commonly used state for cleaner code
  const {
    input,
    dynamicSuggestion,
    currentTopic,
    isVerboseMode,
    currentNodeId,
    showLensPicker,
    showJourneyPicker,
    showCustomLensWizard,
    showWelcomeInterstitial,
    hasShownWelcome,
    bridgeState,
    completedJourneyTitle,
    journeyStartTime,
    // Overlay state machine (Sprint: terminal-overlay-machine-v1)
    overlay
  } = uiState;

  // Destructure reveal states
  const showSimulationReveal = uiState.reveals.simulation;
  const showCustomLensOffer = uiState.reveals.customLensOffer;
  const showTerminatorPrompt = uiState.reveals.terminator;
  const showFounderStory = uiState.reveals.founderStory;
  const showConversionCTA = uiState.reveals.conversionCTA;
  const showJourneyCompletion = uiState.reveals.journeyCompletion;

  // Destructure modal states
  const showHelpModal = uiState.modals.help;
  const showStatsModal = uiState.modals.stats;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Legacy narrative hook for v1 compatibility
  const { getNextNodes: getLegacyNextNodes } = useNarrative();

  // Custom lens management
  const {
    customLenses,
    saveCustomLens,
    deleteCustomLens,
    updateCustomLensUsage,
    getCustomLens
  } = useCustomLens();

  // V2.1 Narrative Engine (schema + lookups only; state managed by engagement hooks)
  const {
    schema,
    session,
    getActiveLensData,
    getEnabledPersonas,
    getEntryPoints,
    getNextCards,
    // V2.1 Journey Navigation (lookups only)
    getJourney,
    getNode,
    getNextNodes,
    visitedNodes,
    addVisitedNode,
    // Legacy (deprecated but kept for backward compatibility)
    currentThread,
    currentPosition,
    regenerateThread,
    advanceThread,
    getThreadCard,
    incrementExchangeCount,
    addVisitedCard,
    globalSettings,
    // v0.12e: First-time user detection and URL lens
    isFirstTimeUser,
    urlLensId
  } = useNarrativeEngine();

  // NEW: Engagement state machine hooks (Epic 6 migration)
  const { actor } = useEngagement();
  const { lens: engLens, selectLens: engSelectLens, isHydrated: isLensHydrated } = useLensState({ actor });
  const {
    journey: engJourney,
    isActive: isJourneyActive,
    currentWaypoint,
    journeyProgress,
    journeyTotal,
    startJourney: engStartJourney,
    advanceStep,
    completeJourney,
    exitJourney: engExitJourney,
  } = useJourneyState({ actor });
  const { entropy: engEntropy, updateEntropy: engUpdateEntropy, resetEntropy: engResetEntropy } = useEntropyState({ actor });

  // Compatibility mappings for gradual migration
  // These will be used in place of NarrativeEngine equivalents
  const engActiveJourneyId = engJourney?.id ?? null;

  // Engagement Bus (unified state management replacing useRevealState)
  const {
    revealState,
    sessionState,
    showSimulationReveal: shouldShowSimReveal,
    showCustomLensOffer: shouldShowLensOffer,
    showTerminatorPrompt: shouldShowTerminator,
    showFounderPrompt: shouldShowFounder,
    terminatorModeActive,
    acknowledgeSimulationReveal,
    dismissCustomLensOffer,
    unlockTerminatorMode,
    activateTerminatorMode,
    deactivateTerminatorMode,
    showFounderStory: markFounderStoryShown,
    dismissFounderStory,
    markCTAViewed,
    incrementJourneysCompleted,
    incrementTopicsExplored,
    updateActiveMinutes,
    setCustomLens: setRevealCustomLens,
    getMinutesActive,
    // NEW: Direct access to engagement bus for event emission
    emit,
    // Stage tracking for adaptive engagement
    engagementState
  } = useEngagementBridge();

  // Compute engagement stage from state
  const computedStage = useMemo(() => {
    console.log('[Terminal] Computing stage from engagementState:', {
      exchangeCount: engagementState.exchangeCount,
      journeysCompleted: engagementState.journeysCompleted,
      topicsExplored: engagementState.topicsExplored.length,
    });

    let stage: string;
    if (engagementState.journeysCompleted >= 1 || engagementState.exchangeCount >= 10) {
      stage = 'ENGAGED';
    } else if (engagementState.topicsExplored.length >= 2 || engagementState.exchangeCount >= 5) {
      stage = 'EXPLORING';
    } else if (engagementState.exchangeCount >= 3) {
      stage = 'ORIENTED';
    } else {
      stage = 'ARRIVAL';
    }

    console.log('[Terminal] Computed stage:', stage);
    return stage;
  }, [engagementState.journeysCompleted, engagementState.exchangeCount, engagementState.topicsExplored.length]);

  // Quantum Interface for lens-reactive content (Sprint: terminal-quantum-welcome-v1)
  const { reality, activeLens: quantumLens, isCollapsing } = useQuantumInterface();

  // Derive welcome content with fallback
  const welcomeContent = reality?.terminal ?? DEFAULT_TERMINAL_WELCOME;

  // Feature flags
  const showCustomLensInPicker = useFeatureFlag('custom-lens-in-picker');
  const showJourneyRatings = useFeatureFlag('journey-ratings');
  const showStreakDisplay = useFeatureFlag('streaks-display');
  const showFeedbackTransmission = useFeatureFlag('feedback-transmission');
  const enableMinimize = useFeatureFlag('terminal-minimize');
  const enableControlsBelow = useFeatureFlag('terminal-controls-below');

  // Minimize state - derived from terminalState with fallback
  const isMinimized = terminalState.isMinimized ?? false;

  // Streak tracking
  const {
    currentStreak,
    journeysCompleted: totalJourneysCompleted,
    recordActivity,
    recordJourneyCompleted
  } = useStreakTracking();

  // Record activity when terminal opens
  useEffect(() => {
    if (terminalState.isOpen) {
      recordActivity();
    }
  }, [terminalState.isOpen, recordActivity]);

  // Note: "No lens nudge" logic removed - all users now have a lens (min: freestyle)
  // The Cognitive Bridge handles suggesting journeys for freestyle users

  // Sprout capture (Sprint: Sprout System)
  const { capture: captureSprout } = useSproutCapture();

  // Widget UI context (optional - may not be in widget context)
  const widgetUI = useOptionalWidgetUI();

  // Kinetic Command System (Sprint: terminal-kinetic-commands-v1)
  const commands = useCommands({
    schema,
    customLenses: customLenses.map(c => ({ id: c.id, publicLabel: c.publicLabel })),
    onShowOverlay: (overlayType) => {
      actions.setOverlay({ type: overlayType as any });
    },
    onJourneyStart: (journeyId) => {
      // Sprint: journey-schema-unification-v1 - Unified lookup with canonical types
      const journey = getCanonicalJourney(journeyId, schema);
      console.log('[Terminal] onJourneyStart lookup:', { journeyId, found: !!journey, waypoints: journey?.waypoints?.length });
      if (journey) {
        engStartJourney(journey);
        emit.journeyStarted(journeyId, journey.waypoints.length);
      } else {
        console.warn(`[Terminal] onJourneyStart: Journey not found in registry: ${journeyId}`);
      }
    },
    onJourneyClear: () => {
      engExitJourney();
    },
    onLensSwitch: (lensId) => {
      engSelectLens(lensId);
    },
    onLensClear: () => {
      engSelectLens('freestyle');
    },
    onAddSystemMessage: (message, suggestions) => {
      const errorId = Date.now().toString();
      setTerminalState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: errorId,
          role: 'model',
          text: `${message}${suggestions ? `\n\nDid you mean: ${suggestions.join(', ')}?` : ''}`
        }]
      }));
    }
  });

  // Journey completion state now managed by useTerminalState
  // (Sprint: Terminal Architecture Refactor v1.0 - Epic 4.1)

  // Get active lens data (could be custom or archetypal)
  // FIX: Use engLens from Engagement Machine as source of truth (not session.activeLens)
  // This ensures LensPicker selection immediately updates the header pill
  const activeLensData = useMemo(() => {
    if (!engLens) return null;

    // Check for archetypal lens first
    const archetypeLens = getPersona(engLens);
    if (archetypeLens) return archetypeLens;

    // Check if it's a custom lens
    if (engLens.startsWith('custom-')) {
      const customLens = getCustomLens(engLens);
      if (customLens) {
        // Return custom lens as Persona-compatible object
        return {
          ...customLens,
          // CustomLens already has all the Persona fields
        } as unknown as Persona;
      }
    }
    return null;
  }, [engLens, getPersona, getCustomLens, customLenses]);

  // Stage-aware suggested prompts (Sprint: adaptive-engagement-v1)
  const { prompts: stagePrompts, stage: promptStage, refreshPrompts, trackSelection } = useSuggestedPrompts({
    lensId: activeLensData?.id,
    lensName: activeLensData?.publicLabel,
    maxPrompts: 3,
  });

  const enabledPersonas = getEnabledPersonas();

  // Check if we should show welcome interstitial or lens picker on first open
  useEffect(() => {
    // Wait for engagement machine to hydrate lens from URL/localStorage
    // This prevents showing lens picker during the hydration race condition
    if (!isLensHydrated) return;

    const hasBeenWelcomed = localStorage.getItem('grove-terminal-welcomed') === 'true';

    if (terminalState.isOpen && !hasBeenWelcomed && !hasShownWelcome) {
      // FIX: Use engLens (Engagement Machine) instead of session.activeLens
      // The engagement machine hydrates from URL params before NarrativeEngine
      if (engLens) {
        // Lens already hydrated (from URL or localStorage), skip picker
        localStorage.setItem('grove-terminal-welcomed', 'true');
        localStorage.setItem('grove-session-established', 'true');
        console.log('[Terminal] Lens already hydrated, skipping picker:', engLens);
        return; // Don't show picker or welcome
      }

      // No lens set - show welcome interstitial for first-time users
      // Sprint: terminal-overlay-machine-v1 - use setOverlay
      actions.setOverlay({ type: 'welcome' });
    }
  }, [terminalState.isOpen, hasShownWelcome, engLens, isLensHydrated, actions]);

  // SYNC: Engagement Machine lens → EngagementBus
  // The Engagement Machine is source of truth for lens (hydrates from URL/localStorage first).
  // EngagementBus also tracks lens for useContextState (prompts filtering).
  // This sync ensures they stay aligned.
  const lastSyncedLens = useRef<string | null>(null);
  useEffect(() => {
    if (!isLensHydrated || !engLens) return;
    if (lastSyncedLens.current === engLens) return;
    
    lastSyncedLens.current = engLens;
    
    // Determine if this is a custom lens
    const isCustom = customLenses.some(cl => cl.id === engLens);
    
    // Emit to EngagementBus so useContextState picks it up
    // Note: emit is an object with methods, not a direct function
    emit.lensSelected(engLens, isCustom, activeLensData?.archetypeId || undefined);
    
    console.log('[Terminal] Synced lens to EngagementBus:', engLens);
  }, [engLens, isLensHydrated, emit, customLenses, activeLensData?.archetypeId]);

  // Update welcome message when lens is hydrated (Sprint: genesis-context-fields-v1)
  // This ensures lens-specific prompts appear in the "You might start with" section
  const hasUpdatedWelcomeForLens = useRef<string | null>(null);
  useEffect(() => {
    const currentLens = session.activeLens;
    if (!currentLens) return;

    // Only update once per lens to avoid loops
    if (hasUpdatedWelcomeForLens.current === currentLens) return;

    // Check if terminal only has the init message (fresh session)
    const messages = terminalState.messages;
    if (messages.length === 1 && messages[0].id === 'init') {
      // Get lens-specific welcome message
      const lensMessage = getInitialTerminalMessage(currentLens);

      // Only update if different from current message (lens has custom message)
      if (lensMessage !== messages[0].text) {
        console.log('[Terminal] Updating welcome message for lens:', currentLens);
        hasUpdatedWelcomeForLens.current = currentLens;
        setTerminalState(prev => ({
          ...prev,
          messages: [{ id: 'init', role: 'model', text: lensMessage }]
        }));
      }
    }
  }, [session.activeLens, terminalState.messages, setTerminalState]);

  // Mark as welcomed after lens selection
  const handleLensSelect = (personaId: string | null) => {
    if (personaId) {
      engSelectLens(personaId);
    }
    actions.setOverlay({ type: 'none' });
    localStorage.setItem('grove-terminal-welcomed', 'true');
    localStorage.setItem('grove-session-established', 'true'); // v0.12f: Persist for returning users

    // Track lens activation via analytics
    if (personaId) {
      trackLensActivated(personaId, personaId.startsWith('custom-'));
      // Emit to Engagement Bus
      emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
      // Emit journey started event (lens selection initiates a new journey)
      emit.journeyStarted(personaId, currentThread.length || 5); // Default thread length if not yet generated
      // Sprint: active-grove-v1 - Notify parent of lens selection
      if (onLensSelected) {
        onLensSelected(personaId);
      }
    }

    // If selecting a custom lens, update its usage timestamp
    if (personaId?.startsWith('custom-')) {
      updateCustomLensUsage(personaId);
    }
  };

  // Handle opening custom lens wizard
  // Sprint: terminal-overlay-machine-v1 - use setOverlay
  const handleCreateCustomLens = () => {
    actions.setOverlay({ type: 'wizard' });
  };

  // Handle lens selection from welcome interstitial
  // Note: This is now handled by overlayHandlers.onLensSelect but kept for backward compat
  const handleWelcomeLensSelect = (personaId: string | null) => {
    if (personaId) {
      engSelectLens(personaId);
    }
    actions.setOverlay({ type: 'none' });
    localStorage.setItem('grove-terminal-welcomed', 'true');
    localStorage.setItem('grove-session-established', 'true');

    // Track lens activation
    if (personaId) {
      trackLensActivated(personaId, personaId.startsWith('custom-'));
      emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
      emit.journeyStarted(personaId, currentThread.length || 5);
      if (onLensSelected) {
        onLensSelected(personaId);
      }
    }

    if (personaId?.startsWith('custom-')) {
      updateCustomLensUsage(personaId);
    }
  };

  // Handle Create Your Own from welcome interstitial
  const handleWelcomeCreateCustomLens = () => {
    actions.setOverlay({ type: 'wizard' });
  };

  // Command Palette handlers (v0.16)
  const handleOpenModal = (modal: 'help' | 'journeys' | 'stats') => {
    actions.openModal(modal);
  };

  // Sprout System handlers (Sprint: Sprout System)
  const getLastResponse = () => {
    const messages = terminalState.messages;
    // Find the last model response
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model') {
        // Find the user query that triggered this response
        for (let j = i - 1; j >= 0; j--) {
          if (messages[j].role === 'user') {
            return {
              text: messages[i].text,
              query: messages[j].text
            };
          }
        }
        // If no user message found before it, return response with empty query
        return {
          text: messages[i].text,
          query: ''
        };
      }
    }
    return null;
  };

  const getSessionContext = () => ({
    personaId: session.activeLens || null,
    journeyId: engActiveJourneyId || null,
    hubId: null, // Hub routing happens server-side; not tracked client-side
    nodeId: currentNodeId || null
  });

  const handleCaptureSprout = (options?: { tags?: string[]; notes?: string }) => {
    const lastResponse = getLastResponse();
    if (!lastResponse) return false;

    // Build human-readable provenance with names
    const provenance: SproutProvenance = {
      lens: activeLensData
        ? { id: activeLensData.id, name: activeLensData.publicLabel }
        : null,
      hub: null, // Hub routing happens server-side; not tracked client-side
      journey: engJourney
        ? { id: engJourney.id, name: engJourney.title }
        : null,
      node: currentNodeId && schema?.nodes
        ? (() => {
            const node = (schema.nodes as Record<string, { id: string; label?: string }>)[currentNodeId];
            return node ? { id: currentNodeId, name: node.label || currentNodeId } : null;
          })()
        : null,
      knowledgeFiles: [], // Not tracked client-side (server-side RAG)
      generatedAt: new Date().toISOString()
    };

    const sprout = captureSprout({
      response: lastResponse.text,
      query: lastResponse.query,
      provenance
    }, options);

    if (sprout) {
      // Increment widget sprout count if in widget context
      widgetUI?.incrementSproutCount();
    }

    return sprout !== null;
  };

  const handleCommandLensSwitch = (lensId: string) => {
    // Find matching lens by ID or label
    const normalizedId = lensId.toLowerCase().replace(/\s+/g, '-');
    const persona = enabledPersonas.find(p =>
      p.id.toLowerCase() === normalizedId ||
      p.publicLabel.toLowerCase() === lensId.toLowerCase()
    );

    if (persona) {
      engSelectLens(persona.id);
      localStorage.setItem('grove-session-established', 'true'); // v0.12f
      trackLensActivated(persona.id, false);
      emit.lensSelected(persona.id, false, currentArchetypeId || undefined);
    } else {
      // Check custom lenses
      const customLens = customLenses.find(l =>
        l.id.toLowerCase() === normalizedId ||
        l.publicLabel?.toLowerCase() === lensId.toLowerCase()
      );
      if (customLens) {
        engSelectLens(customLens.id);
        localStorage.setItem('grove-session-established', 'true'); // v0.12f
        trackLensActivated(customLens.id, true);
        emit.lensSelected(customLens.id, true, currentArchetypeId || undefined);
      }
    }
  };

  // Handle custom lens wizard completion
  // Sprint: terminal-overlay-machine-v1 - use overlay state
  const handleCustomLensComplete = async (candidate: LensCandidate, userInputs: UserInputs) => {
    const newLens = await saveCustomLens(candidate, userInputs);
    engSelectLens(newLens.id);
    actions.setOverlay({ type: 'none' });
    localStorage.setItem('grove-terminal-welcomed', 'true');
    localStorage.setItem('grove-session-established', 'true');
    // Track and emit
    trackLensActivated(newLens.id, true);
    emit.lensSelected(newLens.id, true, currentArchetypeId || undefined);
  };

  // Handle custom lens wizard cancel
  // Sprint: terminal-overlay-machine-v1 - use overlay state
  const handleCustomLensCancel = () => {
    actions.setOverlay({ type: 'lens-picker' });
  };

  // Handle deleting a custom lens
  const handleDeleteCustomLens = async (id: string) => {
    // If deleting the active lens, clear it first
    if (engLens === id) {
      engSelectLens('freestyle'); // Clear to default lens
    }
    await deleteCustomLens(id);
  };

  // Get current archetype ID for conversion routing
  const currentArchetypeId = useMemo((): ArchetypeId | null => {
    if (!activeLensData) return null;
    // Map persona IDs to archetype IDs
    const personaToArchetype: Record<string, ArchetypeId> = {
      'academic': 'academic',
      'engineer': 'engineer',
      'concerned-citizen': 'concerned-citizen',
      'geopolitical': 'geopolitical',
      'big-ai-exec': 'big-ai-exec',
      'family-office': 'family-office'
    };
    return personaToArchetype[activeLensData.id] || 'concerned-citizen';
  }, [activeLensData]);

  // Sprint: terminal-overlay-machine-v1 - Unified overlay handlers
  const overlayHandlers: OverlayHandlers = useMemo(() => ({
    onDismiss: () => actions.setOverlay({ type: 'none' }),
    onLensSelect: (personaId: string) => {
      // Select the lens
      engSelectLens(personaId);
      // Persist welcome state
      localStorage.setItem('grove-terminal-welcomed', 'true');
      localStorage.setItem('grove-session-established', 'true');
      // Analytics
      trackLensActivated(personaId, personaId.startsWith('custom-'));
      emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
      emit.journeyStarted(personaId, currentThread.length || 5);
      // Custom lens usage tracking
      if (personaId.startsWith('custom-')) {
        updateCustomLensUsage(personaId);
      }
      // Notify parent (for Genesis headline collapse)
      if (onLensSelected) {
        onLensSelected(personaId);
      }
      // Dismiss overlay
      actions.setOverlay({ type: 'none' });
    },
    onWelcomeChooseLens: () => actions.setOverlay({ type: 'lens-picker' }),
    onWizardComplete: handleCustomLensComplete,
    onWizardCancel: handleCustomLensCancel,
    // Command palette handlers (Sprint: terminal-kinetic-commands-v1)
    onCommandSelect: async (command, subcommand) => {
      await commands.executeFromPalette(command, subcommand);
      actions.setOverlay({ type: 'none' });
    }
  }), [actions, engSelectLens, emit, currentArchetypeId, currentThread.length, updateCustomLensUsage, onLensSelected, handleCustomLensComplete, handleCustomLensCancel, commands]);

  // Keyboard shortcuts for command palette (Sprint: terminal-kinetic-commands-v1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K opens command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        actions.setOverlay({ type: 'command-palette' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  // Check for reveal triggers
  useEffect(() => {
    // Update active minutes periodically
    const interval = setInterval(() => {
      updateActiveMinutes();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [updateActiveMinutes]);

  // Trigger simulation reveal when conditions are met
  useEffect(() => {
    if (shouldShowSimReveal && !showSimulationReveal) {
      actions.setReveal('simulation', true);
      if (currentArchetypeId) {
        trackSimulationRevealShown(currentArchetypeId);
      }
    }
  }, [shouldShowSimReveal, showSimulationReveal, currentArchetypeId]);

  // Handle simulation reveal acknowledgment
  const handleSimulationRevealContinue = () => {
    if (currentArchetypeId) {
      trackSimulationRevealAcknowledged(currentArchetypeId);
    }
    acknowledgeSimulationReveal();
    actions.setReveal('simulation', false);
    // After simulation reveal, offer custom lens if applicable
    if (shouldShowLensOffer) {
      actions.setReveal('customLensOffer', true);
    }
  };

  // Handle custom lens offer
  const handleAcceptCustomLensOffer = () => {
    dismissCustomLensOffer();
    actions.setReveal('customLensOffer', false);
    actions.setOverlay({ type: 'wizard' });
  };

  const handleDeclineCustomLensOffer = () => {
    dismissCustomLensOffer();
    actions.setReveal('customLensOffer', false);
  };

  // Handle terminator mode
  const handleAcceptTerminatorMode = () => {
    trackTerminatorModeActivated();
    activateTerminatorMode();
    actions.setReveal('terminator', false);
  };

  const handleDeclineTerminatorMode = () => {
    trackTerminatorModeUnlocked();
    unlockTerminatorMode();
    actions.setReveal('terminator', false);
  };

  // Handle founder story
  const handleFounderStoryContinue = () => {
    dismissFounderStory();
    actions.setReveal('founderStory', false);
    // After founder story, show conversion CTA
    actions.setReveal('conversionCTA', true);
    markCTAViewed();
  };

  // Check for terminator mode trigger
  useEffect(() => {
    if (shouldShowTerminator && !showTerminatorPrompt && !revealState.terminatorModeUnlocked) {
      actions.setReveal('terminator', true);
    }
  }, [shouldShowTerminator, showTerminatorPrompt, revealState.terminatorModeUnlocked]);

  // Check for founder story trigger
  useEffect(() => {
    if (shouldShowFounder && !showFounderStory && !revealState.founderStoryShown) {
      actions.setReveal('founderStory', true);
      markFounderStoryShown();
      if (currentArchetypeId) {
        trackFounderStoryViewed(currentArchetypeId);
      }
    }
  }, [shouldShowFounder, showFounderStory, revealState.founderStoryShown, markFounderStoryShown, currentArchetypeId]);

  // Reset chat session when persona or section changes
  // Server-side chat now handles RAG context and system prompt construction
  useEffect(() => {
    // Reset the server-side chat session when context changes
    // The next message will automatically create a new session with fresh context
    resetChatSession();

    // Dynamic initial suggestion from schema entry points
    const entryCards = getEntryPoints(null); // Get all entry points (no persona filter)
    if (entryCards.length > 0) {
      const randomCard = entryCards[Math.floor(Math.random() * entryCards.length)];
      actions.setDynamicSuggestion(randomCard.label);
    } else {
      const defaultHint = SECTION_CONFIG[activeSection]?.promptHint || "What is The Grove?";
      actions.setDynamicSuggestion(defaultHint);
    }
    actions.setCurrentTopic('');

    console.log('Chat context changed - session will reinitialize on next message');
  }, [activeSection, activeLensData, getEntryPoints]);

  // Sprint: Terminal Architecture Refactor v1.0 - Epic 5
  // Update welcome message when lens changes
  // FIX: Use engLens (Engagement Machine) for immediate reactivity
  useEffect(() => {
    if (engLens) {
      const lensWelcome = getFormattedTerminalWelcome(
        engLens,
        schema?.lensRealities as Record<string, any> | undefined
      );

      // Update the initial message with lens-specific welcome
      setTerminalState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === 'init'
            ? { ...msg, text: lensWelcome }
            : msg
        )
      }));

      console.log('[Lens Welcome] Updated for:', engLens);
    }
  }, [engLens, schema?.lensRealities, setTerminalState]);

  // Sprint: declarative-ui-config-v1 - Lens-specific input placeholder
  // FIX: Use engLens (Engagement Machine) for immediate reactivity
  const inputPlaceholder = useMemo(() => {
    const welcome = getTerminalWelcome(
      engLens,
      schema?.lensRealities as Record<string, any> | undefined
    );
    return welcome?.placeholder;
  }, [engLens, schema?.lensRealities]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (terminalState.isOpen) {
      scrollToBottom();
      if (!showLensPicker) {
        inputRef.current?.focus();
      }
    }
  }, [terminalState.messages, terminalState.isOpen, showLensPicker]);

  // Debug: Log thread state changes
  useEffect(() => {
    console.log('[Thread State]', {
      activeLens: session.activeLens,
      threadLength: currentThread.length,
      position: currentPosition,
      firstCard: currentThread.length > 0 ? getThreadCard(0)?.label : null
    });
  }, [session.activeLens, currentThread, currentPosition, getThreadCard]);

  /**
   * Handle journey action from JourneyContent component.
   * Routes action types to appropriate XState transitions and side effects.
   * Sprint: journey-content-dex-v1
   */
  const handleJourneyAction = (
    action: WaypointAction,
    provenance: JourneyProvenance
  ) => {
    console.log('[Terminal] Journey action:', action.type, 'provenance:', provenance);

    switch (action.type) {
      case 'explore':
        // Send the waypoint prompt to chat
        if (currentWaypoint?.prompt) {
          handleSend(currentWaypoint.prompt);
        }
        break;

      case 'advance':
        advanceStep();
        break;

      case 'complete':
        completeJourney();
        // Trigger completion UI elements
        if (actions?.setReveal) {
          actions.setReveal('journeyCompletion', true);
        }
        if (actions?.setCompletedJourneyTitle) {
          actions.setCompletedJourneyTitle(engJourney?.title || '');
        }
        // Record analytics if available
        if (typeof incrementJourneysCompleted === 'function') {
          incrementJourneysCompleted();
        }
        break;

      case 'branch':
        console.warn('[Terminal] Branch action not yet implemented:', action.targetWaypoint);
        break;

      case 'custom':
        if (action.command) {
          handleSend(action.command);
        }
        break;

      default:
        console.warn('[Terminal] Unknown journey action type:', action.type);
    }
  };

  const handleSend = async (manualQuery?: string, manualDisplay?: string, nodeId?: string) => {
    const textToSend = manualQuery !== undefined ? manualQuery : input;
    if (!textToSend.trim()) return;

    // Command interception (Sprint: terminal-kinetic-commands-v1)
    // Check if input is a slash command and execute it
    if (commands.isCommand(textToSend)) {
      const result = await commands.execute(textToSend);
      actions.setInput('');
      // If command failed and we didn't show a system message, the useCommands hook already handled it
      return;
    }

    const textToDisplay = manualDisplay !== undefined ? manualDisplay : textToSend;

    // Track current node for narrative-based follow-ups
    if (nodeId) {
      // V2.1: Detect journey transitions (crossing from one journey to another)
      // This triggers journey completion when user follows a link to a different journey
      if (currentNodeId && schema?.nodes) {
        const prevNode = (schema.nodes as Record<string, { journeyId?: string }>)[currentNodeId];
        const nextNode = (schema.nodes as Record<string, { journeyId?: string }>)[nodeId];
        const prevJourneyId = prevNode?.journeyId;
        const nextJourneyId = nextNode?.journeyId;

        if (prevJourneyId && nextJourneyId && prevJourneyId !== nextJourneyId) {
          // Journey transition detected! Complete the previous journey
          console.log('[Journey] Transition detected:', { from: prevJourneyId, to: nextJourneyId });
          const completedJourney = getCanonicalJourney(prevJourneyId, schema);
          if (completedJourney) {
            // Record journey completion
            recordJourneyCompleted();
            incrementJourneysCompleted();
            emit.journeyCompleted(prevJourneyId, Math.round((Date.now() - journeyStartTime) / 60000), session.visitedCards.length);
            trackJourneyCompleted(prevJourneyId, Math.round((Date.now() - journeyStartTime) / 60000));
            // Set title and show completion modal
            actions.setCompletedJourneyTitle(completedJourney.title || 'Your Journey');
            actions.setReveal('journeyCompletion', true);
          }
        }
      }

      actions.setCurrentNodeId(nodeId);
      addVisitedCard(nodeId);
      // Emit card visited event to Engagement Bus
      emit.cardVisited(nodeId, textToDisplay, currentNodeId || undefined);
    }

    // Increment exchange count for nudge logic
    // (useEffect watches session.exchangeCount to trigger nudge)
    incrementExchangeCount();
    // Emit exchange sent event to Engagement Bus (response length will be updated after response)
    emit.exchangeSent(textToSend, 0, nodeId);

    const displayId = Date.now().toString();
    // PRESERVED: Scholar Mode (--verbose) display logic
    const finalDisplayText = isVerboseMode ? `${textToDisplay} --verbose` : textToDisplay;

    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: displayId, role: 'user', text: finalDisplayText }],
      isLoading: true
    }));
    actions.setInput('');

    const botMessageId = (Date.now() + 1).toString();
    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, { id: botMessageId, role: 'model', text: '', isStreaming: true }]
    }));

    let accumulatedRawText = "";

    try {
      // Use server-side chat API
      // Server handles: system prompt, RAG context, persona tone, verbose mode
      // V2.1: Determine journeyId for Deterministic RAG Mode
      // Priority: 1) Current node's journeyId, 2) null (Discovery Mode)
      const currentJourneyId = currentNodeId && schema?.nodes
        ? (schema.nodes as Record<string, { journeyId?: string }>)[currentNodeId]?.journeyId ?? null
        : null;

      const response = await sendMessageStream(
        textToSend,
        (chunk) => {
          accumulatedRawText += chunk;
          const cleanText = accumulatedRawText
            .replace(/\[\[BREADCRUMB:.*?\]\]/s, '')
            .replace(/\[\[TOPIC:.*?\]\]/s, '')
            .trim();

          setTerminalState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === botMessageId ? { ...msg, text: cleanText } : msg
            )
          }));
        },
        {
          sectionContext: SECTION_CONFIG[activeSection]?.title || activeSection,
          personaTone: activeLensData?.toneGuidance,
          personaBehaviors: activeLensData?.behaviors,  // Sprint: persona-behaviors-v1
          verboseMode: isVerboseMode,
          terminatorMode: terminatorModeActive,
          journeyId: currentJourneyId  // V2.1: Pass to server for Deterministic RAG
        }
      );

      // Use server-extracted breadcrumb/topic if available, fall back to client parsing
      if (response.breadcrumb) {
        actions.setDynamicSuggestion(response.breadcrumb);
      } else {
        const breadcrumbMatch = accumulatedRawText.match(/\[\[BREADCRUMB:(.*?)\]\]/);
        if (breadcrumbMatch && breadcrumbMatch[1]) {
          actions.setDynamicSuggestion(breadcrumbMatch[1].trim());
        } else {
          // Dynamic fallback: pick a random entry-point card from the schema
          const entryCards = getEntryPoints(null); // Get all entry points (no persona filter)
          if (entryCards.length > 0) {
            const randomCard = entryCards[Math.floor(Math.random() * entryCards.length)];
            actions.setDynamicSuggestion(randomCard.label);
          } else {
            actions.setDynamicSuggestion("What is The Grove, and what problem does it solve?");
          }
        }
      }

      if (response.topic) {
        actions.setCurrentTopic(response.topic);
        // Track topic for adaptive engagement via EngagementBus
        emit.topicExplored(response.topic, response.topic);
      } else {
        const topicMatch = accumulatedRawText.match(/\[\[TOPIC:(.*?)\]\]/);
        if (topicMatch && topicMatch[1]) {
          const topic = topicMatch[1].trim();
          actions.setCurrentTopic(topic);
          // Track topic for adaptive engagement via EngagementBus
          emit.topicExplored(topic, topic);
        }
      }

      // === Concept Mining Telemetry ===
      // Extract bolded terms (High Value concepts) and log to server
      const conceptMatches = accumulatedRawText.match(/\*\*(.*?)\*\*/g);
      if (conceptMatches) {
        const uniqueConcepts = Array.from(new Set(
          conceptMatches.map(m => m.slice(2, -2).trim())
        )).filter(c => c.length > 0);

        if (uniqueConcepts.length > 0) {
          fetch('/api/telemetry/concepts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              concepts: uniqueConcepts,
              // Capture a snippet of context for the Hub Generator
              context: accumulatedRawText.substring(0, 300) + (accumulatedRawText.length > 300 ? '...' : ''),
              source_node: nodeId || currentNodeId,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.warn('[Telemetry] Concept log failed', err));
        }
      }

      // === Cognitive Bridge / Entropy Evaluation ===
      // DISABLED: Epic 7 migrated entropy to engagement hooks
      // TODO: Re-enable with useEntropyState hook integration
      // The Cognitive Bridge feature is temporarily disabled until
      // the entropy detection logic is migrated to the new XState-based hooks

    } catch (error) {
      // Handle errors gracefully
      const errorMessage = formatChatError(error);
      setTerminalState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === botMessageId ? { ...msg, text: errorMessage, isStreaming: false } : msg
        )
      }));
    }

    setTerminalState(prev => ({
      ...prev,
      isLoading: false,
      messages: prev.messages.map(msg =>
        msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
      )
    }));
  };

  useEffect(() => {
    if (externalQuery && onQueryHandled) {
      handleSend(externalQuery.query, externalQuery.display, externalQuery.nodeId);
      onQueryHandled();
    }
  }, [externalQuery]);

  // PRESERVED: Scholar Mode toggle - now using actions
  const toggleVerboseMode = () => actions.toggleVerboseMode();
  const handleSuggestion = (hint: string) => {
    trackSuggestionClicked(hint);
    handleSend(hint);
  };
  const toggleTerminal = () => setTerminalState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  const handleClose = () => setTerminalState(prev => ({ ...prev, isOpen: false }));
  const handleMinimize = () => {
    setTerminalState(prev => ({ ...prev, isMinimized: true }));
    trackTerminalMinimized();
  };
  const handleExpand = () => {
    setTerminalState(prev => ({ ...prev, isMinimized: false }));
    trackTerminalExpanded();
  };

  // Get next nodes - prefer V2.1 engine nodes, then V2.0 cards, fall back to V1
  const nextNodes = useMemo(() => {
    if (!currentNodeId) return [];
    // V2.1: Try journey nodes first
    const v21Next = getNextNodes(currentNodeId);
    if (v21Next.length > 0) return v21Next;
    // V2.0: Try cards
    const v2Next = getNextCards(currentNodeId);
    if (v2Next.length > 0) return v2Next;
    // V1: Fall back to legacy nodes
    return getLegacyNextNodes(currentNodeId);
  }, [currentNodeId, getNextNodes, getNextCards, getLegacyNextNodes]);

  // V2.1 Journey context - get current journey info if in a V2.1 journey
  const v21JourneyContext = useMemo(() => {
    if (!currentNodeId || !schema) return null;

    // Check if this is a V2.1 schema with nodes
    const nodes = schema.nodes as Record<string, { journeyId?: string; primaryNext?: string; alternateNext?: string[]; sequenceOrder?: number }> | undefined;
    const journeys = (schema as { journeys?: Record<string, { id: string; title: string; description?: string }> }).journeys;

    if (!nodes || !journeys) return null;

    const currentNode = nodes[currentNodeId];
    if (!currentNode?.journeyId) return null;

    const journey = journeys[currentNode.journeyId];
    if (!journey) return null;

    // Check if we have next nodes defined (even if they don't exist yet)
    const hasPendingNext = !!currentNode.primaryNext || (currentNode.alternateNext && currentNode.alternateNext.length > 0);

    // Count total nodes in this journey
    const journeyNodes = Object.values(nodes).filter(n => n.journeyId === currentNode.journeyId);
    const totalNodes = journeyNodes.length;
    const currentOrder = currentNode.sequenceOrder || 1;

    return {
      journeyId: currentNode.journeyId,
      journeyTitle: journey.title,
      journeyDescription: journey.description,
      hasPendingNext,
      pendingNextId: currentNode.primaryNext,
      totalNodes,
      currentPosition: currentOrder,
      isIncomplete: hasPendingNext && nextNodes.length === 0  // Has next reference but node doesn't exist
    };
  }, [currentNodeId, schema, nextNodes.length]);

  // V2.1 Journey end detection - no next nodes available AND not in an incomplete journey
  const isJourneyEnd = currentNodeId && nextNodes.length === 0 && !v21JourneyContext?.isIncomplete;

  // Sprint: kinetic-stream-reset-v2 - Parse navigation blocks and rhetorical spans
  // Convert ChatMessage[] to StreamItem[] with navigation and rhetoric parsing
  const parsedStreamItems: StreamItem[] = useMemo(() => {
    return terminalState.messages.map((msg) => {
      const item = fromChatMessage(msg);

      // Preserve streaming state (only responses have isGenerating)
      if (msg.isStreaming && item.type === 'response') {
        return { ...item, isGenerating: true };
      }

      // For completed responses, parse navigation and rhetorical spans
      if (item.type === 'response' && !msg.isStreaming) {
        const { forks, cleanContent } = parseNavigation(item.content);
        const { spans } = parseRhetoric(cleanContent);

        const enhanced: ResponseStreamItem = {
          ...item,
          content: cleanContent,
          parsedSpans: spans.length > 0 ? spans : undefined,
          navigation: forks.length > 0 ? forks : undefined
        };
        return enhanced;
      }

      return item;
    });
  }, [terminalState.messages]);

  // ============================================================================
  // EMBEDDED MODE RENDERING (Sprint: active-grove-v1)
  // Bypasses TerminalShell chrome for split layout integration
  // ============================================================================
  if (variant === 'embedded') {
    return (
      <div className="chat-container flex flex-col h-full w-full bg-[var(--chat-bg)] text-[var(--chat-text)]">
        {/* Terminal Header - real component (Sprint: active-grove-v1 Fix #5) */}
        <TerminalHeader
          variant="embedded"
          isScholarMode={isVerboseMode}
          showMinimize={false}
          showClose={false}
          lensName={activeLensData?.publicLabel || 'Choose Lens'}
          lensColor={activeLensData?.color}
          journeyName={getJourney(engActiveJourneyId || '')?.title || (currentThread.length > 0 ? 'Guided' : 'Self-Guided')}
          currentStreak={currentStreak}
          showStreak={showStreakDisplay}
          stage={computedStage}
          exchangeCount={engagementState.exchangeCount}
          onLensClick={() => actions.setOverlay({ type: 'lens-picker' })}
          onJourneyClick={() => actions.setOverlay({ type: 'journey-picker' })}
          onStreakClick={() => handleOpenModal('stats')}
        />

        {/* Content Area - Sprint: terminal-overlay-machine-v1 */}
        <div className="flex-1 overflow-y-auto">
          {isOverlayActive(overlay) ? (
            <TerminalOverlayRenderer overlay={overlay} handlers={overlayHandlers} />
          ) : (
            /* Chat Messages */
            <div className="p-4 md:p-6">
              <div className="max-w-3xl mx-auto space-y-4">
              {/* Welcome Card - lens-reactive (Sprint: terminal-quantum-welcome-v1) */}
              {terminalState.messages.length === 0 && session.activeLens && (
                <TerminalWelcome
                  welcome={welcomeContent}
                  onPromptClick={(prompt, command, journeyId) => {
                    if (journeyId) {
                      // Start journey via XState (schema types with waypoints)
                      // Sprint: journey-schema-unification-v1 - Unified lookup with canonical types
                      const journey = getCanonicalJourney(journeyId, schema);
                      console.log('[Terminal] TerminalWelcome1 journey lookup:', { journeyId, found: !!journey, waypoints: journey?.waypoints?.length });
                      if (journey) {
                        engStartJourney(journey);  // XState state transition
                        emit.journeyStarted(journeyId, journey.waypoints.length);  // Telemetry
                      } else {
                        console.warn(`[Terminal] Journey not found: ${journeyId}`);
                        handleSend(prompt);  // Fallback: send as regular prompt
                      }
                    } else {
                      command ? handleSend(command) : handleSend(prompt);
                    }
                  }}
                  lensId={engLens}
                  lensName={activeLensData?.publicLabel}
                  variant="embedded"
                />
              )}
              {/* Sprint: kinetic-stream-reset-v2 - Use parsed items with navigation */}
              {parsedStreamItems.map((item) => {
                // Skip NavigationStreamItem (handled separately)
                if (item.type === 'navigation') return null;
                const isQuery = item.type === 'query';
                const isResponse = item.type === 'response';
                const content = 'content' in item ? item.content : '';
                const isSystemError = content.startsWith('SYSTEM ERROR') || content.startsWith('Error:');
                const hasNav = isResponse && 'navigation' in item && item.navigation && item.navigation.length > 0;
                const isStreaming = isResponse && 'isGenerating' in item && item.isGenerating;
                return (
                  <div key={item.id} className={`flex flex-col ${isQuery ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isQuery ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-xs font-medium ${isQuery ? 'text-[var(--chat-text-muted)]' : 'text-[var(--chat-text-accent)]'}`}>
                        {isQuery ? 'You' : 'The Grove'}
                      </span>
                    </div>
                    <div className={`${isQuery ? 'max-w-[85%]' : 'max-w-[90%]'}`}>
                      {isQuery ? (
                        <div className="bg-[var(--chat-accent)] text-[var(--chat-accent-text)] px-4 py-2.5 rounded-xl rounded-tr-sm text-sm">
                          {content.replace(' --verbose', '')}
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 rounded-xl rounded-tl-sm text-sm ${
                          isSystemError
                            ? 'bg-[var(--chat-error-bg)] text-red-300 border border-[var(--chat-error-border)]'
                            : 'bg-[var(--chat-glass)] text-[var(--chat-text)] border border-[var(--chat-glass-border)]'
                        }`}>
                          {isStreaming && !content ? (
                            <LoadingIndicator messages={globalSettings?.loadingMessages} />
                          ) : (
                            <>
                              <MarkdownRenderer content={content} onPromptClick={handleSuggestion} />
                              {isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-[var(--chat-accent)] cursor-blink align-middle"></span>}
                              {/* Sprint: kinetic-stream-reset-v2 - Navigation buttons */}
                              {hasNav && (
                                <div className="mt-4 pt-3 border-t border-[var(--chat-border)]">
                                  <div className="flex flex-wrap gap-2">
                                    {(item as any).navigation.map((fork: any) => (
                                      <button
                                        key={fork.id}
                                        onClick={() => handleSuggestion(fork.queryPayload || fork.label)}
                                        className={`fork-button fork-button--${fork.type === 'deep_dive' ? 'primary' : fork.type === 'challenge' ? 'quaternary' : fork.type === 'apply' ? 'tertiary' : 'secondary'}`}
                                      >
                                        <span className="mr-2">{fork.type === 'deep_dive' ? '↓' : fork.type === 'challenge' ? '?' : fork.type === 'apply' ? '✓' : '→'}</span>
                                        {fork.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions Area for Embedded Mode - Sprint: adaptive-engagement-v1 */}
        {/* Hide until user has sent at least one message (gateway pattern) */}
        {shouldShowInput(overlay) && terminalState.messages.some(m => m.role === 'user') && stagePrompts.length > 0 && (
          <div className="px-4 py-3 border-t border-[var(--chat-border)] bg-[var(--chat-surface)]">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] text-[var(--chat-text-accent)] font-bold uppercase tracking-widest">
                  Suggested for You
                </div>
                <button
                  onClick={refreshPrompts}
                  className="text-[var(--chat-text-muted)] hover:text-[var(--chat-text-accent)] transition-colors p-1"
                  title="Show different suggestions"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {stagePrompts.map(prompt => (
                  <button
                    key={prompt.id}
                    onClick={() => {
                      // Track selection to exclude from future suggestions
                      trackSelection(prompt.id);
                      
                      if (prompt.journeyId) {
                        // Start journey via XState (schema types with waypoints)
                        // Sprint: journey-schema-unification-v1 - Unified lookup with canonical types
                        const journey = getCanonicalJourney(prompt.journeyId, schema);
                        console.log('[Terminal] Pill button journey lookup:', { journeyId: prompt.journeyId, found: !!journey, waypoints: journey?.waypoints?.length });
                        if (journey) {
                          engStartJourney(journey);
                          emit.journeyStarted(prompt.journeyId, journey.waypoints.length);
                        } else {
                          console.warn(`[Terminal] Journey not found: ${prompt.journeyId}`);
                          handleSend(prompt.text);  // Fallback: send as regular prompt
                        }
                      } else if (prompt.command) {
                        handleSend(prompt.command);
                      } else {
                        handleSend(prompt.text);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs border rounded-full transition-colors ${
                      prompt.journeyId
                        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60 hover:border-emerald-500/50'
                        : 'bg-[var(--chat-glass)] text-[var(--chat-text)] border-[var(--chat-glass-border)] hover:bg-[var(--chat-glass-hover)] hover:border-[var(--chat-border-accent)]'
                    }`}
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DEX-Compliant Journey Content for embedded mode (Sprint: journey-content-dex-v1) */}
        {isJourneyActive && engJourney && currentWaypoint && (
          <div className="flex-shrink-0 border-t border-[var(--chat-border)] bg-[var(--chat-bg)]">
            <div className="max-w-3xl mx-auto p-4">
              <JourneyContent
                journey={engJourney}
                currentWaypoint={currentWaypoint}
                journeyProgress={journeyProgress}
                journeyTotal={journeyTotal}
                onAction={handleJourneyAction}
                onExit={engExitJourney}
              />
            </div>
          </div>
        )}

        {/* Input Area - only show when not in wizard/picker mode */}
        {/* Sprint: terminal-overlay-machine-v1 - use shouldShowInput derived state */}
        {shouldShowInput(overlay) && (
          <div className="flex-shrink-0 p-4 border-t border-[var(--chat-border)]">
            <div className="max-w-3xl mx-auto">
            <CommandInput
              onSubmitQuery={(query) => {
                actions.setInput(query);
                handleSend(query);
              }}
              disabled={terminalState.isLoading}
              onOpenModal={handleOpenModal}
              onSwitchLens={handleCommandLensSwitch}
              onShowWelcome={() => actions.setOverlay({ type: 'welcome' })}
              onShowLensPicker={() => actions.setOverlay({ type: 'lens-picker' })}
              onNavigate={navigate}
              onSwitchMode={(mode) => widgetUI?.setMode(mode as any)}
              getLastResponse={getLastResponse}
              getSessionContext={getSessionContext}
              captureSprout={handleCaptureSprout}
              embedded
              placeholder={inputPlaceholder}
            />
            </div>
          </div>
        )}

        {/* Modals for embedded mode - Sprint: adaptive-engagement-v1 */}
        {showStatsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[var(--chat-bg)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <StatsModal onClose={() => actions.closeModal('stats')} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Terminal Shell - Chrome layer (FAB, pill, drawer) */}
      {/* Sprint: Terminal Architecture Refactor v1.0 - Epic 4.2 */}
      <TerminalShell
        isOpen={terminalState.isOpen}
        isMinimized={isMinimized}
        isLoading={terminalState.isLoading}
        enableMinimize={enableMinimize}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onExpand={handleExpand}
        onToggle={toggleTerminal}
      >
          {/* Sprint: terminal-overlay-machine-v1 - Unified overlay rendering */}
          {isOverlayActive(overlay) ? (
            <TerminalOverlayRenderer overlay={overlay} handlers={overlayHandlers} />
          ) : (
            <>
              {/* Header - Clean title bar with context selectors */}
              <TerminalHeader
                onMinimize={handleMinimize}
                onClose={handleClose}
                isScholarMode={isVerboseMode}
                showMinimize={enableMinimize}
                // Context selectors
                lensName={activeLensData?.publicLabel || 'Choose Lens'}
                lensColor={activeLensData?.color}
                journeyName={getJourney(engActiveJourneyId || '')?.title || (currentThread.length > 0 ? 'Guided' : 'Self-Guided')}
                currentStreak={currentStreak}
                showStreak={showStreakDisplay}
                stage={computedStage}
                exchangeCount={engagementState.exchangeCount}
                onLensClick={() => actions.setOverlay({ type: 'lens-picker' })}
                onJourneyClick={() => actions.setOverlay({ type: 'journey-picker' })}
                onStreakClick={() => actions.openModal('stats')}
              />

              {/* Consolidated Journey Navigation Bar - hidden when controls below enabled */}
              {!enableControlsBelow && (
                <JourneyNav
                  persona={activeLensData}
                  onSwitchLens={() => actions.setOverlay({ type: 'lens-picker' })}
                  currentThread={currentThread}
                  currentPosition={currentPosition}
                  getThreadCard={getThreadCard}
                  onRegenerate={() => {
                    regenerateThread();
                    // Emit journey started event
                    if (session.activeLens) {
                      emit.journeyStarted(session.activeLens, currentThread.length);
                    }
                  }}
                  onJumpToCard={(cardId) => {
                    const card = getThreadCard(currentThread.indexOf(cardId));
                    if (card) {
                      handleSend(card.query, card.label);
                      addVisitedCard(cardId);
                    }
                  }}
                  currentStreak={currentStreak}
                  journeysCompleted={totalJourneysCompleted}
                  showStreak={showStreakDisplay}
                />
              )}

              {/* Messages Area - Thread Style */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll glass-chat-container">
                <div className="w-full max-w-[min(90%,56rem)] mx-auto space-y-6">
                {/* Welcome Card - lens-reactive (Sprint: terminal-quantum-welcome-v1) */}
                {terminalState.messages.length === 0 && session.activeLens && (
                  <TerminalWelcome
                    welcome={welcomeContent}
                    onPromptClick={(prompt, command, journeyId) => {
                      if (journeyId) {
                        // Start journey via XState (schema types with waypoints)
                        // Sprint: journey-schema-unification-v1 - Unified lookup with canonical types
                        const journey = getCanonicalJourney(journeyId, schema);
                        console.log('[Terminal] TerminalWelcome2 journey lookup:', { journeyId, found: !!journey, waypoints: journey?.waypoints?.length });
                        if (journey) {
                          engStartJourney(journey);  // XState state transition
                          emit.journeyStarted(journeyId, journey.waypoints.length);  // Telemetry
                        } else {
                          console.warn(`[Terminal] Journey not found: ${journeyId}`);
                          handleSend(prompt);  // Fallback: send as regular prompt
                        }
                      } else {
                        command ? handleSend(command) : handleSend(prompt);
                      }
                    }}
                    lensId={engLens}
                    lensName={activeLensData?.publicLabel}
                    variant={variant}
                  />
                )}
                {/* Sprint: kinetic-stream-polish-v1 - StreamRenderer with glass effects */}
                {/* Sprint: kinetic-stream-reset-v2 - Use parsed items with navigation blocks */}
                <StreamRenderer
                  items={parsedStreamItems}
                  bridgeState={bridgeState}
                  onBridgeAccept={() => {
                    // Track timing for analytics
                    const timeToDecisionMs = bridgeState.shownAt ? Date.now() - bridgeState.shownAt : 0;
                    trackCognitiveBridgeAccepted({
                      journeyId: bridgeState.journeyId!,
                      timeToDecisionMs
                    });

                    // V2.1: Start the actual journey from the schema
                    // Sprint: journey-schema-unification-v1 - Unified lookup with canonical types
                    console.log('[CognitiveBridge] onAccept clicked', {
                      journeyId: bridgeState.journeyId,
                      timeToDecisionMs,
                      schemaHasJourneys: !!schema?.journeys,
                      schemaHasNodes: !!schema?.nodes
                    });

                    // Use unified lookup for canonical Journey type
                    const journey = bridgeState.journeyId ? getCanonicalJourney(bridgeState.journeyId, schema) : null;

                    // Get entry node from schema for initial prompt (legacy journeys have entryNode)
                    const legacyJourney = schema?.journeys?.[bridgeState.journeyId!];
                    const entryNodeId = legacyJourney?.entryNode ?? journey?.waypoints?.[0]?.id;
                    const entryNode = entryNodeId && schema?.nodes
                      ? (schema.nodes as Record<string, { id: string; label: string; query: string }>)[entryNodeId]
                      : null;

                    console.log('[CognitiveBridge] Journey lookup', {
                      journey: journey ? { id: journey.id, waypoints: journey.waypoints.length } : null,
                      entryNodeId,
                      entryNode: entryNode ? { id: entryNode.id, label: entryNode.label } : null
                    });

                    if (journey && entryNode) {
                      console.log('[CognitiveBridge] Starting journey with engStartJourney():', bridgeState.journeyId);
                      // V2.1: Use engagement state machine to set active journey state
                      engStartJourney(journey);
                      // Send the entry node's query to kick off the conversation
                      handleSend(entryNode.query, entryNode.label, entryNode.id);
                      // Emit journey started event
                      emit.journeyStarted(bridgeState.journeyId!, journey.waypoints.length);
                    } else {
                      console.log('[CognitiveBridge] FALLBACK - no entry node found');
                      // Fallback: Map topic clusters to appropriate personas (legacy behavior)
                      const clusterToPersona: Record<string, string> = {
                        'ratchet': 'engineer',      // Technical AI capability concepts
                        'economics': 'family-office', // Financial/investment focus
                        'architecture': 'engineer',   // Technical architecture
                        'knowledge-commons': 'academic', // Research/publication focus
                        'observer': 'concerned-citizen'  // Meta/philosophical themes
                      };

                      const cluster = bridgeState.topicMatch;
                      const targetPersona = cluster ? clusterToPersona[cluster] : null;

                      if (targetPersona) {
                        engSelectLens(targetPersona);
                      }
                    }
                    actions.setBridgeState({ visible: false, journeyId: null, topicMatch: null, afterMessageId: null, shownAt: null, entropyScore: null, exchangeCount: null });
                  }}
                  onBridgeDismiss={() => {
                    // Track timing for analytics
                    const timeToDecisionMs = bridgeState.shownAt ? Date.now() - bridgeState.shownAt : 0;
                    trackCognitiveBridgeDismissed({
                      journeyId: bridgeState.journeyId!,
                      timeToDecisionMs
                    });
                    // recordEntropyDismiss() - DISABLED: Epic 7 migration
                    actions.setBridgeState({ visible: false, journeyId: null, topicMatch: null, afterMessageId: null, shownAt: null, entropyScore: null, exchangeCount: null });
                  }}
                  onPromptSubmit={handleSuggestion}
                  loadingMessages={globalSettings?.loadingMessages}
                />

                {/* v0.14: Inline Journey Completion (moved from fixed modal) */}
                {showJourneyCompletion && (
                  <div className="max-w-md mx-auto my-6">
                    <JourneyCompletion
                      journeyTitle={completedJourneyTitle || getJourney(engActiveJourneyId || '')?.title || (activeLensData?.publicLabel ? `${activeLensData.publicLabel} Journey` : 'Your Journey')}
                      journeyId={`${session.activeLens || 'default'}-${Date.now()}`}
                      personaId={session.activeLens}
                      completionTimeMinutes={Math.round((Date.now() - journeyStartTime) / 60000)}
                      showRating={showJourneyRatings}
                      showFeedbackTransmission={showFeedbackTransmission}
                      onSubmit={(rating, feedback, sendToFoundation) => {
                        console.log('Journey feedback:', { rating, feedback, sendToFoundation });
                        actions.setReveal('journeyCompletion', false);
                        actions.setCompletedJourneyTitle(null);
                        if (shouldShowFounder && currentArchetypeId) {
                          markFounderStoryShown();
                        }
                      }}
                      onSkip={() => {
                        actions.setReveal('journeyCompletion', false);
                        actions.setCompletedJourneyTitle(null);
                      }}
                    />
                  </div>
                )}

                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Interactions Area */}
              <div className="border-t border-[var(--glass-border)] bg-[var(--glass-solid)]">
                <div className="max-w-3xl mx-auto p-6">

                {/* DEX-Compliant Journey Content (Sprint: journey-content-dex-v1) */}
                {isJourneyActive && engJourney && currentWaypoint ? (
                  <JourneyContent
                    journey={engJourney}
                    currentWaypoint={currentWaypoint}
                    journeyProgress={journeyProgress}
                    journeyTotal={journeyTotal}
                    onAction={handleJourneyAction}
                    onExit={engExitJourney}
                  />
                ) : v21JourneyContext?.isIncomplete ? (
                  /* V2.1 Journey In Progress - incomplete journey (next node not yet defined) */
                  <div className="mb-4 bg-paper/50 border border-ink/10 rounded-lg p-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-grove-forest mb-2">
                      Journey: {v21JourneyContext.journeyTitle}
                    </div>
                    <div className="text-xs text-ink-muted mb-3">
                      You've reached the current edge of this journey ({v21JourneyContext.currentPosition}/{v21JourneyContext.totalNodes} nodes explored).
                      More content is being developed.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          // Continue exploring the topic freely
                          actions.setCurrentNodeId(null);
                        }}
                        className="px-3 py-2 bg-grove-forest/10 border border-grove-forest/20 rounded-sm text-xs font-sans text-grove-forest hover:bg-grove-forest/20 transition-all"
                      >
                        Continue Exploring Freely
                      </button>
                      <button
                        onClick={() => actions.setOverlay({ type: 'lens-picker' })}
                        className="px-3 py-2 bg-white border border-ink/10 rounded-sm text-xs font-sans text-ink-muted hover:border-ink/20 hover:text-ink transition-all"
                      >
                        Try a Different Lens
                      </button>
                    </div>
                  </div>
                ) : isJourneyEnd ? (
                  /* V2.1 Journey Complete Panel - replaces JourneyEnd component */
                  <div className="mb-4 bg-paper/50 border border-grove-forest/20 rounded-lg p-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-grove-forest mb-2">
                      Journey Complete
                    </div>
                    <div className="text-xs text-ink-muted mb-3">
                      You've explored this path. What's next?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          engExitJourney();
                          actions.setCurrentNodeId(null);
                        }}
                        className="px-3 py-2 bg-grove-forest/10 border border-grove-forest/20 rounded-sm text-xs font-sans text-grove-forest hover:bg-grove-forest/20 transition-all"
                      >
                        Explore Freely
                      </button>
                      <button
                        onClick={() => actions.setOverlay({ type: 'lens-picker' })}
                        className="px-3 py-2 bg-white border border-ink/10 rounded-sm text-xs font-sans text-ink-muted hover:border-ink/20 hover:text-ink transition-all"
                      >
                        Try a Different Lens
                      </button>
                    </div>
                  </div>
                ) : nextNodes.length > 0 ? (
                  /* Curated Narrative Follow-ups - Clickable Suggestion Chips */
                  <div className="mb-4">
                    <div className="text-[9px] text-grove-clay font-bold uppercase tracking-widest mb-2">
                      Continue the Journey
                    </div>
                    <div className="space-y-1.5">
                      {nextNodes.map(node => (
                        <SuggestionChip
                          key={node.id}
                          prompt={node.label}
                          onClick={() => {
                            trackSuggestionClicked(node.label, node.id);
                            handleSend(node.query, node.label, node.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : currentThread.length > 0 && currentPosition < currentThread.length ? (
                  /* v0.14: Minimal journey card - context now in header */
                  <JourneyCard
                    currentPosition={currentPosition}
                    totalCards={currentThread.length}
                    currentCard={getThreadCard(currentPosition)}
                    onResume={() => {
                      const card = getThreadCard(currentPosition);
                      if (card) {
                        handleSend(card.query, card.label, card.id);
                        const nextCardId = advanceThread();
                        if (nextCardId === null && currentPosition >= currentThread.length - 1) {
                          actions.setReveal('journeyCompletion', true);
                          recordJourneyCompleted();
                          incrementJourneysCompleted();
                        }
                      }
                    }}
                  />
                ) : stagePrompts.length > 0 && terminalState.messages.some(m => m.role === 'user') ? (
                  /* Stage-aware suggested prompts - hidden until user sends first message (gateway pattern) */
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] text-[var(--neon-cyan)] font-bold uppercase tracking-widest">
                        Suggested for You
                      </div>
                      <button
                        onClick={refreshPrompts}
                        className="text-[var(--glass-text-subtle)] hover:text-[var(--neon-cyan)] transition-colors p-1"
                        title="Show different suggestions"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {stagePrompts.map(prompt => (
                        prompt.journeyId ? (
                          // Journey suggestion - styled differently
                          <button
                            key={prompt.id}
                            onClick={() => {
                              // Track selection to exclude from future suggestions
                              trackSelection(prompt.id);
                              
                              // Sprint: journey-schema-unification-v1 - Unified lookup with canonical types
                              const journey = getCanonicalJourney(prompt.journeyId!, schema);
                              if (journey) {
                                engStartJourney(journey);
                                emit.journeyStarted(prompt.journeyId!, journey.waypoints.length);
                              } else {
                                console.warn(`[Terminal] Journey pill click: Journey not found: ${prompt.journeyId}`);
                                handleSend(prompt.text);
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-sm bg-emerald-900/30 text-emerald-300 border border-emerald-700/40 rounded-lg hover:bg-emerald-900/50 hover:border-emerald-500/50 transition-colors"
                          >
                            {prompt.text}
                          </button>
                        ) : (
                          <SuggestionChip
                            key={prompt.id}
                            prompt={prompt.text}
                            onClick={() => {
                              // Track selection to exclude from future suggestions
                              trackSelection(prompt.id);
                              
                              if (prompt.command) {
                                handleSend(prompt.command);
                              } else {
                                handleSend(prompt.text);
                              }
                            }}
                          />
                        )
                      ))}
                    </div>
                  </div>
) : null}
                {/* Suggested Inquiry button removed - was taking up real estate without clear value */}

                <div className="flex items-center space-x-3 mb-4">
                  {/* v0.13: Scholar Mode button restyled for glass */}
                  <button
                    onClick={toggleVerboseMode}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${isVerboseMode
                        ? 'bg-[var(--neon-green)] text-white shadow-sm'
                        : 'bg-transparent text-[var(--glass-text-subtle)] border border-[var(--glass-border)] hover:border-[var(--neon-green)] hover:text-[var(--neon-green)]'
                      }`}
                  >
                    {isVerboseMode ? 'Scholar Mode: ON' : 'Enable Scholar Mode'}
                  </button>
                  {currentTopic && <span className="text-[10px] font-mono text-[var(--glass-text-subtle)]">Ref: {currentTopic}</span>}
                </div>

                {/* Input Area - Command Palette enabled (v0.16) */}
                <CommandInput
                  onSubmitQuery={(query) => {
                    actions.setInput(query);
                    handleSend(query);
                  }}
                  disabled={terminalState.isLoading}
                  onOpenModal={handleOpenModal}
                  onSwitchLens={handleCommandLensSwitch}
                  onShowWelcome={() => actions.setOverlay({ type: 'welcome' })}
                  onShowLensPicker={() => actions.setOverlay({ type: 'lens-picker' })}
                  onNavigate={navigate}
                  onSwitchMode={(mode) => widgetUI?.setMode(mode as any)}
                  // Sprout System (Sprint: Sprout System)
                  getLastResponse={getLastResponse}
                  getSessionContext={getSessionContext}
                  captureSprout={handleCaptureSprout}
                  placeholder={inputPlaceholder}
                />

                {/* v0.13: TerminalControls removed - lens/streak moved to header */}
                </div>
              </div>
            </>
          )}
      </TerminalShell>

      {/* Sprint: Terminal Architecture Refactor v1.0 - Epic 4.3 */}
      {/* TerminalFlow handles: Reveal overlays + Modals (interstitials stay inside shell) */}
      <TerminalFlow
        // Flow interstitials - FALSE to prevent double-rendering (they're inside TerminalShell)
        showWelcome={false}
        showLensPicker={false}
        showCustomLensWizard={false}

        // Reveal states
        showSimulationReveal={showSimulationReveal}
        showCustomLensOffer={showCustomLensOffer}
        showTerminatorPrompt={showTerminatorPrompt}
        showFounderStory={showFounderStory}
        showConversionCTA={showConversionCTA}
        showJourneyCompletion={false}
        terminatorModeActive={terminatorModeActive}

        // Modal states
        showHelpModal={showHelpModal}
        showStatsModal={showStatsModal}

        // Data
        currentArchetypeId={currentArchetypeId}
        activeLensData={activeLensData}
        enabledPersonas={enabledPersonas}
        customLenses={customLenses}
        completedJourneyTitle={completedJourneyTitle}
        journeyStartTime={journeyStartTime}
        activeJourneyId={engActiveJourneyId}

        // Feature flags (not used for reveals/modals but required by props)
        showCustomLensInPicker={showCustomLensInPicker}
        showJourneyRatings={showJourneyRatings}
        showFeedbackTransmission={showFeedbackTransmission}

        // Handlers - Lens selection (not used but required)
        onLensSelect={handleLensSelect}
        onWelcomeLensSelect={handleWelcomeLensSelect}
        onCreateCustomLens={handleCreateCustomLens}
        onDeleteCustomLens={handleDeleteCustomLens}
        onCustomLensComplete={handleCustomLensComplete}
        onCustomLensCancel={handleCustomLensCancel}

        // Handlers - Reveals
        onSimulationContinue={handleSimulationRevealContinue}
        onCustomLensOfferAccept={handleAcceptCustomLensOffer}
        onCustomLensOfferDecline={handleDeclineCustomLensOffer}
        onTerminatorAccept={handleAcceptTerminatorMode}
        onTerminatorDecline={handleDeclineTerminatorMode}
        onFounderStoryContinue={handleFounderStoryContinue}
        onConversionDismiss={() => actions.setReveal('conversionCTA', false)}
        onConversionCTAClick={(ctaId) => trackCtaClicked(currentArchetypeId!, ctaId, 'modal')}

        // Handlers - Journey completion (not used inline but required)
        onJourneyCompletionSubmit={() => {}}
        onJourneyCompletionSkip={() => {}}

        // Handlers - Modals
        onCloseHelpModal={() => actions.closeModal('help')}
        onCloseStatsModal={() => actions.closeModal('stats')}

        // Handlers - LensPicker (not used but required)
        onLensPickerBack={() => actions.setOverlay({ type: 'none' })}
        onLensPickerAfterSelect={() => {}}

        // URL lens support
        urlLensId={urlLensId}
      />
    </>
  );
};

export default Terminal;
