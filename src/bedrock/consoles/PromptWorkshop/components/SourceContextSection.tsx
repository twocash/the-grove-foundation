// src/bedrock/consoles/PromptWorkshop/components/SourceContextSection.tsx
// Collapsible source document context display in Inspector
// Sprint: prompt-refinement-v1

import { InspectorSection } from '../../../../shared/layout/InspectorPanel';
import { useSourceContext } from '../hooks/useSourceContext';

// =============================================================================
// Types
// =============================================================================

interface SourceContextSectionProps {
  /** Prompt ID for context lookup */
  promptId: string;
  /** Source document ID (from provenance) */
  documentId?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(isoString?: string): string {
  if (!isoString) return 'Unknown';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

// =============================================================================
// Component
// =============================================================================

export function SourceContextSection({
  promptId,
  documentId,
}: SourceContextSectionProps) {
  const { data, isLoading, error } = useSourceContext(promptId, documentId);

  // No source document linked
  if (!documentId) {
    return (
      <InspectorSection title="Source Context" collapsible defaultCollapsed>
        <div className="text-sm text-[var(--glass-text-muted)] italic">
          No source document linked to this prompt.
        </div>
      </InspectorSection>
    );
  }

  return (
    <InspectorSection
      title="Source Context"
      collapsible
      defaultCollapsed
    >
      <div data-testid="source-context-toggle">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--glass-text-muted)]">
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            Loading source context...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--semantic-error)' }}>
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {/* Content */}
        {data && (
          <div className="space-y-3" data-testid="source-passage">
            {/* Document header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                {data.title}
              </span>
              <a
                href={`/foundation/pipeline?doc=${documentId}`}
                className="text-xs text-[var(--accent-cyan)] hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Document
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>

            {/* Extracted passage */}
            {data.extractedPassage && (
              <blockquote className="border-l-2 border-[var(--accent-cyan)] pl-3 text-sm text-[var(--glass-text-secondary)] italic">
                "{data.extractedPassage}"
              </blockquote>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-3 text-xs text-[var(--glass-text-muted)]">
              {/* Confidence badge */}
              <span
                className="px-2 py-0.5 rounded"
                style={
                  data.confidence >= 0.8
                    ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
                    : data.confidence >= 0.6
                    ? { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }
                    : { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }
                }
              >
                {formatConfidence(data.confidence)} confidence
              </span>

              <span>•</span>

              {/* Extraction date */}
              <span>
                Extracted: {formatDate(data.extractedAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </InspectorSection>
  );
}

export default SourceContextSection;
