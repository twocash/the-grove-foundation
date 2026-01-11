// src/bedrock/consoles/GardenConsole/document-inspector.config.ts
// Inspector configuration for document editing
// Sprint: pipeline-inspector-v1 (Epic 4)

import {
  CANONICAL_TIERS,
  DOCUMENT_TYPES,
  TEMPORAL_CLASSES,
  capitalize,
  type Document,
  type DocumentTier,
  type DocumentType,
  type TemporalClass,
} from './types';

// =============================================================================
// Types
// =============================================================================

export interface FieldOption {
  value: string;
  label: string;
}

export interface InspectorField {
  key: keyof Document | string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'datetime' | 'badge' | 'url' | 'tag-array' | 'grouped-chips' | 'list' | 'utility-bar' | 'count' | 'links';
  editable: boolean;
  options?: FieldOption[];
  placeholder?: string;
  groups?: string[]; // For grouped-chips
}

export interface InspectorSectionConfig {
  id: string;
  label: string;
  defaultOpen: boolean;
  fields: InspectorField[];
}

export interface InspectorConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  sections: InspectorSectionConfig[];
}

// =============================================================================
// Field Builders
// =============================================================================

const tierOptions: FieldOption[] = CANONICAL_TIERS.map((t) => ({
  value: t,
  label: capitalize(t),
}));

const documentTypeOptions: FieldOption[] = DOCUMENT_TYPES.map((t) => ({
  value: t,
  label: capitalize(t),
}));

const temporalClassOptions: FieldOption[] = TEMPORAL_CLASSES.map((t) => ({
  value: t,
  label: capitalize(t),
}));

const entityGroups = ['people', 'organizations', 'concepts', 'technologies'];

// =============================================================================
// Configuration Builder
// =============================================================================

export function buildDocumentInspector(doc: Document): InspectorConfig {
  return {
    title: doc.title,
    subtitle: `${capitalize(doc.tier)} · ${doc.embedding_status}`,
    icon: 'description',
    sections: [
      {
        id: 'identity',
        label: 'Identity',
        defaultOpen: true,
        fields: [
          { key: 'title', label: 'Title', type: 'text', editable: true },
          {
            key: 'tier',
            label: 'Tier',
            type: 'select',
            editable: true,
            options: tierOptions,
          },
          {
            key: 'document_type',
            label: 'Document Type',
            type: 'select',
            editable: true,
            options: documentTypeOptions,
          },
          { key: 'embedding_status', label: 'Status', type: 'badge', editable: false },
        ],
      },
      {
        id: 'provenance',
        label: 'Provenance',
        defaultOpen: false,
        fields: [
          { key: 'source_url', label: 'Source URL', type: 'url', editable: true },
          { key: 'file_type', label: 'File Type', type: 'text', editable: false },
          { key: 'created_at', label: 'Uploaded', type: 'datetime', editable: false },
          { key: 'derived_from', label: 'Derived From', type: 'links', editable: true },
          { key: 'derivatives', label: 'Derivatives', type: 'links', editable: false },
        ],
      },
      {
        id: 'enrichment',
        label: 'Enrichment',
        defaultOpen: true,
        fields: [
          {
            key: 'keywords',
            label: 'Keywords',
            type: 'tag-array',
            editable: true,
            placeholder: 'Add keyword...',
          },
          { key: 'summary', label: 'Summary', type: 'textarea', editable: true },
          {
            key: 'named_entities',
            label: 'Named Entities',
            type: 'grouped-chips',
            editable: true,
            groups: entityGroups,
          },
          {
            key: 'questions_answered',
            label: 'Questions Answered',
            type: 'list',
            editable: true,
            placeholder: 'What question does this answer?',
          },
          {
            key: 'temporal_class',
            label: 'Temporal Class',
            type: 'select',
            editable: true,
            options: temporalClassOptions,
          },
        ],
      },
      {
        id: 'usage',
        label: 'Usage Signals',
        defaultOpen: false,
        fields: [
          { key: 'retrieval_count', label: 'Retrievals', type: 'number', editable: false },
          { key: 'utility_score', label: 'Utility Score', type: 'utility-bar', editable: false },
          { key: 'last_retrieved_at', label: 'Last Retrieved', type: 'datetime', editable: false },
          { key: 'retrieval_queries', label: 'Common Queries', type: 'list', editable: false },
          { key: 'cited_by_sprouts', label: 'Cited By', type: 'count', editable: false },
        ],
      },
      {
        id: 'editorial',
        label: 'Editorial',
        defaultOpen: false,
        fields: [
          { key: 'editorial_notes', label: 'Notes', type: 'textarea', editable: true },
          { key: 'enriched_at', label: 'Enriched', type: 'datetime', editable: false },
          { key: 'enriched_by', label: 'Enriched By', type: 'text', editable: false },
        ],
      },
    ],
  };
}

// =============================================================================
// Tier Color Mapping (for badges)
// =============================================================================

export const TIER_COLORS: Record<DocumentTier, string> = {
  seed: 'var(--glass-text-subtle)',
  sprout: 'var(--neon-green, #22c55e)',
  sapling: 'var(--neon-cyan, #22d3ee)',
  tree: 'var(--neon-amber, #f59e0b)',
  grove: 'var(--neon-magenta, #d946ef)',
};

export function getTierColor(tier: DocumentTier): string {
  return TIER_COLORS[tier] || TIER_COLORS.seed;
}
