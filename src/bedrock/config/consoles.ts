// src/bedrock/config/consoles.ts
// Console Factory v2 - Console Schema Definitions
// Sprint: console-factory-v2
//
// DEX Principle: Declarative Sovereignty
// Console behavior defined in schema, not code. Adding a new console
// requires only a schema definition—no new components.

import {
  FileText,
  Flag,
  Sprout,
  Beaker,
  Settings,
  Search,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import type { ConsoleSchema, ConsoleSchemaRegistry } from '../types/ConsoleSchema';

// =============================================================================
// System Prompt Console Schema
// =============================================================================

export const systemPromptSchema: ConsoleSchema = {
  id: 'system-prompt',

  identity: {
    title: 'System Prompts',
    subtitle: 'AI behavior and personality configuration',
    icon: FileText,
    color: 'text-emerald-500',
  },

  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'draft', 'archived'],
      field: 'meta.status',
    },
  ],

  list: {
    cardVariant: 'standard',
    sortOptions: [
      { id: 'updated', label: 'Recently Updated', field: 'meta.updatedAt', direction: 'desc' },
      { id: 'name', label: 'Name', field: 'meta.title', direction: 'asc' },
      { id: 'version', label: 'Version', field: 'payload.version', direction: 'desc' },
    ],
    defaultSort: 'updated',
    viewToggle: true,
  },

  inspector: {
    titleField: 'meta.title',
    subtitleField: 'meta.id',
    statusField: 'meta.status',
    activeValue: 'active',
    fields: [
      // Identity section
      { id: 'title', label: 'Title', type: 'text', section: 'identity', required: true, path: 'meta.title' },
      { id: 'description', label: 'Description', type: 'textarea', section: 'identity', path: 'meta.description' },
      { id: 'status', label: 'Status', type: 'readonly', section: 'identity', path: 'meta.status' },

      // Config section
      { id: 'identity', label: 'AI Identity', type: 'textarea', section: 'config', path: 'payload.identity', helpText: 'Who is this AI? Define personality and role.' },
      { id: 'voiceGuidelines', label: 'Voice Guidelines', type: 'textarea', section: 'config', path: 'payload.voiceGuidelines', helpText: 'How should this AI communicate?' },
      { id: 'responseMode', label: 'Response Mode', type: 'select', section: 'config', path: 'payload.responseMode', options: [
        { value: 'architect', label: 'Architect' },
        { value: 'librarian', label: 'Librarian' },
        { value: 'contemplative', label: 'Contemplative' },
      ]},
      { id: 'closingBehavior', label: 'Closing Behavior', type: 'select', section: 'config', path: 'payload.closingBehavior', options: [
        { value: 'navigation', label: 'Navigation' },
        { value: 'question', label: 'Question' },
        { value: 'open', label: 'Open' },
      ]},

      // Logic section
      { id: 'maxTokens', label: 'Max Tokens', type: 'number', section: 'logic', path: 'payload.maxTokens' },
      { id: 'temperature', label: 'Temperature', type: 'number', section: 'logic', path: 'payload.temperature' },

      // Metadata section
      { id: 'version', label: 'Version', type: 'readonly', section: 'metadata', path: 'payload.version' },
      { id: 'createdAt', label: 'Created', type: 'readonly', section: 'metadata', path: 'meta.createdAt' },
      { id: 'updatedAt', label: 'Updated', type: 'readonly', section: 'metadata', path: 'meta.updatedAt' },
    ],
    sections: {
      identity: { title: 'Identity', defaultExpanded: true },
      config: { title: 'Configuration', defaultExpanded: true },
      logic: { title: 'Generation Settings', defaultExpanded: false },
      metadata: { title: 'Metadata', defaultExpanded: false },
    },
  },

  cardActions: [
    { id: 'activate', label: 'Activate', icon: 'play_arrow', type: 'primary' },
    { id: 'duplicate', label: 'Duplicate', icon: 'content_copy', type: 'secondary' },
  ],

  inspectorActions: {
    primary: { id: 'save', label: 'Save Changes', type: 'primary' },
    secondary: [
      { id: 'duplicate', label: 'Duplicate', icon: 'content_copy', type: 'secondary' },
      { id: 'delete', label: 'Delete', icon: 'delete', type: 'danger', confirmMessage: 'Are you sure you want to delete this system prompt?' },
    ],
  },

  metrics: [
    { id: 'total', label: 'Total', icon: 'category', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: meta.status=active)' },
    { id: 'drafts', label: 'Drafts', icon: 'edit_note', query: 'count(where: meta.status=draft)' },
  ],
};

