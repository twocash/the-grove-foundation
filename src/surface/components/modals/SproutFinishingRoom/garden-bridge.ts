// src/surface/components/modals/SproutFinishingRoom/garden-bridge.ts
// Sprint: S24-SFR sfr-garden-bridge-v1
// Pattern: Pure transform function (domain → API payload)
//
// Bridges ResearchDocument + Sprout metadata into a Garden API payload.
// Two-step API strategy:
//   1. POST to /api/knowledge/upload (basic fields: title, content, tier)
//   2. PATCH to /api/knowledge/documents/:id (provenance fields)
//
// DEX: Provenance as Infrastructure
// Every promoted document tracks its lineage back to the source sprout.

import type { ResearchDocument } from '@core/schema/research-document';
import type { Sprout } from '@core/schema/sprout';

// =============================================================================
// Types
// =============================================================================

/**
 * Template context passed from the SFR when promoting an artifact.
 */
export interface TemplateInfo {
  templateId: string;
  templateName: string;
  generatedAt: string;
  /** S27-OT: Which rendering instructions shaped this artifact */
  renderingSource?: 'template' | 'default-writer' | 'default-research';
}

/**
 * Basic fields for POST /api/knowledge/upload.
 * These are the only fields the upload endpoint accepts.
 */
export interface GardenUploadPayload {
  title: string;
  content: string;
  tier: 'seed';
  sourceType: 'research';
  fileType: 'markdown';
}

/**
 * Provenance fields for PATCH /api/knowledge/documents/:id.
 * The PATCH endpoint passes all fields through to updateDocument().
 */
export interface GardenProvenancePayload {
  summary: string;
  keywords: string[];
  document_type: 'research';
  derived_from: string[];
  source_context: {
    capturedFrom: 'sprout-finishing-room';
    templateId: string;
    templateName: string;
    generatedAt: string;
    sproutQuery: string;
    confidenceScore: number;
    /** S27-OT: Which rendering instructions shaped this artifact */
    renderingSource?: 'template' | 'default-writer' | 'default-research';
  };
}

/**
 * Result from a successful Garden promotion (both steps complete).
 */
export interface PromotionResult {
  success: true;
  gardenDocId: string;
  title: string;
  tier: 'seed';
  sproutId: string;
  templateName: string;
  promotedAt: string;
  confidenceScore: number;
}

/**
 * Result from a failed Garden promotion.
 */
export interface PromotionError {
  success: false;
  error: string;
  step: 'upload' | 'provenance';
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Build the basic upload payload from a ResearchDocument.
 * Used for POST /api/knowledge/upload (step 1).
 */
export function buildUploadPayload(
  document: ResearchDocument,
  sprout: Sprout,
): GardenUploadPayload {
  // Title: use document position (thesis) truncated, or fall back to query
  const title = document.position && document.position.length > 10
    ? document.position.slice(0, 120) + (document.position.length > 120 ? '...' : '')
    : `Research: ${sprout.query.slice(0, 100)}`;

  return {
    title,
    content: document.analysis,
    tier: 'seed',
    sourceType: 'research',
    fileType: 'markdown',
  };
}

/**
 * Build the provenance payload from ResearchDocument + Sprout + Template.
 * Used for PATCH /api/knowledge/documents/:id (step 2).
 */
export function buildProvenancePayload(
  document: ResearchDocument,
  sprout: Sprout,
  templateInfo: TemplateInfo,
): GardenProvenancePayload {
  // Extract keywords from citations (unique domains) + query terms
  const domainKeywords = document.citations
    .map(c => c.domain)
    .filter((d, i, arr) => arr.indexOf(d) === i);

  const queryKeywords = sprout.query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5);

  const keywords = [...new Set([...domainKeywords, ...queryKeywords])].slice(0, 15);

  return {
    summary: document.position,
    keywords,
    document_type: 'research',
    derived_from: [sprout.id],
    source_context: {
      capturedFrom: 'sprout-finishing-room',
      templateId: templateInfo.templateId,
      templateName: templateInfo.templateName,
      generatedAt: templateInfo.generatedAt,
      sproutQuery: sprout.query,
      confidenceScore: document.confidenceScore,
      renderingSource: templateInfo.renderingSource, // S27-OT
    },
  };
}

/**
 * Execute the full Garden promotion: upload + provenance patch.
 *
 * Two-step strategy:
 *   1. POST basic fields to /api/knowledge/upload → returns { id }
 *   2. PATCH provenance fields to /api/knowledge/documents/:id
 *
 * @returns PromotionResult on success, PromotionError on failure
 */
export async function promoteToGarden(
  document: ResearchDocument,
  sprout: Sprout,
  templateInfo: TemplateInfo,
): Promise<PromotionResult | PromotionError> {
  const promotedAt = new Date().toISOString();

  // Step 1: Upload basic document
  const uploadPayload = buildUploadPayload(document, sprout);

  let gardenDocId: string;
  try {
    const uploadResponse = await fetch('/api/knowledge/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadPayload),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return { success: false, error: `Upload failed: ${errorText}`, step: 'upload' };
    }

    const uploadResult = await uploadResponse.json();
    gardenDocId = uploadResult.id || uploadResult.document?.id;

    if (!gardenDocId) {
      return { success: false, error: 'Upload succeeded but no document ID returned', step: 'upload' };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error during upload';
    return { success: false, error: message, step: 'upload' };
  }

  // Step 2: Patch provenance fields
  const provenancePayload = buildProvenancePayload(document, sprout, templateInfo);

  try {
    const patchResponse = await fetch(`/api/knowledge/documents/${gardenDocId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(provenancePayload),
    });

    if (!patchResponse.ok) {
      // Upload succeeded but provenance failed — document exists without provenance
      // This is non-fatal; user can enrich later via Garden Console
      console.warn('[garden-bridge] Provenance patch failed, document exists without provenance:', await patchResponse.text());
    }
  } catch (err) {
    // Non-fatal: document was created, provenance just wasn't attached
    console.warn('[garden-bridge] Provenance patch error (non-fatal):', err);
  }

  return {
    success: true,
    gardenDocId,
    title: uploadPayload.title,
    tier: 'seed',
    sproutId: sprout.id,
    templateName: templateInfo.templateName,
    promotedAt,
    confidenceScore: document.confidenceScore,
  };
}
