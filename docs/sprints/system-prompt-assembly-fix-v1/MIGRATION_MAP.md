# Migration Map: system-prompt-assembly-fix-v1

**Sprint:** system-prompt-assembly-fix-v1  
**Date:** January 10, 2026

---

## Files to Modify

| File | Change Type | Lines Affected | Risk |
|------|-------------|----------------|------|
| `server.js` | MODIFY | ~1200-1250, ~1350-1450, ~1840-1860, ~2015-2030 | Medium |

**Total files:** 1

---

## Change 1: Update Cache Structure

**File:** `server.js`  
**Location:** Lines ~1200-1206

### Before

```javascript
let systemPromptCache = {
  content: null,
  source: null,
  fetchedAt: null
};
```

### After

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

---

## Change 2: Add Default Behaviors Constant

**File:** `server.js`  
**Location:** After cache declaration (~line 1208)

### Add

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

---

## Change 3: Update fetchActiveSystemPrompt() Return

**File:** `server.js`  
**Location:** Lines ~1250-1310

### Before (Supabase success path, ~line 1270)

```javascript
if (!error && data?.payload) {
  const content = assemblePromptContent(data.payload);
  systemPromptCache = { content, source: 'supabase', fetchedAt: now };
  console.log(`[SystemPrompt] Loaded from Supabase: "${data.title}"`);
  return content;
}
```

### After

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

### Before (GCS legacy path, ~line 1295)

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

### After

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

### Before (Fallback path, ~line 1305)

```javascript
console.log('[SystemPrompt] Using fallback prompt');
systemPromptCache = {
  content: FALLBACK_SYSTEM_PROMPT,
  source: 'fallback',
  fetchedAt: now
};
return FALLBACK_SYSTEM_PROMPT;
```

### After

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

### Before (Cache hit path, ~line 1255)

```javascript
if (systemPromptCache.content &&
    (now - systemPromptCache.fetchedAt) < SYSTEM_PROMPT_CACHE_TTL_MS) {
  console.log(`[SystemPrompt] Using cached prompt (source: ${systemPromptCache.source})`);
  return systemPromptCache.content;
}
```

### After

```javascript
if (systemPromptCache.content &&
    (now - systemPromptCache.fetchedAt) < SYSTEM_PROMPT_CACHE_TTL_MS) {
  console.log(`[SystemPrompt] Using cached prompt (source: ${systemPromptCache.source})`);
  return systemPromptCache;  // Return full config, not just content
}
```

---

## Change 4: Update buildSystemPrompt() Signature and Logic

**File:** `server.js`  
**Location:** Lines ~1353-1450

### Before (~line 1353)

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

    // Apply defaults for behavioral flags
    const responseMode = personaBehaviors.responseMode ?? 'architect';
    const closingBehavior = personaBehaviors.closingBehavior ?? 'navigation';
    const useBreadcrumbs = personaBehaviors.useBreadcrumbTags !== false;
    const useTopics = personaBehaviors.useTopicTags !== false;
    const useNavBlocks = personaBehaviors.useNavigationBlocks !== false;
```

### After

```javascript
function buildSystemPrompt(options = {}) {
    const {
        systemConfig = null,  // NEW: Full config from fetchActiveSystemPrompt()
        personaTone = '',
        personaBehaviors = {},
        sectionContext = '',
        ragContext = '',
        terminatorMode = false
    } = options;

    // Resolve behaviors: Supabase config as defaults, frontend personaBehaviors as overrides
    const configDefaults = systemConfig || DEFAULT_SYSTEM_PROMPT_BEHAVIORS;
    const responseMode = personaBehaviors.responseMode ?? configDefaults.responseMode;
    const closingBehavior = personaBehaviors.closingBehavior ?? configDefaults.closingBehavior;
    const useBreadcrumbs = personaBehaviors.useBreadcrumbTags ?? configDefaults.useBreadcrumbTags;
    const useTopics = personaBehaviors.useTopicTags ?? configDefaults.useTopicTags;
    const useNavBlocks = personaBehaviors.useNavigationBlocks ?? configDefaults.useNavigationBlocks;
```

### Before (~line 1377-1390)

```javascript
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

### After

```javascript
    const parts = [];

    // 1. Base content from system config or fallback
    const baseContent = systemConfig?.content || FALLBACK_SYSTEM_PROMPT;
    parts.push(baseContent);

    // 2. Response mode - ALWAYS apply (with resolved value from config or override)
    parts.push('\n\n' + (RESPONSE_MODES[responseMode] || RESPONSE_MODES.architect));

    // 3. Closing behavior - ALWAYS apply (with resolved value from config or override)
    parts.push('\n\n' + (CLOSING_BEHAVIORS[closingBehavior] || CLOSING_BEHAVIORS.navigation));
```

---

## Change 5: Update /api/chat Endpoint Call Site

**File:** `server.js`  
**Location:** Lines ~1842-1855

### Before

```javascript
[ragResult, baseSystemPrompt] = await Promise.all([
  fetchRagContext(message, narratives, journeyId),
  fetchActiveSystemPrompt()
]);
// ...
const systemPrompt = buildSystemPrompt({
  baseSystemPrompt,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext: ragResult,
  terminatorMode
});
```

### After

```javascript
[ragResult, systemConfig] = await Promise.all([
  fetchRagContext(message, narratives, journeyId),
  fetchActiveSystemPrompt()
]);
// ...
const systemPrompt = buildSystemPrompt({
  systemConfig,
  personaTone,
  personaBehaviors,
  sectionContext,
  ragContext: ragResult,
  terminatorMode
});
```

---

## Change 6: Update /api/chat/init Endpoint Call Site

**File:** `server.js`  
**Location:** Lines ~2015-2025

### Before

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

### After

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

---

## Verification Commands

```bash
# Build check
npm run build

# Start dev server
npm run dev

# Manual test: /explore route - should end naturally (no questions)
# Manual test: /terminal with lens - lens behaviors should apply
# Manual test: /terminal without lens - Supabase defaults should apply
```

---

## Rollback Plan

If issues arise:
1. Revert `server.js` to previous commit
2. Clear server cache by restarting
3. Verify Terminal still functions

**Risk level:** Low - single file change, all changes are additive

---

*Migration map approved for DECISIONS.md phase.*
