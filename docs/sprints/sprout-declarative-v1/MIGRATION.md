# Migration Map: sprout-declarative-v1

**Sprint:** sprout-declarative-v1  
**Date:** December 30, 2024  

---

## Overview

This document maps the migration from current state to target state, file by file.

---

## File Migration Matrix

### New Files (Create)

| File | Purpose | Epic |
|------|---------|------|
| `data/selection-actions.json` | Action definitions | 1 |
| `data/selection-actions.schema.json` | JSON schema | 1 |
| `data/sprout-stages.json` | Stage lifecycle | 1 |
| `data/sprout-stages.schema.json` | JSON schema | 1 |
| `data/research-purposes.json` | Purpose types | 1 |
| `data/research-purposes.schema.json` | JSON schema | 1 |
| `data/research-prompt-template.md` | Prompt template | 4 |
| `src/surface/components/KineticStream/Capture/hooks/useSelectionActions.ts` | Action engine | 2 |
| `src/surface/components/KineticStream/Capture/components/ActionMenu.tsx` | Multi-action UI | 2 |
| `src/surface/components/KineticStream/Capture/components/ResearchManifestCard.tsx` | Research capture | 3 |
| `src/surface/components/KineticStream/Capture/components/PromptPreviewModal.tsx` | Prompt display | 4 |
| `src/lib/prompt-generator.ts` | Template engine | 4 |
| `tests/e2e/sprout-research.spec.ts` | E2E tests | 5 |

### Modified Files

| File | Changes | Epic |
|------|---------|------|
| `src/core/schema/sprout.ts` | Add SproutStage, ResearchManifest types | 1 |
| `src/surface/components/KineticStream/Capture/components/MagneticPill.tsx` | Fix scale bug, add action menu trigger | 1, 2 |
| `src/surface/components/KineticStream/Capture/config/sprout-capture.config.ts` | Reference JSON configs | 1 |
| `src/surface/components/KineticStream/Capture/components/SproutCard.tsx` | Stage badges, research indicator | 3 |
| `src/surface/components/KineticStream/Capture/components/SproutTray.tsx` | Stage filtering, counts | 3 |
| `src/lib/storage/sprout-storage.ts` | Migration to v3 (stage field) | 1 |
| `src/app/globals.css` | Stage color tokens | 3 |

### Unchanged Files

| File | Reason |
|------|--------|
| `hooks/useTextSelection.ts` | Selection logic unchanged |
| `hooks/useCaptureState.ts` | State machine unchanged |
| `hooks/useKineticShortcuts.ts` | Shortcuts unchanged |
| `components/SproutCaptureCard.tsx` | Existing action preserved |
| `utils/sproutAdapter.ts` | Legacy adapter unchanged |

---

## Schema Migration

### Storage Version: 2 → 3

```typescript
// v2 (current)
interface SproutStorageV2 {
  version: 2;
  sprouts: SproutV2[];
  sessionId: string;
}

interface SproutV2 {
  id: string;
  status: 'sprout' | 'sapling' | 'tree';
  // ... other fields
}

// v3 (target)
interface SproutStorageV3 {
  version: 3;
  sprouts: SproutV3[];
  sessionId: string;
}

interface SproutV3 {
  id: string;
  status: 'sprout' | 'sapling' | 'tree';  // deprecated, computed
  stage: SproutStage;  // NEW
  researchManifest?: ResearchManifest;  // NEW
  // ... other fields
}
```

### Migration Function

```typescript
export function migrateStorageToV3(storage: SproutStorage): SproutStorageV3 {
  if (storage.version === 3) return storage as SproutStorageV3;
  
  // Migrate v2 → v3
  const migratedSprouts = storage.sprouts.map(sprout => ({
    ...sprout,
    stage: mapStatusToStage(sprout.status),
    // researchManifest undefined for existing sprouts
  }));

  return {
    version: 3,
    sprouts: migratedSprouts,
    sessionId: storage.sessionId
  };
}

function mapStatusToStage(status: SproutStatus): SproutStage {
  const mapping: Record<SproutStatus, SproutStage> = {
    'sprout': 'tender',
    'sapling': 'rooting',
    'tree': 'established'
  };
  return mapping[status] ?? 'tender';
}
```

