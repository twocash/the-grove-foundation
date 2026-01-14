# SPEC: Test Health Mine Sweeper (test-mine-sweeper-v1)

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Ready for Execution |
| **Status** | READY |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-14T01:00:00Z |
| **Next Action** | Begin Phase 1: Survey the minefield |
| **Attention Anchor** | Ongoing guardian role, not time-bound sprint |

---

## Vision

Create a specialized **Mine Sweeper** agent role that surgically clears test debt while respecting strangler fig boundaries. This is an **ongoing guardian role** with a clear evolution path:

```
MINE SWEEPER                           PRUNER
-------------                          ------
Clear test debt                   ->   Extract 1.0 Reference Implementation
Visual verification               ->   Full codebase extrication
Prove strangler fig mastery       ->   Complete the fig: kill the legacy vine
```

**Merit-based promotion:** Mine Sweeper earns Pruner status by demonstrating mastery of the strangler fig architecture through successful, zero-regression test cleanup.

---

## Role Evolution Path

### Level 1: Mine Sweeper (Entry)

**Mission:** Clear the 49 @fixme test minefield

**Skills Required:**
- Playwright expertise for visual verification
- Strangler fig boundary awareness
- Surgical precision (fix without blast radius)

**Success Metrics:**
- Test pass rate: 55% -> 90%+
- Zero regressions in FROZEN zones
- All fixes have REVIEW.html evidence

**Promotion Criteria:**
- [ ] All ACTIVE zone tests passing
- [ ] FROZEN zone tests properly archived
- [ ] Demonstrated understanding of legacy/new boundaries
- [ ] No "explosions" (regressions in stable code)

### Level 2: Pruner (Earned)

**Mission:** Extricate bedrock/explore into pristine 1.0 Reference Implementation

**Skills Required:**
- Everything from Mine Sweeper PLUS:
- Deep architectural understanding
- Ability to identify and sever legacy coupling
- Vision for what "clean 1.0" looks like

**Responsibilities:**
- Extract `src/bedrock/` + `src/explore/` + `src/core/` as standalone
- Ensure zero dependencies on FROZEN zones
- Create migration path for any remaining shared state
- Final strangler fig completion: legacy can be deprecated

---

## The Minefield (Current State)

### Test Health Metrics

| Metric | Value |
|--------|-------|
| Total Tests | 195 |
| Passing | 107 (55%) |
| Skipped (@fixme) | 88 (45%) |
| New @fixme | 49 |

### Mine Categories

| Category | Mines | Priority | Approach |
|----------|-------|----------|----------|
| UI Not Rendering | 19 | HIGH | Fix components or remove dead tests |
| Timing Issues | 12 | MEDIUM | Increase timeouts or fix slow interactions |
| Architecture Changes | 10 | MEDIUM | Update assertions or regenerate baselines |
| ARIA/State Issues | 4 | LOW | Fix accessibility or update expectations |
| Flaky Tests | 4 | LOW | Stabilize or mark permanently skipped |

### High-Priority Mines (19 UI Tests)

| Test File | Mines | Looking For | Zone |
|-----------|-------|-------------|------|
| `explore-hybrid-toggle.spec.ts` | 3 | RAG toggle in header | ACTIVE |
| `moment-custom-lens-offer.spec.ts` | 9 | `moment-object` testid | ACTIVE |
| `pipeline-inspector.spec.ts` | 3 | Tier filter buttons | ACTIVE |
| `nursery.spec.ts` | 2 | Ready/Failed filters | ACTIVE |
| `kinetic-stream.spec.ts` | 2 | query-block, response-block | ACTIVE |

---

## Strangler Fig Boundaries

### FROZEN ZONES (Legacy - Do Not Touch)

```
src/components/Terminal/     <- Legacy monolith (1866 lines)
src/foundation/              <- Legacy Foundation consoles
pages/TerminalPage.tsx       <- Marketing entry point
Terminal/Stream/blocks/      <- Legacy stream rendering
```

**Mine Sweeper Rule:** Tests for FROZEN zones -> Move to `tests/e2e/deprecated/` with @legacy tag

### ACTIVE BUILD ZONES (1.0 Reference - Where We Work)

```
src/bedrock/                 <- New console architecture
src/explore/                 <- KineticStream experience
src/core/                    <- Shared infrastructure
src/surface/components/KineticStream/  <- Clean room rebuild
```

**Mine Sweeper Rule:** All tests MUST pass. Visual verification required.

### SHARED CORE (Both Can Use - Future 1.0 Core)

```
src/core/schema/             <- Type definitions
src/core/transformers/       <- Data transformers
src/core/engagement/         <- State machine
src/core/events/             <- Event sourcing
```

---

## Mine Sweeper Protocol

### Daily Sweep Pattern

```
1. SURVEY
   npx playwright test --project=e2e --reporter=list
   - Note any new failures (mines planted overnight)

2. TRIAGE
   - Categorize by zone (FROZEN vs ACTIVE)
   - Prioritize ACTIVE zone failures

3. DISARM (per mine)
   - Investigate root cause
   - Apply minimal fix
   - Capture before/after screenshots
   - Run blast radius check (related tests)
   - Update REVIEW.html

4. ARCHIVE (FROZEN zone tests)
   - Move to deprecated/
   - Add @legacy skip tag
   - Document in archive manifest

5. REPORT
   - Update test health metrics
   - Log session in sprint-status-live.md
```

### Investigation Decision Tree

```
Feature exists in code?
|-- YES -> Rendering in /explore or /bedrock?
|   |-- YES -> Fix test selector (selector drift)
|   +-- NO -> Fix component mounting (integration bug)
+-- NO -> Was it removed intentionally?
    |-- YES -> Archive test with note
    +-- NO -> Create feature ticket, skip test
```

---

## Playwright Visual Verification

### Every Mine Sweep Must Include:

1. **Before Screenshot** - State before fix
2. **After Screenshot** - State after fix
3. **Video** (complex flows) - Playwright video recording
4. **REVIEW.html** - Before/after comparison + test results

### Baseline Regeneration Policy

Regenerate baselines **incrementally per-fix** with manual review:
1. Fix the underlying issue
2. Visually inspect current state in browser
3. If correct: `npx playwright test {file} --update-snapshots`
4. Commit baseline with evidence screenshot

---

## Success Criteria

### Mine Sweeper Graduation (Ready for Pruner)

- [ ] Pass rate >= 90% (up from 55%)
- [ ] All ACTIVE zone tests passing
- [ ] FROZEN zone tests archived in `deprecated/`
- [ ] Zero regressions introduced
- [ ] REVIEW.html evidence for every fix
- [ ] Archive manifest complete

### Pruner Mission (Post-Graduation)

- [ ] `src/bedrock/` has zero imports from FROZEN zones
- [ ] `src/explore/` has zero imports from FROZEN zones
- [ ] `src/core/` is dependency-free (pure TypeScript)
- [ ] 1.0 Reference Implementation can be extracted as standalone package
- [ ] Legacy MVP continues running (strangler fig complete)

---

## Reference Documents

| File | Purpose |
|------|---------|
| `.agent/roles/mine-sweeper.md` | Role definition with protocol |
| `docs/test-janitor-report.md` | Full test failure analysis |
| `~/.claude/notes/test-janitor-triage-pending.md` | Investigation queue |
| `tests/e2e/deprecated/README.md` | Archive manifest |
| `tests/janitor.config.json` | Test Janitor configuration |
