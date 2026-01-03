# Specification: persona-behaviors-v1

**Sprint:** persona-behaviors-v1
**Version:** 1.0
**Date:** 2025-01-02
**Author:** Jim Calhoun / Claude

---

## 1. Problem Statement

Persona lenses (Wayne Turner, Dr. Chiang) cannot control structural response behaviors. The current architecture only supports `toneGuidance` (voice layer), which is appended to a fixed base system prompt. This causes:

1. **Wayne Turner** responds with navigation blocks and breadcrumb tags despite toneGuidance saying "end on question, not conclusion"
2. **Dr. Chiang** cannot opt into librarian mode (verbose, comprehensive) by default
3. All personas inherit identical structural behaviors regardless of design intent

**Root Cause:** `buildSystemPrompt()` hardcodes structural behaviors (formatting rules, response modes, closing behaviors) and only allows voice modification via appended toneGuidance.

---

## 2. Solution Overview

Introduce a **Behavioral Flags** layer alongside the existing **Voice** layer:

```
┌─────────────────────────────────────────────────────┐
│                    PERSONA CONFIG                    │
├─────────────────────────────────────────────────────┤
│  toneGuidance: string     → HOW to sound (voice)    │
│  behaviors: {             → WHAT to do (structure)  │
│    responseMode,                                     │
│    closingBehavior,                                  │
│    useBreadcrumbTags,                               │
│    useTopicTags,                                    │
│    useNavigationBlocks                              │
│  }                                                   │
└─────────────────────────────────────────────────────┘
```

**Key Principle:** Generic flags, not persona-specific conditionals. Any persona can set any flag.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | Personas can specify `responseMode`: 'architect' \| 'librarian' \| 'contemplative' | Must |
| F2 | Personas can specify `closingBehavior`: 'navigation' \| 'question' \| 'open' | Must |
| F3 | Personas can disable breadcrumb tags via `useBreadcrumbTags: false` | Must |
| F4 | Personas can disable topic tags via `useTopicTags: false` | Must |
| F5 | Personas can disable navigation blocks via `useNavigationBlocks: false` | Must |
| F6 | Personas without `behaviors` field get current default behavior | Must |
| F7 | Bold text clickability remains platform-level (not persona-configurable) | Must |

### 3.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NF1 | No breaking changes to existing personas | Must |
| NF2 | Changes propagate to both /terminal and /explore routes | Must |
| NF3 | No additional API calls or latency | Must |
| NF4 | Pattern documented for bedrock migration | Should |

---

## 4. Technical Design

### 4.1 PersonaBehaviors Interface

```typescript
// data/narratives-schema.ts

export type ResponseMode = 'architect' | 'librarian' | 'contemplative';
export type ClosingBehavior = 'navigation' | 'question' | 'open';

export interface PersonaBehaviors {
  // Response structure
  responseMode?: ResponseMode;        // default: 'architect'
  closingBehavior?: ClosingBehavior;  // default: 'navigation'
  
  // Structural elements (all default to true)
  useBreadcrumbTags?: boolean;        // default: true
  useTopicTags?: boolean;             // default: true
  useNavigationBlocks?: boolean;      // default: true
}

export interface Persona {
  // ... existing fields
  toneGuidance: string;
  behaviors?: PersonaBehaviors;  // NEW
}
```

### 4.2 Persona Configuration Examples

**Wayne Turner (contemplative, ends on question):**
```typescript
{
  id: 'wayne-turner',
  toneGuidance: `[PERSONA: Wayne Turner] ...`,
  behaviors: {
    responseMode: 'contemplative',
    closingBehavior: 'question',
    useBreadcrumbTags: false,
    useTopicTags: false,
    useNavigationBlocks: false
  }
}
```

**Dr. Chiang (librarian mode, keeps navigation):**
```typescript
{
  id: 'dr-chiang',
  toneGuidance: `[PERSONA: Dr. Mung Chiang] ...`,
  behaviors: {
    responseMode: 'librarian',
    closingBehavior: 'navigation',
    // useBreadcrumbTags: true (default)
    // useTopicTags: true (default)
    // useNavigationBlocks: true (default)
  }
}
```

