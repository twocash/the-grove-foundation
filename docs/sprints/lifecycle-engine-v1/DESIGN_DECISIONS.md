# Design Decisions: S5-SL-LifecycleEngine

## Sprint Context
**Sprint:** S5-SL-LifecycleEngine v1  
**Domain:** Bedrock ExperienceConsole  
**Designer:** UI/UX Designer  
**Reviewer:** UX Chief (pending)  
**Status:** Ready for Review  

---

## Design Questions: Answered

### Q1: Model Switching
**Question:** Should the editor allow switching between models in the same config, or should each model be a separate card?

**Answer:** **Each model is a separate card.**

**Rationale:**
1. **Pattern Consistency:** ExperienceConsole uses one-object-per-card pattern (feature flags, system prompts, etc.)
2. **Mental Model:** Users understand "select card → edit in inspector" flow
3. **Selection State:** Clear visual indication which model is being edited
4. **Favorites:** Users can favorite individual models for quick access
5. **Simplicity:** No complex model picker UI needed in editor

**Implementation:**
- Each `LifecycleModel` gets its own `LifecycleConfigCard` in grid
- Clicking card opens `LifecycleConfigEditor` for that specific model
- Active model has green status bar, draft has amber, archived has gray
- Grid supports filtering: "Show Active", "Show Drafts", "Show Archived"

**Trade-offs:**
- ✅ Simpler UX, faster to implement
- ✅ Consistent with existing console patterns
- ❌ More cards in grid (but filterable)

---

### Q2: Tier Addition
**Question:** For custom models, should users be able to add/remove tiers, or only customize the 5 existing ones?

**Answer:** **Users can add/remove tiers (min 2, max 10).**

**Rationale:**
1. **Flexibility:** Different metaphors need different tier counts
   - Academic: 3 tiers (Draft → Reviewed → Published)
   - Botanical: 5 tiers (current default)
   - Research maturity: 7 tiers (very granular)
2. **Future-Proofing:** Enables experimentation with tier structures
3. **Constraint Safety:** Min/max bounds prevent edge cases
4. **System Protection:** System models (botanical) are locked at 5 tiers

**Implementation:**
- **System models:** Read-only table, 5 tiers locked
- **Custom models:** Editable table with drag-to-reorder
  - "Add Tier" button (enabled if <10 tiers)
  - Delete icon per row (enabled if >2 tiers)
  - Order recalculates automatically on drag
- **Validation:** Cannot save if <2 or >10 tiers
- **Stage mappings:** Must map all stages to valid tiers before save

**UI Affordances:**
```tsx
// Add button state
disabled={model.tiers.length >= 10}
title={model.tiers.length >= 10 ? 'Maximum 10 tiers' : 'Add a new tier'}

// Delete button state
disabled={model.tiers.length <= 2}
title={model.tiers.length <= 2 ? 'Minimum 2 tiers required' : 'Delete this tier'}
```

**Trade-offs:**
- ✅ Enables custom metaphors beyond 5 tiers
- ✅ Supports experimentation and A/B testing
- ❌ Slightly more complex validation logic
- ❌ Orphaned mappings need handling (if tier deleted)

**Orphaned Mapping Strategy:**
If user deletes a tier that has stage mappings:
1. Show confirmation modal: "3 stages are mapped to this tier. Deleting will unmap them."
2. On confirm, delete tier and remove mappings
3. Show validation warning: "3 stages not mapped"
4. Prevent save until remapped

---

### Q3: Preview
**Question:** Should the editor show a live preview of how TierBadge will render with current settings?

**Answer:** **Yes - include live preview in "Tier Definitions" section.**

**Rationale:**
1. **Immediate Feedback:** Users see how emojis/labels look as TierBadge components
2. **Size Testing:** Preview all sizes (sm/md/lg) to check readability
3. **Confidence:** Reduces "save and check" iteration cycles
4. **Educational:** Shows users what these settings actually control

**Implementation:**
Add preview subsection below tier table:

```tsx
<InspectorSection title="Tier Definitions">
  {/* Tier table... */}

  {/* Live Preview */}
  <div className="mt-4 p-4 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs text-[var(--glass-text-muted)] uppercase">
        Live Preview
      </span>
      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--glass-text-muted)]">Size:</label>
        <select
          value={previewSize}
          onChange={(e) => setPreviewSize(e.target.value)}
          className="text-xs px-2 py-1 rounded bg-[var(--glass-solid)] border border-[var(--glass-border)]"
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
    </div>

    {/* Badge row */}
    <div className="flex items-center gap-3 flex-wrap">
      {model.tiers
        .sort((a, b) => a.order - b.order)
        .map(tier => (
          <div key={tier.id} className="flex flex-col items-center gap-1">
            <TierBadge tier={tier.id} size={previewSize} />
            <span className="text-xs text-[var(--glass-text-muted)]">
              {tier.label}
            </span>
          </div>
        ))
      }
    </div>

    {/* Context */}
    <p className="text-xs text-[var(--glass-text-muted)] mt-3">
      Preview updates in real-time as you edit tier emojis and labels.
    </p>
  </div>
</InspectorSection>
```

**Preview Features:**
- Shows all tiers in order (left to right)
- Size selector (sm/md/lg) to test badge readability
- Updates instantly when emoji/label changes (no save required)
- Displays label below each badge for clarity

**Trade-offs:**
- ✅ Better UX, faster iteration
- ✅ Educational for new users
- ❌ Adds ~80 lines of code
- ❌ Slight performance cost (re-render badges on every keystroke)

**Performance Mitigation:**
Use `useMemo` to avoid re-rendering all badges:
```tsx
const previewBadges = useMemo(() => {
  return model.tiers
    .sort((a, b) => a.order - b.order)
    .map(tier => <TierBadge key={tier.id} tier={tier.id} size={previewSize} />);
}, [model.tiers, previewSize]);
```

---

### Q4: Import/Export
**Question:** Should there be a way to import/export lifecycle configs as JSON?

**Answer:** **Phase 1: No. Phase 2 (future): Yes.**

**Rationale:**

**Why defer to Phase 2:**
1. **Scope Control:** Phase 1 focus is core CRUD + Reality Tuner UI
2. **Admin Workaround:** Power users can edit `infrastructure/lifecycle.json` directly via GCS console
3. **Validation Complexity:** JSON import needs robust schema validation
4. **Security:** Need to validate uploaded JSON doesn't break prod
5. **UX Design:** Need file picker, error handling, preview modal - adds significant scope

**Phase 2 Implementation (Future):**
Add to Metadata section:

```tsx
<InspectorSection title="Import/Export" collapsible defaultCollapsed={true}>
  <div className="space-y-3">
    <p className="text-xs text-[var(--glass-text-muted)]">
      Export this model as JSON or import a model from a file.
    </p>

    {/* Export */}
    <GlassButton
      variant="ghost"
      size="sm"
      onClick={handleExport}
      className="w-full"
    >
      <span className="material-symbols-outlined text-sm mr-2">download</span>
      Export as JSON
    </GlassButton>

    {/* Import */}
    <div>
      <label
        htmlFor="import-file"
        className="block w-full px-3 py-2 text-sm text-center rounded-lg border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--neon-cyan)] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-lg">upload_file</span>
        <span className="ml-2">Import from JSON</span>
      </label>
      <input
        id="import-file"
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />
    </div>

    {/* Warning */}
    <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <span className="material-symbols-outlined text-amber-400 text-sm">warning</span>
      <p className="text-xs text-amber-300">
        Import will validate the JSON structure. Invalid files will be rejected.
      </p>
    </div>
  </div>
</InspectorSection>
```

**Import Flow (Phase 2):**
1. User selects JSON file
2. Parse and validate against `LifecycleModel` schema
3. Show preview modal with tier count, mappings summary
4. User confirms → creates new draft model from JSON
5. Validation errors → show detailed error message

**Export Flow (Phase 2):**
1. User clicks "Export as JSON"
2. Serialize current model to JSON
3. Download as `lifecycle-${model.id}.json`
4. Include version metadata for compatibility checks

**Trade-offs:**
- ✅ Phase 1: Faster delivery, less risk
- ✅ Phase 2: Advanced users satisfied with GCS workaround
- ❌ No GUI import/export initially (acceptable trade-off)

---

## Deliverable Summary

### 1. ✅ LifecycleConfigCard (Grid View)
**Status:** Wireframes complete  
**File:** `DESIGN_WIREFRAMES.md` → Component 1  

**Features:**
- Status bar (green/amber/gray for active/draft/archived)
- Icon using highest tier emoji
- Title + model ID
- Tier emoji preview (horizontal strip)
- State badges (system/custom, tier count, status)
- Favorite star button
- Follows FeatureFlagCard pattern exactly

**States Designed:**
- Active system model (green, locked)
- Draft custom model (amber, editable)
- Archived model (gray, read-only)

---

