// src/cultivate/SproutGrid.tsx
// Display user's captured sprouts organized by status

import { useMemo } from 'react';
import { useSproutStorage } from '../../hooks/useSproutStorage';
import { Sprout } from '../core/schema/sprout';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { Sprout as SproutIcon, Clock, Tag, MessageSquare, Trash2 } from 'lucide-react';

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
      className="group relative p-4 rounded-lg border border-[var(--grove-border)] bg-[var(--grove-surface)] hover:border-[var(--grove-accent)]/50 transition-all cursor-pointer"
      onClick={() => onSelect(sprout)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(sprout.id);
        }}
        className="absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--grove-bg)] text-[var(--grove-text-dim)] hover:text-red-400 transition-all"
        title="Delete sprout"
      >
        <Trash2 size={14} />
      </button>

      {/* Query snippet */}
      <div className="flex items-start gap-2 mb-2">
        <MessageSquare size={14} className="text-[var(--grove-text-dim)] mt-0.5 shrink-0" />
        <p className="text-sm text-[var(--grove-text-muted)] line-clamp-1">
          {sprout.query}
        </p>
      </div>

      {/* Response preview */}
      <p className="text-[var(--grove-text)] text-sm line-clamp-3 mb-3">
        {sprout.response}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--grove-text-dim)]">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{timeAgo}</span>
        </div>

        {sprout.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag size={12} />
            <span>{sprout.tags.slice(0, 2).join(', ')}</span>
            {sprout.tags.length > 2 && <span>+{sprout.tags.length - 2}</span>}
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
  const { openInspector } = useWorkspaceUI();
  const sprouts = getSprouts();
  const count = getSproutsCount();

  // Sort by most recent first
  const sortedSprouts = useMemo(() => {
    return [...sprouts].sort((a, b) =>
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    );
  }, [sprouts]);

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
        <div className="w-16 h-16 rounded-full bg-[var(--grove-surface)] flex items-center justify-center mb-4">
          <SproutIcon size={32} className="text-[var(--grove-accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--grove-text)] mb-2">
          No Sprouts Yet
        </h2>
        <p className="text-[var(--grove-text-muted)] max-w-md mb-6">
          Capture insights from conversations using the <code className="text-[var(--grove-accent)]">/sprout</code> command in the Terminal.
        </p>
        <div className="text-sm text-[var(--grove-text-dim)] space-y-1">
          <p><code>/sprout</code> - Capture the last response</p>
          <p><code>/sprout --tag=idea</code> - Capture with a tag</p>
          <p><code>/sprout --note="Great insight"</code> - Add a note</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--grove-text)] mb-1">
              My Sprouts
            </h1>
            <p className="text-[var(--grove-text-muted)]">
              {count} insight{count !== 1 ? 's' : ''} captured
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--grove-accent-muted)]">
            <SproutIcon size={16} className="text-[var(--grove-accent)]" />
            <span className="text-sm font-medium text-[var(--grove-accent)]">{count}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSprouts.map((sprout) => (
            <SproutCard
              key={sprout.id}
              sprout={sprout}
              onDelete={handleDelete}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-8 text-center text-sm text-[var(--grove-text-dim)]">
          <p>Click a sprout to view details in the Inspector</p>
        </div>
      </div>
    </div>
  );
}
