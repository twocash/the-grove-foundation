// src/explore/NodeGrid.tsx
// Browse all knowledge nodes/cards from the narrative schema

import { useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { Card, JourneyNode } from '../../data/narratives-schema';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { GitBranch, ArrowRight, Tag } from 'lucide-react';

interface NodeCardProps {
  node: Card | JourneyNode;
  onSelect: (id: string) => void;
}

function NodeCard({ node, onSelect }: NodeCardProps) {
  // Determine connections count
  const connectionsCount = 'next' in node && node.next ? node.next.length :
                          ('primaryNext' in node ? (node.primaryNext ? 1 : 0) + (node.alternateNext?.length || 0) : 0);

  return (
    <button
      onClick={() => onSelect(node.id)}
      className="glass-card p-4 text-left group"
    >
      {/* Label */}
      <h3 className="font-medium text-[var(--glass-text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--neon-cyan)] transition-colors">
        {node.label}
      </h3>

      {/* Query preview */}
      <p className="text-sm text-[var(--glass-text-muted)] line-clamp-2 mb-3">
        {node.query}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--glass-text-subtle)]">
        {/* Section tag */}
        {'sectionId' in node && node.sectionId && (
          <div className="flex items-center gap-1">
            <Tag size={12} />
            <span>{node.sectionId}</span>
          </div>
        )}

        {/* Connections */}
        {connectionsCount > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <ArrowRight size={12} />
            <span>{connectionsCount} next</span>
          </div>
        )}
      </div>
    </button>
  );
}

export function NodeGrid() {
  const { schema, loading } = useNarrativeEngine();
  const { openInspector } = useWorkspaceUI();

  // Combine cards and nodes, prefer nodes (V2.1) over cards (V2.0)
  const allNodes = useMemo(() => {
    const nodes: (Card | JourneyNode)[] = [];

    // Add V2.1 journey nodes
    if (schema?.nodes) {
      nodes.push(...Object.values(schema.nodes));
    }

    // Add V2.0 cards if no nodes
    if (nodes.length === 0 && schema?.cards) {
      nodes.push(...Object.values(schema.cards));
    }

    return nodes;
  }, [schema]);

  // Group by section
  const groupedNodes = useMemo(() => {
    const groups: Record<string, (Card | JourneyNode)[]> = {};

    allNodes.forEach(node => {
      const section = ('sectionId' in node && node.sectionId) ? String(node.sectionId) : 'other';
      if (!groups[section]) groups[section] = [];
      groups[section].push(node);
    });

    return groups;
  }, [allNodes]);

  const handleSelect = (nodeId: string) => {
    openInspector({ type: 'node', nodeId });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-[var(--grove-accent)] animate-pulse">Loading nodes...</div>
      </div>
    );
  }

  if (allNodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-[var(--grove-surface)] flex items-center justify-center mb-4">
          <GitBranch size={32} className="text-[var(--grove-accent)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--grove-text)] mb-2">
          No Nodes Available
        </h2>
        <p className="text-[var(--grove-text-muted)] max-w-md">
          Knowledge nodes will appear here once the narrative schema is loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--glass-text-primary)] mb-1">
            Knowledge Nodes
          </h1>
          <p className="text-[var(--glass-text-muted)]">
            {allNodes.length} node{allNodes.length !== 1 ? 's' : ''} in the narrative graph
          </p>
        </div>

        {/* Grouped sections */}
        {Object.entries(groupedNodes).map(([section, nodes]) => (
          <div key={section} className="mb-8">
            <h2 className="glass-section-header mb-3">
              {section === 'other' ? 'General' : section}
              <span className="ml-2">({nodes.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nodes.map(node => (
                <NodeCard key={node.id} node={node} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
