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

  // primaryAction removed - handled by PipelineMonitorWithUpload wrapper
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
