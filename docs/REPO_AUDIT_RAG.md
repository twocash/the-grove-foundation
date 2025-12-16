# RAG System Audit Report

> Generated: 2025-12-16
> Sprint: Topic Hub RAG Architecture
> Auditor: Claude Code (Opus)

---

## Executive Summary

The current RAG system loads **all knowledge files alphabetically until hitting a 50KB limit**. This wastes ~90% of context on irrelevant content and truncates valuable information. Topic Hubs exist with `primarySource` and `supportingSources` fields that are **never used for RAG loading**.

**Key Gap:** `topicRouter.routeToHub()` works but its result is discarded - no hub-aware context loading exists.

---

## 1. Current GCS Knowledge Inventory

**Bucket:** `gs://grove-assets/knowledge/`
**Total:** 21 files, 570,828 bytes (557.45 KB)

| File | Size (bytes) | Recommended Hub |
|------|--------------|-----------------|
| The Grove A World-Changing Play for Distributed In 2c6780a78eef818eb98dd32985aa2182.md | 212,826 | (skip - too large) |
| The Grove Condensed A World Changing Play for Dist 2c7780a78eef803fa6efc0a79568e670.md | 59,533 | _default |
| Grove Technical Architecture Reference 2c8780a78eef809990c9d57ff81e5b1a.md | 34,042 | technical-arch |
| The Grove Engagement Research Brief 2c7780a78eef806c8fa2e6ab6f4dbe31.md | 33,432 | university-path |
| The Grove Simulation Deep Dive 2c7780a78eef801bae5cf150f185fc0b.md | 25,512 | observer-dynamic |
| Why Edge Intelligence Is the Structural Answer to 2c9780a78eef8061a56efa68c190cbe4.md | 22,928 | ratchet-effect |
| The Grove Economics Deep Dive 2c7780a78eef8109bd04c172e7ce8c88.md | 20,659 | infrastructure-bet |
| The Grove Core Concepts The Ratchet Deep Dive 2c7780a78eef80e2acfbd49b84359d33.md | 20,391 | ratchet-effect |
| Distributed Edge Infrastructure Implications for G 2c8780a78eef80dfa4b6fbefd38f0eec.md | 17,276 | infrastructure-bet |
| The Grove Terminal A Deep Dive 2c7780a78eef8063b753fdc1d65fd720.md | 15,843 | meta-philosophy |
| The Grove Distributed Systems Advances for Decentr 2c7780a78eef80008eb7e8630bed1f71.md | 14,570 | technical-arch |
| The Grove as Distributed Infrastructure Provider 2c8780a78eef800ab8edca41bcb5f5dd.md | 13,947 | infrastructure-bet |
| The Grove Diary System Deep Dive 2c7780a78eef80d38ac8e257a3e9d00d.md | 13,542 | diary-system |
| TL;DR Version The Grove Infrastructure for Distrib 2c6780a78eef80ec974cdddff1b7dc40.md | 12,589 | _default |
| Chinese Open-Source AI Ratchet Acceleration Eviden 2c9780a78eef80b499e1c7bd0eb962f7.md | 11,253 | ratchet-effect |
| Purdue Grove Strategic Proposal 2c6780a78eef804fa185e20d10ef1fb1.md | 9,832 | university-path |
| Grove White Paper Key Concepts, Novel Methods, and 2c6780a78eef80e1a38debb983d726b2.md | 9,300 | _default |
| The Grove A World Changing Play for Distributed In 2c7780a78eef80b6b4f7ceb3f3c94c73.md | 6,900 | (duplicate?) |
| The Ratchet Quantitative Analysis 2c6780a78eef80ce84b4d5a3c0a18b7d.md | 6,868 | ratchet-effect |
| The Grove as Everyday AI Infrastructure 2c7780a78eef806c8705dcd5605f6177.md | 5,912 | cognitive-split |
| The Ratchet Thesis 2c6780a78eef801384aef0e135d8109c.md | 3,673 | ratchet-effect |

---

## 2. Current RAG Loading Logic

### Location: `server.js:711-742`

