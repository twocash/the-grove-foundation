// src/cultivate/SproutGrid.tsx
// Display user's captured sprouts organized by status

import { useState, useMemo } from 'react';
import { useSproutStorage } from '../../hooks/useSproutStorage';
import { Sprout } from '../core/schema/sprout';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { CollectionHeader } from '../shared';

interface SproutCardProps {
  sprout: Sprout;
  onDelete: (id: string) => void;
  onSelect: (sprout: Sprout) => void;
}

function SproutCard({ sprout, onDelete, onSelect }: SproutCardProps) {
  const capturedDate = new Date(sprout.capturedAt);
  const timeAgo = getTimeAgo(capturedDate);

  return (
    <article
      className="glass-card group relative p-5 cursor-pointer flex flex-col"
      onClick={() => onSelect(sprout)}
    >
      {/* Icon + Delete button row */}
      <div className="flex items-start justify-between mb-3">
        <span className="material-symbols-outlined glass-card-icon text-2xl">eco</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sprout.id);
          }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-900/30 text-[var(--glass-text-subtle)] hover:text-red-400 transition-all"
          title="Delete sprout"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>

      {/* Query snippet */}
      <div className="flex items-start gap-2 mb-2">
        <span className="material-symbols-outlined text-[var(--glass-text-subtle)] text-sm mt-0.5">chat_bubble</span>
        <p className="text-sm text-[var(--glass-text-muted)] line-clamp-1">
          {sprout.query}
        </p>
      </div>

      {/* Response preview */}
      <p className="text-[var(--glass-text-secondary)] text-sm line-clamp-3 mb-3 leading-relaxed flex-1">
        {sprout.response}
      </p>

      {/* Footer */}
      <div className="glass-card-footer">
        <div className="glass-card-meta">
          <span className="material-symbols-outlined">schedule</span>
          <span>{timeAgo}</span>
        </div>

        {sprout.tags.length > 0 && (
          <div className="glass-card-meta">
            <span className="material-symbols-outlined">label</span>
            <span>{sprout.tags.slice(0, 2).join(', ')}</span>
            {sprout.tags.length > 2 && <span>+{sprout.tags.length - 2}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function SproutGrid() {
  const { getSprouts, deleteSprout, getSproutsCount } = useSproutStorage();
  const { openInspector, navigateTo } = useWorkspaceUI();
  const [searchQuery, setSearchQuery] = useState('');
  const allSprouts = getSprouts();
  const count = getSproutsCount();

  // Sort by most recent first and filter by search
  const sortedSprouts = useMemo(() => {
    let result = [...allSprouts].sort((a, b) =>
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.query.toLowerCase().includes(query) ||
        s.response.toLowerCase().includes(query) ||
        s.tags.some(t => t.toLowerCase().includes(query)) ||
        (s.notes && s.notes.toLowerCase().includes(query))
      );
    }

    return result;
  }, [allSprouts, searchQuery]);

  const handleSelect = (sprout: Sprout) => {
    openInspector({ type: 'sprout', sproutId: sprout.id });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this sprout? This cannot be undone.')) {
      deleteSprout(id);
    }
  };

  if (count === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-[var(--neon-green)]">eco</span>
        </div>
        <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
          No Sprouts Yet
        </h2>
        <p className="text-[var(--glass-text-muted)] max-w-md mb-6">
          Capture insights from conversations using the <code className="text-[var(--neon-green)] font-mono">/sprout</code> command in the Terminal.
        </p>
        <div className="text-sm text-[var(--glass-text-subtle)] space-y-1 font-mono">
          <p><code>/sprout</code> - Capture the last response</p>
          <p><code>/sprout --tag=idea</code> - Capture with a tag</p>
          <p><code>/sprout --note="..."</code> - Add a note</p>
        </div>
        <button
          onClick={() => navigateTo(['explore'])}
          className="glass-btn-primary mt-6"
        >
          Start Exploring
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl">
        <CollectionHeader
          title="My Sprouts"
          description="Insights you've captured from conversations. Review, refine, and share."
          searchPlaceholder="Search sprouts..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          activeIndicator={{
            label: 'Total',
            value: `${count} sprout${count !== 1 ? 's' : ''}`,
            icon: 'eco',
          }}
        />

        {/* No search results */}
        {sortedSprouts.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-[var(--glass-text-subtle)] mb-4">search_off</span>
            <p className="text-[var(--glass-text-muted)]">
              No sprouts match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-[var(--neon-cyan)] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Grid */}
        {sortedSprouts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedSprouts.map((sprout) => (
              <SproutCard
                key={sprout.id}
                sprout={sprout}
                onDelete={handleDelete}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
