// src/surface/components/KineticStream/ExploreShell.tsx
// Main container for the Kinetic exploration experience
// Sprint: kinetic-experience-v1, kinetic-scroll-v1, kinetic-context-v1

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { KineticRenderer } from './Stream/KineticRenderer';
import { CommandConsole } from './CommandConsole';
import { KineticHeader } from './KineticHeader';
import { KineticWelcome } from './KineticWelcome';
import { useKineticStream } from './hooks/useKineticStream';
import { useKineticScroll } from './hooks/useKineticScroll';
import { useEngagement, useLensState, useJourneyState } from '../../../core/engagement';
import { getTerminalWelcome, DEFAULT_TERMINAL_WELCOME } from '../../../data/quantum-content';
import { getPersona } from '../../../../data/default-personas';
import { LensPicker } from '../../../explore/LensPicker';
import { CustomLensWizard } from '../../../../components/Terminal/CustomLensWizard';
import { useCustomLens } from '../../../../hooks/useCustomLens';
import { useMoments } from '@surface/hooks/useMoments';
import type { LensCandidate, UserInputs } from '../../../../types/lens';
import { useMomentStream } from '@surface/hooks/useMomentStream';
import { MomentOverlay } from '../MomentRenderer';
import { AnimatePresence } from 'framer-motion';
import {
  useTextSelection,
  useCaptureState,
  useKineticShortcuts,
  useSelectionActions,
  MagneticPill,
  SelectionHighlight,
  SproutCaptureCard,
  ResearchManifestCard,
  SproutTray,
  KeyboardHUD
} from './Capture';
import type { Shortcut, SelectionAction } from './Capture';
import type { ResearchManifest, SproutStage } from '@core/schema/sprout';
import { useSproutStorage } from '../../../../hooks/useSproutStorage';
import type { Sprout, SproutProvenance } from '@core/schema/sprout';
import type { RhetoricalSpan, JourneyFork, PivotContext, StreamItem } from '@core/schema/stream';
import { journeys } from '../../../data/journeys';
import { useFeatureFlag } from '../../../../hooks/useFeatureFlags';

export interface ExploreShellProps {
  initialLens?: string;
  initialJourney?: string;
}

type OverlayType = 'none' | 'lens-picker' | 'journey-picker' | 'custom-lens-wizard';

