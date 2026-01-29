# S28-PIPE Debug Session - Continuation Prompt

**Use this prompt to resume debugging after restart:**

---

You are continuing Sprint S28-PIPE (Pipeline Architecture Rationalization) debug session.

## Context

**Sprint Goal:** Wire the Grove research pipeline so ResearchAgentConfig, WriterAgentConfig, and OutputTemplates compose declaratively to produce user-tuned documents.

**Current Status:** BLOCKED - Document generation fails with "INSUFFICIENT EVIDENCE, 1 words" error despite backend receiving 13,926 char response from Claude.

## What's Been Done (8 Commits Pushed)

1. ✅ Simplified schemas to text-based prompt fragments (not rigid enums)
2. ✅ Extracted hardcoded prompts from server.js into editable configs
3. ✅ Wired config-loader to query Supabase (removed TODO stubs)
4. ✅ Created prompt merge function (buildWriterPrompt in document-generator.ts)
5. ✅ Removed hardcoded server defaults (server requires finalPrompt from frontend)
6. ✅ Added provenance tracking (writerConfigVersion in GeneratedArtifact)
7. ✅ Inserted v2 configs into Supabase (user-revised, strategic analyst voice)
8. ✅ Inserted 8 v2 output templates into Supabase (user-revised)

**All changes committed to main and pushed to origin.**

## The Blocked User Action

**User tries:**
1. Navigate to http://localhost:3002/explore
2. Open sprout with completed research
3. Select "Vision Paper" template in SproutFinishingRoom
4. Click "Generate Artifact"

**Expected:** Vision Paper document with aspirational voice, forward-looking content

**Actual:**
```
V3: Vision Paper
Query: What about Mozilla's new $1.4B initiative?

INSUFFICIENT EVIDENCE
Confidence: 85%
1 words
```

## Evidence of the Problem

**Backend logs show SUCCESS:**
```
[Research Write] Query: Transform research into FORWARD-LOOKING VISION DOCUMENT...
[Research Write] Response received, length: 13926
```

**Frontend shows FAILURE:**
- "INSUFFICIENT EVIDENCE" text (from createInsufficientEvidenceDocument)
- "1 words" (not 13,926)
- Confidence: 85% (where does this come from?)

**Conclusion:** Backend works, response parsing or mapping is broken.

## What We Tried (4 Attempts Failed)

1. Fixed TypeScript errors (missing fields, old schema references)
2. Removed deprecated fields (category, citation enums)
3. Fixed config loading (Supabase queries, removed grove_id filter)
4. Fixed template loading (made async, query Supabase first)

**Pattern:** Each fix addressed a compile/runtime error but didn't fix the **data flow**.

**User feedback:** "This is the fourth time you've asked me to test a fix that has not appreciably addressed the blocked user action."

## Your Mission

**DO NOT apply quick fixes.**

**Instead:**

1. **Add comprehensive logging** throughout the pipeline
2. **Trace data flow** from frontend → server → Claude → response → frontend
3. **Find the exact stage** where data structure breaks
4. **Identify root cause** with evidence
5. **Present findings** to user with proposed fix
6. **Then implement** after user approval

## Investigation Protocol

### Phase 1: Add Logging (Don't Fix Yet)

Add console.log statements to trace data through these stages:

**Frontend:**
- document-generator.ts loadTemplateById() - Did it load from Supabase?
- document-generator.ts loadWriterAgentConfig() - Did it load v2?
- document-generator.ts buildWriterPrompt() - What's in finalPrompt?
- writer-agent.ts callLLMForWriting() - What's being sent to server?
- writer-agent.ts response handling - What came back from server?
- writer-agent.ts createResearchDocument() - What document was created?

**Backend:**
- server.js /api/research/write - What's in req.body?
- server.js Claude API call - What prompt is sent?
- server.js Response parsing - What did Claude return?
- server.js JSON extraction - Did parsing succeed?

### Phase 2: Run Test & Collect Logs

1. Generate document with Vision Paper template
2. Collect ALL console.log output from browser
3. Collect ALL server logs from backend
4. Analyze where data structure breaks

