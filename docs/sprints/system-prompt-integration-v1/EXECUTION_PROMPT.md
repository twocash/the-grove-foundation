# Execution Prompt — System Prompt Integration v1

## Context

ExperiencesConsole writes system prompts to Supabase, but the server reads from GCS. This sprint connects them by:
1. Creating the `system_prompts` table in Supabase
2. Seeding Grove Narrator v2.0
3. Updating server to read Supabase first, GCS as fallback

## Attention Anchoring Protocol

Before any major decision, re-read:
1. SPEC.md Live Status block
2. SPEC.md Attention Anchor block

**We are building:** Supabase-backed system prompt storage with GCS fallback
**Success looks like:** Chat at `/explore` uses prompts managed in ExperiencesConsole
**We are NOT:** Migrating legacy v1-v9 prompts from GCS

---

## Pre-Execution Checklist

- [ ] Supabase project accessible
- [ ] `supabaseAdmin` already imported in server.js (line 29)
- [ ] Grove Narrator v2.0 JSON available in SEED_DATA.sql

---

## Phase 1: Database Migration (Manual - Supabase Dashboard)

### Step 1.1: Run MIGRATION.sql

Open Supabase SQL Editor and run the contents of:
`docs/sprints/system-prompt-integration-v1/MIGRATION.sql`

**Verify:** Table columns appear in query output

### Step 1.2: Run SEED_DATA.sql

Run the contents of:
`docs/sprints/system-prompt-integration-v1/SEED_DATA.sql`

**Verify:** Query returns Grove Narrator v2.0 with status='active'

---

## Phase 2: Server Changes

**Target file:** `server.js`

### Step 2.1: Add Cache and Assembler (INSERT NEW CODE)

**Location:** Around line 1148, BEFORE the existing `fetchActiveSystemPrompt` function

**Insert this block:**

