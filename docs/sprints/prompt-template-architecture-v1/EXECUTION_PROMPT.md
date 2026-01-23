# Output Templates Architecture v1 - Execution Prompt

**Sprint:** `prompt-template-architecture-v1`
**Contract:** SPEC.md in this folder
**Protocol:** Grove Execution Protocol v1.5

---

## Mission

Build a configurable output template system for Writer and Research agents. Templates control how agents transform research into documents via `systemPrompt` configuration. Users can fork system seeds to create customized templates.

---

## Critical Constraints

### Test Routes

```
✅ localhost:3000/bedrock/experience - Experience Console (templates live here)
✅ localhost:3000/explore - Sprout Refinement Room
❌ localhost:3000/ - FROZEN ZONE
❌ localhost:3000/terminal - FROZEN ZONE
```

### Strangler Fig Boundaries

```
NEVER TOUCH:
- src/surface/components/Terminal/*
- src/foundation/*
- pages/TerminalPage.tsx

WORK HERE:
- src/core/schema/ (new schema)
- src/bedrock/consoles/ExperienceConsole/ (new components)
- src/explore/ (Refinement Room integration)
```

---

## Phase Execution

### Phase 1: Schema Foundation

**Goal:** Create OutputTemplate Zod schema and type definitions.

**Files to create:**
1. `src/core/schema/output-template.ts` - Main schema file

**Schema structure:**
```typescript
import { z } from 'zod';

export const OutputTemplateConfigSchema = z.object({
  category: z.string().optional(),
  citationStyle: z.enum(['chicago', 'apa', 'mla']).optional(),
  citationFormat: z.enum(['endnotes', 'inline']).optional(),
});

export const OutputTemplatePayloadSchema = z.object({
  version: z.number().min(1).default(1),
  previousVersionId: z.string().optional(),
  changelog: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  agentType: z.enum(['writer', 'research', 'code']),
  systemPrompt: z.string(),
  config: OutputTemplateConfigSchema,
  status: z.enum(['active', 'archived', 'draft']).default('draft'),
  isDefault: z.boolean().default(false),
  source: z.enum(['system-seed', 'user-created', 'imported', 'forked']),
  forkedFromId: z.string().optional(),
});
```

**Files to modify:**
1. `src/core/schema/grove-object.ts` - Add `'output-template'` to `GroveObjectType`
2. `src/core/schema/index.ts` - Export new schema

**Gate:** `npm run build` passes

---

### Phase 2: System Seed Data

**Goal:** Create the 8 system seed templates with actual prompts.

**File to create:**
1. `data/seeds/output-templates.json`

**Writer Agent Seeds (4):**

1. **Engineering / Architecture** (📐)
```
Transform research into a technical architecture document.

Focus on: implementation patterns, trade-offs, technical constraints.
Voice: Precise, technical, evidence-based.
Structure: Problem → Analysis → Architecture → Trade-offs → Recommendations.
Citations: Chicago style, endnotes with links.
```

2. **Vision Paper** (🔮)
```
Transform research into a forward-looking vision document.

Focus on: emerging possibilities, strategic implications, transformative potential.
Voice: Aspirational yet grounded, thought-provoking.
Structure: Current State → Emerging Signals → Vision → Path Forward.
Citations: Light touch, inline references for credibility.
```

3. **Higher Ed Policy** (🎓)
```
Transform research into a higher education policy brief.

Focus on: institutional implications, student outcomes, implementation feasibility.
Voice: Academic but accessible, balanced perspective.
Structure: Executive Summary → Context → Analysis → Policy Recommendations → Implementation.
Citations: APA style, comprehensive reference list.
```

4. **Blog Post** (📝)
```
Transform research into an engaging blog post.

Focus on: accessibility, narrative flow, practical takeaways.
Voice: Conversational but authoritative, engaging.
Structure: Hook → Story/Context → Key Insights → Actionable Conclusion.
Citations: Minimal, hyperlinks to sources.
```

**Research Agent Seeds (4):**

1. **Deep Dive** (🔬)
```
Conduct exhaustive research exploration.

Behavior: Maximum branching depth (5+), explore tangential connections.
Sources: Prioritize primary sources, academic papers, technical documentation.
Quality: Strict confidence thresholds, flag all uncertainty.
```

2. **Quick Scan** (⚡)
```
Conduct rapid research overview.

Behavior: Limited depth (2-3 branches), focus on top results.
Sources: Balanced mix, prefer recent publications.
Quality: Lower confidence thresholds acceptable, prioritize speed.
```

3. **Academic Review** (📚)
```
Conduct scholarly literature review.

Behavior: Moderate depth (3-4), follow citation trails.
Sources: Academic databases, peer-reviewed journals, scholarly books.
Quality: High confidence required, comprehensive citation tracking.
```

4. **Trend Analysis** (📈)
```
Conduct trend-focused research.

Behavior: Moderate depth, emphasis on temporal patterns.
Sources: News, industry reports, recent publications.
Quality: Balanced thresholds, highlight emerging patterns.
```

**Gate:** JSON file validates, seed count = 8

---

### Phase 3: Data Hook

**Goal:** Create the useOutputTemplateData hook following existing patterns.

**File to create:**
1. `src/bedrock/consoles/ExperienceConsole/useOutputTemplateData.ts`

**Reference:** `useWriterAgentConfigData.ts`

**Required functions:**
- `list()` - Get all templates
- `get(id)` - Get single template
- `create(payload)` - Create new template
- `update(id, patch)` - Update template
- `delete(id)` - Delete template
- `activate(id)` - Set status to 'active'
- `fork(id)` - Create forked copy (source: 'forked', status: 'draft')
- `activeTemplates(agentType)` - Get active templates by agent type

