import React, { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerminalState, ChatMessage, SectionId } from '../types';
import {
  sendMessageStream,
  resetSession as resetChatSession,
  formatChatError
} from '../services/chatService';
import { SECTION_CONFIG } from '../constants';
import { useNarrative } from '../hooks/useNarrative';
import { useNarrativeEngine } from '../hooks/useNarrativeEngine';
import { useCustomLens } from '../hooks/useCustomLens';
import { useEngagementBridge } from '../hooks/useEngagementBridge';
import { useEngagement, useLensState, useJourneyState, useEntropyState } from '@core/engagement';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { LensBadge, CustomLensWizard, JourneyCard, JourneyCompletion, JourneyNav, LoadingIndicator, TerminalHeader, TerminalPill, SuggestionChip, MarkdownRenderer, TerminalShell, TerminalFlow, useTerminalState, TerminalWelcome, shouldShowInput, TerminalOverlayRenderer, isOverlayActive } from './Terminal/index';
import { useCommands } from './Terminal/useCommands';
import type { OverlayHandlers } from './Terminal/index';
// Note: WelcomeInterstitial, LensPicker, JourneyList now rendered via TerminalOverlayRenderer
import CognitiveBridge from './Terminal/CognitiveBridge';
import { useStreakTracking } from '../hooks/useStreakTracking';
import { useSproutCapture } from '../hooks/useSproutCapture';
import { telemetryCollector } from '../src/lib/telemetry';
import { SproutProvenance } from '../src/core/schema/sprout';
import { useOptionalWidgetUI } from '../src/widget/WidgetUIContext';
import { Card, Persona, JourneyNode, Journey } from '../data/narratives-schema';
import { getPersona } from '../data/default-personas';
import { getFormattedTerminalWelcome, getTerminalWelcome, DEFAULT_TERMINAL_WELCOME } from '../src/data/quantum-content';
import { useQuantumInterface } from '../src/surface/hooks/useQuantumInterface';
import { LensCandidate, UserInputs, isCustomLens, ArchetypeId } from '../types/lens';
// Reveal components now handled by TerminalFlow (Epic 4.3)
// SimulationReveal, CustomLensOffer, TerminatorMode, FounderStory, ConversionCTA
import { CommandInput } from './Terminal/CommandInput';
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
  const showGardenModal = uiState.modals.garden;

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
  const { lens: engLens, selectLens: engSelectLens } = useLensState({ actor });
  const {
    journey: engJourney,
    isActive: isJourneyActive,
    startJourney: engStartJourney,
    advanceStep,
    exitJourney: engExitJourney
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
      const journey = getJourney(journeyId);
      if (journey) {
        engStartJourney(journey);
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

  const enabledPersonas = getEnabledPersonas();

  // Check if we should show welcome interstitial or lens picker on first open
  useEffect(() => {
    const hasBeenWelcomed = localStorage.getItem('grove-terminal-welcomed') === 'true';

    if (terminalState.isOpen && !hasBeenWelcomed && !hasShownWelcome) {
      // Epic 5 Fix: If URL lens is present AND already hydrated, skip picker entirely
      if (urlLensId && session.activeLens === urlLensId) {
        // Lens already set via useLensHydration, skip to chat
        localStorage.setItem('grove-terminal-welcomed', 'true');
        localStorage.setItem('grove-session-established', 'true');
        console.log('[Terminal] URL lens hydrated, skipping picker:', urlLensId);
        return; // Don't show picker or welcome
      }

      // v0.12e: If there's a URL lens but not yet hydrated, show LensPicker (with lens highlighted)
      // Otherwise, show welcome interstitial for first-time users
      // Sprint: terminal-overlay-machine-v1 - use setOverlay
      if (urlLensId) {
        actions.setOverlay({ type: 'lens-picker' });
      } else {
        actions.setOverlay({ type: 'welcome' });
      }
    }
  }, [terminalState.isOpen, hasShownWelcome, urlLensId, session.activeLens, actions]);

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
      // Track journey start for adaptive engagement telemetry
      telemetryCollector.update({ type: 'journey_start', payload: { journeyId: personaId, explicit: true } });
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
      // Track journey start for adaptive engagement telemetry
      telemetryCollector.update({ type: 'journey_start', payload: { journeyId: personaId, explicit: true } });
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
  const handleOpenModal = (modal: 'help' | 'journeys' | 'stats' | 'garden') => {
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
      // Track journey start for adaptive engagement telemetry
      telemetryCollector.update({ type: 'journey_start', payload: { journeyId: personaId, explicit: true } });
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
          const completedJourney = schema?.journeys?.[prevJourneyId];
          if (completedJourney) {
            // Record journey completion
            recordJourneyCompleted();
            incrementJourneysCompleted();
            emit.journeyCompleted(prevJourneyId, Math.round((Date.now() - journeyStartTime) / 60000), session.visitedCards.length);
            trackJourneyCompleted(prevJourneyId, Math.round((Date.now() - journeyStartTime) / 60000));
            // Track journey completion for adaptive engagement telemetry
            telemetryCollector.update({ type: 'journey_complete', payload: { journeyId: prevJourneyId } });
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
    // Track exchange for adaptive engagement telemetry
    telemetryCollector.update({ type: 'exchange' });

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
        // Track topic for adaptive engagement telemetry
        telemetryCollector.update({ type: 'topic', payload: { topicId: response.topic } });
      } else {
        const topicMatch = accumulatedRawText.match(/\[\[TOPIC:(.*?)\]\]/);
        if (topicMatch && topicMatch[1]) {
          const topic = topicMatch[1].trim();
          actions.setCurrentTopic(topic);
          // Track topic for adaptive engagement telemetry
          telemetryCollector.update({ type: 'topic', payload: { topicId: topic } });
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
                  onPromptClick={(prompt, command) => command ? handleSend(command) : handleSend(prompt)}
                  lensId={engLens}
                  lensName={activeLensData?.publicLabel}
                  variant="embedded"
                />
              )}
              {terminalState.messages.map((msg) => {
                const isSystemError = msg.text.startsWith('SYSTEM ERROR') || msg.text.startsWith('Error:');
                return (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-[var(--chat-text-muted)]' : 'text-[var(--chat-text-accent)]'}`}>
                        {msg.role === 'user' ? 'You' : 'The Grove'}
                      </span>
                    </div>
                    <div className={`${msg.role === 'user' ? 'max-w-[85%]' : 'max-w-[90%]'}`}>
                      {msg.role === 'user' ? (
                        <div className="bg-[var(--chat-accent)] text-[var(--chat-accent-text)] px-4 py-2.5 rounded-xl rounded-tr-sm text-sm">
                          {msg.text.replace(' --verbose', '')}
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 rounded-xl rounded-tl-sm text-sm ${
                          isSystemError
                            ? 'bg-[var(--chat-error-bg)] text-red-300 border border-[var(--chat-error-border)]'
                            : 'bg-[var(--chat-glass)] text-[var(--chat-text)] border border-[var(--chat-glass-border)]'
                        }`}>
                          {msg.isStreaming && !msg.text ? (
                            <LoadingIndicator messages={globalSettings?.loadingMessages} />
                          ) : (
                            <>
                              <MarkdownRenderer content={msg.text} onPromptClick={handleSuggestion} />
                              {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-[var(--chat-accent)] cursor-blink align-middle"></span>}
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
                      // Track journey start for adaptive engagement telemetry
                      telemetryCollector.update({ type: 'journey_start', payload: { journeyId: session.activeLens, explicit: true } });
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
                    onPromptClick={(prompt, command) => command ? handleSend(command) : handleSend(prompt)}
                    lensId={engLens}
                    lensName={activeLensData?.publicLabel}
                    variant={variant}
                  />
                )}
                {terminalState.messages.map((msg) => {
                  const isSystemError = msg.text.startsWith('SYSTEM ERROR') || msg.text.startsWith('Error:');
                  const showBridgeAfterThis = bridgeState.visible && bridgeState.afterMessageId === msg.id;

                  return (
                    <React.Fragment key={msg.id}>
                      <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Message Label */}
                        <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'user' ? (
                            <span className="text-xs font-semibold text-[var(--glass-text-subtle)]">You</span>
                          ) : (
                            <span className="text-xs font-semibold text-[var(--neon-green)]">The Grove</span>
                          )}
                        </div>
                        {/* Message Bubble */}
                        <div className={`${msg.role === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[90%] md:max-w-[85%]'}`}>
                          {msg.role === 'user' ? (
                            <div className="glass-message glass-message-user">
                              <p className="text-sm md:text-base leading-relaxed">
                                {msg.text.replace(' --verbose', '')}
                              </p>
                            </div>
                          ) : (
                            <div className={`glass-message ${
                              isSystemError
                                ? 'glass-message-error'
                                : 'glass-message-assistant'
                            }`}>
                              {msg.isStreaming && !msg.text ? (
                                /* Show loading messages while waiting for first chunk */
                                <LoadingIndicator messages={globalSettings?.loadingMessages} />
                              ) : (
                                <>
                                  <MarkdownRenderer
                                    content={msg.text}
                                    onPromptClick={handleSuggestion}
                                  />
                                  {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-slate-500 dark:bg-slate-400 cursor-blink align-middle"></span>}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Cognitive Bridge - inline injection after triggering message */}
                      {showBridgeAfterThis && bridgeState.journeyId && bridgeState.topicMatch && (
                        <CognitiveBridge
                          journeyId={bridgeState.journeyId}
                          topicMatch={bridgeState.topicMatch}
                          onAccept={() => {
                            // Track timing for analytics
                            const timeToDecisionMs = bridgeState.shownAt ? Date.now() - bridgeState.shownAt : 0;
                            trackCognitiveBridgeAccepted({
                              journeyId: bridgeState.journeyId!,
                              timeToDecisionMs
                            });

                            // V2.1: Start the actual journey from the schema
                            console.log('[CognitiveBridge] onAccept clicked', {
                              journeyId: bridgeState.journeyId,
                              timeToDecisionMs,
                              schemaHasJourneys: !!schema?.journeys,
                              schemaHasNodes: !!schema?.nodes,
                              journeyKeys: schema?.journeys ? Object.keys(schema.journeys) : [],
                              nodeKeys: schema?.nodes ? Object.keys(schema.nodes).slice(0, 5) : []
                            });

                            const journey = schema?.journeys?.[bridgeState.journeyId!];
                            const entryNodeId = journey?.entryNode;
                            const entryNode = entryNodeId && schema?.nodes
                              ? (schema.nodes as Record<string, { id: string; label: string; query: string }>)[entryNodeId]
                              : null;

                            console.log('[CognitiveBridge] Journey lookup', {
                              journey: journey ? { id: journey.id, title: journey.title, entryNode: journey.entryNode } : null,
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
                              emit.journeyStarted(bridgeState.journeyId!, journey.estimatedMinutes || 5);
                              // Track journey start for adaptive engagement telemetry
                              telemetryCollector.update({ type: 'journey_start', payload: { journeyId: bridgeState.journeyId, explicit: true } });
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
                          onDismiss={() => {
                            // Track timing for analytics
                            const timeToDecisionMs = bridgeState.shownAt ? Date.now() - bridgeState.shownAt : 0;
                            trackCognitiveBridgeDismissed({
                              journeyId: bridgeState.journeyId!,
                              timeToDecisionMs
                            });
                            // recordEntropyDismiss() - DISABLED: Epic 7 migration
                            actions.setBridgeState({ visible: false, journeyId: null, topicMatch: null, afterMessageId: null, shownAt: null, entropyScore: null, exchangeCount: null });
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

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

                {/* V2.1 Journey In Progress - incomplete journey (next node not yet defined) */}
                {v21JourneyContext?.isIncomplete ? (
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
        showGardenModal={showGardenModal}

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
        onCloseGardenModal={() => actions.closeModal('garden')}
        onViewFullStats={() => {
          actions.closeModal('garden');
          actions.openModal('stats');
        }}

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
