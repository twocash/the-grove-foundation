# Output Templates Architecture v1 - Execution Contract

**Codename:** `prompt-template-architecture-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post agents-go-live-v1)
**Date:** 2026-01-21

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Contract Setup |
| **Status** | 📝 Ready for Execution |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-21 |
| **Next Action** | Developer agent begins Phase 1 |

---

## Attention Anchor

**We are building:** Configurable output templates for Writer and Research agents, following the fork-to-customize pattern with system seeds.

**Success looks like:**
1. Users can view/fork system-seed templates in Experience Console
2. Templates control how Writer Agent transforms research into documents
3. Research Agent templates control exploration behavior
4. Sprout Refinement Room shows template selection for artifact generation
5. All templates tracked with full provenance (source, forkedFromId, version)

---

## Product Approval Summary

| Approval | Status | Date | Notes |
|----------|--------|------|-------|
| UX Chief | ✅ APPROVED | 2026-01-21 | WIREFRAMES.md v3.0 |
| Product Manager | ✅ APPROVED | 2026-01-21 | Ready for Handoff |
| User Scope | ✅ CONFIRMED | 2026-01-21 | Research Agent IN SCOPE |

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
└── src/workspace/*

ACTIVE BUILD ZONE — WHERE WE WORK
├── /explore route
├── /bedrock route
├── src/explore/*
├── src/bedrock/consoles/ExperienceConsole/*
├── src/core/schema/*
└── tests/e2e/*
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| OutputTemplate schema | ✅ Zod schema | ✅ systemPrompt is model-agnostic | ✅ source, forkedFromId, version | ✅ agentType enum extensible |
| OutputTemplateCard | ✅ Props-driven | ✅ No LLM calls | ✅ Shows source badge | ✅ Factory pattern |
| OutputTemplateEditor | ✅ Patch-based edits | ✅ No LLM calls | ✅ Fork flow preserves origin | ✅ Follows WriterConfigEditor |
| Console Integration | ✅ Tab in Experience | ✅ N/A | ✅ Full GroveObject meta | ✅ Same factory |
| API Integration | ✅ Template selection | ✅ Prompt passed to any LLM | ✅ Template ID tracked | ✅ Endpoint pattern |

---

## Schema Design

### OutputTemplatePayload

```typescript
// src/core/schema/output-template.ts

interface OutputTemplatePayload {
  // === VERSIONING ===
  version: number;
  previousVersionId?: string;
  changelog?: string;

  // === IDENTITY ===
  name: string;
  description?: string;

  // === AGENT BINDING ===
  agentType: 'writer' | 'research' | 'code';  // Extensible

  // === CORE INSTRUCTION ===
  systemPrompt: string;

  // === AGENT-SPECIFIC CONFIG ===
  config: {
    category?: string;        // User-extensible: 'technical', 'vision', 'policy', etc.
    citationStyle?: 'chicago' | 'apa' | 'mla';
    citationFormat?: 'endnotes' | 'inline';
    // Future: language, lintRules for code agent
  };

  // === LIFECYCLE ===
  status: 'active' | 'archived' | 'draft';
  isDefault: boolean;

