# Foundation Loop Launch Brief: Kinetic Stream Reset v2

**Sprint:** kinetic-stream-reset-v2  
**Launch Date:** December 28, 2025  
**Sprint Owner:** Jim Calhoun  
**Execution Environment:** Claude Code CLI  

---

## Mission

Transform the Terminal chat experience from passive message display to an **active exploration surface** where responses contain interactive concepts ("Orange Highlights") and contextual navigation ("Journey Forks").

**The One-Liner:** Kill the chat log. Birth the kinetic stream.

---

## Primary Reference Document

**READ THIS FIRST:**

```
docs/sprints/kinetic-stream-reset-v2/COMPREHENSIVE_REQUIREMENTS.md
```

This 1,500-line specification contains:
- Strategic context and Trellis alignment (Parts I-II)
- Complete schema specification with TypeScript (Part III)
- Full rendering architecture (Part IV)
- Parser specifications (Part V)
- Interaction mechanics (Part VI)
- Visual system (Part VII)
- Integration paths (Part VIII)
- Test specifications (Part IX)
- Sprint breakdown (Part X)
- Risk assessment (Part XI)

**Do not summarize or condense. Execute against the full specification.**

---

## Foundation Loop Execution Order

Execute phases in this sequence, writing artifacts to this sprint directory:

| Phase | Output File | Key Action |
|-------|-------------|------------|
| 0 | (inline in SPEC.md) | Read PROJECT_PATTERNS.md, map requirements to existing patterns |
| 0.5 | (inline in SPEC.md) | Canonical Source Audit - what exists, what to extend |
| 1 | REPO_AUDIT.md | Audit current state of referenced files |
| 2 | SPEC.md | Technical specification with pattern alignment |
| 3 | ARCH_DECISIONS.md | Key architectural choices with rationale |
| 4 | TEST_STRATEGY.md | Test plan per requirements Part IX |
| 5 | MIGRATION_PLAN.md | Legacy deprecation and rollback strategy |
| 6 | SPRINTS.md | Epic/story breakdown per requirements Part X |
| 7 | EXECUTION_PROMPT.md | Self-contained handoff for implementation |

---

## Critical Files to Audit (Phase 1)

The requirements document claims these assets exist. Verify state before planning:

### Must Verify Exist and Assess State

```
src/core/schema/stream.ts              # StreamItem types - claimed "basic"
src/core/engagement/machine.ts         # XState machine - claimed "working"
src/core/transformers/RhetoricalSkeleton.ts  # Parser - claimed "exists"
components/Terminal/Stream/StreamRenderer.tsx  # Renderer - claimed "partial"
components/Terminal/Stream/SpanRenderer.tsx    # Span injection - claimed "exists"
components/Terminal/Stream/blocks/ResponseBlock.tsx  # Response display
components/Terminal/Stream/blocks/QueryBlock.tsx     # Query display
components/Terminal/Stream/blocks/NavigationBlock.tsx # Forks - claimed "stubbed"
components/Terminal/Stream/motion/GlassPanel.tsx     # Glass effects - claimed "CSS missing"
```

### Must Verify for Deprecation Path

```
components/Terminal/TerminalChat.tsx   # Legacy rendering to migrate from
components/Terminal/SuggestionChip.tsx # To be replaced by NavigationBlock
```

### Pattern Files to Read

```
PROJECT_PATTERNS.md                    # The canonical pattern reference
src/data/quantum-content.ts            # Quantum Interface pattern example
src/surface/hooks/useQuantumInterface.ts  # How we do content reactivity
```

---

## Pre-Surfaced Pattern Alignment

Based on PROJECT_PATTERNS.md review, these patterns are relevant:

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Lens-reactive content | Quantum Interface | StreamItem types honor lens context |
| State transitions | Engagement Machine | Add new events per Part III schema |
| Structured content | Narrative Schema | StreamItem follows schema conventions |
| Behavior tests | Testing patterns | Use toBeVisible(), not implementation details |

**Likely New Pattern Needed:** The RhetoricalMap/SpanRenderer system may require a new pattern for "semantic content hydration" - document in SPEC.md if so.

---

