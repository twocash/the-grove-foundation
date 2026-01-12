# Feature Flags as GroveObjects Execution Contract

**Codename:** `feature-flags-v1`
**Status:** Execution Contract for Claude Code CLI
**Baseline:** `main` (latest commit)
**Date:** 2026-01-12

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Not Started |
| **Status** | 📋 Ready for Execution |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-12 |
| **Next Action** | Phase 1a - Create FeatureFlagPayload schema |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Feature Flags as GroveObjects in Experience Console — admin-configurable flags stored in Supabase with `GroveObject<FeatureFlagPayload>` pattern
- **Success looks like:** Admin can CRUD feature flags in Experience Console; consumer hooks read flags; header toggles render dynamically
- **We are NOT:** Building user preferences (those stay in localStorage), per-user overrides, or A/B testing infrastructure (all deferred)
- **Cardinality:** Instance (many flags active simultaneously) — lives IN Experience Console, not a separate console
- **Current phase:** Not Started
- **Next action:** Create FeatureFlagPayload schema

---

## Purpose

Transform feature flags from static JSON to Supabase-backed `GroveObject<FeatureFlagPayload>` entities managed through the existing Experience Console's TypeSelector pattern. This establishes the pattern for Instance cardinality objects (many active) vs Singleton cardinality (SystemPrompt - one active).

**This document is an execution contract, not a spec.**

User stories and acceptance criteria are documented in Notion: [Sprint D User Stories](https://www.notion.so/2e6780a78eef8196a7a6cb064c3a092f)

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── src/surface/components/Terminal/*
├── src/workspace/* (legacy GroveWorkspace)
└── src/bedrock/nursery/* (just completed)

ACTIVE BUILD ZONE — WHERE WE WORK
├── src/core/schema/feature-flag.ts ← NEW SCHEMA
├── src/bedrock/consoles/ExperienceConsole/* ← ADD FLAG SUPPORT
├── src/hooks/useFeatureFlags.ts ← CONSUMER HOOK (modify)
└── supabase/migrations/* ← NEW TABLE
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative Sovereignty | Capability Agnosticism | Provenance | Organic Scalability |
|---------|------------------------|------------------------|------------|---------------------|
| FeatureFlagPayload | Schema defines all fields | No model-specific fields | createdBy tracked | New flags via insert, not code |
| TypeSelector | Flag type in dropdown | Works with any console | N/A | New types auto-appear |
| FeatureFlagCard | Display via config | N/A | Shows creator | Handles any flag count |
| FeatureFlagEditor | Fields from schema | N/A | Shows changelog | All fields editable |
| Consumer Hooks | Read from Supabase | N/A | User preference preserved | Scales with flag count |

### Route for Testing

**CRITICAL:** Test at `/foundation/experience`, NOT at `/foundation/nursery`

```
✅ localhost:3000/foundation/experience  ← WHERE TO TEST
❌ localhost:3000/foundation/nursery     ← DIFFERENT CONSOLE
❌ localhost:3000/                        ← LEGACY TERMINAL
```

---

## v1.0 Scope Boundaries (From User Stories)

**In Scope (Must Have):**
- FeatureFlagPayload schema with flagId, available, defaultEnabled, etc.
- Supabase migration for feature_flags table
- useFeatureFlags data hook (CollectionDataResult pattern)
- useFeatureFlag consumer hook (single flag by ID)
- TypeSelector integration (add 'feature-flag' type)
- FeatureFlagCard component
- FeatureFlagEditor component
- useHeaderFeatureFlags hook
- Header toggles rendered from flags

**Explicitly Deferred:**
- Sprout provenance integration (US-D010)
- Legacy JSON flag removal (US-D011)
- Per-user flag overrides
- A/B testing infrastructure
- Flag dependencies/cascades

---

## Key Decisions (From User Story Review)

| Decision | Resolution |
|----------|------------|
| FlagId mutability | **Immutable** - no rename capability in editor |
| Changelog tracking | Only tracks `available` changes, not every edit |
| User preference | **Preserved** in localStorage, respects `available` state |
| Console location | **Experience Console** - Instance cardinality, use TypeSelector |

---

## Execution Architecture

### Sub-Phases

```
Phase 1: Schema & Types
├── 1a: Create FeatureFlagPayload interface
│   └── GATE: Type exports, no build errors
├── 1b: Add 'feature-flag' to GroveObjectType
│   └── GATE: Type union updated
└── 1c: Create changelog type
    └── GATE: Build passes

Phase 2: Data Layer
├── 2a: Create Supabase migration (feature_flags table)
│   └── GATE: Migration applies successfully
├── 2b: Create useFeatureFlagsData hook (CollectionDataResult)
│   └── GATE: Hook returns data, loading, error states
├── 2c: Create flag transforms (row ↔ GroveObject)
│   └── GATE: Transform functions work bidirectionally
└── 2d: Modify useFeatureFlags consumer hook
    └── GATE: Reads from Supabase, falls back gracefully

Phase 3: Experience Console Integration
├── 3a: Add 'feature-flag' to TypeSelector
│   └── GATE: Type appears in dropdown
├── 3b: Create FeatureFlagCard component
│   └── GATE: Renders in isolation with mock data
├── 3c: Create FeatureFlagEditor component
│   └── GATE: Renders in isolation with mock data
└── 3d: Wire components to Experience Console
    └── GATE: Can create/edit/delete flags in UI

Phase 4: Header Integration
├── 4a: Create useHeaderFeatureFlags hook
│   └── GATE: Returns sorted, filtered flags for header
├── 4b: Update ExploreHeader to use hook
│   └── GATE: Header renders toggles from Supabase data
└── 4c: Verify user preference preservation
    └── GATE: localStorage overrides respected

Phase 5: Testing & Polish
├── 5a: Seed migration with existing flags
│   └── GATE: All current flags in Supabase
├── 5b: Empty state handling
│   └── GATE: Graceful UI when no flags
├── 5c: Error state handling
│   └── GATE: Errors display appropriately
└── 5d: Screenshot verification
    └── GATE: REVIEW.html updated
```

---

## File Organization

### New Files to Create

```
src/core/schema/
└── feature-flag.ts                     (Phase 1)

src/bedrock/consoles/ExperienceConsole/
├── FeatureFlagCard.tsx                 (Phase 3b)
├── FeatureFlagEditor.tsx               (Phase 3c)
└── transforms/
    └── feature-flag.transforms.ts      (Phase 2c)

src/hooks/
└── useHeaderFeatureFlags.ts            (Phase 4a)

supabase/migrations/
└── YYYYMMDDHHMMSS_create_feature_flags.sql  (Phase 2a)

docs/sprints/feature-flags-v1/
├── SPEC.md                             (This file)
├── DEVLOG.md                           (Create during execution)
└── REVIEW.html                         (Create at end)
```

### Files to Modify

```
src/core/schema/grove-object.ts         (Phase 1b) - Add 'feature-flag' type
src/bedrock/consoles/ExperienceConsole/
├── ExperienceConsole.config.ts         (Phase 3a) - Add type to config
├── index.ts                            (Phase 3d) - Wire new components
└── useExperienceData.ts                (Phase 3d) - Add flag handling
src/hooks/useFeatureFlags.ts            (Phase 2d) - Read from Supabase
src/surface/components/ExploreHeader.tsx (Phase 4b) - Use new hook
```

### Files to NEVER Modify

```
src/surface/components/Terminal/*
src/workspace/*
src/bedrock/nursery/*
```

---

## Data Schema

### FeatureFlagPayload

```typescript
interface FeatureFlagPayload {
  /** Unique immutable identifier (e.g., 'sprout-research') */
  flagId: string;

  /** Whether flag is available for use (admin kill switch) */
  available: boolean;

  /** Default state when user has no preference */
  defaultEnabled: boolean;

  /** Whether to show in Explore header */
  showInExploreHeader: boolean;

  /** Label text for header toggle */
  headerLabel: string | null;

  /** Sort order in header (lower = left) */
  headerOrder: number;

  /** Grouping category */
  category: 'experience' | 'research' | 'experimental' | 'internal';

  /** Availability change log */
  changelog: FlagChangelogEntry[];
}

