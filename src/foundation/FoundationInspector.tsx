// src/foundation/FoundationInspector.tsx
// Foundation inspector panel - routes to correct inspector based on mode

import { InspectorPanel, InspectorSection, InspectorDivider } from '../shared/layout';
import { EmptyState } from '../shared/feedback';
import type { FoundationInspectorMode } from '@core/schema/foundation';
import { useFoundationUI } from './FoundationUIContext';
import { SproutReviewInspector } from './inspectors/SproutReviewInspector';
import { JourneyInspector } from './inspectors/JourneyInspector';
import { NodeInspector } from './inspectors/NodeInspector';

interface FoundationInspectorProps {
  mode: FoundationInspectorMode;
}

export function FoundationInspector({ mode }: FoundationInspectorProps) {
  const { closeInspector } = useFoundationUI();

  // Route to correct inspector based on mode
  switch (mode.type) {
    case 'sprout-review':
      return <SproutReviewInspector sproutId={mode.sproutId} />;

    case 'journey':
      return <JourneyInspector journeyId={mode.journeyId} />;

    case 'node':
      return <NodeInspector nodeId={mode.nodeId} />;

    case 'persona':
      return <PersonaInspectorPlaceholder personaId={mode.personaId} onClose={closeInspector} />;

    case 'card':
      return <CardInspectorPlaceholder cardId={mode.cardId} onClose={closeInspector} />;

    case 'rag-document':
      return <RagDocumentPlaceholder documentId={mode.documentId} onClose={closeInspector} />;

    case 'audio-track':
      return <AudioTrackPlaceholder trackId={mode.trackId} onClose={closeInspector} />;

    case 'settings':
      return <SettingsPlaceholder section={mode.section} onClose={closeInspector} />;

    default:
      return (
        <EmptyState
          icon="info"
          title="No Selection"
          description="Select an item to view details"
        />
      );
  }
}

// Placeholder components - will be implemented in later phases

function PersonaInspectorPlaceholder({ personaId, onClose }: { personaId: string; onClose: () => void }) {
  return (
    <InspectorPanel
      title="Persona Details"
      icon="person"
      iconColor="text-purple-600"
      onClose={onClose}
    >
      <InspectorSection title="Persona">
        <div className="text-xs text-slate-500">Persona ID: {personaId}</div>
      </InspectorSection>
    </InspectorPanel>
  );
}

function CardInspectorPlaceholder({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  return (
    <InspectorPanel
      title="Card Details"
      icon="article"
      iconColor="text-emerald-600"
      onClose={onClose}
    >
      <InspectorSection title="Card">
        <div className="text-xs text-slate-500">Card ID: {cardId}</div>
      </InspectorSection>
    </InspectorPanel>
  );
}

function RagDocumentPlaceholder({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  return (
    <InspectorPanel
      title="Document Details"
      icon="description"
      iconColor="text-cyan-600"
      onClose={onClose}
    >
      <InspectorSection title="Document">
        <div className="text-xs text-slate-500">Document ID: {documentId}</div>
      </InspectorSection>
    </InspectorPanel>
  );
}

function AudioTrackPlaceholder({ trackId, onClose }: { trackId: string; onClose: () => void }) {
  return (
    <InspectorPanel
      title="Audio Track"
      icon="music_note"
      iconColor="text-pink-600"
      onClose={onClose}
    >
      <InspectorSection title="Track">
        <div className="text-xs text-slate-500">Track ID: {trackId}</div>
      </InspectorSection>
    </InspectorPanel>
  );
}

function SettingsPlaceholder({ section, onClose }: { section: string; onClose: () => void }) {
  return (
    <InspectorPanel
      title="Settings"
      icon="settings"
      iconColor="text-slate-600"
      onClose={onClose}
    >
      <InspectorSection title={section}>
        <p className="text-xs text-slate-500">Settings for {section}</p>
      </InspectorSection>
    </InspectorPanel>
  );
}
