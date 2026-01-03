# Architectural Decisions: Prompt Editor Standardization

**Sprint:** prompt-editor-standardization-v1  
**Date:** 2025-01-03

---

## ADR-001: Section-Based vs Tab-Based Editor Layout

### Status
ACCEPTED

### Context
The current PromptEditor uses a tab-based layout (Content/Targeting/Sequences/Stats) while the reference LensEditor uses a section-based layout with collapsible sections. We need to decide which pattern to standardize on.

### Decision
Adopt the section-based layout pattern from LensEditor.

### Rationale
1. **Discoverability** - All content visible/scannable without navigation clicks
2. **Context preservation** - User sees related fields together without switching views
3. **Complexity management** - Collapsible sections hide advanced features without hiding their existence
4. **Consistency** - Matches the reference LensEditor pattern
5. **Schema diversity** - Prompts have more fields than Lenses, which argues FOR sections (can collapse advanced areas) rather than tabs (which fragment the mental model)

### Consequences
- User must scroll to see all content (mitigated by collapsible sections)
- Slight increase in initial render complexity
- All existing tab content will be preserved, just reorganized

### Rejected Alternatives
- **Keep tabs**: Would perpetuate pattern divergence
- **Hybrid (tabs + sections)**: Adds complexity without clear benefit

---

## ADR-002: Collapsible Section Implementation Location

### Status
ACCEPTED

### Context
The `collapsible` and `defaultCollapsed` props used in LensEditor are passed to InspectorSection but not implemented. We need to decide where to add this functionality.

### Decision
Enhance the shared `InspectorSection` component in `shared/layout/InspectorPanel.tsx`.

### Rationale
1. **Single source of truth** - One implementation serves all consumers
2. **Bug fix** - LensEditor's collapsible props will start working
3. **Low risk** - Backward compatible (non-collapsible is default)
4. **Declarative** - Consumers opt-in with boolean props

### Consequences
- Modifies shared component (requires careful testing)
- LensEditor gets working collapsible sections "for free"
- Any other InspectorSection consumers gain the capability

### Rejected Alternatives
- **New CollapsibleSection component**: Would require updating LensEditor and add duplication
- **Bedrock-specific implementation**: Would create parallel component hierarchies

---

## ADR-003: State Management Pattern

### Status
ACCEPTED

### Context
PromptEditor maintains local state buffer (`localPrompt`) and duplicate dirty tracking (`isDirty`) while the factory provides `hasChanges` via props.

### Decision
Remove local state buffer and use factory's `hasChanges` prop exclusively, with `patchPayload()`/`patchMeta()` helper pattern.

### Rationale
1. **Consistency** - Matches LensEditor pattern exactly
2. **Simplicity** - Single source of truth for dirty state
3. **Reliability** - Factory tracks changes, not component
4. **Reduced bugs** - No sync issues between local and factory state

### Consequences
- Immediate persistence on field change (via patch operations)
- No "cancel" functionality (by design - matches LensEditor)
- Cleaner component code

### Rejected Alternatives
- **Keep local buffer**: Would perpetuate state sync complexity
- **Add cancel button**: Not in reference pattern, adds complexity

---

## ADR-004: Isolation from Genesis/Terminal

### Status
ACCEPTED

### Context
The Grove has multiple consumption paths for prompt data. We need to ensure the Bedrock admin UI refactor doesn't affect the user-facing Terminal experience.

### Decision
Maintain strict isolation - PromptEditor changes are UI-only, touching no shared data hooks or consumption utilities.

### Rationale
1. **Safety** - No risk to production user experience
2. **Testability** - Can verify Bedrock changes in isolation
3. **Incremental** - Follows strangler fig pattern (only Bedrock evolves)

### Consequences
- Must verify isolation before and after changes
- Genesis/Terminal code explicitly marked as out-of-scope
- Shared schema (`core/schema/prompt.ts`) remains stable

### Verified Isolation:
| Component | Path | Status |
|-----------|------|--------|
| Genesis | `surface/pages/GenesisPage.tsx` → Terminal | NOT TOUCHED |
| Terminal Prompts | `explore/hooks/usePromptSuggestions.ts` | NOT TOUCHED |
| Prompt Scoring | `explore/utils/scorePrompt.ts` | NOT TOUCHED |
| Schema | `core/schema/prompt.ts` | NOT TOUCHED |
| Data Layer | `bedrock/consoles/PromptWorkshop/usePromptData.ts` | NOT TOUCHED |
