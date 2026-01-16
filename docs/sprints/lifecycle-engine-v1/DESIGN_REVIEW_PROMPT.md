# Design Review Prompt: S5-SL-LifecycleEngine

## For: UI/UX Designer → UX Chief Review Chain

---

## Quick Context

**Sprint:** S5-SL-LifecycleEngine v1
**Domain:** Bedrock ExperienceConsole
**Goal:** Enable operators to customize sprout lifecycle models (tier labels, emojis, stage mappings) without code deployment

---

## What We're Building

### The Problem
Currently, tier display (🌰 Seed → 🌱 Sprout → 🌿 Sapling → 🌳 Tree → 🌲 Grove) is hardcoded in TypeScript. Operators cannot:
- Change tier emojis or labels
- Create alternative lifecycle metaphors (academic: Draft → Reviewed → Published)
- Map research stages to different tiers

### The Solution
A **Lifecycle Config** experience type in ExperienceConsole that allows operators to:
1. View/edit tier definitions (emoji, label, order)
2. Create multiple lifecycle models (botanical, academic, research)
3. Set one model as active
4. Map sprout stages to tiers

---

## UI Components Needed

### 1. LifecycleConfigCard (Grid View)

**Context:** Appears in ExperienceConsole grid alongside other experience types (feature flags, system prompts, etc.)

**Must Display:**
- Model name (e.g., "Botanical Growth")
- Tier count (e.g., "5 tiers")
- Active/Draft/Archived status badge
- Preview of tier emojis (e.g., 🌰🌱🌿🌳🌲)

**Existing Pattern to Follow:**
- `FeatureFlagCard.tsx` - Similar card structure
- `ResearchAgentConfigCard.tsx` - Config card with status

### 2. LifecycleConfigEditor (Inspector Panel)

**Context:** Appears in right-side inspector when a card is selected

**Must Support:**

**Section A: Model Metadata**
- Model name (editable for custom models, read-only for system)
- Description (optional)
- isEditable badge (system models are locked)

**Section B: Tier Definitions Table**
| Tier ID | Emoji | Label | Order |
|---------|-------|-------|-------|
| seed | 🌰 | Seed | 0 |
| sprout | 🌱 | Sprout | 1 |
| ... | ... | ... | ... |

- Emoji picker for custom models
- Inline label editing for custom models
- Drag-to-reorder (changes order value)
- Locked rows for system models

**Section C: Stage-to-Tier Mappings**
| Stage | → | Tier |
|-------|---|------|
| tender | → | seed |
| rooting | → | seed |
| established | → | sapling |
| ... | → | ... |

- Dropdown to select tier for each stage
- All stages must be mapped

**Existing Pattern to Follow:**
- `FeatureFlagEditor.tsx` - Form structure
- `SystemPromptEditor.tsx` - Multi-section layout
- `CopilotStyleEditor.tsx` - Dropdown/select patterns

### 3. Empty State

**When:** No lifecycle configs exist (shouldn't happen - default is seeded)

**Message:** "No lifecycle configurations found. The default botanical model should have been seeded."

**Action:** "Seed Default" button (admin recovery)

---

## Data Schema (For Context)

```typescript
interface LifecycleConfigPayload {
  activeModelId: string;
  models: LifecycleModel[];
}

interface LifecycleModel {
  id: string;           // 'botanical' | 'academic' | custom
  name: string;         // "Botanical Growth"
  description?: string;
  isEditable: boolean;  // false for system models
  tiers: TierDefinition[];
  mappings: StageTierMapping[];
}

interface TierDefinition {
  id: string;    // 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove'
  emoji: string; // 🌰
  label: string; // "Seed"
  order: number; // 0, 1, 2, 3, 4
}

interface StageTierMapping {
  stage: SproutStage;  // 'tender' | 'rooting' | 'established' | etc.
  tierId: string;      // Which tier this stage maps to
}
```

---

## Design Constraints

### SINGLETON Pattern
- Only ONE lifecycle config can be `active` at a time
- Others are `draft` or `archived`
- Activation auto-archives current active

### System Model Protection
- Default "botanical" model has `isEditable: false`
- Cannot modify tier labels/emojis on system models
- Can only duplicate and customize

### Visual Consistency
- Must match existing ExperienceConsole card/editor patterns
- Use existing GlowButton, DataPanel, MetricCard components
- Follow Obsidian/Glow design system (Foundation theme)

---

## Wireframe Request

Please provide wireframes for:

1. **LifecycleConfigCard** - Grid card view
   - Show both active and draft states
   - Show system vs custom badge

2. **LifecycleConfigEditor** - Inspector panel
   - Full form layout
   - Tier table with edit controls
   - Mapping table with dropdowns
   - Locked state for system models

3. **Model Selector** (optional)
   - If we need a way to switch between models within the editor

---

## Existing Components to Reference

Look at these for pattern consistency:
- `src/bedrock/consoles/ExperienceConsole/cards/FeatureFlagCard.tsx`
- `src/bedrock/consoles/ExperienceConsole/editors/FeatureFlagEditor.tsx`
- `src/bedrock/consoles/ExperienceConsole/cards/ResearchAgentConfigCard.tsx`
- `src/bedrock/consoles/ExperienceConsole/editors/SystemPromptEditor.tsx`

---

## Questions for Design

1. **Model Switching:** Should the editor allow switching between models in the same config, or should each model be a separate card?

2. **Tier Addition:** For custom models, should users be able to add/remove tiers, or only customize the 5 existing ones?

3. **Preview:** Should the editor show a live preview of how TierBadge will render with current settings?

4. **Import/Export:** Should there be a way to import/export lifecycle configs as JSON?

---

## After Design: UX Chief Review

Once wireframes are complete, route to UX Chief for:
- DEX alignment verification
- Pattern consistency check
- Approval for development

---

*Design Review Prompt for S5-SL-LifecycleEngine*
*Foundation Loop v2*
