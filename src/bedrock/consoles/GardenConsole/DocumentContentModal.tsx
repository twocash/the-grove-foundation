// src/bedrock/consoles/GardenConsole/DocumentContentModal.tsx
// Sprint: S25-SFR garden-content-viewer-v1
// Full-viewport modal for viewing Garden document content
// Uses DocumentCatalog json-render for professional markdown rendering

import type React from 'react';
import { useMemo, useEffect, useCallback } from 'react';
import { Renderer } from '../../../surface/components/modals/SproutFinishingRoom/json-render/Renderer';
import { DocumentRegistry, contentToDocumentTree } from '../../json-render/document';
import { GlassButton } from '../../primitives';

export interface DocumentContentModalProps {
  title: string;
  content: string;
  tier: string;
  createdAt?: string;
  onClose: () => void;
}

/**
 * DocumentContentModal — Renders Garden document content with professional styling
 *
 * Uses the portable DocumentCatalog (json-render) for self-contained markdown
 * rendering. No .prose CSS dependency. Works in any GroveSkins container.
 */
export function DocumentContentModal({
  title,
  content,
  tier,
  createdAt,
  onClose,
}: DocumentContentModalProps) {
  const tree = useMemo(
    () => contentToDocumentTree(content, { title, tier, createdAt }),
    [content, title, tier, createdAt]
  );

  const wordCount = useMemo(
    () => content.split(/\s+/).filter(Boolean).length,
    [content]
  );

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Fallback: textarea copy
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [content]);

  // Backdrop click closes
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="relative flex flex-col w-[90vw] max-w-[900px] h-[85vh] rounded-lg shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--glass-solid, var(--glass-void, #111827))' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Document: ${title}`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: 'var(--neon-cyan)' }}
            >
              article
            </span>
            <h2
              className="text-lg font-semibold truncate"
              style={{
                color: 'var(--glass-text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--glass-elevated)] transition-colors"
            aria-label="Close"
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: 'var(--glass-text-muted)' }}
            >
              close
            </span>
          </button>
        </div>

        {/* Body — scrollable document content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Renderer tree={tree} registry={DocumentRegistry} />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0"
          style={{
            borderColor: 'var(--glass-border)',
            backgroundColor: 'var(--glass-panel)',
          }}
        >
          <span
            className="text-xs"
            style={{ color: 'var(--glass-text-muted)' }}
          >
            {wordCount.toLocaleString()} words · {content.length.toLocaleString()} chars
          </span>
          <div className="flex items-center gap-2">
            <GlassButton onClick={handleCopy} variant="ghost" size="sm">
              <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
              Copy
            </GlassButton>
            <GlassButton onClick={onClose} variant="secondary" size="sm">
              Close
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
