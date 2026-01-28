// src/explore/services/template-loader.ts
// Template Loader Service - Non-React template loading for pipeline
// Sprint: research-template-wiring-v1
//
// DEX: Capability Agnosticism
// Service layer for loading templates without React hooks.
// DEX: Provenance as Infrastructure
// Returns full template data for provenance tracking.

import type { GroveObject } from '@core/schema/grove-object';
import type { OutputTemplatePayload, AgentType } from '@core/schema/output-template';
import { getDefaults } from '@core/data';

// =============================================================================
// Types
// =============================================================================

/**
 * Loaded template result with systemPrompt and provenance
 */
export interface LoadedTemplate {
  /** Template ID */
  id: string;
  /** Template name for display */
  name: string;
  /** Template version */
  version: number;
  /** Template source for provenance */
  source: 'system-seed' | 'user-created' | 'forked' | 'imported';
  /** The systemPrompt to pass to the research agent */
  systemPrompt: string;
  /** Agent type this template is for */
  agentType: AgentType;
  /** S27-OT: Optional rendering instructions for document formatting */
  renderingInstructions?: string;
}

// =============================================================================
// Template Loading Functions
// =============================================================================

/**
 * Load a template by ID from the default templates.
 *
 * For the pipeline MVP, we load from seed defaults.
 * Future: Add Supabase direct fetch for user templates.
 *
 * @param templateId - Template UUID
 * @returns LoadedTemplate or undefined if not found
 */
export function loadTemplateById(templateId: string): LoadedTemplate | undefined {
  const templates = getDefaults<OutputTemplatePayload>('output-template');

  const template = templates.find(t => t.meta.id === templateId);
  if (!template) {
    console.log(`[TemplateLoader] Template not found: ${templateId}`);
    return undefined;
  }

  return groveObjectToLoadedTemplate(template);
}

/**
 * Get the default template for a given agent type.
 *
 * @param agentType - 'research' | 'writer' | 'code'
 * @returns LoadedTemplate or undefined if no default exists
 */
export function loadDefaultTemplate(agentType: AgentType): LoadedTemplate | undefined {
  const templates = getDefaults<OutputTemplatePayload>('output-template');

  const defaultTemplate = templates.find(
    t => t.payload.agentType === agentType && t.payload.isDefault && t.payload.status === 'active'
  );

  if (!defaultTemplate) {
    console.log(`[TemplateLoader] No default template for agent type: ${agentType}`);
    return undefined;
  }

  return groveObjectToLoadedTemplate(defaultTemplate);
}

/**
 * Get all active templates for an agent type.
 *
 * @param agentType - 'research' | 'writer' | 'code'
 * @returns Array of LoadedTemplate
 */
export function loadActiveTemplates(agentType: AgentType): LoadedTemplate[] {
  const templates = getDefaults<OutputTemplatePayload>('output-template');

  return templates
    .filter(t => t.payload.agentType === agentType && t.payload.status === 'active')
    .map(groveObjectToLoadedTemplate);
}

/**
 * Load template for research: by ID if provided, else default.
 *
 * This is the main entry point for the research pipeline.
 *
 * @param templateId - Optional template ID from sprout.templateId
 * @returns LoadedTemplate with systemPrompt for research agent
 */
export function loadResearchTemplate(templateId?: string): LoadedTemplate | undefined {
  // If templateId provided, try to load it
  if (templateId) {
    const template = loadTemplateById(templateId);
    if (template) {
      console.log(`[TemplateLoader] Loaded template by ID: ${template.name} (${templateId})`);
      return template;
    }
    // Fall through to default if ID not found
    console.log(`[TemplateLoader] Template ID not found, falling back to default: ${templateId}`);
  }

  // Load default research template
  const defaultTemplate = loadDefaultTemplate('research');
  if (defaultTemplate) {
    console.log(`[TemplateLoader] Using default research template: ${defaultTemplate.name}`);
  }

  return defaultTemplate;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Convert GroveObject<OutputTemplatePayload> to LoadedTemplate
 */
function groveObjectToLoadedTemplate(
  obj: GroveObject<OutputTemplatePayload>
): LoadedTemplate {
  return {
    id: obj.meta.id,
    name: obj.payload.name,
    version: obj.payload.version,
    source: obj.payload.source,
    systemPrompt: obj.payload.systemPrompt,
    agentType: obj.payload.agentType,
    renderingInstructions: obj.payload.renderingInstructions, // S27-OT
  };
}
