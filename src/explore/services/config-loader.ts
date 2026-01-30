// src/explore/services/config-loader.ts
// Config Loader - Load agent configurations for a grove
// Sprint: pipeline-integration-v1 → s28-pipeline-architecture-v1
//
// DEX: Declarative Sovereignty
// Config is loaded from Supabase storage, not hardcoded.
//
// S28-PIPE: WIRED to database (no longer returns defaults only)

import { createClient } from '@supabase/supabase-js';
import {
  type ResearchAgentConfigPayload,
  DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD,
} from '@core/schema/research-agent-config';
import {
  type WriterAgentConfigPayload,
  DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
} from '@core/schema/writer-agent-config';

// =============================================================================
// Supabase Client
// =============================================================================

function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('[ConfigLoader] Supabase environment variables not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// =============================================================================
// Research Agent Config
// =============================================================================

/**
 * Load Research Agent configuration for a grove
 *
 * S28-PIPE: Queries Supabase for active config, falls back to defaults if none exists
 *
 * @param groveId - The grove identifier
 * @returns Research agent config payload
 */
export async function loadResearchAgentConfig(
  groveId: string
): Promise<ResearchAgentConfigPayload> {
  console.log(`[ConfigLoader] Loading Research Agent config for grove: ${groveId}`);

  try {
    const supabase = getSupabaseClient();

    // Query Supabase for active config using RPC function
    // S28-PIPE: Uses get_active_research_agent_config() defined in migration 012
    const { data, error } = await supabase
      .rpc('get_active_research_agent_config');

    if (error) {
      console.error('[ConfigLoader] Supabase RPC error:', error);
    }

    if (data?.payload) {
      console.log(`[ConfigLoader] Loaded Research Agent config v${data.payload.version} from database`);
      return data.payload;
    }
  } catch (error) {
    console.error('[ConfigLoader] Failed to load Research Agent config:', error);
  }

  // Fall back to defaults if no active config or query failed
  console.log('[ConfigLoader] Using default Research Agent config (no active config in database)');
  return DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD;
}

// =============================================================================
// Writer Agent Config
// =============================================================================

/**
 * Load Writer Agent configuration for a grove
 *
 * S28-PIPE: Queries Supabase for active config, falls back to defaults if none exists
 *
 * @param groveId - The grove identifier
 * @returns Writer agent config payload
 */
export async function loadWriterAgentConfig(
  groveId: string
): Promise<WriterAgentConfigPayload> {
  console.log(`[ConfigLoader] Loading Writer Agent config for grove: ${groveId}`);

  try {
    const supabase = getSupabaseClient();

    // Query Supabase for active config using RPC function
    // S28-PIPE: Uses get_active_writer_agent_config() defined in migration 012
    const { data, error } = await supabase
      .rpc('get_active_writer_agent_config');

    if (error) {
      console.error('[ConfigLoader] Supabase RPC error:', error);
    }

    if (data?.payload) {
      console.log(`[ConfigLoader] Loaded Writer Agent config v${data.payload.version} from database`);
      return data.payload;
    }
  } catch (error) {
    console.error('[ConfigLoader] Failed to load Writer Agent config:', error);
  }

  // Fall back to defaults if no active config or query failed
  console.log('[ConfigLoader] Using default Writer Agent config (no active config in database)');
  console.log('[ConfigLoader] DEFAULT version:', DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD.version);
  return DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD;
}

// =============================================================================
// Batch Loading (Future)
// =============================================================================

/**
 * Load both agent configs in parallel
 *
 * @param groveId - The grove identifier
 * @returns Both config payloads
 */
export async function loadPipelineConfigs(
  groveId: string
): Promise<{
  researchConfig: ResearchAgentConfigPayload;
  writerConfig: WriterAgentConfigPayload;
}> {
  const [researchConfig, writerConfig] = await Promise.all([
    loadResearchAgentConfig(groveId),
    loadWriterAgentConfig(groveId),
  ]);

  return { researchConfig, writerConfig };
}
