# Render JSON Test: Lifecycle Config Visualization

## Overview
This guide shows how to use render-json (Vercel service) to visualize the lifecycle configuration JSON structure.

---

## Files for Testing

### 1. SAMPLE_LIFECYCLE_CONFIG.json
Complete lifecycle configuration with 4 models:
- **botanical** (active, system) - 5 tiers
- **academic-peer-review** (draft, custom) - 7 tiers  
- **creative-project** (draft, custom) - 5 tiers
- **software-development** (archived, custom) - 5 tiers

---

## How to Test with Render JSON

### Option 1: Vercel Render JSON Service

**Step 1: Access the service**
```
https://render-json.vercel.app/
```

**Step 2: Paste JSON**
1. Open `SAMPLE_LIFECYCLE_CONFIG.json`
2. Copy entire contents
3. Paste into render-json editor
4. Click "Render" or it will auto-render

**Step 3: Explore the visualization**
- Expand/collapse model nodes
- View tier definitions
- Check stage-to-tier mappings
- Inspect metadata

### Option 2: Local JSON Viewer

**Using jq (command line):**
```bash
# Pretty print entire config
cat SAMPLE_LIFECYCLE_CONFIG.json | jq '.'

# View only botanical model
cat SAMPLE_LIFECYCLE_CONFIG.json | jq '.models[] | select(.id == "botanical")'

# List all model names and statuses
cat SAMPLE_LIFECYCLE_CONFIG.json | jq '.models[] | {name, status, tierCount: (.tiers | length)}'

# Show only active model
cat SAMPLE_LIFECYCLE_CONFIG.json | jq '.models[] | select(.status == "active")'
```

### Option 3: VS Code JSON Preview
1. Open `SAMPLE_LIFECYCLE_CONFIG.json` in VS Code
2. Install "JSON Crack" extension (optional)
3. Use Outline view (bottom left) to navigate structure
4. Or right-click → "Open Preview" for interactive tree

---

## What to Look For

### 1. Model Structure
```json
{
  "id": "botanical",
  "name": "Botanical Growth",
  "isEditable": false,        // System model (locked)
  "status": "active",         // Only ONE active at a time
  "tiers": [...],            // Array of tier definitions
  "mappings": [...]          // Stage-to-tier relationships
}
```

**Questions to answer:**
- ✅ Is there exactly ONE active model? (SINGLETON pattern)
- ✅ Are system models marked `isEditable: false`?
- ✅ Do all models have complete tier + mapping data?

### 2. Tier Definitions
```json
{
  "id": "seed",
  "emoji": "🌰",
  "label": "Seed",
  "order": 0,
  "description": "..."
}
```

**Validation checks:**
- ✅ Order starts at 0 and increments sequentially
- ✅ All tier IDs are unique within a model
- ✅ Emojis are valid Unicode characters
- ✅ Labels are human-readable (not IDs)

### 3. Stage Mappings
```json
{
  "stage": "tender",
  "tierId": "seed",
  "description": "..."
}
```

**Validation checks:**
- ✅ All 6 sprout stages are mapped
- ✅ All `tierId` values reference valid tiers in the model
- ✅ No orphaned mappings (tier deleted but mapping remains)

### 4. Metadata
```json
{
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z",
  "createdBy": "system"
}
```

**Check for:**
- ✅ Valid ISO 8601 timestamps
- ✅ System models created by "system"
- ✅ Custom models have user IDs
- ✅ Archived models have `archivedAt` timestamp

---

## Expected Visualizations

### render-json Output

When you paste the JSON into render-json, you should see:

