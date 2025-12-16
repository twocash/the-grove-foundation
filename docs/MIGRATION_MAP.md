# Migration Map

> Old to New File Paths, Shims, and Breaking Changes
> Version 1.0 | 2025-12-16

---

## 1. Migration Overview

This document maps every file move from the current structure to the target architecture. Each entry includes:
- **Source**: Current file location
- **Destination**: Target file location
- **Shim**: Temporary re-export at old location (if needed)
- **Breaking**: Whether the move requires import updates

### Migration Phases

| Phase | Sprint | Focus |
|-------|--------|-------|
| 1 | Sprint 1 | Routing + Tailwind (no file moves) |
| 2 | Sprint 2 | Core extraction |
| 3 | Sprint 3 | Surface/Foundation organization |
| 4 | Sprint 4 | Shim removal + cleanup |

---

## 2. Type Definition Migrations

### 2.1 Core Types → `src/core/schema/`

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `types.ts:1-10` (SectionId) | `src/core/schema/sections.ts` | Yes | Enum, heavily imported |
| `types.ts:12-23` (ChatMessage, TerminalState) | `src/core/schema/session.ts` | Yes | Used in Terminal |
| `types.ts:25-49` (NarrativeNode, NarrativeGraph) | `src/core/schema/narrative.ts` | Yes | Legacy v1 types |
| `types/engagement.ts` (all) | `src/core/schema/engagement.ts` | Yes | Event bus types |
| `types/lens.ts` (all) | `src/core/schema/lens.ts` | Yes | Custom lens types |
| `data/narratives-schema.ts:1-250` (types) | `src/core/schema/narrative.ts` | Yes | v2 schema types |
| `data/narratives-schema.ts:330-360` (defaults) | `src/core/config/defaults.ts` | Yes | DEFAULT_* values |
| `data/narratives-schema.ts:369-453` (colors) | `src/core/config/colors.ts` | Yes | PERSONA_COLORS |

### 2.2 Shim Example

After moving `types.ts` content to `src/core/schema/`:

```typescript
// types.ts (SHIM - to be removed in Phase 4)
// @deprecated Use imports from '@core/schema' instead
export * from '@/src/core/schema/sections';
export * from '@/src/core/schema/session';
export * from '@/src/core/schema/narrative';

console.warn(
  'Importing from types.ts is deprecated. ' +
  'Please update to @core/schema/*'
);
```

---

## 3. Engine/Logic Migrations

### 3.1 Core Engines → `src/core/engine/`

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `hooks/useEngagementBus.ts:48-373` | `src/core/engine/engagementBus.ts` | No | Extract class only |
| `utils/engagementTriggers.ts:1-116` | `src/core/engine/triggerEvaluator.ts` | Yes | Pure evaluation logic |
| `utils/engagementTriggers.ts:18-116` | `src/core/config/triggers.ts` | Yes | DEFAULT_TRIGGERS |
| `utils/threadGenerator.ts` | `src/core/engine/threadGenerator.ts` | Yes | Thread logic |
| `utils/topicRouter.ts` | `src/core/engine/topicRouter.ts` | Yes | Query routing |

### 3.2 Engine Extraction Detail

The `useEngagementBus.ts` file currently contains both:
1. **Pure TypeScript singleton** (lines 48-373): `EngagementBusSingleton` class
2. **React hooks** (lines 385-493): `useEngagementBus`, `useEngagementState`, etc.

**Migration Plan**:
1. Extract `EngagementBusSingleton` to `src/core/engine/engagementBus.ts`
2. Keep React hooks in `src/hooks/useEngagementBus.ts`
3. Update hooks to import from `@core/engine/engagementBus`

```typescript
// src/core/engine/engagementBus.ts (EXTRACTED)
// Pure TypeScript - no React dependencies
export class EngagementBusSingleton { ... }
export function getBus(): EngagementBusSingleton { ... }
```

```typescript
// src/hooks/useEngagementBus.ts (UPDATED)
import { getBus, EngagementBusSingleton } from '@core/engine/engagementBus';

export function useEngagementBus(): EngagementBusAPI { ... }
```

---

## 4. React Hook Migrations

### 4.1 Hooks → `src/hooks/`

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `hooks/useEngagementBus.ts` | `src/hooks/useEngagementBus.ts` | Yes | Keep React parts |
| `hooks/useEngagementBridge.ts` | `src/hooks/useEngagementBridge.ts` | Yes | Backward compat |
| `hooks/useNarrativeEngine.ts` | `src/hooks/useNarrativeEngine.ts` | Yes | No changes |
| `hooks/useNarrative.ts` | `src/hooks/useNarrative.ts` | Yes | Legacy hook |
| `hooks/useCustomLens.ts` | `src/hooks/useCustomLens.ts` | Yes | No changes |
| `hooks/useFeatureFlags.ts` | `src/hooks/useFeatureFlags.ts` | Yes | No changes |
| `hooks/useStreakTracking.ts` | `src/hooks/useStreakTracking.ts` | Yes | No changes |
| `hooks/useRevealState.ts` | DELETE | No | Deprecated |

