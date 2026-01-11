// src/bedrock/consoles/GardenConsole/pipeline.config.ts
// Configuration for Garden Console console
// Sprint: kinetic-pipeline-v1 (Epic 6)

import type { NavItem } from '../../primitives';

// =============================================================================
// Navigation Configuration
// =============================================================================

export const PIPELINE_NAV_ITEMS: NavItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    icon: 'description',
    path: '/bedrock/garden',
  },
  {
    id: 'processing',
    label: 'Processing',
    icon: 'autorenew',
    path: '/bedrock/garden/processing',
    badge: 0, // Dynamic: pending documents
  },
  {
    id: 'hubs',
    label: 'Hubs',
    icon: 'hub',
    path: '/bedrock/garden/hubs',
  },
  {
    id: 'journeys',
    label: 'Journeys',
    icon: 'route',
    path: '/bedrock/garden/journeys',
  },
];

// =============================================================================
// Pipeline Stages
// =============================================================================

export const PIPELINE_STAGES = [
  { id: 'upload', label: 'Upload', icon: 'cloud_upload', color: 'cyan' },
  { id: 'chunk', label: 'Chunk', icon: 'content_cut', color: 'cyan' },
  { id: 'embed', label: 'Embed', icon: 'mindfulness', color: 'violet' },
  { id: 'cluster', label: 'Cluster', icon: 'bubble_chart', color: 'amber' },
  { id: 'synthesize', label: 'Synthesize', icon: 'route', color: 'green' },
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number]['id'];

// =============================================================================
// Document Status
// =============================================================================

export const DOCUMENT_STATUSES = {
  pending: { label: 'Pending', color: 'neutral' as const, icon: 'hourglass_empty' },
  processing: { label: 'Processing', color: 'info' as const, icon: 'autorenew' },
  complete: { label: 'Complete', color: 'success' as const, icon: 'check_circle' },
  error: { label: 'Error', color: 'error' as const, icon: 'error' },
} as const;

export type DocumentStatus = keyof typeof DOCUMENT_STATUSES;

// =============================================================================
// Hub Status
// =============================================================================

export const HUB_STATUSES = {
  suggested: { label: 'Suggested', color: 'pending' as const },
  approved: { label: 'Approved', color: 'success' as const },
  rejected: { label: 'Rejected', color: 'neutral' as const },
  active: { label: 'Active', color: 'info' as const },
} as const;

export type HubStatus = keyof typeof HUB_STATUSES;

// =============================================================================
// API Configuration
// =============================================================================

export const PIPELINE_API = {
  upload: '/api/knowledge/upload',
  embed: '/api/knowledge/embed',
  search: '/api/knowledge/search',
  cluster: '/api/knowledge/cluster',
  hubs: '/api/knowledge/hubs',
  synthesize: '/api/knowledge/synthesize',
  journeys: '/api/knowledge/journeys',
  context: '/api/knowledge/context',
  // Sprint: extraction-pipeline-integration-v1
  extractPrompts: '/api/prompts/extract-bulk',
} as const;

// =============================================================================
// Refresh Intervals
// =============================================================================

export const REFRESH_INTERVALS = {
  metrics: 30000,     // 30 seconds
  processing: 5000,   // 5 seconds when processing active
  idle: 60000,        // 1 minute when idle
} as const;
