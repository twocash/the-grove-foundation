# Execution Prompt: Pipeline Monitor Factory Alignment

**Sprint:** `hotfix-pipeline-factory`  
**Goal:** Refactor PipelineMonitor to use `createBedrockConsole` factory pattern  
**Time Estimate:** 4-6 hours

---

## Context

PipelineMonitor deviates from the canonical console pattern. LensWorkshop and PromptWorkshop use `createBedrockConsole()` factory which provides:
- Automatic inspector integration via `useBedrockUI()`
- BedrockCopilot integration
- MetricsRow integration
- Unified filter/sort/favorites via `useCollectionView`

PipelineMonitor must be refactored to match.

---

## Reference Implementations

Study these files before starting:

```
src/bedrock/consoles/LensWorkshop/index.ts          # Factory usage pattern
src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts  # Config structure
src/bedrock/consoles/LensWorkshop/useLensData.ts    # Data hook pattern
src/bedrock/consoles/LensWorkshop/LensCard.tsx      # Card component props
src/bedrock/consoles/LensWorkshop/LensEditor.tsx    # Editor component props
src/bedrock/patterns/console-factory.tsx            # Factory implementation
src/bedrock/patterns/console-factory.types.ts       # Type interfaces
```

---

## Epic 1: Configuration File (30 min)

### Story 1.1: Create PipelineMonitor.config.ts

**File:** `src/bedrock/consoles/PipelineMonitor/PipelineMonitor.config.ts`

```typescript
// src/bedrock/consoles/PipelineMonitor/PipelineMonitor.config.ts
// Console configuration for Pipeline Monitor
// Sprint: hotfix-pipeline-factory

import type { ConsoleConfig } from '../../types/console.types';

export const pipelineMonitorConfig: ConsoleConfig = {
  id: 'pipeline-monitor',
  title: 'Documents',
  description: 'Knowledge pipeline management',

  metrics: [
    { id: 'total', label: 'Total', icon: 'description', query: 'count(*)' },
    { id: 'pending', label: 'Pending', icon: 'pending', query: 'count(where: embedding_status=pending)' },
    { id: 'complete', label: 'Embedded', icon: 'check_circle', query: 'count(where: embedding_status=complete)' },
  ],

  navigation: [],

  collectionView: {
    searchFields: ['meta.title', 'meta.description'],
    filterOptions: [
      {
        field: 'payload.tier',
        label: 'Tier',
        type: 'select',
        options: ['seed', 'sprout', 'sapling', 'tree', 'grove'],
      },
      {
        field: 'payload.embedding_status',
        label: 'Status',
        type: 'select',
        options: ['pending', 'processing', 'complete', 'error'],
      },
      {
        field: 'payload.document_type',
        label: 'Type',
        type: 'select',
        options: ['research', 'tutorial', 'reference', 'opinion', 'announcement', 'transcript'],
      },
    ],
    sortOptions: [
      { field: 'meta.createdAt', label: 'Date Added', direction: 'desc' },
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'payload.utility_score', label: 'Utility', direction: 'desc' },
      { field: 'payload.retrieval_count', label: 'Retrievals', direction: 'desc' },
    ],
    defaultSort: { field: 'meta.createdAt', label: 'Date Added', direction: 'desc' },
    defaultViewMode: 'list',
    viewModes: ['list', 'grid'],
    favoritesKey: 'pipeline-doc-favorites',
  },

  primaryAction: { label: 'Add Files', icon: 'add', action: 'custom' },
  copilot: {
    enabled: true,
    actions: [
      { id: 'extract-keywords', trigger: 'extract keywords', description: 'Extract keywords from document' },
      { id: 'summarize', trigger: 'summarize', description: 'Generate summary' },
      { id: 'enrich', trigger: 'enrich', description: 'Run all AI enrichment' },
      { id: 'promote', trigger: 'promote to *', description: 'Change document tier' },
    ],
  },
};

export default pipelineMonitorConfig;
```

**Verify:** `npx tsc --noEmit` passes

---

## Epic 2: Data Hook (1 hour)

### Story 2.1: Create document-transforms.ts

