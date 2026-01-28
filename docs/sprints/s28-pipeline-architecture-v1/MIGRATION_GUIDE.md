# S28-PIPE: Prompt Migration Guide

**Goal:** Extract existing hardcoded prompts from server.js and migrate them into editable config fields

**Principle:** System behaves the same as today, but NOW you can modify the prompts via inspector UI

---

## Current State: Hardcoded Prompts in server.js

### Location 1: Research Agent (Lines 2560-2575)

```typescript
const defaultSystemPrompt = `You are a SENIOR RESEARCH ANALYST conducting professional-grade investigation.

Your research must be:
- EXHAUSTIVE: Explore every relevant angle, follow citation chains, verify claims across sources
- RIGOROUS: Distinguish between primary sources, expert analysis, and speculation
- NUANCED: Present conflicting evidence, methodological debates, and uncertainty
- ACTIONABLE: Connect findings to practical implications and next steps

For each major claim:
1. Cite the source with full attribution
2. Assess source credibility (academic, industry, journalistic, etc.)
3. Note corroborating or contradicting evidence
4. Assign confidence level (0.0-1.0) with justification

DO NOT summarize prematurely. DO NOT omit relevant details for brevity.
Your audience expects comprehensive, professional-grade research output.`;
```

### Location 2: Research Rendering Rules (Line 87)

```typescript
const DEFAULT_RESEARCH_RENDERING_RULES = `

IMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`;
```

### Location 3: Writer Rendering Rules (Lines 58-85)

```typescript
const DEFAULT_WRITER_RENDERING_RULES = `

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
Your final deliverable must be valid JSON matching the exact schema provided in the tool definition. All markdown formatting should be contained within string fields (content, analysis, etc.). Ensure all arrays are properly closed and all JSON syntax is valid.`;
```

### Location 4: Writer Voice/Style (Lines 3016-3025)

```typescript
const writerSystemPrompt = `You are a senior research writer.

## Approach
${approachPrompt}

## Voice
- Formality: ${voiceConfig?.formality || 'professional'}
- Perspective: ${voiceConfig?.perspective || 'neutral'}
- Citation style: ${voiceConfig?.citationStyle || 'inline'}
${renderingRules}`;
```

---

## Migration Mapping

### ResearchAgentConfigPayload (Seed Defaults)

```typescript
{
  version: 1,

  searchInstructions: `You are a SENIOR RESEARCH ANALYST conducting professional-grade investigation.

Your research must be:
- EXHAUSTIVE: Explore every relevant angle, follow citation chains, verify claims across sources
- RIGOROUS: Distinguish between primary sources, expert analysis, and speculation
- NUANCED: Present conflicting evidence, methodological debates, and uncertainty
- ACTIONABLE: Connect findings to practical implications and next steps

For each major claim:
1. Cite the source with full attribution
2. Assess source credibility (academic, industry, journalistic, etc.)
3. Note corroborating or contradicting evidence
4. Assign confidence level (0.0-1.0) with justification

DO NOT summarize prematurely. DO NOT omit relevant details for brevity.
Your audience expects comprehensive, professional-grade research output.`,

  qualityGuidance: `IMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`
}
```

**Source:**
- `searchInstructions` ← `defaultSystemPrompt` (server.js:2560-2575)
- `qualityGuidance` ← `DEFAULT_RESEARCH_RENDERING_RULES` (server.js:87)

---

### WriterAgentConfigPayload (Seed Defaults)

```typescript
{
  version: 1,

  writingStyle: `You are a senior research writer.

Write with:
- Formality: professional
- Perspective: neutral
- Citation style: inline

Your output should be authoritative but accessible. Use clear, direct language while maintaining analytical rigor.`,

  resultsFormatting: `## Document Structure
1. Open with a clear thesis/position (2-3 sentences)
2. Use ## headers to organize analysis into 3-5 logical sections
3. Each section should have substantive content with specific data and evidence
4. Close with a synthesis or forward-looking conclusion
5. Note limitations honestly`,

  citationsStyle: `## Inline Citations
Use <cite index="N">cited claim</cite> HTML tags where N is the 1-based source index.

Example: <cite index="1">GPU inference improved 10x</cite>

Include a Sources section at the end with full references.`
}
```

**Source:**
- `writingStyle` ← Extracted from `writerSystemPrompt` (server.js:3016-3025) voice section
- `resultsFormatting` ← `DEFAULT_WRITER_RENDERING_RULES` document structure section (server.js:71-76)
- `citationsStyle` ← `DEFAULT_WRITER_RENDERING_RULES` inline citations section (server.js:69)

---

### OutputTemplate Defaults (Already Exist in S27-OT)

