# S28-PIPE: Pipeline Architecture Rationalization

> **Sprint Goal:** Wire the DEX pipeline so research-agent-config, writer-agent-config, and output-templates work together as designed — not as decorative islands.

## Problem Statement

The current architecture has **three layers of configuration** that should compose:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTENDED ARCHITECTURE (DEX)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│   │ Research Agent  │    │  Writer Agent   │    │ Output Template │    │
│   │     Config      │───▶│     Config      │───▶│    (per-doc)    │    │
│   │  (grove-wide)   │    │  (grove-wide)   │    │                 │    │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘    │
│                                                                         │
│   Controls:              Controls:              Controls:               │
│   • Search depth         • Voice/tone           • System prompt         │
│   • Source preferences   • Citation style       • Rendering rules       │
│   • Max API calls        • Quality rules        • Presentation          │
│   • Confidence floor     • Structure prefs      • Format-specific       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Actual Reality:**
- ResearchAgentConfig: Editable in UI, never read by pipeline
- WriterAgentConfig: Editable in UI, never read by pipeline
- OutputTemplate: `systemPrompt` works, but `config` field ignored

## Architecture Vision: SIMPLIFIED (Text-Based Prompt Fragments)

### Core Principle

**Configs = TEXT INSTRUCTIONS** that merge into prompts at different pipeline stages.

No enums. No dropdowns. No rigid structure. Just free-form text that admins can experiment with.

### Simplified Schemas

```typescript
// Research Agent Config (2 TEXT FIELDS)
interface ResearchAgentConfigPayload {
  version: number;
  searchInstructions: string;    // "Focus on academic sources, prioritize peer-reviewed"
  qualityGuidance: string;        // "Only include sources with confidence > 0.6"
}

// Writer Agent Config (3 TEXT FIELDS)
interface WriterAgentConfigPayload {
  version: number;
  writingStyle: string;           // "Write professionally but accessibly"
  resultsFormatting: string;      // "Executive summary, sections, bullets"
  citationsStyle: string;         // "Inline (Author, Year), Sources section at end"
}

// Output Template (2 TEXT FIELDS - already implemented in S27-OT)
interface OutputTemplatePayload {
  systemPrompt: string;           // Template-specific instructions
  renderingInstructions: string;  // How to format the output
  // Can override writer config fields:
  configOverrides?: {
    writingStyle?: string;
    resultsFormatting?: string;
    citationsStyle?: string;
  };
}
```

### Three-Layer Composition (Text Concatenation)

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Output Template (Highest Priority)                │
│  • systemPrompt: "Write formal academic paper..."           │
│  • renderingInstructions: "Use LaTeX for equations..."      │
│  • configOverrides.writingStyle: "Formal academic prose"    │
│  • configOverrides.citationsStyle: "APA 7th with DOIs"      │
└──────────────────────┬──────────────────────────────────────┘
                       │ (overrides specific text sections)
