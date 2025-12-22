// src/foundation/FoundationInspector.tsx
// Foundation inspector panel - switches content based on mode

import { InspectorPanel, InspectorSection, InspectorDivider } from '../shared/layout';
import { EmptyState } from '../shared/feedback';
import type { FoundationInspectorMode } from '@core/schema/foundation';
import { useFoundationUI } from './FoundationUIContext';

interface FoundationInspectorProps {
  mode: FoundationInspectorMode;
}

export function FoundationInspector({ mode }: FoundationInspectorProps) {
  const { closeInspector } = useFoundationUI();

  // Render different inspector content based on mode
  const renderContent = () => {
    switch (mode.type) {
      case 'journey':
        return <JourneyInspectorContent journeyId={mode.journeyId} />;
      case 'node':
        return <NodeInspectorContent nodeId={mode.nodeId} />;
      case 'persona':
        return <PersonaInspectorContent personaId={mode.personaId} />;
      case 'card':
        return <CardInspectorContent cardId={mode.cardId} />;
      case 'sprout-review':
        return <SproutReviewContent sproutId={mode.sproutId} />;
      case 'rag-document':
        return <RagDocumentContent documentId={mode.documentId} />;
      case 'audio-track':
        return <AudioTrackContent trackId={mode.trackId} />;
      case 'settings':
        return <SettingsContent section={mode.section} />;
      default:
        return (
          <EmptyState
            icon="info"
            title="No Selection"
            description="Select an item to view details"
          />
        );
    }
  };

  // Get icon and title based on mode
  const getHeaderInfo = () => {
    switch (mode.type) {
      case 'journey':
        return { icon: 'route', title: 'Journey Details', color: 'text-amber-600' };
      case 'node':
        return { icon: 'hub', title: 'Node Details', color: 'text-blue-600' };
      case 'persona':
        return { icon: 'person', title: 'Persona Details', color: 'text-purple-600' };
      case 'card':
        return { icon: 'article', title: 'Card Details', color: 'text-emerald-600' };
      case 'sprout-review':
        return { icon: 'eco', title: 'Sprout Review', color: 'text-primary' };
      case 'rag-document':
        return { icon: 'description', title: 'Document Details', color: 'text-cyan-600' };
      case 'audio-track':
        return { icon: 'music_note', title: 'Audio Track', color: 'text-pink-600' };
      case 'settings':
        return { icon: 'settings', title: 'Settings', color: 'text-slate-600' };
      default:
        return { icon: 'info', title: 'Inspector', color: 'text-slate-600' };
    }
  };

  const { icon, title, color } = getHeaderInfo();

  return (
    <InspectorPanel
      title={title}
      icon={icon}
      iconColor={color}
      onClose={closeInspector}
    >
      {renderContent()}
    </InspectorPanel>
  );
}

// Placeholder content components - these will be expanded in Phase 4
function JourneyInspectorContent({ journeyId }: { journeyId: string }) {
  return (
    <>
      <InspectorSection title="Details">
        <div className="space-y-3">
          <div className="text-xs text-slate-500">Journey ID: {journeyId}</div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Journey details will be editable here.
          </p>
        </div>
      </InspectorSection>
      <InspectorDivider />
      <InspectorSection title="Nodes">
        <p className="text-xs text-slate-500">Node list coming soon</p>
      </InspectorSection>
    </>
  );
}

function NodeInspectorContent({ nodeId }: { nodeId: string }) {
  return (
    <InspectorSection title="Node">
      <div className="text-xs text-slate-500">Node ID: {nodeId}</div>
    </InspectorSection>
  );
}

function PersonaInspectorContent({ personaId }: { personaId: string }) {
  return (
    <InspectorSection title="Persona">
      <div className="text-xs text-slate-500">Persona ID: {personaId}</div>
    </InspectorSection>
  );
}

function CardInspectorContent({ cardId }: { cardId: string }) {
  return (
    <InspectorSection title="Card">
      <div className="text-xs text-slate-500">Card ID: {cardId}</div>
    </InspectorSection>
  );
}

function SproutReviewContent({ sproutId }: { sproutId: string }) {
  return (
    <>
      <InspectorSection title="Content">
        <div className="text-xs text-slate-500">Sprout ID: {sproutId}</div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          Sprout content and review tools will appear here.
        </p>
      </InspectorSection>
      <InspectorDivider />
      <InspectorSection title="Moderation">
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
            Approve
          </button>
          <button className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
            Reject
          </button>
        </div>
      </InspectorSection>
    </>
  );
}

function RagDocumentContent({ documentId }: { documentId: string }) {
  return (
    <InspectorSection title="Document">
      <div className="text-xs text-slate-500">Document ID: {documentId}</div>
    </InspectorSection>
  );
}

function AudioTrackContent({ trackId }: { trackId: string }) {
  return (
    <InspectorSection title="Track">
      <div className="text-xs text-slate-500">Track ID: {trackId}</div>
    </InspectorSection>
  );
}

function SettingsContent({ section }: { section: string }) {
  return (
    <InspectorSection title={section}>
      <p className="text-xs text-slate-500">Settings for {section}</p>
    </InspectorSection>
  );
}
