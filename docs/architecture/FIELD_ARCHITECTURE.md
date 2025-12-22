# Field Architecture

*Knowledge Domains, Namespaced Entities, and the Attribution Economy*

**Status:** Architectural Specification  
**Version:** 1.0  
**Last Updated:** December 2024

---

## Executive Summary

Fields are the fundamental organizational unit for knowledge exploration in Grove. A Field represents a bounded knowledge domain—a curated collection of documents, configured exploration tools, and accumulated insights. This architecture enables multi-domain exploration while maintaining clear provenance, supporting the Knowledge Commons attribution economy, and preventing configuration collision.

**Key Principles:**
1. Fields are self-contained knowledge workspaces
2. Entities within Fields are namespaced to preserve origin
3. Composite Fields merge parent Fields without losing provenance
4. Attribution flows upstream through the Knowledge Commons
5. MVP implements single-Field UX with multi-Field-ready schema

---

## Part 1: Field Fundamentals

### What is a Field?

A Field is a knowledge domain with:
- **RAG Collection:** Vector-indexed documents forming the knowledge base
- **Exploration Tools:** Configured Nodes, Journeys, Lenses, Card Definitions
- **Captured Insights:** Sprouts generated through exploration
- **Access Control:** Private, organizational, or public visibility
- **Attribution Metadata:** Creator, contributors, fork lineage

### Field Hierarchy

```
Grove Platform
└── User/Organization
    └── Fields
        ├── Field: "The Grove Foundation" (public)
        │   ├── RAG: White papers, research, architecture docs
        │   ├── Nodes: Concepts extracted from Grove docs
        │   ├── Journeys: Exploration paths through Grove knowledge
        │   ├── Lenses: Strategist, Skeptic, Engineer, etc.
        │   ├── Card Definitions: Strategic insight, technical architecture
        │   └── Sprouts: Captured insights
        │
        ├── Field: "Legal Corpus" (private)
        │   ├── RAG: Contracts, case law, compliance docs
        │   ├── Nodes: Legal concepts, precedents
        │   ├── Journeys: Due diligence flows, compliance pathways
        │   ├── Lenses: Litigator, Compliance Officer, Risk Analyst
        │   ├── Card Definitions: Contract clause, precedent summary
        │   └── Sprouts: Captured insights
        │
        └── Field: "Legal-Grove Governance" (composite)
            ├── RAG: Merged from Legal + Grove
            ├── Inherited: legal.*, grove.* entities
            ├── Native: legal-grove.* entities
            └── Sprouts: Cross-domain insights
```

### Field Types

| Type | Description | Example |
|------|-------------|---------|
| **Standard Field** | Single knowledge domain, created from scratch | "My Research Notes" |
| **Forked Field** | Copied from another Field, maintains attribution | Fork of "The Grove Foundation" |
| **Composite Field** | Merged from 2+ parent Fields | "Legal-Grove Governance" |
| **Template Field** | Published to marketplace as starting point | "Legal Research Template" |

---

## Part 2: Namespaced Entities

### The Namespace Problem

Without namespacing, merging Fields creates collision:
- Legal has a "Summary" card definition
- Grove has a "Summary" card definition  
- Which config applies in the composite?

### The Namespace Solution

Every entity in a Field has a namespaced identifier:

```
{namespace}.{local-id}

Examples:
- grove.strategic-insight
- legal.contract-clause
- legal-grove.regulatory-risk-assessment
```

### Namespace Rules

| Context | Namespace Pattern | Example |
|---------|-------------------|---------|
| Standard Field | `{field-slug}.*` | `grove.skeptic-lens` |
| Forked Field | `{fork-slug}.*` (new namespace) | `my-grove.modified-skeptic` |
| Composite Field (inherited) | `{parent-namespace}.*` | `legal.compliance-officer` |
| Composite Field (native) | `{composite-slug}.*` | `legal-grove.cross-domain-insight` |

### Entity Reference Schema

