// src/bedrock/consoles/GardenConsole/JourneySynthesis.tsx
// Journey synthesis panel showing generated paths
// Sprint: kinetic-pipeline-v1 (Story 6.5)

import React, { useState, useEffect, useCallback } from 'react';
import {
  GlassPanel,
  GlassCard,
  GlassButton,
  GlassStatusBadge,
} from '../../primitives';
import { PIPELINE_API } from './pipeline.config';

// =============================================================================
// Types
// =============================================================================

interface JourneyNode {
  document_id: string;
  document_title: string;
  position: number;
}

interface SynthesizedJourney {
  id: string;
  hub_id: string;
  hub_title: string;
  title: string;
  description?: string;
  nodes: JourneyNode[];
  status: 'draft' | 'active' | 'archived';
  created_at: string;
}

interface JourneySynthesisProps {
  onSynthesize?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function JourneySynthesis({ onSynthesize }: JourneySynthesisProps) {
  const [journeys, setJourneys] = useState<SynthesizedJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);

  // Fetch journeys
  const fetchJourneys = useCallback(async () => {
    try {
      const response = await fetch(PIPELINE_API.journeys);
      if (response.ok) {
        const data = await response.json();
        setJourneys(data.journeys || []);
      }
    } catch (error) {
      console.error('[JourneySynthesis] Failed to fetch journeys:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  // Trigger synthesis
  const handleSynthesize = async () => {
    setSynthesizing(true);
    try {
      await onSynthesize?.();
      await fetchJourneys();
    } finally {
      setSynthesizing(false);
    }
  };

  // Activate journey
  const activateJourney = async (journeyId: string) => {
    try {
      const response = await fetch(`${PIPELINE_API.journeys}/${journeyId}/activate`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchJourneys();
      }
    } catch (error) {
      console.error('[JourneySynthesis] Failed to activate journey:', error);
    }
  };

  // Group by status
  const draftJourneys = journeys.filter(j => j.status === 'draft');
  const activeJourneys = journeys.filter(j => j.status === 'active');

  return (
    <div className="space-y-6 p-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[var(--glass-text-primary)] font-medium">
            Journey Synthesis
          </h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            AI-generated learning paths through your knowledge base
          </p>
        </div>
        <GlassButton
          variant="primary"
          accent="green"
          size="sm"
          icon={synthesizing ? 'progress_activity' : 'route'}
          onClick={handleSynthesize}
          loading={synthesizing}
        >
          Synthesize Journeys
        </GlassButton>
      </div>

      {/* Active Journeys */}
      {activeJourneys.length > 0 && (
        <GlassPanel tier="panel" accent="green" title="Active Journeys" icon="route">
          <div className="space-y-3">
            {activeJourneys.map(journey => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                expanded={expandedJourney === journey.id}
                onToggle={() => setExpandedJourney(
                  expandedJourney === journey.id ? null : journey.id
                )}
              />
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Draft Journeys */}
      {draftJourneys.length > 0 && (
        <GlassPanel tier="solid" title="Draft Journeys" icon="edit_note">
          <div className="space-y-3">
            {draftJourneys.map(journey => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                expanded={expandedJourney === journey.id}
                onToggle={() => setExpandedJourney(
                  expandedJourney === journey.id ? null : journey.id
                )}
                onActivate={() => activateJourney(journey.id)}
              />
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Empty State */}
      {!loading && journeys.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[var(--glass-text-subtle)] mb-4 block">
            route
          </span>
          <p className="text-[var(--glass-text-primary)] font-medium">
            No journeys yet
          </p>
          <p className="text-[var(--glass-text-muted)] text-sm mt-1 mb-4">
            Synthesize journeys from your approved hubs
          </p>
          <GlassButton
            variant="secondary"
            size="sm"
            icon="route"
            onClick={handleSynthesize}
            loading={synthesizing}
          >
            Synthesize Journeys
          </GlassButton>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Journey Card Component
// =============================================================================

interface JourneyCardProps {
  journey: SynthesizedJourney;
  expanded: boolean;
  onToggle: () => void;
  onActivate?: () => void;
}

function JourneyCard({ journey, expanded, onToggle, onActivate }: JourneyCardProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[var(--glass-solid)] overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--glass-elevated)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${journey.status === 'active'
              ? 'bg-[var(--neon-green)]/10'
              : 'bg-[var(--glass-panel)]'
            }
          `}>
            <span className={`
              material-symbols-outlined text-xl
              ${journey.status === 'active'
                ? 'text-[var(--neon-green)]'
                : 'text-[var(--glass-text-muted)]'
              }
            `}>
              route
            </span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-medium text-[var(--glass-text-primary)]">
              {journey.title}
            </h4>
            <p className="text-xs text-[var(--glass-text-muted)]">
              {journey.hub_title} • {journey.nodes.length} nodes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassStatusBadge
            status={journey.status === 'active' ? 'success' : 'neutral'}
            size="sm"
          >
            {journey.status}
          </GlassStatusBadge>
          <span className={`
            material-symbols-outlined text-lg text-[var(--glass-text-muted)]
            transition-transform ${expanded ? 'rotate-180' : ''}
          `}>
            expand_more
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-white/5 p-4">
          {/* Journey Path Visualization */}
          <div className="space-y-2 mb-4">
            {journey.nodes.map((node, index) => (
              <div key={node.document_id} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                    ${index === 0
                      ? 'bg-[var(--neon-green)]/20 text-[var(--neon-green)]'
                      : index === journey.nodes.length - 1
                        ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]'
                        : 'bg-[var(--glass-panel)] text-[var(--glass-text-muted)]'
                    }
                  `}>
                    {index + 1}
                  </div>
                  {index < journey.nodes.length - 1 && (
                    <div className="w-px h-4 bg-white/10" />
                  )}
                </div>
                <span className="text-sm text-[var(--glass-text-body)]">
                  {node.document_title}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {journey.status === 'draft' && onActivate && (
            <div className="flex justify-end">
              <GlassButton
                variant="primary"
                accent="green"
                size="sm"
                icon="check"
                onClick={onActivate}
              >
                Activate Journey
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JourneySynthesis;