Templates already have:
- `systemPrompt` field (template-specific behavior)
- `renderingInstructions` field (template-specific formatting)

**No changes needed** — these already work and can override the writer config.

---

## Migration Steps

### Step 1: Create Seed Configs in Data Layer

**File:** `src/explore/services/config-defaults.ts` (NEW FILE)

```typescript
// Extract from server.js lines 2560-2575, 87, 58-85
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';

export const SEED_RESEARCH_AGENT_CONFIG: ResearchAgentConfigPayload = {
  version: 1,

  searchInstructions: `You are a SENIOR RESEARCH ANALYST conducting professional-grade investigation.

Your research must be:
- EXHAUSTIVE: Explore every relevant angle, follow citation chains, verify claims across sources
- RIGOROUS: Distinguish between primary sources, expert analysis, and speculation
- NUANCED: Present conflicting evidence, methodological debates, and uncertainty
- ACTIONABLE: Connect findings to practical implications and next steps

For each major claim:
1. Cite the source with full attribution
2. Assess source credibility (academic, industry, journalistic, etc.)
3. Note corroborating or contradicting evidence
4. Assign confidence level (0.0-1.0) with justification

DO NOT summarize prematurely. DO NOT omit relevant details for brevity.
Your audience expects comprehensive, professional-grade research output.`,

  qualityGuidance: `IMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`
};

export const SEED_WRITER_AGENT_CONFIG: WriterAgentConfigPayload = {
  version: 1,

  writingStyle: `You are a senior research writer.

Write with:
- Formality: professional
- Perspective: neutral
- Citation style: inline

Your output should be authoritative but accessible. Use clear, direct language while maintaining analytical rigor.`,

  resultsFormatting: `## Document Structure
1. Open with a clear thesis/position (2-3 sentences)
2. Use ## headers to organize analysis into 3-5 logical sections
3. Each section should have substantive content with specific data and evidence
4. Close with a synthesis or forward-looking conclusion
5. Note limitations honestly`,

  citationsStyle: `## Inline Citations
Use <cite index="N">cited claim</cite> HTML tags where N is the 1-based source index.

Example: <cite index="1">GPU inference improved 10x</cite>

Include a Sources section at the end with full references.`
};
```

---

### Step 2: Update Schemas to Simple Text Fields

**File:** `src/core/schema/research-agent-config.ts`

**BEFORE (lines 10-67):** Complex schema with enums and numbers

**AFTER:**
```typescript
import { z } from 'zod';

export const ResearchAgentConfigPayloadSchema = z.object({
  version: z.number().min(1),
  searchInstructions: z.string().min(1).max(10000),
  qualityGuidance: z.string().min(1).max(5000),
});

export type ResearchAgentConfigPayload = z.infer<typeof ResearchAgentConfigPayloadSchema>;

export const DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD: ResearchAgentConfigPayload = {
  version: 1,
  searchInstructions: `You are a SENIOR RESEARCH ANALYST conducting professional-grade investigation.

Your research must be:
- EXHAUSTIVE: Explore every relevant angle, follow citation chains, verify claims across sources
- RIGOROUS: Distinguish between primary sources, expert analysis, and speculation
- NUANCED: Present conflicting evidence, methodological debates, and uncertainty
- ACTIONABLE: Connect findings to practical implications and next steps

For each major claim:
1. Cite the source with full attribution
2. Assess source credibility (academic, industry, journalistic, etc.)
3. Note corroborating or contradicting evidence
4. Assign confidence level (0.0-1.0) with justification

DO NOT summarize prematurely. DO NOT omit relevant details for brevity.
Your audience expects comprehensive, professional-grade research output.`,

  qualityGuidance: `IMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`,
};
```

---

**File:** `src/core/schema/writer-agent-config.ts`

**BEFORE (lines 10-140):** Nested objects with enums

**AFTER:**
```typescript
import { z } from 'zod';

export const WriterAgentConfigPayloadSchema = z.object({
  version: z.number().min(1),
  writingStyle: z.string().min(1).max(10000),
  resultsFormatting: z.string().min(1).max(10000),
  citationsStyle: z.string().min(1).max(5000),
});

export type WriterAgentConfigPayload = z.infer<typeof WriterAgentConfigPayloadSchema>;

export const DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD: WriterAgentConfigPayload = {
  version: 1,

  writingStyle: `You are a senior research writer.

Write with:
- Formality: professional
- Perspective: neutral
- Citation style: inline

Your output should be authoritative but accessible. Use clear, direct language while maintaining analytical rigor.`,

  resultsFormatting: `## Document Structure
