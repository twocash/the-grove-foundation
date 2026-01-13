# Pipeline Integration v1 - Execution Prompt

**Copy this entire file to a new Claude CLI context window.**

---

## Context

You are continuing work on **The Grove Foundation** project. Your task is to execute **Sprint C: Pipeline Integration v1**.

**Previous sprints completed:**
- Sprint 1: Evidence Collection Engine ✅
- Sprint 2: Writer Agent Foundation ✅
- Experience Console Cleanup v1 ✅

**This sprint:** Wire Research Agent → Writer Agent → ResearchDocument with proper orchestration.

---

## Your Mission

Execute the Pipeline Integration sprint following these phases:

### Phase 0: Pre-work (Verify Context)
1. Read the spec: `docs/sprints/pipeline-integration-v1/SPEC.md`
2. Read existing Research Agent: `src/explore/services/research-agent.ts`
3. Read existing Writer Agent: `src/explore/services/writer-agent.ts`
4. Read EvidenceBundle schema: `src/core/schema/evidence-bundle.ts`
5. Confirm you understand the handoff artifacts

### Phase 1: Config Loader
Create `src/explore/services/config-loader.ts`:
- `loadResearchAgentConfig(groveId)` - returns defaults (Supabase-ready pattern)
- `loadWriterAgentConfig(groveId)` - returns defaults
- Both are async (ready for future Supabase lookup)

### Phase 2: Pipeline Service
Create `src/explore/services/research-pipeline.ts`:
- `executeResearchPipeline(sprout, config?, onProgress?)` - main orchestration
- `PipelineResult` interface with success, document, evidence, error
- `PipelineProgressEvent` union type for all progress events

### Phase 3: Error Handling
Implement in pipeline service:
- Wrap research phase in try/catch
- Wrap writing phase in try/catch
- Preserve partial results on failure
- Include phase information in errors

### Phase 4: Timeout Handling
Implement timeout wrapper:
- Default 90 second timeout
- Configurable via `config.timeout`
- Return partial results on timeout

### Phase 5: Progress Events
Wire progress callbacks:
- Emit `phase-started` and `phase-completed` for each phase
- Forward Research Agent events (branch-started, query-executing, etc.)
- Forward Writer Agent events (preparing, writing, formatting)
- Emit `pipeline-complete` at end

### Phase 6: Testing
Create visual QA test:
- `tests/visual-qa/pipeline-integration.spec.ts`
- Test complete pipeline execution
- Test error handling
- Test timeout behavior

### Phase 7: Documentation
Update sprint docs:
- Create `REVIEW.html` with test results
- Update Notion sprint status

---

## Key Files

**Create:**
- `src/explore/services/config-loader.ts`
- `src/explore/services/research-pipeline.ts`
- `tests/visual-qa/pipeline-integration.spec.ts`
- `docs/sprints/pipeline-integration-v1/REVIEW.html`

**Read (don't modify unless necessary):**
- `src/explore/services/research-agent.ts`
- `src/explore/services/writer-agent.ts`
- `src/core/schema/evidence-bundle.ts`
- `src/core/schema/research-document.ts`

---

## Acceptance Criteria

From the user stories (see Notion link in SPEC.md):

**US-C001: Execute End-to-End Pipeline**
```gherkin
Scenario: Complete pipeline execution
  Given I have a confirmed ResearchSprout with branches
  When I call executeResearchPipeline(sprout)
  Then the Research Agent should collect evidence
  And the Writer Agent should transform evidence to document
  And I should receive a ResearchDocument
```

**US-C002: Load Agent Configurations**
```gherkin
Scenario: Load Research Agent config returns default
  Given no custom config exists for grove "grove-123"
  When I call loadResearchAgentConfig("grove-123")
  Then I should receive DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD
```

**US-C003: Handle Research Agent Failures**
```gherkin
Scenario: Research Agent throws error
  Given the Research Agent fails with "API rate limit exceeded"
  When the pipeline catches the error
  Then it should return a failed result
  And the error message should include "research phase"
```

**US-C004: Handle Writer Agent Failures**
```gherkin
Scenario: Writer Agent throws error
  Given the Research Agent succeeded with evidence
  And the Writer Agent fails
  When the pipeline catches the error
  Then it should return the evidence bundle
  And the error should indicate "writing phase"
```

**US-C005: Handle Pipeline Timeout**
```gherkin
Scenario: Pipeline times out
  Given the pipeline timeout is set to 90 seconds
  When execution exceeds 90 seconds
  Then the pipeline should abort
  And return partial results if available
```

**US-C006: Emit Pipeline Progress Events**
```gherkin
Scenario: Pipeline emits phase events
  Given I provide an onProgress callback
  When the pipeline executes
  Then I should receive events: phase-started(research), ..., pipeline-complete
```

---

## Important Notes

1. **Keep LLM placeholders** - Don't try to wire real LLM calls. The pipeline orchestration is the goal.

2. **EvidenceBundle adapter** - Research Agent returns `Evidence[]`, but Writer expects `EvidenceBundle`. You'll need to build/adapt between them.

3. **Async config loading** - Even though we return defaults, keep the functions async for Supabase readiness.

4. **Sequential execution** - Process branches sequentially (not parallel). Simpler to debug.

5. **Update Notion** - When complete, update the Sprint Execution Tracker status.

---

## Sprint Contract

- **Codename:** pipeline-integration-v1
- **Branch:** Create `feature/pipeline-integration-v1` if needed
- **Commit style:** `feat(explore): Pipeline Integration v1 - [description]`

---

## Start Command

```bash
cd C:\GitHub\the-grove-foundation
```

Then read the SPEC.md and begin Phase 0.

Good luck!
