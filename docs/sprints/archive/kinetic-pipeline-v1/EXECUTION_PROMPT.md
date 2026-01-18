# Execution Prompt: kinetic-pipeline-v1

**Sprint:** kinetic-pipeline-v1  
**Start Date:** December 30, 2025  
**Target:** 6 weeks  
**Branch:** `bedrock`

---

## Context

You are implementing the **Kinetic Pipeline**—the organic knowledge system that replaces static GCS files with a dynamic, embedding-powered, Supabase-backed knowledge graph.

**Key insight:** Documents don't define structure—structure emerges from documents.

### What You're Building

1. **Document ingestion** → Supabase storage with lifecycle tiers
2. **Embedding pipeline** → Gemini vectors stored in pgvector
3. **Clustering** → HDBSCAN suggests Hub groupings
4. **Journey synthesis** → Semantic ordering creates paths
5. **Context serving** → /explore queries new system
6. **Pipeline Monitor** → Admin console for management

### Strangler Fig Strategy

- `/explore` uses NEW pipeline (Supabase)
- `/genesis` stays on OLD pipeline (GCS)
- This allows proving the model without breaking production

---

## Pre-Execution Setup

### 1. Verify Supabase Access

```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

Both should be set. If not, check `.env.local`.

### 2. Verify Gemini Access

```bash
# Check API key
echo $GEMINI_API_KEY
```

### 3. Verify Existing Infrastructure

```bash
# Existing files you'll extend
cat lib/supabase.js      # Supabase client
cat lib/embeddings.js    # Gemini embeddings
```

### 4. Read Sprint Artifacts

```bash
# Full specification
cat docs/sprints/kinetic-pipeline-v1/SPEC.md

# Architecture decisions
cat docs/sprints/kinetic-pipeline-v1/ARCHITECTURE.md

# Story breakdown
cat docs/sprints/kinetic-pipeline-v1/SPRINTS.md
```

---

## Epic 1: Supabase Schema & Upload

### Story 1.1: Create Database Schema

Create the Supabase migration:

```bash
mkdir -p supabase/migrations
```

Create file `supabase/migrations/001_kinetic_pipeline.sql`:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'sapling' 
    CHECK (tier IN ('seed', 'sprout', 'sapling', 'tree', 'grove')),
  tier_updated_at TIMESTAMPTZ DEFAULT now(),
  source_type TEXT DEFAULT 'upload',
  source_url TEXT,
  file_type TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  embedding_status TEXT DEFAULT 'pending' 
    CHECK (embedding_status IN ('pending', 'processing', 'complete', 'error')),
  embedding_error TEXT,
  archived BOOLEAN DEFAULT false
);

-- Document chunks for embedding
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

-- Embeddings with pgvector (768 dimensions for Gemini)
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model TEXT DEFAULT 'text-embedding-004',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
ON embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Suggested hubs from clustering
CREATE TABLE IF NOT EXISTS suggested_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_title TEXT NOT NULL,
  member_doc_ids UUID[] NOT NULL,
  centroid vector(768),
  cluster_quality FLOAT,
  algorithm TEXT DEFAULT 'hdbscan',
  computed_at TIMESTAMPTZ DEFAULT now(),
  input_doc_count INTEGER,
  title_override TEXT,
  frozen BOOLEAN DEFAULT false,
  force_include_ids UUID[],
  force_exclude_ids UUID[],
  status TEXT DEFAULT 'suggested' 
    CHECK (status IN ('suggested', 'approved', 'rejected'))
);

-- Suggested journeys
CREATE TABLE IF NOT EXISTS suggested_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES suggested_hubs(id) ON DELETE CASCADE,
  suggested_title TEXT NOT NULL,
  node_doc_ids UUID[] NOT NULL,
  synthesis_method TEXT DEFAULT 'semantic',
  computed_at TIMESTAMPTZ DEFAULT now(),
  title_override TEXT,
  must_include_ids UUID[],
  must_exclude_ids UUID[],
  preferred_order UUID[],
  status TEXT DEFAULT 'suggested' 
    CHECK (status IN ('suggested', 'approved', 'rejected'))
);

-- Knowledge graph edges
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  target_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength FLOAT NOT NULL,
  created_by TEXT DEFAULT 'system',
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_doc_id, target_doc_id, relationship_type)
);

-- Pipeline run tracking
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  documents_processed INTEGER DEFAULT 0,
  clusters_created INTEGER DEFAULT 0,
  journeys_created INTEGER DEFAULT 0,
  errors TEXT[],
  status TEXT DEFAULT 'running' 
    CHECK (status IN ('running', 'complete', 'error'))
);

-- Search function
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(768),
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  JOIN documents d ON e.document_id = d.id
  WHERE d.archived = false
    AND d.tier IN ('sapling', 'tree', 'grove')
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

**Apply migration:**
Run this SQL in Supabase SQL Editor or via CLI.

### Story 1.2-1.4: Create Knowledge Module

Create `lib/knowledge/` directory and files:

**lib/knowledge/types.ts:**
```typescript
export type DocumentTier = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';
export type EmbeddingStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface Document {
  id: string;
  title: string;
  content: string;
  contentHash: string;
  tier: DocumentTier;
  tierUpdatedAt: Date;
  sourceType: string;
  sourceUrl?: string;
  fileType?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  embeddingStatus: EmbeddingStatus;
  embeddingError?: string;
  archived: boolean;
}

