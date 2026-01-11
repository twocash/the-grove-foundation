// src/bedrock/consoles/GardenConsole/GardenConsole.factory.ts
// Factory-generated Garden Console (base component)
// Sprint: bedrock-ia-rename-v1 (formerly PipelineMonitor)

import { createBedrockConsole } from '../../patterns/console-factory';
import { gardenConsoleConfig } from './GardenConsole.config';
import { useDocumentData } from './useDocumentData';
import { DocumentCard } from './DocumentCard';
import { DocumentEditor } from './DocumentEditor';
import type { DocumentPayload } from './types';

/**
 * Base Garden Console (factory-generated)
 *
 * This is the core console without action buttons.
 * Use GardenConsoleWithUpload for the complete experience with
 * Add Files and Process Queue buttons.
 */
export const GardenConsoleBase = createBedrockConsole<DocumentPayload>({
  config: gardenConsoleConfig,
  useData: useDocumentData,
  CardComponent: DocumentCard,
  EditorComponent: DocumentEditor,
  copilotTitle: 'Document Copilot',
  copilotPlaceholder: 'Try: "extract keywords", "summarize", "enrich"',
});

export default GardenConsoleBase;