// =============================================================================
// Feature Flag Console Schema
// =============================================================================

export const featureFlagSchema: ConsoleSchema = {
  id: 'feature-flag',

  identity: {
    title: 'Feature Flags',
    subtitle: 'Toggle features across the application',
    icon: Flag,
    color: 'text-orange-500',
  },

  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'draft', 'archived'],
      field: 'meta.status',
    },
    {
      id: 'available',
      label: 'Availability',
      type: 'select',
      options: ['true', 'false'],
      field: 'payload.available',
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: ['experience', 'research', 'experimental', 'internal'],
      field: 'payload.category',
    },
    {
      id: 'showInHeader',
      label: 'In Header',
      type: 'boolean',
      field: 'payload.showInExploreHeader',
    },
  ],

  list: {
    cardVariant: 'compact',
    sortOptions: [
      { id: 'updated', label: 'Recently Updated', field: 'meta.updatedAt', direction: 'desc' },
      { id: 'name', label: 'Name', field: 'meta.title', direction: 'asc' },
      { id: 'flagId', label: 'Flag ID', field: 'payload.flagId', direction: 'asc' },
      { id: 'headerOrder', label: 'Header Order', field: 'payload.headerOrder', direction: 'asc' },
    ],
    defaultSort: 'updated',
    viewToggle: true,
  },

  inspector: {
    titleField: 'meta.title',
    subtitleField: 'payload.flagId',
    statusField: 'payload.available',
    activeValue: true,
    fields: [
      // Identity section
      { id: 'title', label: 'Title', type: 'text', section: 'identity', required: true, path: 'meta.title' },
      { id: 'description', label: 'Description', type: 'textarea', section: 'identity', path: 'meta.description' },
      { id: 'flagId', label: 'Flag ID', type: 'readonly', section: 'identity', path: 'payload.flagId', helpText: 'Unique identifier used in code' },

      // Config section
      { id: 'available', label: 'Available', type: 'toggle', section: 'config', path: 'payload.available', helpText: 'Master switch for this feature' },
      { id: 'enabledByDefault', label: 'Enabled by Default', type: 'toggle', section: 'config', path: 'payload.enabledByDefault', helpText: 'Default state when user has no preference' },
      { id: 'category', label: 'Category', type: 'select', section: 'config', path: 'payload.category', options: [
        { value: 'experience', label: 'Experience' },
        { value: 'research', label: 'Research' },
        { value: 'experimental', label: 'Experimental' },
        { value: 'internal', label: 'Internal' },
      ]},

      // Logic section (Explore Header)
      { id: 'showInExploreHeader', label: 'Show in Header', type: 'toggle', section: 'logic', path: 'payload.showInExploreHeader', helpText: 'Display toggle in /explore header' },
      { id: 'headerLabel', label: 'Header Label', type: 'text', section: 'logic', path: 'payload.headerLabel', helpText: 'Short label for header toggle' },
      { id: 'headerOrder', label: 'Header Order', type: 'number', section: 'logic', path: 'payload.headerOrder', helpText: 'Display order in header (lower = left)' },

      // Metadata section
      { id: 'createdAt', label: 'Created', type: 'readonly', section: 'metadata', path: 'meta.createdAt' },
      { id: 'updatedAt', label: 'Updated', type: 'readonly', section: 'metadata', path: 'meta.updatedAt' },
    ],
    sections: {
      identity: { title: 'Identity', defaultExpanded: true },
      config: { title: 'Default State', defaultExpanded: true },
      logic: { title: 'Explore Header', defaultExpanded: false },
      metadata: { title: 'Metadata', defaultExpanded: false },
    },
  },

  cardActions: [
    { id: 'toggle', label: 'Toggle', icon: 'toggle_on', type: 'primary' },
    { id: 'duplicate', label: 'Duplicate', icon: 'content_copy', type: 'secondary' },
  ],

  inspectorActions: {
    primary: { id: 'save', label: 'Save Changes', type: 'primary' },
    secondary: [
      { id: 'duplicate', label: 'Duplicate', icon: 'content_copy', type: 'secondary' },
      { id: 'delete', label: 'Delete', icon: 'delete', type: 'danger', confirmMessage: 'Are you sure you want to delete this feature flag?' },
    ],
  },

  metrics: [
    { id: 'total', label: 'Total', icon: 'flag', query: 'count(*)' },
    { id: 'available', label: 'Available', icon: 'check_circle', query: 'count(where: payload.available=true)' },
    { id: 'disabled', label: 'Disabled', icon: 'block', query: 'count(where: payload.available=false)' },
    { id: 'inHeader', label: 'In Header', icon: 'visibility', query: 'count(where: payload.showInExploreHeader=true)' },
  ],
};

