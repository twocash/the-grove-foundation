# Design Handoff: S5-SL-LifecycleEngine

## For: UX Chief → DEX Review

---

## Quick Summary

**What:** Lifecycle configuration system for Reality Tuner (ExperienceConsole)  
**Why:** Enable operators to customize tier labels/emojis without code deployment  
**How:** GCS-backed JSON config + ExperienceConsole UI (card/editor pattern)  

**Status:** ✅ Wireframes complete, ready for DEX alignment review  
**Next:** UX Chief approval → Developer handoff → Implementation  

---

## Design Deliverables

### 1. ✅ DESIGN_WIREFRAMES.md
**What's inside:**
- Complete visual specifications for LifecycleConfigCard (grid view)
- Complete visual specifications for LifecycleConfigEditor (inspector panel)
- Empty state design
- Interactive behaviors (emoji picker, drag-to-reorder, validation)
- Design system tokens (colors, typography, spacing)
- Accessibility guidelines (ARIA, keyboard nav, focus indicators)
- Responsive behavior (desktop/tablet/mobile)
- Developer handoff notes (component files, data hooks, validation)

**Key sections:**
- Component 1: LifecycleConfigCard → Card in grid (3 states: active/draft/archived)
- Component 2: LifecycleConfigEditor → Inspector with 7 sections
- Component 3: Empty State → Recovery UI for missing default model
- Interactive Behaviors → Emoji picker, drag-to-reorder, validation feedback
- Design System Tokens → Complete color/typography/spacing spec

**Size:** ~600 lines, complete visual spec with code examples

---

### 2. ✅ DESIGN_DECISIONS.md
**What's inside:**
- Answers to 4 design questions from DESIGN_REVIEW_PROMPT.md
- Rationale and trade-offs for each decision
- Implementation details for each answer
- Deliverable summary (card/editor/empty state)
- Technical notes (data flow, validation rules, SINGLETON pattern)
- DEX alignment check (all 4 pillars verified)
- UX Chief review checklist

**Questions answered:**
1. **Model switching:** Each model = separate card (not in-editor switcher)
2. **Tier addition:** Yes, users can add/remove tiers (min 2, max 10) for custom models
3. **Preview:** Yes, live TierBadge preview in "Tier Definitions" section
4. **Import/Export:** Phase 1 = No, Phase 2 = Yes (deferred to reduce scope)

**Size:** ~450 lines, complete design rationale

---

### 3. ✅ SAMPLE_LIFECYCLE_CONFIG.json
**What's inside:**
- Complete lifecycle configuration with 4 models:
  - **botanical** (active, system, 5 tiers) - Default model
  - **academic-peer-review** (draft, custom, 7 tiers) - Example of custom model
  - **creative-project** (draft, custom, 5 tiers) - Alternative metaphor
  - **software-development** (archived, custom, 5 tiers) - Archived example
- Full tier definitions with emojis, labels, order, descriptions
- Complete stage-to-tier mappings for all 6 sprout stages
- Metadata for each model (created, updated, archived)

**Purpose:**
- Test data for render-json visualization
- Reference for frontend development
- Validation test cases
- Example of SINGLETON pattern (only 1 active)

**Size:** ~350 lines, well-structured JSON

---

### 4. ✅ RENDER_JSON_TEST.md
**What's inside:**
- Guide for using render-json (Vercel) to visualize config
- Alternative testing methods (jq, VS Code)
- What to look for (validation checks)
- Expected visualizations (tree structure)
- Interactive testing scenarios
- Developer use cases with code examples
- Data quality checklist

**Purpose:**
- Enable visual exploration of JSON structure
- Validate SINGLETON pattern, mappings, tier definitions
- Test card display logic with sample data
- Generate test cases for frontend

**Size:** ~300 lines, complete testing guide

---

## Design System Compliance