### Phase 3: Present Findings

**Format:**
```
=== INVESTIGATION FINDINGS ===

Stage: [Exact function/line where data breaks]
Expected: [What data should look like]
Actual: [What data actually looks like]
Root Cause: [Why this happened]

Proposed Fix: [Specific code change with file:line reference]
```

**Wait for user approval before implementing.**

## Key Files to Investigate

**Critical Path (15 stages):**
1. ActionPanel.tsx:handleGenerateDocument()
2. document-generator.ts:generateDocument()
3. config-loader.ts:loadWriterAgentConfig()
4. template-loader.ts:loadTemplateById()
5. document-generator.ts:buildWriterPrompt()
6. writer-agent.ts:writeResearchDocument()
7. writer-agent.ts:callLLMForWriting()
8. server.js:POST /api/research/write
9. server.js:Claude API call
10. server.js:JSON parsing (line 2999)
11. writer-agent.ts:Response mapping (line 284)
12. writer-agent.ts:createResearchDocument() (line 152)
13. ActionPanel.tsx:onDocumentGenerated()
14. SproutFinishingRoom.tsx:handleDocumentGenerated()
15. DocumentViewer.tsx:Display

**Trace data through all 15** to find where it breaks.

## Relevant Sprint Documentation

**Read these for context:**
- `docs/sprints/s28-pipeline-architecture-v1/DEBUG_SESSION_STATE.md` (this session's state)
- `docs/sprints/s28-pipeline-architecture-v1/SPROUT_LIFECYCLE_FLOW.md` (intended flow)
- `docs/sprints/s28-pipeline-architecture-v1/SPEC.md` (sprint goals)
- `docs/sprints/s28-pipeline-architecture-v1/AUDIT_REPORT.md` (original gaps)

**Original sprints to reference:**
- `docs/sprints/research-template-wiring-v1/` - How templates should work
- `docs/sprints/s27-ot-writer-rendering-v1/` - How renderingInstructions work
- `docs/sprints/s22-wp-writer-pipeline-v1/` - How writer pipeline was designed

## DEX Principles to Remember

**Declarative Sovereignty:**
- Behavior controlled by config, not code
- Admin can modify prompts without deployment
- No hardcoded defaults

**Provenance as Infrastructure:**
- Track which config versions produced each document
- Enable reproducibility
- Support debugging ("why different?")

**Avoid Drift to Legacy:**
- Don't touch src/foundation/, src/components/Terminal/
- Don't add GCS file loading
- Stay in active build zones (bedrock, explore, core)

## Current Code Location

```
C:\github\the-grove-foundation
Branch: main
Commit: 046fb40
Status: Clean (all changes committed and pushed)
```

## Servers Running

**Backend:** http://localhost:8080 (task bad8e3e)
**Frontend:** http://localhost:3002 (task b1fa7f0)

Both servers have latest code (046fb40).

## Your First Actions

1. Read DEBUG_SESSION_STATE.md (complete context)
2. Read SPROUT_LIFECYCLE_FLOW.md (understand intended flow)
3. Add logging to trace data flow (don't fix yet)
4. Ask user to test and collect logs
5. Analyze logs to find exact breakpoint
6. Present findings with proposed fix
7. Wait for approval
8. Implement fix
9. Test with user

**Methodical investigation, not quick fixes.**

---

## The Real Goal

**Make this pipeline work so admin can:**
- Edit ResearchAgentConfig.searchInstructions → Changes how research gathers evidence
- Edit WriterAgentConfig.writingStyle → Changes how documents are written
- Edit OutputTemplate.systemPrompt → Changes specific template behavior
- Select different templates → Get different output styles
- Track provenance → Know which configs produced each document

**Right now:** Configs are in database, code is wired, but **pipeline doesn't execute correctly**.

**The gap:** Data flow breaks somewhere between frontend and document display.

**Find it. Fix it. Test it.**

---

**Good luck. Be systematic. The architecture is sound - find where the execution breaks.**