  // === PROVENANCE ===
  source: 'system-seed' | 'user-created' | 'imported' | 'forked';
  forkedFromId?: string;
}
```

### GroveObject Integration

```typescript
// GroveObject<OutputTemplatePayload>
{
  meta: {
    id: 'ot-uuid-123',
    type: 'output-template',  // Add to GroveObjectType
    title: 'Engineering / Architecture',
    description: 'Technical analysis with implementation considerations',
    icon: '📐',
    createdAt: '2026-01-21T00:00:00Z',
    updatedAt: '2026-01-21T00:00:00Z',
    status: 'active',
    tags: ['technical', 'writer'],
  },
  payload: OutputTemplatePayload
}
```

---

## System Seed Templates (4 Required)

### Writer Agent Seeds

| Name | Icon | Category | Purpose |
|------|------|----------|---------|
| Engineering / Architecture | 📐 | technical | Technical analysis with implementation patterns |
| Vision Paper | 🔮 | strategy | Forward-looking strategic perspective |
| Higher Ed Policy | 🎓 | policy | Policy analysis for academic contexts |
| Blog Post | 📝 | content | Accessible content for general audience |

### Research Agent Seeds

| Name | Icon | Category | Purpose |
|------|------|----------|---------|
| Deep Dive | 🔬 | research | Exhaustive exploration with maximum branching |
| Quick Scan | ⚡ | research | Fast overview with limited depth |
| Academic Review | 📚 | research | Scholarly sources with citation emphasis |
| Trend Analysis | 📈 | research | Focus on emerging patterns and developments |

---

## UI Components

### OutputTemplateCard

Reference: `WriterAgentConfigCard.tsx`

Features:
- Category color bar at top
- Source badge: `SYSTEM` | `FORKED` | `IMPORTED` (no badge = user-created)
- Status badge: `● Active` | `○ Draft` | `◌ Archived`
- Icon + Title + Version
- Description (2-line clamp)
- Favorite toggle
- Selected state styling

### OutputTemplateEditor

Reference: `WriterAgentConfigEditor.tsx`

System Seed Mode (read-only):
- 🔒 icons on all inputs
- `[Fork to Customize]` button (prominent)
- `[Archive]` button
- Info banner: "This is a system template. Fork it to create your own version."

User/Forked Mode (editable):
- All fields editable
- Status dropdown (draft → active → archived)
- `[Duplicate]` `[Archive]` `[Delete]` buttons
- `[Save]` button (changes pending state)

Draft Footer:
- "Draft — This template is not yet available for use"
- `[Delete]` `[Save Draft]` `[Publish]`

### Fork Flow

1. User selects system-seed template
2. User clicks `[Fork to Customize]`
3. System creates new template:
   - `source: 'forked'`
   - `forkedFromId: {original-id}`
   - `name: "My {original-name}"`
   - `status: 'draft'`
   - All other fields copied
4. New template selected in list
5. Inspector shows editable form
6. User customizes and clicks `[Publish]` when ready

---

## Console Integration

### Experience Console Tab

```
[Lifecycle Models] [Research Agent] [Writer Agent] [★ Output Templates]
                                                    ↑ NEW TAB
```

Section layout:
- Left: Card grid with filters (source, status, agentType)
- Right: Inspector (OutputTemplateEditor)
- Top: `[+ New]` button
- Filter row: `[All ▼] [Active ▼] [Writer ▼]`
              └─source └─status  └─agentType

### Sprout Refinement Room Integration

Template selection bar at bottom of modal:
- Only shows `status: 'active'` templates
- Grouped by agentType (Writer templates for document generation)
- Click template → Generate artifact
- ✓ badge on templates already used for this sprout
- `[+ Generate Another]` button when artifacts exist

---

## API Endpoints

### Template CRUD

Follows existing GroveData pattern via `useOutputTemplateData()` hook:
- `list()` - List all templates
- `get(id)` - Get single template
- `create(payload)` - Create new template
- `update(id, patch)` - Update template
- `delete(id)` - Delete template
- `activate(id)` - Set as active (status transition)

### Writer Agent Integration

Modify `/api/generate-document` (or equivalent):
- Accept `templateId` parameter
- Load template's `systemPrompt`
- Inject into Writer Agent prompt

### Research Agent Integration

Modify `/api/research` endpoint:
- Accept `templateId` parameter
- Load template's `systemPrompt`
- Configure branching depth, source preferences

---

## Database Schema

### Supabase: output_templates

```sql
CREATE TABLE output_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- GroveObject Meta
  type TEXT NOT NULL DEFAULT 'output-template',
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  tags TEXT[],
  favorite BOOLEAN DEFAULT FALSE,

  -- Payload
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES output_templates(id),
  changelog TEXT,
  name TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('writer', 'research', 'code')),
  system_prompt TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  source TEXT NOT NULL CHECK (source IN ('system-seed', 'user-created', 'imported', 'forked')),
  forked_from_id UUID REFERENCES output_templates(id),

  -- Constraints
  CONSTRAINT unique_default_per_agent UNIQUE NULLS NOT DISTINCT (agent_type, is_default) WHERE is_default = true
);

