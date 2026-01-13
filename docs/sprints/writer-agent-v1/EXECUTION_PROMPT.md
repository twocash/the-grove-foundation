# Writer Agent Foundation v1 — Execution Prompt

**Sprint:** writer-agent-v1
**Type:** Core Infrastructure
**Executing Agent:** Claude Code CLI
**Contract Version:** Bedrock Sprint Contract v1.1

---

## Contract Compliance Checklist

Before each phase, verify:
- [ ] Read SPEC.md (this sprint)
- [ ] Read `docs/architecture/BEDROCK_SPRINT_CONTRACT.md`
- [ ] Understand DEX compliance requirements

**Forbidden Actions:**
- Creating new routes or navigation
- Modifying existing UI components
- Creating Playwright tests (defer to dedicated test sprint)
- Implementing features not in acceptance criteria

---

## Phase 1: Schema Foundation

### Objective
Create WriterAgentConfig and ResearchDocument schemas with Zod validation.

### File 1: `src/core/schema/writer-agent-config.ts`

Create this file with the following content:

```typescript
// src/core/schema/writer-agent-config.ts
// Writer Agent Configuration - Experience type variant
// Sprint: writer-agent-v1
//
// DEX: Declarative Sovereignty
// Writing behavior is controlled via config, not code changes.

import { z } from 'zod';

// =============================================================================
// Voice Configuration
// =============================================================================

export const VoiceConfigSchema = z.object({
  /** Writing formality level */
  formality: z.enum(['casual', 'professional', 'academic', 'technical']).default('professional'),

  /** Narrative perspective */
  perspective: z.enum(['first-person', 'third-person', 'neutral']).default('neutral'),

  /** Optional personality descriptor */
  personality: z.string().optional(),
});

export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;

// =============================================================================
// Document Structure Configuration
// =============================================================================

export const DocumentStructureConfigSchema = z.object({
  /** Include position/thesis section */
  includePosition: z.boolean().default(true),

  /** Include limitations section */
  includeLimitations: z.boolean().default(true),

  /** Citation style */
  citationStyle: z.enum(['inline', 'endnote']).default('inline'),

  /** Citation format */
  citationFormat: z.enum(['simple', 'apa', 'chicago']).default('simple'),

  /** Maximum document length in words (optional) */
  maxLength: z.number().min(100).max(10000).optional(),
});

export type DocumentStructureConfig = z.infer<typeof DocumentStructureConfigSchema>;

// =============================================================================
// Quality Rules Configuration
// =============================================================================

export const QualityRulesConfigSchema = z.object({
  /** Require citations for all claims */
  requireCitations: z.boolean().default(true),

  /** Minimum confidence score to include evidence (0-1) */
  minConfidenceToInclude: z.number().min(0).max(1).default(0.5),

  /** Flag uncertain claims in output */
  flagUncertainty: z.boolean().default(true),
});

export type QualityRulesConfig = z.infer<typeof QualityRulesConfigSchema>;

// =============================================================================
// Main Schema
// =============================================================================

export const WriterAgentConfigPayloadSchema = z.object({
  /** Voice and tone settings */
  voice: VoiceConfigSchema.default({}),

  /** Document structure settings */
  documentStructure: DocumentStructureConfigSchema.default({}),

  /** Quality control rules */
  qualityRules: QualityRulesConfigSchema.default({}),
});

export type WriterAgentConfigPayload = z.infer<typeof WriterAgentConfigPayloadSchema>;

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD: WriterAgentConfigPayload = {
  voice: {
    formality: 'professional',
    perspective: 'neutral',
  },
  documentStructure: {
    includePosition: true,
    includeLimitations: true,
    citationStyle: 'inline',
    citationFormat: 'simple',
  },
  qualityRules: {
    requireCitations: true,
    minConfidenceToInclude: 0.5,
    flagUncertainty: true,
  },
};

// =============================================================================
// Factory
// =============================================================================

export function createWriterAgentConfigPayload(
  overrides?: Partial<WriterAgentConfigPayload>
): WriterAgentConfigPayload {
  return {
    ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
    ...overrides,
    voice: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD.voice,
      ...overrides?.voice,
    },
    documentStructure: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD.documentStructure,
      ...overrides?.documentStructure,
    },
    qualityRules: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD.qualityRules,
      ...overrides?.qualityRules,
    },
  };
}
```

### File 2: `src/core/schema/research-document.ts`

Create this file with the following content:

