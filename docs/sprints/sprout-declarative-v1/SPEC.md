# Specification: sprout-declarative-v1

**Sprint:** sprout-declarative-v1  
**Version:** 1.0  
**Author:** Jim Calhoun + Claude  
**Date:** December 30, 2024  

---

## Overview

Transform the Sprout capture system from single-action hardcoded UI into a declarative, multi-action system with Research Manifest capability. Users can capture insights as simple sprouts OR build structured research briefs that generate copy-paste ready prompts for deep research.

**Core Metaphor:** The Sapling is a *living research brief* that accumulates clues and directions over time until ready to execute.

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Selection actions | Pattern 11 | Add `selection-actions.json` config, multi-action menu |
| Sprout lifecycle | Pattern 11 schema | Implement 8-stage botanical lifecycle |
| Object editing | Copilot Configurator | Natural language → JSON for sprout fields |
| Card styling | Pattern 4 | Use `--card-*` tokens for research card |

## New Patterns Proposed

None. All requirements met by extending existing patterns.

---

## Acceptance Criteria (20)

### Declarative Configuration (5)

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-01 | Selection actions defined in `data/selection-actions.json` | JSON file exists, schema valid |
| AC-02 | Sprout stages defined in `data/sprout-stages.json` | 8 stages with transitions |
| AC-03 | Research purposes defined in `data/research-purposes.json` | 5 purpose types |
| AC-04 | Research prompt template in `data/research-prompt-template.md` | Handlebars template valid |
| AC-05 | Zero hardcoded action/stage definitions in TypeScript | Code review |

### Multi-Action Selection (4)

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-06 | MagneticPill shows action menu when multiple actions available | Visual test |
| AC-07 | Action menu renders from `selection-actions.json` config | Config modification reflected |
| AC-08 | "Plant Sprout" creates tender sprout (existing behavior) | E2E test |
| AC-09 | "Research Directive" opens ResearchManifestCard | E2E test |

### Research Manifest Card (5)

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-10 | Card displays selected text preview | Visual inspection |
| AC-11 | Purpose selector shows 5 types from config | Config modification reflected |
| AC-12 | Clues list supports add/remove with type selector | Manual test |
| AC-13 | Directions list supports add/remove text entries | Manual test |
| AC-14 | "Save Draft" creates sprout with `stage: 'rooting'` | Data inspection |

### Prompt Generation (3)

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-15 | "Generate Prompt" button produces formatted research prompt | Output validation |
| AC-16 | Generated prompt includes all manifest fields | Template coverage |
| AC-17 | Copy-to-clipboard with success feedback | Manual test |

### Bug Fixes & Polish (3)

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-18 | MagneticPill scale increases as cursor approaches (bug fix) | Manual test |
| AC-19 | Research sprouts show distinct styling in tray | Visual inspection |
| AC-20 | Stage badges display correctly on all sprout cards | Visual inspection |

---

## Data Models

### ResearchManifest (New)

```typescript
interface ResearchManifest {
  /** Research intent */
  purpose: ResearchPurpose;
  
  /** Accumulated research clues */
  clues: ResearchClue[];
  
  /** Research directions/questions */
  directions: string[];
  
  /** Generated prompt (if any) */
  promptGenerated?: {
    templateId: string;
    generatedAt: string;
    rawPrompt: string;
  };
  
  /** Harvested research output (optional) */
  harvest?: {
    raw: string;
    harvestedAt: string;
    addedToKnowledge?: boolean;
  };
}

type ResearchPurpose = 'skeleton' | 'thread' | 'challenge' | 'gap' | 'validate';

interface ResearchClue {
  type: 'url' | 'citation' | 'author' | 'concept' | 'question';
  value: string;
  note?: string;
}
```

### SproutStage (Extended)

```typescript
type SproutStage = 
  | 'tender'      // Just captured, no research intent
  | 'rooting'     // Has research manifest, accumulating
  | 'branching'   // Prompt generated, ready to execute
  | 'hardened'    // Research harvested, needs review
  | 'grafted'     // Connected to other sprouts
  | 'established' // Promoted to Knowledge Commons
  | 'dormant'     // Archived but preserved
  | 'withered';   // Abandoned
```

### Sprout Extension

```typescript
interface Sprout {
  // ... existing fields ...
  
  /** Growth stage in botanical lifecycle */
  stage: SproutStage;
  
  /** Research manifest (optional - for research sprouts) */
  researchManifest?: ResearchManifest;
}
```

---

## JSON Schemas

### data/selection-actions.json

