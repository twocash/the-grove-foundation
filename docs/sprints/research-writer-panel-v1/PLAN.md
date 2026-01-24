# S22-WP: Research Writer Panel - Planning Document

**Sprint:** research-writer-panel-v1
**Status:** PLANNING
**Created:** 2026-01-23

---

## Vision

The right panel in the Sprout Finishing Room enables users to:
1. **Select a Writer Voice/Style** (singleton system prompts)
2. **Add custom notes** that merge into the Writer's system prompt
3. **Generate one output at a time** using selected Writer + notes
4. **Save provisional insights to Nursery** before promotion to Garden

---

## The Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  SPROUT FINISHING ROOM - Right Panel                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─── VOICE & STYLE ───────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [Blog Post]    [Academic]       ← Writer Singletons        │   │
│  │  [Tech Deep]    [Trend Report]      (system prompts)        │   │
│  │  [Exec Summary] [Marketing]                                  │   │
│  │                                                              │   │
│  │  Each is a Writer Template with:                            │   │
│  │  - systemPrompt (the voice/style instructions)              │   │
│  │  - icon, label, description                                  │   │
│  │  - Tunable via config, NOT code                              │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── NOTES FOR WRITER ────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [Capture scratchpad thinking here...]                      │   │
│  │                                                              │   │
│  │  These notes get MERGED into the Writer's systemPrompt:     │   │
│  │  final_prompt = template.systemPrompt + user_notes          │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── GENERATE ────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [📝 Generate {Selected Style} Output]                       │   │
│  │                                                              │   │
│  │  Calls: POST /api/research/write                            │   │
│  │  Body: { evidence, systemPrompt (merged), outputType }      │   │
│  │  Returns: Formatted document in selected style               │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── SAVE ────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [💾 SAVE ARTIFACTS TO NURSERY]                              │   │
│  │                                                              │   │
│  │  Saves to Supabase `nursery` table:                         │   │
│  │  - sproutId                                                  │   │
│  │  - researchEvidence                                          │   │
│  │  - generatedDocument                                         │   │
│  │  - writerTemplateId                                          │   │
│  │  - userNotes                                                 │   │
│  │  - status: 'provisional'                                     │   │
│  │                                                              │   │
│  │  Later: Admin promotes to Garden (canonical knowledge)       │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Current State Analysis

### What Exists

| Component | Location | Status |
|-----------|----------|--------|
| Writer Templates (seed) | `src/core/templates/output/` | ✅ Have some templates |
| Template Loader | `src/explore/services/template-loader.ts` | ✅ Loads templates |
| Writer Agent | `src/explore/services/writer-agent.ts` | ✅ Has systemPromptOverride |
| /api/research/write | `server.js:2540-2600` | ✅ Endpoint exists |
| Sprout Finishing Room | `src/surface/components/modals/SproutFinishingRoom/` | ⚠️ Needs right panel |
| Nursery table | Supabase | ⚠️ May need schema updates |

### What's Missing

| Gap | Description | Priority |
|-----|-------------|----------|
| **Writer Selector UI** | Grid of Writer singletons in right panel | P0 |
| **Notes Textarea** | User input that merges with systemPrompt | P0 |
| **Generate Button** | Triggers Writer with selected style + notes | P0 |
| **Save to Nursery** | Persists provisional insight | P0 |
| **Prompt Merging Logic** | Combines template.systemPrompt + userNotes | P0 |
| **Output Preview** | Shows generated document before save | P1 |
| **Nursery → Garden promotion** | Admin workflow for canonical promotion | P2 |

---

## Data Architecture

### Writer Template Schema (Existing)

```typescript
// src/core/templates/output/schema.ts
interface OutputTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'writer' | 'research' | 'analysis';
  systemPrompt: string;  // The voice/style instructions
  outputFormat?: 'markdown' | 'html' | 'json';
}
```

### Provisional Insight Schema (New)

```typescript
// Nursery table row
interface ProvisionalInsight {
  id: string;
  sproutId: string;

  // Source
  researchEvidence: Evidence[];
  researchSynthesis?: string;

  // Generation
  writerTemplateId: string;
  userNotes?: string;           // User's scratchpad notes
  mergedSystemPrompt: string;   // template.systemPrompt + userNotes
  generatedDocument: string;    // The output

  // Lifecycle
  status: 'draft' | 'provisional' | 'promoted' | 'archived';
  createdAt: string;
  promotedAt?: string;
  promotedBy?: string;

  // Provenance
  gardenPageId?: string;        // If promoted to Garden
}
```

