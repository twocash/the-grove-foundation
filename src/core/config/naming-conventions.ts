// src/core/config/naming-conventions.ts
// Canonical Naming Conventions for Grove Documents
// Sprint: S28-PIPE - Document naming and provenance standardization
//
// DEX: Provenance as Infrastructure
// Every document carries full traceability from query to output.
//
// These are hardcoded stubs to be converted to a configurable system object.

import type { ResearchDocument } from '@core/schema/research-document';
import type { Sprout } from '@core/schema/sprout';

// =============================================================================
// Type and Domain Code Maps (from Grove Corpus conventions)
// =============================================================================

/**
 * Document type codes for filename generation.
 * Maps template types to short codes.
 */
export const TYPE_CODES = {
  'vision': 'v',
  'vision-paper': 'v',
  'spec': 's',
  'specification': 's',
  'engineering': 's',
  'research': 'r',
  'blog': 'b',
  'blog-post': 'b',
  'policy': 'p',
  'higher-ed-policy': 'p',
} as const;

/**
 * Reverse mapping: code to full type name
 */
export const TYPE_NAMES: Record<string, string> = {
  'v': 'vision',
  's': 'spec',
  'r': 'research',
  'b': 'blog',
  'p': 'policy',
};

/**
 * Cognitive domain codes for filename generation.
 * Maps domain identifiers to short codes.
 */
export const DOMAIN_CODES = {
  'economics': 'econ',
  'architecture': 'arch',
  'methodology': 'method',
  'edge-computing': 'edge',
  'engagement': 'engage',
  'ratchet-thesis': 'ratchet',
  'patterns': 'pattern',
  'research': 'research',
  'governance': 'gov',
  'federation': 'fed',
  'infrastructure': 'infra',
  'ai': 'ai',
  'distributed-systems': 'dist',
  'security': 'sec',
  'privacy': 'priv',
} as const;

/**
 * Reverse mapping: code to full domain name
 */
export const DOMAIN_NAMES: Record<string, string> = {
  'econ': 'economics',
  'arch': 'architecture',
  'method': 'methodology',
  'edge': 'edge-computing',
  'engage': 'engagement',
  'ratchet': 'ratchet-thesis',
  'pattern': 'patterns',
  'research': 'research',
  'gov': 'governance',
  'fed': 'federation',
  'infra': 'infrastructure',
  'ai': 'ai',
  'dist': 'distributed-systems',
  'sec': 'security',
  'priv': 'privacy',
};

// =============================================================================
// Provenance Types
// =============================================================================

/**
 * Full provenance structure for document frontmatter.
 * Follows 4D Experience Model terminology.
 *
 * Designed for reverse-engineering knowledge routes from embedded documents.
 * All IDs enable complete traceability through the system.
 */
export interface DocumentProvenance {
  // === Identity (Primary Keys) ===
  id: string;                              // Document ID
  sproutId?: string;                       // Source sprout that generated this
  groveId?: string;                        // Grove context (multi-tenancy)
  evidenceBundleId?: string;               // Research evidence bundle ID

  // === Authorship ===
  author: string;
  copyright: string;

  // === Timestamps ===
  date: string;                            // YYYY-MM-DD
  generatedAt: string;                     // ISO timestamp
  capturedAt?: string;                     // When original query was captured
  researchCompletedAt?: string;            // When research phase completed

  // === Document Classification ===
  type: string;                            // Full type name (vision, spec, etc.)
  typeCode: string;                        // Short code (v, s, r, etc.)
  status: 'complete' | 'partial' | 'insufficient-evidence';

  // === 4D Experience Provenance (with IDs for routing) ===
  cognitiveDomain?: string;                // Domain name
  cognitiveDomainId?: string;              // Domain ID for routing
  experiencePath?: string;                 // Path name
  experiencePathId?: string;               // Path ID for routing
  experienceMomentId?: string;             // Moment ID (if from sequence)

  // === Lens (with ID) ===
  lens?: string;                           // Lens name
  lensId?: string;                         // Lens ID for lookup

  // === Cognitive Routing (4-field model) ===
  routing: {
    path?: string;                         // Experience path taken
    prompt: string;                        // Original query/prompt
    inspiration?: string;                  // Triggering context
    domain?: string;                       // Cognitive domain
  };

