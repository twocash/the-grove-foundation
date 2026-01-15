# Product Specification: Sprout Finishing Room v1

**Sprint:** sprout-finishing-room-v1
**Status:** Ready for User Story Extraction
**Last Updated:** 2026-01-15
**Contributors:**
- Product Manager: DEX-Trellis alignment
- UX Chief: DEX compliance review, architectural guidance
- UI/UX Designer: Wireframes, prototypes, json-render integration

---

## 1. Executive Summary

The **Sprout Finishing Room** is a three-column workspace modal that transforms the passive research results viewer into an active research refinement environment. Users can inspect, refine, and direct `ResearchDocument` artifacts with full provenance transparency.

### Core Value Proposition

| Before | After |
|--------|-------|
| Static document display | Interactive workspace |
| "Accept" button dead-end | "Revise & Resubmit" refinement loop |
| Hidden provenance | Transparent Cognitive Routing |
| Procedural actions | Declarative user control |

---

## 2. Strategic Alignment

### 2.1 DEX Compliance (UX Chief Review)

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | User declares *what* to promote via checklist, not single procedural button |
| **Provenance as Infrastructure** | Cognitive Routing panel exposes full attribution chain |
| **Capability Agnosticism** | Same interface regardless of which agent/model generated the document |
| **Organic Scalability** | Action handlers abstractable for future artifact types |

### 2.2 JSON-Render Integration (Designer Vision)

The `json-render` library transforms the document viewer from static markdown to a dynamic, inspectable composition of typed components. The AI generates structured `ResearchDocument` JSON, which renders via a predefined component catalog.

**Benefits:**
- **Constrained Vocabulary** — AI output limited to schema-compliant ResearchObject
- **Declarative Output** — JSON "blueprint" separates content from presentation
- **Kinetic Objects** — Interactive, not static; can be inspected, expanded, modified

---

## 3. User Roles

| Role | Description | Primary Actions |
|------|-------------|-----------------|
| **Explorer** | End user researching topics | View, annotate, archive sprouts |
| **Cultivator** | Advanced user with moderation access | Promote to Field, revise & resubmit |

---

## 4. Layout Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                                │
│  🌱 SPROUT FINISHING ROOM        [Sprout Title...]              [✕ Close] │
├────────────────┬─────────────────────────────────────┬─────────────────────┤
│                │                                     │                     │
│  PROVENANCE    │  DOCUMENT VIEWER                   │  ACTION PANEL       │
│  PANEL         │  (json-render powered)              │                     │
│                │                                     │                     │
│  280px fixed   │  flex: 1                            │  320px fixed        │
│                │                                     │                     │
│  - Lens        │  [ResearchHeader]                   │  ┌─────────────────┐│
│  - Cognitive   │  [AnalysisBlock]                    │  │ PRIMARY:        ││
│    Routing     │  [SourceList]                       │  │ Revise &        ││
│  - Knowledge   │  [Metadata]                         │  │ Resubmit        ││
│    Sources     │                                     │  └─────────────────┘│
│                │  [Raw JSON Toggle </> ]             │  ┌─────────────────┐│
│                │                                     │  │ SECONDARY:      ││
│                │                                     │  │ Add to Field    ││
│                │                                     │  │ (checklist)     ││
│                │                                     │  └─────────────────┘│
│                │                                     │  ┌─────────────────┐│
│                │                                     │  │ TERTIARY:       ││
│                │                                     │  │ Archive/Note/   ││
│                │                                     │  │ Export          ││
│                │                                     │  └─────────────────┘│
└────────────────┴─────────────────────────────────────┴─────────────────────┘
│  STATUS BAR: SPROUT.FINISHING.v1 │ Status: READY │ Created: 2m ago │ [●]  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| > 1280px | Full three-column layout |
| 1024-1279px | Reduced panel widths (240px, 280px) |
| < 1024px | Collapsed provenance (icon-only), tab navigation |
| < 768px | Single column with panel tabs |

---

## 5. Component Specifications

### 5.1 Provenance Panel (Left Column)

**Purpose:** Display full attribution chain for the research artifact.

#### 5.1.1 Origin Section

| Element | Data Source | Interaction |
|---------|-------------|-------------|
| Lens | `sprout.provenance.lens.name` | Click to view lens details (future) |
| Cognitive Routing | `sprout.cognitiveRouting` | Expandable details panel |

#### 5.1.2 Cognitive Routing Details

Replaces deprecated Hub/Journey/Node with unified 4D model:

```typescript
interface CognitiveRouting {
  path: string;         // Experience path taken (e.g., "deep-dive → cost-dynamics")
  prompt: string;       // Active prompt mode (e.g., "Analytical research mode")
  inspiration: string;  // Triggering context (e.g., "User query on ownership models")
  domain?: string;      // Optional cognitive domain
}
```

