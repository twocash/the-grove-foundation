# User Story Refinery Skill

A Claude Code skill for transforming requirements specifications into testable user stories with acceptance criteria.

## Purpose

This skill implements a systematic methodology for:
- Extracting user stories from product specifications
- Assessing stories against INVEST criteria
- Writing Gherkin acceptance criteria for Playwright tests
- Flagging clunky flows and proposing simplifications
- Verifying DEX architecture alignment

## Usage

Invoke via phrases like:
- `/user-story-refinery` (direct invocation)
- "Extract user stories from [spec]"
- "Refine requirements for [feature]"
- "Create acceptance criteria for [feature]"

## Four-Phase Pipeline

```
Requirements Spec
       |
       v
+------------------+
| Phase 1: Story   |  <-- This skill
| Extraction       |
+------------------+
       |
       v
+------------------+
| Phase 2: Accept  |  <-- This skill
| Criteria         |
+------------------+
       |
       v
+------------------+
| Phase 3: Test    |  <-- Future skill
| Case Generation  |
+------------------+
       |
       v
+------------------+
| Phase 4: Playwright |  <-- Future skill
| Scaffolding         |
+------------------+
```

## Output

Creates a Notion page with:
- Critical observations (spec issues)
- Proposed v1.0 simplifications
- User stories organized by epic
- INVEST assessment per story
- Gherkin acceptance criteria
- Deferred items with rationale
- Open questions for stakeholders
- DEX alignment verification

## Story ID Convention

`US-{Sprint Letter}{Three-digit number}`

Examples:
- `US-A001` — Sprint A, story 1
- `US-B007` — Sprint B, story 7
- `US-C003` — Sprint C, story 3

## Related Skills

- `grove-foundation-loop` — Sprint planning methodology
- `grove-execution-protocol` — Sprint execution
- `dex-master` — Code review and architecture compliance

## Version History

- **v1.0** — Initial release covering Phases 1-2
