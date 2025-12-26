# Specification: wizard-engine-v1

**Sprint:** Declarative Wizard Engine  
**Version:** 1.0  
**Author:** Grove Foundation Team  
**Date:** December 2024

---

## Problem Statement

Grove needs multi-step user flows for creating personalized content:
- **Custom Lenses** — Personality-based content filtering (exists)
- **Custom Journeys** — User-defined exploration paths (planned)
- **Onboarding Flows** — Guided first-time experience (planned)
- **Preference Wizards** — Settings configuration (future)

Currently, CustomLensWizard hard-codes its flow logic in TypeScript. Each new wizard requires:
- New React components per step
- Duplicate state management
- Separate analytics integration
- Repeated flow logic

**This violates Declarative Sovereignty** — domain experts cannot create new wizards without engineering involvement.

---

## Solution

Separate wizard **definition** (JSON schema) from wizard **execution** (React engine).

```
wizard-schema.json  →  WizardEngine.tsx  →  Rendered wizard
     (data)              (interpreter)        (UI)
```

**The Principle:** Wizard definition is JSON. Wizard execution is the engine.

---

## Scope

### In Scope

1. **Wizard Schema Types** — TypeScript interfaces for wizard JSON
2. **WizardEngine Component** — Generic orchestrator
3. **Step Renderers** — 6 generic step components
4. **useWizardState Hook** — State management
5. **Condition Evaluator** — Simple expression interpreter
6. **Lens Wizard Schema** — JSON extraction of current wizard
7. **Migration** — Replace CustomLensWizard with engine

### Out of Scope (Future Sprints)

- Journey wizard schema (future sprint)
- Onboarding wizard schema (future sprint)
- Visual schema editor (future sprint)
- Schema validation tooling (future sprint)

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Engine renders wizard from JSON schema | P0 |
| FR-2 | All 6 step types supported (consent, choice, text, generation, selection, confirmation) | P0 |
| FR-3 | Conditional navigation works from schema | P0 |
| FR-4 | Generation step calls configurable endpoint | P0 |
| FR-5 | Analytics events fire per schema config | P1 |
| FR-6 | Progress bar reflects schema progress values | P1 |
| FR-7 | Back navigation works correctly | P1 |
| FR-8 | Error handling for generation failures | P1 |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Visual appearance unchanged from current wizard | P0 |
| NFR-2 | Code reduction ≥50% for lens wizard | P1 |
| NFR-3 | Schema is human-readable JSON | P1 |
| NFR-4 | Type-safe schema loading | P1 |

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Step rendering | None (new pattern) | Create Pattern 10: Declarative Wizard Engine |
| State management | Pattern 2 (Engagement Machine) | Use local state with similar reducer pattern |
| Styling | Pattern 4 (Token Namespaces) | Reuse existing tokens |
| Analytics | Existing funnel analytics | Configure events via schema |

## New Patterns Proposed

### Pattern 10: Declarative Wizard Engine

**Why existing patterns are insufficient:**  
No existing pattern handles multi-step flows with conditional branching, AI generation, and schema-driven configuration. This is a novel capability.

**DEX compliance:**
- **Declarative Sovereignty:** Domain experts create wizards via JSON editing
- **Capability Agnosticism:** Engine works regardless of AI model
- **Provenance:** Every completion creates artifact with full input chain
- **Organic Scalability:** New wizards = new JSON file, no code changes

**Documentation:** `docs/patterns/pattern-10-declarative-wizard-engine.md`

---

## Schema Specification Summary

### Top-Level Structure

```typescript
interface WizardSchema {
  id: string;
  version: string;
  title: string;
  description?: string;
  steps: WizardStepSchema[];
  initialStep: string;
  generation?: GenerationConfig;
  output: OutputConfig;
  analytics?: AnalyticsConfig;
  theme?: ThemeConfig;
}
```

### Step Types

| Type | Purpose | Key Fields |
|------|---------|------------|
| `consent` | Privacy/intro | headline, guarantees[], acceptAction |
| `choice` | Single select | question, options[], inputKey, next (conditional) |
| `text` | Free text input | question, inputKey, maxLength, optional |
| `generation` | AI processing | loadingMessage, endpoint reference |
| `selection` | Pick from generated | optionsKey, outputKey, cardRenderer |
| `confirmation` | Final review | displayKey, benefits[], confirmLabel |

### Conditional Navigation

```json
{
  "next": {
    "conditions": [
      { "if": "motivation === 'worried-about-ai'", "then": "concerns" }
    ],
    "default": "outlook"
  }
}
```

---

## Acceptance Criteria

### Engine Core
- [ ] WizardEngine accepts schema prop and renders correctly
- [ ] useWizardState manages step navigation
- [ ] Condition evaluator handles simple equality expressions
- [ ] All 6 step types render from schema

### Lens Wizard Migration
- [ ] Lens wizard schema created (JSON file)
- [ ] CustomLensWizard uses WizardEngine
- [ ] All existing flows work identically
- [ ] Analytics events still fire

### Code Quality
- [ ] TypeScript types for all schema elements
- [ ] No `any` types in engine code
- [ ] Build passes with no errors
- [ ] Existing tests pass

---

## User Stories

### US-1: Domain Expert Creates Wizard
**As a** domain expert  
**I want to** create a new wizard by editing a JSON file  
**So that** I don't need engineering involvement for personalization flows

**Acceptance:**
- JSON file defines all steps, questions, options
- Engine renders wizard from JSON
- No code changes required

### US-2: Conditional Question Flow
**As a** user  
**I want to** see relevant follow-up questions based on my answers  
**So that** the wizard feels personalized to my situation

**Acceptance:**
- Schema defines conditional navigation
- Engine evaluates conditions and routes accordingly
- User only sees relevant questions

### US-3: AI-Generated Options
**As a** user  
**I want to** receive AI-generated personalized options  
**So that** my lens/journey fits my unique perspective

**Acceptance:**
- Generation step shows loading state
- Engine calls configured endpoint
- Generated options display in selection step
- Error handling for failed generation

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| React 18+ | Runtime | Hooks, functional components |
| TypeScript 5+ | Build | Strict mode enabled |
| Tailwind CSS | Styling | Existing design tokens |
| `/api/generate-lens` | API | Existing endpoint |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Feature parity gap | Medium | High | Detailed comparison checklist |
| Expression evaluation security | Low | High | Allowlist operators, no eval() |
| Type safety loss | Medium | Medium | Generate types from schema |
| Analytics regression | Low | Medium | Test each event fires |

---

*Specification finalized: December 2024*
