# Architecture: persona-behaviors-v1

**Sprint:** persona-behaviors-v1
**Date:** 2025-01-02

---

## 1. System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │   Terminal.tsx   │───▶│ chatService.ts  │───▶│   /api/chat    │  │
│  │                  │    │                 │    │                │  │
│  │ activeLensData:  │    │ ChatOptions:    │    │ Request body:  │  │
│  │  - toneGuidance  │    │  - personaTone  │    │  - personaTone │  │
│  │  - behaviors ◀───────▶│  - behaviors ◀──────▶│  - behaviors   │  │
│  └─────────────────┘    └─────────────────┘    └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND (server.js)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    buildSystemPrompt()                        │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │  IDENTITY   │  │ RESPONSE    │  │ CLOSING BEHAVIOR    │  │   │
│  │  │  (always)   │  │ MODE        │  │ (based on flag)     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  │         │                │                    │               │   │
│  │         ▼                ▼                    ▼               │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │              FORMATTING RULES (conditional)              │ │   │
│  │  │  - Bold clickability (always)                           │ │   │
│  │  │  - Navigation blocks (if useNavigationBlocks)           │ │   │
│  │  │  - Breadcrumb tags (if useBreadcrumbTags)              │ │   │
│  │  │  - Topic tags (if useTopicTags)                        │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │         │                                                     │   │
│  │         ▼                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │              VOICE LAYER (personaTone)                   │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│                       Gemini API Call                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow

### 2.1 Request Path

```
1. User sends message in Terminal
2. Terminal.tsx reads activeLensData from useNarrativeEngine()
3. activeLensData includes { toneGuidance, behaviors }
4. Terminal calls sendMessageStream() with both fields
5. chatService.ts POSTs to /api/chat with personaTone + personaBehaviors
6. server.js buildSystemPrompt() reads behaviors, assembles conditional prompt
7. Gemini API receives assembled prompt + user message
8. Response streams back through SSE
```

### 2.2 Backward Compatibility

```
Persona WITHOUT behaviors field:
  └── behaviors = undefined
        └── personaBehaviors = {} (server receives)
              └── All flags default to true/architect/navigation
                    └── Current behavior preserved ✓

Persona WITH behaviors field:
  └── behaviors = { responseMode: 'contemplative', ... }
        └── personaBehaviors = { responseMode: 'contemplative', ... }
              └── Flags override defaults
                    └── New behavior applied ✓
```

---

## 3. Component Changes

### 3.1 Schema Layer

**File:** `data/narratives-schema.ts`

```typescript
// NEW: Response mode enum
export type ResponseMode = 'architect' | 'librarian' | 'contemplative';

// NEW: Closing behavior enum
export type ClosingBehavior = 'navigation' | 'question' | 'open';

// NEW: Behavioral flags interface
export interface PersonaBehaviors {
  responseMode?: ResponseMode;
  closingBehavior?: ClosingBehavior;
  useBreadcrumbTags?: boolean;
  useTopicTags?: boolean;
  useNavigationBlocks?: boolean;
}

// MODIFIED: Persona interface
export interface Persona {
  id: string;
  publicLabel: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  toneGuidance: string;
  behaviors?: PersonaBehaviors;  // NEW FIELD
  narrativeStyle: string;
  arcEmphasis: ArcEmphasis;
  openingPhase: string;
  defaultThreadLength: number;
  entryPoints: string[];
  suggestedThread: string[];
}
```

### 3.2 Persona Configuration

**File:** `data/default-personas.ts`

```typescript
// Wayne Turner - contemplative mode
'wayne-turner': {
  id: 'wayne-turner',
  // ... existing fields
  toneGuidance: `[PERSONA: Wayne Turner] ...`,
  behaviors: {
    responseMode: 'contemplative',
    closingBehavior: 'question',
    useBreadcrumbTags: false,
    useTopicTags: false,
    useNavigationBlocks: false
  }
}

// Dr. Chiang - librarian mode (if added)
'dr-chiang': {
  id: 'dr-chiang',
  // ... existing fields
  toneGuidance: `[PERSONA: Dr. Mung Chiang] ...`,
  behaviors: {
    responseMode: 'librarian',
    closingBehavior: 'navigation'
    // Other flags use defaults
  }
}
```

### 3.3 Frontend Service

**File:** `services/chatService.ts`

```typescript
// MODIFIED: ChatOptions interface
export interface ChatOptions {
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  personaBehaviors?: PersonaBehaviors;  // NEW
  verboseMode?: boolean;
  terminatorMode?: boolean;
  journeyId?: string;
}

// MODIFIED: sendMessageStream request body
const requestBody = {
  message,
  sessionId: options.sessionId ?? currentSessionId,
  sectionContext: options.sectionContext,
  personaTone: options.personaTone,
  personaBehaviors: options.personaBehaviors,  // NEW
  verboseMode: options.verboseMode ?? false,
  terminatorMode: options.terminatorMode ?? false,
  journeyId: options.journeyId ?? null
};
```

### 3.4 Frontend Component

**File:** `components/Terminal.tsx`

```typescript
// MODIFIED: sendMessageStream call (~line 980)
const response = await sendMessageStream(
  textToSend,
  (chunk) => { /* streaming handler */ },
  {
    sectionContext: SECTION_CONFIG[activeSection]?.title || activeSection,
    personaTone: activeLensData?.toneGuidance,
    personaBehaviors: activeLensData?.behaviors,  // NEW
    verboseMode: isVerboseMode,
    terminatorMode: terminatorModeActive,
    journeyId: currentJourneyId
  }
);
```

### 3.5 Backend Prompt Assembly

**File:** `server.js`

See SPEC.md Section 4.4 for full implementation.

---

## 4. DEX Compliance

| Pillar | How This Architecture Complies |
|--------|-------------------------------|
| **Declarative Sovereignty** | Behaviors defined in JSON schema, not code conditionals |
| **Capability Agnosticism** | Works with any LLM that can follow system prompts |
| **Provenance** | Persona ID traces to config; buildSystemPrompt is deterministic |
| **Organic Scalability** | Defaults work out of box; override only what differs |

---

## 5. Migration Path to Bedrock

When bedrock implements chat:

1. Use `PersonaBehaviors` interface from this sprint
2. Implement `buildSystemPrompt()` pattern server-side
3. Wire behaviors through whatever API layer bedrock uses
4. Document as canonical implementation

**Note:** Bedrock currently has no chat in server.js (removed). This sprint's pattern should be the reference when it's added.
