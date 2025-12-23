import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { LensBadge, CustomLensWizard, JourneyCard, JourneyCompletion, JourneyNav, LoadingIndicator, TerminalHeader, TerminalPill, SuggestionChip, MarkdownRenderer, TerminalShell } from './Terminal/index';
import WelcomeInterstitial from './Terminal/WelcomeInterstitial';
import { LensPicker } from '../src/explore/LensPicker';
import CognitiveBridge from './Terminal/CognitiveBridge';
import { useStreakTracking } from '../hooks/useStreakTracking';
import { useSproutCapture } from '../hooks/useSproutCapture';
import { Card, Persona, JourneyNode, Journey } from '../data/narratives-schema';
import { LensCandidate, UserInputs, isCustomLens, ArchetypeId } from '../types/lens';
import SimulationReveal from './Terminal/Reveals/SimulationReveal';
import CustomLensOffer from './Terminal/Reveals/CustomLensOffer';
import { TerminatorModePrompt, TerminatorModeOverlay, TerminatorResponseMetadata } from './Terminal/Reveals/TerminatorMode';
import FounderStory from './Terminal/Reveals/FounderStory';
import ConversionCTAPanel from './Terminal/ConversionCTA';
import { CommandInput } from './Terminal/CommandInput';
import { HelpModal, JourneysModal, StatsModal, GardenModal } from './Terminal/Modals';
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
}

// System prompt is now server-side in /api/chat
// See server.js TERMINAL_SYSTEM_PROMPT for the canonical version

// NOTE: MarkdownRenderer is now imported from ./Terminal/index
// (Sprint: Terminal Architecture Refactor v1.0 - Epic 4 integration)

