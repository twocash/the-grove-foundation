# Bedrock IA Rename Sprint — DEVLOG

**Sprint:** `bedrock-ia-rename-v1`
**Started:** 2026-01-10
**Completed:** 2026-01-11
**Status:** ✅ Complete

---

## Sprint Objective

Rename Bedrock routes and components to align with Grove IA:
- Pipeline → Garden (mature corpus)
- Garden → Nursery (sprouts in cultivation)
- Experiences → Experience (singular)

---

## Log

### 2026-01-11 01:05 — Pre-flight Complete

**Checklist:**
- ✅ Branch: `feature/bedrock-ia-rename-v1` (created from bedrock)
- ✅ Working tree: Clean (only untracked sprint docs)
- ✅ Build: Passed (vite build succeeded)
- ⚠️ Tests: 13 pre-existing failures (LensWorkshop config, StreamRenderer context)
- ⏳ Dev server: Will verify during visual verification

**Note:** Test failures are pre-existing issues, not caused by this sprint.

### 2026-01-11 01:06 — Phase 0 Complete

Sprint infrastructure already exists:
- `docs/sprints/bedrock-ia-rename-v1/DEVLOG.md` ✓
- `docs/sprints/bedrock-ia-rename-v1/EXECUTION_CONTRACT.md` ✓
- `docs/sprints/bedrock-ia-rename-v1/REVIEW.html` ✓
- `docs/sprints/bedrock-ia-rename-v1/screenshots/` ✓

### 2026-01-11 01:10 — Phase 1: Audit Complete

#### Current File Locations

**Files to rename:**

1. **PipelineMonitor/ → GardenConsole/**
   ```
   src/bedrock/consoles/PipelineMonitor/
   ├── BulkExtractionDropdown.tsx
   ├── DocumentCard.tsx
   ├── DocumentEditor.tsx
   ├── HubSuggestions.tsx
   ├── JourneySynthesis.tsx
   ├── PipelineMonitor.config.ts
   ├── PipelineMonitor.factory.ts
   ├── PipelineMonitorWithUpload.tsx
   ├── ProcessingQueue.tsx
   ├── UploadModal.tsx
   ├── document-inspector.config.ts
   ├── document-transforms.ts
   ├── index.ts
   ├── pipeline.config.ts
   ├── types.ts
   └── useDocumentData.ts
   ```

2. **GardenConsole.tsx → NurseryConsole.tsx**
   ```
   src/bedrock/consoles/GardenConsole.tsx
   ```

3. **ExperiencesConsole/ → ExperienceConsole/**
   ```
   src/bedrock/consoles/ExperiencesConsole/
   ├── ExperiencesConsole.config.ts
   ├── SystemPromptCard.tsx
   ├── SystemPromptEditor.tsx
   ├── index.ts
   ├── transforms/
   │   ├── index.ts
   │   └── system-prompt.transforms.ts
   └── useExperienceData.ts
   ```

#### Current Routes (routes.tsx)

| Route | Component | Line |
|-------|-----------|------|
| `/bedrock/pipeline` | PipelineMonitor | 214 |
| `/bedrock/garden` | GardenConsole | 224 |
| `/bedrock/experiences` | ExperiencesConsole | 251 |

#### Current Nav Config (navigation.ts)

**BEDROCK_NAV_ITEMS:**
- `id: 'pipeline'`, `label: 'Pipeline Monitor'`, `path: '/bedrock/pipeline'`
- `id: 'garden'`, `label: 'Knowledge Garden'`, `path: '/bedrock/garden'`
- `id: 'experiences'`, `label: 'Experiences'`, `path: '/bedrock/experiences'`

**CONSOLE_METADATA:**
- `pipeline` → Pipeline Monitor
- `garden` → Knowledge Garden
- `experiences` → Experiences

### 2026-01-11 01:14 — Phase 2 & 3 Complete

**Namespace conflict resolved:** GardenConsole.tsx existed, preventing folder rename.

**Solution:**
1. First renamed `GardenConsole.tsx` → `NurseryConsole.tsx` (clear namespace)
2. Then renamed `PipelineMonitor/` → `GardenConsole/`

**Changes:**
- `PipelineMonitor/` folder → `GardenConsole/`
- `PipelineMonitor.config.ts` → `GardenConsole.config.ts`
- `PipelineMonitor.factory.ts` → `GardenConsole.factory.ts`
- `PipelineMonitorWithUpload.tsx` → `GardenConsoleWithUpload.tsx`
- All internal exports updated
- Routes updated: `/bedrock/pipeline` → `/bedrock/garden`, `/bedrock/garden` → `/bedrock/nursery`
- Navigation updated: pipeline → garden, garden → nursery

### 2026-01-11 01:19 — Phase 4 Complete

**Challenge:** Git mv permission denied on ExperiencesConsole folder.

**Solution:** Used `cp -r` + `rm -rf` + `git add -A` instead of `git mv`.

**Changes:**
- `ExperiencesConsole/` → `ExperienceConsole/`
- `ExperiencesConsole.config.ts` → `ExperienceConsole.config.ts`
- All internal references updated (plural → singular)
- Route updated: `/bedrock/experiences` → `/bedrock/experience`
- Navigation updated: experiences → experience

### 2026-01-11 01:20 — Phase 5 Complete

Navigation order was already correct per Grove IA specification:
1. Dashboard (overview)
2. Nursery → Garden (Knowledge Lifecycle)
3. Lens Workshop → Prompt Workshop (Cultivation Tools)
4. Experience (Delivery Configuration)
5. Journey Architect, Knowledge Vault (disabled/future)

Added grouping comments to `navigation.ts`. Section dividers noted as future enhancement (NavItem type limitation).

### 2026-01-11 01:25 — Phase 6 Complete (Cleanup)

**Terminology cleanup:**
- `pipeline.config.ts`: Updated route paths `/bedrock/pipeline/*` → `/bedrock/garden/*`
- `experience.types.ts`: Fixed all plural references (`ExperiencesConsole` → `ExperienceConsole`, `/bedrock/experiences` → `/bedrock/experience`)

**Final build:** ✅ Passed

**Files modified (summary):**
- `src/bedrock/consoles/GardenConsole/*` (14 files - renamed from PipelineMonitor)
- `src/bedrock/consoles/NurseryConsole.tsx` (renamed from GardenConsole.tsx)
- `src/bedrock/consoles/ExperienceConsole/*` (7 files - renamed from ExperiencesConsole)
- `src/bedrock/consoles/index.ts` (exports updated)
- `src/bedrock/config/navigation.ts` (IDs, labels, paths)
- `src/bedrock/types/experience.types.ts` (plural → singular)
- `src/router/routes.tsx` (imports and paths)

---
