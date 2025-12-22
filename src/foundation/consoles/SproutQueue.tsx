// src/foundation/consoles/SproutQueue.tsx
// Sprout moderation queue console

import { useState, useMemo } from 'react';
import { LoadingSpinner, EmptyState } from '../../shared/feedback';
import { CollectionHeader } from '../../shared';
import { MetricCard } from '../components/MetricCard';
import { useSproutQueue } from '../hooks/useSproutQueue';
import { useFoundationUI } from '../FoundationUIContext';
import { SproutSubmissionCard } from './SproutSubmissionCard';
import type { SproutQueueFilter } from '@core/schema/sprout-queue';

export default function SproutQueue() {
  const { sprouts, loading, counts } = useSproutQueue();
  const { openInspector, inspector } = useFoundationUI();
  const [filter, setFilter] = useState<SproutQueueFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSprouts = useMemo(() => {
    let result = sprouts;

    if (filter !== 'all') {
      result = result.filter(s => s.status === filter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.content.toLowerCase().includes(q) ||
        s.captureContext.lensId.toLowerCase().includes(q) ||
        (s.captureContext.journeyId?.toLowerCase().includes(q) ?? false)
      );
    }

    return result.sort((a, b) =>
      new Date(b.captureContext.timestamp).getTime() -
      new Date(a.captureContext.timestamp).getTime()
    );
  }, [sprouts, filter, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" label="Loading sprout queue..." />
      </div>
    );
  }

  const filterOptions = [
    { label: 'Pending', value: 'pending' as const, count: counts.pending },
    { label: 'Approved', value: 'approved' as const, count: counts.approved },
    { label: 'Rejected', value: 'rejected' as const, count: counts.rejected },
    { label: 'Flagged', value: 'flagged' as const, count: counts.flagged },
    { label: 'All', value: 'all' as const },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Sprout Queue
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Review and moderate community-submitted insights
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Pending Review" value={counts.pending} highlight />
        <MetricCard label="Approved" value={counts.approved} />
        <MetricCard label="Rejected" value={counts.rejected} />
        <MetricCard label="Flagged" value={counts.flagged} />
      </div>

      {/* Collection Header */}
      <CollectionHeader
        title="Submissions"
        description="Community insights awaiting moderation"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search submissions..."
      />

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border-light dark:border-border-dark pb-3">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-colors
              ${filter === option.value
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                filter === option.value
                  ? 'bg-primary/20'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredSprouts.length === 0 ? (
        <EmptyState
          icon="eco"
          title={filter === 'pending' ? 'Queue is empty' : `No ${filter} sprouts`}
          description={
            filter === 'pending'
              ? 'No sprouts are pending review. Check back later for new submissions.'
              : searchQuery
                ? 'No sprouts match your search. Try a different query.'
                : `There are no ${filter} sprouts to display.`
          }
          iconColor="text-primary"
        />
      ) : (
        <div className="space-y-3">
          {filteredSprouts.map(sprout => (
            <SproutSubmissionCard
              key={sprout.id}
              sprout={sprout}
              selected={
                inspector.mode.type === 'sprout-review' &&
                inspector.mode.sproutId === sprout.id
              }
              onClick={() => openInspector({ type: 'sprout-review', sproutId: sprout.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
