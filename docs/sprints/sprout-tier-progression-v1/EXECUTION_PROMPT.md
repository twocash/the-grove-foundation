# Execution Prompt: S4-SL-TierProgression

## CRITICAL: Before Starting Development

**You MUST run `/grove-execution-protocol` before writing any code.**

This sprint requires an execution contract. The protocol will:
1. Verify DEX compliance requirements
2. Establish strangler fig boundaries
3. Create your execution contract
4. Set up visual verification requirements

```
/grove-execution-protocol S4-SL-TierProgression
```

---

## Instant Orientation

| Field | Value |
|-------|-------|
| **Sprint** | S4-SL-TierProgression |
| **Goal** | Make botanical lifecycle visible in UI |
| **Duration** | 3-5 days |
| **Critical Path** | US-G005 (promotion wiring fix) |
| **Project Path** | `C:\GitHub\the-grove-foundation` |

---

## Attention Anchoring Protocol

### Before any major decision, re-read:
1. `SPEC.md` Live Status block
2. `SPEC.md` Attention Anchor block

### After every 10 tool calls:
- Check: Am I still pursuing tier visibility?
- If uncertain: Re-read SPEC.md Goals

### Before committing:
- Verify: Does this change satisfy Acceptance Criteria?

---

## What We're Building

**One sentence:** Tier badges showing sprout maturity throughout the UI.

**Success looks like:** User promotes a sprout and immediately sees it change from 🌱 to 🌿.

**We are NOT:**
- Building tier filtering
- Building auto-advancement
- Building metrics dashboards
- Using Living Glass tokens (stay on Quantum Glass)

---

## Pre-Execution Verification

```bash
# 1. Verify current state
cd C:\GitHub\the-grove-foundation
git status
npm run build

# 2. Run existing tests
npm test
npx playwright test tests/e2e/sprout-finishing-room.spec.ts

# 3. Verify schema compiles
npx tsc --noEmit
```

---

## Epic 1: Component Foundation

### Story: Create TierBadge Component

**Create these files:**

```
src/surface/components/TierBadge/
├── TierBadge.types.ts
├── TierBadge.config.ts
├── stageTierMap.ts
├── TierBadge.tsx
└── index.ts
```

**TierBadge.types.ts:**
```typescript
export type SproutTier = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';

export interface TierBadgeProps {
  tier: SproutTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  status?: 'pending' | 'active' | 'ready';
  tooltip?: string;
  className?: string;
}
```

**TierBadge.config.ts:**
```typescript
import type { SproutTier } from './TierBadge.types';

export const TIER_CONFIG = {
  emoji: {
    seed: '🌰',
    sprout: '🌱',
    sapling: '🌿',
    tree: '🌳',
    grove: '🌲',
  } as Record<SproutTier, string>,

  sizes: {
    sm: { fontSize: '16px', gap: '4px', labelSize: '12px' },
    md: { fontSize: '20px', gap: '6px', labelSize: '14px' },
    lg: { fontSize: '24px', gap: '8px', labelSize: '16px' },
  },

  labels: {
    seed: 'Seed',
    sprout: 'Sprout',
    sapling: 'Sapling',
    tree: 'Tree',
    grove: 'Grove',
  } as Record<SproutTier, string>,
} as const;
```

**stageTierMap.ts:**
```typescript
import type { SproutStage } from '@core/schema/sprout';
import type { SproutTier } from './TierBadge.types';

export const STAGE_TO_TIER: Record<SproutStage, SproutTier> = {
  tender: 'seed',
  rooting: 'seed',
  branching: 'sprout',
  hardened: 'sprout',
  grafted: 'sprout',
  established: 'sapling',
  dormant: 'sprout',
  withered: 'seed',
};

export function stageToTier(stage?: SproutStage): SproutTier {
  if (!stage) return 'sprout';
  return STAGE_TO_TIER[stage] ?? 'sprout';
}
```