**Gate:** Hook compiles, TypeScript types correct

---

### Phase 4: Card Component

**Goal:** Create OutputTemplateCard for grid display.

**File to create:**
1. `src/bedrock/consoles/ExperienceConsole/OutputTemplateCard.tsx`

**Reference:** `WriterAgentConfigCard.tsx`

**Visual elements:**
- Category color bar (top edge)
- Source badge: SYSTEM (muted), FORKED (blue), IMPORTED (purple), none for user-created
- Icon + Title + Version
- Description (2-line truncate)
- Agent type badge (Writer/Research)
- Status badge (Active green, Draft yellow, Archived gray)
- Favorite star toggle
- Selected state styling

**Props:** `ObjectCardProps<OutputTemplatePayload>`

**Gate:** Card renders in isolation, screenshot captured

---

### Phase 5: Editor Component

**Goal:** Create OutputTemplateEditor with fork flow.

**File to create:**
1. `src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx`

**Reference:** `WriterAgentConfigEditor.tsx`

**Sections:**
1. **Header** - Icon, title, source badge, close button
2. **Basic Information** - Name, description, agent type, category
3. **System Prompt** - Large textarea for the main instruction
4. **Config** - Citation style/format (for writer templates)
5. **Provenance** - Source, forked from, version history
6. **Footer Actions** - Context-dependent buttons

**Mode logic:**
- `source === 'system-seed'` → Read-only, show Fork button
- `source !== 'system-seed'` → Editable, show Save/Delete
- `status === 'draft'` → Show Publish button
- `status === 'active'` → Show Archive button

**Fork flow:**
1. Click [Fork to Customize]
2. Call `fork(id)` from hook
3. Hook creates new template with `source: 'forked'`, `status: 'draft'`
4. Select newly created template in list
5. Inspector switches to edit mode

**Gate:** Fork flow works end-to-end, screenshot captured

---

### Phase 6: Console Integration

**Goal:** Add Output Templates tab to Experience Console.

**File to modify:**
1. `src/bedrock/consoles/ExperienceConsole/index.tsx` (or equivalent)

**Tab configuration:**
```typescript
{
  id: 'output-templates',
  label: 'Output Templates',
  icon: 'description', // or appropriate Material symbol
  component: OutputTemplatesSection,
}
```

**Section layout:**
- Filter row: source (All/System/User), status (All/Active/Draft/Archived), agentType (All/Writer/Research)
- Grid of OutputTemplateCard components
- Right panel: OutputTemplateEditor
- Top action: [+ New] button

**Gate:** Tab visible, section functional, screenshot captured

---

### Phase 7: Refinement Room Integration

**Goal:** Add template selection to Sprout Refinement Room.

**Files to modify:**
1. Find Sprout Refinement Room modal component
2. Add template selection bar

**Layout:**
- Bottom of modal: horizontal scroll of template cards
- Filter: only `status: 'active'` AND `agentType: 'writer'`
- Click card → trigger artifact generation
- ✓ badge on cards where artifact already exists
- [+ Generate Another] when artifacts exist

**Generation flow:**
1. User clicks template card
2. Pass `templateId` to generation endpoint
3. Show progress indicator
4. On complete, artifact appears in center panel

**Gate:** Template selection works, artifact generates

---

### Phase 8: E2E Verification

**Goal:** Complete E2E test suite with console monitoring.

**File to create:**
1. `tests/e2e/output-templates.spec.ts`

**Test cases:**
```typescript
test.describe('Output Templates E2E', () => {
  // TC-01: View system templates in Experience Console
  // TC-02: Fork a system template
  // TC-03: Edit and publish forked template
  // TC-04: Select template in Refinement Room
  // TC-05: Generate artifact with template
  // TC-06: Filter templates by agent type
  // TC-07: Archive template
  // TC-08: Full session without console errors
});
```

**Console monitoring required:**
```typescript
import { setupConsoleCapture, getCriticalErrors } from './_test-utils';

test.beforeEach(async ({ page }) => {
  capture = setupConsoleCapture(page);
});

// At end of each test:
expect(getCriticalErrors(capture.errors)).toHaveLength(0);
```

**Gate:** All tests pass, zero critical errors

---

## Screenshot Requirements

| Phase | Screenshot | Path |
|-------|------------|------|
| 3 | Card in grid | `screenshots/3-card-grid.png` |
| 4 | Fork flow | `screenshots/4-fork-flow.png` |
| 5 | Console with filters | `screenshots/5-console-integration.png` |
| 6 | Refinement room selection | `screenshots/6-refinement-room.png` |
| 7 | E2E test results | `screenshots/7-e2e-results.png` |

---

## Completion Checklist

Before marking sprint complete:

- [ ] All 8 phases have DEVLOG entries
- [ ] All screenshots saved to `docs/sprints/prompt-template-architecture-v1/screenshots/`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] E2E tests pass with console monitoring
- [ ] REVIEW.html created with all screenshots embedded
- [ ] Zero critical console errors
- [ ] SPEC.md Live Status updated to "Complete"

---

## Reference Files

| Purpose | Path |
|---------|------|
| Similar Card | `src/bedrock/consoles/ExperienceConsole/WriterAgentConfigCard.tsx` |
| Similar Editor | `src/bedrock/consoles/ExperienceConsole/WriterAgentConfigEditor.tsx` |
| Data Hook Pattern | `src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts` |
| Schema Pattern | `src/core/schema/writer-agent-config.ts` |
| Console Factory | `src/bedrock/patterns/console-factory.types.ts` |
| E2E Utils | `tests/e2e/_test-utils.ts` |

---

*Execute phases sequentially. Each phase must pass its gate before proceeding.*