```typescript
interface NamespacedEntityRef {
  // Full identifier
  id: string;                      // "legal.contract-clause"
  
  // Parsed components
  namespace: string;               // "legal"
  localId: string;                 // "contract-clause"
  
  // Origin tracking
  sourceFieldId: string;           // UUID of originating Field
  sourceFieldName: string;         // "Legal Corpus" (denormalized)
  
  // Relationship to current Field
  relationship: 'native' | 'inherited' | 'forked';
  
  // Attribution
  originalCreator: string;         // User who created original
  forkChain?: string[];            // IDs of Fields in fork lineage
}
```

### How Namespacing Works in Practice

**Scenario: Creating a Composite Field**

1. User selects Legal Field + Grove Field to merge
2. System prompts for composite namespace (e.g., "legal-grove")
3. Composite Field created with:
   - `namespaces: { "legal-field-uuid": "legal", "grove-field-uuid": "grove" }`
   - All Legal entities accessible as `legal.*`
   - All Grove entities accessible as `grove.*`
   - New entities created as `legal-grove.*`

**Scenario: Using inherited Lens in Composite**

1. User selects `legal.compliance-officer` Lens in composite Terminal
2. System loads Lens config from Legal Field (read-through)
3. Responses generated use Legal Field's Lens personality
4. Attribution event logged for Legal Field

**Scenario: Creating derivative Lens**

1. User wants to modify `grove.skeptic` for legal context
2. Creates new Lens in composite: `legal-grove.regulatory-skeptic`
3. New Lens config stored in composite Field
4. `forkedFrom: "grove.skeptic"` preserved in metadata
5. Both Grove and composite creators get attribution on use

---

## Part 3: Composite Fields

### Merge Semantics

When Fields A and B merge into Composite C:

```
Field A (namespace: "a")          Field B (namespace: "b")
├── RAG Collection A              ├── RAG Collection B
├── a.lens-1                      ├── b.lens-1
├── a.lens-2                      ├── b.lens-2
├── a.journey-1                   ├── b.journey-1
└── a.card-def-1                  └── b.card-def-1
        │                                 │
        └────────────┬────────────────────┘
                     ▼
           Composite Field C (namespace: "a-b")
           ├── RAG Collection C (merged A + B)
           ├── Inherited:
           │   ├── a.lens-1, a.lens-2
           │   ├── b.lens-1, b.lens-2
           │   ├── a.journey-1, b.journey-1
           │   └── a.card-def-1, b.card-def-1
           └── Native (created in C):
               ├── a-b.cross-domain-lens
               └── a-b.synthesis-journey
```

### Composite RAG Architecture

```typescript
interface CompositeRAGConfig {
  // The merged collection
  compositeCollectionId: string;
  
  // Parent collection references (for attribution)
  parentCollections: {
    collectionId: string;
    fieldId: string;
    namespace: string;
    documentCount: number;
  }[];
  
  // Document-level source tracking
  documentSourceMap: {
    [documentId: string]: {
      sourceFieldId: string;
      namespace: string;
      originalCollectionId: string;
    };
  };
  
  // Retrieval configuration
  retrievalStrategy: RetrievalStrategy;
  namespaceWeights?: { [namespace: string]: number };
}

type RetrievalStrategy = 
  | 'unified'          // Treat all docs equally
  | 'weighted'         // Apply namespace weights
  | 'source-balanced'  // Ensure representation from each parent
  | 'query-routed';    // Route queries to relevant namespace based on intent
```

### Sprout Behavior in Composites

```typescript
interface CompositeSprout extends Sprout {
  fieldId: string;                 // Composite Field ID
  
  // Multi-source attribution
  sourceNamespaces: string[];      // Which parent namespaces contributed
  primaryNamespace?: string;       // Dominant source (if identifiable)
  
  // Document-level provenance
  sourceDocuments: {
    documentId: string;
    namespace: string;
    relevanceScore: number;
  }[];
  
  // Promotion capability
  canPromoteTo: string[];          // Parent Field IDs this could promote to
  promotedTo?: {
    fieldId: string;
    promotedAt: Date;
    promotedBy: string;
  };
}
```

