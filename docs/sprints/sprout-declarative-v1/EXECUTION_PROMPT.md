# Execution Prompt: sprout-declarative-v1

**Sprint:** sprout-declarative-v1  
**Date:** December 30, 2024  
**For:** Claude Code CLI  
**Status:** Epic 1 partially complete (Tasks 1.1-1.2 done, 1.3-1.4 pending)

---

## ⚠️ PARTIAL COMPLETION NOTICE

**Already completed by planning session:**
- ✅ Task 1.1: JSON config files created (`data/selection-actions.json`, `data/sprout-stages.json`, `data/research-purposes.json` + schemas)
- ✅ Task 1.2: Sprout schema extended (`src/core/schema/sprout.ts` - SproutStage, ResearchManifest, migrateStorageToV3)

**Resume from:**
- Task 1.3: Storage migration wiring (ensure sprout-storage.ts calls migrateStorageToV3)
- Task 1.4: Fix MagneticPill scale bug

---

## Mission

Transform the Sprout capture system from single-action hardcoded UI into a declarative, multi-action system with Research Manifest capability. Users can capture insights as simple sprouts OR build structured research briefs that generate copy-paste ready prompts.

**Success Criteria:**
1. Zero hardcoded action/stage definitions — all in JSON
2. MagneticPill scale bug fixed
3. Two capture actions available (Plant Sprout, Research Directive)
4. Research prompts generate from accumulated manifest
5. All E2E tests pass

---

## Pre-Execution Checklist

```bash
# Navigate to project
cd C:\GitHub\the-grove-foundation

# Verify clean state
git status  # Should be clean or stashed

# Install dependencies
npm install

# Run existing tests (must pass before starting)
npm test
npx playwright test

# Verify baselines exist
ls tests/e2e/*-baseline.spec.ts-snapshots/ 2>/dev/null || echo "No baselines yet"
```

---

## Context Files (Read First)

These files contain critical patterns and existing implementations:

```
# Must Read
PROJECT_PATTERNS.md                    # Pattern 11: Selection Action
docs/sprints/sprout-declarative-v1/    # All sprint artifacts
src/core/schema/sprout.ts              # Current Sprout schema
src/surface/components/KineticStream/Capture/  # Current implementation

# Reference
data/                                  # Example JSON configs (journeys, hubs)
src/surface/hooks/useQuantumInterface.ts  # Pattern 1 example
```

---

## Epic 1: Declarative Foundation

### Task 1.1: Create JSON Config Files

Create three JSON config files with schemas:

**File: `data/selection-actions.json`**
```json
{
  "$schema": "./selection-actions.schema.json",
  "version": "1.0.0",
  "actions": [
    {
      "id": "sprout",
      "label": "Plant Sprout",
      "icon": "🌱",
      "description": "Capture insight as-is",
      "defaultStage": "tender",
      "captureCard": "SproutCaptureCard",
      "fields": ["tags"]
    },
    {
      "id": "research-directive",
      "label": "Research Directive",
      "icon": "🔬",
      "description": "Build research brief",
      "defaultStage": "rooting",
      "captureCard": "ResearchManifestCard",
      "fields": ["purpose", "clues", "directions", "tags"]
    }
  ]
}
```

**File: `data/sprout-stages.json`**
```json
{
  "$schema": "./sprout-stages.schema.json",
  "version": "1.0.0",
  "stages": [
    { "id": "tender", "label": "Tender", "icon": "🌱", "color": "green-300", "description": "Just captured, no research intent" },
    { "id": "rooting", "label": "Rooting", "icon": "🔬", "color": "cyan-400", "description": "Has research manifest, accumulating" },
    { "id": "branching", "label": "Branching", "icon": "📋", "color": "blue-400", "description": "Prompt generated, ready to execute" },
    { "id": "hardened", "label": "Hardened", "icon": "🌸", "color": "violet-400", "description": "Research harvested, needs review" },
    { "id": "grafted", "label": "Grafted", "icon": "🔗", "color": "amber-400", "description": "Connected to other sprouts" },
    { "id": "established", "label": "Established", "icon": "📚", "color": "emerald-500", "description": "Promoted to Knowledge Commons" },
    { "id": "dormant", "label": "Dormant", "icon": "💤", "color": "gray-400", "description": "Archived but preserved" },
    { "id": "withered", "label": "Withered", "icon": "🍂", "color": "stone-500", "description": "Abandoned" }
  ],
  "transitions": {
    "tender": ["rooting", "dormant", "withered"],
    "rooting": ["branching", "tender", "dormant"],
    "branching": ["hardened", "rooting"],
    "hardened": ["established", "rooting", "dormant"],
    "grafted": ["established", "dormant"],
    "established": [],
    "dormant": ["tender", "rooting"],
    "withered": []
  }
}
```

