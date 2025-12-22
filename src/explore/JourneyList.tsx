// src/explore/JourneyList.tsx
// Browse and start available journeys

import { useState, useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { Journey } from '../../data/narratives-schema';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { CollectionHeader } from '../shared';

interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
  onView: () => void;
}

function JourneyCard({ journey, isActive, onStart, onView }: JourneyCardProps) {
  return (
    <div
      className={`
        p-5 rounded-xl border transition-all cursor-pointer
        ${isActive
          ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
        }
      `}
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">
            {journey.icon || 'map'}
          </span>
          <h3 className="font-medium text-slate-900 dark:text-slate-100">
            {journey.title}
          </h3>
        </div>
        {isActive && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
            Active
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
        {journey.description}
      </p>

      {/* Target Aha */}
      {journey.targetAha && (
        <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
          <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">lightbulb</span>
          <p className="text-xs text-amber-700 dark:text-amber-300 italic line-clamp-2">
            {journey.targetAha}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>{journey.estimatedMinutes} min</span>
        </div>

        <div className="flex items-center gap-2">
          {!isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function JourneyList() {
  const { schema, loading, startJourney, activeJourneyId, getJourney } = useNarrativeEngine();
  const { openInspector, navigateTo } = useWorkspaceUI();
  const [searchQuery, setSearchQuery] = useState('');

  // Get active journeys only
  const allJourneys = useMemo(() => {
    if (!schema?.journeys) return [];
    return Object.values(schema.journeys).filter(j => j.status === 'active');
  }, [schema]);

  // Filter by search
  const journeys = useMemo(() => {
    if (!searchQuery.trim()) return allJourneys;
    const query = searchQuery.toLowerCase();
    return allJourneys.filter(j =>
      j.title.toLowerCase().includes(query) ||
      j.description.toLowerCase().includes(query) ||
      (j.targetAha && j.targetAha.toLowerCase().includes(query))
    );
  }, [allJourneys, searchQuery]);

  const activeJourney = activeJourneyId ? getJourney(activeJourneyId) : null;

  const handleStart = (journeyId: string) => {
    startJourney(journeyId);
    // Navigate to Terminal to begin the journey
    navigateTo(['explore']);
  };

  const handleView = (journeyId: string) => {
    openInspector({ type: 'journey', journeyId });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading journeys...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl">
        <CollectionHeader
          title="Guided Journeys"
          description="Curated paths through Grove's ideas. Each journey leads to a key insight."
          searchPlaceholder="Search journeys..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          activeIndicator={activeJourney ? {
            label: 'In Progress',
            value: activeJourney.title,
            icon: 'map',
          } : undefined}
        />

        {/* Empty state */}
        {journeys.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-primary">map</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No Journeys Available
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
              Journeys are curated paths through Grove's ideas. Check back soon or explore freely.
            </p>
            <button
              onClick={() => navigateTo(['explore'])}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Explore Freely
            </button>
          </div>
        )}

        {/* No search results */}
        {journeys.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">search_off</span>
            <p className="text-slate-500 dark:text-slate-400">
              No journeys match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Journey grid */}
        {journeys.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {journeys.map(journey => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                isActive={activeJourneyId === journey.id}
                onStart={() => handleStart(journey.id)}
                onView={() => handleView(journey.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
