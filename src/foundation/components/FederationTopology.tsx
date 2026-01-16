// src/foundation/components/FederationTopology.tsx
// Network graph visualization component
// Sprint: EPIC5-SL-Federation v1

import React, { useState, useEffect, useRef } from 'react';
import { useFederation } from '@hooks/useFederation';
import type { SprintRegistration } from '@core/federation/schema';

export interface FederationTopologyProps {
  sprintId?: string;
  compact?: boolean;
}

interface Node {
  id: string;
  label: string;
  status: SprintRegistration['status'];
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string;
  target: string;
  label?: string;
}

export function FederationTopology({ sprintId, compact = false }: FederationTopologyProps): JSX.Element {
  const { sprints } = useFederation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (sprints.length > 0) {
      initializeTopology();
    }
  }, [sprints, sprintId]);

  const initializeTopology = () => {
    // Create nodes from sprints
    const sprintNodes: Node[] = sprints.map((sprint, index) => ({
      id: sprint.sprintId,
      label: sprint.name,
      status: sprint.status,
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
    }));

    // Create links based on shared capabilities
    const capabilityMap = new Map<string, SprintRegistration[]>();
    sprints.forEach((sprint) => {
      sprint.capabilities.forEach((cap) => {
        if (!capabilityMap.has(cap.tag)) {
          capabilityMap.set(cap.tag, []);
        }
        capabilityMap.get(cap.tag)!.push(sprint);
      });
    });

    const topologyLinks: Link[] = [];
    capabilityMap.forEach((sprintsWithCap, tag) => {
      // Create links between all sprints that share this capability
      for (let i = 0; i < sprintsWithCap.length; i++) {
        for (let j = i + 1; j < sprintsWithCap.length; j++) {
          topologyLinks.push({
            source: sprintsWithCap[i].sprintId,
            target: sprintsWithCap[j].sprintId,
            label: tag,
          });
        }
      }
    });

    setNodes(sprintNodes);
    setLinks(topologyLinks);

    // Start simulation
    if (!compact) {
      startSimulation(sprintNodes, topologyLinks);
    }
  };

  const startSimulation = (nodes: Node[], links: Link[]) => {
    // Simple force simulation
    const iterations = 300;
    const k = 0.1;
    const damping = 0.9;

    for (let iter = 0; iter < iterations; iter++) {
      // Apply forces
      for (const node of nodes) {
        // Initialize velocities
        if (node.vx === undefined) node.vx = 0;
        if (node.vy === undefined) node.vy = 0;

        // Repulsion between nodes
        for (const other of nodes) {
          if (node.id === other.id) continue;

          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = k / distance;

          node.vx += (dx / distance) * force;
          node.vy += (dy / distance) * force;
        }

        // Spring attraction for linked nodes
        links.forEach((link) => {
          if (link.source === node.id || link.target === node.id) {
            const otherId = link.source === node.id ? link.target : link.source;
            const other = nodes.find((n) => n.id === otherId);
            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const idealDistance = 100;
              const force = (distance - idealDistance) * 0.01;

              node.vx += (dx / distance) * force;
              node.vy += (dy / distance) * force;
            }
          }
        });

        // Apply damping and update positions
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;

        // Keep nodes in bounds
        node.x = Math.max(50, Math.min(850, node.x));
        node.y = Math.max(50, Math.min(650, node.y));
      }
    }

    setNodes([...nodes]);
  };

  const getNodeColor = (status: SprintRegistration['status']) => {
    switch (status) {
      case 'active': return '#10b981'; // green-500
      case 'degraded': return '#f59e0b'; // yellow-500
      case 'inactive': return '#6b7280'; // gray-500
      default: return '#9ca3af'; // gray-400
    }
  };

  const getNodeRadius = (nodeId: string) => {
    return selectedNode === nodeId ? 12 : 8;
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Federation Topology</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-600">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-gray-600">Inactive</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-gray-50">
        <svg
          ref={svgRef}
          width="100%"
          height={compact ? 300 : 500}
          viewBox="0 0 900 700"
          className="w-full"
        >
          {/* Links */}
          <g>
            {links.map((link, index) => {
              const source = nodes.find((n) => n.id === link.source);
              const target = nodes.find((n) => n.id === link.target);
              if (!source || !target) return null;

              const isHighlighted = selectedNode === source.id || selectedNode === target.id;

              return (
                <g key={index}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#3b82f6' : '#d1d5db'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeOpacity={isHighlighted ? 0.6 : 0.3}
                  />
                  {link.label && isHighlighted && (
                    <text
                      x={(source.x + target.x) / 2}
                      y={(source.y + target.y) / 2}
                      fill="#6b7280"
                      fontSize="10"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => {
              const sprint = sprints.find((s) => s.sprintId === node.id);
              if (!sprint) return null;

              const isSelected = selectedNode === node.id;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node.id)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={getNodeRadius(node.id)}
                    fill={getNodeColor(node.status)}
                    stroke={isSelected ? '#3b82f6' : '#fff'}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    x={node.x}
                    y={node.y + (compact ? 20 : 25)}
                    fill="#374151"
                    fontSize={compact ? '10' : '12'}
                    textAnchor="middle"
                    className="pointer-events-none font-medium"
                  >
                    {node.label}
                  </text>
                  {!compact && (
                    <text
                      x={node.x}
                      y={node.y + 40}
                      fill="#9ca3af"
                      fontSize="10"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {sprint.capabilities.length} capability{sprint.capabilities.length !== 1 ? 's' : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            {(() => {
              const sprint = sprints.find((s) => s.sprintId === selectedNode);
              if (!sprint) return null;

              return (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <div><span className="font-medium">ID:</span> {sprint.sprintId}</div>
                    <div><span className="font-medium">Version:</span> {sprint.version}</div>
                    <div><span className="font-medium">Status:</span> {sprint.status}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-700 mb-1">Capabilities:</div>
                    <div className="flex flex-wrap gap-1">
                      {sprint.capabilities.slice(0, 5).map((cap) => (
                        <span
                          key={cap.tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {cap.tag}
                        </span>
                      ))}
                      {sprint.capabilities.length > 5 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{sprint.capabilities.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {nodes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">No sprints registered</div>
          <div className="text-sm">Register sprints to see the federation topology</div>
        </div>
      )}
    </div>
  );
}