### ✅ Quantum Glass (v1.0)
**Used:**
- `--neon-green`, `--glass-void`, `--glass-border`, `--glass-solid`
- Inter font for UI, JetBrains Mono for code/IDs
- Standard spacing scale (px-4 py-3, gap-3, etc.)
- Semantic color tokens (green/amber/gray for status)

**NOT Used:**
- Living Glass tokens (v2 vision, deferred post-1.0)
- Custom fonts beyond Inter/Mono
- Non-standard spacing

**Reference:** `docs/sprints/sprout-tier-progression-v1/DESIGN_SYSTEM_STANDARDS.md`

---

## Pattern Consistency

### ✅ Matches ExperienceConsole Patterns

**Followed patterns from:**
- `FeatureFlagCard.tsx` → Card structure, status bar, favorite button, footer badges
- `FeatureFlagEditor.tsx` → Inspector layout, BufferedInput, InspectorSection
- `SystemPromptEditor.tsx` → Status banners, save/discard, active/draft/archived states

**Key pattern matches:**
1. **Card:**
   - 1px status bar at top (green/amber/gray)
   - Icon + title + ID layout
   - State badges in footer
   - Favorite star (top-right)
2. **Editor:**
   - Conditional status banner (active = green, draft = amber)
   - InspectorSection collapsible sections
   - Footer actions change based on status
   - BufferedInput for text fields (prevents race condition)
3. **Status handling:**
   - Active: Green banner, "Active Lifecycle Model" button when saved
   - Draft: Amber banner, "Activate This Model" button
   - Archived: Gray banner, "Restore as Draft" action

---

## DEX Alignment

### ✅ All 4 Pillars Verified

#### 1. Declarative Sovereignty
- **Evidence:** Tier config in JSON (`infrastructure/lifecycle.json`), not TypeScript
- **Operator control:** Edit via Reality Tuner UI, no code deployment
- **Declaration:** Tiers, emojis, labels, mappings all externalized
- **Sovereignty:** Operators own lifecycle metaphor, not constrained by hardcoded values

#### 2. Capability Agnosticism
- **Evidence:** Lifecycle models work regardless of AI model (Claude, GPT, local)
- **Decoupling:** Tier progression logic separate from sprout generation
- **Flexibility:** Same config supports any AI-generated sprouts
- **Future-proof:** New AI models slot in without config changes

#### 3. Provenance
- **Evidence:** Each model has metadata (createdAt, updatedAt, createdBy)
- **Tracking:** System vs custom models clearly marked (isEditable flag)
- **History:** Archived models retain archivedAt, archivedReason
- **Auditing:** Future: Changelog for activation history (Phase 2)

#### 4. Organic Scalability
- **Evidence:** Multiple models supported (botanical, academic, custom)
- **Growth:** New models added via config, not code
- **Flexibility:** Tier structure flexible (2-10 tiers, custom emojis/labels)
- **Extension:** Pattern extends to other entity types (documents, agents)

**Verdict:** ✅ Fully DEX-aligned, ready for production

---

## Critical Features

### 1. SINGLETON Pattern Enforcement
**Implementation:**
- Only ONE model can have `status: 'active'` at any time
- Activation flow:
  1. User clicks "Activate This Model" on draft
  2. Confirmation modal shows current active will be archived
  3. On confirm: current active → archived, selected draft → active
  4. Config updates atomically in GCS
  5. Cache invalidated for tier badge updates

**UI Affordances:**
- Active model: Green pulsing status banner, "Active Lifecycle Model" button
- Draft banner shows: "Draft — Active: [current active name] ([id])"
- Activation disabled if model has unsaved changes

**Validation:**
- Backend enforces: EXACTLY 1 active model at all times
- Frontend validates: Cannot activate with unmapped stages or tier count errors

---

### 2. System Model Protection
**Implementation:**
- Default "botanical" model has `isEditable: false`
- Read-only fields:
  - Name/description: Display-only (no input fields)
  - Tier table: Read-only with lock icons
  - Stage mappings: Dropdowns disabled
