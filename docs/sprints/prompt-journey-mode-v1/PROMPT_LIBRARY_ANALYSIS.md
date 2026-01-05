# Prompt Library Analysis

## Current Inventory

| File | Prompts | Lens | Journey Coverage | Notes |
|------|---------|------|------------------|-------|
| `wayne-turner.prompts.json` | 20 | Wayne Turner | ✅ Complete | Model implementation |
| `dr-chiang.prompts.json` | 24 | Dr. Chiang | ✅ Complete | Technical focus |
| `base.prompts.json` | 15 | Generic (excludes WT/DC) | ⚠️ Weak | Needs expansion |

**Total:** 59 prompts

---

## Wayne Turner (Model Pattern)

The Wayne Turner lens demonstrates the correct journey architecture:

### Stage Distribution
| Stage | minInteractions | Count | Pattern |
|-------|-----------------|-------|---------|
| Genesis | 0 | 3 | Hooks: "What's at stake?", "Marketplace of ideas", "Ownership question" |
| Exploration | 2 | 6 | Stakes deepening, evidence requests, timing analysis |
| Synthesis | 3 | 8 | Opportunities, economics, evidence, limitations |
| Advocacy | 5+ | 3 | Action: Junto framing, Chiang prep, closing question |

### Weight Distribution
- Genesis hooks: 90-95 (surface first)
- Exploration: 85-92
- Synthesis: 85-95
- Advocacy closers: 92-98 (high confidence for closing)

### Key Design Patterns
1. **Progressive revelation**: Early prompts frame stakes, later prompts offer action paths
2. **Honest limitations prompt**: Trust-building through acknowledged uncertainty (weight: 95)
3. **Natural exit**: Final prompt is a question to sit with, not a call to action
4. **Persona-specific hooks**: Junto, Purdue, Indianapolis all addressed

---

## Dr. Chiang (Technical Variation)

Same architecture, different content focus:

### Stage Distribution
| Stage | minInteractions | Count | Pattern |
|-------|-----------------|-------|---------|
| Genesis | 0-1 | 3 | Thesis, universities, competition |
| Exploration | 2 | 7 | Stakes: Purdue, geopolitics, timing, moat |
| Synthesis | 3-4 | 8 | Mechanics: topology, consistency, hybrid, economics |
| Advocacy | 5+ | 6 | Resolution: ask, leadership, funding, risks, next steps |

### Key Design Patterns
1. **Technical depth**: Network topology, CAP theorem, consistency models
2. **Executive framing**: "30-second version", "what's the ask"
3. **Risk acknowledgment**: Downside scenarios, honest limitations
4. **Coalition building**: Natural allies, funding sources

---

## Base Prompts (Needs Work)

Current state is functional but thin:

### Issues
1. **No minInteractions progression**: Most prompts can surface at any time
2. **No advocacy stage prompts with action focus**
3. **Generic language**: Not tailored to any persona
4. **Weak synthesis coverage**: Only 4 prompts for synthesis stage

### Current Distribution
| Stage | Count | Quality |
|-------|-------|---------|
| Genesis | 4 | ⚠️ OK but generic |
| Exploration | 5 | ⚠️ Shallow |
| Synthesis | 4 | ⚠️ Weak |
| Advocacy | 2 | 🔴 Insufficient |

---

## Recommendations for Expansion

### Priority 1: Expand base.prompts.json (Generic Journey)

Add 10-15 prompts following Wayne Turner pattern:

**Genesis (minInteractions: 0)**
- "What problem does this solve?" - Stakes framing
- "Who is this for?" - Audience question

**Exploration (minInteractions: 2)**
- "How does the technical architecture work?" - System overview
- "What makes this different from other AI projects?" - Differentiation
- "What evidence supports this approach?" - Evidence request

**Synthesis (minInteractions: 3-4)**
- "What are the honest limitations?" - Trust builder
- "What would success look like in 5 years?" - Vision synthesis
- "How does the economics actually work?" - Business model

**Advocacy (minInteractions: 5+)**
- "What could I do with this information?" - Personal application
- "How would I explain this to someone else?" - Synthesis test
- "What's the one thing I should remember?" - Closing reflection

### Priority 2: Create Lens-Specific Libraries

**academic.prompts.json** (15-20 prompts)
- Research methodology focus
- Citation and evidence emphasis
- Peer review framing
- Grant opportunity questions

**engineer.prompts.json** (15-20 prompts)
- Technical architecture deep-dives
- Implementation questions
- Performance and scaling concerns
- Integration patterns

**concerned-citizen.prompts.json** (15-20 prompts)
- Personal impact focus
- Community implications
- Accessibility questions
- Democratic participation framing

**family-office.prompts.json** (15-20 prompts)
- Investment thesis focus
- Risk/return analysis
- Market positioning
- Exit scenarios

### Priority 3: Add Moment-Triggered Prompts

Currently only `stabilize-high-entropy` uses moment triggers:

**Suggested additions:**
- `first-insight-captured`: Celebration + next direction
- `topic-cluster-identified`: Synthesis opportunity
- `long-session`: Rest/reflection prompt
- `return-visitor`: Resume + progress check

---

## Prompt Object Schema Reference

```typescript
interface PromptObject {
  id: string;
  objectType: 'prompt';
  created: number;
  modified: number;
  author: 'system' | 'generated' | string;
  
  // Display
  label: string;                    // Short text shown in UI
  description?: string;             // Tooltip/hover text
  executionPrompt: string;          // Full prompt sent to LLM
  systemContext?: string;           // Additional context for LLM
  
  // Styling
  icon?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  
  // Targeting (4D Context Fields)
  tags?: string[];
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: {
    stages?: Stage[];               // genesis, exploration, synthesis, advocacy
    lensIds?: string[];             // Only show for these lenses
    excludeLenses?: string[];       // Never show for these lenses
    minInteractions?: number;       // Minimum exchanges before surfacing
    maxInteractions?: number;       // Maximum exchanges (after which, don't show)
    minConfidence?: number;
    entropyWindow?: { min?: number; max?: number };
    momentTriggers?: string[];
  };
  
  // Scoring
  baseWeight: number;               // 0-100, higher = more likely to surface
  
  // Analytics
  stats: PromptStats;
  status: 'active' | 'deprecated' | 'testing';
  source: 'library' | 'generated' | 'user';
}
```

---

## Hot-Reload Behavior

Prompts are loaded from JSON files at runtime. Changes to prompt files:
- **Development**: Refresh browser to pick up changes
- **Production**: Deploy updates to reload

No code changes needed to add/modify prompts - this is **declarative sovereignty** in action.

---

## Next Steps

1. ✅ Journey Mode toggle (this sprint)
2. 📋 Expand base.prompts.json (next sprint)
3. 📋 Create lens-specific libraries (future sprints)
4. 📋 Add moment-triggered prompts (future sprints)
