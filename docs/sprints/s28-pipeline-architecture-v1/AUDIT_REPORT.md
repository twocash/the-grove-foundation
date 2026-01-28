# S28-PIPE: Comprehensive Pipeline Architecture Audit

**Date:** 2026-01-28
**Sprint:** S28-PIPE (Pipeline Architecture Rationalization)
**Audit Scope:** All system objects related to research → writer → output pipeline
**Status:** CRITICAL GAPS IDENTIFIED

---

## Executive Summary

The Grove pipeline architecture has **well-designed UI and schema layers** that are **DECOUPLED from actual execution**. Configuration objects exist in Supabase and inspector panels edit them, but **agents DO NOT READ from configured values**. Instead, they use hardcoded defaults.

This breaks the DEX pillar of **Declarative Sovereignty**: "Research behavior is controlled via config, not code changes."

### Status Overview

| Component | File | Designed | Implemented | Integrated |
|-----------|------|----------|-------------|-----------|
| ResearchAgentConfig Schema | `research-agent-config.ts` | ✓ | ✓ | ✗ |
| WriterAgentConfig Schema | `writer-agent-config.ts` | ✓ | ✓ | ✗ |
| OutputTemplate Schema | `output-template.ts` | ✓ | ✓ | ◐ (systemPrompt only) |
| Config Loader (Research) | `config-loader.ts:31-47` | ✓ | ✗ (TODO stub) | ✗ (never called) |
| Config Loader (Writer) | `config-loader.ts:62-78` | ✓ | ✗ (TODO stub) | ✗ (never called) |
| Document Generator | `document-generator.ts` | ✓ | ✓ | ◐ (templates only) |
| Research Agent Service | `research-agent.ts` | ✓ | ✓ | ✗ (no config loading) |
| Writer Agent Service | `writer-agent.ts` | ✓ | ✓ | ◐ (template override only) |
| Template Loader | `template-loader.ts` | ✓ | ✓ | ◐ (seed defaults only) |
| ResearchAgentConfigEditor | `ResearchAgentConfigEditor.tsx` | ✓ | ✓ | ✗ (data not used) |
| WriterAgentConfigEditor | `WriterAgentConfigEditor.tsx` | ✓ | ✓ | ✗ (data not used) |
| useResearchAgentConfigData | `useResearchAgentConfigData.ts` | ✓ | ✓ | ✗ (UI only) |
| useWriterAgentConfigData | `useWriterAgentConfigData.ts` | ✓ | ✓ | ✗ (UI only) |
| POST /api/research/deep | `server.js:2534-2850` | ✓ | ◐ | ◐ (templates only) |
| POST /api/research/write | `server.js:2976-3076` | ✓ | ◐ | ◐ (templates only) |

**Legend:**
- ✓ = Working
- ◐ = Partially working
- ✗ = Not working / not wired

---

## Section 1: Schema Files

### 1.1 Research Agent Config Schema

**File:** `src/core/schema/research-agent-config.ts` (Lines 1-69)

**Status:** ✓ WELL-DESIGNED but ✗ UNUSED

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `version` | number | 1 | Schema versioning |
| `searchDepth` | 1-10 | 3 | Max searches per branch |
| `sourcePreferences` | enum[] | ['academic', 'practitioner'] | Preferred source types |
| `confidenceThreshold` | 0-1 | 0.6 | Quality floor for sources |
| `maxApiCalls` | 1-50 | 10 | API budget limit |
| `branchDelay` | 0-5000ms | 500 | Rate limiting between calls |

**Gap:** Schema fully designed with validation and defaults, but `loadResearchAgentConfig()` in config-loader.ts:46 always returns `DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD` — no Supabase lookup executed.

---

### 1.2 Writer Agent Config Schema

**File:** `src/core/schema/writer-agent-config.ts` (Lines 1-142)

**Status:** ✓ WELL-DESIGNED but ✗ UNUSED

Three nested sub-schemas:

#### VoiceConfig
| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `formality` | enum | 'professional' | Tone: casual/professional/academic/technical |
| `perspective` | enum | 'neutral' | POV: first-person/third-person/neutral |
| `personality` | string? | undefined | Optional character description |

#### DocumentStructureConfig
| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `includePosition` | boolean | true | Position statement section |
| `includeLimitations` | boolean | true | Limitations section |
| `citationStyle` | enum | 'inline' | inline/endnote |
| `citationFormat` | enum | 'simple' | simple/apa/chicago |
| `maxLength` | number? | undefined | Optional word limit |

#### QualityRulesConfig
| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `requireCitations` | boolean | true | Enforce citation for claims |
| `minConfidenceToInclude` | 0-1 | 0.5 | Source quality floor |
| `flagUncertainty` | boolean | true | Add caveats for low-confidence |

**Gap:** Schema fully designed, but writer-agent.ts receives config only when called from document-generator.ts, which uses `DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD` (line 132). Server `/api/research/write` endpoint (server.js:2976) receives `voiceConfig` from frontend — no Supabase lookup.

---

### 1.3 Output Template Schema

**File:** `src/core/schema/output-template.ts` (Lines 1-241)