```typescript
// src/core/schema/research-document.ts
// Research Document - Output artifact from Writer Agent
// Sprint: writer-agent-v1
//
// DEX: Provenance as Infrastructure
// Every citation traces back to evidence sources.

import { z } from 'zod';

// =============================================================================
// Citation Schema
// =============================================================================

export const CitationSchema = z.object({
  /** Citation index [1], [2], etc. */
  index: z.number().min(1),

  /** Source title */
  title: z.string(),

  /** Source URL */
  url: z.string().url(),

  /** Relevant excerpt used in analysis */
  snippet: z.string(),

  /** Domain for credibility signal */
  domain: z.string(),

  /** ISO timestamp when source was accessed */
  accessedAt: z.string().datetime(),
});

export type Citation = z.infer<typeof CitationSchema>;

// =============================================================================
// Research Document Schema
// =============================================================================

export const ResearchDocumentSchema = z.object({
  /** Unique document ID */
  id: z.string(),

  /** Link to source EvidenceBundle */
  evidenceBundleId: z.string(),

  /** Original research query */
  query: z.string(),

  // Content
  /** Position/thesis (1-3 sentences) */
  position: z.string(),

  /** Full analysis in markdown */
  analysis: z.string(),

  /** What couldn't be determined (optional) */
  limitations: z.string().optional(),

  /** Citations referenced in analysis */
  citations: z.array(CitationSchema),

  // Metadata
  /** ISO timestamp when document was created */
  createdAt: z.string().datetime(),

  /** Word count of analysis */
  wordCount: z.number(),

  /** Processing status */
  status: z.enum(['complete', 'partial', 'insufficient-evidence']),

  /** Confidence score inherited from evidence (0-1) */
  confidenceScore: z.number().min(0).max(1),
});

export type ResearchDocument = z.infer<typeof ResearchDocumentSchema>;

// =============================================================================
// Factory
// =============================================================================

export function createResearchDocument(
  id: string,
  evidenceBundleId: string,
  query: string,
  position: string,
  analysis: string,
  citations: Citation[],
  confidenceScore: number,
  limitations?: string
): ResearchDocument {
  return {
    id,
    evidenceBundleId,
    query,
    position,
    analysis,
    limitations,
    citations,
    createdAt: new Date().toISOString(),
    wordCount: analysis.split(/\s+/).length,
    status: citations.length > 0 ? 'complete' : 'insufficient-evidence',
    confidenceScore,
  };
}

// =============================================================================
// Insufficient Evidence Factory
// =============================================================================

export function createInsufficientEvidenceDocument(
  id: string,
  evidenceBundleId: string,
  query: string
): ResearchDocument {
  return {
    id,
    evidenceBundleId,
    query,
    position: 'Insufficient evidence to form a position.',
    analysis: 'The research did not yield enough sources to provide a meaningful analysis. Consider refining the research query or expanding the search scope.',
    citations: [],
    createdAt: new Date().toISOString(),
    wordCount: 0,
    status: 'insufficient-evidence',
    confidenceScore: 0,
  };
}
```

### Build Gate
```bash
npm run build
```

**Expected:** Build passes with no errors

---

## Phase 2: Registry Integration

### Objective
Register WriterAgentConfig in EXPERIENCE_TYPE_REGISTRY and add console schema.

### File 3: Modify `src/bedrock/types/experience.types.ts`

Add import at top of file (after existing imports):

```typescript
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';
```

Add new type entry in `EXPERIENCE_TYPE_REGISTRY` object (after `research-agent-config` entry):

```typescript
  // Sprint: writer-agent-v1 - Writer Agent configuration
  // SINGLETON pattern: One active config per grove
  'writer-agent-config': {
    type: 'writer-agent-config',
    label: 'Writer Agent',
    icon: 'edit_note',
    description: 'Configure document writing: voice, structure, citation format',
    defaultPayload: DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
    wizardId: undefined, // Simple form, no wizard
    editorComponent: 'WriterAgentConfigEditor',
    allowMultipleActive: false, // SINGLETON: One active config
    routePath: '/bedrock/experience',
    color: '#26A69A', // Teal for writing
    // Polymorphic console support
    cardComponent: 'WriterAgentConfigCard',
    dataHookName: 'useWriterAgentConfigData',
    searchFields: ['meta.title', 'meta.description'],
    metrics: [
      { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: status=active)', typeFilter: 'writer-agent-config' },
    ],
  } satisfies ExperienceTypeDefinition<WriterAgentConfigPayload>,
```

