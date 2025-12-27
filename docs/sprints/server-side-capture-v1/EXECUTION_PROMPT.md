# Execution Prompt — Server-Side Sprout Capture v1

## Context

You are implementing server-side persistence for Grove sprouts. The Sprout System client-side wiring is complete. Users can capture sprouts via `/sprout` command and view them in Garden mode. This sprint adds optional server persistence with vector search capability.

**Goal:** When feature flag is enabled, sprouts persist to Supabase Postgres with Gemini embeddings for semantic search.

## Prerequisites

Before starting, verify:

```bash
# 1. Supabase project exists and credentials are set in .env.local
# Project: The Grove Foundation
# URL: https://cntzzxqgqsjzsvscunsp.supabase.co

# 2. Gemini API key exists in .env
cat .env | grep GEMINI

# 3. Sprout system is working locally
npm run dev
# Test: /sprout captures and persists to localStorage
```

**STOP** if any prerequisite is missing. The sprint requires:
- Supabase project URL and keys (in .env.local)
- Gemini API key (in .env)
- Working sprout capture (client-side)

---

## Phase 1: Database Setup ✅ ALREADY COMPLETE

The `sprouts` table already exists in Supabase with 768-dimension vector support for Gemini embeddings.

If you need to verify, run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sprouts'
ORDER BY ordinal_position;
```

---

## Phase 2: Install Dependencies

```bash
npm install @supabase/supabase-js @google/generative-ai
```

**Build gate:** `npm run build`

---

## Phase 3: Environment Configuration ✅ ALREADY COMPLETE

The `.env.local` file already has Supabase credentials configured.
The `.env` file already has `GEMINI_API_KEY`.

Verify with:
```bash
type .env.local
type .env
```

You should see:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in .env.local
- `GEMINI_API_KEY` in .env
- `NEXT_PUBLIC_SPROUT_STORAGE=local` in .env.local (we'll change to `server` after testing)

---

## Phase 4: Supabase Client Setup

### 4.1 Create src/lib/supabase/client.ts

```typescript
// src/lib/supabase/client.ts
// Browser-side Supabase client (uses anon key)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { SupabaseClient } from '@supabase/supabase-js';
```

### 4.2 Create src/lib/supabase/server.ts

```typescript
// src/lib/supabase/server.ts
// Server-side Supabase client (uses service role key)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

### 4.3 Create src/lib/supabase/index.ts

```typescript
// src/lib/supabase/index.ts
export { supabase } from './client';
export { supabaseAdmin } from './server';
```

**Build gate:** `npm run build`

---

## Phase 5: Embedding Generation (Gemini)

### 5.1 Create src/lib/embeddings.ts

```typescript
// src/lib/embeddings.ts
// Gemini embedding generation for semantic search

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate embedding vector for text using Gemini text-embedding-004
 * @param text - Text to embed
 * @returns 768-dimension embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  // Truncate very long text to avoid issues
  const truncatedText = text.slice(0, 10000);
  
  const result = await model.embedContent(truncatedText);
  return result.embedding.values;
}

/**
 * Generate embedding for a sprout (combines query + response)
 */
export async function generateSproutEmbedding(
  query: string,
  response: string
): Promise<number[]> {
  const combinedText = `Query: ${query}\n\nResponse: ${response}`;
  return generateEmbedding(combinedText);
}
```

**Build gate:** `npm run build`

---

## Phase 6: Session Management

### 6.1 Create src/lib/session.ts

```typescript
// src/lib/session.ts
// Anonymous session ID management for sprout grouping

const SESSION_KEY = 'grove-session-id';

/**
 * Get or create a session ID for the current browser session
 * Used to group sprouts from the same user without authentication
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Clear the current session ID (for testing)
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}
```

---

## Phase 7: API Routes

### 7.1 Create Directory Structure

```bash
mkdir -p src/app/api/sprouts/[id]
mkdir -p src/app/api/sprouts/search
mkdir -p src/app/api/sprouts/stats
```