**TierBadge.tsx:**
```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { TIER_CONFIG } from './TierBadge.config';
import type { TierBadgeProps } from './TierBadge.types';

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = false,
  status = 'ready',
  tooltip,
  className = '',
}) => {
  const emoji = TIER_CONFIG.emoji[tier];
  const label = TIER_CONFIG.labels[tier];
  const sizeConfig = TIER_CONFIG.sizes[size];

  const statusStyles = {
    pending: 'opacity-40 grayscale',
    active: 'animate-pulse',
    ready: '',
  };

  return (
    <motion.span
      className={`inline-flex items-center ${statusStyles[status]} ${className}`}
      style={{ gap: sizeConfig.gap }}
      title={tooltip ?? `${label} tier`}
      initial={false}
      whileHover={{ scale: 1.05 }}
    >
      <span
        role="img"
        aria-label={`${label} tier`}
        style={{ fontSize: sizeConfig.fontSize }}
      >
        {emoji}
      </span>
      {showLabel && (
        <span
          className="font-sans text-[var(--glass-text-secondary)]"
          style={{ fontSize: sizeConfig.labelSize }}
        >
          {label}
        </span>
      )}
    </motion.span>
  );
};
```

**index.ts:**
```typescript
export { TierBadge } from './TierBadge';
export { stageToTier, STAGE_TO_TIER } from './stageTierMap';
export { TIER_CONFIG } from './TierBadge.config';
export type { TierBadgeProps, SproutTier } from './TierBadge.types';
```

**Verification:**
```bash
npm run build
```

---

## Epic 2: Schema Extension

### Story: Add promotedAt Field

**File:** `src/core/schema/sprout.ts`

**Add after line 99 (after `stage` field):**
```typescript
  /** ISO timestamp when promoted to 'established' (S4-SL-TierProgression) */
  promotedAt?: string;
```

**Verification:**
```bash
npx tsc --noEmit
```

---

## Epic 3: Promotion Wiring (CRITICAL PATH)

### Story: Fix handlePromote

**File:** `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx`

**Replace handlePromote function (lines 47-68):**

```typescript
// US-D005: Promote to RAG - S4-SL-TierProgression: Also update stage
const handlePromote = async (content: string, selectedItems: string[]) => {
  try {
    const response = await fetch('/api/knowledge/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sprout.query,
        content,
        tier: 2,
        sourceType: 'sprout',
        sourceUrl: `sprout://${sprout.id}`,
      }),
    });

    if (!response.ok) throw new Error('Upload failed');

    // S4-SL-TierProgression: Update stage to 'established' with timestamp
    try {
      updateSprout(sprout.id, {
        stage: 'established',
        promotedAt: new Date().toISOString(),
      });

      // Notify parent of update
      if (onSproutUpdate) {
        const updated = getSprout(sprout.id);
        if (updated) onSproutUpdate(updated);
      }
    } catch (stageError) {
      console.error('Stage update failed:', stageError);
      toast.warning('Content saved, but tier update failed.');
    }

    emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
    toast.success('Promoted to Sapling! Added to Knowledge Commons.');
  } catch (error) {
    toast.error('Failed to promote content');
  }
};
```

**Verification:**
```bash
npm run build
npx playwright test tests/e2e/sprout-finishing-room.spec.ts
```

---

## Epic 4: UI Integration

### Story 4.1: GardenTray Badge

**File:** `src/explore/components/GardenTray/SproutRow.tsx`

**Add import:**
```typescript
import { TierBadge, stageToTier } from '@surface/components/TierBadge';
```

**Add TierBadge in row (before chevron):**
```typescript
<TierBadge
  tier={stageToTier(sprout.stage)}
  size="sm"
  className="ml-auto mr-2 flex-shrink-0"
/>
```

### Story 4.2: Header Badge

**File:** `src/surface/components/modals/SproutFinishingRoom/FinishingRoomHeader.tsx`

**Add import:**
```typescript
import { TierBadge, stageToTier } from '@surface/components/TierBadge';
```

**Replace static emoji (lines 35-37):**
```typescript
// BEFORE:
<span className="text-xl" role="img" aria-label="Sprout">
  🌱
