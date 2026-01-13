# Pipeline Integration v1 - Sprint Specification

**Sprint:** C - Pipeline Integration
**Codename:** pipeline-integration-v1
**Status:** Ready for Execution
**Dependencies:** Sprint 1 (Evidence Collection) ✅, Sprint 2 (Writer Agent) ✅

---

## Goal

Connect Research Agent → Writer Agent → ResearchDocument with proper error handling, config loading, and progress events.

---

## Scope

- End-to-end pipeline orchestration service
- Config loading pattern (defaults for v1.0, Supabase-ready)
- Error handling and graceful degradation
- Timeout handling with partial results
- Progress events flowing through pipeline

## Out of Scope

- Real LLM integration (keep placeholders)
- UI changes (Sprint 4)
- Supabase config persistence
- Parallel branch execution

---

## Key Files to Create/Modify

### New Files
- `src/explore/services/research-pipeline.ts` - Main orchestration service
- `src/explore/services/config-loader.ts` - Config loading utilities

### Modify
- `src/explore/hooks/useResearchAgent.ts` - Consume full pipeline

---

## Architectural Pattern

```typescript
// src/explore/services/research-pipeline.ts

export interface PipelineConfig {
  timeout?: number; // Default: 90000 (90 seconds)
}

export interface PipelineResult {
  success: boolean;
  document?: ResearchDocument;
  evidence?: EvidenceBundle;
  error?: {
    phase: 'research' | 'writing' | 'timeout';
    message: string;
  };
  execution: {
    startedAt: string;
    completedAt: string;
    researchDuration: number;
    writingDuration: number;
  };
}

export type PipelineProgressEvent =
  | { type: 'phase-started'; phase: 'research' | 'writing' }
  | { type: 'phase-completed'; phase: 'research' | 'writing' }
  | { type: 'pipeline-complete' }
  | ResearchProgressEvent  // Forward from Research Agent
  | WriterProgress;        // Forward from Writer Agent

export async function executeResearchPipeline(
  sprout: ResearchSprout,
  config?: PipelineConfig,
  onProgress?: (event: PipelineProgressEvent) => void
): Promise<PipelineResult> {
  const startedAt = new Date().toISOString();
  const timeout = config?.timeout ?? 90000;

  // Load configs (v1.0: returns defaults)
  const researchConfig = await loadResearchAgentConfig(sprout.groveId);
  const writerConfig = await loadWriterAgentConfig(sprout.groveId);

  try {
    // Research phase
    onProgress?.({ type: 'phase-started', phase: 'research' });
    const researchResult = await withTimeout(
      executeResearch(sprout, researchConfig, onProgress),
      timeout
    );
    onProgress?.({ type: 'phase-completed', phase: 'research' });

    // Build evidence bundle from research result
    const evidenceBundle = buildEvidenceBundle(sprout.id, researchResult);

    // Writing phase
    onProgress?.({ type: 'phase-started', phase: 'writing' });
    const document = await writeResearchDocument(
      evidenceBundle,
      sprout.question,
      writerConfig,
      onProgress
    );
    onProgress?.({ type: 'phase-completed', phase: 'writing' });

    onProgress?.({ type: 'pipeline-complete' });

    return {
      success: true,
      document,
      evidence: evidenceBundle,
      execution: { ... }
    };
  } catch (error) {
    // Handle and return partial results
  }
}
```

---

## Config Loading Pattern

```typescript
// src/explore/services/config-loader.ts

import { DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD } from '@core/schema/research-agent-config';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';

/**
 * Load Research Agent config for a grove
 * v1.0: Returns defaults
 * Future: Supabase lookup by groveId
 */
export async function loadResearchAgentConfig(
  groveId: string
): Promise<ResearchAgentConfigPayload> {
  // TODO: Supabase lookup
  // const { data } = await supabase
  //   .from('research_agent_configs')
  //   .select('payload')
  //   .eq('grove_id', groveId)
  //   .eq("meta->>'status'", 'active')
  //   .single();
  // if (data) return data.payload;

  return DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD;
}

/**
 * Load Writer Agent config for a grove
 */
export async function loadWriterAgentConfig(
  groveId: string
): Promise<WriterAgentConfigPayload> {
  // TODO: Supabase lookup
  return DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD;
}
```

---

## Success Criteria

- [ ] Full pipeline executes end-to-end
- [ ] Config loading pattern established
- [ ] Error handling for research failures
- [ ] Error handling for writer failures
- [ ] Timeout handling with partial results
- [ ] Progress events flow through pipeline

---

## User Stories

See: [User Stories & Acceptance Criteria](https://www.notion.so/2e7780a78eef8149842ef820e72f1636)

| Story | Title | Priority |
|-------|-------|----------|
| US-C001 | Execute End-to-End Pipeline | P0 |
| US-C002 | Load Agent Configurations | P0 |
| US-C003 | Handle Research Agent Failures | P0 |
| US-C004 | Handle Writer Agent Failures | P0 |
| US-C005 | Handle Pipeline Timeout | P1 |
| US-C006 | Emit Pipeline Progress Events | P1 |

---

## Reference Files

**Research Agent:**
- `src/explore/services/research-agent.ts`
- `src/core/schema/research-agent-config.ts`
- `src/core/schema/evidence-bundle.ts`

**Writer Agent:**
- `src/explore/services/writer-agent.ts`
- `src/core/schema/writer-agent-config.ts`
- `src/core/schema/research-document.ts`

**Prompts:**
- `src/explore/prompts/writer-system-prompt.ts`

**Roadmap:**
- `docs/RESEARCH_LIFECYCLE_1.0_ROADMAP.md`
