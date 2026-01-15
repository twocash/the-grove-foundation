# Execution Prompt: S2||SFR-Display

**Sprint:** S2||SFR-Display: Provenance & Document Viewer
**Stories:** US-B001 through US-B004, US-C001 through US-C004 (8 total)
**Effort:** Medium (2-3 days)
**Status:** Ready for Execution
**Dependencies:** S1-SFR-Shell (✅ complete)

---

## Sprint Contract

> **IMPORTANT:** This sprint follows the Grove Execution Protocol. Read and follow this process.

### Pre-Flight Checklist

Before writing any code:

- [ ] Read this entire document
- [ ] Verify S1-SFR-Shell is merged to main
- [ ] Pull latest main: `git pull origin main`
- [ ] Verify you can run `npm run dev` successfully
- [ ] Create feature branch: `git checkout -b feat/s2-sfr-display`

### Execution Rules

1. **Atomic Commits** — One commit per user story (US-B001, US-C001, etc.)
2. **Test First** — Write/update tests before implementation
3. **No Scope Creep** — Only implement what's in the stories below
4. **Visual Verification** — Screenshot each completed story
5. **Strangler Fig** — Extend existing `src/surface/components/modals/SproutFinishingRoom/`

### Definition of Done (per story)

- [ ] Acceptance criteria pass (Gherkin scenarios)
- [ ] Tests written and passing
- [ ] No TypeScript errors
- [ ] Screenshot captured
- [ ] Committed with message format: `feat(sfr): US-X00Y - {title}`

---

## Context

### What We're Building

S2 fills in the **left column (Provenance Panel)** and **center column (Document Viewer)** of the Finishing Room modal. The key innovation is using **json-render** from Vercel Labs to render AI-generated ResearchDocuments as interactive component trees.

### json-render Overview

**Repository:** https://github.com/vercel-labs/json-render

json-render constrains AI output to a developer-defined component vocabulary:
1. **Catalog** — Define what components AI can generate (with Zod schemas)
2. **Registry** — Map catalog components to React implementations
3. **Renderer** — Render JSON tree using your registry

**Key Benefit:** AI can only generate components in your catalog, ensuring predictable, schema-compliant output.

### Updated Layout (S2 Scope)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                     [✕ Close] │
├────────────────┬─────────────────────────────────────┬─────────────────────┤
│                │                                     │                     │
│  PROVENANCE    │  DOCUMENT VIEWER                    │  ACTION PANEL       │
│  PANEL         │  (json-render powered)              │  (S3 placeholder)   │
│  ════════════  │  ═══════════════════                │                     │
│                │                                     │                     │
│  ┌──────────┐  │  ┌─────────────────────────────┐   │  [Placeholder]      │
│  │ 🔮 Lens  │  │  │ ResearchHeader              │   │                     │
│  │ Academic │  │  │ Position: "Grove enables..."│   │                     │
│  └──────────┘  │  │ Query: "What is Grove?"     │   │                     │
│                │  └─────────────────────────────┘   │                     │
│  ┌──────────┐  │                                     │                     │
│  │ 🧠 Route │  │  ┌─────────────────────────────┐   │                     │
│  │ deep-dive│  │  │ AnalysisBlock               │   │                     │
│  │ → costs  │  │  │ [Markdown content...]       │   │                     │
│  │ ▼ expand │  │  └─────────────────────────────┘   │                     │
│  └──────────┘  │                                     │                     │
│                │  ┌─────────────────────────────┐   │                     │
│  ┌──────────┐  │  │ SourceList                  │   │                     │
│  │ 📚 Files │  │  │ [1] Anthropic Pricing...    │   │                     │
│  │ • grove  │  │  │ [2] AWS Bedrock Docs...     │   │                     │
│  │ • ratchet│  │  └─────────────────────────────┘   │                     │
│  └──────────┘  │                                     │                     │
│                │  [</> Raw JSON Toggle]              │                     │
└────────────────┴─────────────────────────────────────┴─────────────────────┘
```

---

## Epic B: Provenance Panel (Left Column)

### US-B001: Display Lens Origin

**As an** Explorer
**I want to** see which lens generated the research
**So that** I understand the perspective applied to my query

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Lens displayed in Origin section
  Given I have a sprout with provenance.lens = { id: "researcher", name: "Academic Researcher" }
  When I open the Finishing Room
  Then the Provenance Panel should show an "Origin" section
  And I should see a lens item with icon (🔮)
  And the lens name should display "Academic Researcher"

Scenario: Missing lens handled gracefully
  Given I have a sprout with no provenance.lens
  When I open the Finishing Room
  Then the Origin section should show "Default Lens"
```

