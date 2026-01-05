// src/bedrock/consoles/PipelineMonitor/PipelineMonitor.factory.ts
// Factory-generated Pipeline Monitor console (base component)
// Sprint: hotfix-pipeline-factory-v2

import { createBedrockConsole } from '../../patterns/console-factory';
import { pipelineMonitorConfig } from './PipelineMonitor.config';
import { useDocumentData } from './useDocumentData';
import { DocumentCard } from './DocumentCard';
import { DocumentEditor } from './DocumentEditor';
import type { DocumentPayload } from './types';

/**
 * Base Pipeline Monitor Console (factory-generated)
 * 
 * This is the core console without action buttons.
 * Use PipelineMonitorWithUpload for the complete experience with
 * Add Files and Process Queue buttons.
 */
export const PipelineMonitorBase = createBedrockConsole<DocumentPayload>({
  config: pipelineMonitorConfig,
  useData: useDocumentData,
  CardComponent: DocumentCard,
  EditorComponent: DocumentEditor,
  copilotTitle: 'Document Copilot',
  copilotPlaceholder: 'Try: "extract keywords", "summarize", "enrich"',
});

export default PipelineMonitorBase;