---

## Implementation Plan

### Phase 1: Writer Selector UI

**Goal:** Grid of Writer template buttons in right panel

1. Create `WriterSelector.tsx` component
   - Fetches available writer templates
   - Displays as selectable cards (single selection)
   - Shows icon, name for each
   - Highlights selected template

2. Wire into SproutFinishingRoom right panel
   - Add state: `selectedWriterTemplateId`
   - Position in panel per mockup

### Phase 2: Notes for Writer

**Goal:** Textarea that captures user notes

1. Add `writerNotes` state to SproutFinishingRoom
2. Create notes textarea UI component
3. Implement prompt merging logic:
   ```typescript
   const mergedPrompt = mergeWriterPrompt(
     template.systemPrompt,
     userNotes
   );
   ```

### Phase 3: Generate Output

**Goal:** Button that calls Writer API with merged prompt

1. Add "Generate" button
2. On click:
   - Get selected Writer template
   - Merge systemPrompt + userNotes
   - Call `POST /api/research/write` with:
     ```json
     {
       "evidence": sprout.evidence,
       "synthesis": sprout.synthesis,
       "systemPrompt": mergedPrompt,
       "outputType": template.name
     }
     ```
3. Display generated document in preview area
4. Store in state: `generatedDocument`

### Phase 4: Save to Nursery

**Goal:** Persist provisional insight

1. Add "Save Artifacts to Nursery" button
2. On click:
   - Create ProvisionalInsight record
   - Insert to Supabase `nursery` table
   - Update sprout status to 'captured'
3. Show success feedback

### Phase 5: Nursery → Garden Promotion (Later)

**Goal:** Admin can promote insights to canonical Garden

1. Admin view of Nursery items
2. "Promote to Garden" action
3. Creates page in knowledge base
4. Updates insight status to 'promoted'

---

## Writer Templates (Seed Data)

Based on mockup, these Writer singletons need to exist:

| ID | Name | Icon | Description |
|----|------|------|-------------|
| `blog-post` | Blog Post | 📄 | Conversational, engaging web content |
| `academic` | Academic | 🎓 | Formal, citation-heavy scholarly tone |
| `tech-deep-dive` | Tech Deep Dive | 🖥️ | Technical depth, code examples |
| `trend-report` | Trend Report | 📈 | Market analysis, forward-looking |
| `exec-summary` | Exec Summary | ⚡ | Concise, decision-focused brief |
| `marketing-copy` | Marketing Copy | 📣 | Persuasive, benefit-oriented |

Each needs a `systemPrompt` that instructs Claude HOW to write in that style.

---

## API Changes

### Existing: POST /api/research/write

Already accepts `systemPrompt` - needs verification it works with merged prompts.

### New: POST /api/nursery/save

```typescript
// Request
{
  sproutId: string;
  writerTemplateId: string;
  userNotes?: string;
  generatedDocument: string;
}

// Response
{
  success: boolean;
  insightId: string;
  status: 'provisional';
}
```

---

## UI Components Needed

| Component | Location | Purpose |
|-----------|----------|---------|
| `WriterSelector` | `SproutFinishingRoom/` | Grid of writer template cards |
| `WriterNotesInput` | `SproutFinishingRoom/` | Textarea for user notes |
| `GenerateButton` | `SproutFinishingRoom/` | Triggers document generation |
| `DocumentPreview` | `SproutFinishingRoom/` | Shows generated output |
| `SaveToNurseryButton` | `SproutFinishingRoom/` | Saves provisional insight |

---

## Success Criteria

1. ✅ User can select ONE Writer voice/style from grid
2. ✅ User can add notes that merge into Writer prompt
3. ✅ "Generate" produces styled document using Claude
4. ✅ "Save to Nursery" persists the provisional insight
5. ✅ Writer templates are tunable via config (not code changes)
6. ✅ Output reflects selected voice/style accurately

---

## Dependencies

- S21-RL (Research API wiring) - COMPLETE
- Writer templates exist with systemPrompts
- Supabase `nursery` table schema
- /api/research/write endpoint working

---

## Open Questions

1. **Nursery table schema** - Does it exist? Need to verify/create
2. **Garden promotion workflow** - Separate sprint or include here?
3. **Multiple outputs** - Can user generate multiple styles for same research?
4. **Notes persistence** - Save notes even before generation?

---

*Planning document created 2026-01-23 | Ready for review*
