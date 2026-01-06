# Architectural Decision Records — highlight-extraction-v1

## ADR-001: Confidence Threshold as Mutable Config

### Status
Accepted

### Context
We need a threshold to filter low-quality concept detections. The threshold affects extraction quality vs. coverage tradeoff. Per DEX principles, domain-relevant parameters should be configurable without code changes.

### Options Considered
1. **Hardcode 0.7** — Simple but inflexible
2. **Environment variable** — Flexible but requires deployment changes
3. **Declarative config file** — DEX-compliant, runtime mutable

### Decision
Use declarative config in `EXTRACTION_CONFIG.highlight.confidenceThreshold`. Default to 0.7, document in code that this is tunable.

### Rationale
DEX principle: domain experts should modify behavior via config. A content reviewer discovering 0.7 misses good concepts can adjust without developer involvement.

### Consequences
**Positive:**
- Tunable without code changes
- Self-documenting (config file shows all knobs)
- Consistent with existing Grove patterns

**Negative:**
- Need to validate config at runtime
- Documentation burden (must explain what threshold means)

---

## ADR-002: Core Concepts Registry in JSON

### Status
Accepted

### Context
We need a canonical list of Grove-specific terms to distinguish "distributed ownership" from generic words like "system" or "data."

### Options Considered
1. **Hardcode in detection function** — Simple but violates DEX
2. **Database table** — Overkill for ~50 terms, requires migrations
3. **JSON file** — Declarative, versionable, editable by non-developers

### Decision
Create `src/data/concepts/groveCoreConcepts.json` with term, category, priority, and definition fields.

### Rationale
- JSON is declarative (DEX compliant)
- Version controlled with code
- Content team can edit without TypeScript knowledge
- Definitions serve dual purpose: extraction context AND prompt generation

### Consequences
**Positive:**
- Single source of truth for Grove vocabulary
- Reusable beyond extraction (glossary, onboarding, etc.)
- Easy to expand

**Negative:**
- No runtime validation without TypeScript types
- Must remember to update when new concepts emerge

---

## ADR-003: Favor Newer in Merge Strategy

### Status
Accepted

### Context
When the same concept is extracted from multiple documents, we need a strategy for handling duplicates. User specified: "favor newer materials over older, but keep multiple docs."

### Options Considered
1. **Keep all variants** — Maximum coverage, potential noise
2. **Favor higher confidence** — Quality-focused, may miss context
3. **Favor newer** — Assumes recent docs have better explanations
4. **Merge into single** — Complex, loses provenance

### Decision
Default to `favor-newer` strategy. When triggers overlap, replace older prompt with newer. Keep different concepts from same doc (no trigger overlap = no conflict).

### Rationale
- Grove is actively developing; newer docs likely have refined explanations
- Simpler than confidence comparison
- Provenance still tracked (sourceDocIds show which doc won)
- Aligns with user's stated preference

### Consequences
**Positive:**
- Keeps prompt library fresh
- Simple logic
- Clear winner selection

**Negative:**
- Older, potentially better explanations may be overwritten
- No "best of both" merging

---

## ADR-004: Emily Short Template for Generation

### Status
Accepted

### Context
Generated prompts need consistent quality matching hand-authored examples. Emily Short's pattern (context → confusion → question) proved effective in kinetic-highlights-v1.

### Options Considered
1. **No template** — Let LLM freestyle (variable quality)
2. **Strict template** — Fill-in-the-blank (robotic)
3. **Pattern guidance** — Show examples, let LLM adapt (balanced)

### Decision
Use pattern guidance template with:
- Good/bad examples
- Structural requirements (2-4 sentences, first-person, specific question)
- JSON output format

### Rationale
Short's research shows voice requires craft. Examples teach pattern without constraining creativity. JSON output ensures parseable results.

### Consequences
**Positive:**
- Consistent quality across extractions
- Aligns with Advisory Council (Short weight 8)
- Parseable output

**Negative:**
- Template maintenance burden
- May not capture all nuances of Short's approach

---

## ADR-005: extractionMethod Field in Provenance

### Status
Accepted

### Context
Need to distinguish highlight-extracted prompts from general extraction for filtering and analytics.

### Options Considered
1. **Separate provenance type** — `type: 'highlight-extracted'`
2. **Tag-based** — `tags: ['extracted', 'highlight']`
3. **New field** — `extractionMethod: 'highlight-concept-detection'`

### Decision
Add `extractionMethod` field to `PromptProvenance` interface. Values: `'general' | 'highlight-concept-detection'`.

### Rationale
- Orthogonal to `type` (both are 'extracted', just different methods)
- More extensible than type enum
- Enables precise filtering in Workshop

### Consequences
**Positive:**
- Clean separation of concerns
- Future extraction methods can add values
- No breaking changes to existing prompts

