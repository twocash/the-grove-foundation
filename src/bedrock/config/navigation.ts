// src/bedrock/config/navigation.ts
// Navigation configuration for Bedrock workspace
// Sprint: bedrock-ia-rename-v1 (IA alignment)
//
// Navigation order follows Grove IA specification:
// - Dashboard (overview)
// - Knowledge Lifecycle: Nursery → Garden
// - Cultivation Tools: Lenses, Prompts
// - Delivery Configuration: Experience
//
// Note: Section dividers are a future enhancement (NavItem type doesn't support them)

import type { NavItem } from '../primitives/BedrockNav';

// =============================================================================
// Main Navigation Items
// =============================================================================

export const BEDROCK_NAV_ITEMS: NavItem[] = [
  // --- Dashboard ---
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/bedrock',
  },

  // --- Knowledge Lifecycle ---
  {
    id: 'nursery',
    label: 'Nursery',
    icon: 'eco',
    path: '/bedrock/nursery',
    badge: 0, // Will be populated dynamically
  },
  {
    id: 'garden',
    label: 'Garden',
    icon: 'park',
    path: '/bedrock/garden',
  },

  // --- Cultivation Tools ---
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

  // --- Delivery Configuration ---
  {
    id: 'experience',
    label: 'Experience',
    icon: 'smart_toy',
    path: '/bedrock/experience',
  },

  // --- Community ---
  {
    id: 'attribution',
    label: 'Community',
    icon: 'groups',
    path: '/bedrock/attribution',
  },

  // --- Future ---
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
  nursery: {
    id: 'nursery',
    title: 'Nursery',
    description: 'Cultivate and moderate knowledge contributions',
    icon: 'eco',
    path: '/bedrock/nursery',
  },
  garden: {
    id: 'garden',
    title: 'Garden',
    description: 'Mature knowledge corpus management',
    icon: 'park',
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
  experience: {
    id: 'experience',
    title: 'Experience',
    description: 'Unified management: system prompts, feature flags, and more',
    icon: 'smart_toy',
    path: '/bedrock/experience',
  },
  attribution: {
    id: 'attribution',
    title: 'Community',
    description: 'Your contribution rewards and reputation',
    icon: 'groups',
    path: '/bedrock/attribution',
  },
  knowledge: {
    id: 'knowledge',
    title: 'Knowledge Vault',
    description: 'Manage the knowledge base',
    icon: 'library_books',
    path: '/bedrock/knowledge',
  },
};
