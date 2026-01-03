# Sprint Breakdown: prompt-schema-rationalization-v1

**Sprint:** prompt-schema-rationalization-v1  
**Created:** 2026-01-03  
**Estimated Effort:** ~9 hours

---

## Epic 1: Schema Rationalization

**Goal:** Remove redundant fields from PromptPayload, consolidate display fields in meta.

### Story 1.1: Update Type Definitions

**Task:** Modify `src/core/schema/prompt.ts` to remove redundant fields and add new types.

**Changes:**
- Remove `label`, `description`, `icon`, `tags` from PromptPayload
- Add `PromptVariant`, `PromptSource` type aliases
- Change `SequenceType` to accept string
- Add `stats?: PromptStats` to PromptSequence
- Add `WizardStepConfig` interface
- Add `wizardConfig?: WizardStepConfig` to PromptPayload

**Tests:**
- Type compilation passes
- Existing imports don't break

**Acceptance Criteria:**
- [ ] Zero redundant fields in PromptPayload
- [ ] SequenceType accepts any string
- [ ] WizardStepConfig defined
- [ ] `npm run typecheck` passes

### Story 1.2: Export Type Aliases

**Task:** Ensure all new types are exported for consumer use.

**Changes:**
```typescript
export type { 
  PromptPayload, 
  PromptVariant,
  PromptSource,
  PromptSequence, 
  SequenceType,
  WizardStepConfig,
  // ... existing exports
};
```

**Tests:**
- Consumers can import new types

### Build Gate

```bash
npm run typecheck
npm test -- --grep "prompt.schema"
```

---

## Epic 2: Component Updates

**Goal:** Update PromptWorkshop components to read from meta instead of payload for display fields.

### Story 2.1: Update PromptCard

**Task:** Modify `PromptCard.tsx` to read display fields from meta.

**Changes:**
```typescript
// Replace:
prompt.payload.label      → prompt.meta.title
prompt.payload.description → prompt.meta.description
prompt.payload.icon        → prompt.meta.icon
```

**Tests:**
- [ ] PromptCard renders title from meta
- [ ] PromptCard renders description from meta
- [ ] PromptCard handles missing optional fields

**Acceptance Criteria:**
- [ ] Card displays correctly with new field paths
- [ ] No visual regressions

### Story 2.2: Update PromptEditor

**Task:** Modify `PromptEditor.tsx` to update correct field paths.

**Changes:**
- Add `handleMetaChange` function for meta field updates
- Update Content tab to use meta paths for title/description
- Remove references to payload.label, payload.description, payload.icon, payload.tags
- Update Tags input to write to meta.tags

**Tests:**
- [ ] Editing title updates meta.title
- [ ] Editing description updates meta.description
- [ ] Editing tags updates meta.tags

**Acceptance Criteria:**
- [ ] All edits apply to correct paths
- [ ] Inspector shows correct values after edit

### Story 2.3: Update usePromptData

**Task:** Modify `createDefaultPrompt` to not include redundant fields.

**Changes:**
- Remove payload.label, payload.description, payload.icon, payload.tags from defaults
- Ensure meta fields have sensible defaults

**Tests:**
- [ ] New prompts have correct structure
- [ ] No redundant fields in created prompts

### Story 2.4: Update Config Search Fields

**Task:** Modify `PromptWorkshop.config.ts` search fields.

**Changes:**
- Remove `payload.label` from searchFields (now in meta.title)
- Verify `meta.title` and `meta.description` are searched

**Tests:**
- [ ] Search finds prompts by title
- [ ] Search finds prompts by description

### Build Gate

```bash
npm run typecheck
npm run dev
# Manual: Open PromptWorkshop, verify cards display correctly
# Manual: Edit a prompt, verify changes save correctly
```

---

## Epic 3: Copilot Actions

**Goal:** Implement PromptCopilotActions to satisfy Bedrock Contract Article III.

### Story 3.1: Create PromptCopilotActions File

**Task:** Create `src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts` following LensCopilotActions pattern.

**Changes:**
- Define `PromptCopilotContext` interface
- Define `CopilotActionResult` interface
- Implement `parseSetCommand` for natural language patches
- Implement field path normalization

**Tests:**
- [ ] parseSetCommand returns patches for valid commands
- [ ] parseSetCommand returns null for invalid commands

### Story 3.2: Implement Suggestion Generators

**Task:** Add prompt suggestion functions.

**Functions:**
- `suggestPrompt(context)` — Generate suggested prompt config
- `suggestTargeting(prompt)` — Suggest targeting improvements

**Tests:**
- [ ] suggestPrompt returns valid PromptPayload
- [ ] suggestTargeting returns valid PromptTargeting

### Story 3.3: Implement Validation

**Task:** Add prompt validation function.

**Function:**
- `validatePrompt(prompt)` — Check required fields, valid ranges

**Validations:**
- meta.title required, max 200 chars
- executionPrompt required
- baseWeight 0-100
- sequences have valid structure

**Tests:**
- [ ] Validation catches missing title
- [ ] Validation catches missing executionPrompt
- [ ] Validation catches out-of-range baseWeight

### Story 3.4: Implement Action Dispatcher

**Task:** Add main dispatcher function.

**Function:**
- `handleCopilotAction(actionId, context, userInput?)` — Route to handlers