-- Indexes
CREATE INDEX idx_output_templates_agent_type ON output_templates(agent_type);
CREATE INDEX idx_output_templates_status ON output_templates(status);
CREATE INDEX idx_output_templates_source ON output_templates(source);
```

---

## Execution Architecture

### Phase 1: Schema Foundation (Core)
**Gate:** `npm run build` passes, schema exports verified

1a. Create `src/core/schema/output-template.ts`
   - Zod schema with all fields
   - TypeScript types exported
   - Default payload factory function

1b. Add `'output-template'` to `GroveObjectType` in grove-object.ts

1c. Create system seed JSON data file
   - `data/seeds/output-templates.json`
   - 4 Writer seeds + 4 Research seeds

**DEX Check:**
- [ ] Declarative: Schema defines all behavior
- [ ] Agnostic: No model-specific code
- [ ] Provenance: source, forkedFromId in schema
- [ ] Scalable: agentType enum for extension

---

### Phase 2: Database & Data Hook
**Gate:** Hook tests pass, data persists

2a. Create Supabase migration
   - `supabase/migrations/xxx_create_output_templates.sql`

2b. Create seed data migration
   - Insert 8 system seeds

2c. Create `useOutputTemplateData()` hook
   - Following `useWriterAgentConfigData()` pattern
   - CRUD operations
   - `fork(id)` helper for fork flow
   - `activate(id)` helper

**DEX Check:**
- [ ] Provenance: All seeds have `source: 'system-seed'`
- [ ] Scalable: Hook uses GroveData pattern

---

### Phase 3: Card Component
**Gate:** Card renders in Storybook/isolation, screenshot captured

3a. Create `OutputTemplateCard.tsx`
   - Source badge logic (SYSTEM/FORKED/IMPORTED/none)
   - Status badge (Active/Draft/Archived)
   - Category color bar
   - Favorite toggle

3b. Visual verification at `/bedrock/experience`

**Screenshot:** `screenshots/3b-card-grid.png`

---

### Phase 4: Editor Component
**Gate:** Editor renders, fork flow works, screenshot captured

4a. Create `OutputTemplateEditor.tsx`
   - Read-only mode for system seeds
   - Editable mode for user/forked
   - Fork button triggers `fork()` hook
   - All sections (Identity, System Prompt, Config, Provenance)

4b. Fork flow end-to-end test
   - Select system seed → Click Fork → New draft created

4c. Visual verification

**Screenshot:** `screenshots/4c-editor-fork-flow.png`

---

### Phase 5: Console Integration
**Gate:** Tab visible, section works, screenshot captured

5a. Add "Output Templates" tab to Experience Console
   - Tab icon and label
   - Filter row implementation

5b. Wire OutputTemplateCard + OutputTemplateEditor
   - List view on left
   - Inspector on right
   - Selection state

5c. Visual verification with all filter combinations

**Screenshot:** `screenshots/5c-console-integration.png`

---

### Phase 6: Sprout Refinement Room
**Gate:** Template selection works, artifact generates

6a. Add template selection bar to Refinement Room modal
   - Filter: `status: 'active'` AND `agentType: 'writer'`
   - Click template → trigger generation

6b. Generation status UI
   - Progress indicator in center
   - Steps checklist in inspector

6c. Artifact card with template badge
   - Show which template was used

**Screenshot:** `screenshots/6c-refinement-room.png`

---

### Phase 7: API Wiring
**Gate:** Template prompt reaches agent, artifact quality matches template

7a. Modify Writer Agent endpoint
   - Accept `templateId` parameter
   - Load and inject `systemPrompt`

7b. Modify Research Agent endpoint (if applicable)
   - Accept `templateId` parameter
   - Configure behavior from template

7c. Integration test
   - Generate document with Engineering template
   - Verify output matches technical style

---

### Phase 8: E2E Verification
**Gate:** All E2E tests pass with console monitoring, REVIEW.html complete

8a. Create `tests/e2e/output-templates.spec.ts`
   - Console monitoring enabled
   - Full lifecycle coverage

8b. Test cases:
   - TC-01: View system templates in Experience Console
   - TC-02: Fork a system template
   - TC-03: Edit and publish forked template
   - TC-04: Select template in Refinement Room
   - TC-05: Generate artifact with template
   - TC-06: Filter templates by agent type
   - TC-07: Archive template
   - TC-08: Full session without console errors

8c. Complete REVIEW.html with all screenshots

---

## Success Criteria

### Sprint Complete When:
- [ ] All 8 phases completed with verification
- [ ] All DEX compliance checks pass
- [ ] All screenshots captured and embedded in REVIEW.html
- [ ] REVIEW.html complete with all sections
- [ ] E2E test with console monitoring passes
- [ ] Zero critical console errors in E2E tests
- [ ] Build and lint pass
- [ ] User notified with REVIEW.html path

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase without screenshot evidence
- ❌ DEX compliance test fails
- ❌ REVIEW.html not created or incomplete
- ❌ E2E test not created or missing console monitoring
- ❌ Critical console errors detected

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| agents-go-live-v1 | ✅ Merged | Writer Agent functional |
| S19-BD-JsonRenderFactory | ✅ Merged | json-render pattern available |
| Experience Console | ✅ Exists | Tab integration point |
| Sprout Refinement Room | ✅ Exists | Template selection target |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Schema drift | Use Zod validation everywhere |
| Fork race condition | Optimistic UI + server validation |
| Template selection UX confusion | Clear visual distinction system vs user |
| Research Agent scope creep | Templates only; agent behavior unchanged |

---

*This contract is binding. Deviation requires explicit human approval.*
