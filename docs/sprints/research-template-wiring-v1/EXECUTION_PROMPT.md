# S21-RL: Research Template Wiring - Execution Prompt

**Sprint:** S21-RL - Research Template Wiring
**Parent Epic:** Research Lifecycle v1
**Status:** Ready for Execution
**UX Chief Sign-Off:** Approved

---

## Mission

Wire existing research output templates (Deep Dive, Quick Scan, Academic Review, Trend Analysis) to the research execution pipeline. Templates exist in `output_templates` table; this sprint connects them to actual Claude behavior via `systemPrompt`.

**Core Value:** Different research styles produce meaningfully different research behavior.

---

## Architectural Directives

### Strangler Fig Boundaries

This sprint operates within the **v1.0 reference implementation**. Respect these boundaries:

| Zone | Status | Action |
|------|--------|--------|
| `/explore/*` | ACTIVE | ✅ Work here |
| `/bedrock/*` | ACTIVE | ✅ Work here |
| `src/core/*` | ACTIVE | ✅ Schema changes here |
| `/foundation/*` | FROZEN | ❌ Do NOT touch |
| `/terminal/*` | FROZEN | ❌ Do NOT touch |
| `server.js` GCS loaders | DEPRECATED | ❌ Avoid |

### DEX Compliance Required

| Pillar | Requirement |
|--------|-------------|
| **Declarative Sovereignty** | Template behavior via `systemPrompt` in database, not code |
| **Capability Agnosticism** | `systemPrompt` works with any model (Claude, Gemini, local) |
| **Provenance as Infrastructure** | Every sprout records `templateId`; results include template metadata |
| **Organic Scalability** | UI works for N templates without code changes |

### Pattern Reuse

**Source of Truth:** `src/surface/components/modals/SproutFinishingRoom/components/ReviseForm.tsx`

This component already implements the template selector pattern for writer templates. Mirror this pattern for research templates.

---

## Implementation Order

```
1. US-RL001 (Schema) ─────────┐
                              ├─► 3. US-RL005 (Pipeline) ─► 5. US-RL006 (UI)
2. US-RL002 (Provenance) ─────┤
                              │
3. US-RL003 (API) ────────────┤
                              │
4. US-RL004 (Engine) ─────────┘
```

**Critical Path:** US-RL001 → US-RL005 → US-RL006

---

## Story Breakdown

### US-RL001: Add templateId to ResearchSprout schema

**File:** `src/core/schema/sprout.ts` (or equivalent research sprout schema)

**Change:** Add optional `templateId: string` field to ResearchSprout type.

```typescript
// Add to ResearchSprout interface
templateId?: string;  // Output template ID for provenance
```

**Acceptance:** Type guard validates sprouts with and without templateId.

---

### US-RL002: Add provenance fields to PipelineResult

**File:** `src/core/schema/pipeline.ts` (or research pipeline types)

**Change:** Add template provenance object to PipelineResult.

```typescript
// Add to PipelineResult
template?: {
  id: string;
  name: string;
  version: number;
  source: 'system-seed' | 'user-created' | 'forked' | 'imported';
};
```

**Acceptance:** Pipeline results include template metadata when templateId provided.

---

### US-RL003: Add systemPrompt parameter to /api/research/deep

**File:** `server.js` (research endpoint)

**Change:** Accept `systemPrompt` in request body, pass to Claude API.

```javascript
// In /api/research/deep handler
const { query, systemPrompt } = req.body;

// Pass to Claude (exact integration depends on current implementation)
const response = await callClaude({
  query,
  systemPrompt: systemPrompt || undefined,  // Backward compatible
});
```

**Acceptance:** API accepts systemPrompt; works without it (backward compatible).

---

### US-RL004: Pass systemPrompt through research-execution-engine

**File:** `src/core/engine/research-execution-engine.ts` (or equivalent)

**Change:** Thread systemPrompt from pipeline config to API call.

```typescript
// In callClaudeDeepResearch or equivalent
export async function callClaudeDeepResearch(
  query: string,
  systemPrompt?: string  // NEW parameter
): Promise<ResearchResult> {
  // Include systemPrompt in API request body
}
```

**Acceptance:** systemPrompt flows from pipeline to API endpoint.

---

### US-RL005: Load template and extract systemPrompt in pipeline

**File:** `src/core/engine/research-pipeline.ts` (or equivalent)

**Change:** Load template by ID, extract systemPrompt, include provenance in result.

```typescript
// In executeResearchPipeline
async function executeResearchPipeline(sprout: ResearchSprout): Promise<PipelineResult> {
  // 1. Load template (or default)
  const template = sprout.templateId
    ? await loadTemplate(sprout.templateId)
    : await loadDefaultTemplate('research');

  // 2. Extract systemPrompt
  const systemPrompt = template?.payload.systemPrompt;

  // 3. Execute with systemPrompt
  const result = await callClaudeDeepResearch(sprout.query, systemPrompt);

  // 4. Include provenance
  return {
    ...result,
    template: template ? {
      id: template.meta.id,
      name: template.payload.name,
      version: template.payload.version,
      source: template.payload.source,
    } : undefined,
  };
}
```

