// src/bedrock/consoles/PipelineMonitor/HubSuggestions.tsx
// Hub suggestions panel from clustering
// Sprint: kinetic-pipeline-v1 (Story 6.4)

import React, { useState, useEffect, useCallback } from 'react';
import {
  GlassPanel,
  GlassCard,
  GlassButton,
  GlassStatusBadge,
  GlassIconButton,
} from '../../primitives';
import { PIPELINE_API, HUB_STATUSES, type HubStatus } from './pipeline.config';

// =============================================================================
// Types
// =============================================================================

interface SuggestedHub {
  id: string;
  suggested_title: string;
  member_doc_ids: string[];
  cluster_quality: number;
  status: HubStatus;
  created_at: string;
  approved_title?: string;
}

interface HubSuggestionsProps {
  onCluster?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function HubSuggestions({ onCluster }: HubSuggestionsProps) {
  const [hubs, setHubs] = useState<SuggestedHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  // Fetch hubs
  const fetchHubs = useCallback(async () => {
    try {
      const response = await fetch(PIPELINE_API.hubs);
      if (response.ok) {
        const data = await response.json();
        setHubs(data.hubs || []);
      }
    } catch (error) {
      console.error('[HubSuggestions] Failed to fetch hubs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubs();
  }, [fetchHubs]);

  // Trigger clustering
  const handleCluster = async () => {
    setClustering(true);
    try {
      await onCluster?.();
      await fetchHubs();
    } finally {
      setClustering(false);
    }
  };

  // Approve hub
  const approveHub = async (hubId: string) => {
    try {
      const response = await fetch(`${PIPELINE_API.hubs}/${hubId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchHubs();
      }
    } catch (error) {
      console.error('[HubSuggestions] Failed to approve hub:', error);
    }
  };

  // Reject hub
  const rejectHub = async (hubId: string) => {
    try {
      const response = await fetch(`${PIPELINE_API.hubs}/${hubId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchHubs();
      }
    } catch (error) {
      console.error('[HubSuggestions] Failed to reject hub:', error);
    }
  };

  // Group by status
  const suggestedHubs = hubs.filter(h => h.status === 'suggested');
  const approvedHubs = hubs.filter(h => h.status === 'approved' || h.status === 'active');
  const rejectedHubs = hubs.filter(h => h.status === 'rejected');

  // Quality color
  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-[var(--neon-green)]';
    if (quality >= 0.6) return 'text-[var(--neon-amber)]';
    return 'text-[var(--glass-text-muted)]';
  };

  return (
    <div className="space-y-6 p-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[var(--glass-text-primary)] font-medium">
            Hub Suggestions
          </h3>
          <p className="text-[var(--glass-text-muted)] text-sm">
            Review and approve automatically clustered document groups
          </p>
        </div>
        <GlassButton
          variant="primary"
          accent="amber"
          size="sm"
          icon={clustering ? 'progress_activity' : 'bubble_chart'}
          onClick={handleCluster}
          loading={clustering}
        >
          Run Clustering
        </GlassButton>
      </div>

      {/* Suggested Hubs */}
      {suggestedHubs.length > 0 && (
        <GlassPanel tier="panel" accent="amber" title="Awaiting Review" icon="rate_review">
          <div className="space-y-3">
            {suggestedHubs.map(hub => (
              <GlassCard
                key={hub.id}
                title={hub.suggested_title}
                icon="hub"
                accent="amber"
                selected={selectedHub === hub.id}
                onClick={() => setSelectedHub(hub.id === selectedHub ? null : hub.id)}
                badge={
                  <span className={`text-xs tabular-nums ${getQualityColor(hub.cluster_quality)}`}>
                    {Math.round(hub.cluster_quality * 100)}%
                  </span>
                }
              >
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[var(--glass-text-muted)]">
                    {hub.member_doc_ids.length} documents
                  </span>
                  <div className="flex items-center gap-1">
                    <GlassIconButton
                      icon="check"
                      label="Approve hub"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        approveHub(hub.id);
                      }}
                    />
                    <GlassIconButton
                      icon="close"
                      label="Reject hub"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        rejectHub(hub.id);
                      }}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Approved Hubs */}
      {approvedHubs.length > 0 && (
        <GlassPanel tier="solid" title="Approved Hubs" icon="check_circle">
          <div className="grid grid-cols-2 gap-3">
            {approvedHubs.map(hub => (
              <GlassCard
                key={hub.id}
                title={hub.approved_title || hub.suggested_title}
                icon="hub"
                accent="green"
                size="sm"
                badge={
                  <GlassStatusBadge status={HUB_STATUSES[hub.status].color} size="sm">
                    {HUB_STATUSES[hub.status].label}
                  </GlassStatusBadge>
                }
              >
                <span className="text-xs text-[var(--glass-text-muted)]">
                  {hub.member_doc_ids.length} docs
                </span>
              </GlassCard>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Empty State */}
      {!loading && hubs.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[var(--glass-text-subtle)] mb-4 block">
            bubble_chart
          </span>
          <p className="text-[var(--glass-text-primary)] font-medium">
            No hubs yet
          </p>
          <p className="text-[var(--glass-text-muted)] text-sm mt-1 mb-4">
            Run clustering to group related documents into hubs
          </p>
          <GlassButton
            variant="secondary"
            size="sm"
            icon="bubble_chart"
            onClick={handleCluster}
            loading={clustering}
          >
            Run Clustering
          </GlassButton>
        </div>
      )}
    </div>
  );
}

export default HubSuggestions;