```javascript
// server.js:711
const MAX_RAG_CONTEXT_BYTES = 50000;

// server.js:713-742
async function fetchRagContext() {
    try {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: 'knowledge/' });
        const textFiles = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.txt'));

        let combinedContext = "";
        let totalBytes = 0;

        for (const file of textFiles) {
            const [content] = await file.download();
            const contentStr = content.toString();

            // Stop if we'd exceed the limit
            if (totalBytes + contentStr.length > MAX_RAG_CONTEXT_BYTES) {
                console.log(`RAG context limit reached at ${totalBytes} bytes, skipping remaining files`);
                break;
            }

            const filename = file.name.replace('knowledge/', '');
            combinedContext += `\n\n--- SOURCE: ${filename} ---\n${contentStr}`;
            totalBytes += contentStr.length;
        }

        console.log(`RAG context loaded: ${totalBytes} bytes (~${Math.round(totalBytes / 4)} tokens)`);
        return combinedContext || STATIC_KNOWLEDGE_BASE;
    } catch (error) {
        console.error("Failed to fetch RAG context:", error.message);
        return STATIC_KNOWLEDGE_BASE;
    }
}
```

### Problems Identified

1. **Alphabetical Loading** - Files sorted alphabetically by GCS, not by relevance
2. **No Topic Awareness** - User query is never analyzed for topic matching
3. **Hard Truncation** - First ~50KB loaded, rest discarded
4. **No Caching** - Every new session re-downloads all files
5. **No Manifest** - No declarative control over what loads when

### Current Loading Order (Alphabetical)
1. Chinese Open-Source AI Ratchet... (11,253 bytes) ✓
2. Distributed Edge Infrastructure... (17,276 bytes) ✓
3. Grove Technical Architecture... (34,042 bytes) → **STOPS HERE** (62,571 > 50,000)

**Result:** Only 2 files loaded, neither may match user's query.

---

## 3. TopicHub Schema Analysis

### Location: `src/core/schema/narrative.ts:97-111`

```typescript
export interface TopicHub {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  enabled: boolean;
  primarySource: string;        // ← NEVER USED FOR RAG
  supportingSources: string[];  // ← NEVER USED FOR RAG
  expertFraming: string;
  keyPoints: string[];
  commonMisconceptions?: string[];
  personaOverrides?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
```

### Current Hub Definitions: `src/core/config/defaults.ts:151-244`

| Hub ID | primarySource | supportingSources | Status |
|--------|---------------|-------------------|--------|
| ratchet-effect | Grove_Ratchet_Deep_Dive | ['METR_research', 'hardware_data'] | **Not Wired** |
| infrastructure-bet | Grove_Economics_Deep_Dive | [] | **Not Wired** |
| cognitive-split | Hierarchical_Reasoning_Grove_Brief | [] | **Not Wired** |
| observer-dynamic | Grove_Simulation_Deep_Dive | ['An_Ethical_Critique_Shannon_Vallor'] | **Not Wired** |
| meta-philosophy | you-are-already-here | ['ARCHITECTURE_EVENT_DRIVEN'] | **Not Wired** |

**Status:** 5 hubs defined in code. Manifest draft has 8 hubs (adds diary-system, technical-arch, governance).

---

## 4. Topic Router Analysis

### Location: `src/core/engine/topicRouter.ts`

**Functions Available:**
- `routeToHub(query, hubs)` → Returns best matching `TopicHub | null` (line 60-67)
- `getMatchDetails(query, hubs)` → Returns all matches with scores (line 72-77)
- `buildHubEnhancedPrompt(basePrompt, hub, personaId?)` → Injects expert framing (line 83-117)

**Integration Status:** None of these functions are imported or called in `server.js`.

### server.js Imports (line 1-20)
```javascript
// NO import of topicRouter
// NO import of anything from src/core/
```

---

## 5. System Prompt Construction

### Location: `server.js:672-706`

```javascript
function buildSystemPrompt(options = {}) {
    const {
        baseSystemPrompt = FALLBACK_SYSTEM_PROMPT,
        personaTone = '',
        sectionContext = '',
        ragContext = '',
        terminatorMode = false
    } = options;

    const parts = [baseSystemPrompt];
    // ... adds personaTone, sectionContext, terminatorMode ...

    // Add knowledge base
    const knowledgeBase = ragContext || STATIC_KNOWLEDGE_BASE;
    parts.push(`\n\n**KNOWLEDGE BASE:**\n${knowledgeBase}`);

    return parts.join('');
}
```