### 2. ✅ LifecycleConfigEditor (Inspector Panel)
**Status:** Wireframes complete  
**File:** `DESIGN_WIREFRAMES.md` → Component 2  

**Sections:**
1. **Status Banner** (conditional) - Shows active/draft/archived state
2. **Header** - Icon, title, ID, status badge
3. **Model Metadata** - Name, description, ID, editable status
4. **Tier Definitions** - Read-only table (system) or editable table with drag (custom)
5. **Stage-to-Tier Mappings** - Dropdown selector for each stage
6. **Live Preview** (NEW) - Real-time TierBadge rendering at all sizes
7. **Metadata** - Model stats (collapsed by default)
8. **Footer Actions** - Save/activate/duplicate/delete (state-dependent)

**Locked State Treatment (System Models):**
- Name/description fields: Display-only (no input fields)
- Tier table: Read-only with lock icons
- Stage mappings: Dropdowns disabled
- Footer: Only "Duplicate" button enabled
- Banner: "System Model — Duplicate to customize"

---

### 3. ✅ Empty State
**Status:** Wireframes complete  
**File:** `DESIGN_WIREFRAMES.md` → Component 3  

**Features:**
- Centered layout with icon + message
- "Seed Default Model" recovery button
- Admin-only (should never happen in prod)

---

### 4. ✅ Interactive Behaviors
**Status:** Documented  
**File:** `DESIGN_WIREFRAMES.md` → Interactive Behaviors  

**Defined:**
- Emoji picker overlay (popover with grid)
- Drag-to-reorder tiers (visual feedback, auto-recalc order)
- Real-time validation (unmapped stages, tier count)
- Activation flow (confirmation modal, status transitions)

---

### 5. ✅ Design System Compliance
**Status:** Documented  
**File:** `DESIGN_WIREFRAMES.md` → Design System Tokens  

**Tokens Defined:**
- Status colors (active/draft/archived)
- Editable badges (custom/system)
- Validation states (error bg/border/text)
- Typography scale (title, mono, labels)
- Spacing system (card, section, table)

**Standards:**
- Uses Quantum Glass tokens (--neon-green, --glass-void, Inter)
- Does NOT use Living Glass (v2 vision deferred)
- Matches FeatureFlagCard/Editor styling exactly

---

## Technical Notes for Developer

### Data Flow

```typescript
// On mount
const { models, activeModel, loading } = useLifecycleConfigData();

// On card click
onSelectCard(model.meta.id);
// → Opens LifecycleConfigEditor with selected model

// On edit (tier label change)
const patchOps: PatchOperation[] = [
  { op: 'replace', path: '/payload/models/0/tiers/2/label', value: 'New Label' }
];
onEdit(patchOps);
// → Updates local state, marks hasChanges = true

// On save
onSave();
// → Calls useLifecycleConfigData().update(modelId, patchOps)
// → Persists to GCS via API
// → Revalidates cache if active model

// On activate (draft → active)
activate(modelId);
// → Archives current active model
// → Sets selected model to active
// → Invalidates tier badge cache
// → Shows success toast
```

