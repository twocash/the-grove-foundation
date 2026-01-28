# OutputTemplate Field Clarification

**Sprint:** S28-PIPE
**Issue:** User confused by "Agent Type" and "Category" fields appearing similar

---

## Current State

### Field 1: `agentType` (Required, Enum)

**Purpose:** Which agent executes this template?

**Values:**
- `writer` — Template for Writer Agent (transforms evidence → document)
- `research` — Template for Research Agent (search instructions)
- `code` — Template for Code Agent (future)

**Functionality:** CRITICAL
- Used by template-loader.ts to filter templates by agent
- `loadDefaultTemplate('writer')` only returns templates where `agentType='writer'`
- `loadActiveTemplates('research')` only returns research templates

**UI Label:** "Agent Type"

**Locked After Creation:** Yes (can't change writer template to research template)

---

### Field 2: `config.category` (Optional, String)

**Purpose:** User-defined content domain/subject area

**Values:** Free-form text, suggested examples:
- `technical` — Technical documentation
- `strategy` — Strategic analysis
- `policy` — Policy proposals
- `content` — Content writing
- `research` — Research-focused

**Functionality:** DISPLAY ONLY
- Adds colored badge to template card (CATEGORY_COLORS)
- NOT used for filtering in current code
- Just organizational metadata

**UI Label:** "Category"

**Problem:** Redundant with agentType when both say "research"

---

## The Confusion

**Screenshot Example:**
```
Agent Type: 🔍 Research (selected)
Category: research
```

This is redundant! The template is:
- Used by Research Agent (agentType)
- Tagged as "research" domain (category)

Both say "research" but mean different things.

---

## Options

### Option 1: Remove Category (Simplify)

**Pros:**
- Less confusion
- One less field to manage
- Not used for filtering anyway

**Cons:**
- Lose organizational metadata
- Can't tag "Vision Paper" vs "Technical Analysis" within writer templates

---

### Option 2: Better Labels

**Before:**
- Agent Type: Writer / Research / Code
- Category: [text input]

**After:**
- **Executes On:** Writer Agent / Research Agent / Code Agent
- **Content Domain:** [text input - e.g., "technical", "vision", "policy"]

**Pros:**
- Clearer distinction
- Both fields serve different purposes

**Cons:**
- Still have two fields

---

### Option 3: Merge Into Agent Type

Make agentType more specific:

**Values:**
- `writer-vision`
- `writer-technical`
- `writer-policy`
- `research-deep`
- `research-quick`

**Pros:**
- Single field
- Still have categorization

**Cons:**
- Breaks existing filtering logic
- More complex enum

---

## Recommendation

**Option 2: Better Labels**

Keep both fields but clarify their purpose:

| Field | Old Label | New Label | Purpose |
|-------|-----------|-----------|---------|
| `agentType` | Agent Type | **Executes On** | Which agent runs this template |
| `config.category` | Category | **Content Domain** | Subject area / organization tag |

Update OutputTemplateEditor.tsx labels:
- Line ~330: "Agent Type" → "Executes On"
- Line ~340: "Category" → "Content Domain (optional)"

Add tooltips:
- "Executes On": "Which agent uses this template (determines available fields)"
- "Content Domain": "Optional tag to organize templates (e.g., 'vision', 'technical')"

---

## Implementation

**File:** `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx`

**Change 1: Better Label for agentType**
```typescript
// Before
<InspectorSection title="Basic Information">
  <label>Agent Type</label>

// After
<InspectorSection title="Basic Information">
  <label>
    Executes On
    <span className="text-xs text-muted ml-2">(which agent runs this template)</span>
  </label>
```

**Change 2: Better Label for Category**
```typescript
// Before
<label>Category</label>
<BufferedInput value={template.payload.config.category} ... />

// After
<label>
  Content Domain
  <span className="text-xs text-muted ml-2">(optional: 'vision', 'technical', 'policy')</span>
</label>
<BufferedInput
  value={template.payload.config.category}
  placeholder="e.g., vision, technical, policy (optional)"
  ...
/>
```

---

## Alternative: Remove Category (If Not Needed)

If category is just visual cruft with no functional purpose, consider removing it:

**Files to modify:**
- `src/core/schema/output-template.ts` — Remove category from OutputTemplateConfigSchema
- `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx` — Remove category input field
- `src/bedrock/consoles/ExperienceConsole/OutputTemplateCard.tsx` — Remove category badge

**Benefit:** Simpler, less confusion

**Risk:** Lose organizational metadata (can't distinguish "Vision Paper" vs "Technical Analysis" among writer templates without looking at names)

---

## Decision Needed

Which approach?

1. **Keep both, better labels** — Clarifies purpose, minimal code change
2. **Remove category** — Simplifies, loses organizational metadata
3. **User decides** — Test with current setup, remove if not useful

**Recommendation:** Start with Option 1 (better labels) and let user feedback guide whether to remove category entirely.