---

## Import Path Changes

### Before

```typescript
// Direct config import
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';
```

### After

```typescript
// JSON config imports
import selectionActions from '@data/selection-actions.json';
import sproutStages from '@data/sprout-stages.json';
import researchPurposes from '@data/research-purposes.json';

// Hook provides resolved config
import { useSelectionActions } from '../hooks/useSelectionActions';
```

---

## Type Changes

### Before (sprout.ts)

```typescript
export type SproutStatus = 'sprout' | 'sapling' | 'tree';

export interface Sprout {
  status: SproutStatus;
  // ...
}
```

### After (sprout.ts)

```typescript
/** @deprecated Use SproutStage instead */
export type SproutStatus = 'sprout' | 'sapling' | 'tree';

export type SproutStage = 
  | 'tender' | 'rooting' | 'branching' | 'hardened'
  | 'grafted' | 'established' | 'dormant' | 'withered';

export interface ResearchManifest {
  purpose: ResearchPurpose;
  clues: ResearchClue[];
  directions: string[];
  promptGenerated?: {
    templateId: string;
    generatedAt: string;
    rawPrompt: string;
  };
}

export type ResearchPurpose = 'skeleton' | 'thread' | 'challenge' | 'gap' | 'validate';

export interface ResearchClue {
  type: 'url' | 'citation' | 'author' | 'concept' | 'question';
  value: string;
  note?: string;
}

export interface Sprout {
  /** @deprecated Use stage instead */
  status: SproutStatus;
  
  /** Growth stage in botanical lifecycle */
  stage: SproutStage;
  
  /** Research manifest for research sprouts */
  researchManifest?: ResearchManifest;
  
  // ... existing fields
}
```

---

## Component Prop Changes

### MagneticPill

```typescript
// Before
interface MagneticPillProps {
  position: { x: number; y: number };
  onClick: () => void;
}

// After
interface MagneticPillProps {
  position: { x: number; y: number };
  onActionSelect: (actionId: string) => void;
  actions: SelectionAction[];  // From config
}
```

### SproutCard

```typescript
// Before
interface SproutCardProps {
  sprout: Sprout;
  onDelete: (id: string) => void;
  isExpanded: boolean;
}

// After
interface SproutCardProps {
  sprout: Sprout;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;  // For research sprouts
  isExpanded: boolean;
  stages: StageConfig[];  // From config
}
```

---

## CSS Token Additions

```css
/* Add to globals.css */

/* Stage badge colors */
--stage-tender: theme('colors.green.300');
--stage-rooting: theme('colors.cyan.400');
--stage-branching: theme('colors.blue.400');
--stage-hardened: theme('colors.violet.400');
--stage-grafted: theme('colors.amber.400');
--stage-established: theme('colors.emerald.500');
--stage-dormant: theme('colors.gray.400');
--stage-withered: theme('colors.stone.500');

/* Research manifest tokens */
--research-purpose-bg: theme('colors.cyan.500/20');
--research-clue-bg: theme('colors.violet.500/10');
--research-direction-bg: theme('colors.amber.500/10');
```

---

## Rollback Plan

If sprint fails:

1. **Schema:** Keep v2 storage, don't run migration
2. **Components:** Revert MagneticPill to single action
3. **Config:** Keep TypeScript constants
4. **Tests:** E2E tests for existing flow still pass

**Rollback command:**
```bash
git revert --no-commit HEAD~N  # N = commits in sprint
git commit -m "revert: sprout-declarative-v1 rollback"
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Jim + Claude | Initial migration map |