// =============================================================================
// Research Sprout Console Schema
// =============================================================================

export const researchSproutSchema: ConsoleSchema = {
  id: 'research-sprout',

  identity: {
    title: 'Research Sprouts',
    subtitle: 'AI-assisted research threads',
    icon: Sprout,
    color: 'text-green-500',
  },

  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['pending', 'running', 'completed', 'failed'],
      field: 'status',
    },
    {
      id: 'hypothesis_type',
      label: 'Type',
      type: 'select',
      options: ['exploratory', 'comparative', 'causal', 'descriptive'],
      field: 'hypothesis_type',
    },
  ],

  list: {
    cardVariant: 'detailed',
    sortOptions: [
      { id: 'created', label: 'Recently Created', field: 'created_at', direction: 'desc' },
      { id: 'name', label: 'Name', field: 'name', direction: 'asc' },
      { id: 'status', label: 'Status', field: 'status', direction: 'asc' },
    ],
    defaultSort: 'created',
    viewToggle: true,
  },

  inspector: {
    titleField: 'name',
    subtitleField: 'id',
    statusField: 'status',
    activeValue: 'running',
    fields: [
      // Identity section
      { id: 'name', label: 'Name', type: 'text', section: 'identity', required: true },
      { id: 'seed_query', label: 'Seed Query', type: 'textarea', section: 'identity', helpText: 'The original question or topic' },
      { id: 'status', label: 'Status', type: 'readonly', section: 'identity' },

      // Config section
      { id: 'hypothesis_type', label: 'Hypothesis Type', type: 'select', section: 'config', options: [
        { value: 'exploratory', label: 'Exploratory' },
        { value: 'comparative', label: 'Comparative' },
        { value: 'causal', label: 'Causal' },
        { value: 'descriptive', label: 'Descriptive' },
      ]},
      { id: 'model', label: 'Model', type: 'readonly', section: 'config' },

      // Metadata section
      { id: 'created_at', label: 'Created', type: 'readonly', section: 'metadata' },
      { id: 'completed_at', label: 'Completed', type: 'readonly', section: 'metadata' },
    ],
    sections: {
      identity: { title: 'Identity', defaultExpanded: true },
      config: { title: 'Configuration', defaultExpanded: true },
      logic: { title: 'Pipeline', defaultExpanded: false },
      metadata: { title: 'Metadata', defaultExpanded: false },
    },
  },

  cardActions: [
    { id: 'view', label: 'View Results', icon: 'visibility', type: 'primary' },
    { id: 'rerun', label: 'Re-run', icon: 'refresh', type: 'secondary' },
  ],

  inspectorActions: {
    primary: { id: 'view-results', label: 'View Results', type: 'primary' },
    secondary: [
      { id: 'rerun', label: 'Re-run', icon: 'refresh', type: 'secondary' },
      { id: 'archive', label: 'Archive', icon: 'archive', type: 'danger' },
    ],
  },

  metrics: [
    { id: 'total', label: 'Total', icon: 'science', query: 'count(*)' },
    { id: 'running', label: 'Running', icon: 'pending', query: 'count(where: status=running)' },
    { id: 'completed', label: 'Completed', icon: 'check_circle', query: 'count(where: status=completed)' },
    { id: 'failed', label: 'Failed', icon: 'error', query: 'count(where: status=failed)' },
  ],
};