**Status:** ✓ WELL-DESIGNED, ◐ PARTIALLY USED

| Property | Type | Purpose | Wired? |
|----------|------|---------|--------|
| `name` | string | User-facing name | ✓ |
| `agentType` | enum | 'writer'\|'research'\|'code' | ✓ |
| `systemPrompt` | string | Core instruction | ✓ (research + writer) |
| `renderingInstructions` | string | S27-OT: Formatting rules | ✓ (writer only) |
| `config` | OutputTemplateConfig | Agent-specific overrides | ✗ **NOT USED** |
| `source` | enum | Provenance tracking | ✓ |
| `isDefault` | boolean | Default selection | ✓ |

**Critical Gap:** The `config` field (OutputTemplateConfig) exists in the schema but is **completely ignored** by document-generator.ts. Nested settings like `citationStyle`, `formality` overrides, etc., are never applied.

**Current Usage:**
- ✓ `systemPrompt` → Passed to research-agent and writer-agent
- ✓ `renderingInstructions` → Passed to writer-agent (S27-OT)
- ✗ `config.overrides` → **Never read or applied**

---

## Section 2: Config Loader (TODO Stubs)

**File:** `src/explore/services/config-loader.ts` (Lines 1-103)

### 2.1 Functions

| Function | Lines | Status | Implementation |
|----------|-------|--------|----------------|
| `loadResearchAgentConfig(groveId)` | 31-47 | ✗ TODO | Returns `DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD` always |
| `loadWriterAgentConfig(groveId)` | 62-78 | ✗ TODO | Returns `DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD` always |
| `loadPipelineConfigs(groveId)` | 90-102 | ✗ SHELL | Calls above two functions (both return defaults) |

### 2.2 Critical Gap: Commented-Out Implementation

**Lines 36-43:**
```typescript
// TODO: Implement Supabase lookup
// const { data } = await supabase
//   .from('research_agent_configs')
//   .select('payload')
//   .eq('grove_id', groveId)
//   .eq("meta->>'status'", 'active')
//   .single();
// if (data) return data.payload;

console.log('[ConfigLoader] Using default Research Agent config');
return DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD;
```

**Impact:** Even if these TODO comments were uncommented, **the functions are NEVER CALLED anywhere in the codebase**. They are orphaned.

---

## Section 3: Document Generator

**File:** `src/explore/services/document-generator.ts` (Lines 1-199)

### 3.1 Current Flow

```
generateDocument(request: DocumentGenerationRequest)
  ├── Load template by ID (lines 114-121)
  │   └── templateLoader.loadResearchTemplate(templateId)  ✓ WORKS
  ├── Fall back to default template (lines 124-129)
  │   └── templateLoader.loadDefaultTemplate(agentType)  ✓ WORKS
  ├── Build writer config (lines 132-135)
  │   └── Uses DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD  ✗ HARDCODED
  └── Call writeResearchDocument() (lines 138-147)
      └── Passes template.systemPrompt override  ✓ WORKS
```

### 3.2 Gap Analysis

**Line 132-135:**
```typescript
const config: WriterAgentConfigPayload = {
  ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,  // ✗ Always uses defaults
  ...request.configOverrides,  // Only manual overrides, no database
};
```

**Missing:**
```typescript
// Should be:
const groveId = sprout.groveId;
const writerConfig = await loadWriterAgentConfig(groveId);  // ✗ Never called
const config = mergeConfigs(writerConfig, template.config?.overrides);
```

---

## Section 4: Research Agent Service

**File:** `src/explore/services/research-agent.ts` (Lines 1-150+)

### 4.1 Interface

| Line | Code | Status |
|------|------|--------|
| 23-24 | Import `ResearchAgentConfigPayload` and `DEFAULT_` | ✓ Ready |
| 35-54 | Interface `ResearchAgentConfig` | ✓ Accepts config params |
| 53 | `systemPrompt?: string` parameter | ✓ Used for templates |
| 122-128 | `DEFAULT_CONFIG` constant | ✗ Hardcoded in file |

### 4.2 Gap

The research-agent accepts an optional `systemPrompt` parameter (currently used for templates), but:
1. Never called with config loaded from database
2. `DEFAULT_CONFIG` is hardcoded within this file
3. No call to `loadResearchAgentConfig()` exists anywhere

**Missing Integration:**
```typescript
// research-agent.ts should accept groveId and load config
export async function performResearch(
  query: string,
  groveId: string,  // ← Missing parameter
  options?: ResearchOptions
) {
  const config = await loadResearchAgentConfig(groveId);  // ← Missing call
  // Apply config.searchDepth, config.maxApiCalls, etc.
}
```

---

## Section 5: Writer Agent Service

**File:** `src/explore/services/writer-agent.ts` (Lines 1-150+)

### 5.1 Current Implementation