**File: `data/research-purposes.json`**
```json
{
  "$schema": "./research-purposes.schema.json",
  "version": "1.0.0",
  "purposes": [
    {
      "id": "skeleton",
      "label": "Build Skeleton",
      "icon": "🦴",
      "description": "Foundational research for Grove architecture",
      "promptFraming": "Establish authoritative sources and baseline understanding for this topic. Focus on peer-reviewed sources, established frameworks, and foundational concepts."
    },
    {
      "id": "thread",
      "label": "Extend Thread",
      "icon": "🧵",
      "description": "Deepen an existing line of thought",
      "promptFraming": "Build on what exists, find logical next steps. Look for recent developments, adjacent ideas, and natural extensions of this thinking."
    },
    {
      "id": "challenge",
      "label": "Challenge Assumption",
      "icon": "⚔️",
      "description": "Stress-test a belief or claim",
      "promptFraming": "Find counter-arguments, edge cases, and critiques. Steelman opposing views. Identify conditions under which this claim might fail."
    },
    {
      "id": "gap",
      "label": "Fill Gap",
      "icon": "🕳️",
      "description": "Something's missing, need to find it",
      "promptFraming": "Comprehensive survey of what exists on this topic. Identify what's been written, who the key thinkers are, and where the conversation currently stands."
    },
    {
      "id": "validate",
      "label": "Validate Claim",
      "icon": "✓",
      "description": "Confirm something believed to be true",
      "promptFraming": "Find supporting evidence for this claim. Note confidence levels, identify the strongest sources, and flag any caveats or limitations."
    }
  ]
}
```

**Verify:**
```bash
# Check JSON syntax
cat data/selection-actions.json | python -m json.tool > /dev/null && echo "Valid JSON"
cat data/sprout-stages.json | python -m json.tool > /dev/null && echo "Valid JSON"
cat data/research-purposes.json | python -m json.tool > /dev/null && echo "Valid JSON"
```

### Task 1.2: Extend Sprout Schema

**File: `src/core/schema/sprout.ts`**

Add these types (insert after existing types, before interfaces):

```typescript
// ─────────────────────────────────────────────────────────────
// Sprout Stage (8-stage botanical lifecycle)
// ─────────────────────────────────────────────────────────────

/**
 * Botanical growth stages for sprouts.
 * Replaces simplified 'sprout' | 'sapling' | 'tree' status.
 */
export type SproutStage =
  | 'tender'      // Just captured, no research intent
  | 'rooting'     // Has research manifest, accumulating
  | 'branching'   // Prompt generated, ready to execute
  | 'hardened'    // Research harvested, needs review
  | 'grafted'     // Connected to other sprouts
  | 'established' // Promoted to Knowledge Commons
  | 'dormant'     // Archived but preserved
  | 'withered';   // Abandoned

// ─────────────────────────────────────────────────────────────
// Research Manifest (for research-type sprouts)
// ─────────────────────────────────────────────────────────────

export type ResearchPurpose = 'skeleton' | 'thread' | 'challenge' | 'gap' | 'validate';

export type ClueType = 'url' | 'citation' | 'author' | 'concept' | 'question';

export interface ResearchClue {
  type: ClueType;
  value: string;
  note?: string;
}

export interface ResearchManifest {
  /** Research intent */
  purpose: ResearchPurpose;

  /** Accumulated research clues */
  clues: ResearchClue[];

  /** Research directions/questions */
  directions: string[];

  /** Generated prompt (if any) */
  promptGenerated?: {
    templateId: string;
    generatedAt: string;
    rawPrompt: string;
  };

  /** Harvested research output */
  harvest?: {
    raw: string;
    harvestedAt: string;
    addedToKnowledge?: boolean;
  };
}
```

Modify the `Sprout` interface to add:

```typescript
export interface Sprout {
  // ... existing fields ...

  /** @deprecated Use stage instead */
  status: SproutStatus;

  /** Growth stage in botanical lifecycle */
  stage: SproutStage;

  /** Research manifest for research sprouts */
  researchManifest?: ResearchManifest;

  // ... rest of existing fields ...
}
```

Update `CURRENT_STORAGE_VERSION`:
```typescript
export const CURRENT_STORAGE_VERSION = 3;
```

