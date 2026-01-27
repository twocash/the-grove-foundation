# Compaction Plan - S25-SFR UX Redesign v1

> Written: 2026-01-26 | Branch: `feat/sfr-ux-redesign-v1`
> Last commit: `9115330 feat(S25-SFR): EvidenceRegistry full GroveSkins migration`

---

## Completed This Session

### 1. EvidenceRegistry Full GroveSkins Migration
- **File:** `src/surface/components/modals/SproutFinishingRoom/json-render/evidence-registry.tsx`
- **Commit:** `9115330` (pushed to origin)
- Migrated all 8 components from hardcoded hex colors to GroveSkins CSS variables
- Added full `markdownComponents` ReactMarkdown override set (same pattern as `registry.tsx`)
- SynthesisBlock: upgraded from partial cite-only handler to full markdownComponents
- SourceCard: snippet rendering upgraded from Tailwind `prose` classes to markdownComponents
- `getSourceTypeBadge()` refactored to return `React.CSSProperties` with `color-mix()`
- All font-family bindings explicit: `--font-display`, `--font-heading`, `--font-body`, `--font-mono`

### 2. Writer Agent Configurability Investigation
- **Finding:** 100% declaratively configurable via Output Templates
- Templates stored in Supabase `output_templates` table
- Seed data: `data/seeds/output-templates.json` (8 templates)
- Schema: `src/core/schema/output-template.ts` + `writer-agent-config.ts`
- Voice config (formality/perspective/citationStyle) flows through template systemPrompt

### 3. Notion HOW TO Created
- **URL:** https://www.notion.so/2f5780a78eef81c4a375f9ab2835a502
- Under: Grove Architecture Documentation Index
- Documents: template schema, voice config options, how to add/modify templates, key source files

### 4. Previous Session (already committed)
- `09d2353` - Research pipeline hardening + GroveSkins typography binding (registry.tsx)
- `7edfbae` - Research pipeline hardening (server.js recoverArray, error transparency)
- `db33fba` - Garden Content Viewer via portable DocumentCatalog

---

## Remaining Work

### HIGH PRIORITY: Visual Verification
- [ ] Start dev server (`npm run dev`)
- [ ] Navigate to Sprout Finishing Room
- [ ] Generate a research document
- [ ] Verify all 3 tabs (Summary, Full Report, Sources) render with GroveSkins styling
- [ ] Check: fonts match design system, colors use CSS variables, no hardcoded hex visible
- [ ] Check: ReactMarkdown renders headers, lists, tables, blockquotes, citations correctly
- [ ] Screenshot evidence for sprint review

### MEDIUM PRIORITY: LLM Prompt Tuning for Structured Markdown
- User recommended: "You may need to adjust the prompt to get better structured markdown back from the LLM"
- The writer systemPrompt should explicitly request structured markdown:
  - H2/H3 section headers
  - Bullet lists for key findings
  - `<cite index="N">` tags for source references
  - Bold key terms
  - Tables where appropriate
- Templates to tune: `data/seeds/output-templates.json` (especially `blog-post` default)
- Writer base prompt: `src/explore/prompts/writer-system-prompt.ts`

### LOW PRIORITY: Pre-existing TypeScript Errors
- `SproutEditor.tsx:257` — evidenceBundle missing `executionTime`, `apiCallsUsed` properties
- `document-generator.ts:188-189` — export declaration conflicts
- These are NOT from our changes, but should be cleaned up

---

## Key Architecture Context

### Two Registries (Both Now GroveSkins-Compliant)
| Registry | File | Used By |
|----------|------|---------|
| ResearchRegistry | `registry.tsx` | AnalysisBlock (generated docs) |
| EvidenceRegistry | `evidence-registry.tsx` | ALL 3 SFR tabs (Summary/Full Report/Sources) |

### DocumentViewer Tab System
All 3 tabs in `DocumentViewer.tsx` render through EvidenceRegistry:
```typescript
const tabTreeMap = { summary: summaryTree, report: fullReportTree, sources: sourcesTree };
const activeTree = tabTreeMap[activeTab];
if (activeTree) return <Renderer tree={activeTree} registry={EvidenceRegistry} />;
```

### Transform Functions
- `sproutSynthesisToRenderTree()` — Summary tab
- `sproutFullReportToRenderTree()` — Full Report tab
- `sproutSourcesToRenderTree()` — Sources tab

### GroveSkins Color Variables
```
--glass-text-primary    (bright text)
--glass-text-body       (body text)
--glass-text-muted      (dimmed text)
--glass-text-secondary  (secondary text)
--neon-cyan             (accent/links)
--glass-elevated        (elevated background)
--glass-border          (borders)
--semantic-success/warning/error  (status colors)
```

### GroveSkins Font Variables
```
--font-display   (Playfair Display - H1, H2)
--font-heading   (Inter - H3, H4)
--font-body      (Inter - body, lists, em, strong)
--font-mono      (Fira Code - code, citations, metadata)
--font-ui        (Inter - controls)
```

---

## Git State
- **Branch:** `feat/sfr-ux-redesign-v1`
- **Origin:** up to date
- **Working tree:** clean
- **No uncommitted changes**