```
📦 InformationLifecycleConfig
├─ 📝 version: "1.0.0"
├─ 🎯 activeModelId: "botanical"
├─ 📚 models (4 items)
│  ├─ 🌲 [0] botanical (ACTIVE, SYSTEM)
│  │  ├─ name: "Botanical Growth"
│  │  ├─ isEditable: false
│  │  ├─ status: "active"
│  │  ├─ tiers (5 items)
│  │  │  ├─ [0] 🌰 Seed (order: 0)
│  │  │  ├─ [1] 🌱 Sprout (order: 1)
│  │  │  ├─ [2] 🌿 Sapling (order: 2)
│  │  │  ├─ [3] 🌳 Tree (order: 3)
│  │  │  └─ [4] 🌲 Grove (order: 4)
│  │  └─ mappings (6 items)
│  │     ├─ tender → seed
│  │     ├─ rooting → seed
│  │     ├─ sprouting → sprout
│  │     ├─ established → sapling
│  │     ├─ flourishing → tree
│  │     └─ mature → grove
│  │
│  ├─ 🎓 [1] academic-peer-review (DRAFT, CUSTOM)
│  │  ├─ name: "Academic Peer Review"
│  │  ├─ isEditable: true
│  │  ├─ status: "draft"
│  │  ├─ tiers (7 items)
│  │  │  ├─ [0] 📝 Draft
│  │  │  ├─ [1] 📄 Preprint
│  │  │  ├─ [2] 🔍 Under Review
│  │  │  ├─ [3] ✏️ Revised
│  │  │  ├─ [4] ✅ Accepted
│  │  │  ├─ [5] 📚 Published
│  │  │  └─ [6] 🎓 Cited
│  │  └─ mappings (6 items)
│  │
│  ├─ 🎨 [2] creative-project (DRAFT, CUSTOM)
│  └─ 💾 [3] software-development (ARCHIVED, CUSTOM)
│
├─ 🔄 sproutStages (6 items)
│  ├─ [0] tender (Newly created, fragile)
│  ├─ [1] rooting (Establishing foundations)
│  └─ ...
│
└─ ℹ️ metadata
   ├─ schemaVersion: "1.0.0"
   ├─ totalModels: 4
   └─ activeModel: "botanical"
```

---

## Interactive Testing

### Test Scenarios

**Scenario 1: View Active Model**
```
Navigate to: models → [0] botanical
Verify:
- status = "active" ✅
- isEditable = false ✅
- All 6 stages mapped ✅
- Tiers in sequential order ✅
```

**Scenario 2: Compare Custom vs System**
```
Compare: botanical (system) vs academic-peer-review (custom)
Notice:
- botanical: isEditable = false (locked)
- academic: isEditable = true (customizable)
- academic: 7 tiers (more granular)
- botanical: 5 tiers (default)
```

**Scenario 3: Check Archived Model**
```
Navigate to: models → [3] software-development
Verify:
- status = "archived" ✅
- metadata.archivedAt exists ✅
- metadata.archivedReason explains why ✅
```

**Scenario 4: Validate Mappings**
```
Pick any model → mappings
Check:
- All 6 sprout stages present? ✅
- All tierIds reference valid tier.id? ✅
- No duplicates? ✅
```

---

## Developer Use Cases

### Use Case 1: Testing Card Display Logic
**Goal:** Verify card component can render all model types

**Test with:**
```javascript
const models = sampleConfig.models;

models.forEach(model => {
  console.log({
    name: model.name,
    status: model.status,
    tierCount: model.tiers.length,
    icon: model.tiers[model.tiers.length - 1].emoji, // Highest tier
    editable: model.isEditable
  });
});

// Expected output:
// { name: "Botanical Growth", status: "active", tierCount: 5, icon: "🌲", editable: false }
// { name: "Academic Peer Review", status: "draft", tierCount: 7, icon: "🎓", editable: true }
// { name: "Creative Project", status: "draft", tierCount: 5, icon: "🚀", editable: true }
// { name: "Software Development", status: "archived", tierCount: 5, icon: "💎", editable: true }
```

### Use Case 2: Testing Tier Badge Preview
**Goal:** Render TierBadge components using tier definitions

**Test with:**
```javascript
const botanicalModel = sampleConfig.models.find(m => m.id === 'botanical');

// Generate preview badges
botanicalModel.tiers
  .sort((a, b) => a.order - b.order)
  .forEach(tier => {
    console.log(`<TierBadge tier="${tier.id}" emoji="${tier.emoji}" label="${tier.label}" />`);
  });

// Expected output:
// <TierBadge tier="seed" emoji="🌰" label="Seed" />
// <TierBadge tier="sprout" emoji="🌱" label="Sprout" />
// <TierBadge tier="sapling" emoji="🌿" label="Sapling" />
// <TierBadge tier="tree" emoji="🌳" label="Tree" />
// <TierBadge tier="grove" emoji="🌲" label="Grove" />
```