**Implementation:**

Update `ProvenancePanel.tsx`:

```typescript
// Replace placeholder with real content
export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({ sprout }) => {
  const lensName = sprout.provenance?.lens?.name || 'Default Lens';

  return (
    <aside className="w-[280px] flex-shrink-0 border-r border-ink/10 ...">
      {/* Origin Section */}
      <section className="p-4 border-b border-ink/10">
        <h3 className="text-xs font-mono text-ink-muted uppercase mb-3">Origin</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg">🔮</span>
          <span className="text-sm font-medium">{lensName}</span>
        </div>
      </section>
      {/* More sections below... */}
    </aside>
  );
};
```

**Commit:** `feat(sfr): US-B001 - Display lens origin`

---

### US-B002: Display Cognitive Routing with Expandable Details

**As an** Explorer
**I want to** see the full cognitive routing path
**So that** I understand how the system arrived at this research

**Priority:** P0 | **Complexity:** M

**Includes Schema Creation:**

Create `src/core/schema/cognitive-routing.ts`:

```typescript
/**
 * 4D Experience Model: Cognitive Routing
 * Replaces deprecated Hub/Journey/Node provenance model
 */
export interface CognitiveRouting {
  path: string;        // Experience path (e.g., "deep-dive → cost-dynamics")
  prompt: string;      // Active prompt mode (e.g., "Analytical research mode")
  inspiration: string; // Triggering context (e.g., "User query on ownership models")
  domain?: string;     // Optional cognitive domain
}

/**
 * Build CognitiveRouting from legacy SproutProvenance
 * Bridges old Hub/Journey/Node to new 4D model
 */
export function buildCognitiveRouting(provenance: SproutProvenance | undefined): CognitiveRouting {
  if (!provenance) {
    return {
      path: 'default',
      prompt: 'Standard exploration',
      inspiration: 'User query',
    };
  }

  // Map legacy fields to 4D model
  const pathParts = [
    provenance.journey?.name,
    provenance.node?.name,
  ].filter(Boolean);

  return {
    path: pathParts.join(' → ') || 'direct',
    prompt: provenance.lens?.name || 'Default lens',
    inspiration: 'User query',
    domain: provenance.hub?.name,
  };
}
```

**Acceptance Criteria:**

```gherkin
Scenario: Cognitive Routing shows collapsed summary
  Given I have a sprout with cognitiveRouting data
  When I open the Finishing Room
  Then I should see a Cognitive Routing item with icon (🧠)
  And the summary should show the path name

Scenario: Cognitive Routing expands to show details
  Given the Cognitive Routing item is displayed
  When I click on the Cognitive Routing item
  Then I should see expanded details:
    | Field | Example Value |
    | Path | deep-dive → cost-dynamics |
    | Prompt | Analytical research mode |
    | Inspiration | User query on ownership models |

Scenario: Cognitive Routing collapses on second click
  Given the Cognitive Routing details are expanded
  When I click on the item again
  Then the details should collapse
  And only the summary should be visible
```

**Implementation:**

Create `src/surface/components/modals/SproutFinishingRoom/components/CognitiveRoutingSection.tsx`:

```typescript
import React, { useState } from 'react';
import type { CognitiveRouting } from '@core/schema/cognitive-routing';

interface CognitiveRoutingSectionProps {
  routing: CognitiveRouting;
}

export const CognitiveRoutingSection: React.FC<CognitiveRoutingSectionProps> = ({ routing }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="p-4 border-b border-ink/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-sm font-medium">Cognitive Routing</span>
        </div>
        <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {expanded && (
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-ink-muted text-xs">Path</dt>
            <dd className="font-mono">{routing.path}</dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">Prompt</dt>
            <dd>{routing.prompt}</dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs">Inspiration</dt>
            <dd>{routing.inspiration}</dd>
          </div>
          {routing.domain && (
            <div>
              <dt className="text-ink-muted text-xs">Domain</dt>
              <dd>{routing.domain}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
};
```

**Commit:** `feat(sfr): US-B002 - Cognitive routing with expandable details`

---

### US-B003: Display Knowledge Sources List

**As an** Explorer
**I want to** see which knowledge files informed the research
**So that** I can assess the document's source coverage

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Knowledge sources displayed as list
  Given I have a sprout with knowledgeFiles: ["grove-overview.md", "ratchet-effect.md"]
  When I open the Finishing Room
  Then the Provenance Panel should show a "Knowledge Sources" section
  And I should see a list with:
    | Source |
    | grove-overview.md |
    | ratchet-effect.md |

Scenario: Empty knowledge sources handled gracefully
  Given I have a sprout with no knowledgeFiles
  When I open the Finishing Room
  Then the Knowledge Sources section should show "No sources referenced"