Note: On Windows, create these folders manually or use:
```powershell
New-Item -ItemType Directory -Force -Path "src/app/api/sprouts/[id]"
New-Item -ItemType Directory -Force -Path "src/app/api/sprouts/search"
New-Item -ItemType Directory -Force -Path "src/app/api/sprouts/stats"
```

### 7.2 Create src/app/api/sprouts/route.ts

```typescript
// src/app/api/sprouts/route.ts
// POST: Create sprout | GET: List sprouts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateSproutEmbedding } from '@/lib/embeddings';

// POST /api/sprouts — Create a new sprout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, response, provenance, tags, note, sessionId } = body;

    if (!query || !response) {
      return NextResponse.json(
        { error: 'query and response are required' },
        { status: 400 }
      );
    }

    // Generate embedding for semantic search
    let embedding: number[] | null = null;
    try {
      embedding = await generateSproutEmbedding(query, response);
    } catch (embeddingError) {
      console.warn('Embedding generation failed:', embeddingError);
      // Continue without embedding — can backfill later
    }

    // Insert to database
    const { data, error } = await supabaseAdmin
      .from('sprouts')
      .insert({
        query,
        response,
        provenance: provenance || {},
        tags: tags || [],
        note: note || null,
        session_id: sessionId || null,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save sprout' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sprout: data });
  } catch (error) {
    console.error('POST /api/sprouts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/sprouts — List sprouts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionId = searchParams.get('sessionId');
    const lifecycle = searchParams.get('lifecycle');
    const tagsParam = searchParams.get('tags');

    let query = supabaseAdmin
      .from('sprouts')
      .select('*', { count: 'exact' })
      .order('captured_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (lifecycle) {
      query = query.eq('lifecycle', lifecycle);
    }
    if (tagsParam) {
      const tags = tagsParam.split(',');
      query = query.overlaps('tags', tags);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sprouts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sprouts: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('GET /api/sprouts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7.3 Create src/app/api/sprouts/[id]/route.ts

```typescript
// src/app/api/sprouts/[id]/route.ts
// GET: Single sprout | PATCH: Update | DELETE: Remove

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sprouts/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('sprouts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Sprout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sprout: data });
  } catch (error) {
    console.error('GET /api/sprouts/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/sprouts/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tags, note, lifecycle } = body;

    const updates: Record<string, unknown> = {};
    if (tags !== undefined) updates.tags = tags;
    if (note !== undefined) updates.note = note;
    if (lifecycle !== undefined) updates.lifecycle = lifecycle;

    const { data, error } = await supabaseAdmin
      .from('sprouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: 'Failed to update sprout' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sprout: data });
  } catch (error) {
    console.error('PATCH /api/sprouts/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sprouts/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('sprouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete sprout' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sprouts/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7.4 Create src/app/api/sprouts/search/route.ts

```typescript
// src/app/api/sprouts/search/route.ts
// POST: Vector similarity search

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings';

// POST /api/sprouts/search — Semantic similarity search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10, threshold = 0.7 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    // Generate embedding for search query using Gemini
    const queryEmbedding = await generateEmbedding(query);

    // Vector similarity search using pg_vector
    const { data, error } = await supabaseAdmin.rpc('match_sprouts', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('Vector search error:', error);
      
      // Fallback: If RPC doesn't exist, return empty results
      if (error.code === 'PGRST202') {
        console.warn('match_sprouts function not found. Run migration to add it.');
        return NextResponse.json({ results: [], fallback: true });
      }
      
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: (data || []).map((row: { id: string; similarity: number; [key: string]: unknown }) => ({
        sprout: {
          id: row.id,
          query: row.query,
          response: row.response,
          provenance: row.provenance,
          tags: row.tags,
          note: row.note,
          lifecycle: row.lifecycle,
          captured_at: row.captured_at,
        },
        similarity: row.similarity,
      })),
    });
  } catch (error) {
    console.error('POST /api/sprouts/search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7.5 Create src/app/api/sprouts/stats/route.ts

```typescript
// src/app/api/sprouts/stats/route.ts
// GET: Aggregate statistics

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    // Total count
    const { count: total } = await supabaseAdmin
      .from('sprouts')
      .select('*', { count: 'exact', head: true });

    // Count by lifecycle
    const { data: allSprouts } = await supabaseAdmin
      .from('sprouts')
      .select('lifecycle');
    
    const lifecycleCounts = { sprout: 0, sapling: 0, tree: 0 };
    (allSprouts || []).forEach((row) => {
      const lc = row.lifecycle as keyof typeof lifecycleCounts;
      if (lc in lifecycleCounts) lifecycleCounts[lc]++;
    });

    // Count by lens (top 10)
    const { data: lensCounts } = await supabaseAdmin
      .from('sprouts')
      .select('provenance')
      .not('provenance->lens->id', 'is', null);

    const lensMap = new Map<string, { id: string; name: string; count: number }>();
    (lensCounts || []).forEach((row) => {
      const lens = (row.provenance as { lens?: { id: string; name: string } })?.lens;
      if (lens?.id) {
        const existing = lensMap.get(lens.id);
        if (existing) {
          existing.count++;
        } else {
          lensMap.set(lens.id, { id: lens.id, name: lens.name || 'Unknown', count: 1 });
        }
      }
    });

    const byLens = Array.from(lensMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent count (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from('sprouts')
      .select('*', { count: 'exact', head: true })
      .gte('captured_at', yesterday);

    return NextResponse.json({
      total: total || 0,
      byLifecycle: lifecycleCounts,
      byLens,
      recentCount: recentCount || 0,
    });
  } catch (error) {
    console.error('GET /api/sprouts/stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Build gate:** `npm run build`

---

## Phase 8: Update Client Hooks

### 8.1 Update hooks/useSproutStorage.ts

Add server mode support. Find the file and add/modify:

**At the top of the file, add these imports:**
```typescript
import { getSessionId } from '../src/lib/session';

const STORAGE_MODE = process.env.NEXT_PUBLIC_SPROUT_STORAGE || 'local';
```

**Replace or modify the addSprout function to include server support:**

```typescript
const addSprout = useCallback(async (
  sproutData: Omit<Sprout, 'id' | 'capturedAt'>
): Promise<Sprout> => {
  const newSprout: Sprout = {
    ...sproutData,
    id: crypto.randomUUID(),
    capturedAt: new Date().toISOString(),
  };

  if (STORAGE_MODE === 'server') {
    try {
      const response = await fetch('/api/sprouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: newSprout.query,
          response: newSprout.response,
          provenance: newSprout.provenance,
          tags: newSprout.tags,
          note: newSprout.note,
          sessionId: getSessionId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const { sprout: serverSprout } = await response.json();
      
      // Map server response to client schema
      const mappedSprout: Sprout = {
        id: serverSprout.id,
        query: serverSprout.query,
        response: serverSprout.response,
        provenance: serverSprout.provenance,
        tags: serverSprout.tags || [],
        note: serverSprout.note,
        lifecycle: serverSprout.lifecycle || 'sprout',
        capturedAt: serverSprout.captured_at,
      };

      // Also save locally for offline access
      setSprouts(prev => {
        const updated = [mappedSprout, ...prev];
        saveToStorage(updated);
        return updated;
      });

      return mappedSprout;
    } catch (error) {
      console.warn('Server save failed, falling back to local:', error);
      // Fall through to local save
    }
  }

  // Local save (default or fallback)
  setSprouts(prev => {
    const updated = [newSprout, ...prev];
    saveToStorage(updated);
    return updated;
  });

  return newSprout;
}, [saveToStorage]);
```

**Build gate:** `npm run build`

---

## Phase 9: TypeScript Configuration

### 9.1 Verify Path Alias

Check `tsconfig.json` has the `@/*` path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

If not present, add it. If the build fails with import errors, use relative paths instead:

```typescript
// Instead of:
import { supabaseAdmin } from '@/lib/supabase/server';
// Use:
import { supabaseAdmin } from '../../../lib/supabase/server';
```

---

## Phase 10: Final Build & Test

### 10.1 Build Verification

```bash
npm run build
```

Must pass with no errors.

### 10.2 Local Test (localStorage mode)

Ensure `.env.local` has:
```
NEXT_PUBLIC_SPROUT_STORAGE=local
```

```bash
npm run dev
```

1. Navigate to Terminal
2. Send a message, get response
3. Run `/sprout`
4. Verify toast appears
5. Run `/garden` — sprout should appear
6. Check DevTools → Application → localStorage → `grove-sprouts`

### 10.3 Server Test

Edit `.env.local` to change:
```
NEXT_PUBLIC_SPROUT_STORAGE=server
```

Restart dev server:
```bash
npm run dev
```

1. Capture a sprout with `/sprout`
2. Check Supabase Dashboard → Table Editor → sprouts
3. Verify row exists with embedding (768 numbers in array)

### 10.4 Vector Search Test (Optional)

In browser console or PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sprouts/search" -Method POST -ContentType "application/json" -Body '{"query": "distributed AI"}'
```

Should return semantically similar sprouts.

---

## Smoke Test Checklist

- [ ] `npm run build` passes
- [ ] Local mode: sprouts save to localStorage
- [ ] Server mode: sprouts save to Supabase
- [ ] Server mode: embeddings are generated (768-dim Gemini)
- [ ] Fallback: server failure → localStorage works
- [ ] GET /api/sprouts returns sprout list
- [ ] POST /api/sprouts/search returns similar sprouts
- [ ] GET /api/sprouts/stats returns counts
- [ ] Garden view shows sprouts from server
- [ ] No console errors in normal operation

---

## Forbidden Actions

- Do NOT modify the Sprout client schema (src/core/schema/sprout.ts)
- Do NOT delete localStorage functionality
- Do NOT require authentication for MVP
- Do NOT change embedding dimension (768 for Gemini)
- Do NOT skip build verification between phases
- Do NOT commit API keys to git

---

## Files Summary

| File | Action |
|------|--------|
| `src/lib/supabase/client.ts` | CREATE |
| `src/lib/supabase/server.ts` | CREATE |
| `src/lib/supabase/index.ts` | CREATE |
| `src/lib/embeddings.ts` | CREATE (Gemini) |
| `src/lib/session.ts` | CREATE |
| `src/app/api/sprouts/route.ts` | CREATE |
| `src/app/api/sprouts/[id]/route.ts` | CREATE |
| `src/app/api/sprouts/search/route.ts` | CREATE |
| `src/app/api/sprouts/stats/route.ts` | CREATE |
| `hooks/useSproutStorage.ts` | MODIFY |
| `package.json` | MODIFY (add deps) |

---

## Success Criteria

- [ ] Feature flag controls storage mode
- [ ] Server mode persists to Supabase
- [ ] Gemini embeddings generated for semantic search
- [ ] Fallback to localStorage on server failure
- [ ] All API routes functional
- [ ] Build passes
- [ ] No console errors in normal operation

---

## Post-Sprint: Demo Capabilities

Once complete, you can demonstrate:

1. **"Look at what the community discovered"**
   - Query Supabase table, show collective sprouts

2. **"Find related insights"**
   - POST /api/sprouts/search with any topic
   - Returns semantically similar sprouts

3. **"Knowledge grows over time"**
   - Show sprout counts increasing
   - Lifecycle progression (future: promote sprouts to saplings)

4. **"Attribution matters"**
   - Show provenance tracking lens → hub → journey → node

This closes the loop on "how does collective knowledge accumulate?"