| Line | Code | Status |
|------|------|--------|
| 9 | Import `WriterAgentConfigPayload` | ✓ Ready |
| 70-86 | `WriterOptions` interface with `systemPromptOverride` | ✓ Templates use this |
| 99-105 | `writeResearchDocument(evidence, config, options?)` | ✓ Accepts config |
| 123 | `const systemPrompt = options?.systemPromptOverride \|\| buildWriterSystemPrompt(config)` | ✓ Prefers override |
| 140-147 | Config passed to LLM (voice, structure settings) | ✓ Uses config correctly |

### 5.2 Gap

Writer agent correctly **uses** config when provided, but the config comes from:
- `DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD` (document-generator.ts:132)
- NOT from Supabase lookup

**Missing:**
```typescript
// document-generator.ts should load from database
const writerConfig = await loadWriterAgentConfig(groveId);  // ← Never called
const effectiveConfig = mergeConfigs(
  writerConfig,
  template.config?.overrides  // ← template.config never read
);
```

---

## Section 6: Template Loader

**File:** `src/explore/services/template-loader.ts` (Lines 1-147)

### 6.1 Functions

| Function | Implementation | Gap |
|----------|----------------|-----|
| `loadTemplateById(templateId)` | Loads from `getDefaults<OutputTemplatePayload>('output-template')` | Only loads seed defaults, not from Supabase |
| `loadDefaultTemplate(agentType)` | Filters defaults by agentType + isDefault | Same — defaults only |
| `loadActiveTemplates(agentType)` | Filters defaults by status='active' | Same — defaults only |
| `loadResearchTemplate(templateId?)` | Calls above functions | Same — defaults only |

### 6.2 Critical Gap

**Line 52:**
```typescript
const templates = getDefaults<OutputTemplatePayload>('output-template');
```

This loads from **seed defaults only**, not from Supabase `output_templates` table. User-created or modified templates are **invisible to the pipeline**.

**Should Be:**
```typescript
const { data } = await supabase
  .from('output_templates')
  .select('payload')
  .eq('meta->status', 'active')
  .eq('payload->agentType', agentType);

// Fall back to defaults if no user templates exist
const templates = data?.map(d => d.payload) ?? getDefaults('output-template');
```

---

## Section 7: Inspector Panels

### 7.1 ResearchAgentConfigEditor

**File:** `src/bedrock/consoles/ExperienceConsole/ResearchAgentConfigEditor.tsx` (Lines 1-678)

**Status:** ✓ FULLY IMPLEMENTED (UI Layer)

| Feature | Lines | Status |
|---------|-------|--------|
| Display all payload fields | 350-489 | ✓ Complete |
| Edit searchDepth slider | 427-447 | ✓ Working |
| Source preferences checkboxes | 448-473 | ✓ Working |
| Confidence threshold input | 431-442 | ✓ Working |
| Version management | 89-107, 334-342 | ✓ Singleton pattern |
| Activate/archive actions | 90-102, 184-217 | ✓ Database writes |
| Save with versioning | 105-141 | ✓ Creates new version |

**Disconnect:** All edits go to Supabase via `useResearchAgentConfigData`, but **nothing reads these values when executing research**. The inspector is fully functional for UI state, but the pipeline ignores the database.

---

### 7.2 WriterAgentConfigEditor

**File:** `src/bedrock/consoles/ExperienceConsole/WriterAgentConfigEditor.tsx` (Lines 1-851)

**Status:** ✓ FULLY IMPLEMENTED (UI Layer)

| Feature | Lines | Status |
|---------|-------|--------|
| Voice settings (formality, perspective) | 405-426, 494-527 | ✓ Complete |
| Document structure (citations, limits) | 534-638 | ✓ Complete |
| Quality rules (requireCitations, confidence) | 643-659 | ✓ Complete |
| Version management | 89-110, 378-389 | ✓ Singleton pattern |
| Activate/archive actions | 115-127, 184-217 | ✓ Database writes |
| Save with versioning | 130-169 | ✓ Creates new version |

**Disconnect:** Same as research — fully functional editor, but pipeline never queries the database for active config.

---

### 7.3 OutputTemplateEditor

**File:** `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx` (Lines 1-900+)

**Status:** ✓ IMPLEMENTED, ◐ PARTIAL WIRING

| Feature | Status |
|---------|--------|
| Edit systemPrompt | ✓ Wired to pipeline |
| Edit renderingInstructions | ✓ Wired (S27-OT) |
| Edit config overrides | ✗ **Field exists but never read** |
| Agent type selector | ✓ Working (filters templates) |
| Fork system templates | ✓ Working |
| Publish/activate | ✓ Working |

**Gap:** The inspector allows editing `template.config.overrides`, but document-generator.ts never reads this field.

---

## Section 8: Data Hooks (UI-Only)

### 8.1 useResearchAgentConfigData

**File:** `src/bedrock/consoles/ExperienceConsole/useResearchAgentConfigData.ts` (Lines 1-351)

**Status:** ✓ FULLY IMPLEMENTED for UI state

| Function | Line | Purpose | Used By |
|----------|------|---------|---------|
| `createDefaultResearchAgentConfig()` | 39-61 | Factory for new objects | UI only |
| `activate(id)` | 185-218 | Sets status='active', archives old | UI only |
| `saveAndActivate(config)` | 262-328 | Creates new version, archives old | UI only |
| `createVersion(sourceId)` | 221-254 | Clone config with incremented version | UI only |

