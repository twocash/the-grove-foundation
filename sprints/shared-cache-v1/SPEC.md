# Sprint: Shared Cache Infrastructure v1

**Status:** Planning  
**Priority:** P1 (Production reliability)  
**Estimated Effort:** 4-6 hours  
**Created:** 2025-01-10  

---

## Problem Statement

Cloud Run auto-scales to multiple instances. Each instance maintains its own in-memory cache for system prompts (and potentially other config). When an admin updates the system prompt via ExperiencesConsole:

1. `/api/cache/invalidate` is called
2. Load balancer routes to ONE instance
3. That instance clears its cache
4. Other instances continue serving stale cached content for up to 5 minutes

**Impact:** Admin changes to system prompts don't take effect reliably. Users see inconsistent behavior depending on which instance handles their request.

**Current Workaround:** Cache TTL set to 0 (disabled). Every request fetches from Supabase, adding ~50-100ms latency per chat initialization.

---

## Proposed Solution

Implement a shared cache layer using Upstash Redis (serverless Redis compatible with Cloud Run's scale-to-zero model).

### Why Upstash?

| Option | Pros | Cons |
|--------|------|------|
| **Upstash Redis** | Serverless, pay-per-request, <1ms latency, built-in REST API | Vendor lock-in |
| Google Memorystore | GCP-native, VPC integration | Requires VPC connector, always-on cost |
| Supabase Edge Config | Already in stack | Not designed for this use case |
| File-based (GCS) | Simple | Too slow for cache layer |

**Recommendation:** Upstash Redis. Free tier covers our needs (10K requests/day), and REST API works without VPC configuration.

---

## Technical Design

### Cache Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Run Instances                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Instance A   │  │ Instance B   │  │ Instance C   │       │
│  │ (no local)   │  │ (no local)   │  │ (no local)   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │   Upstash   │                           │
│                    │    Redis    │                           │
│                    └──────┬──────┘                           │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │  Supabase   │ (source of truth)         │
│                    └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Cache Keys

| Key | TTL | Content |
|-----|-----|---------|
| `grove:system-prompt:active` | 5 min | Assembled system prompt string |
| `grove:system-prompt:version` | 5 min | `updated_at` timestamp for staleness check |

### Invalidation Strategy

**Option A: TTL-based (Simple)**
- Cache for 5 minutes, no explicit invalidation needed
- Admin changes take up to 5 minutes to propagate
- Simplest implementation

**Option B: Explicit Invalidation (Recommended)**
- `/api/cache/invalidate` deletes Redis keys
- All instances immediately fetch fresh data
- Requires Upstash REST call from client

### Implementation Files

```
lib/
  cache.ts           # NEW: Shared cache abstraction
  
server.js            # MODIFY: Use shared cache for system prompts

.env.local           # ADD: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

---

## Implementation Plan

### Phase 1: Upstash Setup (30 min)

1. Create Upstash account and Redis database
2. Add environment variables to `.env.local` and Cloud Run
3. Install `@upstash/redis` package

### Phase 2: Cache Abstraction (1 hour)

Create `lib/cache.ts`:

```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    return redis.get(key);
  },
  
  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.set(key, value, { ex: ttlSeconds });
  },
  
  async del(key: string): Promise<void> {
    await redis.del(key);
  },
  
  async invalidateSystemPrompt(): Promise<void> {
    await redis.del('grove:system-prompt:active');
    console.log('[Cache] System prompt invalidated (Redis)');
  }
};
```

### Phase 3: Integration (1-2 hours)

Update `fetchActiveSystemPrompt()` in `server.js`:

```javascript
import { cache } from './lib/cache.js';

async function fetchActiveSystemPrompt() {
  // Try Redis first
  const cached = await cache.get('grove:system-prompt:active');
  if (cached) {
    console.log('[SystemPrompt] Cache hit (Redis)');
    return cached;
  }

  // Fetch from Supabase
  const { data, error } = await supabaseAdmin
    .from('system_prompts')
    .select('*')
    .eq('status', 'active')
    .single();

  if (!error && data?.payload) {
    const content = assemblePromptContent(data.payload);
    
    // Cache in Redis (5 min TTL)
    await cache.set('grove:system-prompt:active', content, 300);
    console.log('[SystemPrompt] Cached in Redis');
    
    return content;
  }

  // Fallback
  return FALLBACK_SYSTEM_PROMPT;
}
```

Update `/api/cache/invalidate`:

```javascript
app.post('/api/cache/invalidate', async (req, res) => {
  try {
    const { type } = req.body;

    if (type === 'system-prompt' || !type) {
      await cache.invalidateSystemPrompt();
    }

    res.json({ success: true, message: 'Cache invalidated (Redis)' });
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
    res.status(500).json({ error: 'Cache invalidation failed' });
  }
});
```

### Phase 4: Testing (1 hour)

1. Deploy to staging
2. Verify cache hit/miss logging
3. Test invalidation across multiple requests
4. Load test with Artillery to verify consistency

### Phase 5: Cleanup (30 min)

1. Remove dead code (local cache variables)
2. Update `/api/debug/system-prompt` to show Redis status
3. Document in `docs/ARCHITECTURE.md`

---

## Environment Variables

```bash
# Upstash Redis (REST API)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx...
```

Add to Cloud Run via:
```bash
gcloud run services update the-grove-foundation \
  --set-env-vars "UPSTASH_REDIS_REST_URL=...,UPSTASH_REDIS_REST_TOKEN=..."
```

---

## Success Criteria

- [ ] System prompt changes propagate to all instances within 1 second
- [ ] Cache hit rate >90% under normal operation
- [ ] No increase in P95 latency for chat initialization
- [ ] `/api/debug/system-prompt` shows Redis cache status

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Upstash outage | Graceful fallback to direct Supabase fetch |
| Redis connection timeout | 500ms timeout with fallback |
| Cache poisoning | Keys are server-side only, no user input in keys |

---

## Future Considerations

Once Redis is in place, consider caching:
- RAG context (per-hub, longer TTL)
- Lens configurations
- Feature flags
- Narrative graph (with pub/sub invalidation from Supabase webhooks)

---

## References

- [Upstash Redis Documentation](https://upstash.com/docs/redis/overall/getstarted)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- Sprint: system-prompt-integration-v1 (original implementation)
