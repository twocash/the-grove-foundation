# Product Brief: MCP Knowledge Provider

**Version:** 1.0
**Status:** Draft
**Priority:** Unprioritized
**Author:** UX Chief
**Date:** 2026-01-17

---

## Executive Summary

Enable Grove to consume knowledge from multiple data sources via Model Context Protocol (MCP), transforming the platform from a single-domain research tool into a **multi-field knowledge infrastructure**. This extends the existing tiered RAG system with a pluggable provider architecture, allowing operators to connect local or remote MCP servers as knowledge backends.

## Problem Statement

Grove's knowledge infrastructure is currently coupled to GCS file storage. While the architecture is declaratively designed (manifest-driven, tag-based routing), operators cannot:

1. Connect alternative knowledge sources without code changes
2. Use local MCP servers for specialized domains
3. Mix knowledge from multiple providers in a single deployment
4. Configure knowledge sources through the UI

**User Impact:** Organizations wanting to deploy Grove for their own knowledge domains must either fork the codebase or manually edit JSON manifests.

## Proposed Solution

Introduce **KnowledgeProvider** as a first-class System Object in the ExperienceConsole, enabling declarative configuration of MCP-backed knowledge sources alongside existing GCS storage.

### User Value Proposition

- **Operators** can connect any MCP-compliant knowledge source through the UI
- **Researchers** access domain-specific knowledge without platform changes
- **Organizations** deploy Grove for internal knowledge bases (legal, medical, engineering, etc.)

### Strategic Value

This advances Grove's core thesis: **infrastructure for discovery, not systems that converge on "correct" answers**. By enabling epistemological pluralism at the infrastructure level, different knowledge communities can coexist with their own sources, models, and quality standards.

---

## Architectural Context

### What's Already in Place (No Changes Needed)

| Component | Location | DEX Status |
|-----------|----------|------------|
| **Tiered RAG System** | `src/core/engine/ragLoader.ts` | ✅ Manifest-driven |
| **Topic Router** | `src/core/engine/topicRouter.ts` | ✅ Tag-based, declarative |
| **TopicHub Schema** | `src/core/schema/narrative.ts` | ✅ Extensible interface |
| **File Resolution** | `ragLoader.resolveFilePath()` | ✅ Abstracted storage |
| **Cache Invalidation** | `invalidateManifestCache()` | ✅ Event-driven updates |

### The Missing Layer: Provider Abstraction

```
Current Architecture:
┌─────────────────┐     ┌──────────────┐
│   RAG Loader    │────▶│     GCS      │
└─────────────────┘     └──────────────┘

Proposed Architecture:
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│   RAG Loader    │────▶│  KnowledgeProvider   │────▶│     GCS      │
└─────────────────┘     │     (Interface)      │     ├──────────────┤
                        └──────────────────────┘     │     MCP      │
                                                     ├──────────────┤
                                                     │   Supabase   │
                                                     └──────────────┘
```

### Key Extension Points

**1. TopicHub Interface Extension:**
```typescript
interface TopicHub {
  // Existing fields...

  // NEW: Provider configuration
  providerType?: 'gcs' | 'mcp' | 'supabase' | 'local';
  providerConfig?: {
    // MCP-specific
    serverUri?: string;
    resourcePath?: string;
    authMethod?: 'none' | 'token' | 'oauth';

    // Supabase-specific
    table?: string;
    contentColumn?: string;

    // Local-specific
    basePath?: string;
  };
}
```

**2. KnowledgeProvider Interface:**
```typescript
interface KnowledgeProvider {
  type: string;

  // Core operations
  loadManifest(): Promise<HubsManifest>;
  loadFile(path: string, hub: TopicHub): Promise<FileContent>;
  searchDocs?(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  // Lifecycle
  initialize(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  invalidateCache?(): void;
}
```

**3. Provider Registry (System Object Pattern):**
```typescript
// Follows ExperienceConsole factory pattern
const knowledgeProviderRegistry = {
  'gcs': GCSKnowledgeProvider,
  'mcp': MCPKnowledgeProvider,
  'supabase': SupabaseKnowledgeProvider,
  'local': LocalKnowledgeProvider,
};
```

---

## Scope

### In Scope (v1.0)

- [ ] `KnowledgeProvider` interface definition in `src/core/schema/`
- [ ] `MCPKnowledgeProvider` implementation
- [ ] `GCSKnowledgeProvider` refactor (extract from ragLoader)
- [ ] Provider registry in ExperienceConsole
- [ ] UI for configuring MCP connection (server URI, auth)
- [ ] Hub-level provider assignment in TopicHub editor
- [ ] Health check / connection test in UI

### Explicitly Out of Scope

- **Real-time sync** - MCP sources are read on query, not streamed (defer to v2)
- **Write-back** - Grove reads from MCP, doesn't write (preserves source of truth)
- **Provider marketplace** - No community provider sharing (organizational feature)
- **Hybrid routing** - Single provider per hub (multi-provider query fan-out is v2)

---

## User Flows

### Flow 1: Add MCP Knowledge Source

1. Operator opens ExperienceConsole → System Objects
2. Clicks "New" → selects "Knowledge Provider"
3. Selects provider type: "MCP Server"
4. Enters connection details:
   - Server URI: `mcp://localhost:8080`
   - Resource path: `/knowledge/legal-corpus`
   - Auth: None / Token / OAuth