**Architecture:**
- Uses `useGroveData<ResearchAgentConfigPayload>('research-agent-config')`
- Implements singleton pattern (only one 'active' at a time)
- Proper optimistic UI updates
- Rollback on creation failure

**Problem:** This hook manages **UI state ONLY**. The active config UUID and payload are never fetched by the research agent during execution.

---

### 8.2 useWriterAgentConfigData

**File:** `src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts` (Lines 1-351)

**Status:** ✓ FULLY IMPLEMENTED for UI state

Same architecture as research version. Full singleton pattern, versioning, activation flow.

**Problem:** Same disconnect — UI state managed perfectly, but pipeline never reads from database.

---

## Section 9: Server Endpoints

### 9.1 POST /api/research/deep

**File:** `server.js` (Lines 2501-2850+)

#### Current Implementation

```typescript
// Line 2546: Request params
const { query, context, systemPrompt, renderingInstructions, maxTokens = 16384 } = req.body;

// Lines 2558-2587: Fallback defaults
const defaultSystemPrompt = `You are a SENIOR RESEARCH ANALYST...`;  // ✗ HARDCODED
const renderingRules = renderingInstructions?.trim() || DEFAULT_RESEARCH_RENDERING_RULES;  // ✗ FALLBACK
const effectiveSystemPrompt = systemPrompt
  ? systemPrompt + renderingRules
  : defaultSystemPrompt;  // ✗ Overrides all config
```

#### Documented Tech Debt (Lines 2504-2533)

```typescript
// ============================================================================
// TECH DEBT: S22-WP HACKS (2026-01-24)
// ============================================================================
// These values should be PARAMETER-DRIVEN by the research-agent.ts, which
// loads them from the Output Template.
//
// CURRENT HACKS:
// 1. maxTokens = 16384       ← Should come from research-agent via template
// 2. max_uses = 15           ← Should come from research-agent via template
// 3. defaultSystemPrompt     ← Should NEVER exist; research-agent always provides
// 4. userPrompt structure    ← Should come from research-agent via template
```

#### Gaps

1. **No research_agent_config lookup** — maxTokens, maxApiCalls, searchDepth always hardcoded
2. **systemPrompt from frontend only** — no database lookup if template changed server-side
3. **Fallback hardcoded prompt** — overrides all configuration when systemPrompt missing

#### What Works ✓

- Accepts `systemPrompt` from frontend (template.systemPrompt)
- Accepts `renderingInstructions` from template (S27-OT)
- Concatenates them correctly for LLM

#### What's Missing ✗

- No lookup of active `research_agent_configs.payload`
- No application of `searchDepth`, `confidenceThreshold`, `branchDelay`, `maxApiCalls` from config
- Hardcoded `max_uses = 15` instead of `config.searchDepth * 5`

---

### 9.2 POST /api/research/write

**File:** `server.js` (Lines 2975-3076)

#### Current Implementation

```typescript
// Line 2986: Request params
const { evidence, query, voiceConfig, renderingInstructions } = req.body;

// Lines 3004-3025: System prompt construction
const approachPrompt = query;
const renderingRules = renderingInstructions?.trim() || DEFAULT_WRITER_RENDERING_RULES;  // ✗ FALLBACK
const writerSystemPrompt = `...voice...rendering...`;
```

#### Gaps

1. **voiceConfig comes from frontend, not database** — no `loadWriterAgentConfig()` call
2. **No documentStructure settings** — citationStyle, citationFormat, maxLength ignored
3. **No qualityRules** — requireCitations, minConfidenceToInclude, flagUncertainty ignored
4. **No template.config field** — OutputTemplateConfig.overrides completely unused

#### What Works ✓

- Accepts `voiceConfig` from frontend (document-generator passes it)
- Applies formality, perspective, citationStyle to prompt construction
- Accepts `renderingInstructions` and appends to system prompt

#### What's Missing ✗

- No lookup of active `writer_agent_configs.payload`
- Nested config fields in OutputTemplate.config are invisible
- Writer config versioning never consulted
- No enforcement of qualityRules (requireCitations, etc.)

---

## Section 10: Data Flow Breakdown

### 10.1 Research Pipeline (Current State)

```
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: ResearchAgentConfigEditor                              │
│ User edits searchDepth, sourcePreferences, maxApiCalls           │
│                                                                   │
│ ✓ Save to Supabase: research_agent_configs table                │
│ ✓ Status: 'active'                                               │
│ ✓ Version: incremented                                           │
└──────────────────────────────────────────────────────────────────┘
                         │
                         │ (DATABASE WRITE ONLY)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ Supabase Table: research_agent_configs                           │
│ Contains: All versions, active flagged                           │
│                                                                   │
│ ✗ NEVER QUERIED during document generation                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Frontend: User triggers research                                 │
│ Sprout selected, template selected                               │
│                                                                   │
│ → document-generator.ts                                          │
│    ├── Load template from defaults (NOT from Supabase)           │
│    ├── Get template.systemPrompt ✓                               │
│    ├── Get WriterAgentConfigPayload from DEFAULT ✗              │
│    └── Call research-agent.ts                                    │
│        └── Server POST /api/research/deep                        │
│            ├── Receives systemPrompt from frontend ✓             │
│            ├── Receives renderingInstructions ✓                  │
│            ├── Uses hardcoded maxTokens=16384 ✗                  │
│            ├── Uses hardcoded max_uses=15 ✗                      │
│            └── IGNORES research_agent_configs table ✗            │
└──────────────────────────────────────────────────────────────────┘
```

