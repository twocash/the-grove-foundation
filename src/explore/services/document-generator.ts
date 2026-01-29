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

import {
  writeResearchDocument,
  type WriterProgress,
} from './writer-agent';
import { loadTemplateById, loadDefaultTemplate, type LoadedTemplate } from './template-loader';
import { loadWriterAgentConfig } from './config-loader';

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

  /** Grove ID (for loading active configs) */
  groveId: string;

  /** Writer template ID (from output_templates) */
  writerTemplateId?: string;

  /** Optional config overrides (deprecated — use template configOverrides instead) */
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

  /** S27-OT: Which rendering instructions shaped this document */
  renderingSource?: 'template' | 'default-writer' | 'default-research';

  /** S28-PIPE: Config provenance (which versions produced this document) */
  writerConfigVersion?: number;

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
// Prompt Merge Helpers (S28-PIPE)
// =============================================================================

/**
 * Merge writer config with template overrides to build final system prompt.
 *
 * Template overrides win for fields that are set. Unset fields inherit from base config.
 *
 * @param writerConfig - Grove-wide writer config (loaded from Supabase)
 * @param template - Selected output template
 * @param query - Research query (approach)
 * @returns Final system prompt for writer agent
 */
function buildWriterPrompt(
  writerConfig: WriterAgentConfigPayload,
  template: LoadedTemplate | undefined,
  query: string
): string {
  // === DEBUG S28-PIPE: Log prompt building inputs ===
  console.log('=== PROMPT BUILD DEBUG ===');
  console.log('writerConfig.version:', writerConfig.version);
  console.log('template?.name:', template?.name);
  console.log('template?.id:', template?.id);
  if (template) {
    console.log('template.config:', template.config);
    console.log('template.systemPrompt length:', template.systemPrompt?.length);
    console.log('template.renderingInstructions length:', template.renderingInstructions?.length);
  }
  // === END DEBUG ===

  if (!template) {
    // No template: use writer config directly
    return `${writerConfig.writingStyle}

${writerConfig.resultsFormatting}

${writerConfig.citationsStyle}`;
  }

  // Get template config overrides (S28-PIPE: config field IS the overrides, no nested .overrides)
  // LoadedTemplate now includes config field directly
  const overrides = template.config as Partial<WriterAgentConfigPayload> | undefined;

  // Merge: template overrides win, otherwise inherit from base config
  const effectiveWritingStyle = overrides?.writingStyle ?? writerConfig.writingStyle;
  const effectiveFormatting = overrides?.resultsFormatting ?? writerConfig.resultsFormatting;
  const effectiveCitations = overrides?.citationsStyle ?? writerConfig.citationsStyle;

  // === DEBUG S28-PIPE: Log merge result ===
  console.log('effectiveWritingStyle source:', overrides?.writingStyle ? 'template-override' : 'base-config');
  console.log('effectiveWritingStyle preview:', effectiveWritingStyle?.substring(0, 100));
  // === END DEBUG ===

  // Build final prompt via string concatenation
  return `${template.systemPrompt}

## Approach
${query}

## Writing Style
${effectiveWritingStyle}

## Results Formatting
${effectiveFormatting}

## Citations
${effectiveCitations}

## Rendering Instructions
${template.renderingInstructions || ''}`;
}

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
      template = await loadTemplateById(request.writerTemplateId);
      if (template) {
        console.log(`[DocumentGenerator] Using template: ${template.name} (${template.id})`);
      } else {
        console.log(`[DocumentGenerator] Template ID not found: ${request.writerTemplateId}, using default`);
      }
    }

    // Fall back to default writer template
    if (!template) {
      template = await loadDefaultTemplate('writer');
      if (template) {
        console.log(`[DocumentGenerator] Using default writer template: ${template.name}`);
      }
    }

    // S28-PIPE: Load active writer config from database
    const writerConfig = await loadWriterAgentConfig(request.groveId);
    console.log(`[DocumentGenerator] Loaded writer config v${writerConfig.version}`);

    // S28-PIPE: Build merged system prompt (config + template overrides)
    const finalPrompt = buildWriterPrompt(writerConfig, template, request.query);
    console.log('[DocumentGenerator] Built merged prompt from config + template');
    console.log('[DocumentGenerator] finalPrompt length:', finalPrompt.length);
    console.log('[DocumentGenerator] finalPrompt preview:', finalPrompt.substring(0, 300) + '...');

    // Call writer agent with merged prompt
    const document = await writeResearchDocument(
      request.evidenceBundle,
      request.query,
      writerConfig, // Pass config for non-prompt settings (if any)
      onProgress,
      {
        systemPromptOverride: finalPrompt, // S28-PIPE: Use merged prompt
        renderingInstructions: '', // Already included in finalPrompt
      }
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
      renderingSource: (document as Record<string, unknown>).renderingSource as GenerateDocumentResult['renderingSource'], // S27-OT
      writerConfigVersion: writerConfig.version, // S28-PIPE: Provenance tracking
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