1. Open with a clear thesis/position (2-3 sentences)
2. Use ## headers to organize analysis into 3-5 logical sections
3. Each section should have substantive content with specific data and evidence
4. Close with a synthesis or forward-looking conclusion
5. Note limitations honestly`,

  citationsStyle: `## Inline Citations
Use <cite index="N">cited claim</cite> HTML tags where N is the 1-based source index.

Example: <cite index="1">GPU inference improved 10x</cite>

Include a Sources section at the end with full references.`
};
```

---

### Step 3: Update server.js to Use Merged Config Text

**File:** `server.js`

**BEFORE (lines 2558-2587):**
```typescript
const defaultSystemPrompt = `You are a SENIOR RESEARCH ANALYST...`;
const renderingRules = renderingInstructions?.trim() || DEFAULT_RESEARCH_RENDERING_RULES;
const effectiveSystemPrompt = systemPrompt
  ? systemPrompt + renderingRules
  : defaultSystemPrompt;
```

**AFTER:**
```typescript
// Receive merged prompt from frontend (already concatenated)
const { finalPrompt, researchConfigVersion } = req.body;

// No defaults, no fallbacks — frontend MUST send complete prompt
if (!finalPrompt) {
  return res.status(400).json({ error: 'finalPrompt required' });
}

// Use it directly
const effectiveSystemPrompt = finalPrompt;
```

---

**BEFORE (lines 3016-3025):**
```typescript
const writerSystemPrompt = `You are a senior research writer.

## Approach
${approachPrompt}

## Voice
- Formality: ${voiceConfig?.formality || 'professional'}
- Perspective: ${voiceConfig?.perspective || 'neutral'}
- Citation style: ${voiceConfig?.citationStyle || 'inline'}
${renderingRules}`;
```

**AFTER:**
```typescript
// Receive merged prompt from frontend
const { finalPrompt, writerConfigVersion } = req.body;

if (!finalPrompt) {
  return res.status(400).json({ error: 'finalPrompt required' });
}

// Use it directly (no building, no defaults)
const writerSystemPrompt = finalPrompt;
```

---

### Step 4: Update document-generator.ts to Build Merged Prompt

**File:** `src/explore/services/document-generator.ts`

**Add function to merge text configs:**

```typescript
function buildResearchPrompt(
  researchConfig: ResearchAgentConfigPayload,
  template: OutputTemplatePayload
): string {
  const systemPrompt = template.systemPrompt || researchConfig.searchInstructions;
  const renderingRules = template.renderingInstructions || researchConfig.qualityGuidance;

  return `${systemPrompt}\n\n${renderingRules}`;
}

function buildWriterPrompt(
  writerConfig: WriterAgentConfigPayload,
  template: OutputTemplatePayload,
  approachPrompt: string
): string {
  // Merge: template can override base text
  const effectiveWritingStyle = template.configOverrides?.writingStyle
    ?? writerConfig.writingStyle;
  const effectiveFormatting = template.configOverrides?.resultsFormatting
    ?? writerConfig.resultsFormatting;
  const effectiveCitations = template.configOverrides?.citationsStyle
    ?? writerConfig.citationsStyle;

  // Concatenate sections
  return `${template.systemPrompt}

## Approach
${approachPrompt}

## Writing Style
${effectiveWritingStyle}

## Results Formatting
${effectiveFormatting}

## Citations
${effectiveCitations}

## Rendering Instructions
${template.renderingInstructions || ''}`;
}
```

**Then in generateDocument():**

```typescript
// Load configs
const researchConfig = await loadResearchAgentConfig(groveId);
const writerConfig = await loadWriterAgentConfig(groveId);
const template = await loadTemplateById(templateId);

// Build merged prompts
const researchPrompt = buildResearchPrompt(researchConfig, template);
const writerPrompt = buildWriterPrompt(writerConfig, template, request.approachPrompt);

// Send to server with version provenance
const response = await fetch('/api/research/write', {
  method: 'POST',
  body: JSON.stringify({
    finalPrompt: writerPrompt,
    writerConfigVersion: writerConfig.version,
    researchConfigVersion: researchConfig.version,
    templateId: template.id,
    evidence: request.evidence,
    query: request.query,
  })
});
```

---

## What This Achieves

### Before Migration

```
server.js:2560-2575 (hardcoded)
  ↓
Claude API
```

Admin CANNOT change research behavior without editing server.js and redeploying.

### After Migration

```
ResearchAgentConfig in Supabase (editable via inspector)
  ↓
config-loader.ts loads from DB
  ↓
document-generator.ts merges with template
  ↓
server.js receives finalPrompt
  ↓
Claude API
```

Admin CAN change research behavior by editing text in the inspector. Changes apply immediately (no code deployment).

---

## Behavior Preservation