Add to `ExperiencePayloadMap` interface:

```typescript
  'writer-agent-config': WriterAgentConfigPayload;
```

### File 4: Modify `src/bedrock/config/consoles.ts`

Add console schema (before the CONSOLE_SCHEMAS export):

```typescript
// =============================================================================
// Writer Agent Config Console Schema
// Sprint: writer-agent-v1
// =============================================================================

export const writerAgentConfigSchema: ConsoleSchema = {
  id: 'writer-agent-config',

  identity: {
    title: 'Writer Agents',
    icon: 'edit_note',
    description: 'Configure document writing behavior',
    color: '#26A69A',
  },

  inspectorPanels: [
    {
      id: 'writer-settings',
      label: 'Writer Settings',
      icon: 'edit_note',
      sections: [
        {
          id: 'voice',
          label: 'Voice & Tone',
          icon: 'record_voice_over',
          fieldGroup: 'voice',
        },
        {
          id: 'structure',
          label: 'Document Structure',
          icon: 'article',
          fieldGroup: 'documentStructure',
        },
        {
          id: 'quality',
          label: 'Quality Rules',
          icon: 'verified',
          fieldGroup: 'qualityRules',
        },
      ],
    },
  ],

  fieldGroups: {
    voice: {
      fields: [
        {
          key: 'voice.formality',
          label: 'Formality',
          type: 'select',
          options: [
            { value: 'casual', label: 'Casual' },
            { value: 'professional', label: 'Professional' },
            { value: 'academic', label: 'Academic' },
            { value: 'technical', label: 'Technical' },
          ],
        },
        {
          key: 'voice.perspective',
          label: 'Perspective',
          type: 'select',
          options: [
            { value: 'first-person', label: 'First Person' },
            { value: 'third-person', label: 'Third Person' },
            { value: 'neutral', label: 'Neutral' },
          ],
        },
        {
          key: 'voice.personality',
          label: 'Personality',
          type: 'text',
          placeholder: 'Optional personality descriptor',
        },
      ],
    },
    documentStructure: {
      fields: [
        {
          key: 'documentStructure.includePosition',
          label: 'Include Position',
          type: 'toggle',
        },
        {
          key: 'documentStructure.includeLimitations',
          label: 'Include Limitations',
          type: 'toggle',
        },
        {
          key: 'documentStructure.citationStyle',
          label: 'Citation Style',
          type: 'select',
          options: [
            { value: 'inline', label: 'Inline [1]' },
            { value: 'endnote', label: 'Endnotes' },
          ],
        },
        {
          key: 'documentStructure.citationFormat',
          label: 'Citation Format',
          type: 'select',
          options: [
            { value: 'simple', label: 'Simple' },
            { value: 'apa', label: 'APA' },
            { value: 'chicago', label: 'Chicago' },
          ],
        },
        {
          key: 'documentStructure.maxLength',
          label: 'Max Length (words)',
          type: 'number',
          min: 100,
          max: 10000,
        },
      ],
    },
    qualityRules: {
      fields: [
        {
          key: 'qualityRules.requireCitations',
          label: 'Require Citations',
          type: 'toggle',
        },
        {
          key: 'qualityRules.minConfidenceToInclude',
          label: 'Min Confidence',
          type: 'number',
          min: 0,
          max: 1,
          step: 0.1,
        },
        {
          key: 'qualityRules.flagUncertainty',
          label: 'Flag Uncertainty',
          type: 'toggle',
        },
      ],
    },
  },
};
```

Add to `CONSOLE_SCHEMAS` object:

```typescript
  'writer-agent-config': writerAgentConfigSchema,
```

### Build Gate
```bash
npm run build
```

**Expected:** Build passes, type selector shows "Writer Agent"

---

## Phase 3: System Prompt

### Objective
Create the writer system prompt that guides LLM output.

### File 5: `src/explore/prompts/writer-system-prompt.ts`

Create this file:

```typescript
// src/explore/prompts/writer-system-prompt.ts
// Writer System Prompt - Guides research document generation
// Sprint: writer-agent-v1
//
// DEX: Declarative Sovereignty
// Voice and structure are injected based on config.

import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';

// =============================================================================
// Base System Prompt
// =============================================================================

const BASE_SYSTEM_PROMPT = `You are a research writing agent for Grove, a personal knowledge system.