Add migration function:
```typescript
/**
 * Migrate v2 storage to v3 (adds stage field)
 */
export function migrateStorageToV3(storage: SproutStorage): SproutStorage {
  if (storage.version === 3) return storage;

  const mapStatusToStage = (status: SproutStatus): SproutStage => {
    const mapping: Record<SproutStatus, SproutStage> = {
      'sprout': 'tender',
      'sapling': 'rooting',
      'tree': 'established'
    };
    return mapping[status] ?? 'tender';
  };

  const migratedSprouts = storage.sprouts.map(sprout => ({
    ...sprout,
    stage: (sprout as any).stage ?? mapStatusToStage(sprout.status),
  }));

  return {
    version: 3 as const,
    sprouts: migratedSprouts,
    sessionId: storage.sessionId
  };
}
```

### Task 1.3: Fix MagneticPill Scale Bug

**File: `src/surface/components/KineticStream/Capture/components/MagneticPill.tsx`**

Find the scale calculation (look for something like):
```typescript
const scale = 1 + (distance / magneticDistance) * (magneticScale - 1);
```

**Bug:** Scale increases as distance increases (inverted).

**Fix:** Invert the relationship:
```typescript
const scale = 1 + ((magneticDistance - distance) / magneticDistance) * (magneticScale - 1);
// Or more clearly:
const proximity = Math.max(0, 1 - (distance / magneticDistance));
const scale = 1 + proximity * (magneticScale - 1);
```

**Verify:**
- Move cursor toward pill → scale increases
- Move cursor away from pill → scale decreases to 1.0
- Cursor outside range → scale = 1.0

### Build Gate 1

```bash
npm run build
npm test
npm run lint
```

---

## Epic 2: Multi-Action Selection

### Task 2.1: Create useSelectionActions Hook

**File: `src/surface/components/KineticStream/Capture/hooks/useSelectionActions.ts`**

```typescript
// src/surface/components/KineticStream/Capture/hooks/useSelectionActions.ts
// Sprint: sprout-declarative-v1

import selectionActionsConfig from '@/data/selection-actions.json';

export interface SelectionAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  defaultStage: string;
  captureCard: string;
  fields: string[];
}

interface SelectionActionsConfig {
  version: string;
  actions: SelectionAction[];
}

export function useSelectionActions() {
  const config = selectionActionsConfig as SelectionActionsConfig;

  const getActionById = (id: string): SelectionAction | undefined => {
    return config.actions.find(a => a.id === id);
  };

  const getDefaultAction = (): SelectionAction => {
    return config.actions[0];
  };

  return {
    actions: config.actions,
    getActionById,
    getDefaultAction,
    version: config.version,
  };
}

export default useSelectionActions;
```

**Note:** You may need to configure TypeScript to import JSON. Check `tsconfig.json` for:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

### Task 2.2: Create ActionMenu Component

**File: `src/surface/components/KineticStream/Capture/components/ActionMenu.tsx`**

```typescript
// src/surface/components/KineticStream/Capture/components/ActionMenu.tsx
// Sprint: sprout-declarative-v1

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { SelectionAction } from '../hooks/useSelectionActions';

interface ActionMenuProps {
  actions: SelectionAction[];
  position: { x: number; y: number };
  onSelect: (actionId: string) => void;
  onClose: () => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  position,
  onSelect,
  onClose,
}) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    menuRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex(i => (i + 1) % actions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex(i => (i - 1 + actions.length) % actions.length);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(actions[focusIndex].id);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions, focusIndex, onSelect, onClose]);

  // Position within viewport
  const menuX = Math.min(position.x, window.innerWidth - 280);
  const menuY = Math.min(position.y, window.innerHeight - 200);

  return (
    <motion.div
      ref={menuRef}
      tabIndex={-1}
      className="fixed z-50 w-64 rounded-xl overflow-hidden
                 bg-[var(--glass-solid)] border border-[var(--glass-border)]
                 backdrop-blur-xl shadow-2xl"
      style={{ left: menuX, top: menuY }}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
    >
      <div className="p-2 space-y-1">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left
                       transition-colors
                       ${index === focusIndex
                         ? 'bg-white/10 ring-1 ring-[var(--neon-cyan)]'
                         : 'hover:bg-white/5'}`}
          >
            <span className="text-xl" role="img" aria-hidden="true">
              {action.icon}
            </span>
            <div>
              <div className="font-medium text-[var(--glass-text-primary)]">
                {action.label}
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default ActionMenu;
```

### Task 2.3: Integrate ActionMenu with MagneticPill

Modify `MagneticPill.tsx` to:
1. Accept `actions` prop
2. If single action: direct click opens card
3. If multiple actions: click opens ActionMenu

The parent orchestrator (likely in `index.ts` or a manager component) should:
1. Render MagneticPill with actions
2. On action select, render appropriate card (SproutCaptureCard or ResearchManifestCard)

### Build Gate 2

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts
```