## Advisory Council Perspective

Weighted concerns from the virtual advisory council:

### Park (Weight 10) - Agent Architecture
> Real-time rhetorical parsing during streaming is ambitious. The "stable hydration" approach (only highlighting completed sentences) is correct, but test with actual 7B model outputs before committing. Parse confidence thresholds matter.

### Benet (Weight 10) - Distributed Systems
> StreamItem schema changes have downstream P2P synchronization implications. Include schema versioning from the start. The `id` generation strategy matters for eventual conflict resolution.

### Adams (Weight 8) - Game Design
> "Orange highlights" are drama hooks. Over-highlighting kills the effect. The requirements suggest pattern-based extraction - ensure scarcity. A response with 15 highlighted concepts is noise; one with 2-3 creates focus.

### Short (Weight 8) - Narrative Design
> Journey Fork labels are LLM-generated per the spec. This is the most fragile point for voice consistency. The navigation parser needs robust fallbacks, and fork generation prompts need careful crafting to maintain Grove's voice.

### Taylor (Weight 7) - Community Mechanics
> The "pivot" mechanic creates emergent navigation paths. Consider logging what users actually click to understand real exploration patterns. This is behavioral archaeology.

### Buterin (Weight 6) - Mechanism Design
> The pivot context injection (Part VI.1) creates implicit "attention credits" - each click is a signal of interest. This data could inform future recommendation mechanics.

---

## Known Risks (Pre-Surfaced)

From requirements Part XI, prioritized:

| Risk | Severity | Mitigation in Spec |
|------|----------|-------------------|
| Breaking existing chat during migration | HIGH | Feature flag + parallel rendering (Part VIII.1) |
| Performance from real-time parsing | HIGH | Sentence-boundary hydration (Part V.1) |
| XState complexity explosion | HIGH | Incremental event additions (Part VIII.2) |
| LLM not outputting `<navigation>` reliably | MEDIUM | Fallback to generated suggestions (Part V.2) |
| Glass effects slow on low-end devices | MEDIUM | CSS-only blur, reduced motion (Part VII) |

---

## Sprint Sequencing (From Requirements)

The requirements propose 3 sprints over 3 weeks:

| Sprint | Focus | Key Deliverable |
|--------|-------|-----------------|
| 1 | The Stream Contract | Schema + Machine + Parsers (no UI) |
| 2 | The Polymorphic Renderer | StreamRenderer + Block components |
| 3 | The Glass Experience | Visual polish + Legacy cleanup |

**Recommendation:** Sprint 1 is the foundation. If schema or machine integration reveals issues, Sprints 2-3 adjust. Do not proceed to Sprint 2 until Sprint 1 build gates pass.

---

## Build Gate Commands

Per Foundation Loop methodology, verify after each epic:

```bash
# Full build
npm run build

# Unit tests
npm test

# E2E tests
npx playwright test

# Health checks (if configured)
npm run health

# Visual regression (after Sprint 3)
npx playwright test tests/e2e/*-baseline.spec.ts
```

---

## Execution Instructions for Claude Code

1. **Start by reading the full COMPREHENSIVE_REQUIREMENTS.md** - all 1,493 lines. This is the specification, not a summary.

2. **Execute Phase 0** - Read PROJECT_PATTERNS.md, complete pattern mapping table for SPEC.md.

3. **Execute Phase 0.5** - Audit the files listed above. Document actual state vs. claimed state.

4. **Proceed through Phases 1-7** - Write each artifact to this sprint directory.

5. **The EXECUTION_PROMPT.md is the final deliverable** - It should be self-contained, referencing this directory's artifacts, and ready for implementation handoff.

---

## Success Criteria

The Foundation Loop is complete when:

- [ ] All 9 artifacts exist in this directory
- [ ] SPEC.md includes Pattern Check and Canonical Source Audit
- [ ] REPO_AUDIT.md accurately reflects current codebase state
- [ ] EXECUTION_PROMPT.md is self-contained and actionable
- [ ] Sprint 1 could begin immediately from EXECUTION_PROMPT.md

---

*Launch brief prepared by Claude Desktop. Foundation Loop execution in Claude Code.*
