# S22-WP / S23-SFR Developer Handoff

**Date:** 2026-01-26
**Status:** IN_PROGRESS - Session crashed, work lost
**Branch:** main (uncommitted work from 2026-01-25 session lost)
**Resume from:** Feature branch to be created

---

## Context

The output template / writer wiring fix was nearly complete when the session crashed. The developer should pick up from here after confirming the state of the code.

## What's Working

1. **Output Template System** - Fully built, 8 seed templates (4 writer, 4 research) in `data/seeds/output-templates.json`
2. **Template Loader** - `src/explore/services/template-loader.ts` loads templates by ID or default
3. **Document Generator** - `src/explore/services/document-generator.ts` correctly loads template and passes `systemPromptOverride` to writer-agent
4. **GenerateDocumentForm** - `src/surface/components/modals/SproutFinishingRoom/components/GenerateDocumentForm.tsx` has working template selector dropdown using `useOutputTemplateData()`
5. **CanonicalResearch** - S22-WP structured output stored losslessly in Supabase, display working via evidence-registry
6. **Bedrock Console** - Template management UI (`OutputTemplateCard.tsx`, `OutputTemplateEditor.tsx`) fully operational

## What's Broken

### 1. BUILD BLOCKER: Missing WriterPanel component

`ActionPanel.tsx` line 12 imports `WriterPanel` from `./components/WriterPanel` -- **this file does not exist**. Build fails:

```
Could not resolve "./components/WriterPanel" from "ActionPanel.tsx"
```

The S22-WP commit (`be75a57`) refactored ActionPanel to use WriterPanel but never created the component.

### 2. CORE MIS-WIRING: Server.js ignores template systemPrompt

**This is the key issue.** The writing prompts are an OUTPUT function (user picks template, formats completed research), NOT a research agent function. But the wiring is broken:

**writer-agent.ts** `callLLMForWriting()` sends:
```typescript
body: {
  evidence: userPrompt,
  query: systemPrompt,    // <-- Template systemPrompt sent as "query"
  voiceConfig,
}
```

**server.js** `/api/research/write` (line ~2801) receives this and:
- Treats `query` (which is the template systemPrompt) as "ORIGINAL QUESTION"
- Creates its **own hardcoded writePrompt** with inline voice instructions
- Passes everything as a single user message (no system/user split)
- **Template declarative control is completely bypassed**

The output templates' `systemPrompt` fields (Blog, Engineering, Vision, Higher Ed Policy) never reach Claude.

### 3. Signature mismatch

ActionPanel's `handleGenerateDocument` expects `(templateId: string, userNotes: string)` but `GenerateDocumentForm` calls `onGenerate(templateId?: string)` -- no `userNotes` parameter.

## Fix Sequence (was nearly complete last night)

### Fix 1: Server.js - Make it a thin passthrough

`/api/research/write` should:
- Accept `systemPrompt` as a dedicated field
- Use it as the `system` parameter in Claude API call
- Remove the hardcoded writePrompt
- DEX Pillar I: template controls behavior, server executes

### Fix 2: Writer-agent.ts - Fix parameter naming

`callLLMForWriting()` should send:
- `systemPrompt` as `systemPrompt` (not as `query`)
- Original research query as `query`
- Evidence as `evidence`

### Fix 3: WriterPanel or ActionPanel - Resolve the import

Either:
- **Option A:** Create `WriterPanel.tsx` wrapping `GenerateDocumentForm` + document preview + save-to-nursery (matches ActionPanel's expected interface)
- **Option B:** Revert ActionPanel to use `GenerateDocumentForm` directly (simpler, loses userNotes + preview features)

## Key Files

| File | Role | Issue |
|------|------|-------|
| `server.js:2801-2882` | `/api/research/write` endpoint | Hardcoded prompt bypasses templates |
| `src/explore/services/writer-agent.ts:239-297` | `callLLMForWriting()` | Sends systemPrompt as `query` |
| `src/explore/services/document-generator.ts` | Entry point for doc generation | Correctly loads template - no fix needed |
| `src/explore/services/template-loader.ts` | Template loading service | Working correctly - no fix needed |
| `src/surface/.../ActionPanel.tsx` | Right column UI | Imports missing WriterPanel |
| `src/surface/.../GenerateDocumentForm.tsx` | Template selector + generate button | Working, may need signature update |
| `data/seeds/output-templates.json` | 8 seed templates | Working - the templates ARE there |
| `docs/sprints/research-writer-panel-v1/TECH_DEBT.md` | Full tech debt inventory | Items #1 and #7 are the relevant fixes |

## Verification After Fix

1. `npm run build` must pass (WriterPanel import resolved)
2. Select a writer template (e.g., "Engineering / Architecture")
3. Generate a document from a sprout with evidence
4. Verify the output STYLE matches the template (not generic professional voice)
5. Check server logs: `[Research Write]` should show template systemPrompt being used

## DEX Compliance Note

The output templates exist as declarative system objects. Their `systemPrompt` field is the SOLE source of truth for output styling. Server.js must NOT add its own prompt logic. This is DEX Pillar I (Declarative Sovereignty): behavior is controlled by config, not code.

---

*Handoff created 2026-01-26 by Developer session (Claude Opus 4.5)*