#### 5.1.3 Knowledge Sources Section

| Element | Data Source | Interaction |
|---------|-------------|-------------|
| Source list | `sprout.provenance.knowledgeFiles[]` | Click to highlight in document |

### 5.2 Document Viewer (Center Column)

**Purpose:** Render `ResearchDocument` as interactive, inspectable composition.

#### 5.2.1 ResearchObject Component Catalog

| Component | Props | Description |
|-----------|-------|-------------|
| `ResearchHeader` | `position: string`, `query: string` | Main thesis and original query |
| `AnalysisBlock` | `content: string` (markdown) | Full analysis section |
| `SourceList` | `sources: Source[]` | Citations with clickable URLs |
| `LimitationsBlock` | `content: string` | What couldn't be determined |
| `Metadata` | `status`, `confidenceScore`, `wordCount` | Document metadata |

#### 5.2.2 Raw JSON Toggle

- **Location:** Preview header, right side
- **Icon:** `</>` code brackets
- **Behavior:** Toggle between rendered view and raw JSON
- **Purpose:** Transparency for power users, debugging

#### 5.2.3 Validation Error Handling

If AI generates invalid JSON:
1. Display non-intrusive error toast
2. Log error for diagnostics
3. Attempt self-correction via retry prompt
4. Show fallback markdown rendering if retry fails

### 5.3 Action Panel (Right Column)

**Purpose:** Provide declarative user control over research artifact lifecycle.

#### 5.3.1 Primary Action: Revise & Resubmit

| Element | Type | Description |
|---------|------|-------------|
| Revision textarea | `textarea` | User instructions for refinement |
| Submit button | `button.primary` | "Submit for Revision" |

**Event Emitted:** `sproutRefinementSubmitted(sproutId, revisionNotes)`

**Backend Flow:** Re-queues sprout to research agent with:
- Original provenance
- User's revision instructions
- Incremented revision counter

#### 5.3.2 Secondary Action: Add to Field (Promote)

| Element | Type | Description |
|---------|------|-------------|
| Promotion checklist | `checkbox[]` | Declarative content selection |
| Promote button | `button.secondary` | "Promote Selected" |

**Checklist Options:**

| Item | Word Count | Default |
|------|------------|---------|
| Thesis Statement | ~250 | Checked |
| Full Analysis | ~2,500 | Unchecked |
| Discovered Sources | N URLs | Checked |
| My Annotation | User-added | Unchecked |

**Event Emitted:** `sproutPromotedToRag(sproutId, promotionConfig)`

#### 5.3.3 Tertiary Actions

| Action | Icon | Description | Event |
|--------|------|-------------|-------|
| Archive to Garden | 📁 | Save to private garden | `sproutArchived(sproutId)` |
| Add Private Note | 📝 | Annotation without promotion | `sproutAnnotated(sproutId, note)` |
| Export Document | 📤 | Download as markdown/JSON | N/A (client-side) |

### 5.4 Status Bar (Footer)

| Element | Content | Purpose |
|---------|---------|---------|
| Version tag | `SPROUT.FINISHING.v1` | System identification |
| Status | `Status: READY` | Current sprout state |
| Timestamp | `Created: 2m ago` | Relative creation time |
| Indicator | Green pulse dot | System health |

---

## 6. Data Schemas

### 6.1 ResearchDocument (Input)

```typescript
interface ResearchDocument {
  position: string;         // Main thesis statement
  query: string;            // Original research query
  analysis: string;         // Full analysis (markdown)
  citations: Citation[];    // Source references
  limitations?: string;     // What couldn't be determined
  status: 'complete' | 'partial' | 'insufficient-evidence';
  confidenceScore: number;  // 0-1 confidence rating
  wordCount: number;        // Document length
}

interface Citation {
  index: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  accessedAt: string;
}
```

### 6.2 Sprout (Extended)

```typescript
interface Sprout {
  id: string;
  // ... existing fields ...

  // v1.1 additions for Finishing Room
  researchDocument?: ResearchDocument;  // Attached research artifact
  cognitiveRouting?: CognitiveRouting;  // 4D provenance model
  revisionCount?: number;               // How many times revised
  promotedFields?: string[];            // Which fields promoted to RAG
}
```

---

## 7. Entry Points

### 7.1 From GardenTray

```typescript
// In GardenTray.tsx
const handleSproutClick = (sprout: Sprout) => {
  if (sprout.researchDocument) {
    openFinishingRoom(sprout);  // Opens SproutFinishingRoom modal
  } else {
    openSproutDetail(sprout);   // Falls back to basic detail view
  }
};
```

### 7.2 From Research Pipeline Completion

When research agent completes:
1. Attach `ResearchDocument` to sprout
2. Update sprout status to `ready`
3. Show notification badge on GardenTray
4. User clicks to open Finishing Room

---

## 8. Event Architecture

