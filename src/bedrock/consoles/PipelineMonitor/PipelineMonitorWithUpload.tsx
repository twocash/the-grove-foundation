// src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx
// Wrapper that adds upload modal and process button to factory-generated console
// Sprint: hotfix-pipeline-factory-v2
// Pattern: Matches original PipelineMonitor.tsx header behavior

import React, { useState, useCallback } from 'react';
import { PipelineMonitorBase } from './PipelineMonitor.factory';
import { UploadModal } from './UploadModal';
import { GlassButton } from '../../primitives';
import { PIPELINE_API } from './pipeline.config';

/**
 * Pipeline Monitor with Upload Modal and Process Queue
 *
 * Wraps the factory-generated console to restore the original header:
 * 1. "Add Files" button → opens upload modal
 * 2. "Process Queue" button → triggers embedding pipeline
 */
export function PipelineMonitorWithUpload() {
  const [processing, setProcessing] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Refresh callback for after uploads
  const handleUploadComplete = useCallback(() => {
    // Factory handles its own data fetching via useDocumentData
    setUploadOpen(false);
  }, []);

  // Pipeline action - matches original implementation
  const triggerEmbedding = async () => {
    setProcessing(true);
    try {
      await fetch(PIPELINE_API.embed, { method: 'POST' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with action buttons - matches original BedrockLayout header */}
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
          loading={processing}
        >
          Process Queue
        </GlassButton>
      </div>

      {/* Factory-generated console */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PipelineMonitorBase />
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

export default PipelineMonitorWithUpload;
