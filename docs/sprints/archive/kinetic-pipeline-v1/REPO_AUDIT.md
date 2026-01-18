# Repository Audit: kinetic-pipeline-v1

**Sprint:** kinetic-pipeline-v1  
**Date:** December 30, 2025  
**Auditor:** Claude (Foundation Loop Phase 1)

---

## Purpose

This audit documents the existing codebase relevant to building the Kinetic Pipeline—the organic knowledge system that replaces static GCS files with a dynamic, MCP-served, Supabase-backed knowledge graph.

---

## Existing Infrastructure

### Supabase Client

**Location:** `lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export { supabaseAdmin };
```

**Status:** ✅ Ready to use  
**Notes:** Service role client for server-side operations. Credentials via environment.

---

### Embedding Generation

**Location:** `lib/embeddings.js`

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const truncatedText = text.slice(0, 10000);
  const result = await model.embedContent(truncatedText);
  return result.embedding.values;  // 768 dimensions
}

export async function generateSproutEmbedding(query, response) {
  const combinedText = `Query: ${query}\n\nResponse: ${response}`;
  return generateEmbedding(combinedText);
}
```

**Status:** ✅ Ready to use  
**Notes:** Uses Gemini text-embedding-004 (768 dimensions). Already handles text truncation.

---

### Current RAG Loader

**Location:** `src/core/engine/ragLoader.ts`

**Key exports:**
- `buildTieredContext()` — Main loading function
- `loadManifest()` — Cached manifest from GCS
- `invalidateManifestCache()` — Cache invalidation
- `fetchRagContextLegacy()` — Backward-compatible shim

**Architecture:**
```
GCS Bucket (grove-assets)
├── knowledge/
│   ├── hubs.json (manifest)
│   ├── _default/ (Tier 1 files)
│   └── hubs/{id}/ (Tier 2 files)
```

**Flow:**
1. Load manifest from GCS (cached 5 min)
2. Load Tier 1 files (default context, ~15KB)
3. If query matches hub tags → load Tier 2 files (~20-40KB)
4. Combine and return context string

**Status:** 🔄 To be replaced (strangler fig pattern)  
**Notes:** Well-structured. New pipeline should match interface while changing source.

---

### RAG Schema Types

**Location:** `src/core/schema/rag.ts`

```typescript
interface HubConfig {
  id: string;
  title: string;
  path: string;
  primaryFile: string;
  supportingFiles: string[];
  maxBytes?: number;
  tags?: string[];
}

interface HubsManifest {
  version: string;
  defaultContext: {
    path: string;
    files: string[];
    maxBytes?: number;
  };
  hubs: Record<string, HubConfig>;
  _meta?: {
    gcsFileMapping?: Record<string, string>;
  };
}

interface TieredContextResult {
  context: string;
  tier1Bytes: number;
  tier2Bytes: number;
  totalBytes: number;
  matchedHub: string | null;
  filesLoaded: string[];
  matchedTags?: string[];
}

interface TieredContextOptions {
  message: string;
  contextHubs?: string[];
  tier1Budget?: number;
  tier2Budget?: number;
  autoDetectHubs?: boolean;
}
```

**Status:** ✅ Good reference for new schema design

---

### Topic Router

**Location:** `src/core/engine/topicRouter.ts`

**Key functions:**
- `routeToHub(message, hubs)` — Match message to hub via tags
- `getMatchDetails(message, hubs)` — Debug info for matches

**Status:** 🔄 May be replaced by semantic search  
**Notes:** Current approach uses keyword matching. New pipeline can use embeddings.

---

### Bedrock Infrastructure

**Location:** `src/bedrock/`

```
src/bedrock/
├── BedrockWorkspace.tsx         # Main workspace with providers
├── context/
│   ├── BedrockUIContext.tsx     # UI state (selectedItem, inspector)
│   └── BedrockCopilotContext.tsx # Copilot messages/actions
├── primitives/
│   ├── BedrockLayout.tsx        # Three-column layout
│   ├── BedrockNav.tsx           # Navigation tree
│   ├── BedrockInspector.tsx     # Inspector with Copilot slot
│   └── BedrockCopilot.tsx       # AI assistant panel
├── consoles/
│   ├── BedrockDashboard.tsx     # Dashboard overview
│   ├── GardenConsole.tsx        # Placeholder for Sprout management
│   └── LensWorkshop.tsx         # Placeholder for Lens editing
├── config/
│   ├── navigation.ts            # Declarative nav items
│   ├── copilot-actions.ts       # Context-aware actions
│   └── sprout-manifests.ts      # Sprout type definitions
└── types/
    └── sprout.ts                # Sprout type interfaces
