# Execution Prompt: persona-behaviors-v1

**Sprint:** persona-behaviors-v1
**For:** Claude CLI (claude code)
**Date:** 2025-01-02

---

## Context

You are implementing persona behavioral flags for The Grove Terminal. This allows personas like Wayne Turner to control response structure (not just voice) through declarative configuration.

**Problem:** Wayne Turner's toneGuidance says "end on question, not conclusion" but responses still include navigation blocks and breadcrumb tags because those are hardcoded in the base system prompt.

**Solution:** Add a `behaviors` field to personas that controls structural elements. The server's `buildSystemPrompt()` reads these flags and conditionally assembles the prompt.

---

## Pre-Flight Check

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be on main, clean working directory
npm run build  # Should compile
```

---

## Epic 1: Schema Extension

### File: `data/narratives-schema.ts`

Find the existing type definitions section and add:

```typescript
// Response mode enum - controls response structure
export type ResponseMode = 'architect' | 'librarian' | 'contemplative';

// Closing behavior enum - controls how responses end
export type ClosingBehavior = 'navigation' | 'question' | 'open';

// Behavioral flags interface
export interface PersonaBehaviors {
  // Response structure
  responseMode?: ResponseMode;        // default: 'architect'
  closingBehavior?: ClosingBehavior;  // default: 'navigation'
  
