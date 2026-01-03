# Repository Audit: Prompt Editor Standardization

**Sprint:** prompt-editor-standardization-v1  
**Date:** 2025-01-03  
**Scope:** Bedrock PromptEditor UI standardization

## Executive Summary

The PromptEditor diverges from the reference LensEditor implementation in layout, component usage, and state management patterns. This audit documents current state and confirms isolation from Genesis/Terminal consumption paths.

## Affected Files

### Primary Target
| File | Lines | Purpose | Change Type |
|------|-------|---------|-------------|
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | 490 | Prompt inspector/editor | REFACTOR |

### Reference Implementation
| File | Lines | Purpose | Role |
|------|-------|---------|------|
| `src/bedrock/consoles/LensWorkshop/LensEditor.tsx` | 454 | Lens inspector/editor | REFERENCE |

### Supporting Files (Read Only)
| File | Purpose | Status |
|------|---------|--------|
| `src/bedrock/primitives/BedrockInspector.tsx` | Inspector wrapper | USE AS-IS |
| `src/bedrock/primitives/GlassButton.tsx` | Button primitive | USE AS-IS |
| `src/shared/layout/InspectorPanel.tsx` | Panel + Section primitives | USE AS-IS |
| `src/bedrock/patterns/console-factory.types.ts` | Contract types | REFERENCE |
| `src/bedrock/types/console.types.ts` | Console config types | REFERENCE |

### Explicitly NOT Touched (Strangler Fig)
| File | Reason |
|------|--------|
| `src/surface/pages/GenesisPage.tsx` | Genesis landing - consumes via Terminal |
| `src/surface/components/KineticStream/*` | Terminal experience - consumes via hooks |
| `src/explore/hooks/usePromptSuggestions.ts` | Prompt consumption - reads from data layer |
| `src/explore/utils/scorePrompt.ts` | Scoring algorithm - independent of UI |
| `src/core/schema/prompt.ts` | Schema definition - stable contract |
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | Data layer - no UI changes |

## Pattern Gap Analysis

### LensEditor (Reference) vs PromptEditor (Current)

| Aspect | LensEditor | PromptEditor | Gap |
|--------|------------|--------------|-----|
| **Layout** | Single scroll + `InspectorSection` groups | Tabs (Content/Targeting/Sequences/Stats) | HIGH |
| **Actions** | Fixed footer with GlassButton | Header with custom buttons | HIGH |
| **Components** | `InspectorSection`, `InspectorDivider`, `GlassButton` | Mix of custom and primitives | MEDIUM |
| **State** | Uses `hasChanges` from factory props | Duplicate `isDirty` local state | MEDIUM |
| **Collapsible** | Sections with `collapsible` + `defaultCollapsed` | No collapsible sections | MEDIUM |
| **Persistence** | `patchPayload()` + `patchMeta()` helpers | Blur-based with local state buffer | LOW |

### Current PromptEditor Tab Structure
```
Tab: Content
├── Title (meta.title)
├── Description (meta.description)  
├── Execution Prompt (payload.executionPrompt)
├── System Context (payload.systemContext)
├── Variant selector (payload.variant)
├── Base Weight slider (payload.baseWeight)
└── Tags (meta.tags)

Tab: Targeting
├── Stages multi-select
├── Min Interactions
├── Min Confidence
├── Entropy Window
└── Lens IDs

Tab: Sequences
├── Sequence group badges
└── Position in sequence

Tab: Stats
├── Impressions
├── Selections
├── Completions
└── Avg Entropy Delta
```

### Proposed Section Structure (LensEditor Pattern)
```
Section: Identity (non-collapsible)
├── Title + Description
├── Status toggle (active/draft)
└── Variant selector

Section: Execution (non-collapsible)
└── Main execution prompt textarea

Section: Source & Weight (non-collapsible)
├── Source badge (read-only)
├── Base Weight slider
└── Tags

Section: Targeting (collapsible, default open)
├── Stages
├── Interaction requirements
└── Confidence/Entropy

Section: Sequences (collapsible, default collapsed)
└── Sequence memberships display

Section: Performance (collapsible, default collapsed)
└── Stats grid

Section: Metadata (non-collapsible)
└── Created/Updated/ID
```

## Bedrock Contract Verification

### ObjectEditorProps<T> Contract
```typescript
interface ObjectEditorProps<T> {
  object: GroveObject<T>;           // ✓ Used correctly
  onEdit: (ops: PatchOperation[]) => void;  // ✓ Maps to handleEdit
  onSave: () => void;               // ✓ Available
  onDelete: () => void;             // ✓ Available
  onDuplicate: () => void;          // ✓ Available
  loading: boolean;                  // ✓ Used for button states
  hasChanges: boolean;              // ⚠️ Duplicate local state exists
}
```

### InspectorSection Contract (from LensEditor usage)
```typescript
interface InspectorSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;        // Optional collapse behavior
  defaultCollapsed?: boolean;   // Initial collapsed state
}
```

**Note:** The `collapsible` and `defaultCollapsed` props are used in LensEditor but the base `InspectorSection` in `shared/layout/InspectorPanel.tsx` doesn't implement them. LensEditor must have a local enhanced version or these are passed but unused. Need to verify.

### GlassButton Usage
LensEditor footer pattern:
```tsx
<div className="flex items-center gap-2">
  <GlassButton
    variant="primary"
    onClick={handleSave}
    disabled={!hasChanges}
  >
    {hasChanges ? 'Save Changes' : 'Saved'}
  </GlassButton>
  <GlassButton variant="ghost" icon="content_copy" onClick={onDuplicate} />
  <GlassButton variant="danger" icon="delete" onClick={handleDelete} />
</div>
```

## Data Flow Isolation Verification

### PromptEditor (Admin) Path
```
User → PromptEditor.tsx
         ↓ onEdit(PatchOperation[])
       usePromptData.ts
         ↓ update(id, ops)
       useGroveData<PromptPayload>
         ↓ PATCH
       Supabase grove_objects table
```

### Terminal (Consumer) Path - COMPLETELY SEPARATE
```
ExploreShell.tsx
  ↓ context
usePromptSuggestions.ts
  ↓ useGroveData<PromptPayload>
scorePrompt.ts (scoring)
  ↓ scored prompts
KineticWelcome.tsx (display)
```

### Genesis Path - COMPLETELY SEPARATE
```
GenesisPage.tsx
  ↓ externalQuery (string)
Terminal component
  ↓ lens-reactive content
QuantumInterface hooks
```

**Conclusion:** UI refactor is 100% isolated from consumption paths.

## Technical Debt Identified

1. **Duplicate dirty state:** PromptEditor maintains local `isDirty` while factory provides `hasChanges`
2. **Tab navigation:** Hides content, forces context switching
3. **Custom button styling:** Doesn't use GlassButton consistently
4. **Missing collapsible sections:** Advanced features always visible
5. **No InspectorSection usage:** Custom div structure instead of primitives

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing edit flows | LOW | HIGH | Test each field before/after |
| Stats display regression | LOW | MEDIUM | Preserve 2x2 grid in section |
| Sequence display changes | LOW | LOW | Read-only display, no edit logic |
| Genesis/Terminal affected | NONE | N/A | Separate data flow verified |

## Dependencies

- `InspectorSection` with collapsible support (verify implementation)
- `GlassButton` component (exists, no changes)
- `InspectorDivider` (exists, no changes)
