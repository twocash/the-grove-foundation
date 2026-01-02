# Sprint Breakdown: kinetic-pipeline-v1

**Sprint:** kinetic-pipeline-v1  
**Weeks:** 6  
**Epics:** 6

---

## Epic Overview

| Epic | Name | Duration | Dependencies |
|------|------|----------|--------------|
| 1 | Supabase Schema & Upload | Week 1 | None |
| 2 | Embedding Pipeline | Week 2 | Epic 1 |
| 3 | Clustering System | Week 3 | Epic 2 |
| 4 | Journey Synthesis | Week 3-4 | Epic 3 |
| 5 | /explore Integration | Week 4-5 | Epic 1-4 |
| 6 | Pipeline Monitor Console | Week 5-6 | Epic 1-5 |

---

## Epic 1: Supabase Schema & Upload

**Goal:** Create database schema and basic document ingestion.

### Story 1.1: Create Database Schema

**Task:** Create all Supabase tables via migration.

**Files to create:**
- `supabase/migrations/001_kinetic_pipeline.sql`

**Implementation:**
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'sapling',
  tier_updated_at TIMESTAMPTZ DEFAULT now(),
  source_type TEXT DEFAULT 'upload',
  source_url TEXT,
  file_type TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  embedding_status TEXT DEFAULT 'pending',
  embedding_error TEXT,
  archived BOOLEAN DEFAULT false
);

-- Add remaining tables from SPEC.md schema
```

**Tests:**
- [ ] Migration runs successfully
- [ ] Tables visible in Supabase dashboard

### Story 1.2: Document Upload API

**Task:** Create upload endpoint.

**Files to create:**
- `lib/knowledge/index.ts`
- `lib/knowledge/types.ts`
- `lib/knowledge/ingest.ts`

**Implementation:**
```typescript
// lib/knowledge/ingest.ts
import { supabaseAdmin } from '../supabase';
import crypto from 'crypto';

export interface UploadDocumentInput {
  title: string;
  content: string;
  tier?: DocumentTier;
  sourceType?: 'upload' | 'capture' | 'import';
  sourceUrl?: string;
  fileType?: string;
}

