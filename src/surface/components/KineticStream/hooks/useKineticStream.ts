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
import { parseNavigation } from '@core/transformers/NavigationParser';
import { parse as parseRhetoric } from '@core/transformers/RhetoricalParser';
import { parseLensOffer } from '@core/transformers/LensOfferParser';
import { parseJourneyOffer } from '@core/transformers/JourneyOfferParser';
import { sendMessageStream } from '../../../../../services/chatService';

interface UseKineticStreamReturn {
  items: StreamItem[];
  currentItem: StreamItem | null;
  isLoading: boolean;
  submit: (query: string, pivot?: PivotContext) => Promise<void>;
  clear: () => void;
  acceptLensOffer: (lensId: string) => void;
  dismissLensOffer: (offerId: string) => void;
  acceptJourneyOffer: (journeyId: string) => void;
  dismissJourneyOffer: (offerId: string) => void;
}

export function useKineticStream(): UseKineticStreamReturn {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [currentItem, setCurrentItem] = useState<StreamItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLensId, setActiveLensId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const itemsRef = useRef<StreamItem[]>([]);

  // Keep ref in sync with state
  itemsRef.current = items;

  const submit = useCallback(async (query: string, pivot?: PivotContext, lensId?: string) => {
    // Use provided lensId or fall back to active lens
    const effectiveLensId = lensId ?? activeLensId;
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
      await sendMessageStream(
        query,
        (chunk: string) => {
          fullContent += chunk;
          setCurrentItem(prev => prev ? {
            ...prev,
            content: fullContent
          } as ResponseStreamItem : null);
        },
        {
          personaTone: effectiveLensId || undefined
        }
      );

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
  }, [activeLensId]);

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

  return {
    items,
    currentItem,
    isLoading,
    submit,
    clear,
    acceptLensOffer,
    dismissLensOffer,
    acceptJourneyOffer,
    dismissJourneyOffer
  };
}
