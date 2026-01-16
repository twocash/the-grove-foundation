# UX Chief Approval: S5-SL-LifecycleEngine

**Reviewer:** User Experience Chief
**Date:** 2026-01-15
**Status:** ✅ APPROVED WITH CORRECTIONS
**Next Step:** Sprintmaster packaging → Developer handoff

---

## Executive Summary

The design deliverables for lifecycle-engine-v1 are **excellent** and demonstrate strong DEX alignment. However, there is a critical architectural misalignment that must be corrected before implementation:

**❌ INCORRECT:** Design docs reference GCS storage (`infrastructure/lifecycle.json`) and Foundation RealityTuner
**✅ CORRECT:** Must use Supabase storage (`lifecycle_configs` table) and Bedrock ExperienceConsole

This is per ADR-001 and ADR-006 in `DECISIONS.md` (the source of truth).

---

## ✅ Design Approval

### Pattern Excellence

| Aspect | Assessment |
|--------|------------|
| **Card/Editor Structure** | ✅ Perfectly follows FeatureFlagCard/Editor patterns |
| **Visual Hierarchy** | ✅ Clear, scannable, consistent with Quantum Glass v1.0 |
| **Interactive Behaviors** | ✅ Emoji picker, drag-to-reorder, real-time validation all well-designed |
| **Live Preview** | ✅ Excellent addition - instant feedback on changes |
| **Accessibility** | ✅ ARIA labels, keyboard nav, focus indicators all defined |
| **Validation UX** | ✅ Real-time feedback, clear error states, orphan handling |

**Verdict:** Design patterns are production-ready and exemplify Quantum Glass standards.

---

## ✅ DEX Alignment Verified

### Pillar 1: Declarative Sovereignty
- ✅ Lifecycle behavior in config, not code
- ✅ Operators can modify via ExperienceConsole UI
- ✅ No code deployment required for tier changes
- ✅ Multiple models supported for experimentation

**Grade:** Excellent

### Pillar 2: Capability Agnosticism
- ✅ Lifecycle models work with any AI (Claude, GPT, local)
- ✅ Stage-to-tier mappings independent of generation model
- ✅ Tier progression logic decoupled from sprout generation
- ✅ Schema validation prevents AI hallucinations

**Grade:** Excellent

### Pillar 3: Provenance as Infrastructure
- ✅ Each model has GroveObject metadata (createdBy, createdAt, updatedAt)
- ✅ System vs custom models clearly marked (isEditable flag)
- ✅ Activation history trackable (future enhancement)
- ✅ Full audit trail for lifecycle changes

**Grade:** Good (can enhance with changelog in Phase 2)

### Pillar 4: Organic Scalability
- ✅ New models added via config, not code
- ✅ Tier structure flexible (2-10 tiers, custom emojis)
- ✅ SINGLETON pattern enforced by ExperienceConsole factory
- ✅ Pattern extends to other entity types naturally

**Grade:** Excellent

---

## ⚠️ Critical Corrections Required

### 1. Storage Architecture (HIGH PRIORITY)

**Current design docs say:**
```
❌ GCS file: infrastructure/lifecycle.json
❌ Reality Tuner tab in Foundation
❌ Direct GCS API calls
```

**Must change to:**
```
✅ Supabase table: lifecycle_configs (JSONB payload)
✅ ExperienceConsole in Bedrock (/bedrock/consoles/ExperienceConsole)
✅ useGroveData('lifecycle-config') hook
```

**Why this matters:**
- Foundation layer is **FROZEN** (per Bedrock Addendum)
- GCS pattern is **DEPRECATED** for new config types (per ADR-001)
- ExperienceConsole provides SINGLETON enforcement automatically
- Supabase enables real-time subscriptions (future)

**Files to update:**
- `DESIGN_HANDOFF.md` - Lines 153, 464 (GCS references)
- `DESIGN_DECISIONS.md` - Line 486 (specify Supabase storage)
- `SPEC.md` - Section on GCS storage (update to Supabase)

