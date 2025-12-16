// src/foundation/consoles/KnowledgeVault.tsx
// Foundation-styled Knowledge Base (RAG) management console

import React, { useState, useEffect } from 'react';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import {
  Database,
  Upload,
  Trash2,
  FileText,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';

interface KnowledgeFile {
  name: string;
  size?: number;
  modified?: string;
}

const KnowledgeVault: React.FC = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewContext, setPreviewContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const [filesRes, contextRes] = await Promise.all([
        fetch('/api/admin/knowledge'),
        fetch('/api/context')
      ]);

      const filesData = await filesRes.json();
      const contextData = await contextRes.json();

      setFiles(filesData.files || []);
      setPreviewContext(contextData.context || '');
    } catch (err) {
      setError('Failed to load knowledge base');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    setError(null);

    const file = e.target.files[0];
    const filename = `knowledge/${file.name}`;

    try {
      await fetch(`/api/admin/upload?filename=${filename}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: file
      });
      await refreshFiles();
    } catch (err) {
      setError('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      await fetch(`/api/admin/knowledge/${filename}`, { method: 'DELETE' });
      await refreshFiles();
    } catch (err) {
      setError('Delete failed');
      console.error(err);
    }
  };

  const totalChars = previewContext.length;
  const estimatedTokens = Math.ceil(totalChars / 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-1">
            Knowledge Vault
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            RAG document management for Terminal context
          </p>
        </div>
        <GlowButton
          variant="secondary"
          icon={RefreshCw}
          onClick={refreshFiles}
          loading={loading}
        >
          Refresh
        </GlowButton>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-holo-red/10 border border-holo-red/30 rounded text-holo-red text-sm font-mono">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Documents" value={files.length} highlight />
        <MetricCard label="Total Characters" value={totalChars.toLocaleString()} />
        <MetricCard label="Est. Tokens" value={estimatedTokens.toLocaleString()} />
        <MetricCard
          label="Context Status"
          value={totalChars > 0 ? 'Active' : 'Empty'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Upload & Files */}
        <div className="space-y-4">
          {/* Upload Area */}
          <DataPanel title="Upload Knowledge" icon={Upload}>
            <div className="relative">
              <input
                type="file"
                id="knowledge-upload"
                className="hidden"
                accept=".md,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="knowledge-upload"
                className={`
                  block p-8 border-2 border-dashed border-holo-cyan/30 rounded-lg
                  text-center cursor-pointer transition-colors
                  ${uploading ? 'opacity-50' : 'hover:border-holo-cyan/60 hover:bg-holo-cyan/5'}
                `}
              >
                <FileText size={40} className="mx-auto mb-3 text-holo-cyan/50" />
                <div className="text-white font-medium mb-1">
                  {uploading ? 'Uploading...' : 'Click to Upload'}
                </div>
                <div className="text-xs text-gray-500 font-mono uppercase">
                  .md or .txt files only
                </div>
              </label>
            </div>
          </DataPanel>

          {/* File List */}
          <DataPanel title="Active Documents" icon={Database}>
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-mono">
                No knowledge files yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto f-scrollbar">
                {files.map(file => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between px-3 py-2 bg-obsidian rounded border border-holo-cyan/10 hover:border-holo-cyan/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-holo-cyan flex-shrink-0" />
                      <span className="text-sm font-mono text-white truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="p-1.5 text-gray-500 hover:text-holo-red hover:bg-holo-red/10 rounded transition-colors"
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>
        </div>

        {/* Right Column - Preview */}
        <DataPanel
          title="Combined Context Preview"
          icon={Eye}
          className="h-fit"
        >
          <div className="h-[50vh] overflow-y-auto f-scrollbar bg-obsidian rounded border border-holo-cyan/10 p-4">
            <pre className="text-xs font-mono text-holo-lime whitespace-pre-wrap leading-relaxed">
              {previewContext || '// System context is empty.\n// Upload documents to populate the knowledge base.'}
            </pre>
          </div>
        </DataPanel>
      </div>
    </div>
  );
};

export default KnowledgeVault;
