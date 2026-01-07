# DECISIONS.md - extraction-grove-context-v1

> **Sprint**: extraction-grove-context-v1
> **Created**: 2026-01-06
> **Updated**: 2026-01-06 (unified context)

---

## ADR-001: Unified Context vs. Per-Path Context

### Context
Current state has two context sources:
- Pipeline: hardcoded minimal description
- Ad hoc: dynamic lookup from knowledge module

### Decision
**Unified context via single constant**

### Rationale
1. **Consistency** - All enrichment paths use identical vocabulary
2. **Reliability** - No runtime dependency on knowledge module
3. **Debuggability** - Context visible in code, version controlled
4. **Simplicity** - One source of truth, no conditional logic

### Consequences
- Single `GROVE_WORLDVIEW_CONTEXT` constant
- Dynamic lookup removed (breaking change for knowledge module dependency)
- All paths produce consistent corpus

---

## ADR-002: Constant vs. Configuration File

### Context
Where should Grove context live?
- A) Hardcoded constant in server.js
- B) External JSON/YAML configuration file
- C) Database entry loaded at startup

### Decision
**Option A: Hardcoded constant**

### Rationale
1. **No runtime I/O** - Always available, no file read errors
2. **Version controlled** - Changes tracked in git, reviewed in PRs
3. **Deploy atomic** - Context ships with code, no sync issues
4. **Discoverable** - `grep` finds it immediately

### Consequences
- Vocabulary updates require code deployment
- No runtime editing (feature, not bug - prevents drift)
- ~60 lines added to server.js

---

## ADR-003: Context Injection vs. Fine-Tuning

### Context
How to ensure prompts reflect Grove worldview?
- A) Inject context into prompts
- B) Fine-tune model on Grove corpus
- C) Post-processing to insert Grove terms

### Decision
**Option A: Context injection**

### Rationale
1. **Immediate** - No training required, deploys with code change
2. **Controllable** - Can adjust vocabulary as Grove evolves
3. **Transparent** - Context visible in prompt, debuggable
4. **Sufficient** - LLMs are excellent at applying provided context

### Consequences
- Prompt grows by ~500 words (still well within limits)
- Context must be maintained as Grove vocabulary evolves
- No model training overhead

---

## ADR-004: Vocabulary Scope

### Context
How much Grove context to include?
- A) Minimal: Just core thesis (~100 words)
- B) Comprehensive: All major concepts (~500 words)
- C) Exhaustive: Full worldview documentation (~2000 words)

### Decision
**Option B: Comprehensive (~500 words)**

### Rationale
1. **Sufficient coverage** - 8 key concepts covers most extraction scenarios
2. **Token efficient** - Leaves room for document content
3. **Actionable** - Each concept has clear usage guidance
4. **Maintainable** - Can update without major restructuring

### Consequences
- 8 concepts: Computational Sovereignty, Ratchet, Efficiency-Enlightenment Loop, Knowledge Commons, Hybrid Cognition, Gardener/Observer, Epistemic Independence, Technical Frontier
- Periodic review needed as vocabulary evolves

---

## ADR-005: Technical Frontier Concept

### Context
How to handle prompts extracted from academic research papers?
- A) Treat like any other content (generic exploration)
- B) Add specific guidance for connecting research to Grove
- C) Separate extraction pipeline for research documents

### Decision
**Option B: Add specific guidance**

### Rationale
1. **Research is source material** - Many Grove documents are academic papers
2. **Bridge needed** - Research findings should connect to "What does this mean for Grove?"
3. **Same pipeline** - No need for separate infrastructure
4. **Corpus coherence** - Research prompts stay grounded in Grove thesis

### Consequences
- "Technical Frontier" added as 8th vocabulary concept
- Framing principle added: "Bridge research to practice"
- Task instruction: "If source is academic research, frame as architecture implication"

---

## ADR-006: Remove Dynamic Knowledge Lookup

### Context
Ad hoc enrichment currently fetches `grove-overview` from knowledge module.
- Pro: Could be updated without code deploy
- Con: Different source than pipeline, may fail silently, truncated

### Decision
**Remove dynamic lookup, use constant**

### Rationale
1. **Consistency** - Pipeline and ad hoc must match
2. **Reliability** - Constant never fails
3. **Simplicity** - One source of truth
4. **No silent failures** - Dynamic lookup fails silently if knowledge module unavailable

### Consequences
- Knowledge module no longer needed for enrichment
- Context updates require code deploy (acceptable tradeoff)
- No more "Grove context not found" edge cases

---

## ADR-007: Shift-Left Quality

### Context
When should quality issues be caught?
- A) At QA check time (current approach)
- B) At extraction polish time (proposed)
- C) Both (belt and suspenders)

### Decision
**Option B: Shift left to polish time**

### Rationale
1. **Prevention > Detection** - Better prompts from the start
2. **User experience** - Fewer QA flags to address
3. **Efficiency** - No manual refinement step required
4. **Coherence** - Grove grounding happens at generation, not retrofit

### Consequences
- QA becomes safety net, not primary quality mechanism
- "QA this" feature becomes optional validation, not required step
- Expected 50-70% reduction in QA flags

---

## ADR-008: Newcomer-First Framing

### Context
What level of Grove knowledge should prompts assume?
- A) Assume prior Grove knowledge
- B) Assume no prior knowledge (self-contained context)
- C) Mix based on complexity

### Decision
**Option B: Assume no prior knowledge**

### Rationale
1. **Accessibility** - Every prompt is an entry point
2. **Coherence** - Repeated context reinforces worldview
3. **Discovery** - Users learn Grove vocabulary through exploration
4. **No prerequisites** - Can explore any prompt without linear progression

### Consequences
- Each prompt includes brief foundational framing
- Grove vocabulary defined in context of each prompt
- Follow-ups suggest deepening paths for those who want more