  // Structural elements (all default to true)
  useBreadcrumbTags?: boolean;
  useTopicTags?: boolean;
  useNavigationBlocks?: boolean;
}
```

Find the `Persona` interface and add the behaviors field:

```typescript
export interface Persona {
  id: string;
  publicLabel: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  toneGuidance: string;
  behaviors?: PersonaBehaviors;  // ADD THIS LINE
  narrativeStyle: string;
  arcEmphasis: ArcEmphasis;
  openingPhase: string;
  defaultThreadLength: number;
  entryPoints: string[];
  suggestedThread: string[];
}
```

**Verify:**
```bash
npm run build  # Should compile
```

---

## Epic 2: Persona Configuration

### File: `data/default-personas.ts`

First, add import for PersonaBehaviors at the top:

```typescript
import { Persona, GlobalSettings, DEFAULT_GLOBAL_SETTINGS, PersonaBehaviors } from './narratives-schema';
```

Find the wayne-turner persona (should be around line 280+ based on earlier analysis, or may need to be added). Add or update with behaviors:

```typescript
'wayne-turner': {
  id: 'wayne-turner',
  publicLabel: 'Wayne Turner',
  description: 'Fiduciary counsel perspective on AI governance',
  icon: 'Scale',
  color: 'amber',
  enabled: true,
  toneGuidance: `[PERSONA: Wayne Turner]
You are Wayne Turner—imagine a grandfather who spent forty years as a small-town fiduciary, someone who's sat across kitchen tables helping families protect what matters. Now he sees the same dynamics playing out with AI: powerful interests, confused families, and stakes most people don't fully grasp yet.

Your voice:
- Lead with the human stakes, not the institutional ones
- Speak from experience, not expertise
- Use "we" and "us"—you're a citizen too
- Sit with problems before explaining solutions
- End on questions that invite reflection, not conclusions that close doors
- Worry out loud; let people see the thinking

What you're NOT:
- A policy expert citing frameworks
- An activist with an agenda
- A technologist explaining systems
- A salesperson with a pitch

You open doors. You don't close deals.`,
  behaviors: {
    responseMode: 'contemplative',
    closingBehavior: 'question',
    useBreadcrumbTags: false,
    useTopicTags: false,
    useNavigationBlocks: false
  },
  narrativeStyle: 'stakes-heavy',
  arcEmphasis: {
    hook: 4,
    stakes: 5,
    mechanics: 2,
    evidence: 3,
    resolution: 2
  },
  openingPhase: 'hook',
  defaultThreadLength: 4,
  entryPoints: [],
  suggestedThread: []
},
```

If there's a dr-chiang persona, add behaviors:

```typescript
behaviors: {
  responseMode: 'librarian',
  closingBehavior: 'navigation'
  // Other flags use defaults (true)
}
```

**Verify:**
```bash
npm run build
```

---

## Epic 3: Frontend Propagation

### File: `services/chatService.ts`

Find the ChatOptions interface (~line 18) and add personaBehaviors:

```typescript
export interface ChatOptions {
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  personaBehaviors?: import('../data/narratives-schema').PersonaBehaviors;  // ADD THIS
  verboseMode?: boolean;
  terminatorMode?: boolean;
  journeyId?: string;
}
```

Find the sendMessageStream function (~line 70). Update the requestBody to include personaBehaviors:

```typescript
const requestBody = {
  message,
  sessionId: options.sessionId ?? currentSessionId,
  sectionContext: options.sectionContext,
  personaTone: options.personaTone,
  personaBehaviors: options.personaBehaviors,  // ADD THIS
  verboseMode: options.verboseMode ?? false,
  terminatorMode: options.terminatorMode ?? false,
  journeyId: options.journeyId ?? null
};
```

Find the initChatSession function (~line 43). Update to include personaBehaviors:

```typescript
body: JSON.stringify({
  sectionContext: options.sectionContext,
  personaTone: options.personaTone,
  personaBehaviors: options.personaBehaviors,  // ADD THIS
  terminatorMode: options.terminatorMode ?? false,
  journeyId: options.journeyId ?? null
})
```

### File: `components/Terminal.tsx`

Find the sendMessageStream call (~line 980, look for `personaTone: activeLensData?.toneGuidance`).

Update to include personaBehaviors:

```typescript
const response = await sendMessageStream(
  textToSend,
  (chunk) => {
    // ... existing chunk handler
  },
  {
    sectionContext: SECTION_CONFIG[activeSection]?.title || activeSection,
    personaTone: activeLensData?.toneGuidance,
    personaBehaviors: activeLensData?.behaviors,  // ADD THIS
    verboseMode: isVerboseMode,
    terminatorMode: terminatorModeActive,
    journeyId: currentJourneyId
  }
);
```

**Verify:**
```bash
npm run build
```

---

## Epic 4: Server Prompt Assembly

### File: `server.js`

This is the most complex change. Find the section with FALLBACK_SYSTEM_PROMPT (~line 1050-1150).

**Step 1:** Add RESPONSE_MODES constant near the top of the chat section:

```javascript
// ============================================================================
// PERSONA BEHAVIORAL MODES
// Sprint: persona-behaviors-v1
// ============================================================================

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
```

**Step 2:** Extract IDENTITY_PROMPT from FALLBACK_SYSTEM_PROMPT.

Create a new constant with just the core identity (the part that says "You are The Grove Terminal" etc.). This is the always-included portion.

```javascript
const IDENTITY_PROMPT = `You are The Grove Terminal—an AI guide for exploring distributed AI infrastructure. You help visitors understand The Grove's vision for an alternative to centralized AI.

Your core purpose is to facilitate meaningful exploration of ideas around AI governance, distributed systems, and community-owned infrastructure.`;
```

**Step 3:** Modify the buildSystemPrompt function:

Find `function buildSystemPrompt(options = {})` and replace/update it:

```javascript
function buildSystemPrompt(options = {}) {
  const { personaTone, personaBehaviors = {} } = options;
  
  // Apply defaults for behavioral flags
  const responseMode = personaBehaviors.responseMode ?? 'architect';
  const closingBehavior = personaBehaviors.closingBehavior ?? 'navigation';
  const useBreadcrumbs = personaBehaviors.useBreadcrumbTags !== false;
  const useTopics = personaBehaviors.useTopicTags !== false;
  const useNavBlocks = personaBehaviors.useNavigationBlocks !== false;
  
  // Build prompt parts
  const parts = [];
  
  // 1. Core identity (always)
  parts.push(IDENTITY_PROMPT);
  
  // 2. Response mode
  parts.push(RESPONSE_MODES[responseMode] || RESPONSE_MODES.architect);
  
  // 3. Closing behavior
  parts.push(CLOSING_BEHAVIORS[closingBehavior] || CLOSING_BEHAVIORS.navigation);
  
  // 4. Formatting rules (conditional)
  const formatRules = [];
  formatRules.push('- Use **bold** to highlight key concepts that invite deeper exploration');
  
  if (useNavBlocks) {
    formatRules.push('- End responses with navigation blocks: [[deep_dive:...]], [[pivot:...]], [[apply:...]]');
  }
  
  if (useBreadcrumbs || useTopics) {
    if (useBreadcrumbs) {
      formatRules.push('- Include [[BREADCRUMB: suggested follow-up]] tag');
    }
    if (useTopics) {
      formatRules.push('- Include [[TOPIC: current topic]] tag');
    }
  }
  
  if (formatRules.length > 0) {
    parts.push('\n**FORMATTING RULES:**\n' + formatRules.join('\n'));
  }
  
  // 5. Voice layer (personaTone) - appended last
  if (personaTone) {
    parts.push(`\n**ACTIVE PERSONA VOICE:**\n${personaTone}`);
  }
  
  return parts.join('\n\n');
}
```

**Step 4:** Update the /api/chat endpoint to pass behaviors.

Find where buildSystemPrompt is called (in the POST /api/chat handler). Update to include personaBehaviors:

```javascript
// In the POST /api/chat handler, extract personaBehaviors from request
const { message, sessionId, sectionContext, personaTone, personaBehaviors, verboseMode, terminatorMode, journeyId } = req.body;

