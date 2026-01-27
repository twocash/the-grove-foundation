// src/bedrock/json-render/document/index.ts
// Sprint: S25-SFR garden-content-viewer-v1
// Barrel exports for DocumentCatalog json-render components

// Catalog (Zod schemas + factory definition)
export {
  DocumentCatalog,
  DocumentViewSchema,
  DocumentSectionSchema,
  DocumentSourceSchema,
  DocumentMetaSchema,
} from './document-catalog';

export type {
  DocumentCatalogType,
  DocumentViewProps,
  DocumentSectionProps,
  DocumentSourceProps,
  DocumentMetaProps,
} from './document-catalog';

// Registry (React component implementations)
export { DocumentRegistry } from './document-registry';
export type { ComponentRegistry } from './document-registry';

// Transform (markdown content → RenderTree)
export { contentToDocumentTree } from './document-transform';
export type { DocumentTreeMeta } from './document-transform';
