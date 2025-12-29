// src/surface/components/KineticStream/ExploreShell.tsx
// Main container for the Kinetic exploration experience
// Sprint: kinetic-experience-v1, kinetic-scroll-v1

import React, { useCallback, useMemo } from 'react';
import { KineticRenderer } from './Stream/KineticRenderer';
import { CommandConsole } from './CommandConsole';
import { useKineticStream } from './hooks/useKineticStream';
import { useKineticScroll } from './hooks/useKineticScroll';
import type { RhetoricalSpan, JourneyFork, PivotContext } from '@core/schema/stream';

export interface ExploreShellProps {
  initialLens?: string;
  initialJourney?: string;
}

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
  }, [acceptLensOffer]);

  const handleLensDismiss = useCallback((offerId: string) => {
    dismissLensOffer(offerId);
  }, [dismissLensOffer]);

  const handleJourneyAccept = useCallback((journeyId: string) => {
    acceptJourneyOffer(journeyId);
    // TODO: Start actual journey when schema/journey system is integrated
    console.log('[ExploreShell] Journey accepted:', journeyId);
  }, [acceptJourneyOffer]);

  const handleJourneyDismiss = useCallback((offerId: string) => {
    dismissJourneyOffer(offerId);
  }, [dismissJourneyOffer]);

  return (
    <div className="kinetic-surface flex flex-col h-screen bg-[var(--glass-void)]">
      {/* Header area */}
      <header className="flex-none p-4 border-b border-[var(--glass-border)]">
        <h1 className="text-base font-sans font-semibold text-[var(--glass-text-primary)]">
          Explore The Grove
        </h1>
      </header>

      {/* Stream area - attach scrollRef */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto pb-32">
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
    </div>
  );
};

export default ExploreShell;
