# Execution Prompt: system-prompt-assembly-fix-v1

**Sprint:** system-prompt-assembly-fix-v1  
**Date:** January 10, 2026  
**Executor:** Claude Code CLI

---

## Context

You are fixing a bug where the `/explore` route's system prompt ignores the `closingBehavior: 'open'` setting from Supabase. The LLM ends responses with questions even though it shouldn't.

**Root cause:** `fetchActiveSystemPrompt()` returns only text content. `buildSystemPrompt()` only applies closing behavior when frontend sends `personaBehaviors`. When no lens is active, `personaBehaviors = {}`, so no closing instruction is applied.

**Solution:** Return full config object from `fetchActiveSystemPrompt()` including behavioral settings. Use these as defaults in `buildSystemPrompt()`, with frontend `personaBehaviors` as overrides.

---

## Project Location

```
C:\GitHub\the-grove-foundation
```

---

## Files to Modify

**Single file:** `server.js`

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean or on appropriate branch
npm run build  # Should pass before starting
```

---

## Implementation Steps

### Step 1: Add Default Behaviors Constant (~line 1208)

After the `systemPromptCache` declaration, add:

```javascript
// Default behavioral settings (used when Supabase/GCS don't provide them)
const DEFAULT_SYSTEM_PROMPT_BEHAVIORS = {
  responseMode: 'architect',
  closingBehavior: 'navigation',
  useBreadcrumbTags: true,
  useTopicTags: true,
  useNavigationBlocks: true
};
```

### Step 2: Expand Cache Structure (~line 1200)

Change:
```javascript
let systemPromptCache = {
  content: null,
  source: null,
  fetchedAt: null
};
```

To:
```javascript
let systemPromptCache = {
  content: null,
  responseMode: null,
  closingBehavior: null,
  useBreadcrumbTags: null,
  useTopicTags: null,
  useNavigationBlocks: null,
  source: null,
  fetchedAt: null
};
```

### Step 3: Update fetchActiveSystemPrompt() Cache Hit Path (~line 1255)

Change:
```javascript
return systemPromptCache.content;
```

To:
```javascript
return systemPromptCache;
```

### Step 4: Update fetchActiveSystemPrompt() Supabase Success Path (~line 1270)

Change:
```javascript
if (!error && data?.payload) {
  const content = assemblePromptContent(data.payload);
  systemPromptCache = { content, source: 'supabase', fetchedAt: now };
  console.log(`[SystemPrompt] Loaded from Supabase: "${data.title}"`);
  return content;
}
```

To:
```javascript
if (!error && data?.payload) {
  const content = assemblePromptContent(data.payload);
  const config = {
    content,
    responseMode: data.payload.responseMode || DEFAULT_SYSTEM_PROMPT_BEHAVIORS.responseMode,
    closingBehavior: data.payload.closingBehavior || DEFAULT_SYSTEM_PROMPT_BEHAVIORS.closingBehavior,
    useBreadcrumbTags: data.payload.useBreadcrumbTags ?? DEFAULT_SYSTEM_PROMPT_BEHAVIORS.useBreadcrumbTags,
    useTopicTags: data.payload.useTopicTags ?? DEFAULT_SYSTEM_PROMPT_BEHAVIORS.useTopicTags,
    useNavigationBlocks: data.payload.useNavigationBlocks ?? DEFAULT_SYSTEM_PROMPT_BEHAVIORS.useNavigationBlocks,
    source: 'supabase',
    fetchedAt: now
  };
  systemPromptCache = config;
  console.log(`[SystemPrompt] Loaded from Supabase: "${data.title}" (closingBehavior: ${config.closingBehavior})`);
  return config;
}
```

### Step 5: Update fetchActiveSystemPrompt() GCS Legacy Path (~line 1295)

Change:
```javascript
if (activeVersion?.content) {
  systemPromptCache = {
    content: activeVersion.content,
    source: 'gcs-legacy',
    fetchedAt: now
  };
  console.log(`[SystemPrompt] Loaded from GCS legacy: "${activeVersion.label}"`);
  return activeVersion.content;
}
```

To:
```javascript
if (activeVersion?.content) {
  const config = {
    content: activeVersion.content,
    ...DEFAULT_SYSTEM_PROMPT_BEHAVIORS,
    source: 'gcs-legacy',
    fetchedAt: now
  };
  systemPromptCache = config;
  console.log(`[SystemPrompt] Loaded from GCS legacy: "${activeVersion.label}"`);
  return config;
}
```

### Step 6: Update fetchActiveSystemPrompt() Fallback Path (~line 1305)

Change:
```javascript
console.log('[SystemPrompt] Using fallback prompt');
systemPromptCache = {
  content: FALLBACK_SYSTEM_PROMPT,
  source: 'fallback',
  fetchedAt: now
};
return FALLBACK_SYSTEM_PROMPT;
```

To:
```javascript
console.log('[SystemPrompt] Using fallback prompt');
const config = {
  content: FALLBACK_SYSTEM_PROMPT,
  ...DEFAULT_SYSTEM_PROMPT_BEHAVIORS,
  source: 'fallback',
  fetchedAt: now
};
systemPromptCache = config;
return config;
```

### Step 7: Update buildSystemPrompt() Signature (~line 1353)

Change:
```javascript
function buildSystemPrompt(options = {}) {
    const {
        baseSystemPrompt = FALLBACK_SYSTEM_PROMPT,
        personaTone = '',
        personaBehaviors = {},
        sectionContext = '',
        ragContext = '',
        terminatorMode = false
    } = options;
```

To:
```javascript
function buildSystemPrompt(options = {}) {
    const {
        systemConfig = null,
        personaTone = '',
        personaBehaviors = {},
        sectionContext = '',
        ragContext = '',
        terminatorMode = false
    } = options;
```

### Step 8: Update buildSystemPrompt() Behavior Resolution (~line 1360)

Change:
```javascript
    // Apply defaults for behavioral flags
    const responseMode = personaBehaviors.responseMode ?? 'architect';
    const closingBehavior = personaBehaviors.closingBehavior ?? 'navigation';
    const useBreadcrumbs = personaBehaviors.useBreadcrumbTags !== false;
    const useTopics = personaBehaviors.useTopicTags !== false;
    const useNavBlocks = personaBehaviors.useNavigationBlocks !== false;
```

To:
```javascript
    // Resolve behaviors: systemConfig as defaults, personaBehaviors as overrides
    const configDefaults = systemConfig || DEFAULT_SYSTEM_PROMPT_BEHAVIORS;
    const responseMode = personaBehaviors.responseMode ?? configDefaults.responseMode;
    const closingBehavior = personaBehaviors.closingBehavior ?? configDefaults.closingBehavior;
    const useBreadcrumbs = personaBehaviors.useBreadcrumbTags ?? configDefaults.useBreadcrumbTags;
    const useTopics = personaBehaviors.useTopicTags ?? configDefaults.useTopicTags;
    const useNavBlocks = personaBehaviors.useNavigationBlocks ?? configDefaults.useNavigationBlocks;
```

### Step 9: Update buildSystemPrompt() Content Assembly (~line 1374)

Find and replace the conditional block:
```javascript
    // Check if we have persona-specific behaviors (vs default fallback)
    const hasCustomBehaviors = Object.keys(personaBehaviors).length > 0;

    const parts = [];

    // 1. Base prompt - use IDENTITY_PROMPT for personas with custom behaviors
    if (hasCustomBehaviors) {
        parts.push(IDENTITY_PROMPT);

        // 2. Response mode
        parts.push('\n\n' + (RESPONSE_MODES[responseMode] || RESPONSE_MODES.architect));

        // 3. Closing behavior
        parts.push('\n\n' + (CLOSING_BEHAVIORS[closingBehavior] || CLOSING_BEHAVIORS.navigation));
    } else {
        // Use full fallback prompt for default personas
        parts.push(baseSystemPrompt);
    }
```

With:
```javascript
    const parts = [];

    // 1. Base content from system config or fallback
    const baseContent = systemConfig?.content || FALLBACK_SYSTEM_PROMPT;
    parts.push(baseContent);

    // 2. Response mode - ALWAYS apply
    parts.push('\n\n' + (RESPONSE_MODES[responseMode] || RESPONSE_MODES.architect));

    // 3. Closing behavior - ALWAYS apply
    parts.push('\n\n' + (CLOSING_BEHAVIORS[closingBehavior] || CLOSING_BEHAVIORS.navigation));
```

### Step 10: Update /api/chat Call Site (~line 1842)

Find:
```javascript
[ragResult, baseSystemPrompt] = await Promise.all([
  fetchRagContext(message, narratives, journeyId),
  fetchActiveSystemPrompt()
]);
```

Change `baseSystemPrompt` to `systemConfig`.

Then find (a few lines later):
```javascript
const systemPrompt = buildSystemPrompt({
  baseSystemPrompt,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext: ragResult,
  terminatorMode
});
```

Change to:
```javascript
const systemPrompt = buildSystemPrompt({
  systemConfig,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext: ragResult,
  terminatorMode
});
```

### Step 11: Update /api/chat/init Call Site (~line 2015)

Find:
```javascript
const [ragContext, baseSystemPrompt] = await Promise.all([
  fetchRagContext('', narratives, journeyId),
  fetchActiveSystemPrompt()
]);
```

Change `baseSystemPrompt` to `systemConfig`.

Then find:
```javascript
const systemPrompt = buildSystemPrompt({
  baseSystemPrompt,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext,
  terminatorMode
});
```

Change to:
```javascript
const systemPrompt = buildSystemPrompt({
  systemConfig,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext,
  terminatorMode
});
```

---

## Post-Execution Verification

```bash
# Build must pass
npm run build

# Start dev server
npm run dev

# Check server logs for:
# "[SystemPrompt] Loaded from Supabase: "Grove Narrator System Prompt v2.0" (closingBehavior: open)"
```

---

## Manual Testing

1. **Test /explore route:**
   - Navigate to `/explore`
   - Send a message
   - Verify response ends naturally WITHOUT a question
   - Expected: Response should NOT end with "What aspects..." or similar

2. **Test /terminal with lens:**
   - Navigate to `/terminal`
   - Select a lens
   - Send a message
   - Verify lens-specific behaviors apply (lens should override Supabase defaults)

3. **Test /terminal without lens:**
   - Navigate to `/terminal`
   - Clear any active lens
   - Send a message
   - Verify Supabase defaults apply

---

## Troubleshooting

**If build fails:**
- Check for syntax errors in the changes
- Ensure all variable renames are consistent (`baseSystemPrompt` → `systemConfig`)

**If closingBehavior still not applied:**
- Check server logs for the `closingBehavior` value being logged
- Verify Supabase `system_prompts` table has `closingBehavior: 'open'` in payload

**If Terminal breaks:**
- Lens-based `personaBehaviors` should still override via nullish coalescing
- Check that `personaBehaviors` is being passed correctly from frontend

---

## Commit Sequence

```bash
git add server.js
git commit -m "fix: apply Supabase behavioral settings to system prompt

- Return full SystemPromptConfig from fetchActiveSystemPrompt()
- Use Supabase settings as defaults in buildSystemPrompt()
- Frontend personaBehaviors can still override
- Always apply RESPONSE_MODES and CLOSING_BEHAVIORS instructions

Fixes: /explore route ignoring closingBehavior: 'open'"
```

---

## Success Criteria

- [ ] `npm run build` passes
- [ ] Server logs show `closingBehavior: open` on startup
- [ ] `/explore` responses end naturally (no trailing questions)
- [ ] `/terminal` with lens still uses lens behaviors
- [ ] No regressions in existing functionality

---

## Reference Files

- Sprint artifacts: `C:\GitHub\the-grove-foundation\docs\sprints\system-prompt-assembly-fix-v1\`
- Spec reference: `C:\GitHub\the-grove-foundation\docs\specs\experiences-console-spec-v1.1.md`

---

*Execution prompt ready for Claude Code handoff.*