**Acceptance:** Pipeline loads template, uses systemPrompt, includes provenance.

---

### US-RL006: Add Research Style selector to GardenInspector

**File:** `src/explore/GardenInspector.tsx` (ConfirmationView, Zone 3)

**Pattern:** Progressive disclosure (dropdown + description hint)

**Integration Point:** Between Title input and Instructions textarea in Zone 3.

```typescript
// 1. Import hook
import { useOutputTemplateData } from '@bedrock/consoles/ExperienceConsole/useOutputTemplateData';

// 2. Load and filter templates
const { objects: templates, loading } = useOutputTemplateData();
const researchTemplates = useMemo(() =>
  templates.filter(t => t.payload.agentType === 'research' && t.payload.status === 'active'),
  [templates]
);

// 3. Track selection
const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
const defaultTemplate = researchTemplates.find(t => t.payload.isDefault);

// Auto-select default
useEffect(() => {
  if (!selectedTemplateId && defaultTemplate) {
    setSelectedTemplateId(defaultTemplate.meta.id);
  }
}, [selectedTemplateId, defaultTemplate]);

// 4. Get selected template for description
const selectedTemplate = researchTemplates.find(t => t.meta.id === selectedTemplateId);

// 5. Render in Zone 3
<div>
  <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1.5">
    Research Style
  </label>
  <select
    data-testid="research-style-select"
    value={selectedTemplateId}
    onChange={(e) => setSelectedTemplateId(e.target.value)}
    disabled={isProcessing}
    className="w-full p-2 text-sm bg-[var(--glass-panel)] border border-[var(--glass-border)] rounded-lg"
  >
    {researchTemplates.map((template) => (
      <option key={template.meta.id} value={template.meta.id}>
        {template.payload.name}
        {template.payload.isDefault ? ' (Default)' : ''}
        {template.payload.source === 'system-seed' ? ' • System' : ''}
      </option>
    ))}
  </select>

  {/* Progressive disclosure: description hint */}
  {selectedTemplate && (
    <p
      data-testid="research-style-hint"
      className="mt-1.5 text-xs text-[var(--glass-text-muted)] italic"
    >
      {selectedTemplate.payload.description}
    </p>
  )}
</div>
```

**Wireframes:** Stitch Project ID `799743150380166181`
- Wireframe 1: Default state (Quick Scan + hint)
- Wireframe 2: Deep Dive selected (updated hint)

**Acceptance:**
- Dropdown shows all research templates with provenance badges
- Hint shows `template.payload.description`, updates on selection change
- Selected templateId passed to sprout creation

---

## Template Data Reference

From `data/seeds/output-templates.json`:

| ID | Name | Description | Default |
|----|------|-------------|---------|
| ot-seed-quick-scan | Quick Scan | Rapid research overview with limited depth | ✅ |
| ot-seed-deep-dive | Deep Dive | Exhaustive research exploration with maximum branching depth | |
| ot-seed-academic | Academic Review | Scholarly literature review with citation emphasis | |
| ot-seed-trends | Trend Analysis | Trend-focused research emphasizing temporal patterns | |

---

## Testing Requirements

### Unit Tests
- US-RL001: Type guard validates templateId field
- US-RL002: PipelineResult includes template provenance

### Integration Tests
- US-RL003: API accepts and uses systemPrompt
- US-RL004: Engine threads systemPrompt to API
- US-RL005: Pipeline loads template and includes provenance

### E2E Tests (Playwright)
- Selector renders with default and hint
- Hint updates on selection change
- Selection persists through sprout creation
- Selector disabled during processing

### Visual Verification
| Screenshot | State |
|------------|-------|
| `research-style-default.png` | Quick Scan selected with hint |
| `research-style-deep-dive-selected.png` | Deep Dive with updated hint |
| `research-style-expanded.png` | Dropdown open |
| `research-style-disabled.png` | Disabled during processing |

---

## Files to Modify

| File | Story | Change |
|------|-------|--------|
| `src/core/schema/sprout.ts` | US-RL001 | Add templateId field |
| `src/core/schema/pipeline.ts` | US-RL002 | Add template provenance |
| `server.js` | US-RL003 | Accept systemPrompt param |
| `src/core/engine/research-execution-engine.ts` | US-RL004 | Thread systemPrompt |
| `src/core/engine/research-pipeline.ts` | US-RL005 | Load template, extract prompt |
| `src/explore/GardenInspector.tsx` | US-RL006 | Add Research Style selector |

---

## Success Criteria

1. **Behavioral Differentiation:** Deep Dive produces noticeably more thorough results than Quick Scan
2. **Provenance Trail:** Every sprout and result records which template was used
3. **User Agency:** Researchers can see and understand template trade-offs before selecting
4. **Backward Compatibility:** Existing sprouts without templateId continue to work

---

## Reference Documents

- **User Stories:** `docs/sprints/research-template-wiring-v1/USER_STORIES.md`
- **Pattern Source:** `src/surface/components/modals/SproutFinishingRoom/components/ReviseForm.tsx`
- **Template Schema:** `src/core/schema/output-template.ts`
- **Seed Data:** `data/seeds/output-templates.json`
