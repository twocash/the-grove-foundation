# Minisprint: Shared Redis Cache for System Prompts

**Sprint ID:** shared-cache-v1  
**Estimated Time:** 2-3 hours  
**Prerequisite:** Upstash account created, env vars ready  

---

## Context

Cloud Run runs multiple instances. In-memory cache only exists per-instance, so cache invalidation misses N-1 instances. We disabled caching as a hotfix (commit `4f469b3`). This sprint restores caching via shared Redis.

---

## Deliverables

1. `lib/cache.ts` — Upstash Redis wrapper with fallback
2. Updated `fetchActiveSystemPrompt()` using shared cache
3. Updated `/api/cache/invalidate` to clear Redis
4. Environment variables in Cloud Run

---

## Pre-Flight Checklist

- [ ] Create Upstash Redis database at https://console.upstash.com
- [ ] Copy REST URL and token
- [ ] Add to `.env.local`:
  ```
  UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
  UPSTASH_REDIS_REST_TOKEN=AXxxxx...
  ```

---

## Implementation

### Step 1: Install dependency

```bash
npm install @upstash/redis
```

### Step 2: Create `lib/cache.ts`

```typescript
// lib/cache.ts
// Shared cache layer using Upstash Redis
// Sprint: shared-cache-v1

import { Redis } from '@upstash/redis';

// Initialize Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('[Cache] Upstash not configured, caching disabled');
    return null;
  }
  
  redis = new Redis({ url, token });
  return redis;
}

// Cache keys
const KEYS = {
  SYSTEM_PROMPT_ACTIVE: 'grove:system-prompt:active',
} as const;

// Default TTL: 5 minutes
const DEFAULT_TTL_SECONDS = 300;

export const cache = {
  /**
   * Get cached system prompt
   */
  async getSystemPrompt(): Promise<string | null> {
    const client = getRedis();
    if (!client) return null;
    
    try {
      const cached = await client.get<string>(KEYS.SYSTEM_PROMPT_ACTIVE);
      if (cached) {
        console.log('[Cache] System prompt hit (Redis)');
      }
      return cached;
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
      return null;
    }
  },

  /**
   * Cache system prompt
   */
  async setSystemPrompt(content: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    const client = getRedis();
    if (!client) return;
    
    try {
      await client.set(KEYS.SYSTEM_PROMPT_ACTIVE, content, { ex: ttlSeconds });
      console.log('[Cache] System prompt cached (Redis)');
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
    }
  },

  /**
   * Invalidate system prompt cache
   */
  async invalidateSystemPrompt(): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;
    
    try {
      await client.del(KEYS.SYSTEM_PROMPT_ACTIVE);
      console.log('[Cache] System prompt invalidated (Redis)');
      return true;
    } catch (error) {
      console.error('[Cache] Redis del error:', error);
      return false;
    }
  },

  /**
   * Check if Redis is configured and reachable
   */
  async health(): Promise<{ configured: boolean; reachable: boolean }> {
    const client = getRedis();
    if (!client) return { configured: false, reachable: false };
    
    try {
      await client.ping();
      return { configured: true, reachable: true };
    } catch {
      return { configured: true, reachable: false };
    }
  },
};

export default cache;
```

### Step 3: Update `server.js`

Add import at top:
```javascript
import cache from './lib/cache.js';
```

Replace `fetchActiveSystemPrompt()`:
```javascript
// Helper: Fetch active system prompt with tiered fallback
// Priority: Redis Cache → Supabase → GCS → Static fallback
async function fetchActiveSystemPrompt() {
  // Tier 0: Try Redis cache first
  const cached = await cache.getSystemPrompt();
  if (cached) {
    return cached;
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
      
      // Cache in Redis for next request
      await cache.setSystemPrompt(content);
      
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
  return FALLBACK_SYSTEM_PROMPT;
}
```

Update `/api/cache/invalidate`:
```javascript
app.post('/api/cache/invalidate', async (req, res) => {
  try {
    const { type } = req.body;

    if (type === 'system-prompt' || !type) {
      const invalidated = await cache.invalidateSystemPrompt();
      
      // Also clear legacy in-memory cache (belt and suspenders)
      invalidateSystemPromptCache();
      
      res.json({
        success: true,
        message: 'Cache invalidated',
        redis: invalidated,
      });
      return;
    }

    res.json({ success: true, message: 'No matching cache type' });
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
    res.status(500).json({ error: 'Cache invalidation failed' });
  }
});
```

Update `/api/debug/system-prompt`:
```javascript
app.get('/api/debug/system-prompt', async (req, res) => {
  try {
    const [prompt, cacheHealth] = await Promise.all([
      fetchActiveSystemPrompt(),
      cache.health(),
    ]);
    
    res.json({
      redis: cacheHealth,
      contentLength: prompt?.length || 0,
      contentPreview: prompt?.substring(0, 500) + '...',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 4: Remove dead code

Delete or comment out the old in-memory cache variables:
```javascript
// REMOVED: In-memory cache (replaced by Redis)
// let systemPromptCache = { ... };
// const SYSTEM_PROMPT_CACHE_TTL_MS = 0;
// function invalidateSystemPromptCache() { ... }
```

### Step 5: Add env vars to Cloud Run

```bash
gcloud run services update the-grove-foundation \
  --region=us-central1 \
  --set-env-vars "UPSTASH_REDIS_REST_URL=https://xxx.upstash.io" \
  --set-env-vars "UPSTASH_REDIS_REST_TOKEN=AXxxxx..."
```

Or via Cloud Console: Cloud Run → the-grove-foundation → Edit → Variables & Secrets

---

## Verification

1. Deploy and wait for rollout
2. Hit `/api/debug/system-prompt` — should show `redis: { configured: true, reachable: true }`
3. Send a chat message (cache miss, populates Redis)
4. Send another chat message (cache hit, logs show "Redis")
5. Change system prompt in ExperiencesConsole, activate it
6. Send chat message — should reflect new prompt immediately
7. Check logs for `[Cache] System prompt invalidated (Redis)`

---

## Rollback

If Redis causes issues, set env var `UPSTASH_REDIS_REST_URL=""` to disable. The cache layer gracefully falls back to direct Supabase fetch.

---

## Files Changed

| File | Action |
|------|--------|
| `package.json` | Add `@upstash/redis` |
| `lib/cache.ts` | NEW |
| `server.js` | Modify (3 functions) |
| `.env.local` | Add 2 vars |
| Cloud Run | Add 2 env vars |