## Your Mission

Transform research evidence into a structured document with:
- A clear position (thesis)
- Supporting analysis
- Properly formatted citations

## Output Format

Return valid JSON:

\`\`\`json
{
  "position": "1-3 sentence thesis summarizing findings",
  "analysis": "Full markdown analysis with ## sections and [n] citations",
  "limitations": "What couldn't be determined or verified (optional)",
  "citations": [
    {
      "index": 1,
      "title": "Source title",
      "url": "https://...",
      "snippet": "Relevant excerpt from source",
      "domain": "example.com"
    }
  ]
}
\`\`\`

## Quality Standards

- Every claim in analysis must have a citation [n]
- Position must be supported by analysis
- Acknowledge uncertainty explicitly
- Prefer depth over breadth
- If sources conflict, present both views
- Never fabricate sources
`;

// =============================================================================
// Voice Modifiers
// =============================================================================

const VOICE_MODIFIERS: Record<string, string> = {
  casual: `
## Voice: Casual
Write in a conversational, accessible tone. Use contractions and everyday language.
Avoid jargon unless explaining it. Make complex topics feel approachable.`,

  professional: `
## Voice: Professional
Write in a clear, business-appropriate tone. Be direct and confident.
Use precise language. Maintain objectivity while being engaging.`,

  academic: `
## Voice: Academic
Write in a scholarly tone suitable for academic audiences. Use formal language.
Be thorough and precise. Include nuance and acknowledge complexity.
Use hedging language where appropriate ("suggests", "indicates").`,

  technical: `
## Voice: Technical
Write for a technical audience. Be precise and specific.
Use domain terminology appropriately. Focus on accuracy and detail.
Include technical specifications when relevant.`,
};

const PERSPECTIVE_MODIFIERS: Record<string, string> = {
  'first-person': 'Use first-person perspective ("I found", "my analysis").',
  'third-person': 'Use third-person perspective ("the research shows", "analysis reveals").',
  'neutral': 'Use neutral, objective language. Avoid personal pronouns.',
};

// =============================================================================
// Structure Modifiers
// =============================================================================

function getStructureInstructions(config: WriterAgentConfigPayload): string {
  const parts: string[] = ['## Document Structure'];

  if (config.documentStructure.includePosition) {
    parts.push('- Start with a clear position/thesis section');
  }

  if (config.documentStructure.includeLimitations) {
    parts.push('- End with a limitations section noting gaps or uncertainties');
  }

  if (config.documentStructure.citationStyle === 'inline') {
    parts.push('- Use inline citations: [1], [2], etc.');
  } else {
    parts.push('- Place all citations as endnotes at the end');
  }

  if (config.documentStructure.maxLength) {
    parts.push(`- Keep analysis under ${config.documentStructure.maxLength} words`);
  }

  return parts.join('\n');
}

// =============================================================================
// Quality Modifiers
// =============================================================================

function getQualityInstructions(config: WriterAgentConfigPayload): string {
  const parts: string[] = ['## Quality Rules'];

  if (config.qualityRules.requireCitations) {
    parts.push('- Every factual claim MUST have a citation');
  }

  if (config.qualityRules.flagUncertainty) {
    parts.push('- Explicitly flag uncertain or contested claims');
  }

  parts.push(`- Only include evidence with confidence >= ${config.qualityRules.minConfidenceToInclude}`);

  return parts.join('\n');
}

// =============================================================================
// Prompt Builder
// =============================================================================

export function buildWriterSystemPrompt(config: WriterAgentConfigPayload): string {
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  // Add voice modifiers
  parts.push(VOICE_MODIFIERS[config.voice.formality] || VOICE_MODIFIERS.professional);
  parts.push(PERSPECTIVE_MODIFIERS[config.voice.perspective] || PERSPECTIVE_MODIFIERS.neutral);

  if (config.voice.personality) {
    parts.push(`\nAdditional personality: ${config.voice.personality}`);
  }

  // Add structure instructions
  parts.push(getStructureInstructions(config));

  // Add quality instructions
  parts.push(getQualityInstructions(config));

  return parts.join('\n\n');
}

// =============================================================================
// Evidence Prompt Builder
// =============================================================================