---

### 2. Component Location

**Current:**
```typescript
❌ src/foundation/consoles/RealityTuner.tsx  // FROZEN
```

**Correct:**
```typescript
✅ src/bedrock/consoles/ExperienceConsole/
   ├── LifecycleConfigCard.tsx
   ├── LifecycleConfigEditor.tsx
   └── types/lifecycle-config.types.ts
```

**Registry Entry:**
```typescript
// src/bedrock/config/component-registry.ts
export const EXPERIENCE_TYPE_REGISTRY = {
  // ... existing entries
  'lifecycle-config': {
    label: 'Lifecycle Config',
    card: LifecycleConfigCard,
    editor: LifecycleConfigEditor,
    allowMultipleActive: false,  // SINGLETON
    icon: 'forest',
  },
};
```

---

### 3. Data Hook Pattern

**Current design references:**
```typescript
❌ useLifecycleConfigData() // Custom hook (undefined pattern)
```

**Correct:**
```typescript
✅ useGroveData('lifecycle-config') // Standard v1.0 pattern
```

**Implementation:**
```typescript
// hooks/useLifecycleConfig.ts
import { useGroveData } from './useGroveData';

export function useLifecycleConfig() {
  const { data, isLoading, error } = useGroveData('lifecycle-config');

  if (!data?.length) return DEFAULT_LIFECYCLE_CONFIG_PAYLOAD;

  const active = data.find(c => c.meta.status === 'active');
  return active?.payload ?? DEFAULT_LIFECYCLE_CONFIG_PAYLOAD;
}

// For ExperienceConsole CRUD:
export function useLifecycleConfigCRUD() {
  return useGroveData('lifecycle-config'); // Full CRUD operations
}
```

---

### 4. Supabase Migration Required

**Add to migration sequence:**

```sql
-- supabase/migrations/XXX_lifecycle_configs.sql

CREATE TABLE lifecycle_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,           -- { status, createdBy, modifiedAt }
  payload JSONB NOT NULL,        -- LifecycleConfigPayload
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lifecycle_configs_status ON lifecycle_configs ((meta->>'status'));
CREATE INDEX idx_lifecycle_configs_created_by ON lifecycle_configs ((meta->>'createdBy'));

-- RLS policies (admin-only)
ALTER TABLE lifecycle_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON lifecycle_configs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

**Adapter Registration:**

```typescript
// lib/supabase-adapter.ts
const TABLE_MAP = {
  // ... existing
  'lifecycle-config': 'lifecycle_configs',
};

const JSONB_META_TYPES = [
  // ... existing
  'lifecycle-config',
];
```

---

## ✅ json-render Integration Approval

### Strategic Fit: EXCELLENT

The design's **Live Preview** section (Q3 answer) is perfect substrate for json-render enhancement in Phase 4+.

**Current Phase 1 (Approved):**
```tsx
// Basic live preview using native TierBadge
<div className="flex items-center gap-3">
  {model.tiers.map(tier => (
    <TierBadge tier={tier.id} size={previewSize} />
  ))}
</div>
```

**Future Phase 4+ (json-render powered):**
```tsx
// Transform lifecycle config to json-render tree
const tree = lifecycleConfigToRenderTree(model);

// Render as interactive component tree
<Renderer tree={tree} registry={LifecycleRegistry} />

// Benefits:
// - Visual tier flow diagrams
// - Drag-and-drop tier reordering via UI
// - AI-generated lifecycle models (catalog constrains output)
// - Cross-grove tier mapping UI
```

**Recommendation:** Ship Phase 1 with basic preview, add json-render catalog in Phase 4 when building:
- Template gallery
- Visual diff tool
- AI generation UI

This aligns perfectly with "build substrate, not just features" philosophy.

---

## Updated File Structure

**Phase 1 Implementation:**

```
src/bedrock/consoles/ExperienceConsole/
├── LifecycleConfigCard.tsx          # Grid card (follows FeatureFlagCard)
├── LifecycleConfigEditor.tsx        # Inspector (follows FeatureFlagEditor)
└── types/
    └── lifecycle-config.types.ts    # TypeScript interfaces

