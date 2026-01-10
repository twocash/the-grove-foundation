# Sprints: system-prompt-assembly-fix-v1

**Sprint:** system-prompt-assembly-fix-v1  
**Date:** January 10, 2026

---

## Epic 1: Expand System Prompt Config Structure

### Story 1.1: Add Default Behaviors Constant

**Task:** Add `DEFAULT_SYSTEM_PROMPT_BEHAVIORS` constant after cache declaration.

**File:** `server.js` (~line 1208)

**Code:**
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

**Tests:**
- [ ] Build passes: `npm run build`

**Commit:** `feat: add DEFAULT_SYSTEM_PROMPT_BEHAVIORS constant`

---

### Story 1.2: Expand Cache Structure

**Task:** Update `systemPromptCache` to include behavioral fields.

**File:** `server.js` (~line 1200)

**Before:**
```javascript
let systemPromptCache = {
  content: null,
  source: null,
  fetchedAt: null
};
```

**After:**
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

**Tests:**
- [ ] Build passes: `npm run build`

**Commit:** `refactor: expand systemPromptCache to include behavioral fields`

---

## Epic 2: Update fetchActiveSystemPrompt() Return Type

### Story 2.1: Update Supabase Success Path

**Task:** Return full config object instead of content string.

**File:** `server.js` (~line 1270)

**Before:**
```javascript
if (!error && data?.payload) {
  const content = assemblePromptContent(data.payload);
  systemPromptCache = { content, source: 'supabase', fetchedAt: now };
  console.log(`[SystemPrompt] Loaded from Supabase: "${data.title}"`);
  return content;
}
```

**After:**
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

**Tests:**
- [ ] Console log shows `closingBehavior: open` when server starts

**Commit:** `feat: return full config from fetchActiveSystemPrompt Supabase path`

---

### Story 2.2: Update GCS Legacy Path

**Task:** Return config object with default behaviors.

**File:** `server.js` (~line 1295)

**Before:**
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

**After:**
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

**Commit:** `feat: return full config from fetchActiveSystemPrompt GCS path`

---

### Story 2.3: Update Fallback Path

**Task:** Return config object with default behaviors.

**File:** `server.js` (~line 1305)

**Before:**
```javascript
console.log('[SystemPrompt] Using fallback prompt');
systemPromptCache = {
  content: FALLBACK_SYSTEM_PROMPT,
  source: 'fallback',
  fetchedAt: now
};
return FALLBACK_SYSTEM_PROMPT;
```

**After:**
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

**Commit:** `feat: return full config from fetchActiveSystemPrompt fallback path`

---

### Story 2.4: Update Cache Hit Path

**Task:** Return full cached config, not just content.

**File:** `server.js` (~line 1255)

**Before:**
```javascript
if (systemPromptCache.content &&
    (now - systemPromptCache.fetchedAt) < SYSTEM_PROMPT_CACHE_TTL_MS) {
  console.log(`[SystemPrompt] Using cached prompt (source: ${systemPromptCache.source})`);
  return systemPromptCache.content;
}
```

**After:**
```javascript
if (systemPromptCache.content &&
    (now - systemPromptCache.fetchedAt) < SYSTEM_PROMPT_CACHE_TTL_MS) {
  console.log(`[SystemPrompt] Using cached prompt (source: ${systemPromptCache.source})`);
  return systemPromptCache;
}
```

**Commit:** `fix: return full config from cache hit path`

---

## Epic 3: Update buildSystemPrompt() Logic

### Story 3.1: Update Function Signature

**Task:** Accept `systemConfig` instead of `baseSystemPrompt`.

**File:** `server.js` (~line 1353)

**Before:**
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

**After:**
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

**Commit:** `refactor: update buildSystemPrompt signature to accept systemConfig`

---

### Story 3.2: Update Behavior Resolution Logic

**Task:** Use systemConfig as defaults, personaBehaviors as overrides.

**File:** `server.js` (~line 1360)

**Before:**
```javascript
    const responseMode = personaBehaviors.responseMode ?? 'architect';
    const closingBehavior = personaBehaviors.closingBehavior ?? 'navigation';
    const useBreadcrumbs = personaBehaviors.useBreadcrumbTags !== false;
    const useTopics = personaBehaviors.useTopicTags !== false;
    const useNavBlocks = personaBehaviors.useNavigationBlocks !== false;
```

