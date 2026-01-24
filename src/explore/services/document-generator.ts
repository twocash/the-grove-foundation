// src/explore/services/document-generator.ts
// Document Generator Service - Standalone Writer Agent trigger
// Sprint: research-template-wiring-v1
//
// This service enables user-triggered document generation AFTER research completes.
// It decouples the Writer Agent from the auto-chained research pipeline.
//
// DEX: Declarative Sovereignty
// User chooses Writer Template (blog, engineering, vision) to control output style.
//
// DEX: Provenance as Infrastructure
// Template provenance tracked through to ResearchDocument.

import type { EvidenceBundle } from '@core/schema/evidence-bundle';
import type { ResearchDocument } from '@core/schema/research-document';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';

import {
  writeResearchDocument,
  type WriterProgress,
} from './writer-agent';
import { loadTemplateById, loadDefaultTemplate, type LoadedTemplate } from './template-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * Document generation request
 */
export interface GenerateDocumentRequest {
  /** Evidence bundle from completed research */
  evidenceBundle: EvidenceBundle;

  /** Original research query/spark */
  query: string;

  /** Writer template ID (from output_templates) */
  writerTemplateId?: string;

  /** Optional config overrides */
  configOverrides?: Partial<WriterAgentConfigPayload>;
}

/**
 * Document generation result
 */
export interface GenerateDocumentResult {
  /** Whether generation succeeded */
  success: boolean;

  /** Generated document (if success) */
  document?: ResearchDocument;

  /** Template provenance */
  templateUsed?: {
    id: string;
    name: string;
    version: number;
    source: 'system-seed' | 'user-created' | 'forked' | 'imported';
  };

  /** Error message (if failed) */
  error?: string;

  /** Generation metadata */
  execution: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
  };
}

/**
 * Progress callback type
 */
export type OnGenerateProgressFn = (progress: WriterProgress) => void;

// =============================================================================
// Main Function
// =============================================================================

/**
 * Generate a document from research evidence using a selected Writer Template.
 *
 * This function is the entry point for user-triggered document generation.
 * Unlike the auto-chained pipeline, this allows users to:
 * 1. Review research evidence first
 * 2. Select a Writer Template (blog, engineering, vision, etc.)
 * 3. Generate the document on demand
 *
 * @param request - Generation request with evidence and template selection
 * @param onProgress - Optional progress callback
 * @returns GenerateDocumentResult
 */
export async function generateDocument(
  request: GenerateDocumentRequest,
  onProgress?: OnGenerateProgressFn
): Promise<GenerateDocumentResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  console.log('[DocumentGenerator] Starting document generation');
  console.log('[DocumentGenerator] Evidence bundle:', request.evidenceBundle.totalSources, 'sources');

  try {
    // Load writer template
    let template: LoadedTemplate | undefined;

    if (request.writerTemplateId) {
      template = loadTemplateById(request.writerTemplateId);
      if (template) {
        console.log(`[DocumentGenerator] Using template: ${template.name} (${template.id})`);
      } else {
        console.log(`[DocumentGenerator] Template ID not found: ${request.writerTemplateId}, using default`);
      }
    }

    // Fall back to default writer template
    if (!template) {
      template = loadDefaultTemplate('writer');
      if (template) {
        console.log(`[DocumentGenerator] Using default writer template: ${template.name}`);
      }
    }

    // Build config with overrides
    const config: WriterAgentConfigPayload = {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
      ...request.configOverrides,
    };

    // Call writer agent with template's systemPrompt
    const document = await writeResearchDocument(
      request.evidenceBundle,
      request.query,
      config,
      onProgress,
      template ? { systemPromptOverride: template.systemPrompt } : undefined
    );

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    console.log(`[DocumentGenerator] Document generated successfully in ${durationMs}ms`);

    return {
      success: true,
      document,
      templateUsed: template ? {
        id: template.id,
        name: template.name,
        version: template.version,
        source: template.source,
      } : undefined,
      execution: {
        startedAt,
        completedAt,
        durationMs,
      },
    };

  } catch (error) {
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[DocumentGenerator] Generation failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      execution: {
        startedAt,
        completedAt,
        durationMs,
      },
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

export type {
  GenerateDocumentRequest,
  GenerateDocumentResult,
  OnGenerateProgressFn,
};