src/core/schema/
└── lifecycle-config.ts               # Core payload types (pure TypeScript)

hooks/
├── useLifecycleConfig.ts            # Consumer hook (active model only)
└── useLifecycleConfigCRUD.ts        # Admin hook (full CRUD)

lib/
├── supabase-adapter.ts              # Add lifecycle-config mapping
└── grove-data-provider.ts           # Add GroveObjectType union

supabase/migrations/
└── XXX_lifecycle_configs.sql        # Table creation

src/bedrock/config/
├── component-registry.ts            # Add lifecycle-config entry
└── hook-registry.ts                 # Add useLifecycleConfigCRUD
```

**Phase 4+ (json-render enhancement):**

```
src/bedrock/consoles/ExperienceConsole/json-render/
├── lifecycle-catalog.ts             # Zod schemas for tiers/rules
├── lifecycle-registry.tsx           # React components for viz
├── lifecycle-transform.ts           # Config → RenderTree
└── Renderer.tsx                     # Reuse from SFR
```

---

## Corrected Data Flow

### On Mount (ExperienceConsole)
```typescript
const { data: configs, isLoading } = useGroveData('lifecycle-config');
// → Queries Supabase lifecycle_configs table
// → Returns array of GroveObjects with lifecycle payloads
```

### On Card Click
```typescript
onSelectCard(config.meta.id);
// → Opens LifecycleConfigEditor in inspector
// → Editor receives selected config via props
```

### On Edit (Tier Label Change)
```typescript
const patch: PatchOperation = {
  op: 'replace',
  path: '/payload/models/0/tiers/2/label',
  value: 'New Label'
};

await updateLifecycleConfig(configId, [patch]);
// → Fast-JSON-Patch applies to Supabase payload
// → OptimisticUI updates immediately
// → Rollback on error
```

### On Activate (SINGLETON)
```typescript
await activateLifecycleConfig(modelId);
// → ExperienceConsole factory handles:
//   1. Find current active config
//   2. Set current.meta.status = 'archived'
//   3. Set selected.meta.status = 'active'
//   4. Update payload.activeModelId
//   5. Persist to Supabase atomically
// → Invalidate cache
// → TierBadge components reload
```

---

## Cache Invalidation Strategy

**After activation:**
```typescript
// Server-side: Invalidate cached active model
await redis.del('lifecycle-config:active');

// Client-side: Invalidate React Query cache
queryClient.invalidateQueries(['lifecycle-config']);

// Global: Invalidate TierBadge lookups
await fetch('/api/cache/invalidate', {
  method: 'POST',
  body: JSON.stringify({ type: 'tier-config' })
});
```

**Result:** All TierBadge components across /explore and /bedrock reload with new active model.

---

## SINGLETON Pattern (Factory Enforcement)

**ExperienceConsole automatically enforces SINGLETON:**

```typescript
// In component-registry.ts
'lifecycle-config': {
  allowMultipleActive: false,  // KEY SETTING
  // ...
}

