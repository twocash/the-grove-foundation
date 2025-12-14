import React from 'react';
import { NarrativeGraph, NarrativeNode } from '../types';
import NarrativeNodeCard from './NarrativeNodeCard';

interface NarrativeGraphViewProps {
  graph: NarrativeGraph;
  onUpdateGraph: (newGraph: NarrativeGraph) => void;
}

const NarrativeGraphView: React.FC<NarrativeGraphViewProps> = ({ graph, onUpdateGraph }) => {

  const nodes = Object.values(graph.nodes);
  const nodeIds = Object.keys(graph.nodes);

  const handleUpdateNode = (updatedNode: NarrativeNode) => {
    const newGraph = { ...graph };
    newGraph.nodes[updatedNode.id] = updatedNode;
    onUpdateGraph(newGraph);
  };

  const handleDeleteNode = (id: string) => {
    if (!confirm('Delete this narrative node?')) return;
    const newGraph = { ...graph };
    delete newGraph.nodes[id];

    // Cleanup: Remove incoming links to this deleted node
    Object.keys(newGraph.nodes).forEach(key => {
      newGraph.nodes[key].next = newGraph.nodes[key].next.filter(nextId => nextId !== id);
    });

    onUpdateGraph(newGraph);
  };

  const handleAddNode = () => {
    const id = prompt("Enter unique ID for new node (e.g., 'economics-deep-dive'):");
    if (!id || graph.nodes[id]) {
      if (graph.nodes[id]) alert('A node with this ID already exists.');
      return;
    }

    const newNode: NarrativeNode = {
      id,
      label: "New Prompt Point",
      query: "Write instructions for the AI here...",
      next: []
    };

    const newGraph = { ...graph };
    newGraph.nodes[id] = newNode;
    onUpdateGraph(newGraph);
  };

  // Group nodes by section for better organization
  const entryNodes = nodes.filter(n => n.sectionId);
  const standaloneNodes = nodes.filter(n => !n.sectionId);

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-6">
          <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
            Total Nodes: <span className="text-green-600 font-bold">{nodes.length}</span>
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
            Entry Points: <span className="text-blue-600 font-bold">{entryNodes.length}</span>
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
            Dead Ends: <span className="text-yellow-600 font-bold">{nodes.filter(n => n.next.length === 0).length}</span>
          </span>
        </div>
        <button
          onClick={handleAddNode}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-green-500 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Node</span>
        </button>
      </div>

      {/* Entry Point Nodes (Grouped by Section) */}
      {entryNodes.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Entry Points (Section Starters)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {entryNodes.map(node => (
              <NarrativeNodeCard
                key={node.id}
                node={node}
                allNodeIds={nodeIds}
                onChange={handleUpdateNode}
                onDelete={handleDeleteNode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Standalone Nodes */}
      {standaloneNodes.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="1.05" y1="12" x2="7" y2="12"></line>
              <line x1="17.01" y1="12" x2="22.96" y2="12"></line>
            </svg>
            Follow-up Nodes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {standaloneNodes.map(node => (
              <NarrativeNodeCard
                key={node.id}
                node={node}
                allNodeIds={nodeIds}
                onChange={handleUpdateNode}
                onDelete={handleDeleteNode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="text-center py-20 text-gray-500 font-serif italic">
          No narrative nodes yet. Upload a PDF or add nodes manually.
        </div>
      )}
    </div>
  );
};

export default NarrativeGraphView;
