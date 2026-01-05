// src/bedrock/consoles/PipelineMonitor/index.ts
// Pipeline Monitor console exports
// Sprint: hotfix-pipeline-factory-v2

// Base factory component (for direct use or composition)
export { PipelineMonitorBase, PipelineMonitorBase as PipelineMonitor } from './PipelineMonitor.factory';

// Complete component with Add Files + Process Queue buttons
export { PipelineMonitorWithUpload } from './PipelineMonitorWithUpload';

// Re-export configuration
export { pipelineMonitorConfig } from './PipelineMonitor.config';

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
export { PipelineMonitorWithUpload as default } from './PipelineMonitorWithUpload';