┌──────────────────────▼──────────────────────────────────────┐
│  Layer 2: Writer Agent Config (Grove-Wide Base)             │
│  • writingStyle: "Professional but accessible..."           │
│  • resultsFormatting: "Executive summary, sections..."      │
│  • citationsStyle: "Inline (Author, Year)..."               │
└──────────────────────┬──────────────────────────────────────┘
                       │ (inherits if template doesn't override)
┌──────────────────────▼──────────────────────────────────────┐
│  Layer 3: Research Agent Config (Evidence Phase)            │
│  • searchInstructions: "Academic sources, peer-reviewed"    │
│  • qualityGuidance: "Confidence > 0.6, exclude news"        │
└─────────────────────────────────────────────────────────────┘
```

### Merge Strategy (Simple String Concatenation)

```typescript
// Load configs from Supabase
const researchConfig = await loadResearchAgentConfig(groveId);
const writerConfig = await loadWriterAgentConfig(groveId);
const template = await loadTemplateById(templateId);

// Merge writer config with template overrides (template wins)
const effectiveWritingStyle = template.configOverrides?.writingStyle ?? writerConfig.writingStyle;
const effectiveFormatting = template.configOverrides?.resultsFormatting ?? writerConfig.resultsFormatting;
const effectiveCitations = template.configOverrides?.citationsStyle ?? writerConfig.citationsStyle;

// Build final system prompt (string concatenation)
const finalPrompt = `
${template.systemPrompt}

## Writing Style
${effectiveWritingStyle}

## Results Formatting
${effectiveFormatting}

## Citations
${effectiveCitations}

## Rendering Instructions
${template.renderingInstructions}
`;

// Send to Claude API
```

**That's it.** No complex merging logic, just text concatenation with clear section boundaries.

## Wireframes

See accompanying HTML wireframes in this directory:

| Wireframe | Purpose |
|-----------|---------|
| `wireframe-01-pipeline-flow.html` | Complete data flow from config to output |
| `wireframe-02-config-loading.html` | How configs are loaded and merged |
| `wireframe-03-research-inspector.html` | ResearchAgentConfig editor with pipeline context |
| `wireframe-04-writer-inspector.html` | WriterAgentConfig editor with pipeline context |
| `wireframe-05-template-selector.html` | Template selection with config inheritance |
| `wireframe-06-versioning-system.html` | Config versioning and activation flow |
| `wireframe-07-generation-flow.html` | End-to-end document generation with config |

## Implementation Phases

### Phase 1: Simplify Schemas (Remove Cruft)

**Files to modify:**
- `src/core/schema/research-agent-config.ts` — Replace complex fields with 2 text fields
- `src/core/schema/writer-agent-config.ts` — Replace nested objects with 3 text fields
- `src/core/schema/output-template.ts` — Ensure configOverrides uses same simple fields

**Changes:**
```typescript
// BEFORE (ResearchAgentConfig)
{
  searchDepth: number,
  sourcePreferences: Array<enum>,
  confidenceThreshold: number,
  maxApiCalls: number,
  branchDelay: number
}

// AFTER (ResearchAgentConfig)
{
  searchInstructions: string,  // Free-form text
  qualityGuidance: string       // Free-form text
}

// BEFORE (WriterAgentConfig)
{
  voice: { formality: enum, perspective: enum, personality?: string },
  documentStructure: { includePosition: bool, citationStyle: enum, ... },
  qualityRules: { requireCitations: bool, minConfidence: number, ... }
}

// AFTER (WriterAgentConfig)
{
  writingStyle: string,         // Free-form text
  resultsFormatting: string,    // Free-form text
  citationsStyle: string        // Free-form text
}
```

### Phase 2: Update Inspector UIs (Use Existing Patterns)

**Files to modify:**
- `ResearchAgentConfigEditor.tsx` — Replace form fields with 2 BufferedTextareas
- `WriterAgentConfigEditor.tsx` — Replace form fields with 3 BufferedTextareas
- `OutputTemplateEditor.tsx` — Already has text fields for systemPrompt/renderingInstructions (keep as-is)

**NO NEW UI PATTERNS** — Use existing console-factory layout, InspectorSection, BufferedTextarea

### Phase 3: Wire Config Loading (Core Fix)

**Files to modify:**
- `src/explore/services/config-loader.ts` — Uncomment Supabase queries
- `src/explore/services/document-generator.ts` — Load configs, merge text fields
- `server.js` — Accept text config fields in body, concatenate into prompt

**Config Loading:**
```typescript
// Load active configs from Supabase (uncomment existing queries)
const researchConfig = await loadResearchAgentConfig(groveId);
const writerConfig = await loadWriterAgentConfig(groveId);
const template = await loadTemplateById(templateId);

// Merge text fields (template overrides win)
const effectiveWritingStyle = template.configOverrides?.writingStyle ?? writerConfig.writingStyle;
const effectiveFormatting = template.configOverrides?.resultsFormatting ?? writerConfig.resultsFormatting;
const effectiveCitations = template.configOverrides?.citationsStyle ?? writerConfig.citationsStyle;

// Build final prompt (string concatenation)
const finalPrompt = `
${template.systemPrompt}

## Writing Style
${effectiveWritingStyle}

## Results Formatting
${effectiveFormatting}

## Citations
${effectiveCitations}

## Rendering Instructions
${template.renderingInstructions}
`;
```

### Phase 4: Server Integration (Remove Hardcoded Defaults)

**Files to modify:**
- `server.js` — Remove all hardcoded defaults (defaultSystemPrompt, DEFAULT_*_RENDERING_RULES)
- `server.js` — Require finalPrompt in request body (frontend must always send complete merged prompt)
- `server.js` — Add researchInstructions to /api/research/deep

### Phase 5: Provenance Tracking (Keep This — It's Good)

**Files to modify:**
- `src/core/schema/sprout.ts` — Add config version fields to GeneratedArtifact
- `src/explore/services/document-generator.ts` — Record which config versions used
- `src/surface/components/modals/SproutFinishingRoom/DocumentViewer.tsx` — Display provenance

**Provenance Fields:**
```typescript
interface GeneratedArtifact {
  // Existing fields
  document: ResearchDocument;
  templateId: string;
  templateName: string;
  generatedAt: string;
  renderingSource?: string;

  // NEW: Config provenance
  researchConfigVersion?: number;
  writerConfigVersion?: number;
  // Note: Don't store effective values — just version numbers
  // (Can look up historical config content by version if needed)
}
```

## Acceptance Criteria

### AC-1: Simplified Schemas (Text-Only)

**Given** existing complex schemas with enums and nested objects
**When** schemas are simplified
**Then** configs have simple text fields only:
- ResearchAgentConfig: `searchInstructions`, `qualityGuidance`
- WriterAgentConfig: `writingStyle`, `resultsFormatting`, `citationsStyle`

**Test:** Admin can write "Focus on sources from 2020 onward" in searchInstructions (no enum validation)

---

### AC-2: Config Loading Wired to Pipeline

**Given** config-loader.ts has TODO stubs
**When** Supabase queries are uncommented and functions are called
**Then** pipeline loads active configs from database (not defaults)

**Test:**
1. Edit WriterAgentConfig.writingStyle to "Write like a tech blogger"
2. Generate document
3. Verify output uses tech blogger style (not hardcoded "professional")

---

### AC-3: Text Configs Merge Correctly

**Given** base WriterAgentConfig and template with overrides
**When** document is generated
**Then** template text overrides base text for specified fields

**Test:**
1. Base has writingStyle: "Professional tone"
2. Template overrides with writingStyle: "Casual, conversational"
3. Verify final prompt uses "Casual, conversational" (template wins)

---

### AC-4: Server Has No Hardcoded Defaults

**Given** server.js currently has fallback prompts
**When** hardcoded defaults are removed
**Then** server requires all config text in request body

**Test:**
1. Send request without finalPrompt in body
2. Verify server returns 400 error (no fallback used)

---

### AC-5: Provenance Tracks Config Versions

**Given** document is generated
**When** GeneratedArtifact is created
**Then** metadata includes config version numbers

**Test:** Verify GeneratedArtifact has:
- `researchConfigVersion: 2`
- `writerConfigVersion: 3`
- `templateId: "academic-paper-v1"`

---

### AC-6: Admins Can Experiment

**Given** text-based config fields
**When** admin writes custom instructions
**Then** no validation rejects free-form text

**Test:**
1. Write "Include emojis for engagement" in writingStyle
2. Save config
3. Verify no validation error (accepts any text)

## Out of Scope

- New UI patterns (use existing console-factory, InspectorSection, BufferedTextarea)
- Complex validation beyond "is it a string?"
- Migration of existing documents to new provenance format
- Multi-grove config sharing
- Pre-seeded config templates (admins write from scratch)

## Design Principles

1. **Text over structure** — Configs are prompt fragments, not rigid data
2. **Experimentation over prescription** — Let admins discover what works
3. **Existing patterns only** — No new UI components or layouts
4. **Simple merge** — Text concatenation with section boundaries
5. **Provenance first** — Always track which versions produced output