**Result:** ResearchAgentConfig is **write-only from UI**, **never read by pipeline**.

---

### 10.2 Writer Pipeline (Current State)

```
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: WriterAgentConfigEditor                                │
│ User edits voice, documentStructure, qualityRules                │
│                                                                   │
│ ✓ Save to Supabase: writer_agent_configs table                  │
│ ✓ Status: 'active'                                               │
│ ✓ Version: incremented                                           │
└──────────────────────────────────────────────────────────────────┘
                         │
                         │ (DATABASE WRITE ONLY)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ Supabase Table: writer_agent_configs                             │
│ Contains: All versions, active flagged                           │
│                                                                   │
│ ✗ NEVER QUERIED during document generation                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Frontend: User generates document                                │
│ Template selected, evidence ready                                │
│                                                                   │
│ → document-generator.ts                                          │
│    ├── Load template from defaults (NOT from Supabase)           │
│    ├── Get template.systemPrompt ✓                               │
│    ├── Get template.renderingInstructions ✓                      │
│    ├── Build config from DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD ✗  │
│    └── Call writeResearchDocument()                              │
│        ├── systemPromptOverride from template ✓                  │
│        ├── renderingInstructions from template ✓                 │
│        ├── config from DEFAULT (NOT database) ✗                  │
│        └── Server POST /api/research/write                       │
│            ├── Receives voiceConfig from frontend ✓              │
│            ├── Receives renderingInstructions ✓                  │
│            ├── Uses hardcoded DEFAULT_WRITER_RENDERING_RULES ✗  │
│            └── IGNORES writer_agent_configs table ✗              │
└──────────────────────────────────────────────────────────────────┘
```

**Result:** WriterAgentConfig is **write-only from UI**, **never read by pipeline**.

---

## Section 11: Supabase Tables (Write-Only)

| Table | Record Type | Purpose | Queries? |
|-------|-------------|---------|----------|
| `research_agent_configs` | GroveObject<ResearchAgentConfigPayload> | Store all versions | ✗ UI display only |
| `writer_agent_configs` | GroveObject<WriterAgentConfigPayload> | Store all versions | ✗ UI display only |
| `output_templates` | GroveObject<OutputTemplatePayload> | Store templates | ✗ Defaults only |

### Expected Query Pattern (Commented Out)

**From config-loader.ts:36-43:**
```typescript
const { data } = await supabase
  .from('research_agent_configs')
  .select('payload')
  .eq('grove_id', groveId)
  .eq("meta->>'status'", 'active')  // Singleton constraint
  .single();
if (data) return data.payload;
```

**Actual Reality:** This code is commented out. Function returns defaults without querying.

---

## Section 12: Missing Integration Points

### 12.1 Research Agent Should

**Current:** Receives systemPrompt from template, uses hardcoded DEFAULT_CONFIG

**Should Be:**
1. Accept `groveId` parameter in `performResearch()` function
2. Call `loadResearchAgentConfig(groveId)` to get active config
3. Apply config settings:
   - `searchDepth` → Controls `max_uses` in server
   - `maxApiCalls` → Budget enforcement
   - `confidenceThreshold` → Filter low-quality sources
   - `sourcePreferences` → Prioritize source types
4. Pass all config to server endpoint (not just systemPrompt)

**Code Change Required:**
```typescript
// research-agent.ts
export async function performResearch(
  query: string,
  groveId: string,  // NEW PARAM
  options?: ResearchOptions
) {
  const config = await loadResearchAgentConfig(groveId);  // NEW CALL
  // Use config.searchDepth, config.maxApiCalls, etc.
}
```

---

### 12.2 Writer Agent Should

**Current:** Receives config from `DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD`, template can override systemPrompt only

**Should Be:**
1. Accept `groveId` parameter in `writeResearchDocument()` or document-generator
2. Call `loadWriterAgentConfig(groveId)` to get active config
3. Merge template overrides: `mergeConfigs(writerConfig, template.config?.overrides)`
4. Pass complete effective config to server (including qualityRules)

**Code Change Required:**
```typescript
// document-generator.ts:132-135
const groveId = request.sprout.groveId;
const writerConfig = await loadWriterAgentConfig(groveId);  // NEW CALL
const config = mergeConfigs(
  writerConfig,
  request.template.config?.overrides  // NEW: Read template.config
);
```

---

### 12.3 Server Endpoints Should

#### POST /api/research/deep

**Remove:**
- Hardcoded `defaultSystemPrompt` (line 2560-2575)
- Hardcoded `maxTokens = 16384` (line 2546)
- Hardcoded `max_uses = 15` (line 2742)
- Fallback `DEFAULT_RESEARCH_RENDERING_RULES`

