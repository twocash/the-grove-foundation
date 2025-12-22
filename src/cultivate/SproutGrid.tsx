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
    <div
      className="group relative p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer"
      onClick={() => onSelect(sprout)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(sprout.id);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all"
        title="Delete sprout"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>

      {/* Query snippet */}
      <div className="flex items-start gap-2 mb-2">
        <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">chat_bubble</span>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
          {sprout.query}
        </p>
      </div>

      {/* Response preview */}
      <p className="text-slate-700 dark:text-slate-200 text-sm line-clamp-3 mb-3 leading-relaxed">
        {sprout.response}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>{timeAgo}</span>
        </div>

        {sprout.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">label</span>
            <span>{sprout.tags.slice(0, 2).join(', ')}</span>
            {sprout.tags.length > 2 && <span className="text-slate-400">+{sprout.tags.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
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
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-600 dark:text-emerald-400">eco</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No Sprouts Yet
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
          Capture insights from conversations using the <code className="text-primary font-mono">/sprout</code> command in the Terminal.
        </p>
        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1 font-mono">
          <p><code>/sprout</code> - Capture the last response</p>
          <p><code>/sprout --tag=idea</code> - Capture with a tag</p>
          <p><code>/sprout --note="..."</code> - Add a note</p>
        </div>
        <button
          onClick={() => navigateTo(['explore'])}
          className="mt-6 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
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
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">search_off</span>
            <p className="text-slate-500 dark:text-slate-400">
              No sprouts match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-primary hover:underline"
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
