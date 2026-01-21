# Agents Go Live v1 Execution Contract

**Codename:** `agents-go-live-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S15-Federation)
**Date:** 2026-01-20
**Branch:** `feat/agents-go-live-v1`

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Contract Setup |
| **Status** | 🚀 Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-20 |
| **Next Action** | Phase 1 - Backend Wiring |

---

## Attention Anchor

**We are building:** Functional research and writer agents with real Claude LLM calls, plus simplified config UI.

**Success looks like:**
- Research agent calls Claude API and returns real findings (not "[Pending]" placeholder)
- Writer agent generates actual documents with position/analysis/citations
- Config editors show 8 essential fields by default, with Advanced toggle for the rest

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
└── src/workspace/*

ACTIVE BUILD ZONE — WHERE WE WORK
├── server.js (backend endpoints)
├── src/explore/services/* (agent services)
├── src/bedrock/consoles/ExperienceConsole/* (config editors)
└── src/core/schema/* (config schemas)
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Claude API endpoints | ✅ Config-driven prompts | ✅ Model param in config | ✅ Response tracked | ✅ Endpoint pattern |
| Research agent wiring | ✅ Config controls behavior | ✅ Service abstracts LLM | ✅ Source attribution | ✅ Pipeline pattern |
| Writer agent wiring | ✅ Voice config drives output | ✅ Service abstracts LLM | ✅ Citations tracked | ✅ Pipeline pattern |
| Config UI simplification | ✅ Fields in schema | ✅ N/A (UI only) | ✅ N/A (UI only) | ✅ Advanced toggle pattern |

---

## Execution Architecture

### Phase 1: Backend Wiring (server.js)
**Goal:** Add Claude API endpoints to Express server

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 1a | Add @anthropic-ai/sdk dependency | `npm install` succeeds |
| 1b | Add `/api/research/deep` endpoint | Endpoint responds |
| 1c | Add `/api/research/write` endpoint | Endpoint responds |
| 1d | Build verification | `npm run build` passes |

### Phase 2: Service Wiring (Frontend → Backend)
**Goal:** Wire client services to call new endpoints

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 2a | Wire `callClaudeDeepResearch()` in research-execution-engine.ts | Function calls endpoint |
| 2b | Wire `callLLMForWriting()` in writer-agent.ts | Function calls endpoint |
| 2c | Build verification | `npm run build` passes |

### Phase 3: UI Simplification (Config Editors)
**Goal:** Reduce config UI to essential fields + Advanced toggle

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 3a | Simplify ResearchAgentConfigEditor (3 fields + Advanced) | Screenshot evidence |
| 3b | Simplify WriterAgentConfigEditor (3 fields + Advanced) | Screenshot evidence |
| 3c | Document v2 stub fields in schema files | Comments added |
| 3d | Build verification | `npm run build` passes |

### Phase 4: Verification
**Goal:** E2E test and visual proof

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 4a | E2E test with console monitoring | Zero critical errors |
| 4b | REVIEW.html completion | All screenshots embedded |

---

## Essential Fields (v1.0)

### Research Config (3 essential + 2 advanced)
**Essential:**
1. `searchDepth` → "Research Depth" dropdown (Quick/Standard/Deep maps to 1/3/5)
2. `maxApiCalls` → "API Budget" slider (5-20)
3. `confidenceThreshold` → "Quality Floor" slider (50-90%)

**Advanced:**
- `sourcePreferences` → Multi-select
- `branchDelay` → Number input

### Writer Config (3 essential + 5 advanced)
**Essential:**
1. `voice.formality` → "Writing Style" dropdown
2. `qualityRules.requireCitations` → "Require Citations" toggle
3. `qualityRules.minConfidenceToInclude` → "Quality Floor" slider

**Advanced:**
- `voice.perspective` → Dropdown
- `voice.personality` → Text input
- `documentStructure.*` → All structure settings
- `qualityRules.flagUncertainty` → Toggle

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] All DEX compliance gates pass
- [ ] All screenshots captured and embedded in REVIEW.html
- [ ] REVIEW.html complete with all sections
- [ ] E2E test with console monitoring passes
- [ ] Zero critical console errors in E2E tests
- [ ] Code-simplifier applied
- [ ] Build passes
- [ ] User notified with REVIEW.html path

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase without screenshot evidence (for UI phases)
- ❌ DEX compliance test fails
- ❌ REVIEW.html not created or incomplete
- ❌ E2E test not created or missing console monitoring
- ❌ Critical console errors detected in E2E tests

---

## Environment Requirements

- `ANTHROPIC_API_KEY` environment variable required for Claude API calls
- Server must be restarted after adding new endpoints

---

*This contract is binding. Deviation requires explicit human approval.*
