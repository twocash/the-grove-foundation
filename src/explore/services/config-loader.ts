// src/explore/services/config-loader.ts
// Config Loader - Load agent configurations for a grove
// Sprint: pipeline-integration-v1
//
// DEX: Declarative Sovereignty
// Config is loaded from storage, not hardcoded. v1.0 returns defaults.
// Future: Supabase lookup by groveId.

import {
  type ResearchAgentConfigPayload,
  DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD,
} from '@core/schema/research-agent-config';
import {
  type WriterAgentConfigPayload,
  DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
} from '@core/schema/writer-agent-config';

// =============================================================================
// Research Agent Config
// =============================================================================

/**
 * Load Research Agent configuration for a grove
 *
 * v1.0: Returns defaults
 * Future: Supabase lookup by groveId
 *
 * @param groveId - The grove identifier
 * @returns Research agent config payload
 */
export async function loadResearchAgentConfig(
  groveId: string
): Promise<ResearchAgentConfigPayload> {
  console.log(`[ConfigLoader] Loading Research Agent config for grove: ${groveId}`);

  // TODO: Supabase lookup
  // const { data } = await supabase
  //   .from('research_agent_configs')
  //   .select('payload')
  //   .eq('grove_id', groveId)
  //   .eq("meta->>'status'", 'active')
  //   .single();
  // if (data) return data.payload;

  console.log('[ConfigLoader] Using default Research Agent config');
  return DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD;
}

// =============================================================================
// Writer Agent Config
// =============================================================================

/**
 * Load Writer Agent configuration for a grove
 *
 * v1.0: Returns defaults
 * Future: Supabase lookup by groveId
 *
 * @param groveId - The grove identifier
 * @returns Writer agent config payload
 */
export async function loadWriterAgentConfig(
  groveId: string
): Promise<WriterAgentConfigPayload> {
  console.log(`[ConfigLoader] Loading Writer Agent config for grove: ${groveId}`);

  // TODO: Supabase lookup
  // const { data } = await supabase
  //   .from('writer_agent_configs')
  //   .select('payload')
  //   .eq('grove_id', groveId)
  //   .eq("meta->>'status'", 'active')
  //   .single();
  // if (data) return data.payload;

  console.log('[ConfigLoader] Using default Writer Agent config');
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