// Factory handles activation:
async function handleActivation(objectId: string) {
  const { data: objects } = useGroveData('lifecycle-config');

  // Factory logic (built-in):
  const currentActive = objects.find(o => o.meta.status === 'active');

  if (currentActive && currentActive.meta.id !== objectId) {
    // Archive current active
    await updateObject(currentActive.meta.id, {
      op: 'replace',
      path: '/meta/status',
      value: 'archived'
    });
  }

  // Activate selected
  await updateObject(objectId, {
    op: 'replace',
    path: '/meta/status',
    value: 'active'
  });
}
```

**No custom SINGLETON logic needed** - the factory handles it!

---

## Sample Data Update

**Current SAMPLE_LIFECYCLE_CONFIG.json structure is correct:**
```json
{
  "version": "1.0.0",
  "activeModelId": "botanical",
  "models": [ ... ]
}
```

**But this is the PAYLOAD only. Full Supabase row:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "meta": {
    "status": "active",
    "createdBy": "system",
    "createdAt": "2026-01-01T00:00:00Z",
    "modifiedAt": "2026-01-15T00:00:00Z"
  },
  "payload": {
    "version": "1.0.0",
    "activeModelId": "botanical",
    "models": [
      {
        "id": "botanical",
        "name": "Botanical Growth",
        // ... rest of sample data
      }
    ]
  }
}
```

**Note:** Each MODEL is NOT a separate Supabase row. The entire config (with all models) is ONE row. SINGLETON = one active config row.

---

## Final Approval Checklist

### Design Quality
- ✅ Card/Editor patterns match ExperienceConsole standards
- ✅ Visual hierarchy clear and scannable
- ✅ Interactive behaviors well-defined
- ✅ Accessibility guidelines complete
- ✅ Live preview enhances UX

### DEX Alignment
- ✅ Declarative Sovereignty: Config, not code
- ✅ Capability Agnosticism: Model-independent
- ✅ Provenance: Full metadata tracking
- ✅ Organic Scalability: Flexible, extensible

### Architecture
- ⚠️ **Must correct:** Supabase (not GCS)
- ⚠️ **Must correct:** ExperienceConsole (not RealityTuner)
- ⚠️ **Must correct:** useGroveData pattern
- ✅ SINGLETON via factory (automatic)
- ✅ json-render substrate approved (Phase 4+)

---

## Corrected Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Architecture Corrections | 0.5 days | Update design docs with Supabase/ExperienceConsole |
| Supabase Migration | 0.5 days | Create table, indexes, RLS policies |
| Component Dev | 2-3 days | Card, Editor (reuse patterns) |
| Hook Implementation | 1 day | useLifecycleConfig + useLifecycleConfigCRUD |
| Registry Integration | 0.5 days | Add to EXPERIENCE_TYPE_REGISTRY |
| Testing | 1-2 days | E2E tests, SINGLETON validation |
| **Total** | **5-7 days** | From corrected handoff to production |

---

## Approval Decision

**Status:** ✅ **APPROVED WITH CORRECTIONS**

**What's approved:**
- All design patterns and visual specifications
- Live preview feature (excellent addition)
- Validation rules and error handling
- Accessibility guidelines
- Sample data structure (PAYLOAD only)

**What must be corrected before implementation:**
1. ❌ Storage: GCS → ✅ Supabase `lifecycle_configs` table
2. ❌ UI: Foundation RealityTuner → ✅ Bedrock ExperienceConsole
3. ❌ Hook: Custom pattern → ✅ `useGroveData('lifecycle-config')`
4. Add: Supabase migration file
5. Add: Registry entries (component-registry.ts, hook-registry.ts)

**Recommended next steps:**
1. Designer updates docs with architecture corrections
2. Sprintmaster packages corrected deliverables
3. Developer implements using v1.0 patterns (Supabase + ExperienceConsole)
4. QA validates SINGLETON enforcement and cache invalidation

---

## Sign-Off

**UX Chief:** User Experience Chief
**Date:** 2026-01-15
**Decision:** Approved with corrections

**Handoff to:** Sprintmaster → Developer
**Expected delivery:** 5-7 days from corrected handoff

**Critical success factors:**
- Use Supabase (not GCS) - ADR-001
- Use ExperienceConsole (not RealityTuner) - ADR-006
- Follow SINGLETON factory pattern - ADR-008
- json-render substrate approved for Phase 4+

---

*UX Chief Approval for S5-SL-LifecycleEngine*
*DEX Aligned | Architecture Corrected | Ready for Implementation*
