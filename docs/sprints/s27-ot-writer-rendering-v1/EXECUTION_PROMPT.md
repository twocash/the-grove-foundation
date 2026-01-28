# Execution Prompt: S27-OT Configurable Writer Rendering Instructions

## Developer Activation

```
You are acting as DEVELOPER for sprint: s27-ot-writer-rendering-v1.

CRITICAL: Execute using the Grove Execution Protocol skill.
Run: /grove-execution-protocol

This sprint replaces hardcoded rendering instruction strings in server.js
with per-template configurable renderingInstructions, completing the
two-layer prompt architecture (approach + rendering).
```

---

## Quick Context

| Field | Value |
|-------|-------|
| **Sprint** | S27-OT: Configurable Writer Rendering Instructions |
| **Domain** | Core + Server + Surface + Bedrock |
| **Pattern** | Zod schema + server refactor + pipeline passthrough + admin UI |
| **Effort** | Medium (8 files modify, 1 new, 1 data) |
| **Stories** | 9 (see Notion: [User Stories](https://www.notion.so/2f6780a78eef8114849df9ebd491e3dc)) |
| **Epics** | 5 |
| **Dependency** | None (builds on existing output_templates infrastructure) |

---

## Attention Anchor

**Re-read before every major decision:**

- **We are building:** Configurable `renderingInstructions` field on output templates, replacing hardcoded server.js strings
- **Success looks like:** Admins can customize document formatting per template; `renderingSource` provenance tracks which instructions shaped each artifact; zero hardcoded rendering strings in server.js
- **We are NOT:** Changing systemPrompts, modifying research pipeline logic, adding new agent types, or building a rendering preview
- **Architecture:** Two-layer prompt (approach + rendering) with template-first fallback chain
- **Key insight:** "Rendering rules are infrastructure, not implementation details. They deserve the same declarative treatment as system prompts."

---

## Execution Protocol

**MANDATORY:** Use the Grove Execution Protocol skill for all implementation work.

```bash
# Invoke the protocol
/grove-execution-protocol
```

The protocol enforces:
- Strangler fig compliance (Foundation is FROZEN)
- Atomic execution with build gates
- Visual verification via Playwright screenshots
- Status updates to `.agent/status/current/`

---

## Sprint Artifacts (Read These)

| Artifact | Purpose | Priority |
|----------|---------|----------|
| `SPEC.md` | Goals, ACs, File Matrix, Edge Cases | **Read First** |
| Notion User Stories | Gherkin acceptance criteria, E2E test specs | **Reference Often** |

---

## Epic Execution Order

Execute epics sequentially. Each has a build gate.

---

### Epic 1: Schema & Data Foundation (US-OT001, US-OT002, US-OT003)

**Goal:** Add `renderingInstructions` to the Zod schema and create named default constants.

#### Step 1.1: Add `renderingInstructions` to OutputTemplatePayloadSchema

**File:** `src/core/schema/output-template.ts`

Add an optional string field to the Zod schema object at line ~148 (after `forkedFromId`):

```typescript
// === RENDERING ===
/** Optional rendering instructions for document formatting (S27-OT) */
renderingInstructions: z.string().optional(),
```

This goes inside `OutputTemplatePayloadSchema` (the `z.object({...})` block).

**Verification:** `forkOutputTemplate()` uses `...original` spread, so no change needed there — the field copies automatically (AC8).

#### Step 1.2: Create rendering-defaults.ts

**File:** `src/core/config/rendering-defaults.ts` (NEW)

Create this file with two named exported constants:

```typescript
// src/core/config/rendering-defaults.ts
// Sprint: S27-OT s27-ot-writer-rendering-v1
//
// Named constants for rendering instruction defaults.
// These are the fallback when a template has no custom renderingInstructions.
//
// IMPORTANT: server.js duplicates these constants because it cannot import
// from src/core/. If you change these, update server.js to match.
// See: server.js search for "DEFAULT_WRITER_RENDERING_RULES"

/**
 * Default rendering rules for Writer agent (/api/research/write).
 * Comprehensive: markdown formatting + document structure + JSON output format.
 */
export const DEFAULT_WRITER_RENDERING_RULES = `

## Rendering Rules (ReactMarkdown + GFM)
Your output will be rendered by a markdown engine. Use rich formatting:

- **Section headers**: Use ## for major sections, ### for subsections
- **Bold key terms**: Wrap important concepts in **bold**
- **Bullet lists**: Use - for unordered lists of key findings
- **Numbered lists**: Use 1. 2. 3. for sequential steps or ranked items
- **Tables**: Use GFM markdown tables for comparisons or structured data
- **Blockquotes**: Use > for notable quotes from sources
- **Inline citations**: Use <cite index="N">cited claim</cite> HTML tags where N is the 1-based source index. Example: <cite index="1">GPU inference improved 10x</cite>

## Document Structure
1. Open with a clear thesis/position (2-3 sentences)
2. Use ## headers to organize analysis into 3-5 logical sections
3. Each section should have substantive content with specific data and evidence
4. Close with a synthesis or forward-looking conclusion
5. Note limitations honestly

## Output Format
Return valid JSON:
{
  "position": "1-3 sentence thesis statement",
  "analysis": "Full markdown document with ## sections, **bold**, lists, tables, and <cite index=\\"N\\">...</cite> tags",
  "limitations": "Honest limitations of this analysis",
  "citations": [{ "index": 1, "title": "Source title", "url": "https://...", "snippet": "relevant quote", "domain": "example.com" }]
}`;

/**
 * Default rendering rules for Research agent (/api/research/deep).
 * Lighter: markdown formatting + cite tags only.
 */
export const DEFAULT_RESEARCH_RENDERING_RULES = `

IMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`;
```

**NOTE:** The exact string content MUST match what's currently in server.js at lines 2543 and 2973-3000. Copy-paste from server.js to ensure byte-for-byte match.

#### Step 1.3: Add `renderingSource` to GeneratedArtifact

**File:** `src/core/schema/sprout.ts`

Add to the `GeneratedArtifact` interface (after `savedAt?` field, around line 31):

```typescript
/** Which rendering instructions shaped this artifact (S27-OT provenance) */
renderingSource?: 'template' | 'default-writer' | 'default-research';
```

**Build Gate:** `npm run build`
**Commit:** `feat(S27-OT): add renderingInstructions schema and named constants`

---

### Epic 2: Server-Side Template Hydration (US-OT004, US-OT005)

**Goal:** Replace hardcoded rendering strings in server.js with template lookup + fallback.

#### Step 2.1: Add named constants to server.js

**File:** `server.js` (top of file, near other constants)

Add the two constants near the top of server.js (after imports). These MUST be identical to the TypeScript versions:

```javascript
// S27-OT: Named rendering instruction defaults
// IMPORTANT: These are duplicated from src/core/config/rendering-defaults.ts
// because server.js cannot import from src/core/. Keep them in sync.
const DEFAULT_WRITER_RENDERING_RULES = `...`; // Copy exact content from rendering-defaults.ts
const DEFAULT_RESEARCH_RENDERING_RULES = `...`; // Copy exact content from rendering-defaults.ts
```

#### Step 2.2: Refactor /api/research/deep endpoint

**File:** `server.js` (around line 2539-2546)

Replace the hardcoded `renderingRulesDeep` block:

**BEFORE (lines ~2542-2546):**
```javascript
// TODO (PM): renderingRules should be a configurable field on output_templates
const renderingRulesDeep = `\n\nIMPORTANT: Use rich markdown formatting...`;
const effectiveSystemPrompt = systemPrompt
    ? systemPrompt + renderingRulesDeep
    : defaultSystemPrompt;
```

**AFTER:**
```javascript
// S27-OT: Template-first rendering instructions with named constant fallback
const renderingRules = template?.renderingInstructions?.trim()
    || DEFAULT_RESEARCH_RENDERING_RULES;
const renderingSource = template?.renderingInstructions?.trim()
    ? 'template' : 'default-research';
const effectiveSystemPrompt = systemPrompt
    ? systemPrompt + renderingRules
    : defaultSystemPrompt;
```

Also return `renderingSource` in the API response so the client pipeline can capture it.

#### Step 2.3: Refactor /api/research/write endpoint

**File:** `server.js` (around line 2972-3000)

Replace the hardcoded `renderingRules` block:

**BEFORE (lines ~2972-3000):**
```javascript
// Layer 2: Rendering rules — how output should be formatted for GroveSkins
const renderingRules = `
## Rendering Rules (ReactMarkdown + GFM)
...
}`;
```

**AFTER:**
```javascript
// S27-OT: Template-first rendering instructions with named constant fallback
// Layer 2: Rendering rules — from template or default
const renderingRules = template?.renderingInstructions?.trim()
    || DEFAULT_WRITER_RENDERING_RULES;
const renderingSource = template?.renderingInstructions?.trim()
    ? 'template' : 'default-writer';
```

**IMPORTANT:** The `/api/research/write` endpoint needs access to the template object. Check whether it already receives `templateId` in the request body and loads the template. If not, the template lookup must be added.

**Finding the template:** The writer endpoint receives `query` (which is actually the systemPrompt from the template), `evidence`, and `voiceConfig`. It does NOT currently receive the template object or ID directly. You have two options:

1. **Add `templateId` to the request body** from `writer-agent.ts` → look up template in server.js from Supabase/seeds
2. **Add `renderingInstructions` to the request body** from `document-generator.ts` → pass through directly

Option 2 is simpler: pass `renderingInstructions` from the loaded template through the writer-agent call to the server endpoint. The server uses it if present, falls back to default if not.

Also include `renderingSource` in the JSON response body so the client can capture it.

**Build Gate:** Start dev server, test manually that both endpoints still return valid responses
**Commit:** `feat(S27-OT): server template hydration with fallback chain`

---

### Epic 3: Seed Data Enrichment (US-OT003)

**Goal:** Add type-appropriate `renderingInstructions` to all 8 seed templates.

**File:** `data/seeds/output-templates.json`

For each template, add `"renderingInstructions"` to the `payload` object.

**Writer templates** (4): `ot-seed-engineering`, `ot-seed-vision`, `ot-seed-policy`, `ot-seed-blog`
→ Use the content of `DEFAULT_WRITER_RENDERING_RULES`

**Research templates** (4): `ot-seed-deep-dive`, `ot-seed-quick-scan`, `ot-seed-academic-review`, `ot-seed-trend-analysis`
→ Use the content of `DEFAULT_RESEARCH_RENDERING_RULES`

Example for a writer template:
```json
{
  "id": "ot-seed-engineering",
  "payload": {
    "name": "Engineering / Architecture",
    "agentType": "writer",
    "systemPrompt": "...",
    "renderingInstructions": "## Rendering Rules (ReactMarkdown + GFM)\n...",
    ...
  }
}
```

**Build Gate:** `npm run build` (seed data is loaded at runtime, not compiled)
**Commit:** `feat(S27-OT): enrich seed templates with rendering instructions`

---

### Epic 4: Provenance Pipeline (US-OT006, US-OT007, US-OT008)

**Goal:** Flow `renderingSource` from server response through the client pipeline to `GeneratedArtifact`.

The data flows through 6 files:

```
server.js (response includes renderingSource)
    ↓
writer-agent.ts (captures from response)
    ↓
document-generator.ts (passes through result)
    ↓
ActionPanel.tsx (passes to onDocumentGenerated)
    ↓
SproutFinishingRoom.tsx (stores on GeneratedArtifact)
    ↓
garden-bridge.ts (includes in source_context)
```

#### Step 4.1: writer-agent.ts — Capture renderingSource

**File:** `src/explore/services/writer-agent.ts`

In `callLLMForWriting()` (around line 270), capture `renderingSource` from the API response and include it in the return value:

```typescript
return {
  position: result.position || '',
  analysis: result.analysis || '',
  limitations: result.limitations || '',
  citations: ...,
  renderingSource: result.renderingSource, // S27-OT
};
```

Update `LLMWriterOutput` interface to include `renderingSource?: string`.

Also update `writeResearchDocument()` to accept and pass through `renderingInstructions` to the API call if available, and return `renderingSource` from the result.

#### Step 4.2: document-generator.ts — Pass through result

**File:** `src/explore/services/document-generator.ts`

In `GenerateDocumentResult` interface (line ~49), add:

```typescript
/** S27-OT: Which rendering instructions shaped this document */
renderingSource?: 'template' | 'default-writer' | 'default-research';
```

In the `generateDocument()` function, after getting the document, capture and return `renderingSource`:

```typescript
return {
  success: true,
  document,
  templateUsed: ...,
  renderingSource: writerResult.renderingSource, // S27-OT
  execution: { ... },
};
```

Also pass `renderingInstructions` from the loaded template to the writer agent:

```typescript
const document = await writeResearchDocument(
  request.evidenceBundle,
  request.query,
  config,
  onProgress,
  template ? {
    systemPromptOverride: template.systemPrompt,
    renderingInstructions: template.renderingInstructions, // S27-OT
  } : undefined
);
```

#### Step 4.3: ActionPanel.tsx — Pass renderingSource through

**File:** `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx`

In `handleGenerateDocument` (around line 225), pass `renderingSource` to the callback:

```typescript
if (onDocumentGenerated && result.document) {
  const templateName = ...;
  onDocumentGenerated(result.document, templateId, templateName, result.renderingSource);
}
```

Update `onDocumentGenerated` prop type to accept the fourth parameter.

#### Step 4.4: SproutFinishingRoom.tsx — Store on artifact

**File:** `src/surface/components/modals/SproutFinishingRoom/SproutFinishingRoom.tsx`

In `handleDocumentGenerated` callback (around line 69), accept and store `renderingSource`:

```typescript
const handleDocumentGenerated = useCallback((
  document: ResearchDocument,
  templateId: string,
  templateName: string,
  renderingSource?: string
) => {
  const artifact: GeneratedArtifact = {
    document,
    templateId,
    templateName,
    generatedAt: new Date().toISOString(),
    renderingSource: renderingSource as GeneratedArtifact['renderingSource'],
  };
  // ... rest unchanged
}, [...]);
```

#### Step 4.5: garden-bridge.ts — Add to provenance

**File:** `src/surface/components/modals/SproutFinishingRoom/garden-bridge.ts`

In `TemplateInfo` interface, add:
```typescript
renderingSource?: 'template' | 'default-writer' | 'default-research';
```

In `GardenProvenancePayload.source_context`, add:
```typescript
renderingSource?: 'template' | 'default-writer' | 'default-research';
```

In `buildProvenancePayload()`, include `renderingSource` from templateInfo.

In `handlePromoteToGarden()` (SproutFinishingRoom.tsx), pass `renderingSource` from the active artifact to `promoteToGarden()`.

**Build Gate:** `npm run build`
**Commit:** `feat(S27-OT): renderingSource provenance through writer pipeline`

---

### Epic 5: Admin UI (US-OT009)

**Goal:** Add "Rendering Instructions" editor section to OutputTemplateEditor.

**File:** `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx`

Add a new `InspectorSection` between the System Prompt section (ends line ~376) and Citation Settings section (starts line ~378):

```tsx
<InspectorDivider />

{/* S27-OT: Rendering Instructions */}
<InspectorSection title="Rendering Instructions" collapsible defaultCollapsed={true}>
  <div className="space-y-2">
    <p className="text-xs text-[var(--glass-text-muted)]">
      Controls how the agent formats output (markdown rules, cite tags, JSON structure).
      {isSystemSeed && ' Fork this template to customize.'}
      {!template.payload.renderingInstructions && ' Using system defaults.'}
    </p>
    <BufferedTextarea
      value={template.payload.renderingInstructions || ''}
      onChange={(val) => patchPayload('renderingInstructions', val || undefined)}
      debounceMs={400}
      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 font-mono"
      placeholder="Leave empty to use system defaults..."
      rows={8}
      disabled={loading || isSystemSeed}
    />
  </div>
</InspectorSection>
```

**Build Gate:** `npm run build` + visual check at `/bedrock`
**Commit:** `feat(S27-OT): add Rendering Instructions section to OutputTemplateEditor`

---

## Final Verification

After all epics complete:

1. **Build:** `npm run build` — zero TypeScript errors
2. **E2E Tests:** `npx playwright test tests/e2e/` — all existing tests pass
3. **Manual Verification:**
   - Navigate to `/bedrock`, open an output template
   - Verify "Rendering Instructions" section appears (collapsed)
   - Expand it — seed templates show content, are read-only
   - Fork a template — rendering instructions copy over, become editable
   - Navigate to `/explore`, generate an artifact
   - Check browser console for `renderingSource` in artifact data
4. **Visual Screenshots:** Capture evidence of:
   - OutputTemplateEditor with Rendering Instructions section
   - Forked template with editable rendering instructions
   - Generated artifact showing renderingSource in data

**Final Commit:** `feat(S27-OT): configurable writer rendering instructions`

---

## Rollback Plan

If the sprint cannot complete cleanly:

1. **Partial rollback:** Revert server.js changes only — named constants and schema additions are backwards-compatible
2. **Full rollback:** `git revert` the sprint's commits — all changes are additive (optional fields, new file, new UI section)
3. **Data is safe:** No Supabase migrations, no destructive changes to seed data format
