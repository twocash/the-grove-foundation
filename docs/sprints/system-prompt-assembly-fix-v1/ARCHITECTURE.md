# Architecture: system-prompt-assembly-fix-v1

**Sprint:** system-prompt-assembly-fix-v1  
**Date:** January 10, 2026

---

## Current Architecture (Broken)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER.JS SYSTEM PROMPT FLOW                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Supabase                    assemblePromptContent()                 │
│  ┌────────────────────┐      ┌────────────────────┐                 │
│  │ system_prompts     │      │ Extracts ONLY:     │                 │
│  │ ├── identity       │─────►│ - identity         │─► string        │
│  │ ├── voiceGuidelines│      │ - voiceGuidelines  │                 │
│  │ ├── structureRules │      │ - structureRules   │                 │
│  │ ├── boundaries     │      │ - boundaries       │                 │
│  │ │                  │      │                    │                 │
│  │ ├── responseMode   │──X── │ ❌ IGNORED         │                 │
│  │ ├── closingBehavior│──X── │ ❌ IGNORED         │                 │
│  │ └── useBreadcrumb* │──X── │ ❌ IGNORED         │                 │
│  └────────────────────┘      └────────────────────┘                 │
│                                                                      │
│  fetchActiveSystemPrompt()                                           │
│  ┌────────────────────┐                                             │
│  │ Returns: string    │──────────────► baseSystemPrompt (text only) │
│  └────────────────────┘                                             │
│                                                                      │
│  buildSystemPrompt()                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ IF personaBehaviors from frontend has keys:                     │ │
│  │    ├── Use IDENTITY_PROMPT                                      │ │
│  │    ├── Apply RESPONSE_MODES[responseMode]                       │ │
│  │    └── Apply CLOSING_BEHAVIORS[closingBehavior]                 │ │
│  │ ELSE:                                                           │ │
│  │    └── Use baseSystemPrompt directly ❌ NO CLOSING INSTRUCTION  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Target Architecture (Fixed)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER.JS SYSTEM PROMPT FLOW                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Supabase                    fetchActiveSystemPrompt()               │
│  ┌────────────────────┐      ┌────────────────────────────────────┐ │
│  │ system_prompts     │      │ Returns: SystemPromptConfig        │ │
│  │ ├── identity       │      │ {                                  │ │
│  │ ├── voiceGuidelines│─────►│   content: string,                 │ │
│  │ ├── structureRules │      │   responseMode: 'contemplative',   │ │
│  │ ├── boundaries     │      │   closingBehavior: 'open',         │ │
│  │ ├── responseMode   │─────►│   useBreadcrumbTags: true,         │ │
│  │ ├── closingBehavior│─────►│   useTopicTags: true,              │ │
│  │ └── useBreadcrumb* │─────►│   useNavigationBlocks: true        │ │
│  └────────────────────┘      │ }                                  │ │
│                              └────────────────────────────────────┘ │
│                                           │                          │
│                                           ▼                          │
│  buildSystemPrompt()                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Defaults from systemConfig (Supabase):                          │ │
│  │    ├── responseMode: systemConfig.responseMode                  │ │
│  │    └── closingBehavior: systemConfig.closingBehavior            │ │
│  │                                                                 │ │
│  │ Overrides from personaBehaviors (frontend):                     │ │
│  │    ├── responseMode: personaBehaviors.responseMode ?? default   │ │
│  │    └── closingBehavior: personaBehaviors.closingBehavior ?? def │ │
│  │                                                                 │ │
│  │ ALWAYS applies:                                                 │ │
│  │    ├── RESPONSE_MODES[resolvedMode]                             │ │
│  │    └── CLOSING_BEHAVIORS[resolvedClosing]                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interface Definitions

### SystemPromptConfig (New Return Type)

```typescript
interface SystemPromptConfig {
  // Assembled text content
  content: string;
  
  // Behavioral settings (from Supabase)
  responseMode: 'architect' | 'librarian' | 'contemplative';
  closingBehavior: 'navigation' | 'question' | 'open';
  useBreadcrumbTags: boolean;
  useTopicTags: boolean;
  useNavigationBlocks: boolean;
  
  // Provenance
  source: 'supabase' | 'gcs-legacy' | 'fallback';
}
```

### Default Values

```javascript
const DEFAULT_BEHAVIORS = {
  responseMode: 'architect',
  closingBehavior: 'navigation',
  useBreadcrumbTags: true,
  useTopicTags: true,
  useNavigationBlocks: true
};
```

---

## Function Changes

### fetchActiveSystemPrompt() - Before

```javascript
async function fetchActiveSystemPrompt() {
  // ... fetch logic ...
  const content = assemblePromptContent(data.payload);
  systemPromptCache = { content, source: 'supabase', fetchedAt: now };
  return content;  // Returns string only
}
```

### fetchActiveSystemPrompt() - After

