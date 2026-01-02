// src/core/data/use-knowledge-search.ts
// React hook for semantic search operations

import { useState, useCallback } from 'react';

/**
 * Options for semantic search.
 */
export interface SearchOptions {
  /** Max number of results (default: 10) */
  limit?: number;
  /** Minimum similarity threshold 0-1 (default: 0.7) */
  threshold?: number;
  /** Filter by document tiers */
  tiers?: string[];
  /** Enable query expansion (default: false) */
  expand?: boolean;
}

/**
 * A search result from the knowledge base.
 */
export interface SearchResult {
  /** Document ID */
  id: string;
  /** Document title */
  title: string;
  /** Relevant snippet from content */
  snippet: string;
  /** Similarity score 0-1 */
  similarity: number;
  /** Source document tier */
  tier?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of useKnowledgeSearch hook.
 */
export interface UseKnowledgeSearchResult {
  /** Execute a semantic search */
  search: (query: string, options?: SearchOptions) => Promise<SearchResult[]>;
  /** Find documents similar to a given document */
  findSimilar: (documentId: string, limit?: number) => Promise<SearchResult[]>;
  /** Search loading state */
  loading: boolean;
  /** Search error */
  error: string | null;
  /** Last search results */
  results: SearchResult[];
}

/**
 * React hook for semantic search in the knowledge base.
 *
 * This is separate from useGroveData because search is fundamentally
 * different from CRUD operations - it uses vector embeddings and
 * similarity matching rather than exact field lookups.
 *
 * @example
 * ```tsx
 * function SearchBox() {
 *   const { search, results, loading, error } = useKnowledgeSearch();
 *
 *   const handleSearch = async (query: string) => {
 *     await search(query, { limit: 5, expand: true });
 *   };
 *
 *   return (
 *     <div>
 *       <input onChange={(e) => handleSearch(e.target.value)} />
 *       {loading && <Spinner />}
 *       {results.map(r => (
 *         <SearchResult key={r.id} result={r} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useKnowledgeSearch(): UseKnowledgeSearchResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = useCallback(
    async (query: string, options?: SearchOptions): Promise<SearchResult[]> => {
      if (!query.trim()) {
        setResults([]);
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ q: query });
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.threshold) params.set('threshold', String(options.threshold));
        if (options?.expand) params.set('expand', 'true');
        if (options?.tiers) params.set('tiers', options.tiers.join(','));

        const response = await fetch(`/api/knowledge/search?${params}`);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = (await response.json()) as SearchResult[];
        setResults(data);
        return data;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        setResults([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const findSimilar = useCallback(
    async (documentId: string, limit = 5): Promise<SearchResult[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/knowledge/similar/${documentId}?limit=${limit}`);

        if (!response.ok) {
          throw new Error(`Similar search failed: ${response.statusText}`);
        }

        const data = (await response.json()) as SearchResult[];
        setResults(data);
        return data;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        setResults([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    search,
    findSimilar,
    loading,
    error,
    results,
  };
}
