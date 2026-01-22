// src/core/schema/output-template.ts
// Output Template Schema - Configurable templates for Writer and Research agents
// Sprint: prompt-template-architecture-v1
//
// DEX: Declarative Sovereignty
// Agent output behavior is controlled via template config, not code changes.
// DEX: Provenance as Infrastructure
// Templates track source, forkedFromId, and version history.

import { z } from 'zod';

// =============================================================================
// Source Types
// =============================================================================

/**
 * Template source tracking for provenance.
 * - system-seed: Built-in templates shipped with Grove
 * - user-created: Created from scratch by user
 * - imported: Imported from external source
 * - forked: Forked from another template (system or user)
 */
export const OutputTemplateSourceSchema = z.enum([
  'system-seed',
  'user-created',
  'imported',
  'forked',
]);

export type OutputTemplateSource = z.infer<typeof OutputTemplateSourceSchema>;

// =============================================================================
// Agent Types
// =============================================================================

/**
 * Agent types that can use output templates.
 * Extensible for future agent types.
 */
export const AgentTypeSchema = z.enum(['writer', 'research', 'code']);

export type AgentType = z.infer<typeof AgentTypeSchema>;

// =============================================================================
// Template Status
// =============================================================================

/**
 * Template lifecycle status.
 * - draft: Not yet available for use
 * - active: Available for selection in UI
 * - archived: Hidden from UI, preserved for history
 */
export const OutputTemplateStatusSchema = z.enum(['active', 'archived', 'draft']);

export type OutputTemplateStatus = z.infer<typeof OutputTemplateStatusSchema>;

// =============================================================================
// Agent-Specific Configuration
// =============================================================================

/**
 * Citation style options for writer templates.
 */
export const CitationStyleSchema = z.enum(['chicago', 'apa', 'mla']);

export type CitationStyle = z.infer<typeof CitationStyleSchema>;

/**
 * Citation format options for writer templates.
 */
export const CitationFormatSchema = z.enum(['endnotes', 'inline']);

export type CitationFormat = z.infer<typeof CitationFormatSchema>;

/**
 * Agent-specific configuration options.
 * Varies by agentType:
 * - Writer: category, citationStyle, citationFormat
 * - Research: category (future: maxDepth, sourcePreferences)
 * - Code: category (future: language, lintRules)
 */
export const OutputTemplateConfigSchema = z.object({
  /** User-extensible category (e.g., 'technical', 'vision', 'policy') */
  category: z.string().optional(),

  /** Citation style for writer templates */
  citationStyle: CitationStyleSchema.optional(),

  /** Citation format for writer templates */
  citationFormat: CitationFormatSchema.optional(),
});

export type OutputTemplateConfig = z.infer<typeof OutputTemplateConfigSchema>;

// =============================================================================
// Main Payload Schema
// =============================================================================

/**
 * OutputTemplate payload - the type-specific data for an output template.
 *
 * Used with GroveObject<OutputTemplatePayload> for full object identity.
 */
export const OutputTemplatePayloadSchema = z.object({
  // === VERSIONING ===
  /** Version number (increments on each save-and-activate) */
  version: z.number().min(1).default(1),

  /** ID of previous version (for version history) */
  previousVersionId: z.string().optional(),

  /** Changelog for this version */
  changelog: z.string().optional(),

  // === IDENTITY ===
  /** Template name (user-facing) */
  name: z.string().min(1),

  /** Template description */
  description: z.string().optional(),

  // === AGENT BINDING ===
  /** Which agent type this template is for */
  agentType: AgentTypeSchema,

  // === CORE INSTRUCTION ===
  /** The system prompt that controls agent behavior */
  systemPrompt: z.string().min(1),

  // === AGENT-SPECIFIC CONFIG ===
  /** Additional configuration options */
  config: OutputTemplateConfigSchema.default({}),

  // === LIFECYCLE ===
  /** Template status */
  status: OutputTemplateStatusSchema.default('draft'),

  /** Whether this is the default template for its agent type */
  isDefault: z.boolean().default(false),

  // === PROVENANCE ===
  /** Where this template came from */
  source: OutputTemplateSourceSchema,

  /** ID of template this was forked from (if source === 'forked') */
  forkedFromId: z.string().optional(),
});

export type OutputTemplatePayload = z.infer<typeof OutputTemplatePayloadSchema>;

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_OUTPUT_TEMPLATE_CONFIG: OutputTemplateConfig = {};

export const DEFAULT_OUTPUT_TEMPLATE_PAYLOAD: OutputTemplatePayload = {
  version: 1,
  name: '',
  agentType: 'writer',
  systemPrompt: '',
  config: DEFAULT_OUTPUT_TEMPLATE_CONFIG,
  status: 'draft',
  isDefault: false,
  source: 'user-created',
};

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a new OutputTemplatePayload with optional overrides.
 */
export function createOutputTemplatePayload(
  overrides?: Partial<OutputTemplatePayload>
): OutputTemplatePayload {
  return {
    ...DEFAULT_OUTPUT_TEMPLATE_PAYLOAD,
    ...overrides,
    config: {
      ...DEFAULT_OUTPUT_TEMPLATE_CONFIG,
      ...overrides?.config,
    },
  };
}

/**
 * Create a forked template from an existing template.
 * Preserves content but updates provenance.
 */
export function forkOutputTemplate(
  original: OutputTemplatePayload,
  originalId: string
): OutputTemplatePayload {
  return {
    ...original,
    version: 1,
    previousVersionId: undefined,
    changelog: undefined,
    name: `My ${original.name}`,
    status: 'draft',
    isDefault: false,
    source: 'forked',
    forkedFromId: originalId,
  };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for OutputTemplatePayload.
 */
export function isOutputTemplatePayload(obj: unknown): obj is OutputTemplatePayload {
  const result = OutputTemplatePayloadSchema.safeParse(obj);
  return result.success;
}

/**
 * Check if a template is editable (not a system seed).
 */
export function isTemplateEditable(template: OutputTemplatePayload): boolean {
  return template.source !== 'system-seed';
}

/**
 * Check if a template can be forked.
 */
export function isTemplateForkable(template: OutputTemplatePayload): boolean {
  return template.status !== 'archived';
}