  // === Writer Pipeline (with config IDs) ===
  template?: string;                       // Template name
  templateId?: string;                     // Template row ID
  templateVersion?: number;                // Template version
  templateSource?: 'system-seed' | 'user-created' | 'forked' | 'imported';
  writerConfigId?: string;                 // Writer config row ID
  writerConfigVersion?: number;            // Writer config version
  renderingSource?: 'template' | 'default-writer' | 'default-research';

  // === Research Pipeline (optional, for research-based docs) ===
  researchConfigId?: string;               // Research agent config row ID
  researchConfigVersion?: number;          // Research agent config version

  // === Evidence Quality ===
  confidenceScore: number;
  sourceCount: number;
  wordCount: number;

  // === Source References (for citation traceability) ===
  sourceIds?: string[];                    // IDs of source documents used
  sourceUrls?: string[];                   // URLs of external sources

  // === Tags ===
  tags: string[];

  // === Embedding Metadata (for knowledge indexing) ===
  embeddingModel?: string;                 // Model used for embedding
  embeddedAt?: string;                     // When document was embedded
  chunkCount?: number;                     // Number of chunks created
}

/**
 * Minimal provenance info passed from UI components
 */
export interface ProvenanceInput {
  // Grove context
  groveId?: string;

  // Lens
  lensName?: string;
  lensId?: string;

  // 4D Experience
  cognitiveDomain?: string;
  cognitiveDomainId?: string;
  experiencePath?: string;
  experiencePathId?: string;
  experienceMomentId?: string;

  // Template
  templateName?: string;
  templateId?: string;
  templateVersion?: number;
  templateSource?: 'system-seed' | 'user-created' | 'forked' | 'imported';

  // Writer config
  writerConfigId?: string;
  writerConfigVersion?: number;
  renderingSource?: 'template' | 'default-writer' | 'default-research';

  // Research config (if applicable)
  researchConfigId?: string;
  researchConfigVersion?: number;
  evidenceBundleId?: string;
  researchCompletedAt?: string;

  // Timestamps
  generatedAt?: string;

  // Source references
  sourceIds?: string[];
  sourceUrls?: string[];
}

/**
 * Flat metadata for embedding/indexing.
 * All IDs concatenated for semantic searchability.
 */
export interface EmbeddingMetadata {
  // Concatenated ID chain for routing reconstruction
  idChain: string;  // Format: grove:lens:domain:path:template:config

  // Individual IDs (for filtering)
  groveId?: string;
  lensId?: string;
  cognitiveDomainId?: string;
  experiencePathId?: string;
  templateId?: string;
  writerConfigId?: string;
  researchConfigId?: string;

  // Classification (for filtering)
  type: string;
  typeCode: string;
  status: string;
  confidenceScore: number;

  // Tags (for filtering)
  tags: string[];

  // Timestamps (for temporal queries)
  generatedAt: string;
  date: string;
}

// =============================================================================
// Configuration Stubs (to become system objects)
// =============================================================================

/**
 * Default author for all Grove documents.
 * TODO: Make configurable per grove.
 */
export const DEFAULT_AUTHOR = 'Jim Calhoun';

/**
 * Copyright holder template.
 * TODO: Make configurable per grove.
 */
export const COPYRIGHT_TEMPLATE = '{year} The Grove Foundation';

/**
 * Filename pattern template.
 * Pattern: YYMMDD-{type}-{domain}-{slug}.md
 */
export const FILENAME_PATTERN = '{date}-{type}-{domain}-{slug}.md';

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a URL-safe slug from a query string.
 */
export function slugify(text: string, maxLength = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength);
}

/**
 * Format date as YYMMDD for filenames.
 */