// =============================================================================
// Prompt Architect Config Console Schema
// =============================================================================

export const promptArchitectConfigSchema: ConsoleSchema = {
  id: 'prompt-architect-config',

  identity: {
    title: 'Research Config',
    subtitle: 'Grove-level research DNA',
    icon: Beaker,
    color: 'text-purple-500',
  },

  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'draft', 'archived'],
      field: 'meta.status',
    },
  ],

  list: {
    cardVariant: 'standard',
    sortOptions: [
      { id: 'updated', label: 'Recently Updated', field: 'meta.updatedAt', direction: 'desc' },
      { id: 'name', label: 'Name', field: 'meta.title', direction: 'asc' },
    ],
    defaultSort: 'updated',
    viewToggle: false,
  },

  inspector: {
    titleField: 'meta.title',
    subtitleField: 'meta.id',
    statusField: 'meta.status',
    activeValue: 'active',
    fields: [
      // Identity section
      { id: 'title', label: 'Title', type: 'text', section: 'identity', required: true, path: 'meta.title' },
      { id: 'description', label: 'Description', type: 'textarea', section: 'identity', path: 'meta.description' },
      { id: 'status', label: 'Status', type: 'readonly', section: 'identity', path: 'meta.status' },

      // Config section
      { id: 'hypothesisGoals', label: 'Hypothesis Goals', type: 'textarea', section: 'config', path: 'payload.hypothesisGoals', helpText: 'What should research hypotheses aim to discover?' },
      { id: 'qualityGates', label: 'Quality Gates', type: 'textarea', section: 'config', path: 'payload.qualityGates', helpText: 'Criteria for accepting research outputs' },

      // Metadata section
      { id: 'createdAt', label: 'Created', type: 'readonly', section: 'metadata', path: 'meta.createdAt' },
      { id: 'updatedAt', label: 'Updated', type: 'readonly', section: 'metadata', path: 'meta.updatedAt' },
    ],
    sections: {
      identity: { title: 'Identity', defaultExpanded: true },
      config: { title: 'Research DNA', defaultExpanded: true },
      logic: { title: 'Inference Rules', defaultExpanded: false },
      metadata: { title: 'Metadata', defaultExpanded: false },
    },
  },

  inspectorActions: {
    primary: { id: 'save', label: 'Save Changes', type: 'primary' },
    secondary: [
      { id: 'duplicate', label: 'Duplicate', icon: 'content_copy', type: 'secondary' },
    ],
  },

  metrics: [
    { id: 'total', label: 'Total', icon: 'science', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: meta.status=active)' },
  ],
};

// =============================================================================
// Research Agent Config Console Schema
// =============================================================================