**File:** `src/bedrock/consoles/PipelineMonitor/document-transforms.ts`

This transforms flat Document API responses to GroveObject shape and back.

```typescript
// src/bedrock/consoles/PipelineMonitor/document-transforms.ts
// Transform functions between Document API and GroveObject shape
// Sprint: hotfix-pipeline-factory

import type { GroveObject } from '../../../core/schema/grove-object';
import type { Document, DocumentPayload } from './types';

/**
 * Transform API Document to GroveObject<DocumentPayload>
 */
export function documentToGroveObject(doc: Document): GroveObject<DocumentPayload> {
  return {
    meta: {
      id: doc.id,
      type: 'document',
      title: doc.title,
      description: doc.summary || '',
      icon: 'description',
      status: doc.embedding_status === 'complete' ? 'active' : 'draft',
      createdAt: doc.created_at,
      updatedAt: doc.updated_at || doc.created_at,
    },
    payload: {
      // Core document fields
      tier: doc.tier,
      source_url: doc.source_url,
      file_type: doc.file_type,
      content_length: doc.content_length,
      embedding_status: doc.embedding_status,
      
      // Enrichment
      keywords: doc.keywords || [],
      summary: doc.summary || '',
      document_type: doc.document_type,
      named_entities: doc.named_entities || { people: [], organizations: [], concepts: [], technologies: [] },
      questions_answered: doc.questions_answered || [],
      temporal_class: doc.temporal_class || 'evergreen',
      
      // Usage signals
      retrieval_count: doc.retrieval_count || 0,
      retrieval_queries: doc.retrieval_queries || [],
      last_retrieved_at: doc.last_retrieved_at,
      utility_score: doc.utility_score || 0,
      
      // Provenance
      source_context: doc.source_context || {},
      derived_from: doc.derived_from || [],
      derivatives: doc.derivatives || [],
      cited_by_sprouts: doc.cited_by_sprouts || [],
      
      // Editorial
      editorial_notes: doc.editorial_notes || '',
      enriched_at: doc.enriched_at,
      enriched_by: doc.enriched_by,
      enrichment_model: doc.enrichment_model,
    },
  };
}

/**
 * Transform GroveObject<DocumentPayload> back to API Document format
 */
export function groveObjectToDocument(obj: GroveObject<DocumentPayload>): Partial<Document> {
  return {
    id: obj.meta.id,
    title: obj.meta.title,
    tier: obj.payload.tier,
    embedding_status: obj.payload.embedding_status,
    keywords: obj.payload.keywords,
    summary: obj.payload.summary,
    document_type: obj.payload.document_type,
    named_entities: obj.payload.named_entities,
    questions_answered: obj.payload.questions_answered,
    temporal_class: obj.payload.temporal_class,
    editorial_notes: obj.payload.editorial_notes,
  };
}

/**
 * Create a default new document (for create action)
 */
export function createDefaultDocument(): GroveObject<DocumentPayload> {
  const now = new Date().toISOString();
  return {
    meta: {
      id: `doc-${Date.now()}`,
      type: 'document',
      title: 'New Document',
      description: '',
      icon: 'description',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    },
    payload: {
      tier: 'seed',
      source_url: '',
      file_type: '',
      content_length: 0,
      embedding_status: 'pending',
      keywords: [],
      summary: '',
      document_type: undefined,
      named_entities: { people: [], organizations: [], concepts: [], technologies: [] },
      questions_answered: [],
      temporal_class: 'evergreen',
      retrieval_count: 0,
      retrieval_queries: [],
      last_retrieved_at: undefined,
      utility_score: 0,
      source_context: {},
      derived_from: [],
      derivatives: [],
      cited_by_sprouts: [],
      editorial_notes: '',
      enriched_at: undefined,
      enriched_by: undefined,
      enrichment_model: undefined,
    },
  };
}
```

### Story 2.2: Update types.ts with DocumentPayload

**File:** `src/bedrock/consoles/PipelineMonitor/types.ts`

Add `DocumentPayload` interface for GroveObject compatibility:

```typescript
// Add to existing types.ts after Document interface

/**
 * Document payload for GroveObject wrapper
 * Maps Document fields to payload structure for factory compatibility
 */
export interface DocumentPayload {
  // Core
  tier: DocumentTier;
  source_url?: string;
  file_type?: string;
  content_length?: number;
  embedding_status: string;
  
  // Enrichment
  keywords: string[];
  summary: string;
  document_type?: string;
  named_entities: NamedEntities;
  questions_answered: string[];
  temporal_class: string;
  
  // Usage signals
  retrieval_count: number;
  retrieval_queries: string[];
  last_retrieved_at?: string;
  utility_score: number;
  
  // Provenance
  source_context: Record<string, unknown>;
  derived_from: string[];
  derivatives: string[];
  cited_by_sprouts: string[];
  
  // Editorial
  editorial_notes: string;
  enriched_at?: string;
  enriched_by?: string;
  enrichment_model?: string;
}
```

### Story 2.3: Create useDocumentData.ts

**File:** `src/bedrock/consoles/PipelineMonitor/useDocumentData.ts`

```typescript
// src/bedrock/consoles/PipelineMonitor/useDocumentData.ts
// Data hook for Pipeline Monitor - wraps API for console factory compatibility
// Sprint: hotfix-pipeline-factory

import { useState, useEffect, useCallback } from 'react';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import type { DocumentPayload, Document } from './types';
import { documentToGroveObject, groveObjectToDocument, createDefaultDocument } from './document-transforms';

/**
 * Data hook for Pipeline Monitor
 * 
 * Wraps /api/knowledge/documents endpoints to provide CollectionDataResult
 * interface expected by the console factory pattern.
 */
export function useDocumentData(): CollectionDataResult<DocumentPayload> {
  const [documents, setDocuments] = useState<GroveObject<DocumentPayload>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/knowledge/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      const transformed = (data.documents || []).map(documentToGroveObject);
      setDocuments(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Refetch
  const refetch = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Create - Note: Documents are created via upload, not direct creation
  // This returns a placeholder; actual creation happens via UploadModal
  const create = useCallback(async (): Promise<GroveObject<DocumentPayload>> => {
    // Documents are created via file upload, not direct creation
    // Return a placeholder that triggers upload modal
    return createDefaultDocument();
  }, []);

  // Update document via PATCH
  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    // Convert patch operations to update payload
    const updates: Record<string, unknown> = {};
    for (const op of operations) {
      if (op.op === 'replace') {
        // Extract field name from path like /payload/keywords or /meta/title
        const pathParts = op.path.split('/').filter(Boolean);
        if (pathParts[0] === 'payload') {
          updates[pathParts[1]] = op.value;
        } else if (pathParts[0] === 'meta' && pathParts[1] === 'title') {
          updates['title'] = op.value;
        }
      }
    }

    const response = await fetch(`/api/knowledge/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update document');

    // Update local state
    const { document } = await response.json();
    setDocuments(prev => prev.map(d => 
      d.meta.id === id ? documentToGroveObject(document) : d
    ));
  }, []);

  // Delete document
  const remove = useCallback(async (id: string) => {
    const response = await fetch(`/api/knowledge/documents/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete document');
    
    setDocuments(prev => prev.filter(d => d.meta.id !== id));
  }, []);

  // Duplicate - not typically used for documents
  const duplicate = useCallback(async (obj: GroveObject<DocumentPayload>): Promise<GroveObject<DocumentPayload>> => {
    // Documents aren't typically duplicated, but we support the interface
    const duplicated = createDefaultDocument();
    duplicated.meta.title = `${obj.meta.title} (Copy)`;
    duplicated.payload = { ...obj.payload };
    return duplicated;
  }, []);

  return {
    objects: documents,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
  };
}

export default useDocumentData;
```

**Verify:** `npx tsc --noEmit` passes

---

## Epic 3: Card Component Adaptation (30 min)

### Story 3.1: Refactor DocumentCard.tsx

**File:** `src/bedrock/consoles/PipelineMonitor/DocumentCard.tsx`

Change props interface to match `ObjectCardProps<DocumentPayload>`:

```typescript
// src/bedrock/consoles/PipelineMonitor/DocumentCard.tsx
// Card component for displaying documents in collection view
// Sprint: hotfix-pipeline-factory

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import { GlassStatusBadge } from '../../primitives';
import { DOCUMENT_STATUSES } from './pipeline.config';
import { capitalize, type DocumentPayload } from './types';

// =============================================================================
// Component
// =============================================================================

export function DocumentCard({
  object,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
}: ObjectCardProps<DocumentPayload>) {
  const statusConfig = DOCUMENT_STATUSES[object.payload.embedding_status] || DOCUMENT_STATUSES.pending;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 shadow-[0_0_20px_-5px_var(--neon-cyan)]'
          : 'border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-elevated)]'
        }
      `}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-[var(--glass-panel)] flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-xl text-[var(--glass-text-muted)]">
          description
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[var(--glass-text-primary)] truncate">
          {object.meta.title}
        </h4>
        <p className="text-xs text-[var(--glass-text-subtle)]">
          {new Date(object.meta.createdAt).toLocaleDateString()}
          {object.payload.content_length && ` · ${Math.round(object.payload.content_length / 1000)}k chars`}
        </p>
      </div>

      {/* Tier Badge */}
      <span className="px-2 py-1 text-xs rounded bg-[var(--glass-panel)] text-[var(--glass-text-muted)]">
        {capitalize(object.payload.tier)}
      </span>

      {/* Status Badge */}
      <GlassStatusBadge status={statusConfig.color} icon={statusConfig.icon} size="sm">
        {statusConfig.label}
      </GlassStatusBadge>

      {/* Favorite */}
      <button
        onClick={(e) => { e.stopPropagation(); onFavoriteToggle(); }}
        className={`p-1 rounded transition-colors ${
          isFavorite
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-muted)]'
        }`}
      >
        <span className="material-symbols-outlined text-lg">
          {isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>
    </div>
  );
}

export default DocumentCard;
```

**Verify:** `npx tsc --noEmit` passes

---

## Epic 4: Editor Component Adaptation (45 min)

### Story 4.1: Refactor DocumentEditor.tsx

**File:** `src/bedrock/consoles/PipelineMonitor/DocumentEditor.tsx`

Change props interface to match `ObjectEditorProps<DocumentPayload>`:

```typescript
// src/bedrock/consoles/PipelineMonitor/DocumentEditor.tsx
// Document editor component for inspector panel
// Sprint: hotfix-pipeline-factory

import React, { useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider, GlassButton } from '../../primitives';
import { TagArray, GroupedChips, UtilityBar, GlassStatusBadge } from '../../primitives';
import { DOCUMENT_STATUSES } from './pipeline.config';
import { CANONICAL_TIERS, capitalize, type DocumentPayload, type DocumentTier, type NamedEntities } from './types';

// =============================================================================
// Component
// =============================================================================

export function DocumentEditor({
  object,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<DocumentPayload>) {
  
  // Helper to create patch operation
  const patchPayload = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/${field}`, value };
    onEdit([op]);
  };

  const patchMeta = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/meta/${field}`, value };
    onEdit([op]);
  };

  const statusConfig = DOCUMENT_STATUSES[object.payload.embedding_status] || DOCUMENT_STATUSES.pending;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* === IDENTITY === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Title
              </label>
              <input
                type="text"
                value={object.meta.title}
                onChange={(e) => patchMeta('title', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Tier */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Tier
              </label>
              <select
                value={object.payload.tier}
                onChange={(e) => patchPayload('tier', e.target.value as DocumentTier)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {CANONICAL_TIERS.map((tier) => (
                  <option key={tier} value={tier}>{capitalize(tier)}</option>
                ))}
              </select>
            </div>

            {/* Status (read-only) */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Embedding Status
              </label>
              <GlassStatusBadge status={statusConfig.color} icon={statusConfig.icon} size="sm">
                {statusConfig.label}
              </GlassStatusBadge>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === ENRICHMENT === */}
        <InspectorSection title="Enrichment">
          <div className="space-y-4">
            {/* Keywords */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Keywords
              </label>
              <TagArray
                value={object.payload.keywords || []}
                onChange={(tags) => patchPayload('keywords', tags)}
                placeholder="Add keyword..."
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Summary
              </label>
              <textarea
                value={object.payload.summary || ''}
                onChange={(e) => patchPayload('summary', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Named Entities */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Named Entities
              </label>
              <GroupedChips
                value={object.payload.named_entities as Record<string, string[]>}
                onChange={(groups) => patchPayload('named_entities', groups)}
                groups={[
                  { key: 'people', label: 'People' },
                  { key: 'organizations', label: 'Organizations' },
                  { key: 'concepts', label: 'Concepts' },
                  { key: 'technologies', label: 'Technologies' },
                ]}
              />
            </div>

            {/* Temporal Class */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Temporal Class
              </label>
              <select
                value={object.payload.temporal_class || 'evergreen'}
                onChange={(e) => patchPayload('temporal_class', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                <option value="evergreen">Evergreen</option>
                <option value="current">Current</option>
                <option value="dated">Dated</option>
                <option value="historical">Historical</option>
              </select>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === USAGE SIGNALS === */}
        <InspectorSection title="Usage Signals" collapsible defaultCollapsed>
          <div className="space-y-4">
            {/* Utility Score */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Utility Score
              </label>
              <UtilityBar
                score={object.payload.utility_score || 0}
                retrievalCount={object.payload.retrieval_count || 0}
              />
            </div>

            {/* Retrieval Count */}
            <div className="flex justify-between">
              <span className="text-xs text-[var(--glass-text-muted)]">Retrievals</span>
              <span className="text-sm text-[var(--glass-text-secondary)]">
                {object.payload.retrieval_count || 0}
              </span>
            </div>

            {/* Last Retrieved */}
            <div className="flex justify-between">
              <span className="text-xs text-[var(--glass-text-muted)]">Last Retrieved</span>
              <span className="text-sm text-[var(--glass-text-secondary)]">
                {object.payload.last_retrieved_at 
                  ? new Date(object.payload.last_retrieved_at).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === EDITORIAL === */}
        <InspectorSection title="Editorial" collapsible defaultCollapsed>
          <div className="space-y-4">
            {/* Editorial Notes */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Notes
              </label>
              <textarea
                value={object.payload.editorial_notes || ''}
                onChange={(e) => patchPayload('editorial_notes', e.target.value)}
                rows={3}
                placeholder="Add notes about this document..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Enrichment metadata (read-only) */}
            {object.payload.enriched_at && (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--glass-text-muted)]">Enriched</dt>
                  <dd className="text-[var(--glass-text-secondary)]">
                    {new Date(object.payload.enriched_at).toLocaleDateString()}
                  </dd>
                </div>
                {object.payload.enrichment_model && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--glass-text-muted)]">Model</dt>
                    <dd className="text-[var(--glass-text-secondary)] font-mono text-xs">
                      {object.payload.enrichment_model}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex items-center gap-2">
          <GlassButton
            onClick={onSave}
            variant="primary"
            size="sm"
            disabled={loading || !hasChanges}
            className="flex-1"
          >
            {hasChanges ? 'Save Changes' : 'Saved'}
          </GlassButton>
          <GlassButton
            onClick={onDelete}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-red-400 hover:text-red-300"
            title="Delete"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default DocumentEditor;
```

**Verify:** `npx tsc --noEmit` passes

---

## Epic 5: Factory Integration (1 hour)

### Story 5.1: Update PipelineMonitor/index.ts

**File:** `src/bedrock/consoles/PipelineMonitor/index.ts`

Replace with factory pattern:

```typescript
// src/bedrock/consoles/PipelineMonitor/index.ts
// Pipeline Monitor console - built with createBedrockConsole factory
// Sprint: hotfix-pipeline-factory

import { createBedrockConsole } from '../../patterns/console-factory';
import { pipelineMonitorConfig } from './PipelineMonitor.config';
import { useDocumentData } from './useDocumentData';
import { DocumentCard } from './DocumentCard';
import { DocumentEditor } from './DocumentEditor';
import type { DocumentPayload } from './types';

/**
 * Pipeline Monitor Console
 *
 * Manages the knowledge pipeline - documents, embeddings, and enrichment.
 * Built using the Bedrock Console Factory pattern.
 */
export const PipelineMonitor = createBedrockConsole<DocumentPayload>({
  config: pipelineMonitorConfig,
  useData: useDocumentData,
  CardComponent: DocumentCard,
  EditorComponent: DocumentEditor,
  copilotTitle: 'Document Copilot',
  copilotPlaceholder: 'Try: "extract keywords", "summarize", "enrich"',
});

// Re-export configuration
export { pipelineMonitorConfig } from './PipelineMonitor.config';

// Re-export components for custom use cases
export { DocumentCard } from './DocumentCard';
export { DocumentEditor } from './DocumentEditor';
export { useDocumentData } from './useDocumentData';

// Re-export types
export type { Document, DocumentPayload, DocumentTier } from './types';

export default PipelineMonitor;
```

### Story 5.2: Delete old files

Remove these files (functionality absorbed by factory):

```bash
# DELETE these files
rm src/bedrock/consoles/PipelineMonitor/PipelineMonitor.tsx
rm src/bedrock/consoles/PipelineMonitor/DocumentsView.tsx
```

### Story 5.3: Update route import (if needed)

Check `src/app/(foundation)/bedrock/pipeline/page.tsx` uses correct import:

```typescript
import { PipelineMonitor } from '@bedrock/consoles';
```

**Verify:** 
```bash
npm run build
```

---

## Epic 6: Upload Modal Integration (30 min)

The factory pattern doesn't have a built-in custom action handler for the "Add Files" button. We need to extend slightly.

### Story 6.1: Create PipelineMonitorWithUpload wrapper

**File:** `src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx`

```typescript
// src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx
// Wrapper that adds upload modal to factory-generated console
// Sprint: hotfix-pipeline-factory

import React, { useState } from 'react';
import { PipelineMonitor } from './index';
import { UploadModal } from './UploadModal';

/**
 * Pipeline Monitor with Upload Modal
 * 
 * Wraps the factory-generated console to add the upload modal
 * triggered by the "Add Files" primary action.
 */
export function PipelineMonitorWithUpload() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <PipelineMonitor />
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={() => {
          setUploadOpen(false);
          // Factory handles refetch automatically via useDocumentData
        }}
      />
    </>
  );
}

export default PipelineMonitorWithUpload;
```

**NOTE:** The factory's primary action needs to be hooked up. This may require a small extension to the factory or config. For MVP, the upload modal can be triggered via a separate button in the page wrapper.

---

## Verification Checklist

After all changes:

```bash
# Build verification
npx tsc --noEmit
npm run build

# Start servers
node server.js  # Terminal 1
npm run dev     # Terminal 2

# Visual verification at http://localhost:3000/bedrock/pipeline
# 1. ✓ MetricsRow shows Total/Pending/Embedded
# 2. ✓ Copilot panel appears below inspector when document selected
# 3. ✓ Filter bar works (tier, status filters)
# 4. ✓ Sort dropdown works
# 5. ✓ Favorites toggle works
# 6. ✓ View mode toggle (list/grid) works
# 7. ✓ Inspector sections match LensWorkshop style
# 8. ✓ Save Changes button works
```

---

## Rollback Plan

If the refactor fails:

```bash
git checkout HEAD~1 -- src/bedrock/consoles/PipelineMonitor/
```

---

## Summary

This hotfix aligns PipelineMonitor with the canonical Bedrock console pattern:

| Before | After |
|--------|-------|
| Custom BedrockLayout | createBedrockConsole factory |
| Manual filter/sort logic | useCollectionView hook |
| No Copilot | BedrockCopilot integrated |
| No MetricsRow | MetricsRow integrated |
| Custom inspector props | Unified ObjectEditorProps |

The refactor ensures the reference implementation demonstrates all DEX patterns correctly.