interface FlagChangelogEntry {
  timestamp: string;
  field: 'available';
  oldValue: boolean;
  newValue: boolean;
  reason?: string;
}
```

### Supabase Table

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,      -- GroveObjectMeta
  payload JSONB NOT NULL,   -- FeatureFlagPayload
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for flag lookup
CREATE UNIQUE INDEX idx_feature_flags_flag_id
  ON feature_flags ((payload->>'flagId'));

-- RLS policy (authenticated admins only)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
```

---

## Build Gates

### After Every Sub-Phase
```bash
npm run build
npm run lint
```

### After Every Phase
```bash
npm run build && npm run lint && npm test
npm run dev
# Navigate to localhost:3000/foundation/experience
# Select "Feature Flag" from TypeSelector
# Interact → Screenshot → Save to docs/sprints/feature-flags-v1/screenshots/
# Update DEVLOG.md
# Then commit
```

---

## User Stories Reference

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-D001 | Create FeatureFlag Schema | P0 | S |
| US-D002 | Create Supabase Migration | P0 | S |
| US-D003 | Create useFeatureFlags Data Hook | P0 | M |
| US-D004 | Create useFeatureFlag Consumer Hook | P0 | S |
| US-D005 | Add FeatureFlag to TypeSelector | P0 | S |
| US-D006 | Create FeatureFlagCard Component | P0 | S |
| US-D007 | Create FeatureFlagEditor Component | P0 | M |
| US-D008 | Create useHeaderFeatureFlags Hook | P1 | S |
| US-D009 | Render Header Toggles from Flags | P1 | M |

Full acceptance criteria: [Notion](https://www.notion.so/2e6780a78eef8196a7a6cb064c3a092f)

---

## Dependencies (Verify in Phase 0)

| Dependency | Type | Verification |
|------------|------|--------------|
| GroveObject schema | Data model | `src/core/schema/grove-object.ts` exists |
| Experience Console | UI | Console renders at /foundation/experience |
| Supabase connection | Backend | VITE_SUPABASE_URL configured |
| createBedrockConsole factory | Pattern | Factory function exists |

---

## Success Criteria

### Sprint Complete When:
- [ ] All sub-phases completed with verification
- [ ] All DEX compliance matrix cells verified
- [ ] All build gates passing
- [ ] Screenshot evidence for all visual verifications
- [ ] FROZEN ZONE untouched
- [ ] DEVLOG.md documents complete journey
- [ ] Consumer hook reads from Supabase
- [ ] Header toggles render from flag data

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase completed without screenshot
- DEX compliance test fails
- Consumer hook breaks existing flag reads
- User preferences lost during migration

---

*This contract is binding. Deviation requires explicit human approval.*
