# S28-PIPE: Sprint Artifacts Summary

**Sprint:** Pipeline Architecture Rationalization
**Status:** Planning Phase Complete ✓
**Created:** 2026-01-28
**Artifacts:** 11 files

---

## What This Sprint Fixes

The Grove pipeline has three configuration layers:
1. **ResearchAgentConfig** (grove-wide) — Controls evidence gathering
2. **WriterAgentConfig** (grove-wide) — Controls document writing
3. **OutputTemplate** (per-document) — Overrides specific settings

**Current Problem:** All three exist in the UI and database, but the pipeline uses **hardcoded defaults** instead.

**After Fix:** Configs compose correctly (research → writer → template overrides), and document provenance tracks which versions produced each output.

---

## Artifacts Created

### Planning Documents

| File | Purpose | Status |
|------|---------|--------|
| `SPEC.md` | Full specification with architecture vision and ACs | ✓ Complete |
| `README.md` | Sprint summary and navigation | ✓ Complete |
| `AUDIT_REPORT.md` | Detailed audit of all 14 files in pipeline | ✓ Complete |
| `SUMMARY.md` | This file (quick reference) | ✓ Complete |

### Interactive HTML Wireframes (7)

| Wireframe | Purpose | Visual Elements |
|-----------|---------|-----------------|
| `index.html` | Gallery and navigation | Links to all wireframes |
| `wireframe-01-pipeline-flow.html` | Broken state visualization | Pipeline stages, status badges, gap indicators |
| `wireframe-02-config-loading.html` | Merge strategy | Layer stack, priority order, effective config |
| `wireframe-03-research-inspector.html` | ResearchAgentConfig editor | Full UI mockup with pipeline impact panel |
| `wireframe-04-writer-inspector.html` | WriterAgentConfig editor | Voice/structure/quality settings with overrides |
| `wireframe-05-template-selector.html` | Template selection | Override badges, inheritance preview |
| `wireframe-06-versioning-system.html` | Config versioning | Timeline, activation flow, singleton pattern |
| `wireframe-07-generation-flow.html` | End-to-end flow | Step-by-step with code samples and provenance |

---

## Key Findings (From Audit)

### 1. Config Loader Never Called

`config-loader.ts` has functions to load configs from Supabase, but:
- They're TODO stubs that return hardcoded defaults
- **Never imported or called** anywhere in the pipeline
- Even if implemented, they're orphaned

### 2. Template.config Field Ignored

`OutputTemplate` schema has a `config` field for overrides, but:
- document-generator.ts never reads `template.config`
- Override mechanism doesn't exist
- Templates can only override systemPrompt (via string field), not nested config

### 3. Server Uses Hardcoded Defaults

`server.js` has multiple fallback defaults:
- Line 2560-2575: `defaultSystemPrompt`
- Line 2546: `maxTokens = 16384`
- Line 2742: `max_uses = 15`
- Line 3008: `DEFAULT_WRITER_RENDERING_RULES`

These override any configuration sent by the frontend.

### 4. No Provenance for Config Versions

`GeneratedArtifact` records template info but NOT:
- Which research config version was used
- Which writer config version was used
- What effective settings were (after merge)

Documents are **not reproducible**.

---

## Architecture Vision (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│               Three-Layer Composition                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Priority 1: Template Overrides (Highest)                  │
│  ├─ systemPrompt: "Write formal academic..."              │
│  ├─ renderingInstructions: "Use APA..."                   │
│  └─ config.overrides: { formality: "academic" }           │
│                  │                                          │
│                  ▼ (overrides specific fields)             │
│  Priority 2: Writer Config (Grove-Wide Base)              │
│  ├─ voice: { formality: "professional", ... }             │
│  ├─ documentStructure: { citationFormat: "apa", ... }     │
│  └─ qualityRules: { requireCitations: true, ... }         │
│                  │                                          │
│                  ▼ (inherits if not overridden)            │
│  Priority 3: Research Config (Evidence Phase)             │
│  ├─ searchDepth: 3                                         │
│  ├─ sourcePreferences: ["academic"]                       │
│  ├─ confidenceThreshold: 0.6                              │
│  └─ maxApiCalls: 10                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Merge Rule:** Higher priority wins. Fields not set in higher layer inherit from below.

---

## Implementation Phases

### Phase 1: Wire Config Loading (Core)
- Uncomment config-loader.ts Supabase queries
- Wire document-generator.ts to load configs
- Test: Config edits affect output

### Phase 2: Server Integration
- Remove hardcoded defaults from server.js
- Require all config in request body
- Enforce quality rules

### Phase 3: Template Enhancement
- Load templates from Supabase
- Apply template.config.overrides
- Test: Template inheritance

### Phase 4: Provenance Tracking
- Add config version fields to GeneratedArtifact
- Record versions on generation
- Display in UI

---

## Files Requiring Changes

### Tier 1: Core Wiring (MUST FIX)
1. `src/explore/services/config-loader.ts` — Uncomment queries
2. `src/explore/services/document-generator.ts` — Load configs, merge
3. `server.js` — Remove defaults, require config

### Tier 2: Schema Updates
4. `src/core/schema/sprout.ts` — Add provenance fields

### Tier 3: UI Enhancements (Optional)
5. `ResearchAgentConfigEditor.tsx` — Pipeline impact panel
6. `WriterAgentConfigEditor.tsx` — Override indicators
7. `OutputTemplateEditor.tsx` — Effective config preview

---

## Quick Start

1. **Review Wireframes:** Open `docs/sprints/s28-pipeline-architecture-v1/index.html`
2. **Read Audit:** Review `AUDIT_REPORT.md` for complete gap analysis
3. **Validate Architecture:** Confirm merge strategy and priority order
4. **Extract User Stories:** Use `/user-story-refinery` on SPEC.md
5. **Begin Implementation:** Phase 1 (config loading) first

---

## Technical Debt Eliminated

| Location | Issue | Fix |
|----------|-------|-----|
| server.js:2504-2533 | Explicit TODO comment re: hardcoded values | Remove defaults, require from client |
| config-loader.ts:36-43 | TODO stub with commented Supabase query | Uncomment, test, deploy |
| config-loader.ts:67-74 | TODO stub with commented Supabase query | Uncomment, test, deploy |
| document-generator.ts:132 | `...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD` | Load from Supabase instead |
| research-agent.ts:122-128 | `DEFAULT_CONFIG` hardcoded | Accept groveId, load config |
| template-loader.ts:52 | `getDefaults('output-template')` | Query Supabase first |

---

**Last Updated:** 2026-01-28
**Total Audit Time:** ~45 minutes (comprehensive 14-file analysis)
**Wireframes:** 7 interactive HTML visualizations
**Next Action:** User review → Story extraction → Implementation
