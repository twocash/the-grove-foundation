# Architecture: pipeline-inspector-v1
**Status:** Draft
**Date:** 2025-01-03
**Authority:** ADR-001-knowledge-commons-unification.md

---

## Target State Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PIPELINE MONITOR CONSOLE                           │
├────────────────────────────────┬─────────────────┬──────────────────────────┤
│       DOCUMENT COLLECTION      │    INSPECTOR    │        COPILOT           │
│                                │                 │                          │
│  ┌───────────────────────────┐ │  ┌───────────┐  │  ┌────────────────────┐  │
│  │ [Search] [Tier▼] [Status▼]│ │  │ Identity  │  │  │ "extract keywords" │  │
│  └───────────────────────────┘ │  │───────────│  │  │ "summarize"        │  │
│                                │  │ title     │  │  │ "extract entities" │  │
│  ┌──────┐ ┌──────┐ ┌──────┐   │  │ tier      │  │  │ "suggest questions"│  │
│  │ Doc  │ │ Doc  │ │ Doc  │   │  │ type      │  │  │ "enrich"           │  │
│  │ Card │ │ Card │ │ Card │   │  │ status    │  │  │ "promote to X"     │  │
│  └──────┘ └──────┘ └──────┘   │  │           │  │  └────────────────────┘  │
│                                │  │ Provenance│  │                          │
│  ┌──────┐ ┌──────┐ ┌──────┐   │  │───────────│  │  AI Preview:             │
│  │ Doc  │ │ Doc  │ │ Doc  │   │  │ source    │  │  ┌────────────────────┐  │
│  │ Card │ │ Card │ │ Card │   │  │ uploaded  │  │  │ Keywords (5):      │  │
│  └──────┘ └──────┘ └──────┘   │  │ derived   │  │  │ [distributed]      │  │
│                                │  │           │  │  │ [consensus] [raft] │  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  │ Enrichment│  │  │                    │  │
│                                │  │───────────│  │  │ [Apply] [Edit]     │  │
│  Click card → shows in        │  │ keywords  │  │  └────────────────────┘  │
│  Inspector for editing        │  │ summary   │  │                          │
│                                │  │ entities  │  │                          │
└────────────────────────────────┴──│ questions │──┴──────────────────────────┘
                                    │           │
                                    │ Usage     │
                                    │───────────│
                                    │ utility   │
                                    │ retrievals│
                                    │ queries   │
                                    └───────────┘
```

---

## Data Architecture

### Extended Document Type

```typescript
// src/bedrock/consoles/PipelineMonitor/types.ts

export interface Document {
  // Identity (existing)
  id: string;
  title: string;
  tier: DocumentTier;
  embedding_status: DocumentStatus;
  created_at: string;
  updated_at?: string;
  
  // Content (existing)
  content?: string;
  content_length?: number;
  file_type: string;
  source_url?: string;
  
  // Provenance (new)
  source_context: {
    uploadedBy?: string;
    uploadSession?: string;
    originalPath?: string;
    capturedFrom?: 'upload' | 'api' | 'migration';
  };
  derived_from?: string[];    // Parent document UUIDs
  derivatives?: string[];     // Child documents (auto-populated)
  cited_by_sprouts?: string[];
  
  // Enrichment (new)
  keywords?: string[];
  summary?: string;
  document_type?: DocumentType;
  named_entities?: {
    people: string[];
    organizations: string[];
    concepts: string[];
    technologies: string[];
  };
  questions_answered?: string[];
  temporal_class?: TemporalClass;
  
  // Usage Signals (new, read-only)
  retrieval_count: number;
  retrieval_queries?: string[];
  last_retrieved_at?: string;
  utility_score: number;
  
  // Editorial (new)
  editorial_notes?: string;
  enriched_at?: string;
  enriched_by?: 'copilot' | 'manual' | 'bulk';
  enrichment_model?: string;
}

// Canonical tier values per ADR-001
export const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'] as const;
export type DocumentTier = typeof CANONICAL_TIERS[number];

export const DOCUMENT_TYPES = ['research', 'tutorial', 'reference', 'opinion', 'announcement', 'transcript'] as const;
export type DocumentType = typeof DOCUMENT_TYPES[number];

export const TEMPORAL_CLASSES = ['evergreen', 'current', 'dated', 'historical'] as const;
export type TemporalClass = typeof TEMPORAL_CLASSES[number];
```

---

## Console Factory Integration

```typescript
// In src/bedrock/console-factory.tsx (or equivalent)

import { buildDocumentInspector } from './consoles/PipelineMonitor/document-inspector.config';
import { buildDocumentCopilot } from './consoles/PipelineMonitor/document-copilot.config';

// Within console factory switch/map
case 'pipeline-monitor':
  return {
    inspectorConfig: selectedDocument ? buildDocumentInspector(selectedDocument) : null,
    copilotConfig: buildDocumentCopilot(selectedDocument),
    // ... other config
  };
