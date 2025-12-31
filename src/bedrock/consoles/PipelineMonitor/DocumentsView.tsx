// src/bedrock/consoles/PipelineMonitor/DocumentsView.tsx
// Card-based document collection view with filters
// Sprint: bedrock-alignment-v1 (Story 2.3)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentCard } from './DocumentCard';
import { type DocumentStatus } from './pipeline.config';

// =============================================================================
// Types
// =============================================================================

interface Document {
  id: string;
  title: string;
  tier: string;
  embedding_status: DocumentStatus;
  created_at: string;
  content_length?: number;
}

interface DocumentsViewProps {
  onOpenUpload: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function DocumentsView({ onOpenUpload }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('pipeline-doc-favorites');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/knowledge/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('[DocumentsView] Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('pipeline-doc-favorites', JSON.stringify([...next]));
      return next;
    });
  };

  // Filter logic
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (tierFilter !== 'all' && doc.tier !== tierFilter) return false;
      if (statusFilter !== 'all' && doc.embedding_status !== statusFilter) return false;
      if (showFavoritesOnly && !favorites.has(doc.id)) return false;
      return true;
    });
  }, [documents, searchQuery, tierFilter, statusFilter, showFavoritesOnly, favorites]);

  const selectClasses = `
    px-3 py-2 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg
    text-sm text-[var(--glass-text-secondary)]
    focus:border-[var(--neon-cyan)] focus:outline-none
    appearance-none cursor-pointer
  `;

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)] text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-subtle)] focus:border-[var(--neon-cyan)] focus:outline-none"
          />
        </div>

        {/* Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="all">All Tiers</option>
          <option value="seedling">Seedling</option>
          <option value="sapling">Sapling</option>
          <option value="oak">Oak</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="complete">Complete</option>
          <option value="error">Error</option>
        </select>

        {/* Favorites Toggle */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`p-2 rounded-lg border transition-colors ${
            showFavoritesOnly
              ? 'bg-[var(--neon-amber)]/10 border-[var(--neon-amber)]/30 text-[var(--neon-amber)]'
              : 'border-[var(--glass-border)] text-[var(--glass-text-muted)] hover:border-[var(--glass-border-hover)]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {showFavoritesOnly ? 'star' : 'star_outline'}
          </span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Result count */}
        <span className="text-sm text-[var(--glass-text-subtle)]">
          {filteredDocs.length} of {documents.length}
        </span>
      </div>

      {/* Document Cards */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-[var(--glass-panel)] animate-pulse" />
            ))}
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-3">
            {filteredDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                selected={selected === doc.id}
                favorited={favorites.has(doc.id)}
                onSelect={() => setSelected(doc.id)}
                onFavorite={() => toggleFavorite(doc.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-[var(--glass-text-subtle)] mb-4 block">
              {searchQuery || tierFilter !== 'all' || statusFilter !== 'all' ? 'search_off' : 'inbox'}
            </span>
            <p className="text-[var(--glass-text-primary)] font-medium">
              {searchQuery || tierFilter !== 'all' || statusFilter !== 'all'
                ? 'No matching documents'
                : 'No documents yet'
              }
            </p>
            <p className="text-[var(--glass-text-muted)] text-sm mt-1">
              {searchQuery || tierFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload files to start building your knowledge base'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsView;
