# S28-PIPE: Pipeline Architecture Rationalization

**Status:** Planning Complete ✓
**Phase:** Detailed Architecture Design with HTML Wireframes
**Priority:** 🔴 Critical — Blocks DEX Compliance

---

## Quick Links

- 📊 [Interactive Wireframes (index.html)](./index.html) — **START HERE**
- 📄 [Full Specification (SPEC.md)](./SPEC.md)
- 🔍 [Comprehensive Audit Report](../../../.agent/status/archive/) — See agent output

---

## Problem Statement

The Grove pipeline architecture has **three configuration layers** designed to compose declaratively:

```
Research Agent Config → Writer Agent Config → Output Template
   (grove-wide)            (grove-wide base)      (per-document overrides)
```

**Current Reality:** All three layers exist in the UI and database, but **NONE are wired to the actual pipeline**. Everything uses hardcoded defaults.

### Critical Gaps

| Component | Designed | Implemented | Integrated | Impact |
|-----------|----------|-------------|-----------|--------|
| ResearchAgentConfig | ✓ | ✓ | ✗ | Configs never read during research |
| WriterAgentConfig | ✓ | ✓ | ✗ | Configs never read during writing |
| OutputTemplate.config | ✓ | ✗ | ✗ | Override field completely ignored |
| config-loader.ts | ✓ | ✗ (TODO stubs) | ✗ (never called) | Returns hardcoded defaults |
| Provenance tracking | ✓ Design | ✗ | ✗ | No record of config versions used |

---

## Architecture Vision

### Three-Layer Composition (Priority: Top Wins)

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Template Overrides (Highest Priority)             │
│  - systemPrompt: template-specific                          │
│  - renderingInstructions: formatting rules                  │
│  - config.overrides: { formality: "academic", ... }         │
└──────────────────────┬──────────────────────────────────────┘
                       │ (overrides specific fields)
┌──────────────────────▼──────────────────────────────────────┐
│  Layer 2: Writer Agent Config (Grove-Wide Base)             │
│  - voice: { formality: "professional", perspective: ... }   │
│  - documentStructure: { citationFormat: "apa", ... }        │
│  - qualityRules: { requireCitations: true, ... }            │
└──────────────────────┬──────────────────────────────────────┘
                       │ (inherits if not overridden)
