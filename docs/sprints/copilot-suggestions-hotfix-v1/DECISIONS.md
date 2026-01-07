# DECISIONS.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Created**: 2026-01-06

---

## ADR-001: Populate Input vs Auto-Execute

### Context
When user clicks a suggestion button, should it:
- A) Auto-execute the command immediately
- B) Populate the input field for user confirmation

### Decision
**Option B: Populate input field**

### Rationale
1. **User control** - User sees exactly what will happen before it does
2. **Editable** - User can modify the template before executing
3. **Consistent** - Same mental model as typing commands manually
4. **Safe** - No accidental changes to prompts
5. **Undo-friendly** - User hasn't committed yet

### Consequences
- Extra click required (Enter to confirm)
- Better user experience for cautious workflows
- Matches pattern established in other tools

---

## ADR-002: Use Existing SuggestedAction Type

### Context
Need a type for clickable suggestions. Options:
- A) Create new type specific to Copilot
- B) Use existing `SuggestedAction` from `@core/copilot/schema`

### Decision
**Option B: Use existing type**

### Rationale
1. **Already defined** with label, template, icon fields
2. **No new types** to maintain
3. **Consistent** across codebase
4. **Proven pattern** from inspector suggestions

### Consequences
- Import from `@core/copilot/schema`
- Type already matches our needs exactly

---

## ADR-003: Inline Styling vs Component

### Context
How to render suggestion buttons:
- A) Create `<SuggestionChips>` component
- B) Inline JSX in BedrockCopilot

### Decision
**Option B: Inline JSX**

### Rationale
1. **Hotfix scope** - Minimal change footprint
2. **Single use** - Only needed in BedrockCopilot for now
3. **Simple** - ~15 lines of JSX
4. **Later extraction** - Can refactor to component if reused

### Consequences
- Slightly longer render function
- No new component file
- Easy to extract later if needed

---

## ADR-004: Truncate Long Labels

### Context
Title suggestions can be 50+ characters. Display options:
- A) Full text, wrap to multiple lines
- B) Truncate with ellipsis at ~40 chars
- C) Truncate to fit container width

### Decision
**Option B: Truncate at 40 chars**

### Rationale
1. **Predictable** - Fixed truncation point
2. **Readable** - First 40 chars usually convey meaning
3. **Compact** - Buttons stay on one line
4. **Full template** - Template still has complete text

### Consequences
- `label: v.title.length > 40 ? v.title.slice(0, 37) + '...' : v.title`
- User clicks, sees full title in input
- Hover could show full text (future enhancement)

---

## ADR-005: Keep Operations for suggest-targeting

### Context
The `suggest-targeting` handler currently returns `operations` array that applies changes. Should suggestions replace or supplement this?

### Decision
**Keep both operations AND suggestions**

### Rationale
1. **Operations apply immediately** when action runs (current behavior)
2. **Suggestions offer alternative** manual path
3. **No breaking change** to existing flow
4. **User choice** - See what was applied, can manually adjust

### Consequences
- Targeting auto-applies on action
- Suggestion button offers explicit command path
- Message explains what was applied
