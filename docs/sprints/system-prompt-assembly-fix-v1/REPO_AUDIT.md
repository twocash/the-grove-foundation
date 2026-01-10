# Repository Audit: system-prompt-assembly-fix-v1

**Sprint:** system-prompt-assembly-fix-v1  
**Date:** January 10, 2026  
**Auditor:** Claude (Foundation Loop Phase 1)

---

## 1. Current State Analysis

### 1.1 The Bug Location

The system prompt assembly occurs in `server.js` with two key functions:

| Function | Lines | Purpose | Issue |
|----------|-------|---------|-------|
| `assemblePromptContent()` | ~1212-1235 | Extracts text sections from Supabase payload | **Ignores behavioral settings** |
| `buildSystemPrompt()` | ~1353-1450 | Builds final prompt with behaviors | **Only applies behaviors if frontend sends them** |
| `fetchActiveSystemPrompt()` | ~1250-1310 | Fetches from Supabase, calls assemble | Returns content without behavioral metadata |

### 1.2 The Data Flow (Current - Broken)

```
Supabase system_prompts table
  ├── payload.identity ─────────────────┐
  ├── payload.voiceGuidelines ──────────┤
  ├── payload.structureRules ───────────┼──> assemblePromptContent() ──> baseSystemPrompt (text only)
  ├── payload.knowledgeInstructions ────┤
  ├── payload.boundaries ───────────────┘
  │
  ├── payload.responseMode: 'contemplative' ──> ❌ IGNORED
  ├── payload.closingBehavior: 'open' ────────> ❌ IGNORED  
  ├── payload.useBreadcrumbTags: true ────────> ❌ IGNORED
  ├── payload.useTopicTags: true ─────────────> ❌ IGNORED
  └── payload.useNavigationBlocks: true ──────> ❌ IGNORED

Frontend Request (req.body)
  └── personaBehaviors: {} ──> hasCustomBehaviors = false ──> Uses baseSystemPrompt WITHOUT closing instruction
```

### 1.3 Key Code Excerpts