**After:**
```javascript
    const configDefaults = systemConfig || DEFAULT_SYSTEM_PROMPT_BEHAVIORS;
    const responseMode = personaBehaviors.responseMode ?? configDefaults.responseMode;
    const closingBehavior = personaBehaviors.closingBehavior ?? configDefaults.closingBehavior;
    const useBreadcrumbs = personaBehaviors.useBreadcrumbTags ?? configDefaults.useBreadcrumbTags;
    const useTopics = personaBehaviors.useTopicTags ?? configDefaults.useTopicTags;
    const useNavBlocks = personaBehaviors.useNavigationBlocks ?? configDefaults.useNavigationBlocks;
```

**Commit:** `feat: resolve behaviors from systemConfig with personaBehaviors override`

---

### Story 3.3: Always Apply Behavioral Instructions

**Task:** Remove conditional, always apply response mode and closing behavior.

**File:** `server.js` (~line 1377)

**Before:**
```javascript
    const hasCustomBehaviors = Object.keys(personaBehaviors).length > 0;

    const parts = [];

    if (hasCustomBehaviors) {
        parts.push(IDENTITY_PROMPT);
        parts.push('\n\n' + (RESPONSE_MODES[responseMode] || RESPONSE_MODES.architect));
        parts.push('\n\n' + (CLOSING_BEHAVIORS[closingBehavior] || CLOSING_BEHAVIORS.navigation));
    } else {
        parts.push(baseSystemPrompt);
    }
```

**After:**
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

**Commit:** `fix: always apply behavioral instructions to system prompt`

---

## Epic 4: Update Call Sites

### Story 4.1: Update /api/chat Endpoint

**Task:** Pass systemConfig to buildSystemPrompt.

**File:** `server.js` (~line 1842)

**Before:**
```javascript
[ragResult, baseSystemPrompt] = await Promise.all([
  fetchRagContext(message, narratives, journeyId),
  fetchActiveSystemPrompt()
]);
// ... later ...
const systemPrompt = buildSystemPrompt({
  baseSystemPrompt,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext: ragResult,
  terminatorMode
});
```

**After:**
```javascript
[ragResult, systemConfig] = await Promise.all([
  fetchRagContext(message, narratives, journeyId),
  fetchActiveSystemPrompt()
]);
// ... later ...
const systemPrompt = buildSystemPrompt({
  systemConfig,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext: ragResult,
  terminatorMode
});
```

**Commit:** `fix: pass systemConfig to buildSystemPrompt in /api/chat`

---

### Story 4.2: Update /api/chat/init Endpoint

**Task:** Pass systemConfig to buildSystemPrompt.

**File:** `server.js` (~line 2015)

**Before:**
```javascript
const [ragContext, baseSystemPrompt] = await Promise.all([
  fetchRagContext('', narratives, journeyId),
  fetchActiveSystemPrompt()
]);
const systemPrompt = buildSystemPrompt({
  baseSystemPrompt,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext,
  terminatorMode
});
```

**After:**
```javascript
const [ragContext, systemConfig] = await Promise.all([
  fetchRagContext('', narratives, journeyId),
  fetchActiveSystemPrompt()
]);
const systemPrompt = buildSystemPrompt({
  systemConfig,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext,
  terminatorMode
});
```

**Commit:** `fix: pass systemConfig to buildSystemPrompt in /api/chat/init`

---

## Build Gate

After all stories complete:

```bash
# Build check
npm run build

# Start server and verify logs
npm run dev
# Expected: "[SystemPrompt] Loaded from Supabase: "Grove Narrator System Prompt v2.0" (closingBehavior: open)"

# Manual test: /explore route
# Expected: Responses end naturally without questions

# Manual test: /terminal with lens
# Expected: Lens behaviors override Supabase defaults
```

---

## Summary

| Epic | Stories | Commits |
|------|---------|---------|
| 1. Expand Config Structure | 2 | 2 |
| 2. Update fetchActiveSystemPrompt | 4 | 4 |
| 3. Update buildSystemPrompt | 3 | 3 |
| 4. Update Call Sites | 2 | 2 |
| **Total** | **11** | **11** |

**Estimated time:** 1-2 hours

---

*Stories ready for EXECUTION_PROMPT.md phase.*
