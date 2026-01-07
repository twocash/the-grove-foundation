# Sprint: prompt-refinement-v1

## Problem Statement

The current prompt extraction pipeline (`extraction-pipeline-integration-v1`) successfully extracts concepts from documents and stores them as draft prompts. However, the extracted prompts are not usable in their current form:

1. **Inspector panels are display-only** - Users can see extracted prompts but cannot edit, refine, or configure them
2. **Titles are concept-names, not user-facing prompts** - "Observer Dynamic" or "Distributed Long-Term Memory" are internal concepts, not something a user would click on as a suggested exploration
3. **Execution prompts need refinement direction** - The extraction creates system-context-style content, but needs guidance on generating actual prompts users would want to explore
4. **No operator-level configuration** - Grove Node operators have no way to tune how prompts are extracted for their specific knowledge base

## User Stories

### As a Foundation Operator (Admin)
- I want to **review and refine extracted prompts** before they go live, so users see polished exploration options
- I want to **configure extraction behavior per knowledge collection**, so prompts match my content's domain and audience
- I want to **bulk-edit common properties** (targeting, categories, weights) across multiple extracted prompts
- I want the **Copilot to help me refine prompts**, suggesting better titles, improving execution prompts, and inferring categories

### As a Surface User
- I want suggested prompts to be **phrased as questions or topics I'd want to explore**, not academic concept names
- I want prompts to **stand alone** - they should make sense without needing prior context about "what this means"

---

## Epic 1: Interactive Inspector for Extracted Prompts

### Current State
- `ReviewQueue` shows extracted prompts in a sidebar
- Clicking opens the standard `PromptEditor` in Inspector
- `PromptEditor` may have display-only fields or missing save functionality for extracted prompts

### Requirements

**1.1 Full Editor Functionality**
- [ ] Verify all `PromptEditor` fields are editable for extracted prompts
- [ ] "Save" button persists changes to Supabase
- [ ] Changes update the card in both ReviewQueue and main grid
- [ ] Editor shows extraction provenance (source doc, extraction date, confidence, batch)

**1.2 Quick Actions in Editor**
- [ ] "Approve" button in editor (same as sidebar approve)
- [ ] "Reject" button in editor (same as sidebar reject)
- [ ] "Regenerate Title" button → Copilot generates user-friendly title
- [ ] "Regenerate Execution Prompt" button → Copilot refines with operator templates

**1.3 Side-by-Side Source View**
- [ ] Show source document excerpt that triggered extraction
- [ ] Highlight the concept/passage in context
- [ ] Link to full document in Knowledge Vault

---

## Epic 2: Title Refinement - From Concepts to Explorations

### Problem
Extracted titles like:
- "Observer Dynamic"
- "Distributed Long-Term Memory"
- "Infrastructure Supplier"

These are **concept labels**, not **exploration prompts**. Users won't know what they're clicking on.

### Target State
Titles should be phrased as:
- "What is the Observer Dynamic and why does it matter?"
- "How does distributed long-term memory work in Grove?"
- "Why would I want to become an infrastructure supplier?"

Or as topic explorations:
- "The Observer Dynamic: Watching vs. Being Watched"
- "Memory Without a Central Server"
- "Owning Infrastructure Instead of Renting It"

### Requirements

**2.1 Extraction Prompt Update**
- [ ] Modify `extractionPrompt.ts` to request TWO outputs per concept:
  - `conceptLabel`: Internal concept name (current behavior)
  - `explorationTitle`: User-facing title phrased as question/topic
- [ ] Add examples to the prompt showing the transformation

**2.2 Title Style Configuration**
- [ ] Add `titleStyle` setting: `'question' | 'topic' | 'both'`
- [ ] Question style: "What is X?" / "How does Y work?" / "Why Z?"
- [ ] Topic style: "X: The Implication" / descriptive phrase
- [ ] Both: Generate both, operator picks during review

**2.3 Copilot Title Refinement**
- [ ] `/refine-title` copilot action that takes concept + context and generates options
- [ ] Show 3 title suggestions, user picks or edits
- [ ] Learn from operator preferences over time (future: fine-tuning data)

---

## Epic 3: Execution Prompt Refinement