```javascript
async function fetchActiveSystemPrompt() {
  // ... fetch logic ...
  const content = assemblePromptContent(data.payload);
  const config = {
    content,
    responseMode: data.payload.responseMode || 'architect',
    closingBehavior: data.payload.closingBehavior || 'navigation',
    useBreadcrumbTags: data.payload.useBreadcrumbTags ?? true,
    useTopicTags: data.payload.useTopicTags ?? true,
    useNavigationBlocks: data.payload.useNavigationBlocks ?? true,
    source: 'supabase'
  };
  systemPromptCache = { ...config, fetchedAt: now };
  return config;  // Returns SystemPromptConfig
}
```

### buildSystemPrompt() - Before

```javascript
function buildSystemPrompt(options = {}) {
  const {
    baseSystemPrompt = FALLBACK_SYSTEM_PROMPT,
    personaTone = '',
    personaBehaviors = {},
    // ...
  } = options;

  const responseMode = personaBehaviors.responseMode ?? 'architect';
  const closingBehavior = personaBehaviors.closingBehavior ?? 'navigation';
  
  const hasCustomBehaviors = Object.keys(personaBehaviors).length > 0;
  
  if (hasCustomBehaviors) {
    parts.push(IDENTITY_PROMPT);
    parts.push(RESPONSE_MODES[responseMode]);
    parts.push(CLOSING_BEHAVIORS[closingBehavior]);
  } else {
    parts.push(baseSystemPrompt);  // No closing behavior applied!
  }
}
```

### buildSystemPrompt() - After

```javascript
function buildSystemPrompt(options = {}) {
  const {
    systemConfig = null,  // NEW: Full config from Supabase
    personaTone = '',
    personaBehaviors = {},
    // ...
  } = options;

  // Resolve with Supabase defaults, frontend overrides
  const defaults = systemConfig || DEFAULT_BEHAVIORS;
  const responseMode = personaBehaviors.responseMode ?? defaults.responseMode;
  const closingBehavior = personaBehaviors.closingBehavior ?? defaults.closingBehavior;
  const useBreadcrumbs = personaBehaviors.useBreadcrumbTags ?? defaults.useBreadcrumbTags;
  const useTopics = personaBehaviors.useTopicTags ?? defaults.useTopicTags;
  const useNavBlocks = personaBehaviors.useNavigationBlocks ?? defaults.useNavigationBlocks;
  
  // ALWAYS apply behavioral instructions (with resolved values)
  parts.push(systemConfig?.content || FALLBACK_SYSTEM_PROMPT);
  parts.push('\n\n' + RESPONSE_MODES[responseMode]);
  parts.push('\n\n' + CLOSING_BEHAVIORS[closingBehavior]);
}
```

---

## Call Site Updates

### /api/chat endpoint (~line 1847)

```javascript
// Before
[ragResult, baseSystemPrompt] = await Promise.all([...]);
const systemPrompt = buildSystemPrompt({
  baseSystemPrompt,
  personaTone,
  personaBehaviors,
  // ...
});

// After
[ragResult, systemConfig] = await Promise.all([...]);
const systemPrompt = buildSystemPrompt({
  systemConfig,  // Pass full config, not just content
  personaTone,
  personaBehaviors,  // Frontend can still override
  // ...
});
```

### /api/chat/init endpoint (~line 2019)

Same pattern as above.

---

## Fallback Chain

### Tier 1: Supabase (Primary)

```javascript
if (!error && data?.payload) {
  return {
    content: assemblePromptContent(data.payload),
    responseMode: data.payload.responseMode || 'architect',
    closingBehavior: data.payload.closingBehavior || 'navigation',
    // ... other fields with defaults ...
    source: 'supabase'
  };
}
```

### Tier 2: GCS Legacy

```javascript
if (activeVersion?.content) {
  return {
    content: activeVersion.content,
    // GCS legacy doesn't have behavioral settings, use defaults
    ...DEFAULT_BEHAVIORS,
    source: 'gcs-legacy'
  };
}
```

### Tier 3: Static Fallback

```javascript
return {
  content: FALLBACK_SYSTEM_PROMPT,
  ...DEFAULT_BEHAVIORS,
  source: 'fallback'
};
```

---

## DEX Compliance

### Declarative Sovereignty

- ✅ Behavioral settings live in Supabase `system_prompts` table
- ✅ Domain expert can modify via ExperiencesConsole (existing UI)
- ✅ No code changes needed to adjust behaviors

### Capability Agnosticism

- ✅ If model ignores closing behavior instruction, system continues functioning
- ✅ No model-specific logic introduced

### Provenance as Infrastructure

- ✅ Settings traceable to `system_prompts.meta.id` and `version`
- ✅ Changelog field documents what changed

### Organic Scalability

- ✅ New behavioral modes can be added to schema without code changes
- ✅ Existing deployments continue working with default values

---

## Test Strategy

| Test | Type | Verification |
|------|------|--------------|
| /explore with `closingBehavior: 'open'` | Manual | Response ends naturally |
| /terminal with lens | Manual | Lens behaviors applied |
| /terminal without lens | Manual | Supabase defaults applied |
| GCS fallback | Manual | Defaults used when Supabase unavailable |
| Build passes | Automated | `npm run build` |

---

*Architecture approved for MIGRATION_MAP.md phase.*
