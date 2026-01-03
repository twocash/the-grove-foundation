// src/bedrock/config/navigation.ts
// Navigation configuration for Bedrock workspace
// Sprint: bedrock-foundation-v1

import type { NavItem } from '../primitives/BedrockNav';

// =============================================================================
// Main Navigation Items
// =============================================================================

export const BEDROCK_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/bedrock',
  },
  {
    id: 'pipeline',
    label: 'Pipeline Monitor',
    icon: 'data_object',
    path: '/bedrock/pipeline',
  },
  {
    id: 'garden',
    label: 'Knowledge Garden',
    icon: 'eco',
    path: '/bedrock/garden',
    badge: 0, // Will be populated dynamically
  },
  {
    id: 'lenses',
    label: 'Lens Workshop',
    icon: 'tune',
    path: '/bedrock/lenses',
  },
  {
    id: 'prompts',
    label: 'Prompt Workshop',
    icon: 'chat',
    path: '/bedrock/prompts',
  },
  {
    id: 'journeys',
    label: 'Journey Architect',
    icon: 'route',
    path: '/bedrock/journeys',
    disabled: true, // Coming in future sprint
  },
  {
    id: 'knowledge',
    label: 'Knowledge Vault',
    icon: 'library_books',
    path: '/bedrock/knowledge',
    disabled: true, // Coming in future sprint
  },
];

// =============================================================================
// Console Metadata
// =============================================================================

export interface ConsoleMetadata {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

export const CONSOLE_METADATA: Record<string, ConsoleMetadata> = {
  dashboard: {
    id: 'dashboard',
    title: 'Bedrock Dashboard',
    description: 'Overview of your Grove workspace',
    icon: 'dashboard',
    path: '/bedrock',
  },
  pipeline: {
    id: 'pipeline',
    title: 'Pipeline Monitor',
    description: 'Monitor and manage the knowledge pipeline',
    icon: 'data_object',
    path: '/bedrock/pipeline',
  },
  garden: {
    id: 'garden',
    title: 'Knowledge Garden',
    description: 'Cultivate and moderate knowledge contributions',
    icon: 'eco',
    path: '/bedrock/garden',
  },
  lenses: {
    id: 'lenses',
    title: 'Lens Workshop',
    description: 'Create and manage exploration lenses',
    icon: 'tune',
    path: '/bedrock/lenses',
  },
  prompts: {
    id: 'prompts',
    title: 'Prompt Workshop',
    description: 'Create and manage prompts with sequence membership',
    icon: 'chat',
    path: '/bedrock/prompts',
  },
  journeys: {
    id: 'journeys',
    title: 'Journey Architect',
    description: 'Design guided exploration journeys',
    icon: 'route',
    path: '/bedrock/journeys',
  },
  knowledge: {
    id: 'knowledge',
    title: 'Knowledge Vault',
    description: 'Manage the knowledge base',
    icon: 'library_books',
    path: '/bedrock/knowledge',
  },
};