**Actions:**
| actionId | Handler |
|----------|---------|
| `suggest-prompt` | suggestPrompt |
| `optimize-execution` | (placeholder) |
| `add-to-sequence` | Generate sequence patch |
| `suggest-targeting` | suggestTargeting |
| `validate` | validatePrompt |
| `test-relevance` | (placeholder) |

**Tests:**
- [ ] Dispatcher routes to correct handlers
- [ ] Unknown actions return failure result

### Story 3.5: Wire Copilot to Inspector

**Task:** Ensure Copilot receives context when prompt selected.

**Note:** The console factory already handles Copilot rendering. This story verifies the integration works.

**Tests:**
- [ ] Copilot panel appears in inspector
- [ ] Copilot has access to selected prompt

### Build Gate

```bash
npm run typecheck
npm test -- --grep "PromptCopilotActions"
```

---

## Epic 4: Data Migration

**Goal:** Migrate existing prompts to new schema format.

### Story 4.1: Create Migration Script

**Task:** Create `scripts/migrate-prompts-v2.ts`.

**Features:**
- Detect old format (has payload.label)
- Migrate fields to meta
- Remove redundant payload fields
- Dry-run mode
- Progress reporting

**Tests:**
- [ ] Detects old format correctly
- [ ] Migration produces valid new format
- [ ] Handles already-migrated prompts (skip)

### Story 4.2: Update Seed Script

**Task:** Update `scripts/seed-prompts.ts` to use new schema.

**Changes:**
- Remove label, description, icon, tags from payload
- Ensure meta fields are populated

**Tests:**
- [ ] Seeded prompts have correct structure
- [ ] No redundant fields

### Story 4.3: Run Migration

**Task:** Execute migration against Supabase.

**Steps:**
1. Backup current data
2. Run migration in dry-run mode
3. Review changes
4. Run actual migration
5. Verify in PromptWorkshop

**Tests:**
- [ ] All 57 prompts migrated
- [ ] No data loss
- [ ] PromptWorkshop displays correctly

### Build Gate

```bash
npm run migrate:prompts -- --dry-run
npm run migrate:prompts
npm run dev
# Manual: Verify all prompts display in PromptWorkshop
```

---

## Epic 5: Wizard Integration Documentation

**Goal:** Document wizard unification path for future sprint.

### Story 5.1: Create Integration Guide

**Task:** Create `src/core/schema/wizard-integration.md` with detailed unification documentation.

**Contents:**
- Current state of Pattern 10 (Declarative Wizard Engine)
- How prompts with wizardConfig work
- Migration path from wizard schema to prompts
- Example wizard as prompts
- Console integration plan
- Testing strategy

**Acceptance Criteria:**
- [ ] Document is comprehensive
- [ ] Includes code examples
- [ ] References this sprint's decisions
- [ ] Future developer can implement from doc alone

### Story 5.2: Add Code Comments

**Task:** Add comments in relevant files pointing to wizard-integration.md.

**Files:**
- `src/core/schema/prompt.ts` — Comment on wizardConfig
- `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` — Comment about future wizard tab
- `src/data/wizards/` — Add README pointing to unification plan

**Acceptance Criteria:**
- [ ] Claude can find integration docs from code
- [ ] Comments explain why wizardConfig exists

### Build Gate

```bash
# Manual: Review wizard-integration.md for completeness
# Manual: Search codebase for wizard-integration.md references
```

---

## Epic 6: Testing & Verification

**Goal:** Ensure all changes work correctly.

### Story 6.1: Unit Tests

**Task:** Add/update unit tests.

**Tests:**
- Schema type tests
- Migration function tests
- Copilot action tests

### Story 6.2: Integration Tests

**Task:** Verify component integration.

**Tests:**
- PromptCard renders correctly
- PromptEditor saves correctly
- Console factory integration works

### Story 6.3: E2E Tests

**Task:** Add/update Playwright tests.

**Tests:**
- Create new prompt flow
- Edit existing prompt flow
- Search and filter prompts

### Story 6.4: Manual Verification

**Task:** Manually verify all functionality.

**Checklist:**
- [ ] PromptWorkshop loads
- [ ] All prompts display correctly
- [ ] Create new prompt works
- [ ] Edit prompt works
- [ ] Delete prompt works
- [ ] Search works
- [ ] Filters work
- [ ] Copilot panel appears
- [ ] Copilot actions work

### Build Gate

```bash
npm run typecheck
npm test
npx playwright test
```

---

## Sprint Summary

| Epic | Stories | Estimated Hours |
|------|---------|-----------------|
| Epic 1: Schema Rationalization | 2 | 1.0 |
| Epic 2: Component Updates | 4 | 2.0 |
| Epic 3: Copilot Actions | 5 | 2.0 |
| Epic 4: Data Migration | 3 | 1.0 |
| Epic 5: Wizard Documentation | 2 | 1.0 |
| Epic 6: Testing | 4 | 2.0 |
| **Total** | **20** | **~9 hours** |

---

## Definition of Done

- [x] All stories complete
- [x] All build gates pass
- [x] No type errors (no new errors from this sprint)
- [x] No console errors
- [ ] 57 prompts migrated (pending: run `npx tsx scripts/migrate-prompts-v2.ts`)
- [x] Copilot actions functional
- [x] Wizard documentation complete
- [ ] PR approved and merged

## Sprint Status

**Status:** Complete (pending data migration)
**Completed:** 2026-01-03
**DEV_LOG:** See `DEV_LOG.md` in this directory