</span>

// AFTER:
<TierBadge
  tier={stageToTier(sprout.stage)}
  size="lg"
  showLabel={false}
  tooltip={`Current tier: ${stageToTier(sprout.stage)}`}
/>
```

### Story 4.3: Provenance Section

**File:** `src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx`

**Add import:**
```typescript
import { TierBadge, stageToTier } from '@surface/components/TierBadge';
```

**Add Lifecycle section (after existing provenance content):**
```typescript
{/* Lifecycle Section - S4-SL-TierProgression */}
<div className="border-t border-ink/10 dark:border-white/10 pt-3 mt-3">
  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-paper/60 mb-2">
    Lifecycle
  </h4>
  <div className="flex items-center gap-2">
    <TierBadge tier={stageToTier(sprout.stage)} size="md" showLabel />
  </div>
  {sprout.promotedAt && (
    <p className="text-xs text-ink-muted dark:text-paper/50 mt-1">
      Promoted {new Date(sprout.promotedAt).toLocaleDateString()}
    </p>
  )}
</div>
```

---

## Post-Epic Verification

After each epic:

```bash
# 1. Run tests
npm test
npx playwright test

# 2. Update DEVLOG
echo "Epic N complete. Tests: PASS" >> docs/sprints/sprout-tier-progression-v1/DEVLOG.md

# 3. ATTENTION ANCHOR: Re-read SPEC.md before next epic
cat docs/sprints/sprout-tier-progression-v1/SPEC.md | head -50
```

---

## Final Verification

```bash
# Full test suite
npm run build && npm test && npx playwright test

# Visual verification
# 1. Open app
# 2. Navigate to GardenTray - verify tier badges visible
# 3. Open a sprout in Finishing Room - verify header badge
# 4. Promote sprout - verify badge changes from 🌱 to 🌿
# 5. Check Provenance panel - verify Lifecycle section
```

---

## Commit Sequence

```bash
# After Epic 1
git add src/surface/components/TierBadge/
git commit -m "feat(tier): create TierBadge component

- Add SproutTier type and configuration
- Implement emoji-based tier badges with size variants
- Add stageToTier mapping utility
- Support pending/active/ready states

Sprint: S4-SL-TierProgression

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# After Epic 2
git add src/core/schema/sprout.ts
git commit -m "feat(schema): add promotedAt field to Sprout

- Optional ISO timestamp for promotion tracking
- No migration required (optional field)

Sprint: S4-SL-TierProgression

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# After Epic 3
git add src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx
git commit -m "fix(promote): update sprout stage on promotion

- Set stage to 'established' after successful RAG upload
- Add promotedAt timestamp for provenance
- Implement fail-soft error handling

Fixes: Stage not updating on promotion
Sprint: S4-SL-TierProgression

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# After Epic 4
git add src/explore/components/GardenTray/ src/surface/components/modals/SproutFinishingRoom/
git commit -m "feat(tier): integrate tier badges throughout UI

- Add TierBadge to GardenTray rows
- Dynamic tier badge in Finishing Room header
- Lifecycle section in Provenance panel

Sprint: S4-SL-TierProgression

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria Checklist

- [ ] TierBadge renders all 5 tiers correctly
- [ ] Stage → Tier mapping works for all 8 stages
- [ ] Promotion updates stage to 'established'
- [ ] Promotion sets promotedAt timestamp
- [ ] Header shows dynamic tier badge
- [ ] GardenTray rows show tier badges
- [ ] Provenance panel shows Lifecycle section
- [ ] All tests pass
- [ ] No TypeScript errors

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Import error for TierBadge | Check path alias `@surface` is configured |
| Stage not updating | Verify updateSprout is called after RAG success |
| Badge not showing | Check sprout.stage is defined |
| Animation not working | Verify framer-motion is imported |

---

*Execution prompt created by Foundation Loop v2*
*Sprint: S4-SL-TierProgression*
