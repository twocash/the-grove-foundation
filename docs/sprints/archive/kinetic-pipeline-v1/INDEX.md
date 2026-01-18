# Sprint: kinetic-pipeline-v1

**The Organic Knowledge Pipeline**

> Documents don't define structure—structure emerges from documents.

---

## Sprint Artifacts

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Full specification with schema and API design |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture and data flows |
| [DECISIONS.md](./DECISIONS.md) | Architectural decision records (ADRs) |
| [SPRINTS.md](./SPRINTS.md) | Epic and story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Handoff for execution agent |
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Existing code analysis |
| [DEVLOG.md](./DEVLOG.md) | Development progress log |

---

## Quick Reference

### The Pipeline

```
Upload → Embed → Cluster → Synthesize → Serve
   ↓        ↓        ↓          ↓          ↓
Supabase  Gemini  HDBSCAN   Semantic   /explore
  docs    768-dim  → Hubs    → Paths    context
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `documents` | Source documents with tiers |
| `document_chunks` | Text chunks for embedding |
| `embeddings` | pgvector storage |
| `suggested_hubs` | Clustering output |
| `suggested_journeys` | Path synthesis output |

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/knowledge/upload` | Ingest documents |
| `POST /api/knowledge/embed` | Generate embeddings |
| `POST /api/knowledge/cluster` | Compute hubs |
| `GET /api/knowledge/search` | Semantic search |
| `POST /api/knowledge/context` | RAG context (replaces GCS) |

### Strangler Fig

| Route | Pipeline |
|-------|----------|
| `/explore/*` | **NEW** (Supabase) |
| `/terminal/*` | **NEW** (Supabase) |
| `/genesis/*` | OLD (GCS) |

---

## Dependencies

**Internal:**
- `lib/supabase.js` — Existing client ✅
- `lib/embeddings.js` — Existing Gemini integration ✅
- Bedrock primitives — From bedrock-foundation-v1 ✅

**External:**
- Supabase pgvector extension ✅
- HDBSCAN npm package (to install)
- Gemini API access ✅

---

## Timeline

| Week | Focus |
|------|-------|
| 1 | Schema + Upload |
| 2 | Embedding pipeline + Search |
| 3 | Clustering |
| 4 | Journey synthesis + /explore integration |
| 5 | Pipeline Monitor console |
| 6 | Polish + override system |

---

## Success Metrics

- [ ] Documents upload and persist
- [ ] Embeddings generate correctly
- [ ] Clustering suggests ≥3 hubs
- [ ] Search returns relevant results
- [ ] /explore uses new pipeline
- [ ] Pipeline Monitor shows status
