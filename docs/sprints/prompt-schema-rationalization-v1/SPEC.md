# Specification: prompt-schema-rationalization-v1

**Sprint:** prompt-schema-rationalization-v1  
**Status:** Planning  
**Created:** 2026-01-03  
**Author:** Jim Calhoun + Claude

---

## Constitutional Reference

- [x] Read: The_Trellis_Architecture__First_Order_Directives.md
- [x] Read: Bedrock_Architecture_Specification.md
- [x] Read: BEDROCK-SPRINT-CONTRACT.md
- [x] Read: PROJECT_PATTERNS.md

---

## Domain Contract

**Applicable contract:** BEDROCK-SPRINT-CONTRACT.md  
**Contract version:** 1.0  
**Additional requirements:** Console pattern, Copilot mandate, GroveObject compliance

---

## Problem Statement

The Prompt schema has evolved to become Grove's **atomic unit of contextual content**. However:

1. **Redundancy:** Display fields (`label`, `description`, `icon`, `tags`) exist in both `meta` and `payload`
2. **Missing Copilot:** PromptWorkshop lacks Copilot actions (Bedrock Contract violation)
3. **Analytics gap:** Cannot compare prompt performance across sequences
4. **Wizard divergence:** Pattern 10 (Wizard Engine) uses a separate schema that should unify

---

## Goals

| Goal | Success Criteria |
|------|------------------|
| Eliminate schema redundancy | Zero display fields in payload |
| Bedrock compliance | Copilot actions implemented |
| Cross-sequence analytics | Sequence-scoped stats in schema |
| Wizard documentation | Clear unification path documented |
| Data migration | All 57 prompts migrated without data loss |

---

## Non-Goals

- Building a Sequence first-class object (deferred)
- Full wizard unification implementation (documented only)
- New console views or navigation patterns
- Performance optimization

---

## Schema Changes

### Before (Current)

```typescript
interface PromptPayload {
  label: string;                    // REDUNDANT with meta.title
  description?: string;             // REDUNDANT with meta.description
  icon?: string;                    // REDUNDANT with meta.icon
  tags: string[];                   // REDUNDANT with meta.tags
  executionPrompt: string;
  systemContext?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: PromptTargeting;
  baseWeight?: number;
  sequences?: PromptSequence[];
  stats: PromptStats;
  source: 'library' | 'generated' | 'user';
  generatedFrom?: PromptGenerationContext;
  cooldownMs?: number;
  maxShows?: number;
}

interface PromptSequence {
  groupId: string;
  groupType: SequenceType;
  order: number;
  bridgeAfter?: string;
  titleOverride?: string;
  successCriteria?: { ... };
}

type SequenceType = 'journey' | 'briefing' | 'wizard' | 'tour' | 'research' | 'faq';
```

### After (Rationalized)

```typescript
interface PromptPayload {
  // === Content ===
  executionPrompt: string;
  systemContext?: string;
  
  // === Presentation ===
  variant?: PromptVariant;
  
  // === Relevance ===
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  baseWeight: number;
  
  // === Targeting ===
  targeting: PromptTargeting;
  
  // === Sequence Membership ===
  sequences?: PromptSequence[];
  
  // === Global Stats ===
  stats: PromptStats;
  
  // === Provenance ===
  source: PromptSource;
  generatedFrom?: GenerationContext;
  
  // === Rate Limiting ===
  cooldownMs?: number;
  maxShows?: number;
  
  // === Wizard Support (optional) ===
  wizardConfig?: WizardStepConfig;
}

type PromptVariant = 'default' | 'glow' | 'subtle' | 'urgent';
type PromptSource = 'library' | 'generated' | 'user';

// Sequence type is string for extensibility
type SequenceType = 'journey' | 'briefing' | 'wizard' | 'tour' | 'research' | 'faq' | string;

interface PromptSequence {
  groupType: SequenceType;
  groupId: string;
  order: number;
  titleOverride?: string;
  bridgeAfter?: string;
  successCriteria?: SuccessCriteria;
  stats?: PromptStats;              // NEW: sequence-scoped analytics
}

interface WizardStepConfig {
  stepType: WizardStepType;
  choices?: WizardChoice[];
  inputKey?: string;
  validation?: InputValidation;
  nextConditions?: ConditionalNext[];
  defaultNext?: string;
}

type WizardStepType = 'consent' | 'choice' | 'text' | 'generation' | 'selection' | 'confirmation';
```

### Display Fields (Now Meta Only)

| Field | Old Location | New Location |
|-------|--------------|--------------|
| `label` | `payload.label` | `meta.title` |
| `description` | `payload.description` | `meta.description` |
| `icon` | `payload.icon` | `meta.icon` |
| `tags` | `payload.tags` | `meta.tags` |
| `color` | derived from variant | `meta.color` (derived) |

