// src/bedrock/consoles/ExperienceConsole/ExperienceConsole.config.ts
// Console configuration for Experience Console
// Sprint: bedrock-ia-rename-v1 (formerly ExperienceConsole)
// Hotfix: experiences-console-v1.1 (registry integration)

import type { ConsoleConfig } from '../../types/console.types';
import { getExperienceTypeDefinition } from '../../types/experience.types';

// Get definition from registry (DEX: Organic Scalability)
const systemPromptDef = getExperienceTypeDefinition('system-prompt');

export const experienceConsoleConfig: ConsoleConfig = {
  id: 'experience',
  title: 'Experience',
  subtitle: systemPromptDef.label,
  description: systemPromptDef.description,

  metrics: [
    { id: 'total', label: 'Total', icon: systemPromptDef.icon, query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: status=active)' },
    { id: 'drafts', label: 'Drafts', icon: 'edit_note', query: 'count(where: status=draft)' },
    { id: 'archived', label: 'Archived', icon: 'archive', query: 'count(where: status=archived)' },
  ],

  navigation: [],

  collectionView: {
    searchFields: ['meta.title', 'meta.description', 'payload.identity', 'payload.voiceGuidelines'],
    filterOptions: [
      {
        field: 'meta.status',
        label: 'Status',
        type: 'select',
        options: ['active', 'draft', 'archived'],
      },
      {
        field: 'payload.responseMode',
        label: 'Response Mode',
        type: 'select',
        options: ['architect', 'librarian', 'contemplative'],
      },
      {
        field: 'payload.environment',
        label: 'Environment',
        type: 'select',
        options: ['production', 'staging', 'development'],
      },
    ],
    sortOptions: [
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'payload.version', label: 'Version', direction: 'desc' },
    ],
    defaultSort: { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-experience-favorites',
  },

  primaryAction: { label: 'New Prompt', icon: 'add', action: 'create' },

  copilot: {
    enabled: true,
    actions: [
      { id: 'set-title', trigger: 'set title to *', description: 'Update the prompt title' },
      { id: 'set-identity', trigger: 'set identity to *', description: 'Update the identity section' },
      { id: 'improve-voice', trigger: '/improve-voice', description: 'Suggest voice guideline improvements' },
      { id: 'audit', trigger: '/audit', description: 'Review prompt for consistency and gaps' },
    ],
    quickActions: [
      { id: 'audit', label: 'Audit', command: '/audit', icon: 'fact_check' },
      { id: 'improve-voice', label: 'Improve Voice', command: '/improve-voice', icon: 'record_voice_over' },
      { id: 'help', label: 'Help', command: 'help', icon: 'help' },
    ],
  },
};

// Response mode configuration for display
export const RESPONSE_MODE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  architect: { label: 'Architect', icon: 'architecture', color: '#2F5C3B' },
  librarian: { label: 'Librarian', icon: 'local_library', color: '#526F8A' },
  contemplative: { label: 'Contemplative', icon: 'psychology', color: '#7E57C2' },
};

// Closing behavior configuration for display
export const CLOSING_BEHAVIOR_CONFIG: Record<string, { label: string; icon: string }> = {
  navigation: { label: 'Navigation', icon: 'explore' },
  question: { label: 'Question', icon: 'help_outline' },
  open: { label: 'Open', icon: 'all_inclusive' },
};

export default experienceConsoleConfig;