5. Clicks "Test Connection" → sees health status
6. Saves provider configuration
7. System creates `KnowledgeProvider` object in Supabase

### Flow 2: Assign Provider to Knowledge Hub

1. Operator opens existing TopicHub in editor
2. Scrolls to "Data Source" section
3. Selects provider from dropdown (shows configured providers)
4. Optionally overrides resource path for this hub
5. Saves hub configuration
6. RAG loader now fetches this hub's content from MCP

### Flow 3: Query Routed to MCP Hub

1. User asks question in /explore
2. Topic router scores query against all hubs (unchanged)
3. Matched hub has `providerType: 'mcp'`
4. RAG loader calls `MCPKnowledgeProvider.loadFile()`
5. MCP server returns content
6. Content injected into Gemini context (unchanged)
7. Response generated with MCP-sourced knowledge

---

## Technical Considerations

### Architecture Alignment

- **GroveObject Model**: KnowledgeProvider becomes a System Object type
- **ExperienceConsole Factory**: Provider editor uses existing card/editor pattern
- **Supabase Storage**: Provider configs stored in `system_objects` table
- **No GCS for Config**: Follows v1.0 pattern (Supabase, not files)

### Hybrid Cognition Requirements

- **Local (routine):** Provider health checks, cache management
- **Cloud (pivotal):** Query routing decisions, context assembly

### Dependencies

- ExperienceConsole System Objects section (exists)
- TopicHub editor (exists)
- MCP client library (new dependency)
- Server-side MCP connection handler (new)

### Security Considerations

- MCP auth tokens stored encrypted in Supabase
- Provider connections validated before save
- Rate limiting on MCP calls to prevent abuse
- Audit log for provider access

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|---------------|----------|
| **Declarative Sovereignty** | Provider config in Supabase, not code | Operators add MCP sources without deploys |
| **Capability Agnosticism** | Provider interface abstracts implementation | Same RAG loader works with any provider |
| **Provenance as Infrastructure** | Hub tracks `providerType` and source | Every context snippet traceable to origin |
| **Organic Scalability** | Registry pattern supports unlimited providers | New provider types added via registration |

---

## Advisory Council Input

### Consulted Advisors

- **Park (feasibility):** MCP is a standard protocol; client implementation straightforward. Latency concern for remote MCP servers - recommend connection pooling and aggressive caching.

- **Adams (engagement):** Different knowledge domains enable different "worlds" - each with their own drama and discovery. This is narratively powerful.

- **Benet (architecture):** Provider abstraction aligns with content-addressed principles. Consider content hashing for cache keys regardless of provider.

### Known Tensions

| Tension | Resolution |
|---------|------------|
| **Latency vs. Freshness** | Default 5-min cache TTL (configurable per provider) |
| **Security vs. Accessibility** | Auth required for remote MCP; local can be auth-free |
| **Simplicity vs. Power** | v1.0 is single-provider-per-hub; fan-out deferred |

---

## Success Metrics

- **Configuration Success Rate:** >95% of MCP connections succeed on first test
- **Query Latency:** <500ms additional latency for MCP vs GCS sources
- **Adoption:** 3+ distinct knowledge domains configured within 30 days of launch
- **Zero Code Deploys:** Operators can add knowledge sources without engineering

---

## UX Chief Notes

### Substrate Potential (Excellent)

This feature creates **fertile soil** for future agentic work:

1. **Agent-Managed Knowledge:** Agents could dynamically connect to relevant MCP servers based on task context
2. **Knowledge Federation:** Multiple Grove instances sharing knowledge via MCP
3. **Specialized Vines:** Different AI models accessing domain-specific knowledge through the same interface
4. **Research Collaboration:** Academic institutions connecting their knowledge bases to shared Grove infrastructure

### Architectural Integrity

The proposed design:
- ✅ Extends existing abstractions (doesn't replace)
- ✅ Follows ExperienceConsole patterns (not custom UI)
- ✅ Uses Supabase for config (not GCS files)
- ✅ Preserves RAG loader interface (only adds provider param)
- ✅ Maintains cache invalidation protocol

### Drift Risk: LOW

No references to frozen zones. All work in:
- `/bedrock/consoles/ExperienceConsole` (active)
- `src/core/engine/ragLoader.ts` (active, pure TS)
- `src/core/schema/` (active, pure TS)

---

## Appendix: Implementation Sketch

### Phase 1: Core Interface (1 sprint)
- Define `KnowledgeProvider` interface
- Extract `GCSKnowledgeProvider` from ragLoader
- Add provider param to `buildTieredContext()`

### Phase 2: MCP Implementation (1 sprint)
- Implement `MCPKnowledgeProvider`
- Add MCP client dependency
- Server-side connection handler

### Phase 3: UI Integration (1 sprint)
- KnowledgeProvider System Object type
- Provider editor component
- TopicHub provider selector
- Connection test UI

### Phase 4: Polish (0.5 sprint)
- Error handling and retry logic
- Metrics and observability
- Documentation

**Estimated Total:** 3.5 sprints

---

**Status:** Ready for roadmap placement
**Recommended Priority:** Medium (enables platform extensibility)
**Dependencies:** None (builds on existing infrastructure)
