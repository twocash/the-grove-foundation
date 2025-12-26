# Server-Side Sprout Capture v1

## Sprint Overview

**Sprint ID:** `server-side-capture-v1`
**Created:** 2025-12-26
**Estimated:** 6-8 hours
**Depends on:** `sprout-system-wiring-v1`, `dashboard-sprout-widget-v1`

### Objective

Add optional server-side persistence for sprouts, enabling:
- Collective knowledge accumulation across anonymous users
- Vector similarity search for knowledge discovery
- Forward-compatible foundation for Knowledge Commons
- Demo capability: "Look at what the community is discovering"

### Success Criteria

- [ ] Feature flag toggles local vs server storage
- [ ] Sprouts persist to Supabase Postgres
- [ ] Vector embeddings generated for semantic search
- [ ] API routes for CRUD and similarity search
- [ ] Fallback to localStorage when server unavailable
- [ ] Existing local sprouts continue to work

---

## Architecture

### Data Flow

```
User captures sprout via /sprout
         │
         ▼
┌─────────────────────────────────┐
│ useSproutCapture hook           │
│ (existing, minimal changes)     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ useSproutStorage hook           │
│ ├─ if SPROUT_STORAGE=server     │
│ │   └─ POST /api/sprouts        │
│ └─ else                         │
│     └─ localStorage (existing)  │
└─────────────────────────────────┘
         │
         ▼ (server mode)
┌─────────────────────────────────┐
│ /api/sprouts                    │
│ ├─ Generate embedding           │
│ ├─ Insert to Supabase           │
│ └─ Return created sprout        │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Supabase Postgres + pg_vector   │
│ ├─ sprouts table (SQL)          │
│ └─ embeddings (vector search)   │
└─────────────────────────────────┘
```

### Feature Flag

```
NEXT_PUBLIC_SPROUT_STORAGE=server  # Enable server persistence
NEXT_PUBLIC_SPROUT_STORAGE=local   # Use localStorage only (default)
```

---

## Database Schema

### Supabase Setup

Project will be created manually before sprint execution. Sprint assumes:
- Supabase project exists
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` available
- `SUPABASE_SERVICE_ROLE_KEY` for server-side operations

### Migration SQL

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Core sprouts table
CREATE TABLE sprouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content (required)
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  
  -- Provenance (human-readable, matches client schema)
  provenance JSONB DEFAULT '{}',
  -- Structure: {
  --   lens: { id, name },
  --   hub: { id, name },
  --   journey: { id, name },
  --   node: { id, name },
  --   model: string,
  --   capturedAt: ISO timestamp
  -- }
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  note TEXT,
  lifecycle TEXT DEFAULT 'sprout' CHECK (lifecycle IN ('sprout', 'sapling', 'tree')),
  
  -- Session tracking (anonymous)
  session_id TEXT,  -- Browser session for grouping
  
  -- Timestamps
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Vector embedding for semantic search
  embedding VECTOR(1536)  -- OpenAI text-embedding-ada-002
);

-- Indexes for common queries
CREATE INDEX idx_sprouts_lifecycle ON sprouts(lifecycle);
CREATE INDEX idx_sprouts_session ON sprouts(session_id);
CREATE INDEX idx_sprouts_captured_at ON sprouts(captured_at DESC);
CREATE INDEX idx_sprouts_tags ON sprouts USING GIN(tags);

-- Vector similarity index (IVFFlat for performance)
CREATE INDEX idx_sprouts_embedding ON sprouts 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Provenance queries via JSONB
CREATE INDEX idx_sprouts_provenance ON sprouts USING GIN(provenance);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sprouts_updated_at
  BEFORE UPDATE ON sprouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (prepared for future auth)
ALTER TABLE sprouts ENABLE ROW LEVEL SECURITY;

-- For MVP: Allow anonymous read/write
CREATE POLICY "Allow anonymous insert" ON sprouts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON sprouts
  FOR SELECT TO anon USING (true);

-- Service role bypasses RLS for admin operations
```

---

## API Routes

### Route Structure

```
/api/sprouts/
├─ route.ts          # POST (create), GET (list)
├─ [id]/
│   └─ route.ts      # GET (single), PATCH (update), DELETE
├─ search/
│   └─ route.ts      # POST (vector similarity search)
└─ stats/
    └─ route.ts      # GET (aggregate statistics)
```

### POST /api/sprouts — Create Sprout

```typescript
// Request
{
  query: string;
  response: string;
  provenance?: SproutProvenance;
  tags?: string[];
  note?: string;
  sessionId?: string;
}

// Response
{
  success: true;
  sprout: Sprout;  // With server-generated id
}
```

### GET /api/sprouts — List Sprouts

```typescript
// Query params
?limit=20
&offset=0
&lifecycle=sprout
&sessionId=xxx
&tags=infrastructure,ratchet

// Response
{
  sprouts: Sprout[];
  total: number;
  hasMore: boolean;
}
```

### POST /api/sprouts/search — Semantic Search

