// src/bedrock/config/sprout-manifests.ts
// Declarative manifest definitions for sprout types
// Sprint: bedrock-foundation-v1

import type { SproutType } from '../types/sprout';

// =============================================================================
// Manifest Field Types
// =============================================================================

/**
 * Field types supported in sprout manifests
 */
export type ManifestFieldType = 'text' | 'textarea' | 'url' | 'select' | 'tags';

/**
 * Definition of a form field in a sprout manifest
 */
export interface ManifestField {
  /** Unique key for this field (used in draft storage) */
  key: string;

  /** Type of input control */
  type: ManifestFieldType;

  /** Display label */
  label: string;

  /** Is this field required? */
  required: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Options for select fields */
  options?: string[];

  /** Maximum character length */
  maxLength?: number;

  /** Hint text shown below field */
  hint?: string;

  /** Default value */
  defaultValue?: string;
}

// =============================================================================
// Sprout Manifest
// =============================================================================

/**
 * Complete manifest definition for a sprout type
 */
export interface SproutManifest {
  /** Sprout type this manifest defines */
  type: SproutType;

  /** Material icon name */
  icon: string;

  /** Human-readable label */
  label: string;

  /** Description shown in type picker */
  description: string;

  /** Form fields for this sprout type */
  fields: ManifestField[];

  /** Color accent for UI */
  color?: string;
}

// =============================================================================
// Manifest Definitions
// =============================================================================

export const SPROUT_MANIFESTS: Record<SproutType, SproutManifest> = {
  document: {
    type: 'document',
    icon: 'description',
    label: 'Document',
    description: 'A source document to add to the knowledge base',
    color: 'blue',
    fields: [
      {
        key: 'title',
        type: 'text',
        label: 'Title',
        required: true,
        placeholder: 'Document title',
        maxLength: 200,
      },
      {
        key: 'content',
        type: 'textarea',
        label: 'Content',
        required: true,
        placeholder: 'Paste or write content...',
        hint: 'You can paste markdown or plain text',
      },
      {
        key: 'sourceUrl',
        type: 'url',
        label: 'Source URL',
        required: false,
        placeholder: 'https://...',
        hint: 'Optional: Link to original source',
      },
      {
        key: 'tags',
        type: 'tags',
        label: 'Tags',
        required: false,
        placeholder: 'Add tags...',
      },
    ],
  },

  insight: {
    type: 'insight',
    icon: 'lightbulb',
    label: 'Insight',
    description: 'A key finding or observation worth preserving',
    color: 'amber',
    fields: [
      {
        key: 'title',
        type: 'text',
        label: 'Title',
        required: true,
        placeholder: 'Insight summary',
        maxLength: 200,
      },
      {
        key: 'insight',
        type: 'textarea',
        label: 'Insight',
        required: true,
        placeholder: 'Describe the insight...',
        hint: 'What did you learn or realize?',
      },
      {
        key: 'evidence',
        type: 'textarea',
        label: 'Evidence',
        required: false,
        placeholder: 'Supporting evidence...',
        hint: 'What supports this insight?',
      },
      {
        key: 'tags',
        type: 'tags',
        label: 'Tags',
        required: false,
        placeholder: 'Add tags...',
      },
    ],
  },

  question: {
    type: 'question',
    icon: 'help',
    label: 'Question',
    description: 'An open question to investigate further',
    color: 'purple',
    fields: [
      {
        key: 'question',
        type: 'text',
        label: 'Question',
        required: true,
        placeholder: 'What do you want to know?',
        maxLength: 500,
      },
      {
        key: 'context',
        type: 'textarea',
        label: 'Context',
        required: false,
        placeholder: 'Why is this important?',
        hint: 'What led you to this question?',
      },
      {
        key: 'priority',
        type: 'select',
        label: 'Priority',
        required: false,
        options: ['low', 'medium', 'high'],
        defaultValue: 'medium',
      },
      {
        key: 'tags',
        type: 'tags',
        label: 'Tags',
        required: false,
        placeholder: 'Add tags...',
      },
    ],
  },

  connection: {
    type: 'connection',
    icon: 'link',
    label: 'Connection',
    description: 'A relationship between concepts',
    color: 'green',
    fields: [
      {
        key: 'title',
        type: 'text',
        label: 'Connection',
        required: true,
        placeholder: 'Describe the connection',
        maxLength: 200,
      },
      {
        key: 'fromConcept',
        type: 'text',
        label: 'From',
        required: true,
        placeholder: 'First concept',
      },
      {
        key: 'toConcept',
        type: 'text',
        label: 'To',
        required: true,
        placeholder: 'Second concept',
      },
      {
        key: 'relationship',
        type: 'text',
        label: 'Relationship',
        required: true,
        placeholder: 'How are they related?',
        hint: 'e.g., "enables", "contradicts", "extends"',
      },
      {
        key: 'tags',
        type: 'tags',
        label: 'Tags',
        required: false,
        placeholder: 'Add tags...',
      },
    ],
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get manifest for a sprout type
 */
export function getManifest(type: SproutType): SproutManifest {
  return SPROUT_MANIFESTS[type];
}

/**
 * Get all sprout types
 */
export function getSproutTypes(): SproutType[] {
  return Object.keys(SPROUT_MANIFESTS) as SproutType[];
}

/**
 * Validate draft against manifest
 */
export function validateDraft(
  type: SproutType,
  draft: Record<string, unknown>
): { valid: boolean; errors: Record<string, string> } {
  const manifest = SPROUT_MANIFESTS[type];
  const errors: Record<string, string> = {};

  for (const field of manifest.fields) {
    const value = draft[field.key];

    if (field.required) {
      if (value === undefined || value === null || value === '') {
        errors[field.key] = `${field.label} is required`;
        continue;
      }
    }

    if (value && field.maxLength && typeof value === 'string') {
      if (value.length > field.maxLength) {
        errors[field.key] = `${field.label} must be ${field.maxLength} characters or less`;
      }
    }

    if (value && field.type === 'url' && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        errors[field.key] = `${field.label} must be a valid URL`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get default values for a manifest
 */
export function getDefaultValues(type: SproutType): Record<string, unknown> {
  const manifest = SPROUT_MANIFESTS[type];
  const defaults: Record<string, unknown> = {};

  for (const field of manifest.fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue;
    }
  }

  return defaults;
}