### Problem
Current execution prompts are extracted as:
- System context (what the AI should know)
- But not **what the user is actually asking**

### Target State
Execution prompts should guide the AI on:
- What question the user is implicitly asking
- What angle/perspective to take
- What depth of response is appropriate
- What follow-ups might be relevant

### Requirements

**3.1 Structured Execution Prompt**
- [ ] Separate fields:
  - `userIntent`: What the user wants to learn (implicit question)
  - `responseGuidance`: How to frame the answer
  - `depthLevel`: `'overview' | 'detailed' | 'deep-dive'`
  - `suggestedFollowups`: 2-3 natural next questions

**3.2 Extraction Prompt Update**
- [ ] Update extraction to generate structured execution prompts
- [ ] Include `interestingBecause` as `responseGuidance` seed
- [ ] Infer `depthLevel` from concept complexity

**3.3 Operator Templates**
- [ ] Operators can define execution prompt templates:
  ```
  Template: "Explain {concept} in the context of {domain}.
  Focus on {audience_concern}. Include practical implications."
  ```
- [ ] Templates are stored at knowledge collection level
- [ ] Extraction uses templates when generating execution prompts

---

## Epic 4: 4D Targeting Auto-Assignment

### Current State
- `topicCategory` is extracted but mapping to `topicAffinities` is basic
- `targetStages` are inferred but may not align with user journey
- Lens affinities are defaulted to `base`

### Requirements

**4.1 Improved Stage Classification**
- [ ] Refine stage detection prompt with examples:
  - Genesis: Foundational "what is this" questions
  - Exploration: "How does this work" deep-dives
  - Synthesis: "How does this connect to X" integrations
  - Advocacy: "Why should I care" / "What should I do"
- [ ] Confidence score per stage (prompt may span multiple)

**4.2 Topic Affinity Inference**
- [ ] Map extracted `topicCategory` to existing TopicHub IDs
- [ ] Create new TopicHub suggestions if no match
- [ ] Weight based on extraction confidence

**4.3 Lens Affinity Inference**
- [ ] Analyze concept complexity and audience assumptions
- [ ] Suggest lens affinities: `technical`, `executive`, `academic`, `general`
- [ ] Default to `general` if unsure

**4.4 Bulk Category Assignment**
- [ ] UI for selecting multiple prompts and assigning shared categories
- [ ] "Apply to all from same document" action
- [ ] "Apply to all with similar topic" action (clustering)

---

## Epic 5: Operator-Level Extraction Configuration

### Vision
Grove Node operators should tune the prompt extractor to match their knowledge base and audience.

### Requirements

**5.1 Knowledge Collection Settings**
Add configuration at the knowledge collection (RAG) level:
```typescript
interface KnowledgeCollectionConfig {
  // Extraction behavior
  extraction: {
    enabled: boolean;
    autoExtractOnIngest: boolean;
    minConfidenceThreshold: number; // 0.0 - 1.0
    maxPromptsPerDocument: number;

    // Title generation
    titleStyle: 'question' | 'topic' | 'both';
    titleExamples?: string[]; // Operator-provided examples

    // Execution prompt
    executionTemplate?: string;
    audienceContext?: string; // e.g., "legal professionals", "technical founders"
    domainContext?: string;   // e.g., "distributed AI infrastructure"

    // Targeting defaults
    defaultStage?: PromptStage;
    defaultLens?: string;
    topicMappings?: Record<string, string>; // category → hubId
  };
}
```

**5.2 Settings UI in Knowledge Vault**
- [ ] "Extraction Settings" panel in Knowledge Vault console
- [ ] Toggle auto-extraction on/off
- [ ] Configure thresholds and limits
- [ ] Define title/execution templates
- [ ] Test extraction with sample document

**5.3 Per-Document Override**
- [ ] Documents can override collection-level settings
- [ ] "Skip extraction" flag for certain documents
- [ ] Document-specific audience/domain context

---

## Epic 6: Copilot Actions for Prompt Refinement

### Requirements