**Gap:** No `hubId` or `topicHub` parameter. No hub-enhanced prompt injection.

---

## 6. fetchRagContext Call Sites

| Location | Context | Notes |
|----------|---------|-------|
| server.js:776 | POST /api/chat (new session) | No hub parameter |
| server.js:937 | Initialize chat endpoint | No hub parameter |

Both call `fetchRagContext()` with no arguments. No topic awareness.

---

## 7. Admin Narrative Endpoint (Cache Invalidation Point)

### Location: `server.js:459-494`

```javascript
app.post('/api/admin/narrative', async (req, res) => {
    // ... validation ...
    const file = storage.bucket(BUCKET_NAME).file('narratives.json');
    await file.save(JSON.stringify(graphData, null, 2), {
        contentType: 'application/json',
        metadata: { cacheControl: 'public, max-age=0, no-transform' }
    });
    res.json({ success: true, message: "Narrative graph updated" });
    // ❌ NO CACHE INVALIDATION
});
```

**Gap:** Per ADR event-driven patterns, should invalidate RAG cache here.

---

## 8. Pre-existing Files (Found via Sync Check)

Files existed in main repo working directory (uncommitted), copied to worktree:

| File | Status | Content |
|------|--------|---------|
| `docs/knowledge/hubs-manifest-draft.json` | ✓ Found | 8-hub manifest draft |
| `docs/knowledge/you-are-already-here.md` | ✓ Found | Meta-philosophy reveal (11KB) |
| `docs/ARCHITECTURE_EVENT_DRIVEN.md` | ✓ Found | Event-driven patterns doc |
| `src/core/config/defaults.ts` | ✓ Updated | Contains observer-dynamic, meta-philosophy hubs |

---

## 9. Recommendations

### Immediate Actions (Phase 1)

1. **Create `src/core/schema/rag.ts`** - HubsManifest type definitions
2. **Create `knowledge/hubs.json`** - Declarative manifest in GCS (start from draft)
3. **Add 3 remaining hubs** to defaults.ts (manifest has 8, code has 5):
   - diary-system
   - technical-arch
   - governance

### Server Changes (Phase 3)

1. **Modify `fetchRagContext()`** to accept `hubId?: string` parameter
2. **Import and use `routeToHub()`** from topicRouter
3. **Add manifest cache** with event-driven invalidation
4. **Wire cache invalidation** to POST /api/admin/narrative

### Content Generation (Phase 2)

1. **Generate Tier 1 defaults** (~15KB total):
   - grove-overview.md (5KB)
   - key-concepts.md (5KB)
   - visionary-narrative.md (5KB)

2. **Reorganize GCS** into:
   ```
   knowledge/
   ├── _default/
   │   ├── grove-overview.md
   │   ├── key-concepts.md
   │   └── visionary-narrative.md
   ├── hubs/
   │   ├── ratchet-effect/
   │   ├── infrastructure-bet/
   │   └── ...
   └── hubs.json
   ```

---

## 10. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Default context size | 50KB (truncated) | 15KB |
| Hub-specific context | N/A | 20-40KB per hub |
| Total possible context | 50KB fixed | 15KB + 40KB = 55KB max |
| Relevance | ~10% (alphabetical) | ~100% (topic-matched) |
| Token efficiency | ~12,500 tokens | ~6,000-14,000 tokens |

---

## Appendix: File Citations

| Claim | File | Lines |
|-------|------|-------|
| MAX_RAG_CONTEXT_BYTES = 50000 | server.js | 711 |
| fetchRagContext() definition | server.js | 713-742 |
| TopicHub interface | src/core/schema/narrative.ts | 97-111 |
| primarySource/supportingSources | src/core/schema/narrative.ts | 103-104 |
| DEFAULT_TOPIC_HUBS (3 hubs) | src/core/config/defaults.ts | 151-206 |
| routeToHub() | src/core/engine/topicRouter.ts | 60-67 |
| buildHubEnhancedPrompt() | src/core/engine/topicRouter.ts | 83-117 |
| buildSystemPrompt() | server.js | 672-706 |
| POST /api/admin/narrative | server.js | 459-494 |
| ADR-008 Shim Strategy | docs/DECISIONS.md | 342-391 |
