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
 */
export interface DocumentProvenance {
  // === Identity ===
  id: string;
  sproutId?: string;

  // === Authorship ===
  author: string;
  copyright: string;

  // === Timestamps ===
  date: string;
  generatedAt: string;
  capturedAt?: string;

  // === Document Classification ===
  type: string;
  typeCode: string;
  status: 'complete' | 'partial' | 'insufficient-evidence';

  // === 4D Experience Provenance ===
  cognitiveDomain?: string;
  cognitiveDomainId?: string;
  experiencePath?: string;
  experiencePathId?: string;
  experienceMomentId?: string;

  // === Lens ===
  lens?: string;
  lensId?: string;

  // === Cognitive Routing (4-field model) ===
  routing: {
    path?: string;
    prompt: string;
    inspiration?: string;
    domain?: string;
  };

  // === Writer Pipeline ===
  template?: string;
  templateId?: string;
  templateVersion?: number;
  templateSource?: 'system-seed' | 'user-created' | 'forked' | 'imported';
  writerConfigVersion?: number;
  renderingSource?: 'template' | 'default-writer' | 'default-research';

  // === Evidence Quality ===
  confidenceScore: number;
  sourceCount: number;
  wordCount: number;

  // === Tags ===
  tags: string[];
}

/**
 * Minimal provenance info passed from UI components
 */
export interface ProvenanceInput {
  lensName?: string;
  lensId?: string;
  cognitiveDomain?: string;
  cognitiveDomainId?: string;
  experiencePath?: string;
  experiencePathId?: string;
  templateName?: string;
  templateId?: string;
  templateVersion?: number;
  templateSource?: 'system-seed' | 'user-created' | 'forked' | 'imported';
  writerConfigVersion?: number;
  renderingSource?: 'template' | 'default-writer' | 'default-research';
  generatedAt?: string;
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

  return {
    // === Identity ===
    id: doc.id,
    sproutId: sprout?.id,

    // === Authorship ===
    author: DEFAULT_AUTHOR,
    copyright: COPYRIGHT_TEMPLATE.replace('{year}', String(year)),

    // === Timestamps ===
    date: doc.createdAt.split('T')[0],
    generatedAt: input.generatedAt || doc.createdAt,
    capturedAt: sprout?.capturedAt,

    // === Document Classification ===
    type: TYPE_NAMES[getTypeCode(input.templateName || 'research')] || 'research',
    typeCode: getTypeCode(input.templateName || 'research'),
    status: doc.status,

    // === 4D Experience Provenance ===
    cognitiveDomain: input.cognitiveDomain || sprout?.provenance?.hub?.name,
    cognitiveDomainId: input.cognitiveDomainId || sprout?.provenance?.hub?.id,
    experiencePath: input.experiencePath || sprout?.provenance?.journey?.name,
    experiencePathId: input.experiencePathId || sprout?.provenance?.journey?.id,
    experienceMomentId: undefined, // Not typically available at document level

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
    writerConfigVersion: input.writerConfigVersion,
    renderingSource: input.renderingSource,

    // === Evidence Quality ===
    confidenceScore: doc.confidenceScore,
    sourceCount: doc.citations.length,
    wordCount: doc.wordCount,

    // === Tags ===
    tags: inferTags(input, doc.query),
  };
}

/**
 * Generate YAML frontmatter string from provenance.
 */
export function generateFrontmatter(provenance: DocumentProvenance): string {
  const lines: string[] = ['---'];

  // === Identity ===
  lines.push(`title: "${provenance.routing.prompt.replace(/"/g, '\\"')}"`);
  lines.push(`id: "${provenance.id}"`);
  if (provenance.sproutId) {
    lines.push(`sprout_id: "${provenance.sproutId}"`);
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
  lines.push('');

  // === Document Classification ===
  lines.push(`type: "${provenance.type}"`);
  lines.push(`type_code: "${provenance.typeCode}"`);
  lines.push(`status: "${provenance.status}"`);
  lines.push('');

  // === 4D Experience Provenance ===
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
  lines.push('');

  // === Lens ===
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

  // === Writer Pipeline ===
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
  if (provenance.writerConfigVersion !== undefined) {
    lines.push(`writer_config_version: ${provenance.writerConfigVersion}`);
  }
  if (provenance.renderingSource) {
    lines.push(`rendering_source: "${provenance.renderingSource}"`);
  }
  lines.push('');

  // === Evidence Quality ===
  lines.push(`confidence_score: ${provenance.confidenceScore}`);
  lines.push(`source_count: ${provenance.sourceCount}`);
  lines.push(`word_count: ${provenance.wordCount}`);
  lines.push('');

  // === Tags ===
  if (provenance.tags.length > 0) {
    lines.push('tags:');
    for (const tag of provenance.tags) {
      lines.push(`  - "${tag}"`);
    }
  }

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