```

**Status:** ✅ In progress (Epic 1 complete)  
**Notes:** Pipeline Monitor console will follow these patterns.

---

### Sprout Lifecycle Schema

**Location:** `src/bedrock/types/sprout.ts` (emerging from bedrock-foundation-v1)

**Lifecycle stages:**
```
Seed → Sprout (tender → rooting → branching) → Sapling → Tree → Grove
```

| Stage | Description | Where in Pipeline |
|-------|-------------|-------------------|
| Seed | Raw LLM output | Ephemeral |
| Sprout (tender) | Just captured | Capture flow |
| Sprout (rooting) | Research phase | Agent processing |
| Sprout (branching) | Growing connections | Graph integration |
| Sapling (hardened) | Validated | **RAG entry point** |
| Tree (grafted) | Connected to graph | Full graph integration |
| Tree (established) | Shapes responses | Active in RAG |
| Grove | Network-wide | Knowledge Commons |

**Status:** 🔄 Schema being defined in bedrock-foundation-v1  
**Notes:** Bulk uploads enter at Sapling tier.

---

### Quantum Interface (Lens System)

**Location:** `src/surface/hooks/useQuantumInterface.ts`, `src/data/quantum-content.ts`

**Pattern:** Content exists in superposition until lens selection collapses it.

**Relevance:** Pipeline will support lens-filtered graph queries via `?lens=X` parameters.

---

## Files to Create

### MCP Server (New)

```
lib/mcp/
├── grove-mcp-knowledge.ts    # Main MCP server
├── tools/
│   ├── ingest.ts             # upload_document, batch_upload, set_tier
│   ├── pipeline.ts           # embed_document, recompute_clusters, synthesize_journeys
│   ├── read.ts               # get_graph, get_journey, search, explain_path
│   └── customize.ts          # apply_lens, set_constraint, get_experience
└── types.ts                  # MCP tool schemas
```

### Supabase Schema (New)

```sql
-- Core tables
documents                     -- Source documents with metadata
document_chunks               -- Text chunks for embedding
embeddings                    -- pgvector storage
sprout_lifecycle              -- Stage tracking with provenance

-- Computed structures
suggested_hubs               -- Clustering output
suggested_journeys           -- Path synthesis output
hub_overrides               -- Admin constraints
journey_constraints          -- Journey rules

-- Graph
knowledge_edges             -- Document relationships
```

### Pipeline Monitor Console (New)

```
src/bedrock/consoles/PipelineMonitor/
├── PipelineMonitor.tsx       # Main console
├── UploadPanel.tsx           # Document upload UI
├── QueueStatus.tsx           # Processing queue
├── ClusterVisualization.tsx  # Hub suggestions
├── JourneySynthesis.tsx      # Journey suggestions
└── pipeline.config.ts        # Console config
```

---

## Integration Points

### Current API Endpoints (server.js)

| Endpoint | Purpose | Pipeline Impact |
|----------|---------|-----------------|
| POST /api/chat | LLM conversation | Will use new RAG |
| POST /api/sprouts | Save sprouts | Already uses Supabase |
| GET /api/health | Health checks | Add pipeline status |

### New API Endpoints Needed

| Endpoint | Purpose |
|----------|---------|
| POST /api/knowledge/upload | Document ingestion |
| POST /api/knowledge/embed | Trigger embedding |
| GET /api/knowledge/graph | Graph query |
| GET /api/knowledge/search | Semantic search |
| POST /api/knowledge/override | Apply admin constraint |

---

## Environment Variables

**Existing (confirmed):**
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key
- `GEMINI_API_KEY` — Gemini API key
- `GCS_BUCKET_NAME` — GCS bucket (legacy, keep for fallback)

**New (none required):**
- All credentials already available

---

## Pattern Compliance Check

| Pattern | Status | Notes |
|---------|--------|-------|
| Declarative Sovereignty | ✅ | Pipeline config via JSON, not code |
| Capability Agnosticism | ✅ | Works with any embedding model |
| Provenance as Infrastructure | ✅ | Full tracking in Supabase |
| Organic Scalability | ✅ | Structure emerges from content |

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| GCS → Supabase migration breaks existing | High | Strangler fig: /explore uses new, /genesis stays on GCS |
| Embedding costs | Low | Gemini is cheap; batch during off-hours |
| Clustering quality | Medium | Start simple (HDBSCAN), iterate |
| MCP server complexity | Medium | Start with 3-4 core tools, expand later |

---

## Conclusion

The infrastructure is ready:
- ✅ Supabase client exists
- ✅ Gemini embeddings exist  
- ✅ Bedrock console patterns established
- 🔄 RAG loader provides interface template
- 🔄 Sprout lifecycle defines document tiers

**Ready to proceed with SPEC.md**
