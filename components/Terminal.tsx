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
import { useRevealState } from '../hooks/useRevealState';
import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { LensPicker, LensBadge, JourneyEnd, ThreadProgress, CustomLensWizard, JourneyCard, JourneyCompletion, JourneyNav } from './Terminal/index';
import { useStreakTracking } from '../hooks/useStreakTracking';
import { Card, Persona } from '../data/narratives-schema';
import { LensCandidate, UserInputs, isCustomLens, ArchetypeId } from '../types/lens';
import SimulationReveal from './Terminal/Reveals/SimulationReveal';
import CustomLensOffer from './Terminal/Reveals/CustomLensOffer';
import { TerminatorModePrompt, TerminatorModeOverlay, TerminatorResponseMetadata } from './Terminal/Reveals/TerminatorMode';
import FounderStory from './Terminal/Reveals/FounderStory';
import ConversionCTAPanel from './Terminal/ConversionCTA';
import {
  trackLensActivated,
  trackSimulationRevealShown,
  trackSimulationRevealAcknowledged,
  trackTerminatorModeUnlocked,
  trackTerminatorModeActivated,
  trackFounderStoryViewed,
  trackCtaViewed,
  trackCtaClicked,
  trackJourneyCompleted
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

const parseInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-grove-clay font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentListItems: string[] = [];
  let currentTextBuffer: string[] = [];

  const flushText = () => {
    if (currentTextBuffer.length > 0) {
      const text = currentTextBuffer.join('\n');
      if (text.trim()) {
        elements.push(
          <span key={`text-${elements.length}`} className="whitespace-pre-wrap block mb-3 last:mb-0 leading-relaxed font-serif text-sm">
            {parseInline(text)}
          </span>
        );
      }
      currentTextBuffer = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="mb-4 space-y-1 ml-4 list-none">
          {currentListItems.map((item, i) => (
            <li key={i} className="pl-4 relative text-sm font-sans text-ink-muted">
              <span className="absolute left-0 text-grove-clay top-1.5 w-1 h-1 rounded-full bg-grove-clay"></span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const isList = trimmed.startsWith('* ') || trimmed.startsWith('- ');

    if (isList) {
      flushText();
      currentListItems.push(line.replace(/^(\*|-)\s+/, ''));
    } else {
      flushList();
      currentTextBuffer.push(line);
    }
  });

  flushText();
  flushList();

  return <>{elements}</>;
};

const Terminal: React.FC<TerminalProps> = ({ activeSection, terminalState, setTerminalState, externalQuery, onQueryHandled }) => {
  const [input, setInput] = useState('');
  const [dynamicSuggestion, setDynamicSuggestion] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [isVerboseMode, setIsVerboseMode] = useState<boolean>(false);
  // RAG context is now handled server-side in /api/chat
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [showLensPicker, setShowLensPicker] = useState<boolean>(false);
  const [showCustomLensWizard, setShowCustomLensWizard] = useState<boolean>(false);
  const [hasShownWelcome, setHasShownWelcome] = useState<boolean>(false);
  const [showNudge, setShowNudge] = useState<boolean>(false);
  const [showSimulationReveal, setShowSimulationReveal] = useState<boolean>(false);
  const [showCustomLensOffer, setShowCustomLensOffer] = useState<boolean>(false);
  const [showTerminatorPrompt, setShowTerminatorPrompt] = useState<boolean>(false);
  const [showFounderStory, setShowFounderStory] = useState<boolean>(false);
  const [showConversionCTA, setShowConversionCTA] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Legacy narrative hook for v1 compatibility
  const { getNextNodes } = useNarrative();

  // Custom lens management
  const {
    customLenses,
    saveCustomLens,
    deleteCustomLens,
    updateCustomLensUsage,
    getCustomLens
  } = useCustomLens();

  // New v2 narrative engine
  const {
    session,
    selectLens,
    getActiveLensData,
    getEnabledPersonas,
    getPersonaCards,
    getEntryPoints,
    getNextCards,
    currentThread,
    currentPosition,
    regenerateThread,
    advanceThread,
    getThreadCard,
    incrementExchangeCount,
    addVisitedCard,
    shouldNudge,
    globalSettings
  } = useNarrativeEngine();

  // Reveal state management
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
    getMinutesActive
  } = useRevealState();

  // Feature flags
  const showCustomLensInPicker = useFeatureFlag('custom-lens-in-picker');
  const showJourneyRatings = useFeatureFlag('journey-ratings');
  const showStreakDisplay = useFeatureFlag('streaks-display');
  const showFeedbackTransmission = useFeatureFlag('feedback-transmission');

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

  // Check for nudge when exchange count changes (fixes race condition)
  useEffect(() => {
    if (shouldNudge() && !showNudge && !session.activeLens) {
      setShowNudge(true);
    }
  }, [session.exchangeCount, shouldNudge, showNudge, session.activeLens]);

  // Journey completion state
  const [showJourneyCompletion, setShowJourneyCompletion] = useState(false);
  const [journeyStartTime] = useState(Date.now());

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

  // Check if we should show lens picker on first open
  useEffect(() => {
    const hasSelectedLens = localStorage.getItem('grove-terminal-lens') !== null ||
                            localStorage.getItem('grove-terminal-welcomed') === 'true';

    if (terminalState.isOpen && !hasSelectedLens && !hasShownWelcome) {
      setShowLensPicker(true);
      setHasShownWelcome(true);
    }
  }, [terminalState.isOpen, hasShownWelcome]);

  // Mark as welcomed after lens selection
  const handleLensSelect = (personaId: string | null) => {
    selectLens(personaId);
    setShowLensPicker(false);
    localStorage.setItem('grove-terminal-welcomed', 'true');

    // Track lens activation
    if (personaId) {
      trackLensActivated(personaId, personaId.startsWith('custom-'));
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

  // Handle custom lens wizard completion
  const handleCustomLensComplete = async (candidate: LensCandidate, userInputs: UserInputs) => {
    const newLens = await saveCustomLens(candidate, userInputs);
    selectLens(newLens.id);
    setShowCustomLensWizard(false);
    localStorage.setItem('grove-terminal-welcomed', 'true');
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

    const defaultHint = SECTION_CONFIG[activeSection]?.promptHint || "What is The Grove?";
    setDynamicSuggestion(defaultHint);
    setCurrentTopic('');

    console.log('Chat context changed - session will reinitialize on next message');
  }, [activeSection, activeLensData]);

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

  const handleSend = async (manualQuery?: string, manualDisplay?: string, nodeId?: string) => {
    const textToSend = manualQuery !== undefined ? manualQuery : input;
    if (!textToSend.trim()) return;

    const textToDisplay = manualDisplay !== undefined ? manualDisplay : textToSend;

    // Track current node for narrative-based follow-ups
    if (nodeId) {
      setCurrentNodeId(nodeId);
      addVisitedCard(nodeId);
    }

    // Increment exchange count for nudge logic
    // (useEffect watches session.exchangeCount to trigger nudge)
    incrementExchangeCount();

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
          terminatorMode: terminatorModeActive
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
          setDynamicSuggestion("Tell me more about the architecture.");
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

  // PRESERVED: Scholar Mode toggle - exact same implementation
  const toggleVerboseMode = () => setIsVerboseMode(prev => !prev);
  const handleSuggestion = (hint: string) => handleSend(hint);
  const toggleTerminal = () => setTerminalState(prev => ({ ...prev, isOpen: !prev.isOpen }));

  // Get next nodes - prefer v2 engine, fall back to v1
  const nextNodes = useMemo(() => {
    if (!currentNodeId) return [];
    // Try v2 cards first
    const v2Next = getNextCards(currentNodeId);
    if (v2Next.length > 0) return v2Next;
    // Fall back to v1 nodes
    return getNextNodes(currentNodeId);
  }, [currentNodeId, getNextCards, getNextNodes]);

  // Journey end detection - no next nodes available
  const isJourneyEnd = currentNodeId && nextNodes.length === 0;

  // Get suggested lenses for journey end (personas with overlapping cards)
  const suggestedLenses = useMemo((): Persona[] => {
    if (!isJourneyEnd) return [];
    const currentLensId = session.activeLens;
    return enabledPersonas
      .filter(p => p.id !== currentLensId)
      .slice(0, 3);
  }, [isJourneyEnd, session.activeLens, enabledPersonas]);

  // Get suggested topics for journey end
  const suggestedTopics = useMemo((): Card[] => {
    if (!isJourneyEnd || !session.activeLens) return [];
    return getEntryPoints(session.activeLens)
      .filter(card => !session.visitedCards.includes(card.id))
      .slice(0, 2);
  }, [isJourneyEnd, session.activeLens, getEntryPoints, session.visitedCards]);

  return (
    <>
      {/* Floating Action Button - Clean Ink Style */}
      <button
        onClick={toggleTerminal}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-ink/10 ${terminalState.isOpen ? 'bg-white text-ink' : 'bg-ink text-white'
          }`}
      >
        {terminalState.isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <span className="font-mono text-xl font-bold">{`>_`}</span>
        )}
      </button>

      {/* Drawer - Library Marginalia Style */}
      <div className={`fixed inset-y-0 right-0 z-[60] w-full md:w-[480px] bg-white border-l border-ink/10 transform transition-transform duration-500 ease-in-out shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] ${terminalState.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full text-ink font-sans">

          {/* Show Custom Lens Wizard, Lens Picker, or Main Terminal */}
          {showCustomLensWizard ? (
            <CustomLensWizard
              onComplete={handleCustomLensComplete}
              onCancel={handleCustomLensCancel}
            />
          ) : showLensPicker ? (
            <LensPicker
              personas={enabledPersonas}
              customLenses={customLenses}
              onSelect={handleLensSelect}
              onCreateCustomLens={handleCreateCustomLens}
              onDeleteCustomLens={handleDeleteCustomLens}
              currentLens={session.activeLens}
              showCreateOption={showCustomLensInPicker}
            />
          ) : (
            <>
              {/* Header - Compact title bar */}
              <div className="px-4 py-2 border-b border-ink/5 bg-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="font-display font-bold text-base text-ink">The Terminal 🌱</div>
                  {/* PRESERVED: Scholar Mode badge */}
                  {isVerboseMode && (
                    <span className="bg-[#D95D39] text-white px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase">
                      Scholar
                    </span>
                  )}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-ink-muted font-mono">
                  CTX: {SECTION_CONFIG[activeSection]?.title.toUpperCase() || 'INDEX'}
                </div>
              </div>

              {/* Consolidated Journey Navigation Bar */}
              <JourneyNav
                persona={activeLensData}
                onSwitchLens={() => setShowLensPicker(true)}
                currentThread={currentThread}
                currentPosition={currentPosition}
                getThreadCard={getThreadCard}
                onRegenerate={regenerateThread}
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

              {/* Messages Area - Thread Style */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 terminal-scroll bg-white">
                {/* No-Lens Nudge */}
                {showNudge && !session.activeLens && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-serif text-amber-800 mb-3">
                      I notice you're exploring{currentTopic ? ` "${currentTopic}"` : ''}. Would you like to switch to a specific lens for a more focused experience?
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowLensPicker(true)}
                        className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 transition-colors"
                      >
                        Yes, show lenses
                      </button>
                      <button
                        onClick={() => setShowNudge(false)}
                        className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-xs font-semibold rounded hover:bg-amber-50 transition-colors"
                      >
                        No, continue exploring
                      </button>
                    </div>
                  </div>
                )}

                {terminalState.messages.map((msg) => {
                  const isSystemError = msg.text.startsWith('SYSTEM ERROR') || msg.text.startsWith('Error:');

                  return (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="text-[10px] font-mono text-ink-muted mb-2 uppercase tracking-widest">
                        {msg.role === 'user' ? 'You' : 'The Grove'}
                      </div>
                      <div className={`max-w-[95%] text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.role === 'user' ? (
                          <div className="bg-paper-dark px-4 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-xl text-ink font-serif border border-ink/5">
                            {msg.text.replace(' --verbose', '')}
                          </div>
                        ) : (
                          <div className={`pl-4 border-l-2 ${isSystemError ? 'border-red-500 text-red-700 bg-red-50/50 py-2 pr-2' : 'border-grove-forest/30'}`}>
                            <MarkdownRenderer content={msg.text} />
                            {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-ink/50 cursor-blink align-middle"></span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Interactions Area */}
              <div className="p-6 border-t border-ink/5 bg-paper/50">

                {/* Journey End Options */}
                {isJourneyEnd ? (
                  <div className="mb-4">
                    <JourneyEnd
                      currentLens={activeLensData}
                      visitedCards={session.visitedCards}
                      suggestedTopics={suggestedTopics}
                      suggestedLenses={suggestedLenses}
                      onSelectTopic={(card) => handleSend(card.query, card.label, card.id)}
                      onSelectLens={(personaId) => {
                        selectLens(personaId);
                        setCurrentNodeId(null);
                      }}
                      onChangeEverything={() => setShowLensPicker(true)}
                    />
                  </div>
                ) : nextNodes.length > 0 ? (
                  /* Curated Narrative Follow-ups */
                  <div className="mb-4">
                    <div className="text-[9px] text-grove-clay font-bold uppercase tracking-widest mb-2">
                      Continue the Journey
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {nextNodes.map(node => (
                        <button
                          key={node.id}
                          onClick={() => handleSend(node.query, node.label, node.id)}
                          className="px-3 py-2 bg-white border border-ink/10 rounded-sm text-xs font-serif text-ink hover:border-grove-forest/30 hover:text-grove-forest hover:shadow-sm transition-all"
                        >
                          {node.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : currentThread.length > 0 && currentPosition < currentThread.length ? (
                  /* Journey Progress Card - replaces Suggested Inquiry */
                  <JourneyCard
                    currentThread={currentThread}
                    currentPosition={currentPosition}
                    currentCard={getThreadCard(currentPosition)}
                    journeyTitle={activeLensData?.publicLabel ? `${activeLensData.publicLabel} Journey` : 'Your Journey'}
                    onResume={() => {
                      const card = getThreadCard(currentPosition);
                      if (card) {
                        handleSend(card.query, card.label, card.id);
                        // Advance thread after sending - check if this was the last card
                        const nextCardId = advanceThread();
                        if (nextCardId === null && currentPosition >= currentThread.length - 1) {
                          // Journey complete! Show completion UI
                          setShowJourneyCompletion(true);
                          recordJourneyCompleted();
                          incrementJourneysCompleted();
                        }
                      }
                    }}
                    onExploreFreely={() => {
                      // User can type freely below
                    }}
                  />
                ) : dynamicSuggestion ? (
                  /* Fallback: Suggested Inquiry when no active journey */
                  <div className="mb-4">
                    <button
                      onClick={() => handleSuggestion(dynamicSuggestion)}
                      className="w-full text-left p-4 bg-white border border-ink/5 rounded-sm hover:border-grove-forest/30 hover:shadow-sm transition-all group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-grove-clay font-bold uppercase tracking-widest">
                          Suggested Inquiry
                        </span>
                        <span className="text-[9px] text-ink-muted group-hover:text-grove-forest transition-colors font-mono">
                          →
                        </span>
                      </div>
                      <div className="font-serif text-ink italic text-sm group-hover:text-grove-forest transition-colors">
                        "{dynamicSuggestion}"
                      </div>
                    </button>
                  </div>
                ) : null}

                <div className="flex items-center space-x-3 mb-4">
                  {/* PRESERVED: Verbose Toggle - Wax Seal Style - exact same implementation */}
                  <button
                    onClick={toggleVerboseMode}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${isVerboseMode
                        ? 'bg-grove-clay text-white shadow-sm'
                        : 'bg-transparent text-ink-muted border border-ink/10 hover:border-grove-clay hover:text-grove-clay'
                      }`}
                  >
                    {isVerboseMode ? 'Scholar Mode: ON' : 'Enable Scholar Mode'}
                  </button>
                  {currentTopic && <span className="text-[10px] font-mono text-ink-muted">Ref: {currentTopic}</span>}
                </div>

                {/* Input Area */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Write a query..."
                    className="w-full bg-white border border-ink/20 p-3 pl-4 pr-10 text-sm font-serif text-ink focus:outline-none focus:border-grove-forest focus:ring-1 focus:ring-grove-forest/20 transition-all rounded-sm placeholder:italic"
                    disabled={terminalState.isLoading}
                    autoComplete="off"
                  />
                  <button
                    onClick={() => handleSend()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-grove-forest transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

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

      {/* Journey Completion Modal */}
      {showJourneyCompletion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4">
            <JourneyCompletion
              journeyTitle={activeLensData?.publicLabel ? `${activeLensData.publicLabel} Journey` : 'Your Journey'}
              journeyId={`${session.activeLens || 'default'}-${Date.now()}`}
              personaId={session.activeLens}
              completionTimeMinutes={Math.round((Date.now() - journeyStartTime) / 60000)}
              showRating={showJourneyRatings}
              showFeedbackTransmission={showFeedbackTransmission}
              onSubmit={(rating, feedback, sendToFoundation) => {
                console.log('Journey feedback:', { rating, feedback, sendToFoundation });
                // TODO: Send feedback to server if sendToFoundation is true
                setShowJourneyCompletion(false);
                // Optionally show founder story or CTA after journey completion
                if (shouldShowFounder && currentArchetypeId) {
                  markFounderStoryShown();
                }
              }}
              onSkip={() => {
                setShowJourneyCompletion(false);
              }}
            />
          </div>
        </div>
      )}

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
    </>
  );
};

export default Terminal;
