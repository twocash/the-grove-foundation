// src/surface/components/KineticStream/ExploreShell.tsx
// Main container for the Kinetic exploration experience
// Sprint: kinetic-experience-v1, kinetic-scroll-v1, kinetic-context-v1

import React, { useState, useCallback, useMemo } from 'react';
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
import { useMoments } from '@surface/hooks/useMoments';
import { MomentOverlay } from '../MomentRenderer';
import type { RhetoricalSpan, JourneyFork, PivotContext } from '@core/schema/stream';

export interface ExploreShellProps {
  initialLens?: string;
  initialJourney?: string;
}

type OverlayType = 'none' | 'lens-picker' | 'journey-picker';

export const ExploreShell: React.FC<ExploreShellProps> = ({
  initialLens,
  initialJourney
}) => {
  const {
    items,
    currentItem,
    isLoading,
    submit,
    acceptLensOffer,
    dismissLensOffer,
    acceptJourneyOffer,
    dismissJourneyOffer
  } = useKineticStream();

  // Engagement hooks
  const { actor } = useEngagement();
  const { lens, selectLens } = useLensState({ actor });
  const {
    journey,
    isActive: isJourneyActive,
    startJourney: engStartJourney,
  } = useJourneyState({ actor });

  // Moment overlay integration
  const {
    activeMoment: overlayMoment,
    executeAction: executeOverlayAction,
    dismissMoment: dismissOverlay
  } = useMoments({ surface: 'overlay' });

  // Derived lens data
  const lensData = useMemo(() => lens ? getPersona(lens) : null, [lens]);

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
    const count = items.filter(i => i.type === 'query').length;
    if (count === 0) return 'ARRIVAL';
    if (count < 3) return 'ORIENTED';
    if (count < 6) return 'EXPLORING';
    return 'ENGAGED';
  }, [items]);

  // Overlay state
  const [overlay, setOverlay] = useState<{ type: OverlayType }>({ type: 'none' });

  // Exchange count
  const exchangeCount = useMemo(() =>
    items.filter(i => i.type === 'query').length,
    [items]
  );

  // Determine if currently streaming
  const isStreaming = Boolean(
    currentItem?.type === 'response' &&
    'isGenerating' in currentItem &&
    currentItem.isGenerating
  );

  // Scroll management
  const scrollDeps = useMemo<[number, number, string | null]>(() => [
    items.length,
    (currentItem && 'content' in currentItem) ? (currentItem.content?.length ?? 0) : 0,
    currentItem?.id ?? null
  ], [items.length, currentItem]);

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

    submit(span.text, pivotContext);
  }, [submit]);

  const handleForkSelect = useCallback((fork: JourneyFork) => {
    if (fork.queryPayload) {
      submit(fork.queryPayload);
    } else {
      submit(fork.label);
    }
  }, [submit]);

  const handleSubmit = useCallback((query: string) => {
    // Force scroll to bottom on new submission (instant)
    scrollToBottom(false);
    submit(query);
  }, [submit, scrollToBottom]);

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
  }, []);

  const handlePromptClick = useCallback((prompt: string, command?: string, journeyId?: string) => {
    if (journeyId) {
      console.log('[KineticWelcome] Journey prompt clicked:', journeyId);
    }
    submit(command || prompt);
  }, [submit]);

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
      />

      {/* Stream area - attach scrollRef */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto pb-32">
          {/* Welcome when no messages */}
          {items.length === 0 && (
            <KineticWelcome
              content={welcomeContent}
              prompts={staticPrompts}
              stage={stage}
              exchangeCount={exchangeCount}
              onPromptClick={handlePromptClick}
            />
          )}

          <KineticRenderer
            items={items}
            currentItem={currentItem}
            bottomRef={bottomRef}
            onConceptClick={handleConceptClick}
            onForkSelect={handleForkSelect}
            onPromptSubmit={handleSubmit}
            onLensAccept={handleLensAccept}
            onLensDismiss={handleLensDismiss}
            onJourneyAccept={handleJourneyAccept}
            onJourneyDismiss={handleJourneyDismiss}
          />
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

      {/* Moment Overlay - engagement-triggered reveals */}
      {overlayMoment && (
        <MomentOverlay
          moment={overlayMoment}
          onAction={executeOverlayAction}
          onDismiss={dismissOverlay}
          activeLens={lens}
        />
      )}
    </div>
  );
};

export default ExploreShell;
