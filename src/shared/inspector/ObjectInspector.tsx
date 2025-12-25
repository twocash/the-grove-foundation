// src/shared/inspector/ObjectInspector.tsx
// JSON inspector for GroveObjects

import { useState } from 'react';
import { GroveObject } from '@core/schema/grove-object';
import { InspectorPanel, InspectorDivider } from '../layout/InspectorPanel';

interface ObjectInspectorProps {
  object: GroveObject;
  title?: string;
  onClose: () => void;
}

export function ObjectInspector({ object, title, onClose }: ObjectInspectorProps) {
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [payloadExpanded, setPayloadExpanded] = useState(true);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(object, null, 2));
  };

  const displayTitle = title || object.meta.title || 'Object';

  return (
    <InspectorPanel
      title="Object Inspector"
      subtitle={displayTitle}
      icon="data_object"
      iconColor="text-cyan-500"
      iconBg="bg-cyan-950"
      onClose={onClose}
      actions={
        <button
          onClick={copyToClipboard}
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          Copy Full JSON
        </button>
      }
    >
      {/* Meta Section */}
      <CollapsibleSection
        title="META"
        expanded={metaExpanded}
        onToggle={() => setMetaExpanded(!metaExpanded)}
      >
        <JsonBlock data={object.meta} />
      </CollapsibleSection>

      <InspectorDivider />

      {/* Payload Section */}
      <CollapsibleSection
        title="PAYLOAD"
        expanded={payloadExpanded}
        onToggle={() => setPayloadExpanded(!payloadExpanded)}
      >
        <JsonBlock data={object.payload} />
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
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400">
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