export function buildEvidencePrompt(query: string, evidence: string): string {
  return `## Research Query
"${query}"

## Evidence Collected
${evidence}

## Instructions
Transform the above evidence into a structured research document following your guidelines.
Return your response as valid JSON matching the specified format.`;
}
```

### Build Gate
```bash
npm run build
```

**Expected:** Build passes

---

## Phase 4: Writer Service

### Objective
Create the WriterAgent service that transforms evidence into documents.

### File 6: `src/explore/services/writer-agent.ts`

Create this file:

```typescript
// src/explore/services/writer-agent.ts
// Writer Agent Service - Transforms evidence into research documents
// Sprint: writer-agent-v1
//
// DEX: Capability Agnosticism
// Service abstracts LLM. Config controls behavior.

import type { EvidenceBundle, BranchEvidence, Source } from '@core/schema/evidence-bundle';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import {
  type ResearchDocument,
  type Citation,
  createResearchDocument,
  createInsufficientEvidenceDocument,
} from '@core/schema/research-document';
import { buildWriterSystemPrompt, buildEvidencePrompt } from '../prompts/writer-system-prompt';

// =============================================================================
// Types
// =============================================================================

export interface WriterProgress {
  type: 'preparing' | 'writing' | 'formatting' | 'complete' | 'error';
  message?: string;
}

export type OnWriterProgressFn = (progress: WriterProgress) => void;