```

---

## Inspector Configuration

```typescript
// src/bedrock/consoles/PipelineMonitor/document-inspector.config.ts

import type { InspectorConfig } from '@/bedrock/primitives/BedrockInspector';
import type { Document, DocumentTier, DocumentType, TemporalClass } from './types';

export function buildDocumentInspector(doc: Document): InspectorConfig {
  return {
    title: 'Document Details',
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
            options: CANONICAL_TIERS.map(t => ({ value: t, label: capitalize(t) }))
          },
          {
            key: 'document_type',
            label: 'Document Type',
            type: 'select',
            editable: true,
            options: DOCUMENT_TYPES.map(t => ({ value: t, label: capitalize(t) }))
          },
          { key: 'embedding_status', label: 'Status', type: 'badge', editable: false }
        ]
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
          { key: 'derivatives', label: 'Derivatives', type: 'links', editable: false }
        ]
      },
      {
        id: 'enrichment',
        label: 'Enrichment',
        defaultOpen: true,
        fields: [
          { key: 'keywords', label: 'Keywords', type: 'tag-array', editable: true },
          { key: 'summary', label: 'Summary', type: 'textarea', editable: true },
          { key: 'named_entities', label: 'Named Entities', type: 'grouped-chips', editable: true },
          { key: 'questions_answered', label: 'Questions Answered', type: 'list', editable: true },
          {
            key: 'temporal_class',
            label: 'Temporal Class',
            type: 'select',
            editable: true,
            options: TEMPORAL_CLASSES.map(t => ({ value: t, label: capitalize(t) }))
          }
        ]
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
          { key: 'cited_by_sprouts', label: 'Cited By', type: 'count', editable: false }
        ]
      },
      {
        id: 'editorial',
        label: 'Editorial',
        defaultOpen: false,
        fields: [
          { key: 'editorial_notes', label: 'Notes', type: 'textarea', editable: true },
          { key: 'enriched_at', label: 'Enriched', type: 'datetime', editable: false },
          { key: 'enriched_by', label: 'Enriched By', type: 'text', editable: false }
        ]
      }
    ]
  };
}
```

---

## Copilot Configuration

```typescript
// src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts

import type { CopilotConfig, CopilotCommand } from '@/bedrock/primitives/BedrockCopilot';
import type { Document } from './types';

export function buildDocumentCopilot(doc: Document | null): CopilotConfig {
  const commands: CopilotCommand[] = [
    // Extraction commands
    {
      id: 'extract-keywords',
      pattern: /^extract keywords?$/i,
      description: 'Extract keywords from document content',
      requiresDocument: true,
      handler: 'handleExtractKeywords',
      preview: true  // Must show preview before applying
    },
    {
      id: 'summarize',
      pattern: /^summar(ize|y)$/i,
      description: 'Generate 2-3 sentence summary',
      requiresDocument: true,
      handler: 'handleSummarize',
      preview: true
    },
    {
      id: 'extract-entities',
      pattern: /^extract entit(ies|y)$/i,
      description: 'Extract people, organizations, concepts, technologies',
      requiresDocument: true,
      handler: 'handleExtractEntities',
      preview: true
    },
    {
      id: 'suggest-questions',
      pattern: /^suggest questions?$/i,
      description: 'Suggest questions this document answers',
      requiresDocument: true,
      handler: 'handleSuggestQuestions',
      preview: true
    },
    {
      id: 'classify-type',
      pattern: /^classify type$/i,
      description: 'Classify document type based on structure',
      requiresDocument: true,
      handler: 'handleClassifyType',
      preview: true
    },
    {
      id: 'check-freshness',
      pattern: /^check freshness$/i,
      description: 'Analyze temporal markers and suggest temporal class',
      requiresDocument: true,
      handler: 'handleCheckFreshness',
      preview: true
    },
    // Compound commands
    {
      id: 'enrich',
      pattern: /^enrich$/i,
      description: 'Run all extractions (keywords, summary, entities, type)',
      requiresDocument: true,
      handler: 'handleEnrich',
      preview: true,
      compound: ['extract-keywords', 'summarize', 'extract-entities', 'classify-type']
    },
    // Action commands
    {
      id: 'promote',
      pattern: /^promote to (seed|sprout|sapling|tree|grove)$/i,
      description: 'Promote document to specified tier',
      requiresDocument: true,
      handler: 'handlePromote',
      preview: false
    },
    {
      id: 're-embed',
      pattern: /^re-?embed$/i,
      description: 'Trigger re-embedding with current enrichment',
      requiresDocument: true,
      handler: 'handleReEmbed',
      preview: false
    },
    // Analysis commands
    {
      id: 'analyze-utility',
      pattern: /^analyze utility$/i,
      description: 'Examine retrieval patterns and utility trends',
      requiresDocument: true,
      handler: 'handleAnalyzeUtility',
      preview: false
    },
    {
      id: 'find-related',
      pattern: /^find related$/i,
      description: 'Find semantically similar documents',
      requiresDocument: true,
      handler: 'handleFindRelated',
      preview: false
    }
  ];

  return {
    context: doc ? `Document: ${doc.title}` : 'No document selected',
    commands,
    placeholder: doc 
      ? 'Try: "extract keywords", "summarize", "enrich"'
      : 'Select a document to enable Copilot commands'
  };
}
```

---

## New Primitive Components

### TagArray

```tsx
// src/bedrock/primitives/TagArray.tsx