┌──────────────────────▼──────────────────────────────────────┐
│  Layer 3: Research Agent Config (Evidence Phase)            │
│  - searchDepth: 3                                           │
│  - sourcePreferences: ["academic", "practitioner"]          │
│  - confidenceThreshold: 0.6                                 │
│  - maxApiCalls: 10                                          │
└─────────────────────────────────────────────────────────────┘
```

### Merge Rule

Higher priority layers **override** lower layers. Fields not set in a higher layer are **inherited** from the layer below.

---

## Wireframes (7 Interactive HTML Pages)

### 01. Pipeline Flow (Broken State)
Visual breakdown showing:
- Where configs are stored (Supabase)
- Where they should be loaded (config-loader.ts)
- Where the wiring breaks (TODO stubs, never called)
- Current vs intended data flow

### 02. Config Loading & Merge Strategy
Shows:
- Layer stack visualization with priority
- Merge algorithm implementation
- Field inheritance rules
- Effective config after merge

### 03. Research Agent Config Inspector
Full UI mockup:
- Config editor with all fields (searchDepth, sourcePreferences, etc.)
- Pipeline impact panel showing downstream effects
- Version selector sidebar
- Singleton pattern enforcement

### 04. Writer Agent Config Inspector
Shows:
- Voice settings (formality, perspective, personality)
- Document structure (citations, length limits)
- Quality rules (confidence thresholds, uncertainty flagging)
- Template override indicators

### 05. Template Selector with Config Inheritance
Demonstrates:
- Template grid with override badges
- Effective config comparison (base vs template vs result)
- Provenance preview showing config versions
- Source attribution (which layer provided each value)

### 06. Config Versioning System
Timeline view:
- Version history with diffs
- Activation flow (draft → active)
- Singleton pattern enforcement (auto-archive on activate)
- Rollback scenarios

### 07. End-to-End Document Generation Flow
Step-by-step:
1. Load research config from Supabase
2. Load writer config from Supabase
3. Load selected template
4. Merge configs (template overrides win)
5. Send to server with complete config
6. Generate document with provenance

---

## Implementation Plan

### Phase 1: Wire Config Loading (Core Fix)

**Files:**
- `src/explore/services/config-loader.ts` — Uncomment Supabase queries
- `src/explore/services/research-agent.ts` — Accept groveId, load config
- `src/explore/services/writer-agent.ts` — Accept groveId, load config
- `src/explore/services/document-generator.ts` — Pass groveId through

**Acceptance:**
- ✓ ResearchAgentConfig loaded from Supabase during research
- ✓ WriterAgentConfig loaded from Supabase during writing

### Phase 2: Server Integration

**Files:**
- `server.js` — Remove hardcoded defaults from /api/research/deep and /api/research/write
- `server.js` — Require all config params in request body

**Acceptance:**
- ✓ No fallback prompts (server requires config from client)
- ✓ qualityConfig parameter added to /api/research/write

### Phase 3: Template System Enhancement

**Files:**
- `src/explore/services/template-loader.ts` — Load from Supabase, not just defaults
- `src/core/schema/output-template.ts` — Ensure config.overrides typed correctly

**Acceptance:**
- ✓ User-created templates loaded from database
- ✓ Template config overrides applied correctly

### Phase 4: Provenance Tracking

**Files:**
- `src/core/schema/sprout.ts` — Add config version fields to GeneratedArtifact
- `src/explore/services/document-generator.ts` — Record config versions
- `src/surface/components/modals/SproutFinishingRoom/` — Display provenance

**Acceptance:**
- ✓ Documents record researchConfigVersion, writerConfigVersion, templateId
- ✓ Inspector shows which config versions produced a document

---

## Out of Scope

- UI redesign of inspector panels (layout unchanged)
- New config fields beyond current schema
- Migration of existing documents to new provenance format
- Multi-grove config sharing

---

## Success Criteria

1. **AC-1:** Admin edits WriterAgentConfig, next document uses new settings
2. **AC-2:** Template overrides specific fields, inherits others correctly
3. **AC-3:** Document provenance shows config versions used
4. **AC-4:** No hardcoded defaults in server.js
5. **AC-5:** E2E test verifies config flows through pipeline
6. **AC-6:** Rollback scenario works (reactivate old config version)

---

## Files Created

### Sprint Artifacts
- `SPEC.md` — Full specification with architecture vision and ACs
- `README.md` — This file (summary and navigation)
- `index.html` — Wireframe gallery with interactive navigation

### Wireframes
- `wireframe-01-pipeline-flow.html` — Current broken state visualization
- `wireframe-02-config-loading.html` — Merge strategy and layer stack
- `wireframe-03-research-inspector.html` — Research config editor UI
- `wireframe-04-writer-inspector.html` — Writer config editor UI
- `wireframe-05-template-selector.html` — Template selection with inheritance
- `wireframe-06-versioning-system.html` — Versioning and activation flow
- `wireframe-07-generation-flow.html` — End-to-end document generation

---

## Next Actions

1. **Review Wireframes:** Open `index.html` in browser, review all 7 wireframes
2. **Validate Architecture:** Confirm merge strategy and priority order
3. **Estimate Effort:** Break into tasks, assign story points
4. **Create User Stories:** Extract from SPEC.md acceptance criteria
5. **Begin Implementation:** Phase 1 (config loading) first

---

## Technical Debt Resolved

This sprint fixes the following documented tech debt:

| Location | Issue | Resolution |
|----------|-------|------------|
| `server.js:2504-2533` | Hardcoded maxTokens, defaultSystemPrompt | Remove, require from client |
| `config-loader.ts:36-43` | TODO stub, commented Supabase query | Uncomment, test, deploy |
| `config-loader.ts:67-74` | TODO stub, commented Supabase query | Uncomment, test, deploy |
| `document-generator.ts:132` | Uses DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD | Load from Supabase instead |
| `research-agent.ts:122-128` | DEFAULT_CONFIG hardcoded | Accept groveId param, load config |

---

**Last Updated:** 2026-01-28
**Created By:** Sprint Planning Agent (Comprehensive Audit)