- Lock indicator: "🔒 System Model — Duplicate to customize"

**UI Affordances:**
- System models: Gray locked badges, no edit controls
- Custom models: Blue editable badges, emoji picker, inline editing
- Duplicate button: Creates editable copy of system model

---

### 3. Real-Time Validation
**Rules enforced:**
- Min 2 tiers, max 10 tiers
- All 6 sprout stages mapped
- No duplicate tier IDs
- All mappings reference valid tiers
- Tier order sequential (0, 1, 2, ...)

**UI Feedback:**
- Unmapped stages: Red border on dropdown, error badge at bottom
- Tier count: Disable "Add Tier" at 10, disable "Delete" at 2
- Invalid mappings: Show warning icon, cannot save
- Real-time: Validation updates on every change (debounced)

---

### 4. Live Preview
**Feature:** Real-time TierBadge rendering in editor

**Implementation:**
```tsx
<div className="mt-4 p-4 rounded-lg bg-[var(--glass-surface)]">
  <div className="flex items-center gap-3">
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
</div>
```

**Benefits:**
- Instant feedback on emoji/label changes
- Test badge readability at different sizes (sm/md/lg)
- No save-and-check iteration needed
- Educational for new users

---

## Edge Cases Handled

### 1. Orphaned Mappings (Tier Deleted)
**Scenario:** User deletes a tier that has stage mappings

**Handling:**
1. Confirmation modal: "3 stages mapped to this tier. Deleting will unmap them."
2. On confirm: Delete tier + remove mappings
3. Validation error: "3 stages not mapped"
4. Save disabled until remapped

---

### 2. Missing Default Model
**Scenario:** No lifecycle configs exist (seed failed)

