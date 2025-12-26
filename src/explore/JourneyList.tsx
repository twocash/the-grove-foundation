// src/explore/JourneyList.tsx
// Browse and start available journeys
// Supports two modes: 'full' (workspace grid) and 'compact' (chat nav list)

import { useState, useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { Journey } from '../../data/narratives-schema';
import { useOptionalWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { CollectionHeader, useFlowParams, FlowCTA } from '../shared';
import { useEngagement, useJourneyState } from '@core/engagement';
import { StatusBadge } from '../shared/ui';

interface JourneyListProps {
  mode?: 'full' | 'compact';
  onBack?: () => void;  // For compact mode "Back to Chat"
}

// Compact card for chat nav picker (single column, click = inspect, button = start)
function CompactJourneyCard({ journey, isActive, onStart, onView }: {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
  onView: () => void;
}) {
  return (
    <div
      data-active={isActive || undefined}
      onClick={onView}
      className="glass-card p-4 cursor-pointer flex items-center gap-4"
    >
      <span className="material-symbols-outlined glass-card-icon text-xl">map</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
          {journey.title}
        </h3>
        <p className="text-sm text-[var(--glass-text-muted)] italic truncate">
          {journey.targetAha || journey.description}
        </p>
        <div className="flex items-center gap-1 text-xs text-[var(--glass-text-subtle)] mt-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {journey.estimatedMinutes} min
        </div>
      </div>
      {isActive ? (
        <StatusBadge variant="active" />
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="glass-btn-secondary"
        >
          Start
        </button>
      )}
    </div>
  );
}

interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  isInspected: boolean;
  onStart: () => void;
  onView: () => void;
}

function JourneyCard({ journey, isActive, isInspected, onStart, onView }: JourneyCardProps) {
  return (
    <article
      data-selected={isInspected || undefined}
      data-active={isActive || undefined}
      className="glass-card p-5 cursor-pointer"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined glass-card-icon">map</span>
          <h3 className="font-medium text-[var(--glass-text-primary)]">
            {journey.title}
          </h3>
        </div>
        {isActive && <StatusBadge variant="active" />}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--glass-text-muted)] mb-3 line-clamp-2">
        {journey.description}
      </p>

      {/* Target Aha Callout */}
      {journey.targetAha && (
        <div className="glass-callout line-clamp-2">
          {journey.targetAha}
        </div>
      )}

      {/* Footer */}
      <div className="glass-card-footer">
        <div className="glass-card-meta">
          <span className="material-symbols-outlined">schedule</span>
          <span>{journey.estimatedMinutes} min</span>
        </div>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="glass-btn-primary"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            Start
          </button>
        )}
      </div>
    </article>
  );
}

export function JourneyList({ mode = 'full', onBack }: JourneyListProps = {}) {
  // Schema and lookup from NarrativeEngine
  const { schema, loading, getJourney } = useNarrativeEngine();
  const workspaceUI = useOptionalWorkspaceUI();
  const [searchQuery, setSearchQuery] = useState('');

  // Flow params for route-based selection
  const { returnTo, ctaLabel, isInFlow } = useFlowParams();

  // Engagement state machine for journey state and actions
  const { actor } = useEngagement();
  const { journey: engActiveJourney, startJourney: engStartJourney } = useJourneyState({ actor });
  const activeJourneyId = engActiveJourney?.id ?? null;
  // Derive inspected journey from workspace inspector state
  const inspectedJourneyId = (
    workspaceUI?.inspector?.isOpen &&
    workspaceUI.inspector.mode?.type === 'journey'
  ) ? workspaceUI.inspector.mode.journeyId : null;

  // Get active journeys only
  const allJourneys = useMemo(() => {
    if (!schema?.journeys) return [];
    return Object.values(schema.journeys).filter(j => j.status === 'active');
  }, [schema]);

  // Filter by search (only used in full mode)
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
    // New engagement hooks require Journey object, not just ID
    const j = getJourney(journeyId);
    if (j) {
      engStartJourney(j);
    }
    if (mode === 'compact' && onBack) {
      onBack();  // Return to chat after selection
    } else if (workspaceUI) {
      // Navigate to terminal to continue the journey conversation
      workspaceUI.navigateTo(['explore', 'groveProject', 'terminal']);
    }
  };

  const handleView = (journeyId: string) => {
    if (mode === 'compact') {
      handleStart(journeyId);  // In compact mode, click = start
    } else if (workspaceUI) {
      workspaceUI.openInspector({ type: 'journey', journeyId });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading journeys...</div>
      </div>
    );
  }

  // COMPACT MODE - Single column list for chat nav
  // Uses percentage-based scaling for proportional margins in narrow containers
  if (mode === 'compact') {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="w-[92%] max-w-3xl mx-auto flex items-center justify-between">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
                Back to Chat
              </button>
            )}
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Switch Journey</span>
            <div className="w-24" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-[92%] max-w-3xl mx-auto space-y-3">
            {allJourneys.map(journey => (
              <CompactJourneyCard
                key={journey.id}
                journey={journey}
                isActive={activeJourneyId === journey.id}
                onStart={() => handleStart(journey.id)}
                onView={() => handleStart(journey.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // FULL MODE - Grid layout for workspace
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
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
                isInspected={inspectedJourneyId === journey.id}
                onStart={() => handleStart(journey.id)}
                onView={() => handleView(journey.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Flow CTA - appears when navigating from another route */}
      {isInFlow && activeJourneyId && returnTo && (
        <FlowCTA label={ctaLabel} returnTo={returnTo} />
      )}
    </div>
  );
}
