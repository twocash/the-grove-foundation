# Repository Audit: S4-SL-TierProgression

**Sprint:** Sprout Tier Progression
**Audited:** 2026-01-15
**Auditor:** Foundation Loop v2

---

## Current State Analysis

### 1. Schema Layer (`src/core/schema/`)

#### Sprout Schema (`sprout.ts`)

**Status:** Ready for use (no changes needed)

The existing schema already supports botanical lifecycle:

```typescript
// 8-stage botanical lifecycle (already implemented)
export type SproutStage =
  | 'tender'      // Just captured
  | 'rooting'     // Accumulating clues
  | 'branching'   // Prompt generated
  | 'hardened'    // Research complete ← DEFAULT for legacy
  | 'grafted'     // Connected to others
  | 'established' // Promoted to RAG ← TARGET STATE
  | 'dormant'     // Archived
  | 'withered';   // Abandoned

// Sprout interface includes:
// - stage: SproutStage (added in v3)
// - status: SproutStatus (deprecated, kept for compat)
```

**Key Insight:** No schema migration required. The `stage` field exists and is populated by v3 storage migration.

#### Missing Field Identified

The design spec calls for a `promotedAt` timestamp. This is NOT currently in the schema:

```typescript
// NEEDS ADDITION:
promotedAt?: string; // ISO timestamp when stage became 'established'
```

**Location:** Line ~100 in `sprout.ts`, after `stage` field.

---

### 2. Promotion Logic (`ActionPanel.tsx`)

**Location:** `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx`

**Current Implementation (Lines 47-68):**

```typescript
const handlePromote = async (content: string, selectedItems: string[]) => {
  try {
    const response = await fetch('/api/knowledge/upload', {...});
    if (!response.ok) throw new Error('Upload failed');

    emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
    toast.success('Content promoted to Knowledge Commons');
    // ❌ BUG: Stage not updated to 'established'
  } catch (error) {
    toast.error('Failed to promote content');
  }
};
```

**Required Fix:**

```typescript
const handlePromote = async (content: string, selectedItems: string[]) => {
  try {
    const response = await fetch('/api/knowledge/upload', {...});
    if (!response.ok) throw new Error('Upload failed');

    // ✅ FIX: Update sprout stage and timestamp
    updateSprout(sprout.id, {
      stage: 'established',
      promotedAt: new Date().toISOString()
    });

    emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
    toast.success('Content promoted to Knowledge Commons');

    // Notify parent of update
    if (onSproutUpdate) {
      const updated = getSprout(sprout.id);
      if (updated) onSproutUpdate(updated);
    }
  } catch (error) {
    toast.error('Failed to promote content');
  }
};
```

---

### 3. Display Components

#### GardenTray (`src/explore/components/GardenTray/`)

**Files:**
- `GardenTray.tsx` - Main container (297 lines)
- `SproutRow.tsx` - Individual sprout row

**Current State:**
- Uses `STATUS_EMOJI` mapping for status (pending/active/completed)
- Does NOT display tier information
- Uses `ResearchSproutStatus`, not `SproutStage`

**Required Changes:**
- Add TierBadge to SproutRow
- Position: Right side of row, before chevron

#### Finishing Room Header (`FinishingRoomHeader.tsx`)

**Location:** `src/surface/components/modals/SproutFinishingRoom/`

**Current Layout:**
```
[🌱 Icon] SPROUT FINISHING ROOM | [Sprout Title...] | [Close X]
```

**Required Layout:**
```
[TierBadge lg] SPROUT FINISHING ROOM | [Sprout Title...] | [Close X]
```

**Change:** Replace static 🌱 emoji with dynamic TierBadge component.

---

### 4. Component Inventory

#### Components That Exist:

| Component | Location | Status |
|-----------|----------|--------|
| `ActionPanel` | SproutFinishingRoom/ | Needs update |
| `FinishingRoomHeader` | SproutFinishingRoom/ | Needs update |
| `ProvenancePanel` | SproutFinishingRoom/ | Needs tier section |
| `GardenTray` | explore/components/ | Needs tier badge |
| `SproutRow` | GardenTray/ | Needs tier badge |

#### Components To Create:

| Component | Location | Purpose |
|-----------|----------|---------|
| `TierBadge` | `src/surface/components/TierBadge/` | Reusable tier display |

---

### 5. Token Analysis

#### Existing Tokens (from globals.css)

The `--card-*` namespace is available for tier badge styling:

```css
--card-border-default: ...
--card-border-active: ...
--card-bg-active: ...
--card-ring-color: ...
```

**Decision:** TierBadge will use existing card tokens for consistency.

---

### 6. Test Coverage

#### Existing Tests:

| Test File | Coverage |
|-----------|----------|
| `sprout-finishing-room.spec.ts` | Shell, actions, provenance |
| `garden-tray.spec.ts` | Expand/collapse, filtering |
| `sprout-status-panel.spec.ts` | Status display, notifications |

#### Tests Needed:

| Test File | Coverage |
|-----------|----------|
| `tier-badge.spec.ts` | New component tests |
| `tier-progression.spec.ts` | Promotion flow integration |

---

### 7. Dependencies

#### Internal Dependencies:

- `@core/schema/sprout` - Already stable
- `hooks/useSproutStorage` - Already supports updates
- `hooks/useEngagementBus` - Already emits promotion events

#### External Dependencies:

None required. Using existing:
- Framer Motion (animations)
- Tailwind CSS (styling)

---

## Summary

| Category | State | Action |
|----------|-------|--------|
| Schema | ✅ Ready | Add `promotedAt` field |
| Promotion Logic | 🔴 Bug | Fix stage update in handlePromote |
| GardenTray | 🟡 Partial | Add TierBadge display |
| Finishing Room | 🟡 Partial | Replace icon with TierBadge |
| TierBadge | 🔴 Missing | Create new component |
| Tests | 🟡 Partial | Add tier-specific tests |

---

*Repository Audit generated by Foundation Loop v2*