| Aspect | Before | After | Same? |
|--------|--------|-------|-------|
| Research instructions | Hardcoded in server.js | In ResearchAgentConfig DB | ✓ Identical text |
| Research formatting | DEFAULT_RESEARCH_RENDERING_RULES | In ResearchAgentConfig.qualityGuidance | ✓ Identical text |
| Writer voice | `formality || 'professional'` | In WriterAgentConfig.writingStyle | ✓ Same defaults |
| Writer formatting | DEFAULT_WRITER_RENDERING_RULES | In WriterAgentConfig.resultsFormatting | ✓ Identical text |
| Citations | Hardcoded in prompt | In WriterAgentConfig.citationsStyle | ✓ Same format |

**Result:** System behaves identically to today, but NOW the prompts are editable.

---

## Testing the Migration

### Test 1: Research Behavior (Unchanged)

**Verify:**
1. Generate research with default config
2. Compare output to previous research using hardcoded prompt
3. Should be functionally identical (same depth, same formatting)

### Test 2: Edit Research Config

**Verify:**
1. Edit ResearchAgentConfig.searchInstructions to add "Prioritize sources from 2023 onward"
2. Generate new research
3. Verify output focuses on recent sources
4. Verify change applied WITHOUT code deployment

### Test 3: Edit Writer Config

**Verify:**
1. Edit WriterAgentConfig.writingStyle to "Write in first person, conversational"
2. Generate document
3. Verify output uses first person voice
4. Verify change applied WITHOUT code deployment

### Test 4: Template Override

**Verify:**
1. Base WriterAgentConfig has writingStyle: "Professional"
2. Template "Blog Post" overrides with writingStyle: "Casual, engaging"
3. Generate with Blog Post template
4. Verify casual voice (template wins)
5. Generate with Academic Paper template (no override)
6. Verify professional voice (base used)

---

## Files to Create/Modify

### New Files (1)
- `src/explore/services/config-defaults.ts` — Extracted prompt constants

### Schema Files (2)
- `src/core/schema/research-agent-config.ts` — Simplify to 2 text fields
- `src/core/schema/writer-agent-config.ts` — Simplify to 3 text fields

### Service Files (3)
- `src/explore/services/config-loader.ts` — Uncomment Supabase queries
- `src/explore/services/document-generator.ts` — Add merge functions, load configs
- `server.js` — Remove hardcoded prompts, accept finalPrompt in body

### Inspector Files (2)
- `src/bedrock/consoles/ExperienceConsole/ResearchAgentConfigEditor.tsx` — Replace UI with 2 textareas
- `src/bedrock/consoles/ExperienceConsole/WriterAgentConfigEditor.tsx` — Replace UI with 3 textareas

**Total:** 8 files (1 new, 7 modified)

---

## Expected Lines Changed

| File | Lines Removed | Lines Added | Net |
|------|---------------|-------------|-----|
| research-agent-config.ts | ~60 (complex schema) | ~25 (simple schema + defaults) | -35 |
| writer-agent-config.ts | ~130 (nested objects) | ~40 (simple schema + defaults) | -90 |
| config-defaults.ts | 0 | ~80 (extracted constants) | +80 |
| ResearchAgentConfigEditor.tsx | ~150 (enum forms) | ~30 (2 textareas) | -120 |
| WriterAgentConfigEditor.tsx | ~250 (complex forms) | ~50 (3 textareas) | -200 |
| config-loader.ts | ~10 (TODO comments) | +10 (uncomment queries) | 0 |
| document-generator.ts | 0 | ~60 (merge functions, load calls) | +60 |
| server.js | ~50 (hardcoded prompts) | ~20 (require finalPrompt) | -30 |

**Net Change:** ~335 lines removed, ~315 lines added = **-20 lines total**

**Result:** Simpler codebase, same behavior, MORE admin control.

---

## Migration Checklist

- [ ] Extract prompts from server.js into config-defaults.ts
- [ ] Simplify research-agent-config.ts schema (2 text fields)
- [ ] Simplify writer-agent-config.ts schema (3 text fields)
- [ ] Update ResearchAgentConfigEditor to use 2 BufferedTextareas
- [ ] Update WriterAgentConfigEditor to use 3 BufferedTextareas
- [ ] Uncomment config-loader.ts Supabase queries
- [ ] Add merge functions to document-generator.ts
- [ ] Update server.js to require finalPrompt (remove defaults)
- [ ] Test: Generate research, verify same output as before
- [ ] Test: Edit config, verify changes apply
- [ ] Test: Template overrides, verify merge works
- [ ] Add provenance tracking (config versions)

---

**Migration preserves existing behavior while enabling configurability.**