**6.1 Core Copilot Actions**
```typescript
const PROMPT_COPILOT_ACTIONS = [
  {
    id: 'refine-title',
    trigger: 'refine title',
    description: 'Generate user-friendly title options'
  },
  {
    id: 'refine-execution',
    trigger: 'refine execution prompt',
    description: 'Improve the execution prompt with operator context'
  },
  {
    id: 'suggest-categories',
    trigger: 'suggest categories',
    description: 'Auto-assign stage, topic, and lens affinities'
  },
  {
    id: 'expand-followups',
    trigger: 'suggest followups',
    description: 'Generate related exploration prompts'
  },
  {
    id: 'simplify',
    trigger: 'simplify',
    description: 'Make the prompt more accessible'
  },
  {
    id: 'make-specific',
    trigger: 'make specific',
    description: 'Add concrete examples and context'
  },
];
```

**6.2 Context-Aware Refinement**
- [ ] Copilot receives: prompt content, source document, operator config
- [ ] Refinements respect operator templates and audience context
- [ ] Show diff of changes for approval

**6.3 Batch Copilot Operations**
- [ ] "Refine all titles in selection"
- [ ] "Auto-categorize all pending prompts"
- [ ] Progress indicator for batch operations

---

## Technical Considerations

### Database Schema Changes
```sql
-- Add extraction config to knowledge collections
ALTER TABLE knowledge_collections ADD COLUMN extraction_config JSONB DEFAULT '{}';

-- Add structured execution prompt fields
ALTER TABLE prompts ADD COLUMN user_intent TEXT;
ALTER TABLE prompts ADD COLUMN response_guidance TEXT;
ALTER TABLE prompts ADD COLUMN depth_level TEXT;
ALTER TABLE prompts ADD COLUMN suggested_followups JSONB DEFAULT '[]';
```

### API Endpoints
- `PATCH /api/prompts/:id` - Update prompt fields (existing, verify working)
- `POST /api/prompts/:id/refine` - Copilot refinement endpoint
- `GET /api/knowledge/collections/:id/config` - Get extraction config
- `PATCH /api/knowledge/collections/:id/config` - Update extraction config

### Feature Flags
- `extraction.interactiveReview` - Enable full editor for extracted prompts
- `extraction.copilotRefinement` - Enable Copilot actions
- `extraction.operatorConfig` - Enable collection-level configuration

---

## Success Metrics

1. **Review Efficiency**: Time to review and approve/reject extracted prompts
2. **Title Quality**: % of prompts that don't need title refinement after extraction
3. **Execution Prompt Quality**: User engagement with prompts (click-through, completion)
4. **Operator Adoption**: % of knowledge collections with custom extraction config

---

## Open Questions for Brainstorm

1. **Title Generation Trade-offs**
   - Questions are clear but can feel formulaic ("What is X?")
   - Topic phrases are elegant but may be ambiguous
   - Should we A/B test title styles?

2. **Execution Prompt Complexity**
   - How much structure is helpful vs. constraining?
   - Should operators see the full structured format or a simplified view?

3. **Copilot Training**
   - Should we track which refinements operators accept/reject?
   - Could this become fine-tuning data for domain-specific extraction?

4. **Extraction Triggers**
   - Auto-extract on ingest vs. manual trigger?
   - Background job vs. real-time?
   - Re-extraction when document is updated?

5. **Review Queue UX**
   - Current: Sidebar + Inspector
   - Alternative: Dedicated review mode with full-screen comparison?
   - Kanban-style board (pending → reviewing → approved/rejected)?

---

## Dependencies

- `extraction-pipeline-integration-v1` (completed) - Base extraction infrastructure
- `prompt-unification-v1` (completed) - GroveObject<PromptPayload> schema
- `grove-data-layer-v1` (completed) - SupabaseAdapter for persistence

## Estimated Scope

| Epic | Complexity | Dependencies |
|------|------------|--------------|
| 1. Interactive Inspector | Medium | Verify existing PromptEditor |
| 2. Title Refinement | Medium | Extraction prompt changes |
| 3. Execution Prompt Refinement | High | Schema changes, extraction update |
| 4. 4D Targeting | Medium | TopicHub integration |
| 5. Operator Config | High | New settings UI, schema |
| 6. Copilot Actions | High | Copilot infrastructure |

Recommended order: Epic 1 → Epic 2 → Epic 4 → Epic 3 → Epic 6 → Epic 5