export const researchAgentConfigSchema: ConsoleSchema = {
  id: 'research-agent-config',

  identity: {
    title: 'Research Agents',
    subtitle: 'Configure research execution parameters',
    icon: Search,
    color: 'text-purple-500',
  },

  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'draft', 'archived'],
      field: 'meta.status',
    },
  ],

  list: {
    cardVariant: 'standard',
    sortOptions: [
      { id: 'updated', label: 'Recently Updated', field: 'meta.updatedAt', direction: 'desc' },
      { id: 'name', label: 'Name', field: 'meta.title', direction: 'asc' },
    ],
    defaultSort: 'updated',
    viewToggle: false,
  },

  inspector: {
    titleField: 'meta.title',
    subtitleField: 'meta.id',
    statusField: 'meta.status',
    activeValue: 'active',
    fields: [
      { id: 'title', label: 'Title', type: 'text', section: 'identity', required: true, path: 'meta.title' },
      { id: 'description', label: 'Description', type: 'textarea', section: 'identity', path: 'meta.description' },
      { id: 'searchDepth', label: 'Search Depth', type: 'number', section: 'config', path: 'payload.searchDepth', helpText: 'Max searches per branch (1-10)' },
      { id: 'maxApiCalls', label: 'API Call Limit', type: 'number', section: 'config', path: 'payload.maxApiCalls', helpText: 'Budget limit per execution' },
      { id: 'confidenceThreshold', label: 'Confidence Threshold', type: 'number', section: 'config', path: 'payload.confidenceThreshold', helpText: 'Minimum confidence 0-1' },
      { id: 'branchDelay', label: 'Branch Delay (ms)', type: 'number', section: 'logic', path: 'payload.branchDelay' },
    ],
    sections: {
      identity: { title: 'Identity', defaultExpanded: true },
      config: { title: 'Research Settings', defaultExpanded: true },
      logic: { title: 'Execution', defaultExpanded: false },
    },
  },

  cardActions: [],

  inspectorActions: {
    primary: { id: 'save', label: 'Save Changes', type: 'primary' },
    secondary: [
      { id: 'delete', label: 'Delete', icon: 'delete', type: 'danger', confirmMessage: 'Delete this research config?' },
    ],
  },

  metrics: [
    { id: 'total', label: 'Total', icon: 'category', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: meta.status=active)' },
  ],
};

// =============================================================================
// Writer Agent Config Console Schema
// Sprint: writer-agent-v1
// =============================================================================