---

## DEX Compliance Matrix

### Feature: Schema Rationalization

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ PASS | Display via meta, behavior via payload config |
| Capability Agnosticism | ✅ PASS | Schema works regardless of model capability |
| Provenance as Infrastructure | ✅ PASS | meta.createdBy, generatedFrom preserved |
| Organic Scalability | ✅ PASS | SequenceType accepts string for future types |

### Feature: Copilot Actions

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ PASS | Actions generate patches, not mutations |
| Capability Agnosticism | ✅ PASS | Actions work with any model |
| Provenance as Infrastructure | ⚠️ PARTIAL | Patches need audit trail (future) |
| Organic Scalability | ✅ PASS | New actions added without code changes |

### Feature: Sequence-Scoped Stats

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ PASS | Stats schema is config, not code |
| Capability Agnosticism | ✅ PASS | Stats tracking is model-independent |
| Provenance as Infrastructure | ✅ PASS | Stats per sequence maintain context |
| Organic Scalability | ✅ PASS | New sequence types get stats automatically |

---

## Console Implementation Checklist

- [x] Uses `BedrockLayout` as shell (via createBedrockConsole factory)
- [x] Header displays: title, description, primary action
- [x] Metrics row shows 4-6 relevant stats
- [x] Navigation column uses factory pattern
- [x] Content area uses `ObjectGrid` or appropriate view
- [x] Inspector uses `BedrockInspector` shell
- [ ] **Copilot panel integrated with console context** ← This sprint
- [x] Navigation declaratively configured in config
- [x] All object types use `GroveObject` schema

---

## Copilot Actions

| Action | Trigger | Output | Model Preference |
|--------|---------|--------|------------------|
| `suggest-prompt` | "Create a prompt for..." | Suggested PromptPayload | hybrid |
| `optimize-execution` | "Improve this prompt" | Patches to executionPrompt | cloud |
| `add-to-sequence` | "Add to journey X" | Patch adding sequence membership | local |
| `suggest-targeting` | "Who should see this?" | Patches to targeting | hybrid |
| `validate` | "Check this prompt" | Validation results | local |
| `test-relevance` | "Test against context" | Relevance scoring results | local |

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Copilot actions | LensCopilotActions | Create PromptCopilotActions with same structure |
| Schema cleanup | GroveObject pattern | Remove payload redundancy, use meta |
| Sequence filter | ConsoleFactory filterOptions | Add derived sequence filter |
| Wizard support | None (new) | Add optional wizardConfig to payload |

---

## New Patterns Proposed

**None.** All work extends existing patterns.

---

## Feature Parity Status

| Feature | Legacy Location | Bedrock Status | Parity? |
|---------|-----------------|----------------|---------|
| Prompt editing | N/A (new) | PromptEditor.tsx | ✅ |
| Prompt grid | N/A (new) | via factory | ✅ |
| Sequence membership | N/A (new) | sequences tab | ✅ |
| Copilot integration | N/A (new) | **This sprint** | ⏳ |
| Wizard integration | Pattern 10 | Documented | ⏳ |

---

## Migration Strategy

### Data Migration

1. Read existing prompts from Supabase
2. For each prompt:
   - Move `payload.label` → `meta.title`
   - Move `payload.description` → `meta.description`
   - Move `payload.icon` → `meta.icon`
   - Move `payload.tags` → `meta.tags`
   - Derive `meta.color` from `payload.variant`
   - Remove redundant payload fields
3. Write updated prompts back to Supabase
4. Verify count matches

### Backward Compatibility

The migration script will handle prompts in either format:

```typescript
function normalizePrompt(prompt: GroveObject<any>): GroveObject<PromptPayload> {
  // If old format (has payload.label), migrate
  // If new format, pass through
}
```

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | High | Backup before migration, test locally |
| Type errors after schema change | Medium | Medium | Run typecheck before/after |
| Copilot actions incomplete | Low | Medium | Mirror LensCopilotActions exactly |
| Wizard docs unclear | Low | Low | Include concrete code examples |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Schema redundancy | Zero redundant fields |
| Copilot actions | 6 actions implemented |
| Data migration | 57/57 prompts migrated |
| Type errors | Zero after migration |
| Wizard documentation | Complete unification guide |

---

## Timeline Estimate

| Phase | Effort |
|-------|--------|
| Schema changes | 1 hour |
| Component updates | 2 hours |
| Copilot actions | 2 hours |
| Migration script | 1 hour |
| Wizard documentation | 1 hour |
| Testing | 2 hours |
| **Total** | **~9 hours** |

---

## Approval

- [ ] Schema changes approved
- [ ] Migration strategy approved
- [ ] Copilot actions scope approved
- [ ] Wizard documentation scope approved