```

**Implementation:**

Add to `ProvenancePanel.tsx`:

```typescript
{/* Knowledge Sources Section */}
<section className="p-4">
  <h3 className="text-xs font-mono text-ink-muted uppercase mb-3 flex items-center gap-2">
    <span>📚</span> Knowledge Sources
  </h3>
  {knowledgeFiles.length > 0 ? (
    <ul className="space-y-1">
      {knowledgeFiles.map((file, idx) => (
        <li key={idx} className="text-sm text-ink-muted flex items-center gap-2">
          <span className="text-ink/30">•</span>
          <span className="font-mono text-xs">{file}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-ink-muted italic">No sources referenced</p>
  )}
</section>
```

**Commit:** `feat(sfr): US-B003 - Knowledge sources list`

---

### US-B004: Collapsible Panel Sections

**As an** Explorer
**I want to** collapse provenance sections I'm not using
**So that** I can focus on relevant information

**Priority:** P2 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: All sections collapsible
  Given the Provenance Panel is displayed
  When I click on any section header
  Then that section should toggle between expanded and collapsed

Scenario: Collapsed state persists during session
  Given I have collapsed the "Knowledge Sources" section
  When I close and reopen the Finishing Room
  Then the "Knowledge Sources" section should remain collapsed
```

**Implementation:**

Use `useState` or `useLocalStorage` for collapse state. Apply collapsible pattern to Origin and Knowledge Sources sections (Cognitive Routing already has it from US-B002).

**Commit:** `feat(sfr): US-B004 - Collapsible panel sections`

---

## Epic C: Document Viewer (Center Column)

### US-C001: Install and Configure json-render

**As a** Developer
**I want to** have json-render properly configured
**So that** I can render ResearchDocument artifacts dynamically

**Priority:** P0 | **Complexity:** M

**Acceptance Criteria:**

```gherkin
Scenario: json-render packages installed
  Given the project package.json
  When I run npm install
  Then @json-render/core should be available
  And @json-render/react should be available

Scenario: ResearchCatalog created
  Given json-render is installed
  When I import the ResearchCatalog
  Then it should define components: ResearchHeader, AnalysisBlock, SourceList, LimitationsBlock, Metadata

Scenario: ResearchRegistry maps to React components
  Given the ResearchCatalog is defined
  When I import the ResearchRegistry
  Then each catalog component should have a React implementation
```

**Step 1: Install packages**

```bash
npm install @json-render/core @json-render/react
```

**Step 2: Create catalog**

Create `src/surface/components/modals/SproutFinishingRoom/json-render/catalog.ts`:

```typescript
import { createCatalog } from '@json-render/core';
import { z } from 'zod';

/**
 * ResearchCatalog - Defines the component vocabulary for AI-generated research documents
 *
 * AI can ONLY generate components defined in this catalog, ensuring predictable output.
 */
export const ResearchCatalog = createCatalog({
  components: {
    ResearchHeader: {
      props: z.object({
        position: z.string().describe('Main thesis or position statement'),
        query: z.string().describe('Original user query'),
      }),
    },
    AnalysisBlock: {
      props: z.object({
        content: z.string().describe('Markdown-formatted analysis'),
      }),
    },
    SourceList: {
      props: z.object({
        sources: z.array(z.object({
          index: z.number(),
          title: z.string(),
          url: z.string().url(),
          snippet: z.string().optional(),
        })),
      }),
    },
    LimitationsBlock: {
      props: z.object({
        content: z.string().describe('What could not be determined'),
      }),
    },
    Metadata: {
      props: z.object({
        status: z.enum(['complete', 'partial', 'insufficient-evidence']),
        confidenceScore: z.number().min(0).max(1),
        wordCount: z.number(),
      }),
    },
  },
});

export type ResearchCatalogType = typeof ResearchCatalog;
```

**Step 3: Create registry**

Create `src/surface/components/modals/SproutFinishingRoom/json-render/registry.tsx`:

```typescript
import React from 'react';
import type { ElementProps } from '@json-render/react';

/**
 * ResearchRegistry - Maps catalog components to React implementations
 */
export const ResearchRegistry = {
  ResearchHeader: ({ element }: ElementProps) => (
    <header className="mb-6 pb-4 border-b border-ink/10">
      <h1 className="text-xl font-serif font-semibold text-ink mb-2">
        {element.props.position}
      </h1>
      <p className="text-sm text-ink-muted">
        <span className="font-mono text-xs">Query:</span> {element.props.query}
      </p>
    </header>
  ),

  AnalysisBlock: ({ element }: ElementProps) => (
    <article className="prose prose-sm max-w-none mb-6">
      {/* TODO: Add markdown renderer */}
      <div className="whitespace-pre-wrap">{element.props.content}</div>
    </article>
  ),

  SourceList: ({ element }: ElementProps) => (
    <section className="mb-6">
      <h3 className="text-sm font-mono text-ink-muted uppercase mb-3">Sources</h3>
      <ul className="space-y-2">
        {element.props.sources.map((source: any) => (
          <li key={source.index} className="flex gap-2 text-sm">
            <span className="text-grove-forest font-mono">[{source.index}]</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-grove-forest hover:underline"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  ),

  LimitationsBlock: ({ element }: ElementProps) => (
    <aside className="mb-6 p-3 bg-grove-clay/10 rounded border-l-2 border-grove-clay">
      <h3 className="text-sm font-mono text-grove-clay uppercase mb-2">Limitations</h3>
      <p className="text-sm text-ink-muted">{element.props.content}</p>
    </aside>
  ),

  Metadata: ({ element }: ElementProps) => (
    <footer className="pt-4 border-t border-ink/10 flex items-center gap-4 text-xs text-ink-muted">
      <span className={`px-2 py-1 rounded ${
        element.props.status === 'complete' ? 'bg-grove-forest/10 text-grove-forest' :
        element.props.status === 'partial' ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-700'
      }`}>
        {element.props.status.toUpperCase()}
      </span>
      <span>Confidence: {Math.round(element.props.confidenceScore * 100)}%</span>
      <span>{element.props.wordCount} words</span>
    </footer>
  ),
};
```

**Commit:** `feat(sfr): US-C001 - Install and configure json-render`

---

### US-C002: Render ResearchDocument via json-render

**As an** Explorer
**I want to** see the research document rendered as interactive components
**So that** I can explore the content in a structured way

**Priority:** P0 | **Complexity:** L

**Acceptance Criteria:**

```gherkin
Scenario: ResearchDocument renders all components
  Given I have a sprout with a complete ResearchDocument
  When I open the Finishing Room
  Then I should see a ResearchHeader with position and query
  And I should see an AnalysisBlock with markdown content
  And I should see a SourceList with citations
  And I should see Metadata with status and confidence score

Scenario: Partial documents render available components
  Given I have a ResearchDocument with no limitations field
  When I open the Finishing Room
  Then the LimitationsBlock should not render
  And other components should render normally

Scenario: Invalid JSON shows error state
  Given the ResearchDocument JSON is malformed
  When I open the Finishing Room
  Then I should see a user-friendly error message
  And the error should suggest "Document rendering failed"
  And a fallback text view should be offered
```

**Implementation:**

Update `DocumentViewer.tsx`:

```typescript
import React, { useMemo } from 'react';
import { Renderer, DataProvider } from '@json-render/react';
import type { Sprout } from '@core/schema/sprout';
import { ResearchRegistry } from './json-render/registry';
import { researchDocumentToJsonRender } from './json-render/transform';

export interface DocumentViewerProps {
  sprout: Sprout;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ sprout }) => {
  // Transform ResearchDocument to json-render tree
  const tree = useMemo(() => {
    if (!sprout.researchDocument) return null;
    try {
      return researchDocumentToJsonRender(sprout.researchDocument);
    } catch (err) {
      console.error('[DocumentViewer] Failed to transform document:', err);
      return null;
    }
  }, [sprout.researchDocument]);

  // No document attached
  if (!sprout.researchDocument) {
    return (
      <main className="flex-1 overflow-y-auto bg-paper dark:bg-ink p-8">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <span className="text-4xl mb-4 opacity-30">📄</span>
          <p className="text-sm text-ink-muted">No research document attached</p>
          <p className="text-xs text-ink-muted/70 mt-2">
            This sprout hasn't been processed yet
          </p>
        </div>
      </main>
    );
  }

  // Transform failed
  if (!tree) {
    return (
      <main className="flex-1 overflow-y-auto bg-paper dark:bg-ink p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700">Document rendering failed</p>
          <p className="text-xs text-red-500 mt-1">
            The research document could not be displayed
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-paper dark:bg-ink">
      <div className="max-w-3xl mx-auto p-8">
        <DataProvider initialData={{}}>
          <Renderer tree={tree} components={ResearchRegistry} />
        </DataProvider>
      </div>
    </main>
  );
};
```

**Create transform utility:**

Create `src/surface/components/modals/SproutFinishingRoom/json-render/transform.ts`:

```typescript
import type { ResearchDocument } from '@core/schema/research-sprout';

/**
 * Transform a ResearchDocument into a json-render tree structure
 */
export function researchDocumentToJsonRender(doc: ResearchDocument) {
  const children: any[] = [];

  // Header (always present)
  children.push({
    type: 'ResearchHeader',
    props: {
      position: doc.position,
      query: doc.query,
    },
  });

  // Analysis (always present)
  children.push({
    type: 'AnalysisBlock',
    props: {
      content: doc.analysis,
    },
  });

  // Sources (if present)
  if (doc.citations && doc.citations.length > 0) {
    children.push({
      type: 'SourceList',
      props: {
        sources: doc.citations.map((c, idx) => ({
          index: c.index ?? idx + 1,
          title: c.title,
          url: c.url,
          snippet: c.snippet,
        })),
      },
    });
  }

  // Limitations (if present)
  if (doc.limitations) {
    children.push({
      type: 'LimitationsBlock',
      props: {
        content: doc.limitations,
      },
    });
  }

  // Metadata (always present)
  children.push({
    type: 'Metadata',
    props: {
      status: doc.status,
      confidenceScore: doc.confidenceScore,
      wordCount: doc.wordCount,
    },
  });

  return {
    type: 'root',
    children,
  };
}
```

**Commit:** `feat(sfr): US-C002 - Render ResearchDocument via json-render`

---

### US-C003: Toggle Raw JSON View

**As a** Power User
**I want to** see the raw JSON data structure
**So that** I can inspect the AI-generated artifact for debugging or learning

**Priority:** P1 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Toggle button visible in header
  Given I open the Finishing Room with a ResearchDocument
  Then I should see a </> code toggle button above the document

Scenario: Toggle shows raw JSON
  Given I am viewing the rendered document
  When I click the </> toggle button
  Then the rendered view should be replaced with raw JSON
  And the JSON should be formatted with syntax highlighting
  And the toggle button should appear "active"

Scenario: Toggle returns to rendered view
  Given I am viewing raw JSON
  When I click the </> toggle button again
  Then the JSON view should be replaced with rendered components
  And the toggle button should appear "inactive"
```

**Implementation:**

Update `DocumentViewer.tsx` to add toggle state:

```typescript
const [showRawJson, setShowRawJson] = useState(false);

// In render:
<div className="max-w-3xl mx-auto p-8">
  {/* Toggle button */}
  <div className="flex justify-end mb-4">
    <button
      onClick={() => setShowRawJson(!showRawJson)}
      className={`px-3 py-1 text-sm font-mono rounded border ${
        showRawJson
          ? 'bg-ink text-paper border-ink'
          : 'bg-transparent text-ink-muted border-ink/20 hover:border-ink/40'
      }`}
      aria-pressed={showRawJson}
    >
      {'</>'}
    </button>
  </div>

  {showRawJson ? (
    <pre className="p-4 bg-ink/5 rounded overflow-x-auto text-xs font-mono">
      {JSON.stringify(sprout.researchDocument, null, 2)}
    </pre>
  ) : (
    <DataProvider initialData={{}}>
      <Renderer tree={tree} components={ResearchRegistry} />
    </DataProvider>
  )}
</div>
```

**Commit:** `feat(sfr): US-C003 - Raw JSON toggle`

---

### US-C004: Display Citations with Links

**As an** Explorer
**I want to** see source citations as clickable links
**So that** I can verify the research sources

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Citations render with numbers and links
  Given a ResearchDocument with citations array
  When I view the SourceList component
  Then each citation should show:
    | Element | Example |
    | Number | [1] |
    | Title | Anthropic API Pricing Documentation |
    | Link | Clickable URL |

Scenario: Citation links open in new tab
  Given I see a citation with a URL
  When I click the citation link
  Then the URL should open in a new browser tab
  And the current page should remain open
```

**Implementation:**

Already covered in the `SourceList` component in the registry (US-C001). This story ensures:
- `target="_blank"` on links
- `rel="noopener noreferrer"` for security
- Proper styling with hover states

**Commit:** `feat(sfr): US-C004 - Citations with links`

---

## Test File

Update: `tests/e2e/sprout-finishing-room.spec.ts`

```typescript
// Add to existing test file

test.describe('S2-SFR-Display: Provenance & Document Viewer', () => {

  test('US-B001: Lens origin displayed', async ({ page }) => {
    // Setup mock sprout with provenance
    await setupMockSprout(page);
    await openFinishingRoom(page);

    // Verify lens display
    await expect(page.getByText('🔮')).toBeVisible();
    await expect(page.getByText('Academic Researcher')).toBeVisible();
  });

  test('US-B002: Cognitive routing expands/collapses', async ({ page }) => {
    await setupMockSprout(page);
    await openFinishingRoom(page);

    const routingSection = page.locator('button', { hasText: 'Cognitive Routing' });
    await expect(routingSection).toBeVisible();

    // Click to expand
    await routingSection.click();
    await expect(page.getByText('Path')).toBeVisible();
    await expect(page.getByText('Prompt')).toBeVisible();

    // Click to collapse
    await routingSection.click();
    await expect(page.getByText('Path')).not.toBeVisible();
  });

  test('US-B003: Knowledge sources list', async ({ page }) => {
    await setupMockSprout(page);
    await openFinishingRoom(page);

    await expect(page.getByText('Knowledge Sources')).toBeVisible();
    await expect(page.getByText('grove-overview.md')).toBeVisible();
  });

  test('US-C002: ResearchDocument renders via json-render', async ({ page }) => {
    await setupMockSproutWithDocument(page);
    await openFinishingRoom(page);

    // Verify components render
    await expect(page.locator('header').getByText(/Grove enables/)).toBeVisible();
    await expect(page.getByText('Sources')).toBeVisible();
    await expect(page.getByText('COMPLETE')).toBeVisible();
  });

  test('US-C003: Raw JSON toggle', async ({ page }) => {
    await setupMockSproutWithDocument(page);
    await openFinishingRoom(page);

    const toggle = page.locator('button', { hasText: '</>' });
    await toggle.click();

    // Should show raw JSON
    await expect(page.locator('pre')).toBeVisible();
    await expect(page.locator('pre')).toContainText('"position"');

    // Toggle back
    await toggle.click();
    await expect(page.locator('pre')).not.toBeVisible();
  });

});
```

---

## File Structure (Final)

```
src/surface/components/modals/SproutFinishingRoom/
├── index.tsx                 # Exports (S1)
├── SproutFinishingRoom.tsx   # Modal container (S1)
├── FinishingRoomHeader.tsx   # Header bar (S1)
├── FinishingRoomStatus.tsx   # Status bar (S1)
├── ProvenancePanel.tsx       # Left column (S2) ← UPDATE
├── DocumentViewer.tsx        # Center column (S2) ← UPDATE
├── ActionPanel.tsx           # Right column (S3 placeholder)
├── components/
│   └── CognitiveRoutingSection.tsx  # (S2) ← NEW
└── json-render/
    ├── catalog.ts            # (S2) ← NEW
    ├── registry.tsx          # (S2) ← NEW
    └── transform.ts          # (S2) ← NEW

src/core/schema/
├── cognitive-routing.ts      # (S2) ← NEW
└── ...existing files
```

---

## Commit Sequence

```bash
# Epic B: Provenance Panel
git add . && git commit -m "feat(sfr): US-B001 - Display lens origin"
git add . && git commit -m "feat(sfr): US-B002 - Cognitive routing with expandable details"
git add . && git commit -m "feat(sfr): US-B003 - Knowledge sources list"
git add . && git commit -m "feat(sfr): US-B004 - Collapsible panel sections"

# Epic C: Document Viewer
git add . && git commit -m "feat(sfr): US-C001 - Install and configure json-render"
git add . && git commit -m "feat(sfr): US-C002 - Render ResearchDocument via json-render"
git add . && git commit -m "feat(sfr): US-C003 - Raw JSON toggle"
git add . && git commit -m "feat(sfr): US-C004 - Citations with links"

# Final
git push origin feat/s2-sfr-display
```

---

## Completion Checklist

Before marking sprint complete:

- [ ] All 8 stories implemented (B001-B004, C001-C004)
- [ ] json-render packages installed and working
- [ ] CognitiveRouting schema created
- [ ] All acceptance criteria pass
- [ ] Tests written and passing (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Screenshots captured
- [ ] PR created with summary

---

## References

- [json-render GitHub](https://github.com/vercel-labs/json-render) — Package documentation
- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) — Full product specification
- [USER_STORIES.md](./USER_STORIES.md) — All user stories with Gherkin criteria
- [S1-EXECUTION_PROMPT.md](./S1-EXECUTION_PROMPT.md) — Previous sprint for context

---

## Questions?

If blocked or unclear on any requirement:
1. Check the PRODUCT_SPEC.md first
2. Check json-render documentation
3. Check existing patterns in codebase
4. Ask in the sprint channel

**Do not** make assumptions that expand scope. When in doubt, implement the minimal version that satisfies the acceptance criteria.