const Terminal: React.FC<TerminalProps> = ({ activeSection, terminalState, setTerminalState, externalQuery, onQueryHandled }) => {
  const [input, setInput] = useState('');
  const [dynamicSuggestion, setDynamicSuggestion] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [isVerboseMode, setIsVerboseMode] = useState<boolean>(false);
  // RAG context is now handled server-side in /api/chat
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [showLensPicker, setShowLensPicker] = useState<boolean>(false);
  const [showCustomLensWizard, setShowCustomLensWizard] = useState<boolean>(false);
  const [showWelcomeInterstitial, setShowWelcomeInterstitial] = useState<boolean>(false);
  const [hasShownWelcome, setHasShownWelcome] = useState<boolean>(false);
  // Note: showNudge, nudgeDismissed, showLensChoice removed - all users now have a lens (min: freestyle)
  const [showSimulationReveal, setShowSimulationReveal] = useState<boolean>(false);
  const [showCustomLensOffer, setShowCustomLensOffer] = useState<boolean>(false);
  const [showTerminatorPrompt, setShowTerminatorPrompt] = useState<boolean>(false);
  const [showFounderStory, setShowFounderStory] = useState<boolean>(false);
  const [showConversionCTA, setShowConversionCTA] = useState<boolean>(false);
  // Command Palette modal state (v0.16)
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showJourneysModal, setShowJourneysModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showGardenModal, setShowGardenModal] = useState<boolean>(false);
  // Cognitive Bridge state
  const [bridgeState, setBridgeState] = useState<{
    visible: boolean;
    journeyId: string | null;
    topicMatch: string | null;
    afterMessageId: string | null;  // Message ID after which to show the bridge
    shownAt: number | null;         // Timestamp when bridge was shown (for timing analytics)
    entropyScore: number | null;    // Entropy score that triggered the bridge
    exchangeCount: number | null;   // Exchange count when bridge triggered
  }>({ visible: false, journeyId: null, topicMatch: null, afterMessageId: null, shownAt: null, entropyScore: null, exchangeCount: null });

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

  // V2.1 Narrative Engine
  const {
    schema,
    session,
    selectLens,
    getActiveLensData,
    getEnabledPersonas,
    getEntryPoints,
    getNextCards,
    // V2.1 Journey Navigation
    startJourney,
    advanceNode,
    exitJourney,
    getJourney,
    getNode,
    getNextNodes,
    activeJourneyId,
    currentNodeId: engineCurrentNodeId,
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
    // Entropy / Cognitive Bridge
    entropyState,
    evaluateEntropy,
    checkShouldInject,
    recordEntropyInjection,
    recordEntropyDismiss,
    tickEntropyCooldown,
    getJourneyIdForCluster,
    // v0.12e: First-time user detection and URL lens
    isFirstTimeUser,
    urlLensId
  } = useNarrativeEngine();

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
    emit
  } = useEngagementBridge();

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

  // Journey completion state
  const [showJourneyCompletion, setShowJourneyCompletion] = useState(false);
  const [journeyStartTime] = useState(Date.now());
  const [completedJourneyTitle, setCompletedJourneyTitle] = useState<string | null>(null);

  // Get active lens data (could be custom or archetypal)
  const activeLensData = useMemo(() => {
    const archetypeLens = getActiveLensData();
    if (archetypeLens) return archetypeLens;

    // Check if it's a custom lens
    if (session.activeLens?.startsWith('custom-')) {
      const customLens = getCustomLens(session.activeLens);
      if (customLens) {
        // Return custom lens as Persona-compatible object
        return {
          ...customLens,
          // CustomLens already has all the Persona fields
        } as unknown as Persona;
      }
    }
    return null;
  }, [getActiveLensData, session.activeLens, getCustomLens, customLenses]);

  const enabledPersonas = getEnabledPersonas();

  // Check if we should show welcome interstitial or lens picker on first open
  useEffect(() => {
    const hasBeenWelcomed = localStorage.getItem('grove-terminal-welcomed') === 'true';

    if (terminalState.isOpen && !hasBeenWelcomed && !hasShownWelcome) {
      // v0.12e: If there's a URL lens, show LensPicker (with lens highlighted)
      // Otherwise, show welcome interstitial for first-time users
      if (urlLensId) {
        setShowLensPicker(true);
      } else {
        setShowWelcomeInterstitial(true);
      }
      setHasShownWelcome(true);
    }
  }, [terminalState.isOpen, hasShownWelcome, urlLensId]);

  // Mark as welcomed after lens selection
  const handleLensSelect = (personaId: string | null) => {
    selectLens(personaId);
    setShowLensPicker(false);
    localStorage.setItem('grove-terminal-welcomed', 'true');
    localStorage.setItem('grove-session-established', 'true'); // v0.12f: Persist for returning users

    // Track lens activation via analytics
    if (personaId) {
      trackLensActivated(personaId, personaId.startsWith('custom-'));
      // Emit to Engagement Bus
      emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
      // Emit journey started event (lens selection initiates a new journey)
      emit.journeyStarted(personaId, currentThread.length || 5); // Default thread length if not yet generated
    }

    // If selecting a custom lens, update its usage timestamp
    if (personaId?.startsWith('custom-')) {
      updateCustomLensUsage(personaId);
    }
  };

  // Handle opening custom lens wizard
  const handleCreateCustomLens = () => {
    setShowLensPicker(false);
    setShowCustomLensWizard(true);
  };

  // Handle lens selection from welcome interstitial
  const handleWelcomeLensSelect = (personaId: string | null) => {
    selectLens(personaId);
    setShowWelcomeInterstitial(false);
    localStorage.setItem('grove-terminal-welcomed', 'true');
    localStorage.setItem('grove-session-established', 'true'); // v0.12f: Persist for returning users

    // Track lens activation
    if (personaId) {
      trackLensActivated(personaId, personaId.startsWith('custom-'));
      emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
      emit.journeyStarted(personaId, currentThread.length || 5);
    }

    if (personaId?.startsWith('custom-')) {
      updateCustomLensUsage(personaId);
    }
  };

  // Handle Create Your Own from welcome interstitial
  const handleWelcomeCreateCustomLens = () => {
    setShowWelcomeInterstitial(false);
    setShowCustomLensWizard(true);
  };

  // Command Palette handlers (v0.16)
  const handleOpenModal = (modal: 'help' | 'journeys' | 'stats' | 'garden') => {
    if (modal === 'help') setShowHelpModal(true);
    if (modal === 'journeys') setShowJourneysModal(true);
    if (modal === 'stats') setShowStatsModal(true);
    if (modal === 'garden') setShowGardenModal(true);
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
    journeyId: activeJourneyId || null,
    hubId: null, // Hub routing happens server-side; not tracked client-side
    nodeId: engineCurrentNodeId || currentNodeId || null
  });

  const handleCaptureSprout = (options?: { tags?: string[]; notes?: string }) => {
    const lastResponse = getLastResponse();
    if (!lastResponse) return false;

    const context = getSessionContext();
    const sprout = captureSprout({
      response: lastResponse.text,
      query: lastResponse.query,
      ...context
    }, options);

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
      selectLens(persona.id);
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
        selectLens(customLens.id);
        localStorage.setItem('grove-session-established', 'true'); // v0.12f
        trackLensActivated(customLens.id, true);
        emit.lensSelected(customLens.id, true, currentArchetypeId || undefined);
      }
    }
  };

  // Handle custom lens wizard completion
  const handleCustomLensComplete = async (candidate: LensCandidate, userInputs: UserInputs) => {
    const newLens = await saveCustomLens(candidate, userInputs);
    selectLens(newLens.id);
    setShowCustomLensWizard(false);
    localStorage.setItem('grove-terminal-welcomed', 'true');
    localStorage.setItem('grove-session-established', 'true'); // v0.12f: Persist for returning users
  };

  // Handle custom lens wizard cancel
  const handleCustomLensCancel = () => {
    setShowCustomLensWizard(false);
    setShowLensPicker(true);
  };

  // Handle deleting a custom lens
  const handleDeleteCustomLens = async (id: string) => {
    // If deleting the active lens, clear it first
    if (session.activeLens === id) {
      selectLens(null);
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
      setShowSimulationReveal(true);
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
    setShowSimulationReveal(false);
    // After simulation reveal, offer custom lens if applicable
    if (shouldShowLensOffer) {
      setShowCustomLensOffer(true);
    }
  };

  // Handle custom lens offer
  const handleAcceptCustomLensOffer = () => {
    dismissCustomLensOffer();
    setShowCustomLensOffer(false);
    setShowCustomLensWizard(true);
  };

  const handleDeclineCustomLensOffer = () => {
    dismissCustomLensOffer();
    setShowCustomLensOffer(false);
  };

  // Handle terminator mode
  const handleAcceptTerminatorMode = () => {
    trackTerminatorModeActivated();
    activateTerminatorMode();
    setShowTerminatorPrompt(false);
  };

  const handleDeclineTerminatorMode = () => {
    trackTerminatorModeUnlocked();
    unlockTerminatorMode();
    setShowTerminatorPrompt(false);
  };

  // Handle founder story
  const handleFounderStoryContinue = () => {
    dismissFounderStory();
    setShowFounderStory(false);
    // After founder story, show conversion CTA
    setShowConversionCTA(true);
    markCTAViewed();
  };

  // Check for terminator mode trigger
  useEffect(() => {
    if (shouldShowTerminator && !showTerminatorPrompt && !revealState.terminatorModeUnlocked) {
      setShowTerminatorPrompt(true);
    }
  }, [shouldShowTerminator, showTerminatorPrompt, revealState.terminatorModeUnlocked]);

  // Check for founder story trigger
  useEffect(() => {
    if (shouldShowFounder && !showFounderStory && !revealState.founderStoryShown) {
      setShowFounderStory(true);
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
      setDynamicSuggestion(randomCard.label);
    } else {
      const defaultHint = SECTION_CONFIG[activeSection]?.promptHint || "What is The Grove?";
      setDynamicSuggestion(defaultHint);
    }
    setCurrentTopic('');

    console.log('Chat context changed - session will reinitialize on next message');
  }, [activeSection, activeLensData, getEntryPoints]);

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
            // Set title and show completion modal
            setCompletedJourneyTitle(completedJourney.title || 'Your Journey');
            setShowJourneyCompletion(true);
          }
        }
      }

      setCurrentNodeId(nodeId);
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
    setInput('');

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
        setDynamicSuggestion(response.breadcrumb);
      } else {
        const breadcrumbMatch = accumulatedRawText.match(/\[\[BREADCRUMB:(.*?)\]\]/);
        if (breadcrumbMatch && breadcrumbMatch[1]) {
          setDynamicSuggestion(breadcrumbMatch[1].trim());
        } else {
          // Dynamic fallback: pick a random entry-point card from the schema
          const entryCards = getEntryPoints(null); // Get all entry points (no persona filter)
          if (entryCards.length > 0) {
            const randomCard = entryCards[Math.floor(Math.random() * entryCards.length)];
            setDynamicSuggestion(randomCard.label);
          } else {
            setDynamicSuggestion("What is The Grove, and what problem does it solve?");
          }
        }
      }

      if (response.topic) {
        setCurrentTopic(response.topic);
      } else {
        const topicMatch = accumulatedRawText.match(/\[\[TOPIC:(.*?)\]\]/);
        if (topicMatch && topicMatch[1]) {
          setCurrentTopic(topicMatch[1].trim());
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
      // Only evaluate if user is in freestyle mode (no active lens/journey)
      // Note: We count messages AFTER this exchange, so add 1 to current count
      // (incrementExchangeCount was called at start but React state is async)
      const currentExchangeCount = Math.floor((terminalState.messages.length + 1) / 2);

      console.log('[Entropy Debug] Preconditions:', {
        activeLens: session.activeLens,
        threadLength: currentThread.length,
        messageCount: terminalState.messages.length,
        calculatedExchanges: currentExchangeCount,
        entropyState
      });

      // Cognitive Bridge triggers for freestyle/unguided users (not in an active journey thread)
      // v0.12e: Also trigger for null activeLens (first-time users before lens selection)
      const isFreestyleMode = session.activeLens === 'freestyle' || session.activeLens === null;
      if (isFreestyleMode && currentThread.length === 0) {
        // Build history from messages for entropy calculation
        const history = terminalState.messages.map(m => ({
          role: m.role as 'user' | 'model',
          text: m.text
        }));

        // Evaluate entropy for this exchange - use calculated count, not stale state
        const entropy = evaluateEntropy(textToSend, history);
        // Override with correct exchange count since evaluateEntropy uses stale session.exchangeCount
        let adjustedScore = entropy.score;
        // If we have 3+ exchanges but the score doesn't include the +30 bonus, add it
        if (currentExchangeCount >= 3 && entropy.score < 30) {
          adjustedScore += 30;
        }
        const adjustedClassification = adjustedScore >= 60 ? 'high' : adjustedScore >= 30 ? 'medium' : 'low';

        console.log('[Entropy]', {
          originalScore: entropy.score,
          adjustedScore,
          classification: adjustedClassification,
          cluster: entropy.dominantCluster,
          matchedTags: entropy.matchedTags,
          exchangeCount: currentExchangeCount,
          message: textToSend.substring(0, 50)
        });

        // Check if we should show the Cognitive Bridge (use adjusted classification)
        const adjustedEntropy = { ...entropy, score: adjustedScore, classification: adjustedClassification as 'low' | 'medium' | 'high' };
        const shouldShow = checkShouldInject(adjustedEntropy);
        console.log('[Entropy] shouldInject:', shouldShow, 'hasDominantCluster:', !!entropy.dominantCluster);

        if (shouldShow && entropy.dominantCluster) {
          const journeyId = getJourneyIdForCluster(entropy.dominantCluster);
          console.log('[Entropy] Journey mapping:', { cluster: entropy.dominantCluster, journeyId });
          if (journeyId) {
            const shownAt = Date.now();
            setBridgeState({
              visible: true,
              journeyId,
              topicMatch: entropy.dominantCluster,
              afterMessageId: botMessageId,
              shownAt,
              entropyScore: adjustedScore,
              exchangeCount: currentExchangeCount
            });
            recordEntropyInjection(adjustedEntropy);
            // Track bridge shown event
            trackCognitiveBridgeShown({
              journeyId,
              entropyScore: adjustedScore,
              cluster: entropy.dominantCluster,
              exchangeCount: currentExchangeCount
            });
            console.log('[Entropy] Bridge ACTIVATED');
          }
        }
      } else {
        console.log('[Entropy] Skipped - user has active lens or journey', {
          activeLens: session.activeLens,
          threadLength: currentThread.length
        });
      }

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

    // Always tick entropy cooldown after each exchange (regardless of mode)
    tickEntropyCooldown();

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

  // PRESERVED: Scholar Mode toggle - exact same implementation
  const toggleVerboseMode = () => setIsVerboseMode(prev => !prev);
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
          {/* Show Custom Lens Wizard, Welcome Interstitial, Lens Picker, or Main Terminal */}
          {showCustomLensWizard ? (
            <CustomLensWizard
              onComplete={handleCustomLensComplete}
              onCancel={handleCustomLensCancel}
            />
          ) : showWelcomeInterstitial ? (
            <WelcomeInterstitial
              personas={enabledPersonas}
              customLenses={customLenses}
              onSelect={handleWelcomeLensSelect}
              onCreateCustomLens={handleWelcomeCreateCustomLens}
              onDeleteCustomLens={handleDeleteCustomLens}
              showCreateOption={showCustomLensInPicker}
            />
          ) : showLensPicker ? (
            <LensPicker
              mode="compact"
              onBack={() => setShowLensPicker(false)}
              onAfterSelect={(personaId) => {
                localStorage.setItem('grove-terminal-welcomed', 'true');
                localStorage.setItem('grove-session-established', 'true'); // v0.12f: Persist for returning users
                // Track lens activation via analytics
                trackLensActivated(personaId, personaId.startsWith('custom-'));
                // Emit to Engagement Bus
                emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
                emit.journeyStarted(personaId, currentThread.length || 5);
                // Update custom lens usage timestamp
                if (personaId.startsWith('custom-')) {
                  updateCustomLensUsage(personaId);
                }
              }}
            />
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
                journeyName={getJourney(activeJourneyId || '')?.title || (currentThread.length > 0 ? 'Guided' : 'Self-Guided')}
                currentStreak={currentStreak}
                showStreak={showStreakDisplay}
                onLensClick={() => setShowLensPicker(true)}
                onStreakClick={() => setShowStatsModal(true)}
              />

              {/* Consolidated Journey Navigation Bar - hidden when controls below enabled */}
              {!enableControlsBelow && (
                <JourneyNav
                  persona={activeLensData}
                  onSwitchLens={() => setShowLensPicker(true)}
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
              <div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll bg-white dark:bg-background-dark">
                <div className="max-w-3xl mx-auto space-y-6">
                {terminalState.messages.map((msg) => {
                  const isSystemError = msg.text.startsWith('SYSTEM ERROR') || msg.text.startsWith('Error:');
                  const showBridgeAfterThis = bridgeState.visible && bridgeState.afterMessageId === msg.id;

                  return (
                    <React.Fragment key={msg.id}>
                      <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Message Label */}
                        <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'user' ? (
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">You</span>
                          ) : (
                            <span className="text-xs font-semibold text-primary">The Grove</span>
                          )}
                        </div>
                        {/* Message Bubble */}
                        <div className={`${msg.role === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[90%] md:max-w-[85%]'}`}>
                          {msg.role === 'user' ? (
                            <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
                              <p className="text-sm md:text-base leading-relaxed">
                                {msg.text.replace(' --verbose', '')}
                              </p>
                            </div>
                          ) : (
                            <div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
                              isSystemError
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark'
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
                              console.log('[CognitiveBridge] Starting journey with startJourney():', bridgeState.journeyId);
                              // V2.1: Use engine's startJourney to set active journey state
                              startJourney(bridgeState.journeyId!);
                              // Send the entry node's query to kick off the conversation
                              handleSend(entryNode.query, entryNode.label, entryNode.id);
                              // Emit journey started event
                              emit.journeyStarted(bridgeState.journeyId!, journey.estimatedMinutes || 5);
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
                                selectLens(targetPersona);
                              }
                            }
                            setBridgeState({ visible: false, journeyId: null, topicMatch: null, afterMessageId: null, shownAt: null, entropyScore: null, exchangeCount: null });
                          }}
                          onDismiss={() => {
                            // Track timing for analytics
                            const timeToDecisionMs = bridgeState.shownAt ? Date.now() - bridgeState.shownAt : 0;
                            trackCognitiveBridgeDismissed({
                              journeyId: bridgeState.journeyId!,
                              timeToDecisionMs
                            });
                            recordEntropyDismiss();
                            setBridgeState({ visible: false, journeyId: null, topicMatch: null, afterMessageId: null, shownAt: null, entropyScore: null, exchangeCount: null });
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
                      journeyTitle={completedJourneyTitle || getJourney(activeJourneyId || '')?.title || (activeLensData?.publicLabel ? `${activeLensData.publicLabel} Journey` : 'Your Journey')}
                      journeyId={`${session.activeLens || 'default'}-${Date.now()}`}
                      personaId={session.activeLens}
                      completionTimeMinutes={Math.round((Date.now() - journeyStartTime) / 60000)}
                      showRating={showJourneyRatings}
                      showFeedbackTransmission={showFeedbackTransmission}
                      onSubmit={(rating, feedback, sendToFoundation) => {
                        console.log('Journey feedback:', { rating, feedback, sendToFoundation });
                        setShowJourneyCompletion(false);
                        setCompletedJourneyTitle(null);
                        if (shouldShowFounder && currentArchetypeId) {
                          markFounderStoryShown();
                        }
                      }}
                      onSkip={() => {
                        setShowJourneyCompletion(false);
                        setCompletedJourneyTitle(null);
                      }}
                    />
                  </div>
                )}

                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Interactions Area */}
              <div className="border-t border-border-light dark:border-border-dark bg-surface-light/50 dark:bg-surface-dark/50">
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
                          setCurrentNodeId(null);
                        }}
                        className="px-3 py-2 bg-grove-forest/10 border border-grove-forest/20 rounded-sm text-xs font-sans text-grove-forest hover:bg-grove-forest/20 transition-all"
                      >
                        Continue Exploring Freely
                      </button>
                      <button
                        onClick={() => setShowLensPicker(true)}
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
                          exitJourney();
                          setCurrentNodeId(null);
                        }}
                        className="px-3 py-2 bg-grove-forest/10 border border-grove-forest/20 rounded-sm text-xs font-sans text-grove-forest hover:bg-grove-forest/20 transition-all"
                      >
                        Explore Freely
                      </button>
                      <button
                        onClick={() => setShowLensPicker(true)}
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
                          setShowJourneyCompletion(true);
                          recordJourneyCompleted();
                          incrementJourneysCompleted();
                        }
                      }
                    }}
                  />
) : null}
                {/* Suggested Inquiry button removed - was taking up real estate without clear value */}

                <div className="flex items-center space-x-3 mb-4">
                  {/* v0.13: Scholar Mode button restyled for dark mode */}
                  <button
                    onClick={toggleVerboseMode}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${isVerboseMode
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-transparent text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary'
                      }`}
                  >
                    {isVerboseMode ? 'Scholar Mode: ON' : 'Enable Scholar Mode'}
                  </button>
                  {currentTopic && <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Ref: {currentTopic}</span>}
                </div>

                {/* Input Area - Command Palette enabled (v0.16) */}
                <CommandInput
                  onSubmitQuery={(query) => {
                    setInput(query);
                    handleSend(query);
                  }}
                  disabled={terminalState.isLoading}
                  onOpenModal={handleOpenModal}
                  onSwitchLens={handleCommandLensSwitch}
                  onShowWelcome={() => setShowWelcomeInterstitial(true)}
                  onShowLensPicker={() => setShowLensPicker(true)}
                  // Sprout System (Sprint: Sprout System)
                  getLastResponse={getLastResponse}
                  getSessionContext={getSessionContext}
                  captureSprout={handleCaptureSprout}
                />

                {/* v0.13: TerminalControls removed - lens/streak moved to header */}
                </div>
              </div>
            </>
          )}
      </TerminalShell>

      {/* Reveal Overlays */}
      {showSimulationReveal && currentArchetypeId && (
        <SimulationReveal
          archetypeId={currentArchetypeId}
          onContinue={handleSimulationRevealContinue}
        />
      )}

      {showCustomLensOffer && (
        <CustomLensOffer
          onAccept={handleAcceptCustomLensOffer}
          onDecline={handleDeclineCustomLensOffer}
        />
      )}

      {showTerminatorPrompt && (
        <TerminatorModePrompt
          onActivate={handleAcceptTerminatorMode}
          onDecline={handleDeclineTerminatorMode}
        />
      )}

      {terminatorModeActive && <TerminatorModeOverlay />}

      {/* v0.14: JourneyCompletion moved inline in messages area */}

      {showFounderStory && currentArchetypeId && (
        <FounderStory
          archetypeId={currentArchetypeId}
          onContinue={handleFounderStoryContinue}
        />
      )}

      {showConversionCTA && currentArchetypeId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/30 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4">
            <ConversionCTAPanel
              archetypeId={currentArchetypeId}
              customLensName={activeLensData?.name}
              onCTAClick={(ctaId) => {
                trackCtaClicked(currentArchetypeId, ctaId, 'modal');
              }}
              onDismiss={() => setShowConversionCTA(false)}
            />
          </div>
        </div>
      )}

      {/* Command Palette Modals (v0.16) */}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      {showJourneysModal && <JourneysModal onClose={() => setShowJourneysModal(false)} />}
      {showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} />}
      {showGardenModal && (
        <GardenModal
          onClose={() => setShowGardenModal(false)}
          onViewFullStats={() => {
            setShowGardenModal(false);
            setShowStatsModal(true);
          }}
        />
      )}
    </>
  );
};

export default Terminal;
