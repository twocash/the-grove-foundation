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

// S28-PIPE: CitationStyle and CitationFormat removed (replaced with text-based citationsStyle in WriterAgentConfig)

/**
 * Template-specific configuration overrides (S28-PIPE: text-based).
 *
 * Templates can override specific WriterAgentConfig text fields.
 * Unset fields inherit from the active WriterAgentConfig.
 *
 * Example: "Blog Post" template overrides writingStyle to be casual,
 * but inherits resultsFormatting and citationsStyle from base config.
 */
export const OutputTemplateConfigSchema = z.object({
  /** Override WriterAgentConfig.writingStyle for this template */
  writingStyle: z.string().optional(),

  /** Override WriterAgentConfig.resultsFormatting for this template */
  resultsFormatting: z.string().optional(),

  /** Override WriterAgentConfig.citationsStyle for this template */
  citationsStyle: z.string().optional(),
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

  // === RENDERING (S27-OT) ===
  /** Optional rendering instructions for document formatting.
   *  Controls how the agent formats output (markdown rules, cite tags, JSON structure).
   *  When absent, server falls back to DEFAULT_WRITER/RESEARCH_RENDERING_RULES. */
  renderingInstructions: z.string().optional(),
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