### Use Case 3: Testing Stage Mapping Dropdown
**Goal:** Populate tier dropdown for each stage

**Test with:**
```javascript
const academicModel = sampleConfig.models.find(m => m.id === 'academic-peer-review');
const stages = sampleConfig.sproutStages;

stages.forEach(stage => {
  const mapping = academicModel.mappings.find(m => m.stage === stage.id);
  const tier = academicModel.tiers.find(t => t.id === mapping?.tierId);
  
  console.log(`${stage.label} → ${tier?.emoji} ${tier?.label || 'UNMAPPED'}`);
});

// Expected output:
// Tender → 📝 Draft
// Rooting → 📝 Draft
// Sprouting → 📄 Preprint
// Established → 🔍 Under Review
// Flourishing → ✅ Accepted
// Mature → 📚 Published
```

### Use Case 4: Testing Validation Logic
**Goal:** Ensure validation catches errors

**Test with:**
```javascript
function validateModel(model) {
  const errors = [];
  
  // Tier count
  if (model.tiers.length < 2) errors.push('Min 2 tiers required');
  if (model.tiers.length > 10) errors.push('Max 10 tiers allowed');
  
  // All stages mapped
  const stages = ['tender', 'rooting', 'sprouting', 'established', 'flourishing', 'mature'];
  const mappedStages = new Set(model.mappings.map(m => m.stage));
  const unmapped = stages.filter(s => !mappedStages.has(s));
  if (unmapped.length > 0) errors.push(`Unmapped stages: ${unmapped.join(', ')}`);
  
  return { isValid: errors.length === 0, errors };
}

// Test all models
sampleConfig.models.forEach(model => {
  const result = validateModel(model);
  console.log(`${model.name}: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
  if (!result.isValid) console.log('  Errors:', result.errors);
});

// Expected output:
// Botanical Growth: ✅ Valid
// Academic Peer Review: ✅ Valid
// Creative Project: ✅ Valid
// Software Development: ✅ Valid
```

---

## Visual Comparison Table

| Model | Status | Editable | Tiers | Icon | Category |
|-------|--------|----------|-------|------|----------|
| Botanical Growth | 🟢 Active | ❌ No (System) | 5 | 🌲 | Botanical |
| Academic Peer Review | 🟡 Draft | ✅ Yes (Custom) | 7 | 🎓 | Academic |
| Creative Project | 🟡 Draft | ✅ Yes (Custom) | 5 | 🚀 | Creative |
| Software Development | ⚫ Archived | ✅ Yes (Custom) | 5 | 💎 | Technical |

---

## Data Quality Checks

Run these checks when rendering the JSON:

### ✅ Structural Integrity
- [ ] Exactly 1 active model (botanical)
- [ ] All models have unique IDs
- [ ] All tier orders are sequential (0, 1, 2, ...)
- [ ] All tier IDs are unique within each model
- [ ] All mappings reference valid tierIds

### ✅ Content Validity
- [ ] All emojis render correctly (no boxes/question marks)
- [ ] All labels are human-readable
- [ ] All descriptions are present and meaningful
- [ ] All timestamps are valid ISO 8601 format

### ✅ Business Rules
- [ ] System models: isEditable = false
- [ ] Custom models: isEditable = true
- [ ] Active model: status = "active"
- [ ] Archived models: have archivedAt timestamp
- [ ] All 6 sprout stages are mapped in each model

---

## Next Steps

1. **Paste into render-json** - Visualize the structure interactively
2. **Run jq queries** - Extract specific data for testing
3. **Test with frontend** - Load JSON into React component
4. **Validate mappings** - Ensure all stages covered
5. **Compare models** - See differences between system/custom

---

## Resources

- **Render JSON (Vercel):** https://render-json.vercel.app/
- **Alternative:** https://jsoncrack.com/editor
- **jq Playground:** https://jqplay.org/
- **VS Code Extension:** JSON Crack (marketplace)

---

*Render JSON Test Guide for S5-SL-LifecycleEngine*  
*Use this to visualize and validate lifecycle configuration structure*