```typescript
// Request
{
  query: string;      // Natural language query
  limit?: number;     // Default 10
  threshold?: number; // Similarity threshold 0-1
}

// Response
{
  results: Array<{
    sprout: Sprout;
    similarity: number;  // 0-1 score
  }>;
}
```

### GET /api/sprouts/stats — Aggregate Stats

```typescript
// Response
{
  total: number;
  byLifecycle: {
    sprout: number;
    sapling: number;
    tree: number;
  };
  byLens: Array<{ lensId: string; lensName: string; count: number }>;
  recentCount: number;  // Last 24 hours
}
```

---

## Client Integration

### Updated useSproutStorage Hook

```typescript
// hooks/useSproutStorage.ts

const STORAGE_MODE = process.env.NEXT_PUBLIC_SPROUT_STORAGE || 'local';

export function useSproutStorage() {
  // ... existing state ...

  const addSprout = async (sprout: Omit<Sprout, 'id'>) => {
    if (STORAGE_MODE === 'server') {
      try {
        const response = await fetch('/api/sprouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: sprout.query,
            response: sprout.response,
            provenance: sprout.provenance,
            tags: sprout.tags,
            note: sprout.note,
            sessionId: getSessionId(),
          }),
        });
        
        if (!response.ok) throw new Error('Server error');
        
        const { sprout: serverSprout } = await response.json();
        
        // Also save locally for offline access
        saveToLocalStorage(serverSprout);
        
        return serverSprout;
      } catch (error) {
        console.warn('Server save failed, falling back to local:', error);
        // Fallback to local-only
        return saveToLocalStorage({ ...sprout, id: generateId() });
      }
    } else {
      return saveToLocalStorage({ ...sprout, id: generateId() });
    }
  };

  const getSprouts = async (options?: GetSproutsOptions) => {
    if (STORAGE_MODE === 'server') {
      try {
        const params = new URLSearchParams();
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.sessionId) params.set('sessionId', options.sessionId);
        
        const response = await fetch(`/api/sprouts?${params}`);
        if (!response.ok) throw new Error('Server error');
        
        const { sprouts } = await response.json();
        return sprouts;
      } catch (error) {
        console.warn('Server fetch failed, using local:', error);
        return getFromLocalStorage();
      }
    } else {
      return getFromLocalStorage();
    }
  };

  // ... rest of hook ...
}
```

### Session ID Management

```typescript
// lib/session.ts

const SESSION_KEY = 'grove-session-id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
```

---

## Embedding Generation

### OpenAI Integration

```typescript
// lib/embeddings.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.slice(0, 8000),  // Token limit safety
  });
  
  return response.data[0].embedding;
}
```

### Embedding Strategy

Generate embedding from combined query + response for richer semantic matching:

```typescript
const embeddingText = `Query: ${sprout.query}\n\nResponse: ${sprout.response}`;
const embedding = await generateEmbedding(embeddingText);
```

---

## Environment Variables

### Required

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Feature flag
NEXT_PUBLIC_SPROUT_STORAGE=server
```

### Local Development

```env
# .env.local
NEXT_PUBLIC_SPROUT_STORAGE=local  # Use localStorage during dev
```

---

## File Structure

```
src/
├─ lib/
│   ├─ supabase/
│   │   ├─ client.ts      # Browser client (anon key)
│   │   └─ server.ts      # Server client (service role)
│   ├─ embeddings.ts      # OpenAI embedding generation
│   └─ session.ts         # Session ID management
├─ app/
│   └─ api/
│       └─ sprouts/
│           ├─ route.ts           # POST, GET
│           ├─ [id]/
│           │   └─ route.ts       # GET, PATCH, DELETE
│           ├─ search/
│           │   └─ route.ts       # POST (vector search)
│           └─ stats/
│               └─ route.ts       # GET (aggregates)
hooks/
├─ useSproutStorage.ts    # MODIFY: Add server mode
└─ useSproutStats.ts      # MODIFY: Use server stats when available
```

---

## Dependencies

### New Packages

```bash
npm install @supabase/supabase-js openai
```

### Package Versions

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "openai": "^4.24.0"
}
```

---

## Testing Strategy

### Manual Smoke Tests

1. **Local mode (default):**
   - Set `NEXT_PUBLIC_SPROUT_STORAGE=local`
   - Capture sprout → appears in localStorage
   - No network requests to /api/sprouts

2. **Server mode:**
   - Set `NEXT_PUBLIC_SPROUT_STORAGE=server`
   - Capture sprout → POST to /api/sprouts
   - Sprout appears in Supabase table
   - Embedding generated and stored

3. **Fallback:**
   - Set server mode but stop Supabase
   - Capture sprout → falls back to localStorage
   - Console warning logged

4. **Vector search:**
   - Capture 5+ sprouts with varied content
   - POST /api/sprouts/search with query
   - Returns semantically similar sprouts

5. **Stats endpoint:**
   - GET /api/sprouts/stats
   - Returns accurate counts matching Supabase

---

## Rollback Plan

If server-side capture causes issues:

1. Set `NEXT_PUBLIC_SPROUT_STORAGE=local` in production
2. All users immediately fall back to localStorage
3. Server data preserved for later use
4. No data loss (local copies maintained)

---
