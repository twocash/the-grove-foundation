# S28-PIPE: Revision Summary (Simplified Approach)

**Date:** 2026-01-28
**Status:** Architecture Simplified ✓

---

## What Changed (User Feedback)

### Original Plan (REJECTED)

**Problem:** Over-engineered schemas with rigid structure

```typescript
// ResearchAgentConfig — TOO COMPLEX
{
  searchDepth: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,  // ❌ Rigid enum
  sourcePreferences: Array<'academic' | 'practitioner' | 'news'>,  // ❌ Forced choices
  confidenceThreshold: number,  // ❌ What does 0.6 mean to user?
  maxApiCalls: number,
  branchDelay: number
}

// WriterAgentConfig — TOO NESTED
{
  voice: {  // ❌ Over-structured
    formality: 'casual' | 'professional' | 'academic',  // ❌ Limited options
    perspective: 'first-person' | 'third-person',
    personality?: string
  },
  documentStructure: {  // ❌ Too many fields
    includePosition: boolean,
    includeLimitations: boolean,
    citationStyle: 'inline' | 'endnote',
    citationFormat: 'simple' | 'apa' | 'chicago',
    maxLength?: number
  },
  qualityRules: {  // ❌ What are these?
    requireCitations: boolean,
    minConfidenceToInclude: number,
    flagUncertainty: boolean
  }
}
```

**UI Pattern (REJECTED):**
- Dropdowns for formality, perspective, citationStyle
- Toggles for boolean flags
- Number inputs with sliders
- Nested sections

