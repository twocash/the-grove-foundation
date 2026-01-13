// src/explore/hooks/useKnowledgeBase.ts
// React hook for knowledge base operations
// Sprint: knowledge-base-integration-v1

import { useState, useCallback } from 'react';
import { useDataProvider } from '@core/data';
import {
  addToKnowledgeBase,
  type AddToKnowledgeBaseResult,
  type ResearchDocumentInput,
  type SproutInput,
} from '../services/knowledge-base-integration';

/**
 * Hook state for knowledge base operations
 */
export interface UseKnowledgeBaseState {
  /** Whether an operation is in progress */
  isLoading: boolean;

  /** Whether the document was added */
  isAdded: boolean;

  /** Error message if operation failed */
  error: string | null;

  /** Result of last operation */
  result: AddToKnowledgeBaseResult | null;
}

/**
 * Hook return type
 */
export interface UseKnowledgeBaseReturn extends UseKnowledgeBaseState {
  /** Add a document to the knowledge base */
  addDocument: (
    document: ResearchDocumentInput,
    sprout: SproutInput
  ) => Promise<AddToKnowledgeBaseResult | null>;

  /** Reset state for a new document */
  reset: () => void;
}

/**
 * Hook for knowledge base operations
 */
export function useKnowledgeBase(): UseKnowledgeBaseReturn {
  const provider = useDataProvider();

  const [state, setState] = useState<UseKnowledgeBaseState>({
    isLoading: false,
    isAdded: false,
    error: null,
    result: null,
  });

  /**
   * Add a document to the knowledge base
   */
  const addDocument = useCallback(
    async (document: ResearchDocumentInput, sprout: SproutInput) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await addToKnowledgeBase(provider, {
          document,
          sprout,
        });

        setState({
          isLoading: false,
          isAdded: result.success,
          error: result.success ? null : (result.error ?? 'Unknown error'),
          result,
        });

        return result;

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setState({
          isLoading: false,
          isAdded: false,
          error: message,
          result: null,
        });
        return null;
      }
    },
    [provider]
  );

  /**
   * Reset state for a new document
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isAdded: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    addDocument,
    reset,
  };
}
