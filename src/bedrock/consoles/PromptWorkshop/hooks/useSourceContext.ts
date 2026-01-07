// src/bedrock/consoles/PromptWorkshop/hooks/useSourceContext.ts
// Fetches source document context for extracted prompts
// Sprint: prompt-refinement-v1

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface SourceContext {
  /** Document ID */
  id: string;
  /** Document title */
  title: string;
  /** The specific passage that triggered extraction */
  extractedPassage: string;
  /** Extraction confidence score (0-1) */
  confidence: number;
  /** Timestamp when extraction occurred */
  extractedAt?: string;
  /** Additional context from the document (first 2000 chars) */
  fullContext?: string;
}

interface UseSourceContextReturn {
  /** Fetched source context data */
  data: SourceContext | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch the context */
  refetch: () => void;
}

// =============================================================================
// Cache
// =============================================================================

// Simple in-memory cache for session duration
const contextCache = new Map<string, SourceContext>();

function getCacheKey(documentId: string, promptId?: string): string {
  return promptId ? `${documentId}:${promptId}` : documentId;
}

// =============================================================================
// Hook
// =============================================================================

export function useSourceContext(
  promptId?: string,
  documentId?: string
): UseSourceContextReturn {
  const [data, setData] = useState<SourceContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchContext = useCallback(async () => {
    if (!documentId) {
      setData(null);
      setError(null);
      return;
    }

    // Check cache first
    const cacheKey = getCacheKey(documentId, promptId);
    const cached = contextCache.get(cacheKey);
    if (cached) {
      setData(cached);
      setError(null);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/documents/${documentId}/context`, window.location.origin);
      if (promptId) {
        url.searchParams.set('promptId', promptId);
      }

      const response = await fetch(url.toString(), {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Source document not found');
        }
        throw new Error(`Failed to fetch context: ${response.status}`);
      }

      const context: SourceContext = await response.json();

      // Cache the result
      contextCache.set(cacheKey, context);

      setData(context);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch source context');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, promptId]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchContext();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchContext]);

  const refetch = useCallback(() => {
    // Clear cache for this entry and refetch
    if (documentId) {
      const cacheKey = getCacheKey(documentId, promptId);
      contextCache.delete(cacheKey);
    }
    fetchContext();
  }, [documentId, promptId, fetchContext]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

// =============================================================================
// Cache Utilities (for testing or manual cache management)
// =============================================================================

export function clearSourceContextCache(): void {
  contextCache.clear();
}

export function invalidateSourceContext(documentId: string, promptId?: string): void {
  const cacheKey = getCacheKey(documentId, promptId);
  contextCache.delete(cacheKey);
}

export default useSourceContext;