**Sprout Promotion Flow:**
1. User captures Sprout in composite exploration
2. Sprout tagged with source namespaces based on RAG retrieval
3. User can "promote" Sprout to a parent Field if insight is domain-specific
4. Promoted Sprout appears in parent Field's Sprout collection
5. Attribution: discovered in composite, value accrues to parent

---

## Part 4: The Attribution Economy

### Knowledge Commons Integration

Fields participate in Grove's Knowledge Commons through attribution chains:

```
┌─────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE COMMONS                          │
│                                                                 │
│  Published Fields, Lenses, Journeys, Card Definitions          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Grove    │  │ Legal    │  │Research  │  │ Custom   │       │
│  │ Template │  │ Template │  │ Template │  │ Lens A   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
└───────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ User's  │   │ User's  │   │ User's  │   │ User's  │
   │ Fork    │   │ Fork    │   │ Fork    │   │ Field   │
   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │             │
        └──────────┬──┴─────────────┴─────────────┘
                   │
              Attribution Events
              Flow Upstream to
              Original Creators
```

### Attribution Event Types

| Event | Trigger | Credit Flows To |
|-------|---------|-----------------|
| **Field Fork** | User forks a published Field | Original Field creator |
| **Lens Adoption** | User adds published Lens to their Field | Lens creator |
| **Journey Use** | User runs a Journey from marketplace | Journey creator |
| **Derivative Creation** | User creates modified version | Original + derivative creator |
| **Sprout Promotion** | Composite Sprout promoted to parent | Composite Field contributors |

### Attribution Schema

```typescript
interface Attribution {
  // Creation
  originalCreator: {
    userId: string;
    organizationId?: string;
    createdAt: Date;
  };
  
  // Fork lineage
  forkChain: {
    fieldId: string;
    fieldName: string;
    forkedAt: Date;
    forkedBy: string;
  }[];
  
  // Contribution tracking
  contributors: {
    userId: string;
    contributionType: 'create' | 'edit' | 'review' | 'promote';
    contributedAt: Date;
  }[];
  
  // Adoption metrics
  adoption: {
    forkCount: number;
    usageCount: number;
    lastUsed: Date;
  };
  
  // Credit accumulation (future)
  credits?: {
    earned: number;
    pending: number;
    lastPayout: Date;
  };
}
```

---

## Part 5: Data Model

### Core Field Schema

```typescript
interface Field {
  // Identity
  id: string;                      // UUID
  slug: string;                    // URL-friendly identifier
  name: string;
  description: string;
  icon?: string;                   // Emoji or icon reference
  
  // Type classification
  fieldType: 'standard' | 'forked' | 'composite' | 'template';
  
  // Ownership & Access
  createdBy: string;               // User ID
  organizationId?: string;         // If org-owned
  visibility: 'private' | 'organization' | 'public';
  collaborators: Collaborator[];
  
  // Knowledge Source
  rag: {
    collectionId: string;          // Primary vector store
    documentCount: number;
    lastIndexed: Date;
    indexingStatus: 'idle' | 'indexing' | 'error';
  };
  
  // Exploration Configuration (entity references)
  entities: {
    nodes: NamespacedEntityRef[];
    journeys: NamespacedEntityRef[];
    lenses: NamespacedEntityRef[];
    cardDefinitions: NamespacedEntityRef[];
  };
  
  // Composite Field specifics (null if not composite)
  composite?: {
    parentFieldIds: string[];
    namespaceMap: { [fieldId: string]: string };
    mergeStrategy: 'union' | 'intersection' | 'custom';
    ragConfig: CompositeRAGConfig;
  };
  
  // Fork lineage (null if not forked)
  fork?: {
    sourceFieldId: string;
    sourceFieldName: string;
    forkedAt: Date;
    divergencePoint: string;       // Commit/version at fork time
  };
  
  // Attribution
  attribution: Attribution;
  
  // Marketplace (if published)
  marketplace?: {
    isPublished: boolean;
    publishedAt?: Date;
    category: string;
    tags: string[];
    rating: number;
    reviewCount: number;
    forkCount: number;
    featured: boolean;
  };
  
  // Metrics
  stats: {
    sproutCount: number;
    sessionCount: number;
    activeExplorers: number;
    lastActivity: Date;
  };
  
  // Lifecycle
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

interface Collaborator {
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  addedAt: Date;
  addedBy: string;
}
```