### 4.2 Shim Location

```
hooks/                      # OLD location (shims during migration)
src/hooks/                  # NEW location (actual files)
```

---

## 5. Component Migrations

### 5.1 Surface Components → `src/surface/`

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `components/Terminal.tsx` | `src/surface/components/Terminal/index.tsx` | Yes | Main Terminal |
| `components/Terminal/` (folder) | `src/surface/components/Terminal/` | Yes | All subcomponents |
| `components/DiaryEntry.tsx` | `src/surface/components/DiaryEntry.tsx` | Yes | Journal |
| `components/PromptHooks.tsx` | `src/surface/components/PromptHooks.tsx` | Yes | Prompt triggers |
| `components/AudioPlayer.tsx` | `src/surface/components/AudioPlayer.tsx` | Yes | Audio playback |
| `components/WhatIsGroveCarousel.tsx` | `src/surface/components/sections/WhatIsGroveCarousel.tsx` | Yes | Section |
| `components/ArchitectureDiagram.tsx` | `src/surface/components/sections/ArchitectureDiagram.tsx` | Yes | Section |
| `components/EconomicsSlider.tsx` | `src/surface/components/sections/EconomicsSlider.tsx` | Yes | Section |
| `components/NetworkMap.tsx` | `src/surface/components/sections/NetworkMap.tsx` | Yes | Section |
| `components/ThesisGraph.tsx` | `src/surface/components/sections/ThesisGraph.tsx` | Yes | Section |

### 5.2 Foundation Components → `src/foundation/`

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `components/Admin/NarrativeConsole.tsx` | `src/foundation/consoles/NarrativeArchitect.tsx` | Yes | Renamed |
| `components/Admin/CardEditor.tsx` | `src/foundation/consoles/CardEditor.tsx` | Yes | Subcomponent |
| `components/Admin/PersonaSettings.tsx` | `src/foundation/consoles/PersonaSettings.tsx` | Yes | Subcomponent |
| `components/Admin/GlobalSettingsModal.tsx` | `src/foundation/consoles/GlobalSettingsModal.tsx` | Yes | Subcomponent |
| `components/Admin/EngagementConsole.tsx` | `src/foundation/consoles/EngagementBridge.tsx` | Yes | Renamed |
| `components/Admin/FeatureFlagPanel.tsx` | `src/foundation/consoles/RealityTuner.tsx` | Merge | Combined |
| `components/Admin/TopicHubPanel.tsx` | `src/foundation/consoles/RealityTuner.tsx` | Merge | Combined |
| `components/AdminRAGConsole.tsx` | `src/foundation/consoles/KnowledgeVault.tsx` | Yes | Renamed |
| `components/AdminAudioConsole.tsx` | `src/foundation/consoles/AudioStudio.tsx` | Yes | Renamed |
| `components/AdminNarrativeConsole.tsx` | DELETE | No | Legacy v1, unused |
| `components/NarrativeGraphView.tsx` | `src/foundation/consoles/NarrativeGraphView.tsx` | Yes | Graph viz |
| `components/NarrativeNodeCard.tsx` | `src/foundation/consoles/NarrativeNodeCard.tsx` | Yes | Node editor |

### 5.3 New Foundation Components (Create)

| Component | Purpose |
|-----------|---------|
| `src/foundation/layout/FoundationLayout.tsx` | Main layout wrapper |
| `src/foundation/layout/HUDHeader.tsx` | Status header |
| `src/foundation/layout/NavSidebar.tsx` | Icon navigation |
| `src/foundation/layout/GridViewport.tsx` | Content area with grid |
| `src/foundation/components/DataGrid.tsx` | Dense table |
| `src/foundation/components/MetricCard.tsx` | Stats display |
| `src/foundation/components/EventLog.tsx` | Event feed |
| `src/foundation/components/GlowButton.tsx` | Styled button |

---

## 6. Service Migrations

### 6.1 Services → `src/services/`

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `services/chatService.ts` | `src/services/chatService.ts` | Yes | No changes |
| `services/audioService.ts` | `src/services/audioService.ts` | Yes | No changes |
| `services/geminiService.ts` | `src/services/geminiService.ts` | Yes | Legacy, keep |

### 6.2 New Services (Create)

| Service | Purpose |
|---------|---------|
| `src/services/narrativeService.ts` | `/api/narrative` client |
| `src/services/storageService.ts` | GCS operations |

---

## 7. Data/Config Migrations

### 7.1 Data Files → `src/core/config/`

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `data/default-personas.ts` | `src/core/config/personas.ts` | Yes | Default personas |
| `data/audioConfig.ts` | `src/core/config/audio.ts` | Yes | Audio settings |
| `data/prompts.js` | `src/core/config/prompts.ts` | Yes | Convert to TS |
| `constants.ts` | `src/core/config/constants.ts` | Yes | Section config |