export const writerAgentConfigSchema: ConsoleSchema = {
  id: 'writer-agent-config',

  identity: {
    title: 'Writer Agents',
    subtitle: 'Configure document writing behavior',
    icon: Pencil,
    color: 'text-teal-500',
  },

  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'draft', 'archived'],
      field: 'meta.status',
    },
  ],

  list: {
    cardVariant: 'standard',
    sortOptions: [
      { id: 'updated', label: 'Recently Updated', field: 'meta.updatedAt', direction: 'desc' },
      { id: 'name', label: 'Name', field: 'meta.title', direction: 'asc' },
    ],
    defaultSort: 'updated',
    viewToggle: false,
  },

  inspector: {
    titleField: 'meta.title',
    subtitleField: 'meta.id',
    statusField: 'meta.status',
    activeValue: 'active',
    fields: [
      // Identity section
      { id: 'title', label: 'Title', type: 'text', section: 'identity', required: true, path: 'meta.title' },
      { id: 'description', label: 'Description', type: 'textarea', section: 'identity', path: 'meta.description' },
      { id: 'status', label: 'Status', type: 'readonly', section: 'identity', path: 'meta.status' },

      // Voice section
      { id: 'formality', label: 'Formality', type: 'select', section: 'voice', path: 'payload.voice.formality', options: [
        { value: 'casual', label: 'Casual' },
        { value: 'professional', label: 'Professional' },
        { value: 'academic', label: 'Academic' },
        { value: 'technical', label: 'Technical' },
      ]},
      { id: 'perspective', label: 'Perspective', type: 'select', section: 'voice', path: 'payload.voice.perspective', options: [
        { value: 'first-person', label: 'First Person' },
        { value: 'third-person', label: 'Third Person' },
        { value: 'neutral', label: 'Neutral' },
      ]},
      { id: 'personality', label: 'Personality', type: 'text', section: 'voice', path: 'payload.voice.personality', helpText: 'Optional personality descriptor' },

      // Structure section
      { id: 'includePosition', label: 'Include Position', type: 'toggle', section: 'structure', path: 'payload.documentStructure.includePosition' },
      { id: 'includeLimitations', label: 'Include Limitations', type: 'toggle', section: 'structure', path: 'payload.documentStructure.includeLimitations' },
      { id: 'citationStyle', label: 'Citation Style', type: 'select', section: 'structure', path: 'payload.documentStructure.citationStyle', options: [
        { value: 'inline', label: 'Inline [1]' },
        { value: 'endnote', label: 'Endnotes' },
      ]},
      { id: 'citationFormat', label: 'Citation Format', type: 'select', section: 'structure', path: 'payload.documentStructure.citationFormat', options: [
        { value: 'simple', label: 'Simple' },
        { value: 'apa', label: 'APA' },
        { value: 'chicago', label: 'Chicago' },
      ]},
      { id: 'maxLength', label: 'Max Length (words)', type: 'number', section: 'structure', path: 'payload.documentStructure.maxLength', helpText: '100-10000 words' },

      // Quality section
      { id: 'requireCitations', label: 'Require Citations', type: 'toggle', section: 'quality', path: 'payload.qualityRules.requireCitations' },
      { id: 'minConfidenceToInclude', label: 'Min Confidence', type: 'number', section: 'quality', path: 'payload.qualityRules.minConfidenceToInclude', helpText: 'Threshold 0-1' },
      { id: 'flagUncertainty', label: 'Flag Uncertainty', type: 'toggle', section: 'quality', path: 'payload.qualityRules.flagUncertainty' },

      // Metadata section
      { id: 'createdAt', label: 'Created', type: 'readonly', section: 'metadata', path: 'meta.createdAt' },
      { id: 'updatedAt', label: 'Updated', type: 'readonly', section: 'metadata', path: 'meta.updatedAt' },
    ],
    sections: {
      identity: { title: 'Identity', defaultExpanded: true },
      voice: { title: 'Voice & Tone', defaultExpanded: true },
      structure: { title: 'Document Structure', defaultExpanded: true },
      quality: { title: 'Quality Rules', defaultExpanded: false },
      metadata: { title: 'Metadata', defaultExpanded: false },
    },
  },

  cardActions: [],

  inspectorActions: {
    primary: { id: 'save', label: 'Save Changes', type: 'primary' },
    secondary: [
      { id: 'duplicate', label: 'Duplicate', icon: 'content_copy', type: 'secondary' },
      { id: 'delete', label: 'Delete', icon: 'delete', type: 'danger', confirmMessage: 'Delete this writer config?' },
    ],
  },

  metrics: [
    { id: 'total', label: 'Total', icon: 'category', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: meta.status=active)' },
  ],
};

// =============================================================================
// Console Schema Registry
// =============================================================================

/**
 * Registry of all console schemas
 * DEX: Adding a new console requires only a schema entry here
 */
export const CONSOLE_SCHEMA_REGISTRY: ConsoleSchemaRegistry = {
  'system-prompt': systemPromptSchema,
  'feature-flag': featureFlagSchema,
  'research-sprout': researchSproutSchema,
  'prompt-architect-config': promptArchitectConfigSchema,
  'research-agent-config': researchAgentConfigSchema,
  'writer-agent-config': writerAgentConfigSchema,
};

// =============================================================================
// Registry Utilities
// =============================================================================

/**
 * Get console schema by ID
 */
export function getConsoleSchema(id: string): ConsoleSchema | undefined {
  return CONSOLE_SCHEMA_REGISTRY[id];
}

/**
 * Get all registered console schemas
 */
export function getAllConsoleSchemas(): ConsoleSchema[] {
  return Object.values(CONSOLE_SCHEMA_REGISTRY);
}

/**
 * Get console IDs
 */
export function getConsoleIds(): string[] {
  return Object.keys(CONSOLE_SCHEMA_REGISTRY);
}

/**
 * Check if console ID is registered
 */
export function hasConsoleSchema(id: string): boolean {
  return id in CONSOLE_SCHEMA_REGISTRY;
}