**Negative:**
- Another field to maintain
- Optional field (existing prompts won't have it)

---

## ADR-006: Surface Filter in Workshop UI

### Status
Accepted

### Context
Prompt Workshop needs to filter by surface type (highlight, suggestion, journey) for efficient review of extracted highlight prompts.

### Options Considered
1. **Tag-based filtering** — Reuse existing tag filter
2. **Dedicated dropdown** — Specific surface filter
3. **Combined filter** — Provenance + surface in one control

### Decision
Add dedicated surface filter dropdown alongside existing provenance filter.

### Rationale
- Surfaces are first-class concept (DEX object field, not tag)
- Parallel to provenance filter pattern
- Clear semantics (what surface vs. where it came from)

### Consequences
**Positive:**
- Precise filtering for review workflow
- Consistent with existing filter patterns
- Surfaces explicitly visible in UI

**Negative:**
- More UI complexity
- Must update when new surfaces added

---

## ADR-007: Formal Acceptance Test with Insight Doc

### Status
Accepted

### Context
User specified: "Should extracting from `Exploration_Architecture_Validates_Itself.md` be a formal acceptance test?" Answer: Yes.

### Options Considered
1. **Synthetic test data** — Controlled but artificial
2. **Random production doc** — Real but unpredictable
3. **Specific insight doc** — Real, meaningful, validates recursion

### Decision
Use `Exploration_Architecture_Validates_Itself.md` as formal acceptance test. Extraction should produce 5+ highlight prompts with valid triggers.

### Rationale
- The document discusses exploration architecture
- Extracting prompts that teach exploration architecture proves the recursive loop
- Concrete, repeatable acceptance criterion
- Meta-validation: system teaching itself

### Consequences
**Positive:**
- Meaningful test (not just synthetic)
- Validates the thesis directly
- Clear pass/fail criterion

**Negative:**
- Coupled to specific document
- May need adjustment if document changes

---

## ADR-008: Testing Strategy

### Status
Accepted

### Context
Every sprint needs a testing strategy that verifies behavior without coupling to implementation.

### Decision
Three-tier testing approach:

### Test Categories

| Category | Tests | Purpose |
|----------|-------|---------|
| Unit | 12+ | Concept detection, prompt generation, merge logic |
| Integration | 3+ | Full extraction pipeline with mock API |
| E2E | 2+ | Workshop UI with surface filters |

### Behavior Focus

**Testing concept detection:**
```typescript
// WRONG - implementation detail
expect(result[0].frequency).toBe(3);

// RIGHT - behavior
expect(result.length).toBeGreaterThan(0);
expect(result[0].confidence).toBeGreaterThanOrEqual(0.7);
```

**Testing Workshop UI:**
```typescript
// WRONG - implementation detail
expect(filter).toHaveClass('active');

// RIGHT - behavior
await expect(page.getByText('Highlights')).toBeVisible();
await page.click('text=Highlights');
await expect(page.getByTestId('prompt-card')).toHaveCount(6);
```

### Rationale
Behavior tests survive refactoring. Implementation tests break on every change.

### Consequences
**Positive:**
- Tests verify what users experience
- Refactoring doesn't break tests
- Clearer test intent

**Negative:**
- Some internal logic less directly tested
- Requires thinking about behavior, not just coverage

---

## ADR-009: No Auto-Approval (Human Review Gate)

### Status
Accepted

### Context
Should high-confidence extracted prompts auto-approve, or require human review?

### Options Considered
1. **Auto-approve above 0.9** — Faster to production
2. **All manual review** — Quality gate, slower
3. **Hybrid with training period** — Start manual, earn auto-approve

### Decision
All extracted prompts require human review (`reviewStatus: 'pending'`). No auto-approval in this sprint.

### Rationale
- Quality baseline not established yet
- Advisory Council (Asparouhova): governance needs mechanisms
- Can add auto-approval later with confidence calibration data
- Low risk: bulk approve is fast if quality is good

### Consequences
**Positive:**
- Quality gate on all extracted content
- Builds calibration data for future auto-approval
- Aligns with careful launch approach

**Negative:**
- Review bottleneck risk
- Slower time-to-production for prompts

---

## ADR-010: Trigger Suggestion for Existing Prompts (Deferred)

### Status
Deferred to future sprint

### Context
User asked: "Should we suggest triggers for existing prompts that lack them?"

### Decision
Defer to future enhancement. This sprint focuses on extraction pipeline; trigger suggestion for authored prompts is orthogonal scope.

### Rationale
- Scope creep risk
- Authored prompts work without triggers (just surface as suggestions)
- Can add later without breaking changes

### Consequences
**Positive:**
- Focused sprint scope
- Faster delivery

**Negative:**
- Some authored prompts won't surface as highlights until manually updated
