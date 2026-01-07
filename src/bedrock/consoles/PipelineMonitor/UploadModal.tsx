// src/bedrock/consoles/PipelineMonitor/UploadModal.tsx
// Glass modal overlay for file uploads
// Sprint: bedrock-alignment-v1 (Story 2.1)

import React, { useState, useRef } from 'react';
import { GlassButton } from '../../primitives';
import { PIPELINE_API } from './pipeline.config';

// =============================================================================
// Types
// =============================================================================

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function UploadModal({ open, onClose, onUploadComplete }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Sprint: upload-pipeline-unification-v1 - Processing settings
  const [extractPrompts, setExtractPrompts] = useState(true);
  const [autoEnrich, setAutoEnrich] = useState(true);

  if (!open) return null;

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    setUploadedCount(0);
    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const content = await file.text();
        await fetch(PIPELINE_API.upload, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            content,
            fileType: file.type || 'text/plain',
            sourceType: 'upload',
          }),
        });
        setUploadedCount(i + 1);
      }
      onUploadComplete?.();
      onClose();
    } catch (error) {
      console.error('[UploadModal] Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-[var(--glass-text-primary)]">
            Add Files
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files);
          }}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${dragActive
              ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5'
              : 'border-white/20 hover:border-white/30'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.json"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />

          <span className={`material-symbols-outlined text-4xl mb-4 block ${
            uploading ? 'animate-spin text-[var(--neon-cyan)]' : 'text-[var(--glass-text-muted)]'
          }`}>
            {uploading ? 'progress_activity' : 'cloud_upload'}
          </span>

          {uploading ? (
            <>
              <p className="text-[var(--glass-text-primary)] font-medium mb-1">
                Uploading...
              </p>
              <p className="text-[var(--glass-text-muted)] text-sm">
                {uploadedCount} files uploaded
              </p>
            </>
          ) : (
            <>
              <p className="text-[var(--glass-text-primary)] font-medium mb-1">
                {dragActive ? 'Drop files here' : 'Drag & drop files'}
              </p>
              <p className="text-[var(--glass-text-muted)] text-sm mb-4">
                Supports .txt, .md, .json
              </p>

              <GlassButton
                variant="secondary"
                size="sm"
                icon="folder_open"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Browse Files
              </GlassButton>
            </>
          )}
        </div>

        {/* Processing Pipeline Settings - Sprint: upload-pipeline-unification-v1 */}
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-sm font-medium text-white/70 mb-2">
            Processing Pipeline
          </div>

          <label className="flex items-center gap-2 text-sm text-white/60 mb-2 cursor-not-allowed">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="rounded bg-white/10 border-white/20 cursor-not-allowed accent-emerald-500"
            />
            <span>Embed for search</span>
            <span className="text-white/40 text-xs">(required)</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-white/60 mb-2 cursor-pointer hover:text-white/80">
            <input
              type="checkbox"
              checked={extractPrompts}
              onChange={(e) => setExtractPrompts(e.target.checked)}
              className="rounded bg-white/10 border-white/20 cursor-pointer accent-emerald-500"
            />
            <span>Extract exploration prompts</span>
          </label>

          {extractPrompts && (
            <label className="flex items-center gap-2 text-sm text-white/60 ml-6 cursor-pointer hover:text-white/80">
              <input
                type="checkbox"
                checked={autoEnrich}
                onChange={(e) => setAutoEnrich(e.target.checked)}
                className="rounded bg-white/10 border-white/20 cursor-pointer accent-emerald-500"
              />
              <span>Auto-enrich with Grove context</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