**Require in Body:**
- `systemPrompt` (always, never use default)
- `renderingInstructions` (always, never use default)
- `maxTokens` (from config)
- `maxSearches` (from config.searchDepth)
- `confidenceThreshold` (from config)

#### POST /api/research/write

**Remove:**
- Fallback `DEFAULT_WRITER_RENDERING_RULES` (line 3008)

**Require in Body:**
- `systemPrompt` (always)
- `renderingInstructions` (always)
- `voiceConfig` (already sent)
- `documentStructure` (NOT SENT — add this)
- `qualityRules` (NOT SENT — add this)

**Apply Settings:**
- Enforce `qualityRules.requireCitations` (reject if sources missing)
- Filter evidence by `qualityRules.minConfidenceToInclude`
- Add uncertainty flags if `qualityRules.flagUncertainty = true`

---

## Section 13: Provenance Gaps

### 13.1 Current GeneratedArtifact

**File:** `src/core/schema/sprout.ts`

```typescript
export interface GeneratedArtifact {
  document: ResearchDocument;
  templateId: string;          // ✓ Recorded
  templateName: string;        // ✓ Recorded
  generatedAt: string;         // ✓ Recorded
  renderingSource?: string;    // ✓ S27-OT provenance
  // ✗ Missing: Which config versions produced this?
}
```

### 13.2 Should Include

```typescript
export interface GeneratedArtifact {
  document: ResearchDocument;
  templateId: string;
  templateName: string;
  generatedAt: string;
  renderingSource?: 'template' | 'default-writer' | 'default-research';

  // NEW: Config provenance
  researchConfigVersion?: number;     // Which research config was active
  writerConfigVersion?: number;       // Which writer config was active
  effectiveFormality?: string;        // What was actually used (after merge)
  effectiveCitationFormat?: string;   // What was actually used (after merge)
}
```

**Impact:** Without version tracking, documents are **not reproducible**. You can't answer: "Why does this document have different citations than that one?" → "Because v2 used 'apa' and v3 uses 'simple'."

---

## Section 14: Summary of Gaps

### Gap 1: Config Loader Never Called

**File:** `config-loader.ts`

| Function | Lines | Issue |
|----------|-------|-------|
| `loadResearchAgentConfig()` | 31-47 | TODO stub, returns defaults |
| `loadWriterAgentConfig()` | 62-78 | TODO stub, returns defaults |

**Impact:** Even if implemented, these functions are **never imported or called** anywhere. They're orphaned.

---

### Gap 2: Template.config Field Ignored

**File:** `output-template.ts`, `document-generator.ts`

**Issue:** Schema defines `config?: OutputTemplateConfig` for template-specific overrides, but document-generator.ts never reads `template.config`.

**Impact:** Templates can't override writer config fields like formality or citationFormat. The override mechanism doesn't exist.

---

### Gap 3: Server Uses Hardcoded Defaults

**File:** `server.js`

| Line | Issue |
|------|-------|
| 2560-2575 | `defaultSystemPrompt` fallback overrides all config |
| 2546 | `maxTokens = 16384` hardcoded |
| 2742 | `max_uses = 15` hardcoded |
| 3008 | `DEFAULT_WRITER_RENDERING_RULES` fallback |

**Impact:** Even if frontend sent correct config, server has escape hatches that use hardcoded values.

---

### Gap 4: No Provenance for Config Versions

**File:** `sprout.ts`, `document-generator.ts`

**Issue:** GeneratedArtifact records template info but NOT which config versions were active.

**Impact:** Documents are **not reproducible**. Can't debug "why different output?" Can't do A/B testing on config changes.

---

## Section 15: Recommended Fixes

### Tier 1: Enable Config Loading (Unblock DEX)

| File | Change | Lines Affected |
|------|--------|----------------|
| `config-loader.ts` | Uncomment Supabase queries, test | ~10 lines each |
| `research-agent.ts` | Accept groveId, call loadResearchAgentConfig() | ~5 lines |
| `writer-agent.ts` | Accept groveId, call loadWriterAgentConfig() | ~5 lines |
| `document-generator.ts` | Pass groveId, load configs, apply template overrides | ~15 lines |

---

### Tier 2: Server Integration

| File | Change | Lines Affected |
|------|--------|----------------|
| `server.js` | Remove defaultSystemPrompt fallback | -20 lines |
| `server.js` | Accept maxTokens, maxSearches in body | +5 lines |
| `server.js` | Accept qualityRules in body, enforce | +15 lines |
| `server.js` | Remove DEFAULT_WRITER_RENDERING_RULES fallback | -5 lines |

---

### Tier 3: Template System Enhancement

| File | Change | Lines Affected |
|------|--------|----------------|
| `template-loader.ts` | Query Supabase output_templates table | +15 lines |
| `template-loader.ts` | Fall back to defaults if no user templates | +5 lines |
| `output-template.ts` | Ensure OutputTemplateConfig typed correctly | Review only |

---