**assemblePromptContent() - server.js ~1212:**
```javascript
function assemblePromptContent(payload) {
  const sections = [];
  if (payload.identity) sections.push(`## Identity\n${payload.identity}`);
  if (payload.voiceGuidelines) sections.push(`## Voice Guidelines\n${payload.voiceGuidelines}`);
  if (payload.structureRules) sections.push(`## Structure Rules\n${payload.structureRules}`);
  if (payload.knowledgeInstructions) sections.push(`## Knowledge Instructions\n${payload.knowledgeInstructions}`);
  if (payload.boundaries) sections.push(`## Boundaries\n${payload.boundaries}`);
  return sections.join('\n\n');
  // ❌ No extraction of responseMode, closingBehavior, or tag booleans
}
```

**buildSystemPrompt() condition - server.js ~1375:**
```javascript
const hasCustomBehaviors = Object.keys(personaBehaviors).length > 0;
// ...
if (hasCustomBehaviors) {
  parts.push(IDENTITY_PROMPT);
  parts.push('\n\n' + (RESPONSE_MODES[responseMode] || RESPONSE_MODES.architect));
  parts.push('\n\n' + (CLOSING_BEHAVIORS[closingBehavior] || CLOSING_BEHAVIORS.navigation));
} else {
  // ❌ Uses baseSystemPrompt WITHOUT closing behavior instruction
  parts.push(baseSystemPrompt);
}
```

### 1.4 Affected Routes

| Route | Uses buildSystemPrompt? | personaBehaviors Source | Impact |
|-------|------------------------|-------------------------|--------|
| `/api/chat` | ✅ Yes (~1847) | `req.body.personaBehaviors` | **AFFECTED** - No lens = broken closing |
| `/api/chat/init` | ✅ Yes (~2019) | `req.body.personaBehaviors` | **AFFECTED** - No lens = broken closing |
| `/terminal/*` (legacy) | Via above | Lens getPersona().behaviors | **UNAFFECTED** - Lens provides behaviors |
| `/explore/*` (Bedrock) | Via above | Currently empty `{}` | **AFFECTED** - Primary bug location |

### 1.5 Supabase Schema

The `system_prompts` table stores:
```sql
payload JSONB {
  identity: string,
  voiceGuidelines: string,
  structureRules: string,
  knowledgeInstructions: string,
  boundaries: string,
  responseMode: 'architect' | 'librarian' | 'contemplative',
  closingBehavior: 'navigation' | 'question' | 'open',  -- THIS IS 'open'
  useBreadcrumbTags: boolean,
  useTopicTags: boolean,
  useNavigationBlocks: boolean,
  version: number,
  changelog: string
}
```

Current active prompt: "Grove Narrator System Prompt v2.0" with `closingBehavior: 'open'`

---

## 2. Related Files

| File | Relevance | Notes |
|------|-----------|-------|
| `server.js` | **PRIMARY** | Contains both functions needing fix |
| `src/core/schema/system-prompt.ts` | Reference | TypeScript schema definition (client-side) |
| `experiences-console-spec-v1.1.md` | **SPEC** | Documents the intended architecture |
| `src/surface/components/KineticStream/hooks/useKineticChat.ts` | Frontend | Sends personaBehaviors (currently empty when no lens) |

---

## 3. The Spec vs. Implementation Gap

### 3.1 What the Spec Says (experiences-console-spec-v1.1.md)

```typescript
// From spec section 6.2
async function buildSystemPrompt(options) {
  // ...fetch systemConfig...
  
  if (systemConfig) {
    const modeDescriptions = {
      architect: 'Structure responses with clear frameworks...',
      librarian: 'Emphasize references...',
      contemplative: 'Take a reflective, exploratory approach...',
    };
    
    const closingDescriptions = {
      navigation: 'End with suggested paths forward.',
      question: 'End with a thought-provoking question.',
      open: 'End naturally without explicit prompts.',
    };

    prompt += `\n\n## Behavioral Mode\n${modeDescriptions[systemConfig.responseMode]}`;
    prompt += `\n\n## Closing Style\n${closingDescriptions[systemConfig.closingBehavior]}`;
  }
}
```

### 3.2 What the Implementation Does

Current implementation ONLY applies behavioral modes when `personaBehaviors` comes from the frontend (lens selection). It completely ignores the Supabase-stored behavioral settings.

---

## 4. Technical Debt Identified

1. **Divergence from Spec**: `buildSystemPrompt()` doesn't match `experiences-console-spec-v1.1.md` Section 6.2
2. **Two Sources of Truth**: Behavioral settings stored in Supabase but sourced from frontend
3. **Missing Return Value**: `fetchActiveSystemPrompt()` only returns content string, loses behavioral metadata
4. **Tight Coupling**: Lens-based behaviors and Supabase-based defaults use different code paths

---

## 5. Constraints for This Sprint

### 5.1 Strangler Fig Boundaries

| What | Allowed? | Reason |
|------|----------|--------|
| Modify `server.js` | ✅ Yes | Server-side fix, no legacy coupling |
| Modify `fetchActiveSystemPrompt()` return value | ✅ Yes | Clean change |
| Modify `buildSystemPrompt()` logic | ✅ Yes | Clean change |
| Modify Terminal route behavior | ❌ NO | Legacy route must remain unchanged |
| Modify KineticStream frontend | ⚠️ Optional | Not required for fix |

### 5.2 Behavioral Preservation

The fix MUST preserve:
- Terminal route continues working with lens-based personaBehaviors
- Lens overlays still take precedence when active
- Legacy GCS fallback path unchanged
- Existing test coverage passes

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking Terminal route | Low | High | Lens-based behaviors still override |
| Breaking GCS fallback | Low | Medium | No changes to that code path |
| Missing behavioral settings in Supabase | Low | Medium | Defaults handle gracefully |
| Regression in closing behavior | Medium | Medium | Manual test before/after |

---

## 7. Recommended Fix Approach

**Option 2: Server-Side (DEX-Compliant)**

Modify `fetchActiveSystemPrompt()` to return both content AND behavioral metadata:

```javascript
// Return structure
{
  content: assembledTextContent,
  responseMode: payload.responseMode || 'architect',
  closingBehavior: payload.closingBehavior || 'navigation',
  useBreadcrumbTags: payload.useBreadcrumbTags ?? true,
  useTopicTags: payload.useTopicTags ?? true,
  useNavigationBlocks: payload.useNavigationBlocks ?? true
}
```

Then modify `buildSystemPrompt()` to use these as defaults, with frontend `personaBehaviors` overlaying them.

**Why this approach:**
1. **Declarative Sovereignty**: Behavior defined in Supabase config, not hardcoded
2. **Strangler Fig**: Fix isolated to server.js, no Terminal changes
3. **Backward Compatible**: Lens-based behaviors still override Supabase defaults
4. **Provenance**: Settings traceable to system_prompts table

---

*Audit complete. Ready for SPEC.md.*