### Field-Scoped Entities

```typescript
// All exploration entities are scoped to a Field
interface Sprout {
  id: string;
  
  // Field context
  fieldId: string;
  fieldSlug: string;
  fieldName: string;               // Denormalized
  
  // Content
  content: string;
  contentType: 'text' | 'card' | 'synthesis';
  
  // Generation provenance
  generatedFrom: {
    sessionId: string;
    journeyId?: string;
    journeyNamespace?: string;     // e.g., "grove.architecture-deep-dive"
    lensId?: string;
    lensNamespace?: string;        // e.g., "legal.compliance-officer"
    nodeId?: string;
    query: string;
    ragSources: {
      documentId: string;
      namespace: string;
      relevanceScore: number;
    }[];
  };
  
  // Composite-specific (if captured in composite Field)
  compositeContext?: {
    sourceNamespaces: string[];
    primaryNamespace?: string;
    canPromoteTo: string[];
    promotedTo?: {
      fieldId: string;
      promotedAt: Date;
    };
  };
  
  // Curation
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  curatedBy?: string;
  curatedAt?: Date;
  tags: string[];
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
}

interface TerminalSession {
  id: string;
  
  // Field context (immutable per session)
  fieldId: string;
  fieldSlug: string;
  fieldName: string;
  
  // Active configuration
  activeLensId?: string;
  activeLensNamespace?: string;
  activeJourneyId?: string;
  activeJourneyNamespace?: string;
  
  // Conversation
  messages: Message[];
  
  // Session metadata
  userId: string;
  startedAt: Date;
  lastActivity: Date;
  status: 'active' | 'completed' | 'abandoned';
}
```

---

## Part 6: UX Patterns

### Explore Surface

**Field Selection (Workspace-Style):**
- User is always "in" a Field when exploring
- Field indicator prominent in header
- Switching Fields = clean break (new session)
- No Field selected = Field picker UI

```
┌─────────────────────────────────────────────────────────────┐
│  EXPLORE                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🌱 The Grove Foundation              ▼ Switch Field │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Terminal / Journey / Node Grid]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Empty State (No Field Selected):**
```
┌─────────────────────────────────────────────────────────────┐
│  EXPLORE                                                    │
│                                                             │
│     ┌───────────────────────────────────────────────┐      │
│     │                                               │      │
│     │   🌱 Welcome to the Grove                     │      │
│     │                                               │      │
│     │   Select a Field to begin exploring:          │      │
│     │                                               │      │
│     │   ┌─────────────────────────────────────┐    │      │
│     │   │ 📚 The Grove Foundation             │    │      │
│     │   │ Research & strategy docs            │    │      │
│     │   └─────────────────────────────────────┘    │      │
│     │                                               │      │
│     │   ┌─────────────────────────────────────┐    │      │
│     │   │ + Create New Field                  │    │      │
│     │   └─────────────────────────────────────┘    │      │
│     │                                               │      │
│     │   ─────────────────────────────────────       │      │
│     │   Browse Field Marketplace →                  │      │
│     │                                               │      │
│     └───────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cultivate Surface

**Sprout Filtering (Filter-Style):**
- See Sprouts across all Fields by default
- Filter by Field, Status, Date, Tags
- Field shown on each Sprout card

