import { useState, useEffect } from 'react';
import { NarrativeGraph, NarrativeNode, SectionId } from '../types';

export const useNarrative = () => {
  const [graph, setGraph] = useState<NarrativeGraph | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/narrative')
      .then(res => res.json())
      .then(data => {
        // Handle empty/init state safely
        if (!data.nodes) data.nodes = {};
        setGraph(data);
      })
      .catch(err => console.error("Narrative load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  // Helper: Get entry points for a specific section
  const getSectionNodes = (sectionId: SectionId | string): NarrativeNode[] => {
    if (!graph) return [];
    return (Object.values(graph.nodes) as NarrativeNode[]).filter(n => n.sectionId === sectionId);
  };

  // Helper: Get next nodes for a given ID
  // Handles both V1 (next[]) and V2.1 (primaryNext + alternateNext[])
  const getNextNodes = (nodeId: string): NarrativeNode[] => {
    if (!graph || !graph.nodes[nodeId]) return [];
    const node = graph.nodes[nodeId] as NarrativeNode & { primaryNext?: string; alternateNext?: string[] };

    // V2.1 structure: primaryNext + alternateNext
    if (node.primaryNext !== undefined || node.alternateNext !== undefined) {
      const nextIds: string[] = [];
      if (node.primaryNext) nextIds.push(node.primaryNext);
      if (node.alternateNext) nextIds.push(...node.alternateNext);
      return nextIds
        .map(id => graph.nodes[id])
        .filter(Boolean) as NarrativeNode[];
    }

    // V1 structure: next[]
    if (!node.next) return [];
    return node.next
      .map(id => graph.nodes[id])
      .filter(Boolean);
  };

  // Helper: Get a specific node by ID
  const getNode = (nodeId: string): NarrativeNode | null => {
    if (!graph || !graph.nodes[nodeId]) return null;
    return graph.nodes[nodeId];
  };

  return { graph, loading, getSectionNodes, getNextNodes, getNode };
};