export function formatDateCode(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Get type code from template name or type.
 */
export function getTypeCode(templateOrType: string): string {
  const normalized = templateOrType.toLowerCase().replace(/\s+/g, '-');
  return TYPE_CODES[normalized as keyof typeof TYPE_CODES] || 'r';
}

/**
 * Get domain code from cognitive domain name.
 */
export function getDomainCode(domain: string): string {
  const normalized = domain.toLowerCase().replace(/\s+/g, '-');
  return DOMAIN_CODES[normalized as keyof typeof DOMAIN_CODES] || normalized.slice(0, 6);
}

/**
 * Infer tags from document content and provenance.
 */
export function inferTags(
  provenance: ProvenanceInput,
  query: string
): string[] {
  const tags: string[] = [];

  // Add cognitive domain as tag
  if (provenance.cognitiveDomain) {
    tags.push(provenance.cognitiveDomain);
  }

  // Add template type as tag
  if (provenance.templateName) {
    const typeTag = provenance.templateName.toLowerCase().replace(/\s+/g, '-');
    tags.push(typeTag);
  }

  // Extract potential tags from query (simple keyword extraction)
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4)
    .filter(word => !['about', 'which', 'their', 'would', 'could', 'should'].includes(word))
    .slice(0, 3);

  tags.push(...keywords);

  // Deduplicate
  return [...new Set(tags)];
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Generate canonical filename for a document.
 * Pattern: YYMMDD-{type}-{domain}-{slug}.md
 */
export function generateCanonicalFilename(
  doc: ResearchDocument,
  provenance: ProvenanceInput
): string {
  const dateCode = formatDateCode(doc.createdAt);
  const typeCode = getTypeCode(provenance.templateName || 'research');
  const domainCode = getDomainCode(provenance.cognitiveDomain || 'research');
  const slug = slugify(doc.query);

  return `${dateCode}-${typeCode}-${domainCode}-${slug}.md`;
}

/**
 * Build full provenance object from document and input provenance.
 */
export function buildFullProvenance(
  doc: ResearchDocument,
  sprout: Sprout | undefined,
  input: ProvenanceInput
): DocumentProvenance {
  const now = new Date();
  const year = (input.generatedAt ? new Date(input.generatedAt) : now).getFullYear();

  // Extract source URLs from citations
  const sourceUrls = doc.citations?.map(c => c.url).filter(Boolean) || [];

  return {
    // === Identity (Primary Keys) ===
    id: doc.id,
    sproutId: sprout?.id,
    groveId: input.groveId || 'main',  // Default grove
    evidenceBundleId: input.evidenceBundleId,

    // === Authorship ===
    author: DEFAULT_AUTHOR,
    copyright: COPYRIGHT_TEMPLATE.replace('{year}', String(year)),

    // === Timestamps ===
    date: doc.createdAt.split('T')[0],
    generatedAt: input.generatedAt || doc.createdAt,
    capturedAt: sprout?.capturedAt,
    researchCompletedAt: input.researchCompletedAt,

    // === Document Classification ===
    type: TYPE_NAMES[getTypeCode(input.templateName || 'research')] || 'research',
    typeCode: getTypeCode(input.templateName || 'research'),
    status: doc.status,

    // === 4D Experience Provenance ===
    cognitiveDomain: input.cognitiveDomain || sprout?.provenance?.hub?.name,
    cognitiveDomainId: input.cognitiveDomainId || sprout?.provenance?.hub?.id,
    experiencePath: input.experiencePath || sprout?.provenance?.journey?.name,
    experiencePathId: input.experiencePathId || sprout?.provenance?.journey?.id,
    experienceMomentId: input.experienceMomentId,

    // === Lens ===
    lens: input.lensName || sprout?.provenance?.lens?.name,
    lensId: input.lensId || sprout?.provenance?.lens?.id,

    // === Cognitive Routing (4-field model) ===
    routing: {
      path: input.experiencePath || sprout?.provenance?.journey?.name,
      prompt: doc.query,
      inspiration: sprout?.query || doc.query,
      domain: input.cognitiveDomain || sprout?.provenance?.hub?.name,
    },

    // === Writer Pipeline ===
    template: input.templateName,
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    templateSource: input.templateSource,
    writerConfigId: input.writerConfigId,
    writerConfigVersion: input.writerConfigVersion,
    renderingSource: input.renderingSource,

    // === Research Pipeline ===
    researchConfigId: input.researchConfigId,
    researchConfigVersion: input.researchConfigVersion,

    // === Evidence Quality ===
    confidenceScore: doc.confidenceScore,
    sourceCount: doc.citations.length,
    wordCount: doc.wordCount,

    // === Source References ===
    sourceIds: input.sourceIds,
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : undefined,

    // === Tags ===
    tags: inferTags(input, doc.query),
  };
}

/**
 * Build embedding metadata for knowledge indexing.
 * Creates a flat structure optimized for vector DB metadata filtering.
 */
export function buildEmbeddingMetadata(provenance: DocumentProvenance): EmbeddingMetadata {
  // Build ID chain for routing reconstruction
  // Format: grove:lens:domain:path:template:writerConfig
  const idParts = [
    provenance.groveId || '_',
    provenance.lensId || '_',
    provenance.cognitiveDomainId || '_',
    provenance.experiencePathId || '_',
    provenance.templateId || '_',
    provenance.writerConfigId || '_',
  ];
  const idChain = idParts.join(':');

  return {
    idChain,

    // Individual IDs
    groveId: provenance.groveId,
    lensId: provenance.lensId,
    cognitiveDomainId: provenance.cognitiveDomainId,
    experiencePathId: provenance.experiencePathId,
    templateId: provenance.templateId,
    writerConfigId: provenance.writerConfigId,
    researchConfigId: provenance.researchConfigId,

    // Classification
    type: provenance.type,
    typeCode: provenance.typeCode,
    status: provenance.status,
    confidenceScore: provenance.confidenceScore,

    // Tags
    tags: provenance.tags,

    // Timestamps
    generatedAt: provenance.generatedAt,
    date: provenance.date,
  };
}

/**
 * Parse an ID chain back to individual IDs.
 * Inverse of buildEmbeddingMetadata's idChain.
 */
export function parseIdChain(idChain: string): {
  groveId?: string;
  lensId?: string;
  cognitiveDomainId?: string;
  experiencePathId?: string;
  templateId?: string;
  writerConfigId?: string;
} {
  const parts = idChain.split(':');
  return {
    groveId: parts[0] !== '_' ? parts[0] : undefined,
    lensId: parts[1] !== '_' ? parts[1] : undefined,
    cognitiveDomainId: parts[2] !== '_' ? parts[2] : undefined,
    experiencePathId: parts[3] !== '_' ? parts[3] : undefined,
    templateId: parts[4] !== '_' ? parts[4] : undefined,
    writerConfigId: parts[5] !== '_' ? parts[5] : undefined,
  };
}

/**
 * Generate YAML frontmatter string from provenance.
 * Includes full ID chain for reverse-engineering knowledge routes.
 */
export function generateFrontmatter(provenance: DocumentProvenance): string {
  const lines: string[] = ['---'];

  // === Identity (Primary Keys) ===
  lines.push(`title: "${provenance.routing.prompt.replace(/"/g, '\\"')}"`);
  lines.push(`id: "${provenance.id}"`);
  if (provenance.sproutId) {
    lines.push(`sprout_id: "${provenance.sproutId}"`);
  }
  if (provenance.groveId) {
    lines.push(`grove_id: "${provenance.groveId}"`);
  }
  if (provenance.evidenceBundleId) {
    lines.push(`evidence_bundle_id: "${provenance.evidenceBundleId}"`);
  }
  lines.push('');

  // === Authorship ===
  lines.push(`author: "${provenance.author}"`);
  lines.push(`copyright: "${provenance.copyright}"`);
  lines.push('');

  // === Timestamps ===
  lines.push(`date: "${provenance.date}"`);
  lines.push(`generated_at: "${provenance.generatedAt}"`);
  if (provenance.capturedAt) {
    lines.push(`captured_at: "${provenance.capturedAt}"`);
  }
  if (provenance.researchCompletedAt) {
    lines.push(`research_completed_at: "${provenance.researchCompletedAt}"`);
  }
  lines.push('');

  // === Document Classification ===
  lines.push(`type: "${provenance.type}"`);
  lines.push(`type_code: "${provenance.typeCode}"`);
  lines.push(`status: "${provenance.status}"`);
  lines.push('');

  // === 4D Experience Provenance (with IDs) ===
  if (provenance.cognitiveDomain) {
    lines.push(`cognitive_domain: "${provenance.cognitiveDomain}"`);
  }
  if (provenance.cognitiveDomainId) {
    lines.push(`cognitive_domain_id: "${provenance.cognitiveDomainId}"`);
  }
  if (provenance.experiencePath) {
    lines.push(`experience_path: "${provenance.experiencePath}"`);
  }
  if (provenance.experiencePathId) {
    lines.push(`experience_path_id: "${provenance.experiencePathId}"`);
  }
  if (provenance.experienceMomentId) {
    lines.push(`experience_moment_id: "${provenance.experienceMomentId}"`);
  }
  lines.push('');

  // === Lens (with ID) ===
  if (provenance.lens) {
    lines.push(`lens: "${provenance.lens}"`);
  }
  if (provenance.lensId) {
    lines.push(`lens_id: "${provenance.lensId}"`);
  }
  lines.push('');

  // === Cognitive Routing ===
  lines.push('routing:');
  if (provenance.routing.path) {
    lines.push(`  path: "${provenance.routing.path}"`);
  }
  lines.push(`  prompt: "${provenance.routing.prompt.replace(/"/g, '\\"')}"`);
  if (provenance.routing.inspiration) {
    lines.push(`  inspiration: "${provenance.routing.inspiration.replace(/"/g, '\\"')}"`);
  }
  if (provenance.routing.domain) {
    lines.push(`  domain: "${provenance.routing.domain}"`);
  }
  lines.push('');

  // === Writer Pipeline (with config IDs) ===
  if (provenance.template) {
    lines.push(`template: "${provenance.template}"`);
  }
  if (provenance.templateId) {
    lines.push(`template_id: "${provenance.templateId}"`);
  }
  if (provenance.templateVersion !== undefined) {
    lines.push(`template_version: ${provenance.templateVersion}`);
  }
  if (provenance.templateSource) {
    lines.push(`template_source: "${provenance.templateSource}"`);
  }
  if (provenance.writerConfigId) {
    lines.push(`writer_config_id: "${provenance.writerConfigId}"`);
  }
  if (provenance.writerConfigVersion !== undefined) {
    lines.push(`writer_config_version: ${provenance.writerConfigVersion}`);
  }
  if (provenance.renderingSource) {
    lines.push(`rendering_source: "${provenance.renderingSource}"`);
  }
  lines.push('');

  // === Research Pipeline (if applicable) ===
  if (provenance.researchConfigId || provenance.researchConfigVersion !== undefined) {
    if (provenance.researchConfigId) {
      lines.push(`research_config_id: "${provenance.researchConfigId}"`);
    }
    if (provenance.researchConfigVersion !== undefined) {
      lines.push(`research_config_version: ${provenance.researchConfigVersion}`);
    }
    lines.push('');
  }

  // === Evidence Quality ===
  lines.push(`confidence_score: ${provenance.confidenceScore}`);
  lines.push(`source_count: ${provenance.sourceCount}`);
  lines.push(`word_count: ${provenance.wordCount}`);
  lines.push('');

  // === Source References ===
  if (provenance.sourceUrls && provenance.sourceUrls.length > 0) {
    lines.push('source_urls:');
    for (const url of provenance.sourceUrls.slice(0, 10)) { // Limit to 10 for readability
      lines.push(`  - "${url}"`);
    }
    if (provenance.sourceUrls.length > 10) {
      lines.push(`  # ... and ${provenance.sourceUrls.length - 10} more`);
    }
    lines.push('');
  }

  // === Tags ===
  if (provenance.tags.length > 0) {
    lines.push('tags:');
    for (const tag of provenance.tags) {
      lines.push(`  - "${tag}"`);
    }
  }

  // === ID Chain (for embedding metadata) ===
  const embeddingMeta = buildEmbeddingMetadata(provenance);
  lines.push('');
  lines.push(`# Routing ID Chain (grove:lens:domain:path:template:config)`);
  lines.push(`id_chain: "${embeddingMeta.idChain}"`);

  lines.push('---');

  return lines.join('\n');
}

/**
 * Generate Notion page title with consistent formatting.
 */
export function generateNotionTitle(
  doc: ResearchDocument,
  provenance: ProvenanceInput
): string {
  const template = provenance.templateName || 'Research';
  const date = new Date(doc.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Format: [Template] Query (Date)
  // Truncate query if too long
  const maxQueryLength = 60;
  const query = doc.query.length > maxQueryLength
    ? doc.query.slice(0, maxQueryLength - 3) + '...'
    : doc.query;

  return `[${template}] ${query} (${date})`;
}
