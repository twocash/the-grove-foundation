// src/surface/components/KineticStream/hooks/useKineticStream.ts
// Stream state management for Kinetic experience
// Sprint: kinetic-experience-v1

import { useState, useCallback, useRef } from 'react';
import type {
  StreamItem,
  QueryStreamItem,
  ResponseStreamItem,
  LensOfferStreamItem,
  JourneyOfferStreamItem,
  PivotContext
} from '@core/schema/stream';
import type { PersonaBehaviors } from '../../../../../data/narratives-schema';
import { parseNavigation } from '@core/transformers/NavigationParser';
import { parse as parseRhetoric } from '@core/transformers/RhetoricalParser';
import { parseLensOffer } from '@core/transformers/LensOfferParser';
import { parseJourneyOffer } from '@core/transformers/JourneyOfferParser';
import { sendMessageStream } from '../../../../../services/chatService';
import { useEngagement } from '@core/engagement';
import { calculateEntropy, type EntropyInputs } from '@core/engine/entropyCalculator';

// Sprint: hybrid-search-toggle-v1, kinetic-suggested-prompts-v1
export interface UseKineticStreamOptions {
  useHybridSearch?: boolean;
  /** Persona behaviors for response mode and closing behavior */
  personaBehaviors?: PersonaBehaviors;
}

/** Options passed to submit at call time */
export interface SubmitOptions {
  pivot?: PivotContext;
  lensId?: string;
  personaBehaviors?: PersonaBehaviors;
}

interface UseKineticStreamReturn {
  items: StreamItem[];
  currentItem: StreamItem | null;
  isLoading: boolean;
  submit: (query: string, options?: SubmitOptions) => Promise<void>;
  clear: () => void;
  acceptLensOffer: (lensId: string) => void;
  dismissLensOffer: (offerId: string) => void;
  acceptJourneyOffer: (journeyId: string) => void;
  dismissJourneyOffer: (offerId: string) => void;
  /** Re-submit the last query with a new lens (for lens picker) */
  resubmitWithLens: (lensId: string) => void;
}