### Tier 4: Provenance Tracking

| File | Change | Lines Affected |
|------|--------|----------------|
| `sprout.ts` | Add config version fields to GeneratedArtifact | +4 fields |
| `document-generator.ts` | Record config versions when generating | +5 lines |
| `SproutFinishingRoom/` | Display config provenance in UI | +10 lines |

---

## Section 16: Files Requiring Changes

### Frontend Services (4 files)

1. **config-loader.ts** (src/explore/services/)
   - Uncomment Supabase queries in `loadResearchAgentConfig()`
   - Uncomment Supabase queries in `loadWriterAgentConfig()`
   - Add `mergeConfigs()` function for template overrides

2. **document-generator.ts** (src/explore/services/)
   - Accept groveId in DocumentGenerationRequest
   - Call `loadWriterAgentConfig(groveId)` instead of using defaults
   - Read `template.config?.overrides` and merge with writer config
   - Pass effective config to writeResearchDocument()

3. **research-agent.ts** (src/explore/services/)
   - Accept groveId parameter in performResearch()
   - Call `loadResearchAgentConfig(groveId)`
   - Pass config settings to server endpoint

4. **template-loader.ts** (src/explore/services/)
   - Add Supabase query to `loadTemplateById()`
   - Fall back to defaults if user template not found
   - Load user-created templates from database

---

### Backend (1 file)

5. **server.js**
   - POST /api/research/deep:
     - Remove `defaultSystemPrompt` fallback
     - Accept `maxTokens`, `maxSearches`, `confidenceThreshold` in body
     - Enforce required fields (no defaults)
   - POST /api/research/write:
     - Remove `DEFAULT_WRITER_RENDERING_RULES` fallback
     - Accept `documentStructure`, `qualityRules` in body
     - Enforce quality rules (citations, confidence filtering)

---

### Schema (1 file)

6. **sprout.ts** (src/core/schema/)
   - Add config provenance fields to GeneratedArtifact:
     - `researchConfigVersion?: number`
     - `writerConfigVersion?: number`
     - `effectiveFormality?: string`
     - `effectiveCitationFormat?: string`

---

### Inspector Panels (3 files — UI enhancements only)

7. **ResearchAgentConfigEditor.tsx**
   - Add "Pipeline Impact" panel showing how config affects research
   - Display downstream effects (searchDepth → max_uses calculation)
   - Show which documents used this config version

8. **WriterAgentConfigEditor.tsx**
   - Add "Pipeline Impact" panel showing merge behavior
   - Indicate which fields are overridable by templates
   - Show example template override scenarios

9. **OutputTemplateEditor.tsx**
   - Display inherited vs overridden values
   - Show effective config preview (after merge)
   - Add "Config Overrides" section if not present

---

## Section 17: Implementation Sequence

### Phase 1: Config Loading (Core Fix — 1 day)

1. config-loader.ts: Uncomment and test Supabase queries
2. document-generator.ts: Call loadWriterAgentConfig(), merge with template
3. Test: Generate document, verify config loaded from database

**Acceptance:** WriterAgentConfig edits immediately affect next document generated.

---

### Phase 2: Research Agent Wiring (1 day)

1. research-agent.ts: Accept groveId, call loadResearchAgentConfig()
2. server.js: Accept config params in /api/research/deep body
3. Test: Edit searchDepth, verify max_uses changes

**Acceptance:** ResearchAgentConfig edits immediately affect research behavior.

---

### Phase 3: Template System (0.5 day)

1. template-loader.ts: Load from Supabase, fall back to defaults
2. document-generator.ts: Read template.config.overrides, apply to merge
3. Test: Template overrides specific fields, inherits others

**Acceptance:** Template "Academic Paper" overrides formality to "academic" while inheriting citationFormat from base.

---

### Phase 4: Server Hardcoded Defaults Removal (0.5 day)

1. server.js: Remove all fallback defaults
2. server.js: Require all config in request body
3. Test: Missing systemPrompt returns 400 error (no fallback)

**Acceptance:** Server rejects requests without complete config, no hardcoded defaults used.

---

### Phase 5: Provenance Tracking (0.5 day)

1. sprout.ts: Add config version fields to GeneratedArtifact
2. document-generator.ts: Record versions when generating
3. SproutFinishingRoom: Display provenance in DocumentViewer
4. Test: Generated artifact includes config versions

**Acceptance:** Document provenance shows researchConfigVersion, writerConfigVersion, effectiveFormality.

---

### Phase 6: E2E Testing (1 day)

1. Create test: Edit config → generate document → verify settings applied
2. Create test: Template overrides → verify merge behavior
3. Create test: Activate old version → verify rollback works
4. Create test: Provenance tracking → verify versions recorded

**Acceptance:** All E2E tests pass, config flow verified end-to-end.

---

## Section 18: Success Criteria

### AC-1: Configs Loaded from Database

**Test:**
1. Edit WriterAgentConfig in inspector (change formality to "academic")
2. Generate document with default template
3. Verify document uses academic formality

**Current:** ✗ Uses hardcoded "professional"
**After Fix:** ✓ Uses database value "academic"

