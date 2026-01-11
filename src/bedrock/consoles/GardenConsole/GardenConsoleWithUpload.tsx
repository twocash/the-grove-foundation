// src/bedrock/consoles/GardenConsole/GardenConsoleWithUpload.tsx
// Wrapper that adds upload modal and process button to factory-generated console
// Sprint: bedrock-ia-rename-v1 (formerly PipelineMonitorWithUpload)
// Pattern: Matches original PipelineMonitor.tsx header behavior

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GardenConsoleBase } from './GardenConsole.factory';
import { UploadModal } from './UploadModal';
import { BulkExtractionDropdown } from './BulkExtractionDropdown';
import { GlassButton } from '../../primitives';
import { PIPELINE_API } from './pipeline.config';

// Job status type
interface PipelineJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    stage: string;
    detail?: string;
  };
  result?: {
    embedded: { processed: number; errors: string[] };
    extracted?: { prompts: number; errors: string[] };
  };
  error?: string;
}

/**
 * Garden Console with Upload Modal and Process Queue
 *
 * Wraps the factory-generated console to restore the original header:
 * 1. "Add Files" button → opens upload modal
 * 2. "Process Queue" button → triggers embedding pipeline (ASYNC)
 * 3. "Bulk Extract" dropdown → trigger prompt extraction
 */
export function GardenConsoleWithUpload() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{ extracted: number; errors: number } | null>(null);

  // Async job state
  const [activeJob, setActiveJob] = useState<PipelineJob | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh callback for after uploads
  const handleUploadComplete = useCallback(() => {
    setUploadOpen(false);
  }, []);

  // Handle extraction completion
  const handleExtractionComplete = useCallback((result: { extracted: number; errors: number }) => {
    setExtractionResult(result);
    setTimeout(() => setExtractionResult(null), 5000);
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        console.error('[Garden] Failed to fetch job status');
        return;
      }
      const job: PipelineJob = await response.json();
      setActiveJob(job);

      // Stop polling if job is done
      if (job.status === 'completed' || job.status === 'failed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        // Show results
        if (job.status === 'completed' && job.result?.extracted) {
          setExtractionResult({
            extracted: job.result.extracted.prompts || 0,
            errors: job.result.extracted.errors?.length || 0
          });
        }

        // Clear active job after a delay
        setTimeout(() => setActiveJob(null), 3000);
      }
    } catch (error) {
      console.error('[Garden] Poll error:', error);
    }
  }, []);

  // Start pipeline job
  // ASYNC: Returns immediately, polls for progress
  const triggerEmbedding = useCallback(async () => {
    try {
      const response = await fetch(PIPELINE_API.embed, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 10,
          runExtraction: true,
          runEnrichment: true,
        }),
      });

      const result = await response.json();
      console.log('[Garden] Job started:', result);

      if (result.jobId) {
        // Start polling for job status
        setActiveJob({
          id: result.jobId,
          status: 'running',
          progress: { current: 0, total: result.documentsQueued || 0, stage: 'starting' }
        });

        // Poll every 1 second
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(result.jobId);
        }, 1000);

        // Initial poll
        pollJobStatus(result.jobId);
      } else if (result.message) {
        // No documents to process
        console.log('[Garden]', result.message);
      }
    } catch (error) {
      console.error('[Garden] Start error:', error);
    }
  }, [pollJobStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Check for existing running jobs on mount
  useEffect(() => {
    const checkExistingJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const { jobs } = await response.json();
        const runningJob = jobs?.find((j: PipelineJob) => j.status === 'running');
        if (runningJob) {
          setActiveJob(runningJob);
          pollIntervalRef.current = setInterval(() => {
            pollJobStatus(runningJob.id);
          }, 1000);
        }
      } catch (error) {
        console.error('[Garden] Failed to check existing jobs:', error);
      }
    };
    checkExistingJobs();
  }, [pollJobStatus]);

  const isProcessing = activeJob?.status === 'running';
  const progressPercent = activeJob?.progress
    ? Math.round((activeJob.progress.current / Math.max(activeJob.progress.total, 1)) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with action buttons */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-b border-[var(--glass-border)]">
        <GlassButton
          variant="primary"
          accent="cyan"
          size="sm"
          icon="add"
          onClick={() => setUploadOpen(true)}
        >
          Add Files
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="sm"
          icon="play_arrow"
          onClick={triggerEmbedding}
          loading={isProcessing}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Process Queue'}
        </GlassButton>
        <BulkExtractionDropdown onComplete={handleExtractionComplete} />
      </div>

      {/* Job progress indicator */}
      {activeJob && activeJob.status === 'running' && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg border bg-cyan-500/10 border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="material-symbols-rounded animate-pulse">
                {activeJob.progress.stage === 'embedding' ? 'cloud_upload' :
                 activeJob.progress.stage === 'extracting' ? 'auto_awesome' :
                 'hourglass_empty'}
              </span>
              <span className="text-sm font-medium capitalize">{activeJob.progress.stage}</span>
            </div>
            <span className="text-sm text-cyan-400/70">{progressPercent}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-cyan-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {activeJob.progress.detail && (
            <p className="text-xs text-cyan-400/60 mt-2">{activeJob.progress.detail}</p>
          )}
        </div>
      )}

      {/* Extraction result notification with dismiss */}
      {extractionResult && (
        <div className={`
          mx-6 mt-4 px-4 py-3 rounded-lg border flex items-center justify-between
          ${extractionResult.errors > 0
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }
        `}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-xl">
              {extractionResult.errors > 0 ? 'warning' : 'check_circle'}
            </span>
            <span className="text-sm">
              Extracted {extractionResult.extracted} prompts
              {extractionResult.errors > 0 && ` (${extractionResult.errors} errors)`}
            </span>
          </div>
          <button
            onClick={() => setExtractionResult(null)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>
      )}

      {/* Factory-generated console */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <GardenConsoleBase />
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

export default GardenConsoleWithUpload;