export interface Chunk {
  id?: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  charStart: number;
  charEnd: number;
}

export interface UploadDocumentInput {
  title: string;
  content: string;
  tier?: DocumentTier;
  sourceType?: 'upload' | 'capture' | 'import';
  sourceUrl?: string;
  fileType?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  similarity: number;
}

export interface ComputedHub {
  id: string;
  suggestedTitle: string;
  memberDocIds: string[];
  centroid?: number[];
  clusterQuality?: number;
  titleOverride?: string;
  frozen: boolean;
  status: 'suggested' | 'approved' | 'rejected';
}

export interface ComputedJourney {
  id: string;
  hubId: string;
  suggestedTitle: string;
  nodeDocIds: string[];
  synthesisMethod: string;
  titleOverride?: string;
  status: 'suggested' | 'approved' | 'rejected';
}
```

**lib/knowledge/index.ts:**
```typescript
export * from './types';
export * from './ingest';
export * from './chunk';
export * from './embed';
export * from './search';
export * from './cluster';
export * from './synthesize';
export * from './provider';
```

---

## Verification Commands

After each epic, verify:

```bash
# Build passes
npm run build

# Tests pass  
npm test

# Server starts
npm run dev
```

### Epic 1 Verification

```bash
# Test upload endpoint
curl -X POST http://localhost:3000/api/knowledge/upload \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Doc","content":"This is test content for the knowledge pipeline."}'

# Should return: {"id":"<uuid>","status":"pending"}
```

### Epic 2 Verification

```bash
# Trigger embedding
curl -X POST http://localhost:3000/api/knowledge/embed

# Should return: {"processed":1,"errors":[]}

# Test search
curl "http://localhost:3000/api/knowledge/search?q=test"

# Should return: {"results":[{"id":"...","title":"Test Doc","similarity":0.9}]}
```

### Epic 3 Verification

```bash
# Upload several related documents first, then:
curl -X POST http://localhost:3000/api/knowledge/cluster

# Should return: {"hubsCreated":1,"runId":"<uuid>"}
```

### Epic 5 Verification

```bash
# Test context endpoint
curl -X POST http://localhost:3000/api/knowledge/context \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about distributed systems"}'

# Should return context from Supabase documents
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/supabase.js` | Existing Supabase client (extend) |
| `lib/embeddings.js` | Existing Gemini embeddings (use) |
| `lib/knowledge/` | New knowledge pipeline module |
| `src/core/engine/ragLoader.ts` | Legacy GCS loader (keep unchanged) |
| `server.js` | Add new API endpoints |
| `src/bedrock/consoles/PipelineMonitor/` | New admin console |

---

## Troubleshooting

### pgvector not found
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Embedding fails
Check GEMINI_API_KEY is set correctly.

### Search returns empty
1. Verify documents are in `sapling` tier or higher
2. Check embeddings table has vectors
3. Adjust threshold (default 0.7 may be too high)

### HDBSCAN import error
```bash
npm install hdbscan
```

---

## Completion Checklist

- [ ] Epic 1: Schema deployed, upload works
- [ ] Epic 2: Embeddings generate, search works
- [ ] Epic 3: Clustering creates hubs
- [ ] Epic 4: Journeys synthesize from hubs
- [ ] Epic 5: /explore uses Supabase
- [ ] Epic 6: Pipeline Monitor displays status with Quantum Glass styling

---

## Epic 6: Quantum Glass Styling Note

**Critical:** Bedrock shell currently has low contrast. Story 6.0 must apply Quantum Glass tokens BEFORE building Pipeline Monitor components.

**Token reference locations:**
- `src/surface/styles/` — Token definitions
- `tailwind.config.js` — Extended colors
- `src/explore/` — Usage examples

**Token classes to apply:**
```typescript
// Backgrounds
bg-black/40, bg-white/5, backdrop-blur-xl

// Borders  
border-white/10, border-white/5

// Text
text-white/90 (primary), text-white/60 (secondary), text-white/40 (muted)

// Interactive
hover:bg-white/10, focus:ring-white/20
```

**Apply to:**
- BedrockLayout.tsx
- BedrockNav.tsx
- BedrockInspector.tsx
- All new Pipeline Monitor components

---

## Log Progress

Update `docs/sprints/kinetic-pipeline-v1/DEVLOG.md` with:
- Completion times for each epic
- Issues encountered
- Deviations from plan
- Test results