```
┌─────────────────────────────────────────────────────────────┐
│  MY SPROUTS                                                 │
│                                                             │
│  Filters: [All Fields ▼] [All Status ▼] [Date Range]       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Attribution chains enable sustainable..."          │   │
│  │ 📚 The Grove Foundation • Pending • Dec 22         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Section 4.2 precedent suggests..."                 │   │
│  │ ⚖️ Legal Corpus • Approved • Dec 21                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Foundation Console

**Fields Management Section:**
```
Foundation Console
├── Dashboard
├── Narrative Architect
├── Sprout Queue
└── Fields                    ← NEW
    ├── My Fields
    │   └── [List of owned Fields]
    ├── Subscribed Fields
    │   └── [Fields you have access to]
    └── Field Analytics
        └── [Usage metrics per Field]
```

**Field Detail View (Admin):**
- RAG configuration
- Access control management
- Entity configuration (Lenses, Journeys, etc.)
- Publishing to marketplace
- Analytics dashboard

---

## Part 7: MVP Implementation

### What MVP Includes

| Component | MVP Scope |
|-----------|-----------|
| **Field Schema** | Full schema implemented, single Field populated |
| **Field UX** | Field indicator shown, selector disabled ("Coming Soon") |
| **Sprout.fieldId** | All Sprouts tagged with Field ID |
| **Session.fieldId** | All sessions scoped to Field |
| **Cultivate Filter** | Field filter present, single option |
| **Foundation Console** | Fields section in nav, read-only view |

### What MVP Defers

| Component | Deferred To |
|-----------|-------------|
| Multi-Field switching | Phase 2 |
| Field creation flow | Phase 2 |
| Composite Field merging | Phase 2 |
| Marketplace browsing | Phase 2+ |
| Attribution credit economy | Phase 3 |
| Namespace collision resolution | Phase 2 |

### MVP Database Seeding

```typescript
// Seed data for MVP
const groveFoundationField: Field = {
  id: "grove-foundation-field-001",
  slug: "grove-foundation",
  name: "The Grove Foundation",
  description: "Research, strategy, and architecture for distributed AI infrastructure",
  icon: "🌱",
  fieldType: "standard",
  visibility: "public",
  // ... full schema with single Field data
};
```

### Schema Validation

MVP must validate that all new Sprouts and Sessions include `fieldId`:

```typescript
// Sprout creation
const createSprout = (data: SproutInput): Sprout => {
  if (!data.fieldId) {
    throw new Error("fieldId required for all Sprouts");
  }
  // ... creation logic
};

// Session creation
const createSession = (data: SessionInput): TerminalSession => {
  if (!data.fieldId) {
    throw new Error("fieldId required for all Sessions");
  }
  // ... creation logic
};
```

---

## Part 8: Future Considerations

### Multi-Field Query (Phase 3+)

Rather than true cross-Field querying, Grove uses Composite Fields:
- User explicitly creates composite from selected Fields
- Composite is a first-class Field with merged RAG
- No implicit cross-Field leakage

### Field Versioning

As Fields evolve, versioning becomes important:
- Fork captures point-in-time snapshot
- RAG reindexing creates new "version"
- Derivative tracking needs version awareness

### Field Federation

Long-term, Fields might exist across Grove instances:
- University A's Field accessible to University B
- Federation protocol for cross-instance discovery
- Attribution flows across federation boundaries

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **Field** | A bounded knowledge domain with RAG collection and exploration tools |
| **Namespace** | Prefix identifying entity origin (e.g., `legal.`, `grove.`) |
| **Composite Field** | Field created by merging 2+ parent Fields |
| **Fork** | Copy of a Field that maintains attribution to source |
| **Sprout** | Captured LLM output with full provenance |
| **Attribution Chain** | Lineage of creators/contributors for an entity |
| **Knowledge Commons** | Grove's shared repository of published Fields/entities |

---

*This document is the authoritative reference for Field architecture. All implementations must conform to this specification to ensure forward compatibility with multi-Field and marketplace features.*