**Handling:**
- Empty state UI with "No Lifecycle Configurations Found" message
- "Seed Default Model" recovery button
- Admin-only action (shouldn't happen in prod)
- Creates default botanical model with 5 tiers

---

### 3. Concurrent Activation
**Scenario:** Two users activate different models simultaneously

**Handling:**
- Backend uses atomic transaction (GCS write with precondition)
- Last write wins, previous active → archived
- Frontend refetches data after activation
- Optimistic UI with rollback on error

---

### 4. Invalid Emoji Characters
**Scenario:** User pastes unsupported emoji or text

**Handling:**
- Emoji picker: Only shows supported emojis
- Direct input: Validate Unicode range
- Invalid characters: Show warning, revert to previous valid emoji
- Fallback: System defaults if corruption detected

---

## Performance Considerations

### 1. Debounced Inputs
**Implementation:** Use BufferedInput (400ms debounce)

**Benefit:**
- Prevents race condition where rapid typing loses characters
- Reduces patch operations (fewer API calls)
- Smoother UX (no lag on every keystroke)

---

### 2. Optimistic UI
**Implementation:**
- Local state updates immediately
- Show loading spinner during save
- Rollback on error with toast notification

**Benefit:**
- Feels instant to user
- Clear feedback on save/error
- No blocking on network latency

---

### 3. Memoized Preview
**Implementation:**
```tsx
const previewBadges = useMemo(() => {
  return model.tiers
    .sort((a, b) => a.order - b.order)
    .map(tier => <TierBadge key={tier.id} tier={tier.id} size={previewSize} />);
}, [model.tiers, previewSize]);
```

**Benefit:**
- Avoid re-rendering all badges on every keystroke
- Only re-render when tiers or size changes
- Keeps editor responsive during editing

---

### 4. Cache Invalidation
**Implementation:**
```typescript
// After activating a model
await fetch('/api/cache/invalidate', {
  method: 'POST',
  body: JSON.stringify({ type: 'lifecycle-config' })
});
```

**Benefit:**
- /explore immediately sees new active model
- TierBadge components reload with new config
- No stale data in production

---

## Accessibility Checklist

### ✅ ARIA Labels
- All buttons: `aria-label` with clear action description
- Emoji picker: `aria-label="Change emoji for {tier.label}"`
- Dropdowns: `aria-label="Map {stage.label} to tier"`
- Drag handles: `role="button" aria-label="Drag to reorder tier"`

### ✅ Keyboard Navigation
- Tab order: Name → Description → Tier table → Mapping table → Actions
- Tier table: Arrow keys navigate cells, Enter to edit
- Emoji picker: Arrow keys navigate grid, Enter/Space to select
- Drag & drop: Space to grab, Arrow keys to move, Space to drop

### ✅ Focus Indicators
```css
focus:outline-none
focus:ring-2
focus:ring-[var(--neon-cyan)]
focus:ring-offset-2
focus:ring-offset-[var(--glass-void)]
```

### ✅ Screen Reader Support
- Status banners: Announced on load
- Validation errors: Live region updates
- Save confirmation: Toast with `role="status"`
- Modal dialogs: Focus trap with Esc to close

---

## UX Chief Review Checklist

### Pattern Consistency
- [ ] Matches FeatureFlagCard structure (status bar, icon, footer)
- [ ] Matches FeatureFlagEditor layout (sections, BufferedInput, footer actions)
- [ ] Status banners follow SystemPromptEditor pattern (active/draft/archived)
- [ ] Uses existing primitives (InspectorSection, GlassButton, BufferedInput)

### DEX Alignment
- [ ] Declarative sovereignty: Config in JSON, not code ✅
- [ ] Capability agnostic: Works with any AI model ✅
- [ ] Provenance: Model metadata tracked ✅
- [ ] Organic scalability: Multiple models, flexible tiers ✅

### Design System
- [ ] Uses Quantum Glass tokens (no Living Glass) ✅
- [ ] Typography follows Foundation theme ✅
- [ ] Spacing consistent with existing consoles ✅
- [ ] Colors use semantic tokens ✅

### Accessibility
- [ ] ARIA labels on all interactive elements ✅
- [ ] Keyboard navigation defined ✅
- [ ] Focus indicators consistent ✅
- [ ] Error states have color + icon + text ✅

### Validation
- [ ] Cannot save with unmapped stages ✅
- [ ] Cannot save with <2 or >10 tiers ✅
- [ ] Real-time validation feedback ✅
- [ ] Orphaned mapping handling ✅

### SINGLETON Pattern
- [ ] Only ONE active model at a time ✅
- [ ] Activation flow with confirmation ✅
- [ ] Current active shown in draft banner ✅
- [ ] Cache invalidation on activation ✅

---

## Developer Handoff Checklist

When approved, hand off these files to developer:

### Design Files
- [ ] `DESIGN_WIREFRAMES.md` - Complete visual specifications
- [ ] `DESIGN_DECISIONS.md` - Rationale and trade-offs
- [ ] `SAMPLE_LIFECYCLE_CONFIG.json` - Test data
- [ ] `RENDER_JSON_TEST.md` - Testing guide

### Reference Files
- [ ] `DESIGN_REVIEW_PROMPT.md` - Original requirements
- [ ] `SPEC.md` - Technical implementation spec
- [ ] `ARCHITECTURE.md` - System architecture (if exists)

### Component Files to Create
```
src/bedrock/consoles/ExperienceConsole/
├── LifecycleConfigCard.tsx          (grid card)
├── LifecycleConfigEditor.tsx        (inspector panel)
├── LifecycleConfig.types.ts         (TypeScript types)
├── LifecycleConfig.config.ts        (constants, stage defs)
└── useLifecycleConfigData.ts        (data hook for CRUD)
```

### Data Hook API
```typescript
export function useLifecycleConfigData() {
  return {
    // Queries
    models: LifecycleModel[];
    activeModel: LifecycleModel | null;
    loading: boolean;
    error: Error | null;

    // Mutations
    activate: (modelId: string) => Promise<void>;
    update: (modelId: string, ops: PatchOperation[]) => Promise<void>;
    create: (model: Partial<LifecycleModel>) => Promise<LifecycleModel>;
    delete: (modelId: string) => Promise<void>;
    duplicate: (modelId: string) => Promise<LifecycleModel>;
  };
}
```

---

## Open Questions (If Any)

### None - Design is Complete

All 4 design questions from DESIGN_REVIEW_PROMPT.md have been answered:
1. ✅ Model switching: Separate cards (not in-editor switcher)
2. ✅ Tier addition: Yes (min 2, max 10) for custom models
3. ✅ Preview: Yes (live TierBadge preview)
4. ✅ Import/Export: Phase 1 = No, Phase 2 = Yes

---

## Risk Assessment

### Low Risk
- ✅ Follows existing patterns (minimal new UI paradigms)
- ✅ Uses existing primitives (InspectorSection, GlassButton, etc.)
- ✅ Clear validation rules (well-defined constraints)
- ✅ Sample data available (SAMPLE_LIFECYCLE_CONFIG.json)

### Medium Risk
- ⚠️ SINGLETON pattern enforcement (requires backend atomicity)
- ⚠️ Cache invalidation timing (could cause brief stale data)
- ⚠️ Orphaned mapping handling (user might not understand warning)

### Mitigation
- **SINGLETON:** Use GCS atomic writes with precondition checks
- **Cache:** Aggressive invalidation + cache busting headers
- **Orphaned:** Clear confirmation modal with specific stage names

---

## Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| UX Chief Review | 1 day | DEX alignment, pattern check, approval |
| Component Dev | 2-3 days | Card, Editor, types, config |
| Data Hook | 1-2 days | CRUD operations, GCS integration |
| Validation | 1 day | Frontend + backend validation logic |
| Testing | 1-2 days | Unit tests, E2E tests, manual QA |
| **Total** | **6-9 days** | Full implementation to production |

**Blockers:** None (all dependencies met, patterns exist, design complete)

---

## Success Metrics

### Phase 1 (Launch)
- [ ] Operators can view all lifecycle models in Reality Tuner
- [ ] Operators can edit custom model tiers (emoji, label)
- [ ] Operators can create new custom lifecycle models
- [ ] Operators can activate a model (switches atomically)
- [ ] System models (botanical) are protected from editing
- [ ] All validation rules enforced (cannot save invalid config)
- [ ] TierBadge components read from active model

### Phase 2 (Future)
- [ ] Import/Export JSON functionality
- [ ] Activation changelog/history
- [ ] Model duplication with rename
- [ ] Bulk stage remapping
- [ ] A/B testing between lifecycle models

---

## Approval Sign-Off

**Designer:** UI/UX Designer  
**Date:** 2026-01-15  
**Status:** ✅ Ready for UX Chief Review  

**UX Chief:** _[Pending approval]_  
**Date:** _[Pending]_  
**Status:** _[Pending]_  

**Notes for UX Chief:**
- All 4 design questions answered with rationale
- Complete wireframes with code examples
- DEX alignment verified across all 4 pillars
- Pattern consistency with existing ExperienceConsole components
- Accessibility guidelines defined (ARIA, keyboard, focus)
- Sample data ready for testing (render-json compatible)
- Developer handoff checklist complete

**Approval Criteria:**
1. DEX alignment acceptable? (Declarative, Agnostic, Provenance, Scalable)
2. Pattern consistency acceptable? (Matches FeatureFlag/SystemPrompt)
3. Design system compliance acceptable? (Quantum Glass v1.0)
4. Validation rules acceptable? (SINGLETON, tier count, mappings)

---

*Design Handoff for S5-SL-LifecycleEngine*  
*Route to UX Chief for DEX Review → Developer Handoff*