### 7.2 Static Data (No Move)

| File | Action | Notes |
|------|--------|-------|
| `data/narratives.json` | Keep | Runtime data, not code |
| `data/narratives-schema.ts` | Split | Types to schema, defaults to config |

---

## 8. Root File Migrations

### 8.1 Entry Points

| Source | Destination | Shim Required | Notes |
|--------|-------------|---------------|-------|
| `App.tsx` | `src/App.tsx` | No | Rewrite for router |
| `index.tsx` | `src/index.tsx` | No | Move into src |
| `index.html` | `index.html` | No | Update for Tailwind |

### 8.2 Configuration Files (No Move)

| File | Action | Notes |
|------|--------|-------|
| `vite.config.ts` | Update | Add path aliases |
| `tsconfig.json` | Update | Add path aliases |
| `package.json` | Update | Add dependencies |
| `server.js` | Keep | No changes |

---

## 9. Breaking Changes Log

### 9.1 Import Path Changes

| Old Import | New Import | Impact |
|------------|------------|--------|
| `from './types'` | `from '@core/schema'` | All files |
| `from './types/engagement'` | `from '@core/schema/engagement'` | 15+ files |
| `from './types/lens'` | `from '@core/schema/lens'` | 10+ files |
| `from './hooks/useEngagementBus'` | `from '@hooks/useEngagementBus'` | 8+ files |
| `from './components/Admin'` | `from '@foundation/consoles'` | App.tsx |
| `from './components/Terminal'` | `from '@surface/components/Terminal'` | App.tsx |

### 9.2 Component Renames

| Old Name | New Name | Notes |
|----------|----------|-------|
| `AdminNarrativeConsole` | `NarrativeArchitect` | Foundation rename |
| `EngagementConsole` | `EngagementBridge` | Foundation rename |
| `AdminRAGConsole` | `KnowledgeVault` | Foundation rename |
| `AdminAudioConsole` | `AudioStudio` | Foundation rename |
| `FeatureFlagPanel + TopicHubPanel` | `RealityTuner` | Merged |

### 9.3 Route Changes

| Old Access | New Access | Notes |
|------------|------------|-------|
| `?admin=true` | `/foundation` | Redirect provided |
| Manual scroll | `/` | Unchanged |
| No deep links | `/#section-id` | New feature |

---

## 10. Shim Template

### 10.1 Standard Re-export Shim

```typescript
// [OLD_PATH].ts
// @deprecated This file is a shim. Import from '[NEW_PATH]' instead.
// This shim will be removed in Sprint 4.

export * from '[NEW_PATH]';

if (process.env.NODE_ENV === 'development') {
  console.warn(
    `[DEPRECATION] Importing from '${__filename}' is deprecated. ` +
    `Update imports to '[NEW_PATH]'.`
  );
}
```

### 10.2 Component Shim

```typescript
// components/Admin/NarrativeConsole.tsx (SHIM)
// @deprecated Use '@foundation/consoles/NarrativeArchitect' instead.

import NarrativeArchitect from '@foundation/consoles/NarrativeArchitect';

// Re-export with old name for backward compatibility
export const NarrativeConsole = NarrativeArchitect;
export default NarrativeArchitect;

if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] NarrativeConsole is renamed to NarrativeArchitect. ' +
    'Update imports to @foundation/consoles/NarrativeArchitect.'
  );
}
```

---

## 11. Migration Execution Order

### Sprint 2: Core Extraction

1. Create `src/core/` directory structure
2. Move type definitions (with shims at old locations)
3. Extract engine logic (keep React in hooks)
4. Move config/defaults
5. Update path aliases in vite/tsconfig
6. Run typecheck: `npx tsc --noEmit`

### Sprint 3: Surface/Foundation Organization

1. Create `src/surface/` structure
2. Move Surface components (with shims)
3. Create `src/foundation/` structure
4. Move Foundation consoles (with shims + renames)
5. Create new Foundation layout components
6. Create router configuration
7. Update App.tsx for routing
8. Run build: `npm run build`

### Sprint 4: Cleanup

1. Update all imports to new paths
2. Remove deprecation warnings
3. Delete shim files
4. Delete empty old directories
5. Final typecheck and build
6. Update documentation

---

## 12. Files to Delete (Sprint 4)

After migration is complete and all imports updated:

| File | Reason |
|------|--------|
| `types.ts` (root) | Shim only |
| `src/types.ts` | Duplicate |
| `types/engagement.ts` | Moved to core |
| `types/lens.ts` | Moved to core |
| `hooks/useRevealState.ts` | Deprecated |
| `components/Admin/index.ts` | Shim only |
| `components/AdminNarrativeConsole.tsx` | Legacy v1 |
| Old location shims | All temporary |

---

*Migration Map Complete. See FOUNDATION_UI.md for layout specifications.*