### Validation Rules

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateLifecycleModel(model: LifecycleModel): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Tier count
  if (model.tiers.length < 2) errors.push('Minimum 2 tiers required');
  if (model.tiers.length > 10) errors.push('Maximum 10 tiers allowed');

  // Tier IDs unique
  const tierIds = model.tiers.map(t => t.id);
  if (new Set(tierIds).size !== tierIds.length) {
    errors.push('Duplicate tier IDs found');
  }

  // Tier order sequential
  const orders = model.tiers.map(t => t.order).sort((a, b) => a - b);
  if (!orders.every((order, idx) => order === idx)) {
    warnings.push('Tier order should be sequential starting at 0');
  }

  // All stages mapped
  const SPROUT_STAGES = ['tender', 'rooting', 'sprouting', 'established', 'flourishing', 'mature'];
  const mappedStages = new Set(model.mappings.map(m => m.stage));
  const unmapped = SPROUT_STAGES.filter(s => !mappedStages.has(s));
  if (unmapped.length > 0) {
    errors.push(`${unmapped.length} stages not mapped: ${unmapped.join(', ')}`);
  }

  // Mappings reference valid tiers
  const validTierIds = new Set(tierIds);
  const invalidMappings = model.mappings.filter(m => !validTierIds.has(m.tierId));
  if (invalidMappings.length > 0) {
    errors.push('Some mappings reference non-existent tiers');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

### SINGLETON Pattern Enforcement

```typescript
// On activate
async function handleActivate(modelId: string) {
  const { models, activeModel, activate } = useLifecycleConfigData();

  // Find current active
  const currentActive = models.find(m => m.meta.status === 'active');

  // Confirm if switching
  if (currentActive && currentActive.meta.id !== modelId) {
    const confirmed = await showConfirmModal({
      title: 'Activate Lifecycle Model?',
      message: `
        This will:
        • Archive current active: "${currentActive.name}"
        • Activate "${models.find(m => m.meta.id === modelId)?.name}" as new lifecycle model
        • Update all tier badges immediately
      `,
      confirmLabel: 'Activate',
      cancelLabel: 'Cancel'
    });

    if (!confirmed) return;
  }

  // Perform activation
  await activate(modelId);
  // → Backend atomically:
  //   1. Sets current active.meta.status = 'archived'
  //   2. Sets selected model.meta.status = 'active'
  //   3. Updates config.activeModelId
  //   4. Persists to GCS

  // Invalidate cache
  await fetch('/api/cache/invalidate', {
    method: 'POST',
    body: JSON.stringify({ type: 'lifecycle-config' })
  });

  // Show success
  toast.success(`"${models.find(m => m.meta.id === modelId)?.name}" is now active`);
}
```

---

## DEX Alignment Check

### Declarative Sovereignty ✅
- Lifecycle configuration in JSON, not code
- Operators can modify via Reality Tuner UI
- No code deployment required for tier changes

### Capability Agnosticism ✅
- Lifecycle models are model-agnostic (Claude, GPT, local models)
- Stage-to-tier mappings work regardless of AI model generating sprouts
- Tier progression logic decoupled from sprout generation

### Provenance ✅
- Each model has metadata (created, updated)
- System models clearly marked (isEditable: false)
- Changelog can track activation history (Phase 2)

### Organic Scalability ✅
- Multiple models supported (botanical, academic, custom)
- New models added via config, not code
- Tier structure flexible (2-10 tiers, customizable emojis/labels)
- Pattern extends naturally to other entity types (documents, agents)

---

## UX Chief Review Checklist

### Pattern Consistency
- [ ] Matches ExperienceConsole card/editor patterns (FeatureFlag, SystemPrompt)
- [ ] Uses InspectorSection, GlassButton, BufferedInput primitives
- [ ] Status banners follow active/draft/archived convention
- [ ] Footer actions match state-dependent layout pattern

### DEX Principles
- [ ] Declarative sovereignty: Config in JSON, not code ✅
- [ ] Capability agnostic: Works with any AI model ✅
- [ ] Provenance: Model metadata tracked ✅
- [ ] Organic scalability: Multiple models, flexible tiers ✅

### Design System
- [ ] Uses Quantum Glass tokens (no Living Glass) ✅
- [ ] Typography follows Foundation theme (Inter, mono for IDs) ✅
- [ ] Spacing consistent with existing consoles ✅
- [ ] Colors use semantic tokens (--neon-cyan, --glass-border) ✅

### Accessibility
- [ ] ARIA labels on all interactive elements ✅
- [ ] Keyboard navigation defined (tab order, arrow keys) ✅
- [ ] Focus indicators use ring-2 ring-[var(--neon-cyan)] ✅
- [ ] Error states have both color + icon + text ✅

### Validation
- [ ] Cannot save with unmapped stages ✅
- [ ] Cannot save with <2 or >10 tiers ✅
- [ ] Real-time validation feedback (red borders, error badges) ✅
- [ ] Orphaned mapping handling (delete tier → unmap stages) ✅

### SINGLETON Pattern
- [ ] Only ONE model can be active at a time ✅
- [ ] Activation flow includes confirmation modal ✅
- [ ] Current active shown in draft banner ✅
- [ ] Cache invalidation on activation ✅

---

## Next Steps

1. **UX Chief Review** - Route to @ux-chief for DEX alignment check
2. **Developer Handoff** - If approved, assign to developer with:
   - `DESIGN_WIREFRAMES.md` (complete visual spec)
   - `DESIGN_DECISIONS.md` (this file, rationale + validation)
   - `SPEC.md` (technical implementation guide)
3. **Component Development** - Create Card/Editor components following patterns
4. **Data Hook** - Implement `useLifecycleConfigData()` CRUD operations
5. **GCS Integration** - Wire up to `infrastructure/lifecycle.json` storage
6. **Testing** - Validate SINGLETON pattern, validation rules, tier reordering

---

*Design Decisions for S5-SL-LifecycleEngine*  
*Ready for UX Chief Approval*
