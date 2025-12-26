# Specification: Copilot Configurator v1

**Sprint:** copilot-configurator-v1  
**Version:** 1.0  
**Status:** Draft

---

## Overview

The Copilot Configurator embeds a natural language assistant into the Object Inspector, enabling users to edit Grove objects through conversation rather than direct JSON manipulation.

**Primary Goal:** Demonstrate that local 7B models can reliably transform natural language into structured configuration changes.

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Object display | Pattern 7: Object Model | Add mutation methods alongside read |
| Panel styling | Pattern 4: Styling Tokens | Add `--copilot-*` namespace |
| Inspector rendering | Pattern 8: Canonical Source | Copilot is embedded, not duplicated |
| Type awareness | Pattern 3: Narrative Schema | Use existing type definitions for validation |

## New Pattern Proposed

### Pattern 11: Schema-Constrained AI Operations

**Why existing patterns are insufficient:**
No existing pattern addresses AI-assisted operations bounded by schema validation. This is a novel capability requiring new infrastructure.

**DEX Compliance:**
- **Declarative Sovereignty:** Users edit via natural language; schema defines valid operations
- **Capability Agnosticism:** Works with any model (simulated, local 7B, frontier API)
- **Provenance:** All edits logged with source="copilot", model used, timestamp
- **Organic Scalability:** New object types automatically get Copilot support via schema

---

## Requirements

### REQ-01: Copilot Panel Rendering

**Priority:** P0 (Must Have)

The Copilot panel SHALL render as a fixed-bottom section within ObjectInspector.

**Acceptance Criteria:**
- [ ] Panel appears below META/PAYLOAD sections
- [ ] Panel has distinct header with "Copilot Configurator" title
- [ ] Panel shows "Beta" badge
- [ ] Panel is collapsible (state persisted in session)
- [ ] Panel does not scroll with JSON content

### REQ-02: Message History Display

**Priority:** P0 (Must Have)

The Copilot SHALL display a scrollable message history.

**Acceptance Criteria:**
- [ ] Assistant messages render with bot icon, left-aligned
- [ ] User messages render with person icon, right-aligned
- [ ] Messages show timestamp ("Just now", "2m ago", etc.)
- [ ] History scrolls independently of inspector content
- [ ] Maximum 50 messages retained per session

### REQ-03: Natural Language Input

**Priority:** P0 (Must Have)

Users SHALL input edit requests via text field.

**Acceptance Criteria:**
- [ ] Textarea auto-expands up to 3 lines
- [ ] Enter key sends message (Shift+Enter for newline)
- [ ] Send button enabled only when input non-empty
- [ ] Input clears after sending
- [ ] Placeholder text: "Ask Copilot to edit configuration..."

### REQ-04: Intent Parsing (Simulated)

**Priority:** P0 (Must Have)

The system SHALL parse user intent into structured operations.

**Supported Intents:**
| Intent | Example | Output |
|--------|---------|--------|
| SET_FIELD | "set title to 'New Title'" | `{ op: 'replace', path: '/meta/title', value: 'New Title' }` |
| UPDATE_FIELD | "make description shorter" | `{ op: 'replace', path: '/meta/description', value: '...' }` |
| ADD_TAG | "add tag 'important'" | `{ op: 'add', path: '/meta/tags/-', value: 'important' }` |
| REMOVE_TAG | "remove tag 'draft'" | `{ op: 'remove', path: '/meta/tags/0' }` |
| TOGGLE_FAVORITE | "mark as favorite" | `{ op: 'replace', path: '/meta/favorite', value: true }` |

**Acceptance Criteria:**
- [ ] Parser extracts intent type from natural language
- [ ] Parser identifies target field
- [ ] Parser extracts new value (if applicable)
- [ ] Unsupported intents receive helpful error message

### REQ-05: Diff Preview

**Priority:** P0 (Must Have)

Before applying changes, the system SHALL show a diff preview.

