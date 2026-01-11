// src/bedrock/consoles/GardenConsole/index.ts
// Garden Console exports (formerly Pipeline Monitor)
// Sprint: bedrock-ia-rename-v1

// Base factory component (for direct use or composition)
export { GardenConsoleBase, GardenConsoleBase as GardenConsole } from './GardenConsole.factory';

// Complete component with Add Files + Process Queue buttons
export { GardenConsoleWithUpload } from './GardenConsoleWithUpload';

// Re-export configuration
export { gardenConsoleConfig } from './GardenConsole.config';

// Re-export components for custom use cases
export { DocumentCard } from './DocumentCard';
export { DocumentEditor } from './DocumentEditor';
export { useDocumentData } from './useDocumentData';

// Re-export supporting components
export { UploadModal } from './UploadModal';
export { ProcessingQueue } from './ProcessingQueue';
export { HubSuggestions } from './HubSuggestions';
export { JourneySynthesis } from './JourneySynthesis';

// Re-export types
export type { Document, DocumentPayload, DocumentTier } from './types';
export * from './pipeline.config';

// DEFAULT EXPORT: Complete component with Add Files + Process Queue buttons
// This is what routes.tsx imports via lazy(() => import(...))
export { GardenConsoleWithUpload as default } from './GardenConsoleWithUpload';