---

## Epic 3: Research Manifest Card

### Task 3.1: Create ResearchManifestCard

**File: `src/surface/components/KineticStream/Capture/components/ResearchManifestCard.tsx`**

This is a larger component. Key sections:
1. Header with close button
2. Seed preview (selected text)
3. Purpose selector (radio buttons from config)
4. Clues list with add/remove (type selector dropdown)
5. Directions list with add/remove (text inputs)
6. Tags input (reuse pattern from SproutCaptureCard)
7. Action buttons: Save Draft, Generate Prompt

Use `research-purposes.json` for purpose options.

### Task 3.2-3.4: Stage Badges and Display

Add stage badges to SproutCard, using colors from `sprout-stages.json`.

### Build Gate 3

```bash
npm run build
npm test
```

---

## Epic 4: Prompt Generation

### Task 4.1: Create Prompt Template

**File: `data/research-prompt-template.md`**

```markdown
# Research Request: {{purpose.label}}

## Seed Insight

> {{seed}}

{{#if provenance.lens.name}}
**Context:** Captured via {{provenance.lens.name}} lens{{#if provenance.journey.name}} during {{provenance.journey.name}} journey{{/if}}
{{/if}}

## Research Purpose

{{purpose.promptFraming}}

{{#if clues.length}}
## Clues to Follow

{{#each clues}}
- **[{{type}}]** {{value}}{{#if note}} — *{{note}}*{{/if}}
{{/each}}
{{/if}}

{{#if directions.length}}
## Research Directions

{{#each directions}}
{{add @index 1}}. {{this}}
{{/each}}
{{/if}}

## Output Format

Please provide:
1. **Summary** (2-3 paragraphs)
2. **Key Sources** (with citations)
3. **Confidence Assessment** (what's well-established vs. speculative)
4. **Open Questions** (what remains unclear)

---
*Generated by Grove Research System*
*Captured: {{capturedAt}}*
```

### Task 4.2: Create Prompt Generator

**File: `src/lib/prompt-generator.ts`**

Use Handlebars or template literals to render the template with sprout data.

### Task 4.3: Create PromptPreviewModal

Modal that shows generated prompt with copy button.

### Build Gate 4

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-research.spec.ts
```

---

## Epic 5: Testing & Polish

### Task 5.1: E2E Tests

**File: `tests/e2e/sprout-research.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sprout Research Flow', () => {
  test('can plant basic sprout via action menu', async ({ page }) => {
    await page.goto('/terminal');
    // ... test implementation
  });

  test('can create research directive', async ({ page }) => {
    await page.goto('/terminal');
    // ... test implementation
  });

  test('can generate research prompt', async ({ page }) => {
    // ... test implementation
  });
});
```

### Task 5.2: Visual Baselines

Capture screenshots for new components.

### Task 5.3: Documentation

Update `PROJECT_PATTERNS.md` Pattern 11 with research manifest extension.

### Final Build Gate

```bash
npm run build
npm test
npx playwright test
npx playwright test tests/e2e/*-baseline.spec.ts
npm run lint
git status  # Review changes
```

---

## Troubleshooting

### JSON Import Errors

If TypeScript can't import JSON:
```json
// tsconfig.json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

### Handlebars Not Found

```bash
npm install handlebars
```

### Visual Baseline Failures

```bash
# Update baselines if changes are intentional
npx playwright test tests/e2e/*-baseline.spec.ts --update-snapshots
```

### Storage Migration Issues

If sprouts don't load:
1. Check browser localStorage
2. Verify `grove-sprouts` key exists
3. Check version field
4. Run migration manually in console

---

## Completion Checklist

- [ ] All JSON configs created and valid
- [ ] Sprout schema extended with stage and researchManifest
- [ ] Storage migration v2 → v3 working
- [ ] MagneticPill scale bug fixed
- [ ] ActionMenu renders from config
- [ ] ResearchManifestCard captures all fields
- [ ] Prompt generation works
- [ ] Copy to clipboard functional
- [ ] Stage badges display correctly
- [ ] All E2E tests pass
- [ ] Visual baselines captured
- [ ] PROJECT_PATTERNS.md updated
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npx playwright test` passes

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Jim + Claude | Initial execution prompt |