export async function uploadDocument(
  input: UploadDocumentInput,
  createdBy: string = 'system'
): Promise<{ id: string; status: string }> {
  const contentHash = crypto
    .createHash('sha256')
    .update(input.content)
    .digest('hex');

  const { data, error } = await supabaseAdmin
    .from('documents')
    .insert({
      title: input.title,
      content: input.content,
      content_hash: contentHash,
      tier: input.tier || 'sapling',
      source_type: input.sourceType || 'upload',
      source_url: input.sourceUrl,
      file_type: input.fileType,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id, status: 'pending' };
}
```

**Tests:**
- [ ] Document inserts successfully
- [ ] Content hash computed correctly
- [ ] Duplicate detection works (same hash)

### Story 1.3: Add API Route

**Task:** Create server endpoint for uploads.

**Files to modify:**
- `server.js` — Add route handler

**Implementation:**
```javascript
// In server.js
app.post('/api/knowledge/upload', async (req, res) => {
  try {
    const { title, content, tier, sourceType, sourceUrl, fileType } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    
    const result = await uploadDocument({
      title,
      content,
      tier,
      sourceType,
      sourceUrl,
      fileType,
    });
    
    res.json(result);
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

**Tests:**
- [ ] POST /api/knowledge/upload returns 200
- [ ] Document appears in database
- [ ] Invalid requests return 400

### Story 1.4: Document Chunking

**Task:** Split documents into chunks for embedding.

**Files to create:**
- `lib/knowledge/chunk.ts`

**Implementation:**
```typescript
// lib/knowledge/chunk.ts
export interface Chunk {
  content: string;
  charStart: number;
  charEnd: number;
  index: number;
}

export function chunkDocument(
  content: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;
  
  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    chunks.push({
      content: content.slice(start, end),
      charStart: start,
      charEnd: end,
      index,
    });
    start += chunkSize - overlap;
    index++;
  }
  
  return chunks;
}

export async function storeChunks(
  documentId: string,
  chunks: Chunk[]
): Promise<void> {
  const rows = chunks.map(chunk => ({
    document_id: documentId,
    chunk_index: chunk.index,
    content: chunk.content,
    char_start: chunk.charStart,
    char_end: chunk.charEnd,
  }));
  
  const { error } = await supabaseAdmin
    .from('document_chunks')
    .insert(rows);
    
  if (error) throw error;
}
```

**Tests:**
- [ ] Chunks have correct boundaries
- [ ] Overlap is correct
- [ ] Chunks stored in database

### Build Gate (Epic 1)
```bash
npm run build
npm test
# Verify: Documents upload, chunks stored
```

---

## Epic 2: Embedding Pipeline

**Goal:** Generate embeddings for documents and enable semantic search.

### Story 2.1: Batch Embedding Function

**Task:** Create function to embed document chunks.

**Files to create:**
- `lib/knowledge/embed.ts`

**Implementation:**
```typescript
// lib/knowledge/embed.ts
import { generateEmbedding } from '../embeddings';
import { supabaseAdmin } from '../supabase';

export async function embedDocument(documentId: string): Promise<void> {
  // Update status
  await supabaseAdmin
    .from('documents')
    .update({ embedding_status: 'processing' })
    .eq('id', documentId);

  try {
    // Get chunks
    const { data: chunks } = await supabaseAdmin
      .from('document_chunks')
      .select('id, content')
      .eq('document_id', documentId)
      .order('chunk_index');

    // Generate embeddings for each chunk
    for (const chunk of chunks || []) {
      const embedding = await generateEmbedding(chunk.content);
      
      await supabaseAdmin
        .from('embeddings')
        .insert({
          chunk_id: chunk.id,
          embedding: `[${embedding.join(',')}]`,
          model: 'text-embedding-004',
        });
    }

    // Also generate document-level embedding
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .single();

    const docEmbedding = await generateEmbedding(doc.content.slice(0, 10000));
    
    await supabaseAdmin
      .from('embeddings')
      .insert({
        document_id: documentId,
        embedding: `[${docEmbedding.join(',')}]`,
        model: 'text-embedding-004',
      });

    // Update status
    await supabaseAdmin
      .from('documents')
      .update({ embedding_status: 'complete' })
      .eq('id', documentId);

  } catch (error) {
    await supabaseAdmin
      .from('documents')
      .update({ 
        embedding_status: 'error',
        embedding_error: (error as Error).message,
      })
      .eq('id', documentId);
    throw error;
  }
}

export async function embedPendingDocuments(
  limit: number = 10
): Promise<{ processed: number; errors: string[] }> {
  const { data: pending } = await supabaseAdmin
    .from('documents')
    .select('id')
    .eq('embedding_status', 'pending')
    .limit(limit);

  const errors: string[] = [];
  let processed = 0;

  for (const doc of pending || []) {
    try {
      await embedDocument(doc.id);
      processed++;
    } catch (error) {
      errors.push(`${doc.id}: ${(error as Error).message}`);
    }
  }

  return { processed, errors };
}
```

**Tests:**
- [ ] Single document embeds successfully
- [ ] Batch processing works
- [ ] Error handling updates status

### Story 2.2: Embedding API Endpoint

**Task:** Create endpoint to trigger embedding.

**Files to modify:**
- `server.js`

**Implementation:**
```javascript
app.post('/api/knowledge/embed', async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (documentIds && documentIds.length > 0) {
      // Embed specific documents
      const errors = [];
      for (const id of documentIds) {
        try {
          await embedDocument(id);
        } catch (error) {
          errors.push(`${id}: ${error.message}`);
        }
      }
      return res.json({ processed: documentIds.length - errors.length, errors });
    }
    
    // Embed all pending
    const result = await embedPendingDocuments();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Embedding failed' });
  }
});
```

**Tests:**
- [ ] Endpoint triggers embedding
- [ ] Returns count of processed docs

### Story 2.3: Semantic Search Function

**Task:** Create search function using pgvector.

**Files to create:**
- `lib/knowledge/search.ts`

**Implementation:**
```typescript
// lib/knowledge/search.ts
import { generateEmbedding } from '../embeddings';
import { supabaseAdmin } from '../supabase';

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  similarity: number;
}

export async function searchDocuments(
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Call Supabase RPC function
  const { data, error } = await supabaseAdmin
    .rpc('search_documents', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: limit,
      match_threshold: threshold,
    });
  
  if (error) throw error;
  
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    snippet: row.content.slice(0, 200) + '...',
    similarity: row.similarity,
  }));
}
```

**Tests:**
- [ ] Search returns relevant results
- [ ] Similarity scores correct
- [ ] Threshold filters work

### Story 2.4: Search API Endpoint

**Task:** Create search endpoint.

**Files to modify:**
- `server.js`

**Implementation:**
```javascript
app.get('/api/knowledge/search', async (req, res) => {
  try {
    const { q, limit, threshold } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    const results = await searchDocuments(
      q,
      parseInt(limit) || 10,
      parseFloat(threshold) || 0.7
    );
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});
```

**Tests:**
- [ ] GET /api/knowledge/search?q=test works
- [ ] Returns matching documents

### Build Gate (Epic 2)
```bash
npm run build
npm test
# Verify: Embeddings generate, search returns results
```

---

## Epic 3: Clustering System

**Goal:** Cluster documents into suggested Hubs.

### Story 3.1: Install HDBSCAN

**Task:** Add clustering dependency.

**Commands:**
```bash
npm install hdbscan
```

### Story 3.2: Clustering Function

**Task:** Implement HDBSCAN clustering.

**Files to create:**
- `lib/knowledge/cluster.ts`

**Implementation:**
```typescript
// lib/knowledge/cluster.ts
import HDBSCAN from 'hdbscan';
import { supabaseAdmin } from '../supabase';

interface ClusterResult {
  hubsCreated: number;
  runId: string;
}

export async function clusterDocuments(
  minClusterSize: number = 3,
  minSamples: number = 2
): Promise<ClusterResult> {
  // Create pipeline run record
  const { data: run } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({ stage: 'cluster' })
    .select('id')
    .single();

  try {
    // Get all document embeddings
    const { data: embeddings } = await supabaseAdmin
      .from('embeddings')
      .select('document_id, embedding')
      .not('document_id', 'is', null);

    if (!embeddings || embeddings.length < minClusterSize) {
      throw new Error('Not enough documents for clustering');
    }

    // Parse embeddings
    const vectors = embeddings.map(e => 
      JSON.parse(e.embedding.replace(/^\[|\]$/g, '').split(',').map(Number))
    );
    const docIds = embeddings.map(e => e.document_id);

    // Run HDBSCAN
    const hdbscan = new HDBSCAN({
      minClusterSize,
      minSamples,
      metric: 'cosine',
    });
    
    const labels = hdbscan.fit(vectors);

    // Group by cluster
    const clusters = new Map<number, string[]>();
    labels.forEach((label, idx) => {
      if (label >= 0) { // -1 is noise
        if (!clusters.has(label)) clusters.set(label, []);
        clusters.get(label)!.push(docIds[idx]);
      }
    });

    // Create suggested hubs
    let hubsCreated = 0;
    for (const [clusterId, memberIds] of clusters) {
      // Compute centroid
      const memberVectors = memberIds.map(id => 
        vectors[docIds.indexOf(id)]
      );
      const centroid = computeCentroid(memberVectors);

      // Generate suggested title (simple keyword extraction for now)
      const suggestedTitle = await generateClusterTitle(memberIds);

      await supabaseAdmin
        .from('suggested_hubs')
        .insert({
          suggested_title: suggestedTitle,
          member_doc_ids: memberIds,
          centroid: `[${centroid.join(',')}]`,
          cluster_quality: computeSilhouette(memberVectors, centroid),
          algorithm: 'hdbscan',
          input_doc_count: embeddings.length,
        });

      hubsCreated++;
    }

    // Update run
    await supabaseAdmin
      .from('pipeline_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'complete',
        clusters_created: hubsCreated,
        documents_processed: embeddings.length,
      })
      .eq('id', run.id);

    return { hubsCreated, runId: run.id };

  } catch (error) {
    await supabaseAdmin
      .from('pipeline_runs')
      .update({
        status: 'error',
        errors: [(error as Error).message],
      })
      .eq('id', run.id);
    throw error;
  }
}

function computeCentroid(vectors: number[][]): number[] {
  const dims = vectors[0].length;
  const centroid = new Array(dims).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dims; i++) {
      centroid[i] += v[i] / vectors.length;
    }
  }
  return centroid;
}

function computeSilhouette(vectors: number[][], centroid: number[]): number {
  // Simplified quality metric
  let totalDist = 0;
  for (const v of vectors) {
    totalDist += cosineSimilarity(v, centroid);
  }
  return totalDist / vectors.length;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function generateClusterTitle(docIds: string[]): Promise<string> {
  // Get document titles
  const { data } = await supabaseAdmin
    .from('documents')
    .select('title')
    .in('id', docIds.slice(0, 5));

  // Simple: return common words
  const titles = (data || []).map(d => d.title);
  return `Hub: ${titles[0]?.split(' ').slice(0, 3).join(' ') || 'Untitled'}`;
}
```

**Tests:**
- [ ] Clustering runs without error
- [ ] Clusters have correct members
- [ ] Centroids computed correctly

### Story 3.3: Clustering API Endpoint

**Task:** Create endpoint to trigger clustering.

**Files to modify:**
- `server.js`

**Tests:**
- [ ] POST /api/knowledge/cluster works
- [ ] Returns hub count and run ID

### Build Gate (Epic 3)
```bash
npm run build
npm test
# Verify: Clustering creates suggested hubs
```

---

## Epic 4: Journey Synthesis

**Goal:** Generate journey paths through hubs.

### Story 4.1: Journey Synthesis Function

**Task:** Create path synthesis for each hub.

**Files to create:**
- `lib/knowledge/synthesize.ts`

**Implementation:** TSP-like ordering based on semantic similarity chains.

**Tests:**
- [ ] Journeys created for each hub
- [ ] Ordering makes semantic sense

### Story 4.2: Journey API Endpoint

**Task:** Create synthesis trigger endpoint.

**Tests:**
- [ ] POST /api/knowledge/synthesize works
- [ ] Returns journey count

### Build Gate (Epic 4)
```bash
npm run build
npm test
```

---

## Epic 5: /explore Integration

**Goal:** Make /explore use the new pipeline.

### Story 5.1: Create SupabaseKnowledgeProvider

**Task:** Implement KnowledgeProvider interface.

**Files to create:**
- `lib/knowledge/provider.ts`
- `lib/knowledge/supabase-provider.ts`

### Story 5.2: Create Context Endpoint

**Task:** Replacement for GCS context loading.

**Files to modify:**
- `server.js`

**Implementation:**
```javascript
app.post('/api/knowledge/context', async (req, res) => {
  const { message, lens, hubIds, tier1Budget, tier2Budget } = req.body;
  
  const provider = new SupabaseKnowledgeProvider();
  const result = await provider.getContext(message, {
    lens,
    hubIds,
    tier1Budget,
    tier2Budget,
  });
  
  res.json(result);
});
```

### Story 5.3: Update Chat Endpoint

**Task:** Use new provider for /explore routes.

**Files to modify:**
- `server.js` — Update /api/chat

**Tests:**
- [ ] /explore chat uses Supabase
- [ ] Context includes uploaded documents

### Build Gate (Epic 5)
```bash
npm run build
npm test
npx playwright test
```

---

## Epic 6: Pipeline Monitor Console

**Goal:** Create admin console for pipeline management with Quantum Glass styling.

### Story 6.0: Quantum Glass Token Integration

**Task:** Apply Quantum Glass design tokens to Bedrock shell for proper contrast and visual consistency with /explore.

**Context:** Bedrock primitives currently have low contrast. Import Quantum Glass tokens to align with Terminal/Explore visual language.

**Files to reference:**
- `src/surface/styles/` — Existing token definitions
- `tailwind.config.js` — Extended colors/opacity
- `src/explore/` components — Usage examples

**Files to modify:**
- `src/bedrock/primitives/BedrockLayout.tsx` — Apply glass background tokens
- `src/bedrock/primitives/BedrockNav.tsx` — Apply nav styling tokens
- `src/bedrock/primitives/BedrockInspector.tsx` — Apply panel tokens
- `src/bedrock/BedrockWorkspace.tsx` — Ensure token context available

**Implementation:**
```typescript
// Example: BedrockLayout.tsx
// Before: bg-gray-900
// After: bg-black/40 backdrop-blur-xl border border-white/10

// Apply token classes:
// - Backgrounds: bg-black/40, bg-white/5
// - Borders: border-white/10, border-white/5
// - Text: text-white/90, text-white/60, text-white/40
// - Hover: hover:bg-white/10
// - Focus: focus:ring-white/20
```

**Acceptance:**
- [ ] Bedrock shell has readable contrast
- [ ] Visual consistency with /explore Quantum Glass
- [ ] No hardcoded colors—all from token system

### Story 6.1: Console Scaffold

**Task:** Create Pipeline Monitor using Bedrock patterns with Quantum Glass styling.

**Files to create:**
- `src/bedrock/consoles/PipelineMonitor/PipelineMonitor.tsx`
- `src/bedrock/consoles/PipelineMonitor/pipeline.config.ts`

### Story 6.2: Upload Panel

**Task:** Drag-drop upload UI.

**Files to create:**
- `src/bedrock/consoles/PipelineMonitor/UploadPanel.tsx`

### Story 6.3: Processing Queue

**Task:** Show embedding status.

**Files to create:**
- `src/bedrock/consoles/PipelineMonitor/ProcessingQueue.tsx`

### Story 6.4: Hub Suggestions

**Task:** Display cluster results.

**Files to create:**
- `src/bedrock/consoles/PipelineMonitor/HubSuggestions.tsx`

### Story 6.5: Journey Preview

**Task:** Show synthesized paths.

**Files to create:**
- `src/bedrock/consoles/PipelineMonitor/JourneySynthesis.tsx`

### Story 6.6: Add Route

**Task:** Add /bedrock/pipeline route.

**Files to modify:**
- `src/bedrock/config/navigation.ts`
- `src/App.tsx`

### Build Gate (Epic 6)
```bash
npm run build
npm test
npx playwright test
```

---

## Final Sprint Gate

```bash
# All tests pass
npm test
npx playwright test

# Build succeeds
npm run build

# Key scenarios work:
# 1. Upload document → appears in queue
# 2. Trigger embedding → status updates
# 3. Trigger clustering → hubs appear
# 4. /explore query → uses Supabase context
# 5. Pipeline Monitor → shows all status
```