```javascript
// ============================================================================
// SYSTEM PROMPT: Supabase → GCS → Fallback
// Sprint: system-prompt-integration-v1
// ============================================================================

// In-memory cache for system prompt
let systemPromptCache = {
  content: null,
  source: null,
  fetchedAt: null
};
const SYSTEM_PROMPT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Assemble system prompt content from payload sections.
 * Mirrors src/core/schema/system-prompt.ts assemblePromptContent()
 */
function assemblePromptContent(payload) {
  const sections = [];
  
  if (payload.identity) {
    sections.push(`## Identity\n${payload.identity}`);
  }
  if (payload.voiceGuidelines) {
    sections.push(`## Voice Guidelines\n${payload.voiceGuidelines}`);
  }
  if (payload.structureRules) {
    sections.push(`## Structure Rules\n${payload.structureRules}`);
  }
  if (payload.knowledgeInstructions) {
    sections.push(`## Knowledge Instructions\n${payload.knowledgeInstructions}`);
  }
  if (payload.boundaries) {
    sections.push(`## Boundaries\n${payload.boundaries}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Invalidate system prompt cache.
 * Called when ExperiencesConsole activates a new prompt.
 */
function invalidateSystemPromptCache() {
  systemPromptCache = { content: null, source: null, fetchedAt: null };
  console.log('[SystemPrompt] Cache invalidated');
}
```

### Step 2.2: Replace fetchActiveSystemPrompt (REPLACE EXISTING)

**Location:** Find the existing function (starts around line 1151):
```javascript
async function fetchActiveSystemPrompt() {
```

**Delete the entire existing function and replace with:**

```javascript
// Helper: Fetch active system prompt with tiered fallback
// Priority: Supabase → GCS → Static fallback
async function fetchActiveSystemPrompt() {
  const now = Date.now();
  
  // Check cache first
  if (systemPromptCache.content && 
      (now - systemPromptCache.fetchedAt) < SYSTEM_PROMPT_CACHE_TTL_MS) {
    console.log(`[SystemPrompt] Using cached prompt (source: ${systemPromptCache.source})`);
    return systemPromptCache.content;
  }

  // Tier 1: Try Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('system_prompts')
      .select('*')
      .eq('status', 'active')
      .single();

    if (!error && data?.payload) {
      const content = assemblePromptContent(data.payload);
      systemPromptCache = { content, source: 'supabase', fetchedAt: now };
      console.log(`[SystemPrompt] Loaded from Supabase: "${data.title}"`);
      return content;
    }
    
    if (error && error.code !== 'PGRST116') {
      console.warn('[SystemPrompt] Supabase error:', error.message);
    }
  } catch (err) {
    console.warn('[SystemPrompt] Supabase fetch failed:', err.message);
  }

  // Tier 2: Try GCS narratives.json (legacy)
  try {
    const file = storage.bucket(BUCKET_NAME).file('narratives.json');
    const [exists] = await file.exists();

    if (exists) {
      const [content] = await file.download();
      const narratives = JSON.parse(content.toString());

      if (isModernSchema(narratives) && narratives.globalSettings?.systemPromptVersions) {
        const versions = narratives.globalSettings.systemPromptVersions;
        const activeId = narratives.globalSettings.activeSystemPromptId;
        const activeVersion = versions.find(v => v.id === activeId) || versions.find(v => v.isActive);

        if (activeVersion?.content) {
          systemPromptCache = { 
            content: activeVersion.content, 
            source: 'gcs-legacy', 
            fetchedAt: now 
          };
          console.log(`[SystemPrompt] Loaded from GCS legacy: "${activeVersion.label}"`);
          return activeVersion.content;
        }
      }
    }
  } catch (err) {
    console.warn('[SystemPrompt] GCS fetch failed:', err.message);
  }

  // Tier 3: Fallback
  console.log('[SystemPrompt] Using fallback prompt');
  systemPromptCache = { 
    content: FALLBACK_SYSTEM_PROMPT, 
    source: 'fallback', 
    fetchedAt: now 
  };
  return FALLBACK_SYSTEM_PROMPT;
}
```

### Step 2.3: Add Cache Invalidation Endpoint (INSERT NEW CODE)

**Location:** Find where other API POST routes are defined (search for `app.post('/api/`)

**Add this endpoint:**

```javascript
// ============================================================================
// CACHE INVALIDATION API
// Sprint: system-prompt-integration-v1
// ============================================================================

app.post('/api/cache/invalidate', async (req, res) => {
  try {
    const { type } = req.body;
    
    if (type === 'system-prompt' || !type) {
      invalidateSystemPromptCache();
    }
    
    res.json({ 
      success: true, 
      message: 'Cache invalidated',
      invalidated: type || 'all'
    });
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
    res.status(500).json({ error: 'Cache invalidation failed' });
  }
});
```

---

## Phase 3: Verification

### Step 3.1: Restart Server

```bash
cd C:\github\the-grove-foundation
npm run dev
```

### Step 3.2: Check Server Logs

**Expected:**
```
[SystemPrompt] Loaded from Supabase: "Grove Narrator System Prompt v2.0"
```

**If you see** `Loaded from GCS legacy` instead:
- Check table exists in Supabase
- Check RLS policies allow read
- Check seed data was inserted

### Step 3.3: Test Chat Voice

1. Navigate to `http://localhost:3000/explore`
2. Send: "What is Grove?"
3. Verify v2.0 characteristics:
   - No framework labels visible (Schelling/Helland/McKee invisible)
   - Eli Lilly test framing for infrastructure
   - Civilizational stakes
   - Corridors at the end

### Step 3.4: Test ExperiencesConsole

1. Go to `http://localhost:3000/bedrock/experiences`
2. Verify Grove Narrator v2.0 appears in list
3. Create a new draft prompt
4. Refresh page - verify it persists
5. Activate the new prompt
6. Return to `/explore` and verify chat voice changed

### Step 3.5: Test Cache Invalidation

```bash
curl -X POST http://localhost:8080/api/cache/invalidate -H "Content-Type: application/json" -d "{\"type\":\"system-prompt\"}"
```

**Expected:**
```json
{"success":true,"message":"Cache invalidated","invalidated":"system-prompt"}
```

### Step 3.6: Test Graceful Degradation

1. Set invalid `SUPABASE_URL` in .env.local
2. Restart server
3. Verify logs: `[SystemPrompt] Loaded from GCS legacy`
4. Verify chat still works
5. Restore correct SUPABASE_URL

---

## Success Criteria Checklist

- [ ] Server logs show "Loaded from Supabase"
- [ ] Chat uses v2.0 voice
- [ ] ExperiencesConsole shows v2.0 in list
- [ ] New prompts persist in Supabase
- [ ] Activating prompt changes chat
- [ ] `/api/cache/invalidate` returns 200
- [ ] GCS fallback works when Supabase unavailable

---

## Forbidden Actions

- ❌ Do NOT modify GCS narratives.json
- ❌ Do NOT migrate v1-v9 prompts
- ❌ Do NOT change frontend code
- ❌ Do NOT hardcode prompt IDs

---

## Troubleshooting

### "Loaded from GCS legacy" instead of Supabase

```sql
-- Check table exists
SELECT * FROM system_prompts;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'system_prompts';

-- Check active prompt
SELECT id, title, status FROM system_prompts WHERE status = 'active';
```

### ExperiencesConsole shows empty list

Check `src/core/data/adapters/supabase-adapter.ts` line ~34:
```typescript
TABLE_MAP = {
  'system-prompt': 'system_prompts',  // Should exist
  ...
}
```

### 500 error on chat

1. Verify `FALLBACK_SYSTEM_PROMPT` exists in server.js
2. Verify all three tiers have try/catch blocks

---

## Post-Execution

1. Update DEVLOG.md with results
2. Commit:
   ```bash
   git add -A
   git commit -m "feat: connect ExperiencesConsole to server via Supabase system_prompts"
   ```
3. Update SPEC.md Live Status to ✅ Complete