**Why Rejected:**
- Forces admin into predefined choices
- Can't express "write like a tech blogger" without new enum
- LESS configurable than just writing text
- Assumes we know what matters (we don't)

---

### Revised Plan (APPROVED)

**Principle:** Configs = TEXT INSTRUCTIONS that merge into prompts

```typescript
// ResearchAgentConfig — SIMPLE
{
  version: number,
  searchInstructions: string,  // ✓ Any text: "Focus on academic sources, recent"
  qualityGuidance: string       // ✓ Any text: "Exclude confidence < 0.6"
}

// WriterAgentConfig — SIMPLE
{
  version: number,
  writingStyle: string,         // ✓ Any text: "Professional but accessible"
  resultsFormatting: string,    // ✓ Any text: "Executive summary, sections"
  citationsStyle: string        // ✓ Any text: "Inline (Author, Year)"
}

// OutputTemplate — ALREADY SIMPLE (S27-OT)
{
  systemPrompt: string,
  renderingInstructions: string,
  configOverrides?: {
    writingStyle?: string,      // Override base if needed
    resultsFormatting?: string,
    citationsStyle?: string
  }
}
```

**UI Pattern (APPROVED - Uses Existing Primitives):**
- BufferedTextarea for all fields (prevents race conditions)
- InspectorSection for grouping
- Same console-factory layout as other inspectors
- NO new UI components or patterns

**Why Approved:**
- Admin writes free-form instructions
- Experimentation reveals what matters
- MORE configurable (any text, no constraints)
- Simple to implement (just text fields)

---

## What We're Keeping (The Good Parts)

### ✓ Three-Layer Composition

Configs still compose in priority order:
1. Template overrides (highest)
2. Writer config (middle)
3. Research config (evidence phase)

Just simpler — text concatenation instead of object merging.

### ✓ Provenance Tracking

Documents still record which config versions produced them:
```typescript
{
  researchConfigVersion: 2,
  writerConfigVersion: 3,
  templateId: "academic-paper-v1"
}
```

### ✓ Config Versioning

Still have:
- Version numbers
- Activation flow (draft → active, auto-archive old)
- Singleton pattern (exactly 1 active per grove)
- Rollback capability

### ✓ Pipeline Wiring

Still fix the core gaps:
- Config loader queries Supabase (uncomment TODO stubs)
- Configs actually read by pipeline (not decorative)
- Server uses configs (no hardcoded defaults)

---

## What We're Removing (The Bad Parts)

### ❌ Rigid Enums

No more:
- `formality: 'casual' | 'professional' | 'academic' | 'technical'`
- `perspective: 'first-person' | 'third-person' | 'neutral'`
- `citationFormat: 'simple' | 'apa' | 'chicago'`

These limited configurability, not enhanced it.

### ❌ Nested Objects

No more:
- `voice: { formality, perspective, personality }`
- `documentStructure: { includePosition, citationStyle, ... }`
- `qualityRules: { requireCitations, minConfidence, ... }`

Flat is better. Just 3 text fields.

### ❌ Complex UI Patterns

No more:
- Custom dropdown components
- Toggle switches
- Slider inputs
- "Override indicator" badges

Use existing primitives only: BufferedTextarea, InspectorSection, GlassButton.

### ❌ Validation Beyond Type

No more:
- `searchDepth: 1-10` (why limit to 10?)
- `confidenceThreshold: 0-1` (what does 0.73 mean?)
- `maxLength?: number` (admin can just write "keep it under 2000 words")

Just validate it's a string. That's it.

---

## Implementation Changes

### Phase 1: Schema Simplification

**BEFORE:**
- 56 lines of Zod validation in research-agent-config.ts
- 142 lines of Zod validation in writer-agent-config.ts
- Complex nested object types

**AFTER:**
- ~20 lines per schema file
- Two/three string fields with basic validation
- Flat structure

**Files:**
- `src/core/schema/research-agent-config.ts`
- `src/core/schema/writer-agent-config.ts`

---

### Phase 2: Inspector UI Simplification

**BEFORE:**
- Lines 18-44 in WriterAgentConfigEditor: FORMALITY_OPTIONS, PERSPECTIVE_OPTIONS, etc.
- Lines 405-527: Dropdown components for each enum
- Lines 534-638: Complex documentStructure form section

**AFTER:**
- Remove all enum constants
- Replace with 3 BufferedTextarea components
- ~50 lines of form code (down from ~250)

**Files:**
- `src/bedrock/consoles/ExperienceConsole/ResearchAgentConfigEditor.tsx`
- `src/bedrock/consoles/ExperienceConsole/WriterAgentConfigEditor.tsx`

---

### Phase 3: Config Wiring (Unchanged)

Same plan as before:
- Uncomment config-loader.ts Supabase queries
- Call from document-generator.ts
- Pass to server

**Files:**
- `src/explore/services/config-loader.ts`
- `src/explore/services/document-generator.ts`
- `server.js`

---

### Phase 4: Merge Logic (Simplified)

**BEFORE:**
```typescript
// Complex deep merge with spread operators
const effectiveConfig = {
  ...writerConfig,
  ...templateOverrides,
  voice: { ...writerConfig.voice, ...templateOverrides?.voice },
  documentStructure: { ...writerConfig.documentStructure, ...templateOverrides?.documentStructure },
  qualityRules: { ...writerConfig.qualityRules, ...templateOverrides?.qualityRules },
};
```

**AFTER:**
```typescript
// Simple nullish coalescing
const effectiveWritingStyle = template.configOverrides?.writingStyle ?? writerConfig.writingStyle;
const effectiveFormatting = template.configOverrides?.resultsFormatting ?? writerConfig.resultsFormatting;
const effectiveCitations = template.configOverrides?.citationsStyle ?? writerConfig.citationsStyle;

// String concatenation
const finalPrompt = `${systemPrompt}\n## Writing Style\n${effectiveWritingStyle}\n...`;
```

Much simpler!

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Config Fields** | 6 (research) + 10 (writer) = 16 fields | 2 (research) + 3 (writer) = 5 fields |
| **Field Types** | Enums, booleans, numbers, nested objects | All strings |
| **Validation** | 198 lines of Zod schemas | ~40 lines total |
| **UI Components** | Dropdowns, toggles, sliders, custom indicators | BufferedTextarea only |
| **Merge Logic** | Deep object spread, nested merging | Nullish coalescing, string concat |
| **Admin Control** | Limited to predefined options | Unlimited — any text |

---

## What We Kept (Good Architecture)

✓ Three-layer composition (research → writer → template)
✓ Config versioning (draft → active, auto-archive)
✓ Singleton pattern (1 active per grove)
✓ Provenance tracking (which versions produced document)
✓ Pipeline wiring fixes (load from DB, not defaults)
✓ Existing UI patterns (console-factory, InspectorSection, BufferedTextarea)

---

## Result

**More configurable, less complex.** Admins write prompt instructions in plain text. Pipeline merges them. System discovers what matters through use, not prescription.

**Files to Update:** 6 (schemas, inspectors, config-loader, document-generator, server)

**Lines to Remove:** ~300 (enum definitions, validation, complex UI)

**Lines to Add:** ~100 (simple text fields, concatenation logic)

**Net Change:** SIMPLER codebase, MORE admin control.
