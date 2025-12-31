// src/bedrock/consoles/PipelineMonitor/PipelineMonitor.tsx
// Pipeline Monitor console for knowledge pipeline management
// Sprint: kinetic-pipeline-v1 (Epic 6), bedrock-alignment-v1

import React, { useState, useCallback } from 'react';
import {
  BedrockLayout,
  GlassPanel,
  GlassButton,
} from '../../primitives';
import { PIPELINE_API } from './pipeline.config';
import { DocumentsView } from './DocumentsView';
import { UploadModal } from './UploadModal';

// =============================================================================
// Component
// =============================================================================

export function PipelineMonitor() {
  const [processing, setProcessing] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Refresh callback for after uploads
  const handleUploadComplete = useCallback(() => {
    // DocumentsView handles its own data fetching
  }, []);

  // Pipeline action
  const triggerEmbedding = async () => {
    setProcessing(true);
    try {
      await fetch(PIPELINE_API.embed, { method: 'POST' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <BedrockLayout
        consoleId="pipeline-monitor"
        title="Pipeline Monitor"
        description="Knowledge pipeline management"
        header={
          <div className="flex items-center gap-3">
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
        }
        navigation={<div />}
        content={
          <GlassPanel tier="panel" className="h-full">
            <DocumentsView onOpenUpload={() => setUploadOpen(true)} />
          </GlassPanel>
        }
        navWidth={0}
      />

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}

export default PipelineMonitor;
