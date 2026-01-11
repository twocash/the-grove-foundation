# Specification: system-prompt-assembly-fix-v1

**Sprint:** system-prompt-assembly-fix-v1  
**Version:** 1.0  
**Date:** January 10, 2026  
**Status:** DRAFT

---

## Constitutional Reference

- [x] Read: The_Trellis_Architecture__First_Order_Directives.md
- [x] Read: Bedrock_Architecture_Specification.md
- [x] Read: PROJECT_PATTERNS.md
- [x] Read: BEDROCK_SPRINT_CONTRACT.md

---

## Domain Contract

**Applicable contract:** BEDROCK_SPRINT_CONTRACT.md  
**Contract version:** 1.1  
**Additional requirements:** This is a core infrastructure fix (server.js) affecting /explore route. Per Article VI Section 6.3, console-specific sections are N/A.

**Contract-specific applicability:**
- Console Implementation Checklist: N/A (server-side fix)
- Copilot Actions: N/A (no console involved)
- Feature Parity Status: N/A (bug fix, not feature)
- DEX Compliance Matrix: **REQUIRED**

---

## Problem Statement

The `/explore` route's system prompt does not respect the `closingBehavior` setting stored in Supabase. The active system prompt has `closingBehavior: 'open'` configured, but the LLM still ends responses with questions because:

1. `assemblePromptContent()` only extracts text sections, ignoring behavioral settings
2. `fetchActiveSystemPrompt()` returns only the assembled text content
3. `buildSystemPrompt()` only applies behavioral instructions when frontend sends `personaBehaviors`
4. When no lens is active, frontend sends `{}`, so `hasCustomBehaviors = false`
5. The code falls back to using `baseSystemPrompt` without any closing behavior instruction

**Result:** LLM follows the `structureRules` text (which mentions "corridors") and interprets this as ending with questions, even though `closingBehavior: 'open'` is configured.

---

## Goals

1. **Primary:** System prompt behavioral settings from Supabase are applied to /explore route
2. **Secondary:** Maintain backward compatibility with lens-based behaviors on Terminal
3. **Tertiary:** Align implementation with experiences-console-spec-v1.1.md

---

## Non-Goals

- Modifying Terminal route behavior
- Frontend changes to KineticStream
- Adding new system prompt fields
- Changing the Supabase schema
- Creating new API endpoints

---

## Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | `/explore` chat respects `closingBehavior: 'open'` | Manual test: responses end naturally |
| AC2 | `/terminal` with lens continues using lens behaviors | Manual test: lens behaviors override |
| AC3 | `/terminal` without lens uses Supabase defaults | Manual test: fallback works |
| AC4 | GCS fallback path unchanged | Code review: no changes to GCS logic |
| AC5 | Build passes | `npm run build` succeeds |

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| System prompt assembly | Pattern 3: Narrative Schema | Extend to return behavioral metadata, not just text |
| Behavioral defaults | N/A (currently hardcoded) | Extract from Supabase payload |

## New Patterns Proposed

None. This is a bug fix aligning implementation with existing spec.

---

## Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| System prompt assembly | `server.js:assemblePromptContent()` | ✅ Single location | EXTEND (add behavioral return) |
| System prompt fetch | `server.js:fetchActiveSystemPrompt()` | ✅ Single location | EXTEND (return metadata) |
| System prompt build | `server.js:buildSystemPrompt()` | ✅ Single location | EXTEND (use Supabase defaults) |
| Closing behavior constants | `server.js:CLOSING_BEHAVIORS` | ✅ Single location | Keep |

### No Duplication Certification

I confirm this sprint does not create parallel implementations of existing capabilities.

---

## DEX Compliance Matrix

### Feature: Supabase-Sourced Behavioral Settings

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ Pass | Domain expert can modify `closingBehavior` in Supabase without code changes |
| Capability Agnosticism | ✅ Pass | If model ignores instruction, system doesn't break—just suboptimal UX |
| Provenance as Infrastructure | ✅ Pass | Settings traceable to `system_prompts` table with `meta.id` and `version` |
| Organic Scalability | ✅ Pass | New behavioral modes can be added to Supabase schema without code changes |

**Blocking issues:** None

---

## Technical Approach

### Data Flow (Fixed)

```
Supabase system_prompts table
  ├── payload.identity ─────────────────┐
  ├── payload.voiceGuidelines ──────────┤
  ├── payload.structureRules ───────────┼──> assemblePromptContent() ──> text content
  ├── payload.knowledgeInstructions ────┤
  ├── payload.boundaries ───────────────┘
  │
  ├── payload.responseMode ─────────────┐
  ├── payload.closingBehavior ──────────┼──> fetchActiveSystemPrompt() ──> { content, behaviors }
  ├── payload.useBreadcrumbTags ────────┤
  ├── payload.useTopicTags ─────────────┤
  └── payload.useNavigationBlocks ──────┘
                                              ↓
                                    buildSystemPrompt()
                                              ↓
                               Uses Supabase behaviors as DEFAULTS
                                              ↓
                               Frontend personaBehaviors OVERRIDES (if present)
```

### Key Changes

1. **`fetchActiveSystemPrompt()`** returns object with `content` and behavioral metadata
2. **`buildSystemPrompt()`** accepts systemConfig object and uses its behaviors as defaults
3. **Fallback chain** maintains GCS and static fallback with default behaviors

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking Terminal | Low | High | Lens behaviors still override; test both routes |
| Changing return type breaks callers | Medium | Medium | Check all `fetchActiveSystemPrompt()` call sites |
| Missing fields in Supabase | Low | Low | Defaults handle gracefully |

---

## Out of Scope

- Exposing behavioral settings in /explore UI
- Adding new behavioral modes
- Modifying the frontend KineticStream component
- Creating admin UI for behavioral settings (already exists in ExperiencesConsole)

---

## Dependencies

- Supabase `system_prompts` table (exists)
- Active system prompt with `closingBehavior` field (exists)
- `CLOSING_BEHAVIORS` constants in server.js (exists)

---

## Timeline

**Estimated effort:** 1-2 hours (focused server.js changes)

---

*Specification approved for ARCHITECTURE.md phase.*
