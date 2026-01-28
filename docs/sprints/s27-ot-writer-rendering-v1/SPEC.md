# S27-OT: Configurable Writer Rendering Instructions

**Codename:** `s27-ot-writer-rendering-v1`
**Status:** Execution Contract for Claude Code CLI
**Baseline:** `main` (branch: main)
**Date:** 2026-01-27
**Notion Spec:** [S27-OT Notion Page](https://www.notion.so/2f5780a78eef81d3a25fff194309584f)
**User Stories:** [User Stories Subpage](https://www.notion.so/2f6780a78eef8114849df9ebd491e3dc)

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Ready for Execution |
| **Status** | Awaiting Developer |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-27 |
| **Next Action** | Execute via Grove Execution Protocol |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Configurable rendering instructions for Writer and Research templates — replacing hardcoded strings in server.js with per-template `renderingInstructions` field
- **Success looks like:** Admins can customize how documents are formatted per template; provenance tracks which rendering source shaped each artifact; server.js has zero hardcoded rendering strings
- **We are NOT:** Changing template systemPrompts, modifying research pipelines, adding new agent types, or building a rendering preview UI
- **Current phase:** Ready for Execution
- **Next action:** Execute epics sequentially with build gates

---

## Purpose

Replace hardcoded rendering instruction strings in `server.js` with a per-template `renderingInstructions` field on `output_templates`. This completes the two-layer prompt architecture:

- **Layer 1:** `systemPrompt` — Controls what the agent writes about (approach, style, structure)
- **Layer 2:** `renderingInstructions` — Controls how the output is formatted (markdown rules, cite tags, JSON structure)

Currently Layer 2 is hardcoded in two places in server.js. After this sprint, both layers are configurable per template.

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy GroveWorkspace)

ACTIVE BUILD ZONE — WHERE WE WORK
├── src/core/schema/output-template.ts     ← Schema change
├── src/core/schema/sprout.ts              ← renderingSource field
├── src/core/config/rendering-defaults.ts  ← NEW: Named constants
├── server.js                              ← Refactor rendering blocks
├── data/seeds/output-templates.json       ← Seed data enrichment
├── src/explore/services/writer-agent.ts   ← Pass renderingSource
├── src/explore/services/document-generator.ts ← Pass renderingSource
├── src/surface/components/modals/SproutFinishingRoom/SproutFinishingRoom.tsx ← Store renderingSource
├── src/surface/components/modals/SproutFinishingRoom/garden-bridge.ts ← Provenance
├── src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx ← Admin UI
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative Sovereignty | Capability Agnosticism | Provenance | Organic Scalability |
|---------|------------------------|------------------------|------------|---------------------|
| renderingInstructions field | Config not code — admins edit per template | Works regardless of LLM model | Tracked via renderingSource | New agent types add their own defaults |
| Named constants | Single source of truth, fallback chain | Model-independent formatting | Constants referenced by name | Add new defaults without touching server |
| renderingSource provenance | N/A | N/A | Complete audit: template → default-writer → default-research | Enum extensible for new sources |
| Admin UI section | Visual editor, no code needed | N/A | Shows which source drives formatting | Collapses by default, discoverable |

### Server/TypeScript Boundary

**CRITICAL:** `server.js` is ESM JavaScript. It CANNOT import from `src/core/`. Named constants MUST exist in BOTH locations:

1. `src/core/config/rendering-defaults.ts` — For TypeScript consumers
2. `server.js` (inline or top-level const) — For server-side use

Cross-reference comments in both files ensure they stay in sync.

### Route for Testing

```
✅ localhost:3000/bedrock          ← Admin UI (OutputTemplateEditor)
✅ localhost:3000/explore          ← SFR modal (artifact generation)
❌ localhost:3000/                 ← LEGACY TERMINAL
❌ localhost:3000/terminal         ← LEGACY TERMINAL
```

---

## Acceptance Criteria

### AC1: Schema Extension
`renderingInstructions` is an optional string field on `OutputTemplatePayload` (Zod schema). Existing templates without the field continue to work.

### AC2: Named Constants
`DEFAULT_WRITER_RENDERING_RULES` and `DEFAULT_RESEARCH_RENDERING_RULES` are exported from `src/core/config/rendering-defaults.ts` and duplicated in `server.js` with sync comments.

### AC3: Server Deep Research Hydration
`/api/research/deep` in server.js resolves rendering instructions via: `template.renderingInstructions?.trim() || DEFAULT_RESEARCH_RENDERING_RULES`. No hardcoded anonymous strings remain.

### AC4: Server Writer Hydration
`/api/research/write` in server.js resolves rendering instructions via: `template.renderingInstructions?.trim() || DEFAULT_WRITER_RENDERING_RULES`. No hardcoded anonymous strings remain.

### AC5: Seed Templates Enriched
All 8 seed templates in `data/seeds/output-templates.json` have type-appropriate `renderingInstructions` in their payload. Writer templates get writer rules, research templates get research rules.

### AC6: renderingSource Provenance
`GeneratedArtifact` has a `renderingSource?: 'template' | 'default-writer' | 'default-research'` field. The value flows from server.js response → writer-agent → document-generator → SproutFinishingRoom → garden-bridge.

### AC7: Admin UI Section
`OutputTemplateEditor` has a "Rendering Instructions" section between System Prompt and Citation Settings. Uses `BufferedTextarea`, `font-mono`, 8 rows, `defaultCollapsed={true}`, disabled for system seeds.

### AC8: Fork Inheritance
`forkOutputTemplate()` automatically copies `renderingInstructions` to forked templates (verified by spread operator `...original`).

---

## File Change Matrix

| # | File | Change Type | Epic |
|---|------|-------------|------|
| 1 | `src/core/schema/output-template.ts` | Add `renderingInstructions` to Zod schema | E1 |
| 2 | `src/core/config/rendering-defaults.ts` | NEW: Export named constants | E1 |
| 3 | `server.js` | Refactor 2 endpoints: template lookup + fallback | E2 |
| 4 | `data/seeds/output-templates.json` | Add `renderingInstructions` to all 8 templates | E3 |
| 5 | `src/explore/services/writer-agent.ts` | Capture `renderingSource` from API response | E4 |
| 6 | `src/explore/services/document-generator.ts` | Pass `renderingSource` through result | E4 |
| 7 | `src/surface/components/modals/SproutFinishingRoom/SproutFinishingRoom.tsx` | Store `renderingSource` on artifact | E4 |
| 8 | `src/surface/components/modals/SproutFinishingRoom/garden-bridge.ts` | Add `renderingSource` to provenance | E4 |
| 9 | `src/core/schema/sprout.ts` | Add `renderingSource` to `GeneratedArtifact` | E4 |
| 10 | `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx` | Add Rendering Instructions section | E5 |

---

## Edge Cases

1. **Whitespace-only renderingInstructions:** Use `.trim()` before fallback check — whitespace-only treated same as missing
2. **No migration needed:** `renderingInstructions` is optional on existing Zod schema + JSONB payload. Supabase rows without it parse fine
3. **Fork inherits rendering:** `forkOutputTemplate()` uses `...original` spread — new field copies automatically
4. **System seeds read-only:** Admin UI disables textarea for `source === 'system-seed'` (fork to customize)
5. **Server can't import TS:** Named constants must be duplicated in server.js with cross-reference comments
