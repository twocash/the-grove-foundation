# Sprint Index: Copilot Configurator v1

**Sprint ID:** copilot-configurator-v1  
**Created:** 2024-12-26  
**Status:** Planning Complete  
**Estimated Effort:** 6-8 hours

---

## Vision

The **Copilot Configurator** is a natural language interface for editing Grove objects directly in the Object Inspector. Users speak intent ("make the description more mysterious"), and a local 7B model translates that intent into structured configuration patches—with diff preview and explicit confirmation.

This is the **proof of concept** for Grove's entire architecture: the most common AI assistance doesn't require cloud APIs. It requires the right *structure* around modest capability.

---

## Strategic Alignment

### DEX Pillars

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Edit any object field via natural language—no code knowledge required |
| **Capability Agnosticism** | Works with local 7B, 14B, or frontier API—same interface |
| **Provenance** | All edits logged with source (human via copilot), timestamp, model used |
| **Organic Scalability** | New object types get Copilot support automatically via schema |

### Ratchet Thesis Proof Point

- **Today's 7B** reliably parses "set estimated time to 15 minutes" → `{ estimatedMinutes: 15 }`
- **The architecture stays constant**—only the model swaps as capability propagates
- **Zero cloud dependency** for configuration editing

---

## Scope

### In Scope (MVP)

1. **Copilot Panel** embedded in Object Inspector
2. **Schema-Aware Parsing** for all GroveObjectMeta fields
3. **Diff Preview** showing additions/removals before apply
4. **Suggested Actions** based on object type
5. **Model Indicator** showing which model powers the response
6. **Local 7B Simulation** (simulated responses for demo)

### Out of Scope (Future)

- Actual local model integration (Ollama/llama.cpp)
- Cross-object intelligence ("connect to related journeys")
- Agent self-modification
- Batch operations

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Object editing | Pattern 7: Object Model | Add mutation methods to useGroveObjects |
| Panel rendering | Pattern 4: Styling Tokens | Add `--copilot-*` token namespace |
| State management | Pattern 2: Engagement Machine | Add copilot states to inspector machine |
| Schema awareness | Pattern 3: Narrative Schema | Use existing GroveObjectMeta for validation |

### New Pattern Proposed

**Pattern 11: Schema-Constrained AI Operations**

Local AI operations bounded by TypeScript schema validation. The pattern:
1. Natural language → intent parsing (local model)
2. Intent → JSON patch generation (local model)  
3. JSON patch → schema validation (deterministic)
4. Invalid patches rejected; valid patches previewed

This pattern enables "modest capability + rigid structure = reliable system."

---

## Success Criteria

- [ ] Copilot panel renders in Object Inspector
- [ ] User can type natural language edit requests
- [ ] System shows diff preview of proposed changes
- [ ] User explicitly confirms before changes apply
- [ ] Model indicator shows "Local 7B (Simulated)"
- [ ] Works for Journey, Lens, Node, Hub objects
- [ ] Suggested actions appear based on object type

---

## File Structure

```
src/
├── core/
│   └── copilot/
│       ├── schema.ts           # Types for copilot system
│       ├── parser.ts           # Intent parsing from natural language
│       ├── patch-generator.ts  # JSON patch generation
│       ├── validator.ts        # Schema validation
│       └── simulator.ts        # Simulated local model responses
│
└── surface/
    └── components/
        └── ObjectInspector/
            ├── CopilotPanel.tsx       # Main copilot UI
            ├── CopilotMessage.tsx     # Message bubble component
            ├── DiffPreview.tsx        # Diff visualization
            ├── SuggestedActions.tsx   # Quick action chips
            └── hooks/
                └── useCopilot.ts      # Copilot state and actions
```

---

## Artifacts

| Artifact | Purpose | Status |
|----------|---------|--------|
| INDEX.md | Sprint overview | ✅ |
| REPO_AUDIT.md | Current state analysis | Pending |
| SPEC.md | Requirements | Pending |
| ARCHITECTURE.md | Technical design | Pending |
| DECISIONS.md | ADRs | Pending |
| MIGRATION_MAP.md | File changes | Pending |
| SPRINTS.md | Epic breakdown | Pending |
| EXECUTION_PROMPT.md | CLI handoff | Pending |
| DEVLOG.md | Execution tracking | Pending |

---

## Related Documents

- `/home/claude/copilot-configurator-vision.md` — Strategic vision
- `/mnt/user-data/uploads/stitch_chatbot_copilot_widget.zip` — UI mockup
- `Grove_Object_Model_Spec_v1_1.docx` — Object model reference