**Default persona (no behaviors = current behavior):**
```typescript
{
  id: 'concerned-citizen',
  toneGuidance: `[PERSONA: Concerned Citizen] ...`
  // No behaviors field = all defaults apply
}
```

### 4.3 ChatService Extension

```typescript
// services/chatService.ts

export interface ChatOptions {
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  personaBehaviors?: PersonaBehaviors;  // NEW
  verboseMode?: boolean;
  terminatorMode?: boolean;
  journeyId?: string;
}
```

### 4.4 Server Prompt Assembly

```javascript
// server.js

const RESPONSE_MODES = {
  architect: `**RESPONSE MODE: Architect**
- Hook curiosity in first sentence
- Keep responses focused (~100 words unless depth requested)
- Structure: Insight → Support → Stop
- Leave threads for exploration`,

  librarian: `**RESPONSE MODE: Librarian**
- Provide comprehensive, well-structured responses
- Include technical depth and nuance
- Use examples and evidence
- Organize with clear sections when appropriate`,

  contemplative: `**RESPONSE MODE: Contemplative**
- Sit with the problem before explaining
- Think out loud, not present conclusions
- Don't rush to solutions
- Let complexity breathe`
};

const CLOSING_BEHAVIORS = {
  navigation: `**CLOSING:** End with navigation options using [[deep_dive:...]], [[pivot:...]], or [[apply:...]] blocks.`,
  question: `**CLOSING:** End on a question that invites reflection, not a conclusion that closes conversation.`,
  open: `**CLOSING:** End naturally without forced navigation or questions.`
};

function buildSystemPrompt(options = {}) {
  const { personaTone, personaBehaviors = {} } = options;
  
  // Apply defaults
  const responseMode = personaBehaviors.responseMode ?? 'architect';
  const closingBehavior = personaBehaviors.closingBehavior ?? 'navigation';
  const useBreadcrumbs = personaBehaviors.useBreadcrumbTags !== false;
  const useTopics = personaBehaviors.useTopicTags !== false;
  const useNavBlocks = personaBehaviors.useNavigationBlocks !== false;
  
  // Build prompt parts
  const parts = [IDENTITY_PROMPT];  // Core identity (always present)
  parts.push(RESPONSE_MODES[responseMode]);
  parts.push(CLOSING_BEHAVIORS[closingBehavior]);
  
  // Conditional formatting rules
  if (useBreadcrumbs || useTopics || useNavBlocks) {
    let formatRules = '\n\n**FORMATTING RULES:**\n';
    formatRules += '- Use **bold** to highlight key concepts\n';
    
    if (useNavBlocks) {
      formatRules += '- Include navigation blocks at end of responses\n';
    }
    if (useBreadcrumbs) {
      formatRules += '- Include [[BREADCRUMB: ...]] tag\n';
    }
    if (useTopics) {
      formatRules += '- Include [[TOPIC: ...]] tag\n';
    }
    parts.push(formatRules);
  }
  
  // Voice layer (appended last)
  if (personaTone) {
    parts.push(`\n**ACTIVE PERSONA VOICE:**\n${personaTone}`);
  }
  
  return parts.join('\n');
}
```

---

## 5. DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Non-engineers can change persona behaviors via JSON config |
| **Capability Agnosticism** | Works regardless of which LLM executes the prompt |
| **Provenance** | Persona config is versioned; prompt assembly is traceable |
| **Organic Scalability** | New personas inherit defaults; override only what's different |

---

## 6. Patterns Extended

| Existing Pattern | Extension |
|------------------|-----------|
| Pattern 3: Narrative Schema | Add `behaviors` field to Persona interface |
| Pattern 1: Quantum Interface | Behaviors are lens-reactive like content |

**New patterns proposed:** None. This extends existing schema patterns.

---

## 7. Out of Scope

- Custom response modes beyond architect/librarian/contemplative
- Per-message behavior overrides
- Admin UI for editing behaviors
- Bedrock implementation (documented for future)
