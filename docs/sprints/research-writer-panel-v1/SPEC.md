# S22-WP: Research Writer Panel Cleanup

**Codename:** `research-writer-panel-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S21-RL research-template-wiring-v1)
**Date:** 2026-01-23

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 - Setup & Verification |
| **Status** | In Progress |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-23T21:45Z |
| **Next Action** | Create Nursery table migration |

---

## Attention Anchor

**We are building:** Clean research-to-writer pipeline that shows user ALL their research, then lets them choose Writer style

**Success looks like:**
1. Center panel displays FULL research (8K+ chars) via json-render (NOT markdown)
2. Right panel lets user select Writer template from existing 4 templates
3. Generate creates styled document via existing document-generator service
4. Save persists both raw research + generated doc to Nursery

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
├── /explore route ✅
├── /bedrock route ✅
├── src/explore/* ✅
├── src/bedrock/* ✅
├── src/surface/components/modals/SproutFinishingRoom/* ✅
└── src/core/schema/* ✅
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Writer style selection | ✅ Template systemPrompt | ✅ Model-agnostic | ✅ templateUsed tracked | ✅ New templates via DB |
| Evidence display | ✅ json-render catalog | ✅ No model logic | ✅ Source citations | ✅ Registry pattern |
| Nursery save | ✅ Schema-driven | ✅ No model deps | ✅ Full audit trail | ✅ Standard table |

---

## Existing Services (REUSE - DO NOT RECREATE)

| Service | Location | Purpose |
|---------|----------|---------|
| `document-generator.ts` | `src/explore/services/` | Entry point: `generateDocument({ writerTemplateId })` |
| `template-loader.ts` | `src/explore/services/` | `loadTemplateById()`, `loadDefaultTemplate()` |
| `writer-agent.ts` | `src/explore/services/` | Singleton - accepts `systemPromptOverride` |
| `useOutputTemplateData.ts` | `src/bedrock/consoles/ExperienceConsole/` | React hook for template selection |
| `ResearchCatalog` | `src/surface/.../json-render/catalog.ts` | Zod schemas for Writer output |
| `ResearchRegistry` | `src/surface/.../json-render/registry.tsx` | Components for Writer output |

**Key Insight:** Writer agent is a SINGLETON. Multiple styles via template selection, NOT multiple agents.

---

## Execution Architecture

### Phase 1: Setup & Database (30 min)
- 1a: Create Nursery table migration
- 1b: Verify existing services work
- **Gate:** Migration applied, services callable

### Phase 2: Evidence Display (1 hr)
- 2a: Create evidence-catalog.ts (Zod schemas for raw research)
- 2b: Create evidence-registry.tsx (React components)
- 2c: Create evidence-transform.ts (evidenceBundleToRenderTree)
- 2d: Update DocumentViewer.tsx to use evidence display
- **Gate:** Raw research displays via json-render in center panel

### Phase 3: Right Panel Writer Workflow (1 hr)
- 3a: Create WriterPanel.tsx (container)
- 3b: Create WriterTemplateGrid.tsx (uses useOutputTemplateData)
- 3c: Wire Generate to document-generator.ts
- 3d: Show preview via ResearchRegistry
- **Gate:** User can select template, generate document, see preview

### Phase 4: Nursery Save (30 min)
- 4a: Add /api/nursery/save endpoint to server.js
- 4b: Wire Save button to endpoint
- 4c: Update sprout status on save
- **Gate:** Documents persist to Nursery table

### Phase 5: Pipeline Cleanup (30 min)
- 5a: Remove automatic Writer chaining from research-pipeline.ts
- 5b: Remove pass-through hack from writer-agent.ts
- 5c: Fix ReviseForm.tsx import error
- **Gate:** Clean pipeline, no hacks

### Phase 6: E2E Test & Visual Verification
- 6a: Create E2E test with console monitoring
- 6b: Capture all screenshots
- 6c: Complete REVIEW.html
- **Gate:** Zero critical errors, all screenshots embedded

---

## Success Criteria

### Sprint Complete When:
- [ ] Nursery table exists in Supabase
- [ ] Raw research displays via json-render (NOT markdown)
- [ ] User can select Writer template (4 seeded templates)
- [ ] Generate calls document-generator.ts correctly
- [ ] Preview shows styled document via ResearchRegistry
- [ ] Save persists to Nursery
- [ ] Pass-through hack removed
- [ ] Automatic Writer chaining removed
- [ ] ReviseForm import error fixed
- [ ] E2E test with console monitoring passes
- [ ] Zero critical console errors
- [ ] REVIEW.html complete
- [ ] All screenshots captured

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase without screenshot evidence
- DEX compliance test fails
- New Writer templates created (use existing 4)
- New services created that duplicate existing ones
- E2E test missing or has critical errors

---

*This contract is binding. Deviation requires explicit human approval.*
