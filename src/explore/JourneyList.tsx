// src/explore/JourneyList.tsx
// Browse and start available journeys

import { useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { Journey } from '../../data/narratives-schema';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { Map, Clock, Play, Sparkles } from 'lucide-react';

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
        p-4 rounded-lg border transition-all
        ${isActive
          ? 'border-[var(--grove-accent)] bg-[var(--grove-accent-muted)]'
          : 'border-[var(--grove-border)] bg-[var(--grove-surface)] hover:border-[var(--grove-accent)]/50'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-[var(--grove-text)]">
          {journey.title}
        </h3>
        {isActive && (
          <span className="px-2 py-0.5 text-xs rounded bg-[var(--grove-accent)] text-[var(--grove-bg)]">
            Active
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--grove-text-muted)] mb-3 line-clamp-2">
        {journey.description}
      </p>

      {/* Target Aha */}
      {journey.targetAha && (
        <div className="flex items-start gap-2 mb-3 p-2 rounded bg-[var(--grove-bg)]">
          <Sparkles size={14} className="text-[var(--grove-accent)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--grove-text-muted)] italic line-clamp-2">
            {journey.targetAha}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--grove-text-dim)]">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{journey.estimatedMinutes}m</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="px-3 py-1.5 text-xs rounded border border-[var(--grove-border)] text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] hover:border-[var(--grove-accent)]/50 transition-colors"
          >
            Details
          </button>
          {!isActive && (
            <button
              onClick={onStart}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-[var(--grove-accent)] text-[var(--grove-bg)] hover:opacity-90 transition-opacity"
            >
              <Play size={12} />
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function JourneyList() {
  const { schema, loading, startJourney, activeJourneyId } = useNarrativeEngine();
  const { openInspector, navigateTo } = useWorkspaceUI();

  // Get active journeys only
  const journeys = useMemo(() => {
    if (!schema?.journeys) return [];
    return Object.values(schema.journeys).filter(j => j.status === 'active');
  }, [schema]);

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
        <div className="text-[var(--grove-accent)] animate-pulse">Loading journeys...</div>
      </div>
    );
  }

  if (journeys.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-[var(--grove-surface)] flex items-center justify-center mb-4">
          <Map size={32} className="text-[var(--grove-accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--grove-text)] mb-2">
          No Journeys Available
        </h2>
        <p className="text-[var(--grove-text-muted)] max-w-md mb-4">
          Journeys are curated paths through Grove's ideas. Check back soon or explore freely in the Terminal.
        </p>
        <button
          onClick={() => navigateTo(['explore'])}
          className="px-4 py-2 rounded bg-[var(--grove-accent)] text-[var(--grove-bg)] hover:opacity-90 transition-opacity"
        >
          Explore Freely
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--grove-text)] mb-1">
            Journeys
          </h1>
          <p className="text-[var(--grove-text-muted)]">
            Curated paths through Grove's ideas, tailored to your lens.
          </p>
        </div>

        {/* Active journey callout */}
        {activeJourneyId && (
          <div className="mb-6 p-4 rounded-lg border border-[var(--grove-accent)] bg-[var(--grove-accent-muted)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--grove-accent)] font-medium">Journey in Progress</p>
                <p className="text-sm text-[var(--grove-text-muted)]">
                  Continue in the Terminal to complete your journey.
                </p>
              </div>
              <button
                onClick={() => navigateTo(['explore'])}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-[var(--grove-accent)] text-[var(--grove-bg)]"
              >
                <Play size={14} />
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Journey list */}
        <div className="space-y-4">
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
      </div>
    </div>
  );
}