interface LLMWriterOutput {
  position: string;
  analysis: string;
  limitations?: string;
  citations: Array<{
    index: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
}

// =============================================================================
// Service
// =============================================================================

/**
 * Transform an EvidenceBundle into a ResearchDocument
 *
 * @param evidenceBundle - The evidence collected from research
 * @param query - The original research query
 * @param config - Writer configuration
 * @param onProgress - Optional progress callback
 * @returns ResearchDocument
 */
export async function writeResearchDocument(
  evidenceBundle: EvidenceBundle,
  query: string,
  config: WriterAgentConfigPayload,
  onProgress?: OnWriterProgressFn
): Promise<ResearchDocument> {
  const documentId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // Check for sufficient evidence
  if (evidenceBundle.totalSources === 0) {
    console.log('[WriterAgent] Insufficient evidence - no sources found');
    return createInsufficientEvidenceDocument(documentId, evidenceBundle.sproutId, query);
  }

  onProgress?.({ type: 'preparing', message: 'Preparing evidence for writing...' });

  // Build prompts
  const systemPrompt = buildWriterSystemPrompt(config);
  const evidenceText = formatEvidenceForPrompt(evidenceBundle, config);
  const userPrompt = buildEvidencePrompt(query, evidenceText);

  console.log('[WriterAgent] System prompt built');
  console.log('[WriterAgent] Evidence formatted:', evidenceBundle.totalSources, 'sources');

  onProgress?.({ type: 'writing', message: 'Generating research document...' });

  // Call LLM
  // TODO: Wire to actual Gemini/Claude service
  const llmOutput = await callLLMForWriting(systemPrompt, userPrompt);

  onProgress?.({ type: 'formatting', message: 'Formatting citations...' });

  // Map sources to citations with accessedAt
  const citations = mapSourcesToCitations(llmOutput.citations, evidenceBundle);

  onProgress?.({ type: 'complete' });

  return createResearchDocument(
    documentId,
    evidenceBundle.sproutId,
    query,
    llmOutput.position,
    llmOutput.analysis,
    citations,
    evidenceBundle.confidenceScore,
    llmOutput.limitations
  );
}

// =============================================================================
// Evidence Formatting
// =============================================================================

function formatEvidenceForPrompt(
  bundle: EvidenceBundle,
  config: WriterAgentConfigPayload
): string {
  const sections: string[] = [];
  let sourceIndex = 1;

  for (const branch of bundle.branches) {
    if (branch.status !== 'complete') continue;

    // Filter by confidence if required
    const filteredSources = branch.sources.filter(
      s => branch.relevanceScore >= config.qualityRules.minConfidenceToInclude
    );

    if (filteredSources.length === 0) continue;

    sections.push(`### Branch: ${branch.branchQuery}`);
    sections.push(`Relevance: ${(branch.relevanceScore * 100).toFixed(0)}%`);
    sections.push('');

    for (const source of filteredSources) {
      sections.push(`[${sourceIndex}] ${source.title}`);
      sections.push(`URL: ${source.url}`);
      sections.push(`Type: ${source.sourceType || 'unknown'}`);
      sections.push(`Excerpt: "${source.snippet}"`);
      sections.push('');
      sourceIndex++;
    }

    if (branch.findings.length > 0) {
      sections.push('Key findings:');
      for (const finding of branch.findings) {
        sections.push(`- ${finding}`);
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

// =============================================================================
// Citation Mapping
// =============================================================================

function mapSourcesToCitations(
  llmCitations: LLMWriterOutput['citations'],
  bundle: EvidenceBundle
): Citation[] {
  // Collect all sources from evidence
  const allSources: Source[] = bundle.branches.flatMap(b => b.sources);

  return llmCitations.map(c => {
    // Try to find matching source for accessedAt
    const matchingSource = allSources.find(s => s.url === c.url);

    return {
      index: c.index,
      title: c.title,
      url: c.url,
      snippet: c.snippet,
      domain: c.domain || new URL(c.url).hostname,
      accessedAt: matchingSource?.accessedAt || new Date().toISOString(),
    };
  });
}

// =============================================================================
// LLM Call (Placeholder)
// =============================================================================

/**
 * Call LLM for document writing
 *
 * TODO: Wire to actual Gemini/Claude service
 * For now, returns placeholder structure
 */
async function callLLMForWriting(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMWriterOutput> {
  console.log('[WriterAgent] Calling LLM for writing...');
  console.log('[WriterAgent] System prompt length:', systemPrompt.length);
  console.log('[WriterAgent] User prompt length:', userPrompt.length);

  // TODO: Replace with actual LLM call
  // import { geminiService } from '@/services/gemini';
  // const response = await geminiService.generate({
  //   systemPrompt,
  //   userPrompt,
  //   responseFormat: 'json',
  // });
  // return JSON.parse(response.content);

  console.warn('[WriterAgent] LLM call not yet wired - returning placeholder');

  // Placeholder response indicating real implementation needed
  return {
    position: '[Writer Agent LLM integration pending]',
    analysis: '## Analysis Pending\n\nThe Writer Agent LLM integration is not yet complete. ' +
      'This placeholder will be replaced with actual generated content once the LLM service is wired.\n\n' +
      '## Next Steps\n\n1. Wire Gemini/Claude service\n2. Parse JSON response\n3. Validate output structure',
    limitations: 'LLM integration pending.',
    citations: [],
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { ResearchDocument, Citation };
```

### Build Gate
```bash
npm run build
```

**Expected:** Build passes

---

## Phase 5: Verification

### Objective
Verify all components work together and update documentation.

### Verification Steps

1. **Build passes:**
```bash
npm run build
```

2. **Lint passes:**
```bash
npm run lint
```

3. **Manual verification:**
- Start dev server
- Navigate to Experience Console
- Verify "Writer Agent" appears in type selector
- Create a Writer Agent config
- Verify form renders correctly

4. **Console logging check:**
Add temporary test code to verify service:
```typescript
// In any test file or console
import { writeResearchDocument } from '@/explore/services/writer-agent';
import { createEvidenceBundle } from '@core/schema/evidence-bundle';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';

// Test with empty bundle
const emptyBundle = createEvidenceBundle('test-sprout', [], 0, 0);
const doc = await writeResearchDocument(emptyBundle, 'test query', DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD);
console.log('[Test] Document status:', doc.status); // Should be 'insufficient-evidence'
```

### Build Gate
```bash
npm run build && npm run lint
```

**Expected:** All passes, no TypeScript errors

---

## Completion Checklist

### Schema Foundation
- [ ] `writer-agent-config.ts` created with Zod schemas
- [ ] `research-document.ts` created with Zod schemas
- [ ] Schemas export correctly

### Registry Integration
- [ ] Import added to `experience.types.ts`
- [ ] `writer-agent-config` entry added to registry
- [ ] `ExperiencePayloadMap` updated
- [ ] Console schema added to `consoles.ts`
- [ ] `CONSOLE_SCHEMAS` updated

### System Prompt
- [ ] `writer-system-prompt.ts` created
- [ ] Voice modifiers implemented
- [ ] Structure instructions implemented
- [ ] Quality rules implemented

### Writer Service
- [ ] `writer-agent.ts` created
- [ ] Evidence formatting implemented
- [ ] Citation mapping implemented
- [ ] LLM call placeholder in place

### Build Gates
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No TypeScript errors

---

## Post-Completion

1. Update Notion Feature Roadmap status to "complete"
2. Create Sprint Execution Tracker entry
3. Document any deviations in DEVLOG
4. Prepare for Sprint 3 (Pipeline Integration)
