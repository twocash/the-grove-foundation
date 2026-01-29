// src/explore/services/template-loader.ts
// Template Loader Service - Non-React template loading for pipeline
// Sprint: research-template-wiring-v1
//
// DEX: Capability Agnosticism
// Service layer for loading templates without React hooks.
// DEX: Provenance as Infrastructure
// Returns full template data for provenance tracking.

import { createClient } from '@supabase/supabase-js';
import type { GroveObject } from '@core/schema/grove-object';
import type { OutputTemplatePayload, AgentType } from '@core/schema/output-template';
import { getDefaults } from '@core/data';

// =============================================================================
// Supabase Client
// =============================================================================

function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[TemplateLoader] Supabase not configured, falling back to seed defaults');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

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
  /** S28-PIPE: Config overrides for writer agent (writingStyle, citationsStyle, resultsFormatting) */
  config?: Record<string, unknown>;
}

// =============================================================================
// Template Loading Functions
// =============================================================================

/**
 * Load a template by ID.
 * S28-PIPE: Queries Supabase first, falls back to seed defaults
 *
 * @param templateId - Template UUID or meta.id
 * @returns LoadedTemplate or undefined if not found
 */
export async function loadTemplateById(templateId: string): Promise<LoadedTemplate | undefined> {
  console.log('[TemplateLoader] loadTemplateById called with:', templateId);

  // Try Supabase first
  const supabase = getSupabaseClient();
  console.log('[TemplateLoader] Supabase client available:', !!supabase);
  if (supabase) {
    try {
      // Try by table ID first
      let { data, error } = await supabase
        .from('output_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      // If not found, try by meta.id
      if (!data && error?.code === 'PGRST116') {
        const result = await supabase
          .from('output_templates')
          .select('*')
          .eq("meta->>'id'", templateId)
          .single();
        data = result.data;
        error = result.error;
      }

      if (data && !error) {
        console.log(`[TemplateLoader] Loaded from Supabase: ${data.meta.title} (source: ${data.payload.source})`);
        // === DEBUG S28-PIPE: Full template data ===
        console.log('=== TEMPLATE DATA DEBUG ===');
        console.log('data.meta.id:', data.meta.id);
        console.log('data.payload.name:', data.payload.name);
        console.log('data.payload.systemPrompt length:', data.payload.systemPrompt?.length);
        console.log('data.payload.config:', data.payload.config);
        console.log('data.payload.renderingInstructions length:', data.payload.renderingInstructions?.length);
        console.log('=== END TEMPLATE DATA DEBUG ===');
        return groveObjectToLoadedTemplate(data as GroveObject<OutputTemplatePayload>);
      } else {
        console.log('[TemplateLoader] Supabase query returned no data or error:', error);
      }
    } catch (error) {
      console.error('[TemplateLoader] Supabase query failed:', error);
    }
  }

  // Fall back to seed defaults
  console.log('[TemplateLoader] Falling back to seed defaults...');
  const templates = getDefaults<OutputTemplatePayload>('output-template');
  const template = templates.find(t => t.meta.id === templateId);

  if (!template) {
    console.log(`[TemplateLoader] Template not found in Supabase or defaults: ${templateId}`);
    return undefined;
  }

  console.log(`[TemplateLoader] Loaded from defaults: ${template.payload.name}`);
  return groveObjectToLoadedTemplate(template);
}

/**
 * Get the default template for a given agent type.
 * S28-PIPE: Queries Supabase first, falls back to seed defaults
 *
 * @param agentType - 'research' | 'writer' | 'code'
 * @returns LoadedTemplate or undefined if no default exists
 */
export async function loadDefaultTemplate(agentType: AgentType): Promise<LoadedTemplate | undefined> {
  // Try Supabase first
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('output_templates')
        .select('*')
        .eq("payload->>'agentType'", agentType)
        .eq("payload->>'isDefault'", 'true')
        .eq("payload->>'status'", 'active')
        .single();

      if (data && !error) {
        console.log(`[TemplateLoader] Loaded default ${agentType} template from Supabase: ${data.meta.title}`);
        return groveObjectToLoadedTemplate(data as GroveObject<OutputTemplatePayload>);
      }
    } catch (error) {
      console.error('[TemplateLoader] Supabase query failed:', error);
    }
  }

  // Fall back to seed defaults
  const templates = getDefaults<OutputTemplatePayload>('output-template');
  const defaultTemplate = templates.find(
    t => t.payload.agentType === agentType && t.payload.isDefault && t.payload.status === 'active'
  );

  if (!defaultTemplate) {
    console.log(`[TemplateLoader] No default template for agent type: ${agentType}`);
    return undefined;
  }

  console.log(`[TemplateLoader] Loaded default ${agentType} template from defaults: ${defaultTemplate.meta.title}`);
  return groveObjectToLoadedTemplate(defaultTemplate);
}

/**
 * Get all active templates for an agent type.
 * S28-PIPE: Queries Supabase first, falls back to seed defaults
 *
 * @param agentType - 'research' | 'writer' | 'code'
 * @returns Array of LoadedTemplate
 */
export async function loadActiveTemplates(agentType: AgentType): Promise<LoadedTemplate[]> {
  // Try Supabase first
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('output_templates')
        .select('*')
        .eq("payload->>'agentType'", agentType)
        .eq("payload->>'status'", 'active');

      if (data && !error && data.length > 0) {
        console.log(`[TemplateLoader] Loaded ${data.length} ${agentType} templates from Supabase`);
        return data.map(t => groveObjectToLoadedTemplate(t as GroveObject<OutputTemplatePayload>));
      }
    } catch (error) {
      console.error('[TemplateLoader] Supabase query failed:', error);
    }
  }

  // Fall back to seed defaults
  const templates = getDefaults<OutputTemplatePayload>('output-template');
  const filtered = templates.filter(
    t => t.payload.agentType === agentType && t.payload.status === 'active'
  );

  console.log(`[TemplateLoader] Loaded ${filtered.length} ${agentType} templates from defaults`);
  return filtered.map(groveObjectToLoadedTemplate);
}

/**
 * Load template for research: by ID if provided, else default.
 *
 * This is the main entry point for the research pipeline.
 *
 * @param templateId - Optional template ID from sprout.templateId
 * @returns LoadedTemplate with systemPrompt for research agent
 */
export async function loadResearchTemplate(templateId?: string): Promise<LoadedTemplate | undefined> {
  // If templateId provided, try to load it
  if (templateId) {
    const template = await loadTemplateById(templateId);
    if (template) {
      console.log(`[TemplateLoader] Loaded template by ID: ${template.name} (${templateId})`);
      return template;
    }
    // Fall through to default if ID not found
    console.log(`[TemplateLoader] Template ID not found, falling back to default: ${templateId}`);
  }

  // Load default research template
  const defaultTemplate = await loadDefaultTemplate('research');
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
    config: obj.payload.config, // S28-PIPE: Config overrides for writer agent
  };
}
