# DEVLOG.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Started**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)
> **Status**: 🟡 READY FOR EXECUTION

---

## Sprint Log

### 2026-01-06 - Foundation Loop Complete (v2: Unified Context)

**Problem Identified**

Extracted prompts drift from Grove worldview. QA consistently flags:
- Source Mismatch: Generic AI language instead of Grove terminology
- Ambiguous Intent: Vague exploration without operational clarity
- Missing Context: No foundational framing for newcomers
- Too Broad: Concepts float disconnected from Grove thesis

**Compounding Problem: Divergent Context Sources**

| Path | Current Context |
|------|-----------------|
| Pipeline (`polishExtractedConcepts`) | Hardcoded minimal: "platform for distributed AI" |
| Ad hoc (`enrichPromptTitles`, `enrichPromptTargeting`) | Dynamic lookup: `knowledge.getDocument('grove-overview')` |

This creates corpus drift - prompts from different paths may use inconsistent vocabulary.

**Solution: Reference Implementation**

Single `GROVE_WORLDVIEW_CONTEXT` constant used by ALL enrichment operations:
- ~60 lines, 8 vocabulary terms
- 6 framing principles, 6 anti-patterns
- No runtime dependencies (constant, not lookup)
- Version controlled (changes tracked in git)

**Foundation Loop Artifacts Created**

- ✅ REQUIREMENTS.md (updated: unified context)
- ✅ REPO_AUDIT.md (updated: 4 functions)
- ✅ SPEC.md (updated: all paths)
- ✅ ARCHITECTURE.md (updated: unified flow)
- ✅ MIGRATION_MAP.md (updated: 5 changes)
- ✅ DECISIONS.md (updated: 8 ADRs)
- ✅ SPRINTS.md (updated: 6 stories)
- ✅ EXECUTION_PROMPT.md (updated: all steps)
- ✅ DEVLOG.md

**Ready for Execution**: Handoff to Claude Code.

---

## Grove Vocabulary (8 Terms)

| Term | Definition |
|------|------------|
| Computational Sovereignty | AI on hardware you control |
| The Ratchet Thesis | Capability propagation frontier→edge |
| Efficiency-Enlightenment Loop | Agents motivated by cognition access |
| Knowledge Commons | Network learning with attribution |
| Hybrid Cognition | Local + cloud seamless bridging |
| Gardener/Observer Dynamic | Relationship of care, not extraction |
| Epistemic Independence | Knowledge production without dependency |
| Technical Frontier | Research informing Grove architecture |

---

## Execution Log

### Story 1: Grove Context Constant

**Status**: 🔴 Not Started

```
[ ] Write GROVE_WORLDVIEW_CONTEXT constant (~60 lines)
[ ] Include 8 vocabulary terms with definitions
[ ] Add 6 framing principles
[ ] Add 6 anti-patterns
[ ] Insert at ~line 3280 in server.js
```

---

### Story 2: Update polishExtractedConcepts (Pipeline)

**Status**: 🔴 Not Started

```
[ ] Replace opening section with constant reference
[ ] Add "THE GROVE WORLDVIEW" header
[ ] Add Task step 0: "Ground in Grove Context"
[ ] Verify template literal syntax
```

---

### Story 3: Update enrichPromptTitles (Ad Hoc)

**Status**: 🔴 Not Started

```
[ ] Remove groveContext parameter
[ ] Replace dynamic injection with constant
[ ] Add "THE GROVE WORLDVIEW" header
```

---

### Story 4: Update enrichPromptTargeting (Ad Hoc)

**Status**: 🔴 Not Started

```
[ ] Remove groveContext parameter
[ ] Replace dynamic injection with constant
[ ] Add "THE GROVE WORLDVIEW" header
```

---

### Story 5: Remove Dynamic Lookup

**Status**: 🔴 Not Started

```
[ ] Delete knowledge module lookup block
[ ] Update function calls (remove groveContext argument)
[ ] Verify no dangling references
```

---

### Story 6: Validation

**Status**: 🔴 Not Started

```
[ ] npm run build passes
[ ] Pipeline extraction uses Grove vocabulary
[ ] /make-compelling uses Grove vocabulary
[ ] /suggest-targeting uses Grove vocabulary
[ ] Run QA check on new extractions
[ ] Compare QA flag rates (target: 50% reduction)
```

---

## Issues & Blockers

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| None yet | - | - | - |

---

## Time Tracking

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Foundation Loop v1 | 25 min | 25 min | Initial spec |
| Foundation Loop v2 | 20 min | 20 min | Unified context expansion |
| Story 1 (constant) | 20 min | - | - |
| Story 2 (pipeline) | 15 min | - | - |
| Story 3 (ad hoc titles) | 10 min | - | - |
| Story 4 (ad hoc targeting) | 10 min | - | - |
| Story 5 (cleanup) | 10 min | - | - |
| Story 6 (validation) | 25 min | - | - |
| **Total** | **~2 hr** | - | - |

---

## Completion Checklist

- [ ] `GROVE_WORLDVIEW_CONTEXT` constant defined
- [ ] Constant includes 8 Grove vocabulary terms
- [ ] Constant includes 6 framing principles
- [ ] Constant includes 6 anti-patterns
- [ ] `polishExtractedConcepts` uses constant
- [ ] `enrichPromptTitles` uses constant (param removed)
- [ ] `enrichPromptTargeting` uses constant (param removed)
- [ ] Dynamic knowledge lookup removed
- [ ] `npm run build` passes
- [ ] Pipeline extraction uses Grove vocabulary
- [ ] Ad hoc title enrichment uses Grove vocabulary
- [ ] Ad hoc targeting enrichment uses Grove vocabulary
- [ ] QA flag rate decreases
- [ ] All 3 paths use identical context
- [ ] DEVLOG updated with results

---

## Post-Sprint Notes

_To be filled after sprint completion_

### Context Consistency Check

| Path | Uses Constant | Verified |
|------|---------------|----------|
| Pipeline (`polishExtractedConcepts`) | - | - |
| Ad hoc titles (`enrichPromptTitles`) | - | - |
| Ad hoc targeting (`enrichPromptTargeting`) | - | - |

### Example Prompts (Before/After)

**Before:**
```
Title: "Understanding Distributed Systems"
ExecutionPrompt: "Explore how distributed systems work and their applications in AI."
```

**After:**
```
Title: "How Does Computational Sovereignty Actually Work?"
ExecutionPrompt: "The Grove promises AI you actually own—but what does that mean 
technically? Explore how local nodes running on your hardware connect to frontier 
capability when needed, and why this hybrid architecture makes ownership possible."
```

### QA Flag Comparison

| Flag Type | Before | After | Change |
|-----------|--------|-------|--------|
| Source Mismatch | - | - | - |
| Missing Context | - | - | - |
| Ambiguous Intent | - | - | - |
| Too Broad | - | - | - |

---

## Files Changed

| File | Change |
|------|--------|
| `server.js` | Add `GROVE_WORLDVIEW_CONTEXT` constant |
| `server.js` | Update `polishExtractedConcepts` prompt |
| `server.js` | Update `enrichPromptTitles` (remove param, use constant) |
| `server.js` | Update `enrichPromptTargeting` (remove param, use constant) |
| `server.js` | Remove dynamic knowledge lookup in `/api/prompts/enrich` |
