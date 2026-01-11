// src/bedrock/consoles/GardenConsole/ProcessingQueue.tsx
// Embedding processing queue panel
// Sprint: kinetic-pipeline-v1 (Story 6.3)

import React, { useState, useEffect, useCallback } from 'react';
import {
  GlassPanel,
  GlassCard,
  GlassButton,
  GlassStatusBadge,
} from '../../primitives';
import { PIPELINE_STAGES, DOCUMENT_STATUSES, type DocumentStatus } from './pipeline.config';

// =============================================================================
// Types
// =============================================================================

interface QueuedDocument {
  id: string;
  title: string;
  embedding_status: DocumentStatus;
  embedding_error?: string;
  chunks_count?: number;
  updated_at: string;
}

interface ProcessingQueueProps {
  onProcess?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function ProcessingQueue({ onProcess }: ProcessingQueueProps) {
  const [queue, setQueue] = useState<QueuedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/knowledge/documents?status=pending,processing,error');
      if (response.ok) {
        const data = await response.json();
        setQueue(data.documents || []);
      }
    } catch (error) {
      console.error('[ProcessingQueue] Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Poll while processing
    const interval = setInterval(fetchQueue, processing ? 3000 : 10000);
    return () => clearInterval(interval);
  }, [fetchQueue, processing]);

  // Process queue
  const handleProcess = async () => {
    setProcessing(true);
    try {
      await onProcess?.();
      await fetchQueue();
    } finally {
      setProcessing(false);
    }
  };

  // Group by status
  const pendingDocs = queue.filter(d => d.embedding_status === 'pending');
  const processingDocs = queue.filter(d => d.embedding_status === 'processing');
  const errorDocs = queue.filter(d => d.embedding_status === 'error');

  return (
    <div className="space-y-6 p-4">
      {/* Pipeline Stages */}
      <GlassPanel tier="solid" padded={false}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
            Pipeline Stages
          </h3>
          <GlassButton
            variant="primary"
            accent="cyan"
            size="sm"
            icon={processing ? 'progress_activity' : 'play_arrow'}
            onClick={handleProcess}
            loading={processing}
            disabled={pendingDocs.length === 0}
          >
            Process {pendingDocs.length} Pending
          </GlassButton>
        </div>

        <div className="flex items-center gap-2 p-4">
          {PIPELINE_STAGES.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                ${stage.id === 'embed' && processingDocs.length > 0
                  ? 'bg-[var(--neon-violet)]/10 border border-[var(--neon-violet)]/30'
                  : 'bg-[var(--glass-panel)]'
                }
              `}>
                <span className={`
                  material-symbols-outlined text-base
                  ${stage.id === 'embed' && processingDocs.length > 0
                    ? 'text-[var(--neon-violet)] animate-spin'
                    : 'text-[var(--glass-text-muted)]'
                  }
                `}>
                  {stage.icon}
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">
                  {stage.label}
                </span>
              </div>
              {index < PIPELINE_STAGES.length - 1 && (
                <span className="material-symbols-outlined text-sm text-[var(--glass-text-subtle)]">
                  chevron_right
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </GlassPanel>

      {/* Processing Documents */}
      {processingDocs.length > 0 && (
        <GlassPanel tier="panel" accent="violet" title="Processing" icon="autorenew">
          <div className="space-y-2">
            {processingDocs.map(doc => (
              <GlassCard
                key={doc.id}
                title={doc.title}
                icon="description"
                accent="violet"
                size="sm"
                badge={<GlassStatusBadge status="pending" size="sm" pulse>Embedding</GlassStatusBadge>}
              />
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <GlassPanel tier="solid" title="Pending" icon="hourglass_empty">
          <div className="space-y-2">
            {pendingDocs.map(doc => (
              <GlassCard
                key={doc.id}
                title={doc.title}
                icon="description"
                size="sm"
                subtitle={`Queued ${new Date(doc.updated_at).toLocaleTimeString()}`}
              />
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Error Documents */}
      {errorDocs.length > 0 && (
        <GlassPanel tier="solid" accent="amber" title="Errors" icon="error">
          <div className="space-y-2">
            {errorDocs.map(doc => (
              <GlassCard
                key={doc.id}
                title={doc.title}
                icon="description"
                size="sm"
                badge={<GlassStatusBadge status="error" size="sm">Failed</GlassStatusBadge>}
              >
                <p className="text-xs text-red-400 mt-1">
                  {doc.embedding_error || 'Unknown error'}
                </p>
              </GlassCard>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Empty State */}
      {!loading && queue.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[var(--neon-green)] mb-4 block">
            check_circle
          </span>
          <p className="text-[var(--glass-text-primary)] font-medium">
            Queue is empty
          </p>
          <p className="text-[var(--glass-text-muted)] text-sm mt-1">
            All documents have been processed
          </p>
        </div>
      )}
    </div>
  );
}

export default ProcessingQueue;