```json
{
  "$schema": "selection-actions.schema.json",
  "version": "1.0.0",
  "actions": [
    {
      "id": "sprout",
      "label": "Plant Sprout",
      "icon": "🌱",
      "description": "Capture insight as-is",
      "defaultStage": "tender",
      "captureCard": "SproutCaptureCard",
      "fields": ["tags"]
    },
    {
      "id": "research-directive",
      "label": "Research Directive",
      "icon": "🔬",
      "description": "Build research brief",
      "defaultStage": "rooting",
      "captureCard": "ResearchManifestCard",
      "fields": ["purpose", "clues", "directions", "tags"]
    }
  ]
}
```

### data/sprout-stages.json

```json
{
  "$schema": "sprout-stages.schema.json",
  "version": "1.0.0",
  "stages": [
    { "id": "tender", "label": "Tender", "icon": "🌱", "color": "green-300" },
    { "id": "rooting", "label": "Rooting", "icon": "🔬", "color": "cyan-400" },
    { "id": "branching", "label": "Branching", "icon": "📋", "color": "blue-400" },
    { "id": "hardened", "label": "Hardened", "icon": "🌸", "color": "violet-400" },
    { "id": "grafted", "label": "Grafted", "icon": "🔗", "color": "amber-400" },
    { "id": "established", "label": "Established", "icon": "📚", "color": "emerald-500" },
    { "id": "dormant", "label": "Dormant", "icon": "💤", "color": "gray-400" },
    { "id": "withered", "label": "Withered", "icon": "🍂", "color": "stone-500" }
  ],
  "transitions": {
    "tender": ["rooting", "dormant", "withered"],
    "rooting": ["branching", "tender", "dormant"],
    "branching": ["hardened", "rooting"],
    "hardened": ["established", "rooting", "dormant"],
    "grafted": ["established", "dormant"],
    "established": [],
    "dormant": ["tender", "rooting"],
    "withered": []
  }
}
```

### data/research-purposes.json

```json
{
  "$schema": "research-purposes.schema.json",
  "version": "1.0.0",
  "purposes": [
    {
      "id": "skeleton",
      "label": "Build Skeleton",
      "icon": "🦴",
      "description": "Foundational research for Grove architecture",
      "promptFraming": "Establish authoritative sources and baseline understanding"
    },
    {
      "id": "thread",
      "label": "Extend Thread",
      "icon": "🧵",
      "description": "Deepen an existing line of thought",
      "promptFraming": "Build on what exists, find logical next steps"
    },
    {
      "id": "challenge",
      "label": "Challenge Assumption",
      "icon": "⚔️",
      "description": "Stress-test a belief or claim",
      "promptFraming": "Find counter-arguments, edge cases, and critiques"
    },
    {
      "id": "gap",
      "label": "Fill Gap",
      "icon": "🕳️",
      "description": "Something's missing, need to find it",
      "promptFraming": "Comprehensive survey of what exists on this topic"
    },
    {
      "id": "validate",
      "label": "Validate Claim",
      "icon": "✓",
      "description": "Confirm something believed to be true",
      "promptFraming": "Find supporting evidence, note confidence levels"
    }
  ]
}
```

---

## UI Specifications

### ActionMenu Component

```
┌─────────────────────────────────────────────────────┐
│                    Action Menu                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ 🌱 Plant Sprout  │  │ 🔬 Research Directive    │ │
│  │ Capture as-is    │  │ Build research brief     │ │
│  └──────────────────┘  └──────────────────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### ResearchManifestCard Component

```
┌─────────────────────────────────────────────────────┐
│  🔬 Research Manifest                         [×]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  SEED                                                │
│  "The ratchet effect suggests that capability..."    │
│  📍 From: Terminal via Economics lens                │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  PURPOSE                                             │
│  ○ 🦴 Skeleton  ● 🧵 Thread  ○ ⚔️ Challenge          │
│  ○ 🕳️ Gap       ○ ✓ Validate                        │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  CLUES                                    [+ Add]    │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔗 arxiv.org/abs/2304.03442            [×]    │ │
│  │    Park et al generative agents paper          │ │
│  │ 👤 Joon Sung Park - memory work        [×]    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  DIRECTIONS                               [+ Add]    │
│  ┌────────────────────────────────────────────────┐ │
│  │ 1. Find peer-reviewed sources...       [×]    │ │
│  │ 2. Historical precedents...            [×]    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Tags: [ratchet] [capability] [+]                    │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Save Draft]              [Generate Prompt] 📋     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Out of Scope

- Automated research execution (manual copy-paste MVP)
- Notion/knowledge base integration (future sprint)
- Agent-driven research (Phase 2)
- Copilot natural language editing (documented pattern, future implementation)

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| kinetic-cultivation-v1 | Prior sprint | Complete |
| Pattern 11 components | Internal | Available |
| Handlebars (or template literals) | NPM | Evaluate |

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| JSON loading complexity | Low | Low | Build-time imports |
| Research card too complex | Medium | Medium | Start minimal, iterate |
| Stage migration issues | Low | Medium | Backward compatible defaults |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Jim + Claude | Initial specification |