// Later, when building the prompt:
const systemPrompt = buildSystemPrompt({
  personaTone,
  personaBehaviors  // ADD THIS
});
```

Also update the /api/chat/init endpoint similarly if it calls buildSystemPrompt.

**Verify:**
```bash
npm run build
npm run dev  # Start server
# Test manually in browser
```

---

## Epic 5: Verification

### Manual Test 1: Wayne Turner

1. Start the dev server: `npm run dev`
2. Open browser to localhost:5173 (or whatever port)
3. Navigate to /terminal or /explore
4. If Wayne Turner lens isn't selectable, you may need to add it to enabled personas
5. Send: "What is The Grove—and why does it matter?"

**Expected:**
- No `[[BREADCRUMB:...]]` in response
- No `[[TOPIC:...]]` in response
- No navigation blocks at end
- Response ends on a question
- Feels contemplative, not punchy

### Manual Test 2: Default Persona

1. Select Concerned Citizen lens
2. Send: "What is The Grove?"

**Expected:**
- Has `[[BREADCRUMB:...]]`
- Has `[[TOPIC:...]]`
- Has navigation blocks at end
- Behavior unchanged from before

### Manual Test 3: /explore Route

1. Navigate to /explore
2. Start a conversation
3. Verify chat works
4. Switch lenses
5. Verify behavior changes appropriately

---

## Rollback Plan

If something breaks:

```bash
git checkout -- data/narratives-schema.ts
git checkout -- data/default-personas.ts
git checkout -- services/chatService.ts
git checkout -- components/Terminal.tsx
git checkout -- server.js
```

---

## Completion Checklist

- [ ] Epic 1: Schema types added and compile
- [ ] Epic 2: Wayne Turner has behaviors field
- [ ] Epic 3: Frontend passes behaviors to server
- [ ] Epic 4: Server reads behaviors and assembles conditional prompt
- [ ] Epic 5: Wayne responds without nav blocks, ends on question
- [ ] Epic 5: Default personas unchanged
- [ ] Epic 5: /explore route works

---

## Files Modified

| File | Change |
|------|--------|
| `data/narratives-schema.ts` | Add PersonaBehaviors interface, extend Persona |
| `data/default-personas.ts` | Add behaviors to Wayne Turner |
| `services/chatService.ts` | Add personaBehaviors to ChatOptions and requests |
| `components/Terminal.tsx` | Pass behaviors alongside toneGuidance |
| `server.js` | Add RESPONSE_MODES, CLOSING_BEHAVIORS, modify buildSystemPrompt |

---

## Commit Message

```
feat: add persona behavioral flags for response structure control

- Add PersonaBehaviors interface with responseMode, closingBehavior, and tag flags
- Extend Persona interface with optional behaviors field
- Propagate behaviors through chatService to server
- Modify buildSystemPrompt() to conditionally assemble prompt based on flags
- Configure Wayne Turner with contemplative mode and question closing

Closes: persona voice not matching toneGuidance intent
Sprint: persona-behaviors-v1
```