### 8.1 Engagement Bus Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `sproutRefinementSubmitted` | `{ sproutId, revisionNotes }` | Primary action submit |
| `sproutPromotedToRag` | `{ sproutId, promotionConfig }` | Secondary action submit |
| `sproutArchived` | `{ sproutId }` | Archive button click |
| `sproutAnnotated` | `{ sproutId, note }` | Note saved |
| `finishingRoomOpened` | `{ sproutId }` | Modal opened |
| `finishingRoomClosed` | `{ sproutId, action }` | Modal closed |

### 8.2 Analytics Events

| Event | Purpose |
|-------|---------|
| Time in Finishing Room | Engagement depth |
| Revision submission rate | Refinement loop usage |
| Promotion checklist patterns | What users value |
| Raw JSON toggle usage | Power user identification |

---

## 9. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab through all interactive elements |
| Escape to close | Modal closes on Escape key |
| Focus trap | Focus stays within modal while open |
| Screen reader | `aria-modal`, `aria-labelledby`, `role` attributes |
| Color contrast | WCAG AA minimum (4.5:1 for text) |
| Reduced motion | Respect `prefers-reduced-motion` |

---

## 10. File Structure

```
src/surface/components/modals/SproutFinishingRoom/
├── index.tsx                 # Main component, state orchestration
├── ProvenancePanel.tsx       # Left column
├── DocumentViewer.tsx        # Center column with json-render
├── ActionPanel.tsx           # Right column
├── components/
│   ├── CognitiveRouting.tsx  # Expandable routing details
│   ├── PromotionChecklist.tsx # Declarative checklist
│   ├── RevisionForm.tsx      # Primary action form
│   └── RawJsonView.tsx       # JSON toggle view
├── hooks/
│   └── useFinishingRoom.ts   # State management hook
└── styles.css                # Component styles
```

---

## 11. Dependencies

### 11.1 Required

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@json-render/core` | latest | Types, schemas, catalog, actions |
| `@json-render/react` | latest | Renderer, providers, hooks |
| `zod` | existing | Schema validation (integrated with json-render) |

### 11.2 JSON-Render Architecture

The library constrains AI output to a developer-defined component vocabulary:

```typescript
// 1. Define catalog (what AI can generate)
const ResearchCatalog = createCatalog({
  components: {
    ResearchHeader: {
      props: z.object({
        position: z.string(),
        query: z.string()
      }),
    },
    AnalysisBlock: {
      props: z.object({ content: z.string() }),
    },
    SourceList: {
      props: z.object({
        sources: z.array(CitationSchema)
      }),
    },
    // ... other components
  },
});

// 2. Create registry (map catalog → React)
const ResearchRegistry = {
  ResearchHeader: ({ element }) => (
    <header>
      <h1>{element.props.position}</h1>
      <p className="query">{element.props.query}</p>
    </header>
  ),
  // ... other implementations
};
```

**Key Benefit:** AI can only generate components in the catalog, ensuring predictable, schema-compliant output.

**Streaming:** JSON renders progressively as the model responds, enabling real-time document assembly.

### 11.2 Internal

| Module | Purpose |
|--------|---------|
| `useEngagementBus` | Event emission |
| `useSproutStorage` | Sprout persistence |
| `ResearchDocument` schema | Type validation |

---

## 12. Out of Scope (v1.0)

| Feature | Reason | Target |
|---------|--------|--------|
| Multi-sprout comparison | Complexity | v1.1 |
| Collaborative annotations | Backend required | v1.2 |
| Version history timeline | Schema extension needed | v1.1 |
| Real-time agent status | WebSocket required | v1.2 |
| Field-level promotion rules | Admin console needed | v1.1 |

---

## 13. Open Questions

1. **RAG Write Service:** Does the backend support writing promoted content to RAG? (Blocking for "Add to Field")

2. **Research Agent Queue:** Is the agent queue infrastructure ready for "Revise & Resubmit"? (May need to stub for v1.0)

3. **JSON-render Package:** Confirm exact package name and version for `json-render` library.

---

## 14. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Finishing Room open rate | > 60% of ready sprouts | Analytics |
| Revision submission rate | > 20% of opened sprouts | Analytics |
| Promotion rate | > 40% of opened sprouts | Analytics |
| Time to first action | < 30 seconds | Analytics |
| Accessibility audit | WCAG AA pass | Manual audit |

---

## References

- [UX Chief Review](https://www.notion.so/2e9780a78eef813d8911c1e97241b100)
- [Design Brief](../sprout-finishing-room-v1/DESIGN_BRIEF.md)
- [Wireframe v1.1](../../design-system/SPROUT_FINISHING_ROOM_WIREFRAME.md)
- [HTML Prototype](../../design-system/prototypes/sprout-finishing-room.html)
- [4D Terminology Migration](../terminology-migration-4d/SPEC.md)