**Acceptance Criteria:**
- [ ] Removed content shown with red `-` prefix, strikethrough
- [ ] Added content shown with green `+` prefix
- [ ] Diff appears in monospace font within message
- [ ] Preview is read-only (not editable)

### REQ-06: Apply/Retry Actions

**Priority:** P0 (Must Have)

Users SHALL explicitly confirm or retry changes.

**Acceptance Criteria:**
- [ ] [Apply] button applies the proposed patch
- [ ] [Retry] button requests a new suggestion
- [ ] Buttons appear only on messages with patches
- [ ] After Apply, confirmation message shows
- [ ] Object display updates immediately

### REQ-07: Suggested Actions

**Priority:** P1 (Should Have)

The Copilot SHALL suggest quick actions based on object type.

**Suggestions by Type:**
| Type | Suggested Actions |
|------|-------------------|
| Journey | "Change title", "Set duration", "Update description" |
| Lens | "Adjust tone", "Change vocabulary level" |
| Node | "Edit label", "Add connection" |
| Hub | "Add tag", "Set priority" |
| Sprout | "Change stage", "Reclassify type" |

**Acceptance Criteria:**
- [ ] Suggestions appear as clickable chips
- [ ] Clicking chip populates input with template
- [ ] Suggestions update when object type changes

### REQ-08: Model Indicator

**Priority:** P1 (Should Have)

The panel SHALL display which model powers responses.

**Acceptance Criteria:**
- [ ] Shows model name: "Local 7B (Simulated)"
- [ ] Green dot indicates ready state
- [ ] Amber dot during "processing"
- [ ] Located in panel footer

### REQ-09: Schema Validation

**Priority:** P1 (Should Have)

Patches SHALL be validated against object schema before preview.

**Acceptance Criteria:**
- [ ] Invalid field paths rejected with error message
- [ ] Type mismatches caught (string vs number)
- [ ] Required fields cannot be removed
- [ ] Validation errors explain what's wrong

### REQ-10: Welcome Message

**Priority:** P2 (Nice to Have)

New sessions SHALL show a contextual welcome message.

**Acceptance Criteria:**
- [ ] Welcome includes object type acknowledgment
- [ ] Welcome shows 2-3 example prompts
- [ ] Examples are clickable (populate input)

---

## Out of Scope

| Feature | Reason | Future Sprint |
|---------|--------|---------------|
| Real local model integration | Requires Ollama/llama.cpp setup | copilot-local-v1 |
| Cross-object operations | Complexity; needs entity resolution | copilot-cross-v1 |
| Persistence to storage | Objects currently ephemeral | storage-layer-v1 |
| Undo/redo stack | Nice-to-have; not MVP critical | copilot-undo-v1 |
| Voice input | Accessibility feature | copilot-voice-v1 |

---

## Non-Functional Requirements

### NFR-01: Response Time

Simulated responses SHALL appear within 500-1500ms (randomized for realism).

### NFR-02: Accessibility

- All interactive elements keyboard accessible
- ARIA labels on buttons and inputs
- Focus management when panel opens/closes

### NFR-03: Mobile Responsiveness

Panel collapses to icon-only on viewports < 768px wide.

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Panel renders without error | 100% | E2E test |
| User can complete edit flow | 100% | E2E test |
| Diff preview matches applied change | 100% | Unit test |
| Simulated response feels natural | Subjective | User feedback |

---

## Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| fast-json-patch | JSON patch operations | ^3.1.1 |
| (existing) React | UI framework | 18.x |
| (existing) Tailwind | Styling | 3.x |

---

## Open Questions

1. **Session persistence:** Should message history persist across page navigations?
   - **Recommendation:** No for MVP; session-only

2. **Multi-object editing:** Can user inspect one object while Copilot edits another?
   - **Recommendation:** No; Copilot always operates on currently inspected object

3. **Conflict handling:** What if user manually edits while Copilot has pending patch?
   - **Recommendation:** Discard pending patch; show warning
