// src/shared/inspector/ObjectInspector.tsx
// JSON inspector for GroveObjects with Copilot integration
// Supports two modes:
// 1. Surface mode: Uses InspectorSurface from context (wrap with InspectorSurfaceProvider)
// 2. Props mode: Legacy mode using props (backward compatible)

import { useState, useEffect, useContext } from 'react';
import { applyPatch } from 'fast-json-patch';
import type { GroveObject } from '@core/schema/grove-object';
import type { JsonPatch } from '@core/copilot';
import type { ObjectVersion, VersionActor } from '@core/versioning';
import { InspectorPanel, InspectorDivider } from '../layout/InspectorPanel';
import { CopilotPanel } from './CopilotPanel';
import { VersionIndicator } from './VersionIndicator';
import { useInspectorSurface, type InspectorSurface } from './surface';

/**
 * Version metadata for display
 */
interface VersionMetadata {
  ordinal: number;
  lastModifiedAt: string;
  lastModifiedBy: VersionActor;
}

/**
 * Props for ObjectInspector.
 *
 * Two usage modes:
 * 1. Surface mode: Only provide onClose. Data comes from InspectorSurfaceProvider context.
 * 2. Props mode (legacy): Provide object, version, onApplyPatch, onClose.
 */
interface ObjectInspectorProps {
  /** Object to display (legacy mode) - omit when using surface */
  object?: GroveObject;
  title?: string;
  /** Version metadata for display (legacy mode) */
  version?: VersionMetadata | null;
  /** Callback when patch is applied (legacy mode) */
  onApplyPatch?: (patch: JsonPatch) => Promise<ObjectVersion | void> | void;
  onClose: () => void;
}

/**
 * Try to get surface from context, return null if not available
 */
function useSurfaceOptional(): InspectorSurface | null {
  try {
    return useInspectorSurface();
  } catch {
    return null;
  }
}

export function ObjectInspector({
  object: propObject,
  title: propTitle,
  version: propVersion,
  onApplyPatch: propOnApplyPatch,
  onClose,
}: ObjectInspectorProps) {
  // Try to use surface if available (new mode)
  const surface = useSurfaceOptional();

  // Derive values from surface or props
  const object = surface?.dataModel ?? propObject;
  const version = surface?.version ?? propVersion;
  const title = propTitle ?? object?.meta.title;

  const [localObject, setLocalObject] = useState<GroveObject | undefined>(object);
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [payloadExpanded, setPayloadExpanded] = useState(true);

  // Sync local state when object changes
  useEffect(() => {
    if (object) {
      setLocalObject(object);
    }
  }, [object]);

  const handleApplyPatch = async (patch: JsonPatch): Promise<ObjectVersion | void> => {
    try {
      // If surface available, use it
      if (surface) {
        const result = await surface.applyPatch(
          patch,
          { type: 'copilot', model: 'hybrid-local' },
          { type: 'copilot', sessionId: 'session' }
        );
        return result;
      }

      // If external handler provided (legacy versioning), use it
      if (propOnApplyPatch) {
        const result = await propOnApplyPatch(patch);
        return result;
      }

      // Fallback: Apply locally (no persistence)
      if (localObject) {
        const cloned = JSON.parse(JSON.stringify(localObject));
        const result = applyPatch(cloned, patch);
        setLocalObject(result.newDocument);
      }
    } catch (error) {
      console.error('Failed to apply patch:', error);
    }
  };

  const copyToClipboard = () => {
    if (localObject) {
      navigator.clipboard.writeText(JSON.stringify(localObject, null, 2));
    }
  };

  const displayTitle = title || localObject?.meta.title || 'Object';

  // Loading state for surface mode
  if (surface?.loading) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2 animate-spin">progress_activity</span>
        <p>Loading...</p>
      </div>
    );
  }

  // Error state for surface mode
  if (surface?.error) {
    return (
      <div className="p-5 text-center text-red-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>{surface.error.message}</p>
      </div>
    );
  }

  // No object available
  if (!localObject) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">data_object</span>
        <p>No object to display</p>
      </div>
    );
  }

  return (
    <InspectorPanel
      title="Object Inspector"
      subtitle={
        <div className="flex flex-col gap-1">
          <span>{displayTitle}</span>
          {version && (
            <VersionIndicator
              ordinal={version.ordinal}
              lastModifiedAt={version.lastModifiedAt}
              lastModifiedBy={version.lastModifiedBy}
              compact
            />
          )}
        </div>
      }
      icon="data_object"
      iconColor="text-cyan-500"
      iconBg="bg-cyan-950"
      onClose={onClose}
      actions={
        <button
          onClick={copyToClipboard}
          className="w-full py-2 px-3 rounded-lg bg-[var(--glass-elevated)] hover:bg-[var(--glass-border-hover)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-secondary)] flex items-center justify-center gap-2 transition-all hover:border-[var(--neon-cyan)]"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          Copy Full JSON
        </button>
      }
      bottomPanel={
        <CopilotPanel object={localObject} onApplyPatch={handleApplyPatch} />
      }
    >
      {/* Meta Section */}
      <CollapsibleSection
        title="META"
        expanded={metaExpanded}
        onToggle={() => setMetaExpanded(!metaExpanded)}
      >
        <JsonBlock data={localObject.meta} />
      </CollapsibleSection>

      <InspectorDivider />

      {/* Payload Section */}
      <CollapsibleSection
        title="PAYLOAD"
        expanded={payloadExpanded}
        onToggle={() => setPayloadExpanded(!payloadExpanded)}
      >
        <JsonBlock data={localObject.payload} />
      </CollapsibleSection>
    </InspectorPanel>
  );
}

// Collapsible section with chevron
interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, expanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="px-4 py-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span
          className={`material-symbols-outlined text-sm text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
        >
          chevron_right
        </span>
        <span className="glass-section-header group-hover:text-[var(--glass-text-muted)]">
          {title}
        </span>
      </button>
      {expanded && (
        <div className="mt-3 pl-5 font-mono text-xs leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// Recursive JSON renderer with syntax highlighting
interface JsonBlockProps {
  data: unknown;
  depth?: number;
}

function JsonBlock({ data, depth = 0 }: JsonBlockProps) {
  if (data === null) {
    return <span className="json-null">null</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="json-boolean">{String(data)}</span>;
  }

  if (typeof data === 'number') {
    return <span className="json-number">{data}</span>;
  }

  if (typeof data === 'string') {
    const display = data.length > 80 ? data.substring(0, 80) + '...' : data;
    return <span className="json-string">"{display}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-500">[]</span>;
    return (
      <div className="space-y-1">
        <span className="text-slate-500">[</span>
        <div className="pl-4 border-l border-slate-700/50">
          {data.map((item, i) => (
            <div key={i}>
              <JsonBlock data={item} depth={depth + 1} />
              {i < data.length - 1 && <span className="text-slate-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-slate-500">{'{}'}</span>;
    return (
      <div className="space-y-1">
        {entries.map(([key, value], i) => (
          <div key={key} className="flex flex-wrap">
            <span className="json-key">{key}</span>
            <span className="text-slate-500 mr-2">:</span>
            <JsonBlock data={value} depth={depth + 1} />
            {i < entries.length - 1 && <span className="text-slate-500">,</span>}
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-slate-500">{String(data)}</span>;
}

export default ObjectInspector;