---

### AC-2: Template Overrides Work

**Test:**
1. Base WriterAgentConfig has formality="professional"
2. "Academic Paper" template has config.overrides.formality="academic"
3. Generate document with "Academic Paper" template
4. Verify effective formality is "academic" (template wins)

**Current:** ✗ template.config.overrides never read
**After Fix:** ✓ Template overrides applied correctly

---

### AC-3: Provenance Tracking

**Test:**
1. Generate document
2. Check GeneratedArtifact metadata
3. Verify fields present: researchConfigVersion, writerConfigVersion, effectiveFormality

**Current:** ✗ Only templateId recorded
**After Fix:** ✓ Full config provenance tracked

---

### AC-4: No Hardcoded Defaults

**Test:**
1. Remove systemPrompt from request body to /api/research/write
2. Send request
3. Verify server returns 400 error (not fallback prompt)

**Current:** ✗ Uses defaultSystemPrompt fallback
**After Fix:** ✓ Rejects request, no fallback

---

### AC-5: E2E Config Flow

**Test:**
1. Set ResearchAgentConfig.searchDepth = 5
2. Trigger research
3. Verify server uses max_uses = 25 (searchDepth × 5)

**Current:** ✗ Always uses max_uses = 15 (hardcoded)
**After Fix:** ✓ Uses calculated value from config

---

### AC-6: Rollback Scenario

**Test:**
1. Activate WriterAgentConfig v4
2. Generate document, verify v4 settings applied
3. Reactivate v3 (rollback)
4. Generate document, verify v3 settings applied

**Current:** N/A (versioning exists but unused)
**After Fix:** ✓ Rollback works, pipeline uses reactivated version

---

## Section 19: Technical Debt Resolved

| Location | Line | Issue | Resolution |
|----------|------|-------|------------|
| `server.js` | 2504-2533 | Explicit tech debt comment re: hardcoded defaults | Remove all hardcoded defaults |
| `server.js` | 2560-2575 | defaultSystemPrompt fallback | Remove, require in body |
| `server.js` | 2546 | maxTokens = 16384 hardcoded | Accept in body from config |
| `server.js` | 2742 | max_uses = 15 hardcoded | Calculate from config.searchDepth |
| `server.js` | 3008 | DEFAULT_WRITER_RENDERING_RULES | Remove, require in body |
| `config-loader.ts` | 36-43 | TODO comment with Supabase query | Uncomment, test |
| `config-loader.ts` | 67-74 | TODO comment with Supabase query | Uncomment, test |
| `document-generator.ts` | 132 | Uses DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD | Load from Supabase |
| `research-agent.ts` | 122-128 | DEFAULT_CONFIG hardcoded | Accept groveId, load config |
| `template-loader.ts` | 52 | Loads from getDefaults only | Query Supabase first |

---

## Section 20: Files Audited (Complete Inventory)

### Schema Files (3)
1. `src/core/schema/research-agent-config.ts` — ✓ Complete, unused
2. `src/core/schema/writer-agent-config.ts` — ✓ Complete, unused
3. `src/core/schema/output-template.ts` — ✓ Complete, partial use

### Service Files (5)
4. `src/explore/services/config-loader.ts` — ✗ TODO stubs
5. `src/explore/services/document-generator.ts` — ◐ Partial (templates only)
6. `src/explore/services/research-agent.ts` — ◐ Accepts config, doesn't load
7. `src/explore/services/writer-agent.ts` — ◐ Accepts config, doesn't load
8. `src/explore/services/template-loader.ts` — ◐ Defaults only

### Inspector Panels (3)
9. `src/bedrock/consoles/ExperienceConsole/ResearchAgentConfigEditor.tsx` — ✓ UI complete
10. `src/bedrock/consoles/ExperienceConsole/WriterAgentConfigEditor.tsx` — ✓ UI complete
11. `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx` — ✓ UI complete

### Data Hooks (2)
12. `src/bedrock/consoles/ExperienceConsole/useResearchAgentConfigData.ts` — ✓ UI state only
13. `src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts` — ✓ UI state only

### Backend (1)
14. `server.js` — ◐ Partial (accepts template prompts, ignores configs)

**Total Audited:** 14 files
**Full Integration Required:** 8 files
**UI-Only Enhancements:** 3 files

---

## Conclusion

The DEX pipeline architecture is **well-designed but incompletely wired**. The UI layer is fully functional, the schema layer is complete, but the **integration layer is missing**. Config data flows one direction (UI → Database) but never the other direction (Database → Pipeline).

**Core Issue:** config-loader.ts was designed as the integration layer but was never completed (TODO stubs) and is never called.

**Fix Complexity:** LOW — Most code already exists, just needs wiring:
- Uncomment ~20 lines of commented code
- Add ~50 lines of function calls and merging logic
- Remove ~30 lines of hardcoded defaults
- Add ~10 lines of provenance tracking

**Estimated Effort:** 3-4 days (including E2E tests and provenance tracking)

---

**Audit Completed:** 2026-01-28
**Next Step:** Review wireframes (index.html), validate architecture, begin implementation
