# Sprout Lifecycle Through Config Pipeline

**Sprint:** S28-PIPE
**Purpose:** Show EXACTLY how configs merge into prompts at each stage

---

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER ACTION: "What are the economic implications of local AI?"         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SPROUT CREATED                                                         │
│  { id: "abc123", query: "What are...", status: "pending" }             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                       PHASE 1: RESEARCH                                  │
│                                                                          │
│  Step 1: Load Configs                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ResearchAgentConfig (grove-wide, v1, status='active')              │ │
│  │ ┌────────────────────────────────────────────────────────────────┐ │ │
│  │ │ searchInstructions:                                            │ │ │
│  │ │   "You are a SENIOR RESEARCH ANALYST..."                       │ │ │
│  │ │   "Your research must be EXHAUSTIVE, RIGOROUS..."              │ │ │
│  │ │                                                                │ │ │
│  │ │ qualityGuidance:                                               │ │ │
│  │ │   "Use rich markdown formatting — ## headers..."               │ │ │
│  │ └────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Step 2: Load Research Template (if user selected one)                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ OutputTemplate (agentType='research', e.g., "Trend Analysis")      │ │
│  │ ┌────────────────────────────────────────────────────────────────┐ │ │
│  │ │ systemPrompt:                                                  │ │ │
│  │ │   "Conduct trend-focused research..."                          │ │ │
│  │ │   "Behavior: Moderate depth, emphasis on temporal patterns."   │ │ │
│  │ │                                                                │ │ │
│  │ │ renderingInstructions:                                         │ │ │
│  │ │   "Track how topics evolved over time..."                      │ │ │
│  │ └────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Step 3: Build Research Prompt (String Concatenation)                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ finalPrompt = template.systemPrompt                                │ │
│  │             + "\n\n"                                                │ │
│  │             + template.renderingInstructions                        │ │
│  │                                                                    │ │
│  │ // If no template selected:                                        │ │
│  │ finalPrompt = researchConfig.searchInstructions                    │ │
│  │             + "\n\n"                                                │ │
│  │             + researchConfig.qualityGuidance                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Step 4: Send to Claude                                                 │
│  POST /api/research/deep                                                │
│  {                                                                       │
│    systemPrompt: finalPrompt,  // ← Merged config text                 │
│    query: "What are the economic implications...",                      │
│    maxTokens: 16384                                                     │
│  }                                                                       │
│                                                                          │
│  Step 5: Claude Returns Evidence                                        │
│  {                                                                       │
│    title: "Economic Implications of Local AI...",                       │
│    sections: [...],                                                     │
│    sources: [...]                                                       │
│  }                                                                       │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SPROUT UPDATED                                                         │
│  {                                                                      │
│    status: "germinating",                                               │
│    canonicalResearch: { title, sections, sources },  ← Evidence stored │
│    researchConfigVersion: 1  ← Provenance tracking                     │
│  }                                                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                        PHASE 2: WRITING                                  │
│                                                                          │
│  Step 1: Load Configs                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ WriterAgentConfig (grove-wide, v1, status='active')                │ │
│  │ ┌────────────────────────────────────────────────────────────────┐ │ │
│  │ │ writingStyle:                                                  │ │ │
│  │ │   "You are a senior research writer."                          │ │ │
│  │ │   "Write with: Formality: professional..."                     │ │ │
│  │ │                                                                │ │ │
│  │ │ resultsFormatting:                                             │ │ │
│  │ │   "## Document Structure"                                      │ │ │
│  │ │   "1. Open with thesis..."                                     │ │ │
│  │ │   "## Rendering Rules (ReactMarkdown + GFM)..."                │ │ │
│  │ │                                                                │ │ │
│  │ │ citationsStyle:                                                │ │ │
│  │ │   "Use <cite index=\"N\"> tags..."                               │ │ │
│  │ └────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Step 2: User Selects Writer Template                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ OutputTemplate (agentType='writer', "Blog Post")                   │ │
│  │ ┌────────────────────────────────────────────────────────────────┐ │ │
│  │ │ systemPrompt:                                                  │ │ │
│  │ │   "Write an engaging blog post that explains research..."      │ │ │
│  │ │                                                                │ │ │
│  │ │ renderingInstructions:                                         │ │ │
│  │ │   "Use conversational tone, short paragraphs..."               │ │ │
│  │ │                                                                │ │ │
│  │ │ configOverrides:                                               │ │ │
│  │ │   writingStyle: "Casual and conversational. Use 'we'."        │ │ │
│  │ │   // resultsFormatting not overridden → inherit from base      │ │ │
│  │ └────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Step 3: Merge Configs (Template Overrides Win)                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ effectiveWritingStyle = template.configOverrides.writingStyle     │ │
│  │                       = "Casual and conversational. Use 'we'."    │ │
│  │                       (TEMPLATE OVERRIDES BASE)                    │ │
│  │                                                                    │ │
│  │ effectiveFormatting = writerConfig.resultsFormatting              │ │
│  │                     = "## Document Structure..."                   │ │
│  │                     (INHERITED - template didn't override)         │ │
│  │                                                                    │ │
│  │ effectiveCitations = writerConfig.citationsStyle                  │ │
│  │                    = "Use <cite index=\"N\">..."                    │ │
│  │                    (INHERITED)                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Step 4: Build Writer Prompt (document-generator.ts)                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ finalPrompt =                                                      │ │
│  │   template.systemPrompt                                            │ │
│  │   + "\n\n## Approach\n"                                             │ │
│  │   + sprout.query                                                   │ │
│  │   + "\n\n## Writing Style\n"                                        │ │
│  │   + effectiveWritingStyle                                          │ │
│  │   + "\n\n## Results Formatting\n"                                   │ │
│  │   + effectiveFormatting                                            │ │
│  │   + "\n\n## Citations\n"                                            │ │
│  │   + effectiveCitations                                             │ │
│  │   + "\n\n## Rendering Instructions\n"                               │ │
│  │   + template.renderingInstructions                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Step 5: Send to Claude                                                 │
│  POST /api/research/write                                               │
│  {                                                                       │
│    finalPrompt: "Write an engaging blog post...\n\n## Writing Style...",│
│    evidence: sprout.canonicalResearch,                                  │
│    query: "What are the economic implications..."                       │
│  }                                                                       │
│                                                                          │
│  Step 6: Claude Returns Document                                        │
│  {                                                                       │
│    position: "Local AI ownership represents...",                        │
│    analysis: "## Economic Landscape\n\nWe're seeing...",                │
│    citations: [...]                                                     │
│  }                                                                       │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SPROUT COMPLETE                                                        │
│  {                                                                      │
│    status: "ready",                                                     │
│    canonicalResearch: { ... },  ← Evidence from Phase 1                │
│    generatedArtifacts: [        ← Documents from Phase 2               │
│      {                                                                  │
│        document: { position, analysis, citations },                     │
│        templateId: "blog-post-v1",                                      │
│        templateName: "Blog Post",                                       │
│        writerConfigVersion: 1,  ← Which config produced this            │
│        renderingSource: "template",                                     │
│        generatedAt: "2026-01-28T..."                                    │
│      }                                                                  │
│    ]                                                                    │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## What You're Configuring (Prompt Fragments)

### ResearchAgentConfig (Grove-Wide Base)

**Controls:** How the research agent gathers evidence

**Fields:**
- `searchInstructions` → Tells Claude: "Be EXHAUSTIVE, RIGOROUS..."
- `qualityGuidance` → Tells Claude: "Use markdown, cite sources..."

**Used When:** Research phase (evidence gathering)

**Can Be Overridden By:** Research OutputTemplate (agentType='research')

---

### WriterAgentConfig (Grove-Wide Base)

**Controls:** How the writer agent transforms evidence → document

**Fields:**
- `writingStyle` → Tells Claude: "Write professionally, neutral perspective..."
- `resultsFormatting` → Tells Claude: "Use ## headers, include thesis..."
- `citationsStyle` → Tells Claude: "Use <cite> tags, Sources section at end..."

**Used When:** Writing phase (document generation)

**Can Be Overridden By:** Writer OutputTemplate (agentType='writer')

---

### OutputTemplate (Per-Document Override)

**Controls:** Specific behavior for this template

**Fields:**
- `systemPrompt` → Main instruction (e.g., "Write an engaging blog post...")
- `renderingInstructions` → Formatting rules (e.g., "Short paragraphs, conversational...")
- `configOverrides` → Override specific writer config fields (e.g., `writingStyle: "Casual"`)

**Used When:** User selects template in SproutFinishingRoom

**Overrides:** Specific fields in WriterAgentConfig

---

## Prompt Assembly Example

### Research Phase (No Template Selected)

```
┌─────────────────────────────────────────────────────────────────┐
│  FINAL PROMPT SENT TO CLAUDE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You are a SENIOR RESEARCH ANALYST conducting professional-     │
│  grade investigation.                                           │
│                                                                 │
│  Your research must be:                                         │
│  - EXHAUSTIVE: Explore every relevant angle...                  │
│  - RIGOROUS: Distinguish between primary sources...             │
│  ...                                                            │
│  [← ResearchAgentConfig.searchInstructions]                     │
│                                                                 │
│  IMPORTANT: Use rich markdown formatting in all output —        │
│  ## headers for sections, ### for subsections...                │
│  [← ResearchAgentConfig.qualityGuidance]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Writing Phase (Blog Post Template Selected)

```
┌─────────────────────────────────────────────────────────────────┐
│  FINAL PROMPT SENT TO CLAUDE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Write an engaging blog post that explains research findings    │
│  in an accessible, conversational style.                        │
│  [← Template.systemPrompt]                                      │
│                                                                 │
│  ## Approach                                                    │
│  What are the economic implications of local AI hardware        │
│  ownership?                                                     │
│  [← Sprout.query]                                               │
│                                                                 │
│  ## Writing Style                                               │
│  Casual and conversational. Use 'we'. Be engaging.              │
│  [← Template.configOverrides.writingStyle] ★ OVERRIDDEN         │
│                                                                 │
│  ## Results Formatting                                          │
│  ## Document Structure                                          │
│  1. Open with a clear thesis/position...                        │
│  ## Rendering Rules (ReactMarkdown + GFM)...                    │
│  [← WriterAgentConfig.resultsFormatting] ★ INHERITED            │
│                                                                 │
│  ## Citations                                                   │
│  Use <cite index="N"> tags where N is the source index.         │
│  Example: <cite index="1">GPU inference improved 10x</cite>     │
│  [← WriterAgentConfig.citationsStyle] ★ INHERITED               │
│                                                                 │
│  ## Rendering Instructions                                      │
│  Use short paragraphs. Include real-world examples.             │
│  [← Template.renderingInstructions]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Insight: Configs Are Prompt Sections

```
ResearchAgentConfig = Base instructions for research
WriterAgentConfig   = Base instructions for writing
OutputTemplate      = Specific overrides per template

All three are TEXT that gets CONCATENATED into sections:
  ## Section 1: Search Instructions
  ## Section 2: Writing Style
  ## Section 3: Results Formatting
  ## Section 4: Citations
  ## Section 5: Rendering Instructions
```

**When you edit WriterAgentConfig.writingStyle**, you're changing the default text that appears in the "Writing Style" section of the prompt — UNLESS a template overrides it.

**When you edit OutputTemplate.systemPrompt**, you're writing template-specific behavior that ALWAYS appears at the top.

---

## What AgentType Controls

**Filter Logic:**
```typescript
// In SproutFinishingRoom Action Panel:

// RESEARCH PHASE
const researchTemplates = loadActiveTemplates('research');
// Returns: Only templates where agentType='research'
// User can pick: "Trend Analysis", "Deep Dive", etc.

// WRITING PHASE
const writerTemplates = loadActiveTemplates('writer');
// Returns: Only templates where agentType='writer'
// User can pick: "Blog Post", "Vision Paper", "Academic Paper", etc.
```

**Purpose:** Separate research behavior templates from writer behavior templates.

**Analogy:**
- Research templates = "HOW to search" (depth, sources, thoroughness)
- Writer templates = "HOW to write" (voice, structure, citations)

They operate at different pipeline stages, so they need to be filtered separately.

---

## Summary

### You're Configuring Prompts, Not Code

| Config | Stage | Controls |
|--------|-------|----------|
| **ResearchAgentConfig** | Research | Base search behavior (exhaustive? rigorous? confidence levels?) |
| **WriterAgentConfig** | Writing | Base writing defaults (voice? structure? citations?) |
| **OutputTemplate (research)** | Research | Override search for specific research types ("trend analysis") |
| **OutputTemplate (writer)** | Writing | Override writing for specific outputs ("blog post" vs "academic paper") |

### AgentType Purpose

**Filters templates by which agent uses them.**

- `agentType='research'` → Used during evidence gathering
- `agentType='writer'` → Used during document writing

They execute at different times in the lifecycle, so they need separate template pools.

### Category Purpose

**Optional user tag for organization.**

Not used functionally. Just visual metadata. Can be removed.

---

**Does this clarify the flow?** The configs are literally text fragments that get merged into Claude's system prompt at different pipeline stages.