export function useKineticStream(options: UseKineticStreamOptions = {}): UseKineticStreamReturn {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [currentItem, setCurrentItem] = useState<StreamItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLensId, setActiveLensId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const itemsRef = useRef<StreamItem[]>([]);
  const { actor } = useEngagement();

  // Keep ref in sync with state
  itemsRef.current = items;

  const submit = useCallback(async (query: string, submitOptions: SubmitOptions = {}) => {
    const { pivot, lensId, personaBehaviors: submitBehaviors } = submitOptions;
    // Use provided lensId or fall back to active lens
    const effectiveLensId = lensId ?? activeLensId;
    // Merge behaviors: submit-time takes precedence over hook-time
    const effectiveBehaviors = submitBehaviors ?? options.personaBehaviors;
    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    // Create query item
    const queryItem: QueryStreamItem = {
      id: `query-${Date.now()}`,
      type: 'query',
      timestamp: Date.now(),
      content: query,
      role: 'user',
      createdBy: 'user',
      pivot
    };

    // Add query to items
    setItems(prev => [...prev, queryItem]);
    setIsLoading(true);

    // Notify XState of query start (for engagement tracking)
    actor.send({ type: 'START_QUERY', prompt: query });
    actor.send({ type: 'START_RESPONSE' });

    // Create response item placeholder
    const responseId = `response-${Date.now()}`;
    const responseItem: ResponseStreamItem = {
      id: responseId,
      type: 'response',
      timestamp: Date.now(),
      content: '',
      isGenerating: true,
      role: 'assistant',
      createdBy: 'ai'
    };
    setCurrentItem(responseItem);

    try {
      let fullContent = '';

      // Stream response using chatService
      // Sprint: kinetic-suggested-prompts-v1 - pass personaBehaviors for response mode control
      const chatResponse = await sendMessageStream(
        query,
        (chunk: string) => {
          fullContent += chunk;
          setCurrentItem(prev => prev ? {
            ...prev,
            content: fullContent
          } as ResponseStreamItem : null);
        },
        {
          personaTone: effectiveLensId || undefined,
          personaBehaviors: effectiveBehaviors,
          useHybridSearch: options.useHybridSearch  // Sprint: hybrid-search-toggle-v1
        }
      );

      // Emit hub visit for entropy tracking (Sprint: entropy-calculation-v1)
      if (chatResponse.hubId) {
        actor.send({ type: 'HUB_VISITED', hubId: chatResponse.hubId });
      }

      // Parse completed response - chain parsers
      const { forks, cleanContent: navCleanContent } = parseNavigation(fullContent);
      const { offer: lensOffer, cleanContent: lensCleanContent } = parseLensOffer(navCleanContent, responseId);
      const { offer: journeyOffer, cleanContent: journeyCleanContent } = parseJourneyOffer(lensCleanContent, responseId);
      const { spans } = parseRhetoric(journeyCleanContent);

      // Finalize response
      const finalResponse: ResponseStreamItem = {
        id: responseId,
        type: 'response',
        timestamp: Date.now(),
        content: journeyCleanContent,
        isGenerating: false,
        role: 'assistant',
        createdBy: 'ai',
        parsedSpans: spans.length > 0 ? spans : undefined,
        navigation: forks.length > 0 ? forks : undefined
      };

      // Build items to add
      const newItems: StreamItem[] = [finalResponse];
      if (lensOffer) {
        newItems.push(lensOffer);
      }
      if (journeyOffer) {
        newItems.push(journeyOffer);
      }

      setItems(prev => [...prev, ...newItems]);
      setCurrentItem(null);

      // Notify XState of response completion (updates streamHistory for moment evaluation)
      actor.send({ type: 'FINALIZE_RESPONSE' });
      console.log('[useKineticStream] Exchange complete, XState notified');

      // Calculate and update entropy (Sprint: entropy-calculation-v1)
      const snapshot = actor.getSnapshot();
      const ctx = snapshot.context;
      const entropyInputs: EntropyInputs = {
        hubsVisited: ctx.hubsVisited || [],
        exchangeCount: ctx.streamHistory.filter((i: StreamItem) => i.type === 'query').length,
        pivotCount: ctx.pivotCount || 0,
        journeyWaypointsHit: ctx.journeyProgress || 0,
        journeyWaypointsTotal: ctx.journeyTotal || 0,
        consecutiveHubRepeats: ctx.consecutiveHubRepeats || 0,
      };
      const newEntropy = calculateEntropy(entropyInputs);
      actor.send({ type: 'UPDATE_ENTROPY', value: newEntropy });

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Stream error:', error);
        // Add error response
        const errorResponse: ResponseStreamItem = {
          id: responseId,
          type: 'response',
          timestamp: Date.now(),
          content: `Error: ${(error as Error).message}`,
          isGenerating: false,
          role: 'assistant',
          createdBy: 'ai'
        };
        setItems(prev => [...prev, errorResponse]);
        setCurrentItem(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeLensId, actor]);

  const clear = useCallback(() => {
    setItems([]);
    setCurrentItem(null);
    setIsLoading(false);
  }, []);

  const acceptLensOffer = useCallback((lensId: string) => {
    // Read current items from ref (synchronous)
    const currentItems = itemsRef.current;

    // Find the lens offer being accepted
    const offerIndex = currentItems.findIndex(
      item => item.type === 'lens_offer' && (item as LensOfferStreamItem).lensId === lensId
    );

    if (offerIndex === -1) return;

    // Find the query before the offer
    let queryToResubmit: string | null = null;
    for (let i = offerIndex - 1; i >= 0; i--) {
      if (currentItems[i].type === 'query') {
        queryToResubmit = (currentItems[i] as QueryStreamItem).content;
        break;
      }
    }

    // Update offer status
    setItems(prev => prev.map(item => {
      if (item.type === 'lens_offer' && (item as LensOfferStreamItem).lensId === lensId) {
        return { ...item, status: 'accepted' } as LensOfferStreamItem;
      }
      return item;
    }));

    // Set the active lens
    setActiveLensId(lensId);

    // Re-submit the query with the new lens after UI feedback
    if (queryToResubmit) {
      setTimeout(() => {
        submit(queryToResubmit!, undefined, lensId);
      }, 600);
    }
  }, [submit]);

  const dismissLensOffer = useCallback((offerId: string) => {
    setItems(prev => prev.map(item => {
      if (item.type === 'lens_offer' && item.id === offerId) {
        return { ...item, status: 'dismissed' } as LensOfferStreamItem;
      }
      return item;
    }));
  }, []);

  const acceptJourneyOffer = useCallback((journeyId: string) => {
    // Update offer status to accepted
    setItems(prev => prev.map(item => {
      if (item.type === 'journey_offer' && (item as JourneyOfferStreamItem).journeyId === journeyId) {
        return { ...item, status: 'accepted' } as JourneyOfferStreamItem;
      }
      return item;
    }));
    // Note: Actual journey start is handled by ExploreShell which has access to schema
  }, []);

  const dismissJourneyOffer = useCallback((offerId: string) => {
    setItems(prev => prev.map(item => {
      if (item.type === 'journey_offer' && item.id === offerId) {
        return { ...item, status: 'dismissed' } as JourneyOfferStreamItem;
      }
      return item;
    }));
  }, []);

  /**
   * Re-submit the last query with a new lens
   * Used by lens picker to refresh the response with new perspective
   */
  const resubmitWithLens = useCallback((lensId: string) => {
    const currentItems = itemsRef.current;

    // Find the last query in the stream
    let queryToResubmit: string | null = null;
    for (let i = currentItems.length - 1; i >= 0; i--) {
      if (currentItems[i].type === 'query') {
        queryToResubmit = (currentItems[i] as QueryStreamItem).content;
        break;
      }
    }

    // Set the active lens
    setActiveLensId(lensId);

    // Re-submit the query with the new lens
    if (queryToResubmit) {
      submit(queryToResubmit, undefined, lensId);
    }
  }, [submit]);

  return {
    items,
    currentItem,
    isLoading,
    submit,
    clear,
    acceptLensOffer,
    dismissLensOffer,
    acceptJourneyOffer,
    dismissJourneyOffer,
    resubmitWithLens
  };
}