interface TagArrayProps {
  value: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Visual spec:
// ┌─────────────────────────────────────────┐
// │ ┌────────────┐ ┌──────────┐ ┌─────────┐ │
// │ │distributed×│ │consensus×│ │  raft ×│ │
// │ └────────────┘ └──────────┘ └─────────┘ │
// │ ┌─────────────────────────────────────┐ │
// │ │ + Add keyword...                    │ │
// │ └─────────────────────────────────────┘ │
// └─────────────────────────────────────────┘

// Uses --card-* tokens for chip styling
```

### GroupedChips

```tsx
// src/bedrock/primitives/GroupedChips.tsx

interface GroupedChipsProps {
  value: Record<string, string[]>;  // { people: [], organizations: [], ... }
  onChange?: (groups: Record<string, string[]>) => void;
  groups: string[];  // ['people', 'organizations', 'concepts', 'technologies']
  readOnly?: boolean;
}

// Visual spec:
// ┌─────────────────────────────────────────┐
// │ People:       [Lamport] [Ongaro] [+]    │
// │ Organizations:[Google] [Stanford] [+]   │
// │ Concepts:     [Paxos] [Consensus] [+]   │
// │ Technologies: [gRPC] [Protobuf] [+]     │
// └─────────────────────────────────────────┘
```

### UtilityBar

```tsx
// src/bedrock/primitives/UtilityBar.tsx

interface UtilityBarProps {
  score: number;  // 0 to ~5 (log scale, uncapped)
  retrievalCount: number;
  trend?: 'up' | 'down' | 'stable';
}

// Visual spec:
// ┌─────────────────────────────────────────┐
// │ ████████████░░░░░░░░  2.4 (47 retrievals)│
// │ Trend: ↑ +0.3 this week                 │
// └─────────────────────────────────────────┘
```

---

## API Endpoint Design

### POST /api/knowledge/enrich

```typescript
// Request
{
  documentId: string;
  operations: Array<'keywords' | 'summary' | 'entities' | 'type' | 'questions' | 'freshness'>;
}

// Response
{
  documentId: string;
  results: {
    keywords?: string[];
    summary?: string;
    named_entities?: { people: string[]; organizations: string[]; concepts: string[]; technologies: string[] };
    document_type?: DocumentType;
    questions_answered?: string[];
    temporal_class?: TemporalClass;
  };
  model: string;  // e.g., 'claude-3-sonnet'
}
```

### PATCH /api/knowledge/documents/[id]

```typescript
// Request (partial update)
{
  title?: string;
  tier?: DocumentTier;
  keywords?: string[];
  summary?: string;
  // ... any editable field
}

// Response
{
  success: boolean;
  document: Document;
}
```

---

## File Organization (Target State)

```
src/bedrock/
├── consoles/
│   └── PipelineMonitor/
│       ├── DocumentCard.tsx          // Fixed tier values
│       ├── DocumentsView.tsx         // Fixed tier filters
│       ├── PipelineMonitor.tsx       // Inspector/Copilot integration
│       ├── document-inspector.config.ts  // NEW
│       ├── document-copilot.config.ts    // NEW
│       ├── copilot-handlers.ts           // NEW - command implementations
│       ├── types.ts                      // NEW - Document type with enrichment
│       └── ...existing files
├── primitives/
│   ├── TagArray.tsx                  // NEW
│   ├── GroupedChips.tsx              // NEW
│   ├── UtilityBar.tsx                // NEW
│   └── ...existing files
└── ...

src/app/api/knowledge/
├── documents/
│   └── [id]/
│       └── route.ts                  // PATCH handler for updates
├── enrich/
│   └── route.ts                      // NEW - AI enrichment endpoint
└── ...existing

supabase/migrations/
├── 001_kinetic_pipeline.sql          // Existing
└── 004_document_enrichment.sql       // NEW - enrichment columns
```

---

## DEX Compliance Matrix

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Inspector config in JSON-like objects; domain expert can modify field labels, sections, editability without code changes |
| **Capability Agnosticism** | Enrichment endpoint abstracts model; works with any LLM |
| **Provenance** | Every enrichment records enriched_at, enriched_by, enrichment_model |
| **Organic Scalability** | Utility score emerges from use; no gatekeeping on tier promotion |