export const ExploreShell: React.FC<ExploreShellProps> = ({
  initialLens,
  initialJourney
}) => {
  // Hybrid search toggle (Sprint: hybrid-search-toggle-v1)
  // Must be declared before useKineticStream which depends on it
  // Sprint: prompt-journey-mode-v1 - Default to ON
  const [useHybridSearch, setUseHybridSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('grove-hybrid-search');
      // Default to true if not explicitly set to 'false'
      return stored !== 'false';
    }
    return true;
  });

  // Sprint: prompt-journey-mode-v1 - Journey mode toggle
  // Default to ON for better exploration experience
  const isJourneyModeEnabled = useFeatureFlag('journey-mode');
  const [journeyMode, setJourneyMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('grove-journey-mode');
      // Default to true if not explicitly set to 'false'
      return stored !== 'false';
    }
    return true;
  });

  const handleJourneyModeToggle = useCallback(() => {
    setJourneyMode(prev => {
      const next = !prev;
      localStorage.setItem('grove-journey-mode', String(next));
      console.log('[ExploreShell] Journey mode:', next ? 'ON' : 'OFF');
      return next;
    });
  }, []);

  const {
    items,
    currentItem,
    isLoading,
    submit,
    acceptLensOffer,
    dismissLensOffer,
    acceptJourneyOffer,
    dismissJourneyOffer,
    resubmitWithLens
  } = useKineticStream({ useHybridSearch });

  // Engagement hooks
  const { actor } = useEngagement();
  const { lens, selectLens } = useLensState({ actor });
  const {
    journey,
    isActive: isJourneyActive,
    startJourney: engStartJourney,
  } = useJourneyState({ actor });

  // Custom lens management
  const { saveCustomLens, getCustomLens } = useCustomLens();

  // Moment overlay integration
  const {
    activeMoment: overlayMoment,
    executeAction: executeOverlayAction,
    dismissMoment: dismissOverlay
  } = useMoments({ surface: 'overlay' });

  // Handle moment navigation (wizard, lens-picker, etc.)
  const handleMomentNavigate = useCallback((target: string) => {
    console.log('[ExploreShell] Moment navigation:', target);
    switch (target) {
      case 'wizard':
        setOverlay({ type: 'custom-lens-wizard' });
        break;
      case 'lens-picker':
        setOverlay({ type: 'lens-picker' });
        break;
      case 'journey-picker':
        setOverlay({ type: 'journey-picker' });
        break;
      default:
        console.warn('[ExploreShell] Unknown navigation target:', target);
    }
  }, []);

  // Inline moment injection
  const {
    momentItems,
    handleMomentAction,
    handleMomentDismiss
  } = useMomentStream({ onNavigate: handleMomentNavigate });

  // Merge stream items with moment items
  const allItems = useMemo<StreamItem[]>(() => {
    return [...items, ...momentItems];
  }, [items, momentItems]);

  // Derived lens data - check preset personas first, then custom lenses
  const lensData = useMemo(() => {
    if (!lens) return null;
    // Try preset persona first
    const preset = getPersona(lens);
    if (preset) return preset;
    // Fall back to custom lens
    const custom = getCustomLens(lens);
    if (custom) return { publicLabel: custom.publicLabel, color: custom.color };
    return null;
  }, [lens, getCustomLens]);

  // Sprint: kinetic-suggested-prompts-v1 - Extract persona behaviors for chat service
  const personaBehaviors = useMemo(() => {
    if (!lens) return undefined;
    const preset = getPersona(lens);
    return preset?.behaviors;
  }, [lens]);

  // Sprint: prompt-journey-mode-v1 - Override behaviors when journey mode active
  const effectivePersonaBehaviors = useMemo(() => {
    if (!journeyMode) {
      return personaBehaviors;
    }
    // Journey mode overrides - match Wayne Turner pattern
    return {
      ...personaBehaviors,
      closingBehavior: 'question' as const,
      useBreadcrumbTags: false,
      useTopicTags: false,
      useNavigationBlocks: false
    };
  }, [personaBehaviors, journeyMode]);

  // Welcome content - use static prompts from welcomeContent for now
  // TODO: Integrate useSuggestedPrompts once engagement systems are unified
  const welcomeContent = useMemo(() =>
    getTerminalWelcome(lens, undefined) || DEFAULT_TERMINAL_WELCOME,
    [lens]
  );

  // Convert static prompts to the expected format
  const staticPrompts = useMemo(() =>
    welcomeContent.prompts.map((text, i) => ({ id: `static-${i}`, text })),
    [welcomeContent.prompts]
  );

  // Stage is derived from exchange count for now
  const stage = useMemo(() => {
    const count = allItems.filter(i => i.type === 'query').length;
    if (count === 0) return 'ARRIVAL';
    if (count < 3) return 'ORIENTED';
    if (count < 6) return 'EXPLORING';
    return 'ENGAGED';
  }, [allItems]);

  // Overlay state
  const [overlay, setOverlay] = useState<{ type: OverlayType }>({ type: 'none' });

  // Hybrid search toggle handler (Sprint: hybrid-search-toggle-v1)
  const handleHybridSearchToggle = useCallback(() => {
    setUseHybridSearch(prev => {
      const next = !prev;
      localStorage.setItem('grove-hybrid-search', String(next));
      console.log('[ExploreShell] Hybrid search:', next ? 'ON' : 'OFF');
      return next;
    });
  }, []);

  // Exchange count
  const exchangeCount = useMemo(() =>
    allItems.filter(i => i.type === 'query').length,
    [allItems]
  );

  // Determine if currently streaming
  const isStreaming = Boolean(
    currentItem?.type === 'response' &&
    'isGenerating' in currentItem &&
    currentItem.isGenerating
  );

  // Sprout storage for capture (Sprint: kinetic-cultivation-v1)
  const {
    addSprout,
    sessionId,
    getSprouts,
    deleteSprout,
    getSessionSproutsCount
  } = useSproutStorage();

  // Get sprouts for tray (reactive)
  const sprouts = getSprouts();
  const sessionSproutCount = getSessionSproutsCount();

  // Stream container ref for text selection (Sprint: kinetic-cultivation-v1, selection-model-fix-v1)
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const { selection, lockSelection, unlockSelection } = useTextSelection(streamContainerRef);
  const {
    state: captureState,
    startCapture,
    cancelCapture,
    completeCapture
  } = useCaptureState();

  // Persistent highlight rects - survives through entire capture flow
  const [highlightRects, setHighlightRects] = useState<{ top: number; left: number; width: number; height: number }[]>([]);

  // Sync highlight rects from selection (only when not capturing)
  React.useEffect(() => {
    if (!captureState.isCapturing && selection?.rects) {
      setHighlightRects(selection.rects);
    }
  }, [selection?.rects, captureState.isCapturing]);

  // Clear highlight rects only when capture flow ends AND no new selection
  const clearHighlight = useCallback(() => {
    setHighlightRects([]);
  }, []);

  // Multi-action selection (Sprint: sprout-declarative-v1)
  const { actions: selectionActions, getActionById } = useSelectionActions();
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const selectedAction = selectedActionId ? getActionById(selectedActionId) : null;

  // Handle capture activation (pill click or action menu selection)
  const handleActionSelect = useCallback((actionId: string) => {
    if (!selection) return;
    lockSelection(); // Lock selection to prevent updates during capture
    setSelectedActionId(actionId);
    startCapture(selection);
    const action = getActionById(actionId);
    console.log('[Capture] Card opened with action:', {
      actionId,
      actionLabel: action?.label,
      text: selection.text.slice(0, 50),
      messageId: selection.messageId,
    });
  }, [selection, startCapture, getActionById, lockSelection]);

  // Legacy handler for backward compatibility
  const handleCaptureActivate = useCallback(() => {
    if (!selection) return;
    lockSelection(); // Lock selection to prevent updates during capture
    // Default to first action (sprout)
    setSelectedActionId(selectionActions[0]?.id || 'sprout');
    startCapture(selection);
    console.log('[Capture] Card opened with selection:', {
      text: selection.text.slice(0, 50),
      messageId: selection.messageId,
    });
  }, [selection, startCapture, selectionActions, lockSelection]);

  // Handle capture confirmation (Sprint: kinetic-cultivation-v1, sprout-declarative-v1)
  const handleCaptureConfirm = useCallback(async (tags: string[]) => {
    if (!captureState.selection) return;

    // Get stage from selected action (sprout-declarative-v1)
    const action = selectedActionId ? getActionById(selectedActionId) : null;
    const stage = (action?.defaultStage as Sprout['stage']) || 'tender';

    // Build provenance from current context
    const provenance: SproutProvenance = {
      lens: lens ? { id: lens, name: lensData?.publicLabel || lens } : null,
      hub: null, // Could be derived from the message if we tracked it
      journey: journey ? { id: journey.id, name: journey.title } : null,
      node: null,
      knowledgeFiles: [],
      generatedAt: new Date().toISOString()
    };

    // Create sprout from selection
    const sprout: Sprout = {
      id: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),
      response: captureState.selection.text,
      query: captureState.selection.contextSpan,
      provenance,
      personaId: lens || null,
      journeyId: journey?.id || null,
      hubId: null,
      nodeId: captureState.selection.messageId,
      status: 'sprout',
      stage, // sprout-declarative-v1: Use action-specific stage
      tags,
      notes: null,
      sessionId,
      creatorId: null
    };

    // Persist to storage
    const success = await addSprout(sprout);
    if (success) {
      // Track capture via XState
      actor.send({
        type: 'SPROUT_CAPTURED',
        sproutId: sprout.id,
        journeyId: journey?.id,
        hubId: undefined
      });
      console.log('[Capture] Sprout planted:', sprout.id.slice(0, 8), 'stage:', stage);
    }

    // Reset action selection and unlock
    setSelectedActionId(null);
    unlockSelection();
    completeCapture();
    clearHighlight();
  }, [captureState.selection, selectedActionId, getActionById, lens, lensData, journey, sessionId, addSprout, actor, completeCapture, unlockSelection, clearHighlight]);

  // Handle research manifest capture (Sprint: sprout-declarative-v1)
  const handleResearchCapture = useCallback(async (manifest: ResearchManifest, tags: string[], captureStage?: SproutStage) => {
    if (!captureState.selection) return;

    // Build provenance from current context
    const provenance: SproutProvenance = {
      lens: lens ? { id: lens, name: lensData?.publicLabel || lens } : null,
      hub: null,
      journey: journey ? { id: journey.id, name: journey.title } : null,
      node: null,
      knowledgeFiles: [],
      generatedAt: new Date().toISOString()
    };

    // Determine stage: use passed stage or default based on whether prompt was generated
    const stage: SproutStage = captureStage || (manifest.promptGenerated ? 'branching' : 'rooting');

    // Create research sprout with manifest
    const sprout: Sprout = {
      id: crypto.randomUUID(),
      capturedAt: new Date().toISOString(),
      response: captureState.selection.text,
      query: captureState.selection.contextSpan,
      provenance,
      personaId: lens || null,
      journeyId: journey?.id || null,
      hubId: null,
      nodeId: captureState.selection.messageId,
      status: 'sprout',
      stage, // Use determined stage
      researchManifest: manifest,
      tags,
      notes: null,
      sessionId,
      creatorId: null
    };

    // Persist to storage
    const success = await addSprout(sprout);
    if (success) {
      actor.send({
        type: 'SPROUT_CAPTURED',
        sproutId: sprout.id,
        journeyId: journey?.id,
        hubId: undefined
      });
      console.log('[Capture] Research directive created:', sprout.id.slice(0, 8), 'purpose:', manifest.purpose, 'stage:', stage);
    }

    // Reset action selection and unlock
    setSelectedActionId(null);
    unlockSelection();
    completeCapture();
    clearHighlight();
  }, [captureState.selection, lens, lensData, journey, sessionId, addSprout, actor, completeCapture, unlockSelection, clearHighlight]);

  // Keyboard HUD state (Sprint: kinetic-cultivation-v1)
  const [showKeyboardHUD, setShowKeyboardHUD] = useState(false);

  // Keyboard shortcuts (Sprint: kinetic-cultivation-v1)
  const shortcuts: Shortcut[] = useMemo(() => [
    {
      key: 's',
      modifiers: ['meta', 'ctrl'],
      action: () => {
        if (selection && !captureState.isCapturing) {
          handleCaptureActivate();
        } else {
          console.log('[Shortcuts] No text selected');
        }
      }
    },
    {
      key: '/',
      modifiers: ['meta', 'ctrl'],
      action: () => setShowKeyboardHUD(true)
    }
  ], [selection, captureState.isCapturing, handleCaptureActivate]);

  useKineticShortcuts(shortcuts);

  // Scroll management
  const scrollDeps = useMemo<[number, number, string | null]>(() => [
    allItems.length,
    (currentItem && 'content' in currentItem) ? (currentItem.content?.length ?? 0) : 0,
    currentItem?.id ?? null
  ], [allItems.length, currentItem]);

  const {
    scrollRef,
    bottomRef,
    showScrollButton,
    scrollToBottom
  } = useKineticScroll(scrollDeps, isStreaming);

  const handleConceptClick = useCallback((span: RhetoricalSpan, sourceId: string) => {
    const pivotContext: PivotContext = {
      sourceResponseId: sourceId,
      sourceText: span.text,
      sourceContext: `User clicked on the concept "${span.text}" to explore it further.`
    };

    // Sprint: prompt-journey-mode-v1 - Use effectivePersonaBehaviors for journey mode support
    submit(span.text, { pivot: pivotContext, personaBehaviors: effectivePersonaBehaviors });
  }, [submit, effectivePersonaBehaviors]);

  // Sprint: prompt-progression-v1 - Track selected prompts in XState
  // Sprint: prompt-journey-mode-v1 - Pass separate display/execution prompts
  const handleForkSelect = useCallback((fork: JourneyFork) => {
    // Emit to XState to track prompt selection for progression
    actor.send({
      type: 'USER.SELECT_FORK',
      fork,
      responseId: '' // Not tracked at this level, handled in ResponseObject
    });

    // Display label in chat, send queryPayload (executionPrompt) to LLM
    const displayText = fork.label;
    const executionPrompt = fork.queryPayload || fork.label;

    // Sprint: prompt-journey-mode-v1 - Use effectivePersonaBehaviors for journey mode support
    submit(displayText, {
      personaBehaviors: effectivePersonaBehaviors,
      executionPrompt
    });
  }, [actor, submit, effectivePersonaBehaviors]);

  // Sprint: prompt-journey-mode-v1 - Accept separate display text and execution prompt
  const handleSubmit = useCallback((displayText: string, executionPrompt?: string) => {
    // Force scroll to bottom on new submission (instant)
    scrollToBottom(false);
    // Sprint: prompt-journey-mode-v1 - Use effectivePersonaBehaviors for journey mode support
    submit(displayText, {
      personaBehaviors: effectivePersonaBehaviors,
      executionPrompt
    });
  }, [submit, scrollToBottom, effectivePersonaBehaviors]);

  const handleLensAccept = useCallback((lensId: string) => {
    acceptLensOffer(lensId);
    selectLens(lensId);
  }, [acceptLensOffer, selectLens]);

  const handleLensDismiss = useCallback((offerId: string) => {
    dismissLensOffer(offerId);
  }, [dismissLensOffer]);

  const handleJourneyAccept = useCallback((journeyId: string) => {
    acceptJourneyOffer(journeyId);
    // TODO (kinetic-context-v1): When schema is available, call:
    // const journey = getCanonicalJourney(journeyId, schema);
    // if (journey) { engStartJourney(journey); }
    console.log('[ExploreShell] Journey accepted:', journeyId);
  }, [acceptJourneyOffer]);

  const handleJourneyDismiss = useCallback((offerId: string) => {
    dismissJourneyOffer(offerId);
  }, [dismissJourneyOffer]);

  const handleLensAfterSelect = useCallback((personaId: string) => {
    // LensPicker already calls selectLens internally
    setOverlay({ type: 'none' });
    localStorage.setItem('grove-session-established', 'true');

    // Re-submit last query with new lens if there's an existing conversation
    if (items.some(i => i.type === 'query')) {
      resubmitWithLens(personaId);
    }
  }, [items, resubmitWithLens]);

  // Handle custom lens wizard completion
  const handleWizardComplete = useCallback(async (
    candidate: LensCandidate,
    userInputs: UserInputs
  ) => {
    try {
      const newLens = await saveCustomLens(candidate, userInputs);
      selectLens(newLens.id);
      setOverlay({ type: 'none' });
      localStorage.setItem('grove-session-established', 'true');
      // Set flag to prevent re-offering the custom lens moment
      actor.send({ type: 'SET_FLAG', key: 'customLensCreated', value: true });
      console.log('[ExploreShell] Custom lens created:', newLens.id);

      // Re-submit last query with new lens if there's an existing conversation
      if (items.some(i => i.type === 'query')) {
        resubmitWithLens(newLens.id);
      }
    } catch (error) {
      console.error('[ExploreShell] Failed to save custom lens:', error);
    }
  }, [saveCustomLens, selectLens, actor, items, resubmitWithLens]);

  const handleWizardCancel = useCallback(() => {
    setOverlay({ type: 'none' });
  }, []);

  // Handle journey selection from picker
  const handleJourneySelect = useCallback((journeyId: string) => {
    const selectedJourney = journeys.find(j => j.id === journeyId);
    if (selectedJourney) {
      engStartJourney(selectedJourney);
      actor.send({ type: 'SET_FLAG', key: 'journeyOfferShown', value: true });
      console.log('[ExploreShell] Journey started from picker:', journeyId);

      // Submit the first waypoint's prompt to begin the journey
      if (selectedJourney.waypoints && selectedJourney.waypoints.length > 0) {
        const firstWaypoint = selectedJourney.waypoints[0];
        submit(firstWaypoint.prompt, { personaBehaviors });
      }
    }
    setOverlay({ type: 'none' });
  }, [engStartJourney, actor, submit, personaBehaviors]);

  const handlePromptClick = useCallback((prompt: string, command?: string, journeyId?: string) => {
    if (journeyId) {
      console.log('[KineticWelcome] Journey prompt clicked:', journeyId);
    }
    // Sprint: prompt-journey-mode-v1 - Use effectivePersonaBehaviors for journey mode support
    submit(command || prompt, { personaBehaviors: effectivePersonaBehaviors });
  }, [submit, effectivePersonaBehaviors]);

  return (
    <div className="kinetic-surface flex flex-col h-screen bg-[var(--glass-void)]">
      {/* Header with context pills */}
      <KineticHeader
        lensName={lensData?.publicLabel || 'Choose Lens'}
        lensColor={lensData?.color}
        onLensClick={() => setOverlay({ type: 'lens-picker' })}
        journeyName={journey?.title || (isJourneyActive ? 'Guided' : 'Self-Guided')}
        onJourneyClick={() => setOverlay({ type: 'journey-picker' })}
        stage={stage}
        exchangeCount={exchangeCount}
        useHybridSearch={useHybridSearch}
        onHybridSearchToggle={handleHybridSearchToggle}
        journeyMode={isJourneyModeEnabled ? journeyMode : undefined}
        onJourneyModeToggle={isJourneyModeEnabled ? handleJourneyModeToggle : undefined}
      />

      {/* Stream area - attach scrollRef and capture ref */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div ref={streamContainerRef}>
        <div className="max-w-3xl mx-auto pb-32">
          {/* Welcome when no messages */}
          {allItems.length === 0 && (
            <KineticWelcome
              content={welcomeContent}
              prompts={staticPrompts}
              stage={stage}
              exchangeCount={exchangeCount}
              onPromptClick={handlePromptClick}
            />
          )}

          <KineticRenderer
            items={allItems}
            currentItem={currentItem}
            bottomRef={bottomRef}
            onConceptClick={handleConceptClick}
            onForkSelect={handleForkSelect}
            onPromptSubmit={handleSubmit}
            onLensAccept={handleLensAccept}
            onLensDismiss={handleLensDismiss}
            onJourneyAccept={handleJourneyAccept}
            onJourneyDismiss={handleJourneyDismiss}
            onMomentAction={handleMomentAction}
            onMomentDismiss={handleMomentDismiss}
          />
        </div>
        </div>
      </main>

      {/* Command console - with scroll props */}
      <CommandConsole
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Ask anything about The Grove..."
        showScrollButton={showScrollButton}
        onScrollToBottom={() => scrollToBottom(true)}
        isStreaming={isStreaming}
      />

      {/* Lens Picker Overlay */}
      {overlay.type === 'lens-picker' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--glass-solid)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
            <LensPicker
              mode="compact"
              onBack={() => setOverlay({ type: 'none' })}
              onAfterSelect={handleLensAfterSelect}
            />
          </div>
        </div>
      )}

      {/* Journey Picker Overlay */}
      {overlay.type === 'journey-picker' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--glass-solid)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">Choose a Journey</h2>
              <button
                onClick={() => setOverlay({ type: 'none' })}
                className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] text-xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              {journeys.map((j) => (
                <button
                  key={j.id}
                  onClick={() => handleJourneySelect(j.id)}
                  className="glass-card w-full text-left p-4 cursor-pointer"
                >
                  <div className="font-medium text-[var(--glass-text-primary)]">{j.title}</div>
                  <div className="text-sm text-[var(--glass-text-muted)] mt-1 italic">"{j.description}"</div>
                  <div className="text-xs text-[var(--neon-cyan)] mt-2">{j.estimatedTime}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Lens Wizard Overlay */}
      {overlay.type === 'custom-lens-wizard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--glass-solid)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            <CustomLensWizard
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
            />
          </div>
        </div>
      )}

      {/* Moment Overlay - engagement-triggered reveals */}
      {overlayMoment && (
        <MomentOverlay
          moment={overlayMoment}
          onAction={executeOverlayAction}
          onDismiss={dismissOverlay}
          activeLens={lens}
        />
      )}

      {/* Sprout capture UI (Sprint: kinetic-cultivation-v1, sprout-declarative-v1) */}
      {/* Selection highlight overlay - persists through entire capture flow */}
      <AnimatePresence>
        {highlightRects.length > 0 && (
          <SelectionHighlight
            key="selection-highlight"
            rects={highlightRects}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selection && !captureState.isCapturing && (
          <MagneticPill
            key="pill"
            position={{ x: selection.rect.right, y: selection.rect.bottom }}
            actions={selectionActions}
            onActionSelect={handleActionSelect}
            onActivate={handleCaptureActivate}
            layoutId="sprout-capture"
          />
        )}
        {captureState.isCapturing && captureState.selection && selectedActionId === 'research-directive' && (
          <ResearchManifestCard
            key="research-card"
            selection={captureState.selection}
            lensName={lensData?.publicLabel}
            journeyName={journey?.title}
            onCapture={handleResearchCapture}
            onCancel={() => { setSelectedActionId(null); unlockSelection(); cancelCapture(); clearHighlight(); }}
            layoutId="sprout-capture"
          />
        )}
        {captureState.isCapturing && captureState.selection && selectedActionId !== 'research-directive' && (
          <SproutCaptureCard
            key="sprout-card"
            selection={captureState.selection}
            lensName={lensData?.publicLabel}
            journeyName={journey?.title}
            onCapture={handleCaptureConfirm}
            onCancel={() => { setSelectedActionId(null); unlockSelection(); cancelCapture(); clearHighlight(); }}
            layoutId="sprout-capture"
          />
        )}
      </AnimatePresence>

      {/* Sprout Tray (Sprint: kinetic-cultivation-v1) */}
      <SproutTray
        sprouts={sprouts}
        onDelete={deleteSprout}
        sessionCount={sessionSproutCount}
      />

      {/* Keyboard HUD (Sprint: kinetic-cultivation-v1) */}
      <AnimatePresence>
        {showKeyboardHUD && (
          <KeyboardHUD onDismiss={() => setShowKeyboardHUD(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreShell;
