// src/core/schema/writer-agent-config.ts
// Writer Agent Configuration - Experience type variant
// Sprint: writer-agent-v1
//
// DEX: Declarative Sovereignty
// Writing behavior is controlled via config, not code changes.

import { z } from 'zod';

// =============================================================================
// Voice Configuration
// =============================================================================

export const VoiceConfigSchema = z.object({
  /** Writing formality level */
  formality: z.enum(['casual', 'professional', 'academic', 'technical']).default('professional'),

  /** Narrative perspective */
  perspective: z.enum(['first-person', 'third-person', 'neutral']).default('neutral'),

  /** Optional personality descriptor */
  personality: z.string().optional(),
});

export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;

// =============================================================================
// Document Structure Configuration
// =============================================================================

export const DocumentStructureConfigSchema = z.object({
  /** Include position/thesis section */
  includePosition: z.boolean().default(true),

  /** Include limitations section */
  includeLimitations: z.boolean().default(true),

  /** Citation style */
  citationStyle: z.enum(['inline', 'endnote']).default('inline'),

  /** Citation format */
  citationFormat: z.enum(['simple', 'apa', 'chicago']).default('simple'),

  /** Maximum document length in words (optional) */
  maxLength: z.number().min(100).max(10000).optional(),
});

export type DocumentStructureConfig = z.infer<typeof DocumentStructureConfigSchema>;

// =============================================================================
// Quality Rules Configuration
// =============================================================================

export const QualityRulesConfigSchema = z.object({
  /** Require citations for all claims */
  requireCitations: z.boolean().default(true),

  /** Minimum confidence score to include evidence (0-1) */
  minConfidenceToInclude: z.number().min(0).max(1).default(0.5),

  /** Flag uncertain claims in output */
  flagUncertainty: z.boolean().default(true),
});

export type QualityRulesConfig = z.infer<typeof QualityRulesConfigSchema>;

// =============================================================================
// Main Schema
// =============================================================================

export const WriterAgentConfigPayloadSchema = z.object({
  /** Voice and tone settings */
  voice: VoiceConfigSchema,

  /** Document structure settings */
  documentStructure: DocumentStructureConfigSchema,

  /** Quality control rules */
  qualityRules: QualityRulesConfigSchema,
});

export type WriterAgentConfigPayload = z.infer<typeof WriterAgentConfigPayloadSchema>;

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD: WriterAgentConfigPayload = {
  voice: {
    formality: 'professional',
    perspective: 'neutral',
  },
  documentStructure: {
    includePosition: true,
    includeLimitations: true,
    citationStyle: 'inline',
    citationFormat: 'simple',
  },
  qualityRules: {
    requireCitations: true,
    minConfidenceToInclude: 0.5,
    flagUncertainty: true,
  },
};

// =============================================================================
// Factory
// =============================================================================

export function createWriterAgentConfigPayload(
  overrides?: Partial<WriterAgentConfigPayload>
): WriterAgentConfigPayload {
  return {
    ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
    ...overrides,
    voice: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD.voice,
      ...overrides?.voice,
    },
    documentStructure: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD.documentStructure,
      ...overrides?.documentStructure,
    },
    qualityRules: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD.qualityRules,
      ...overrides?.qualityRules,
    },
  };
}
