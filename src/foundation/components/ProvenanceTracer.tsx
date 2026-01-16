// src/foundation/components/ProvenanceTracer.tsx
// Provenance chain visualizer component
// Sprint: EPIC5-SL-Federation v1

import React, { useState, useEffect } from 'react';
import { useFederation } from '../hooks/useFederation';
import type { ProvenanceChain, ProvenanceNode, VerificationResult } from '@core/federation/schema';

export interface ProvenanceTracerProps {
  objectId?: string;
  compact?: boolean;
}

export function ProvenanceTracer({ objectId: initialObjectId, compact = false }: ProvenanceTracerProps): JSX.Element {
  const { traceProvenance } = useFederation();
  const [objectId, setObjectId] = useState(initialObjectId || '');
  const [chain, setChain] = useState<ProvenanceChain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleTrace = async () => {
    if (!objectId.trim()) {
      setError('Please enter an object ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await traceProvenance(objectId, {
        maxDepth: 100,
        includeMetadata: true,
        verify: true,
      });

      setChain(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trace provenance');
      setChain(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'json' | 'dot') => {
    if (!chain) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(chain, null, 2);
      filename = `provenance-${objectId}.json`;
      mimeType = 'application/json';
    } else {
      // Generate DOT format
      content = generateDotGraph(chain);
      filename = `provenance-${objectId}.dot`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateDotGraph = (chain: ProvenanceChain): string => {
    let dot = `digraph provenance_${objectId.replace(/[^a-zA-Z0-9]/g, '_')} {\n`;
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add nodes
    chain.path.forEach((node, index) => {
      const label = `${node.sprintId}\\n${node.operation}\\n${new Date(node.timestamp).toLocaleString()}`;
      dot += `  "${index}" [label="${label}", fillcolor="${node.operation === 'created' ? '#e1f5fe' : '#f3e5f5'}", style=filled];\n`;
    });

    // Add edges
    for (let i = 1; i < chain.path.length; i++) {
      dot += `  "${i - 1}" -> "${i}";\n`;
    }

    dot += '}\n';
    return dot;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Provenance Tracer</h2>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Enter object ID to trace..."
            value={objectId}
            onChange={(e) => setObjectId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
          />
          <button
            onClick={handleTrace}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Tracing...' : 'Trace'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}
      </div>

      {/* Provenance Chain */}
      {chain && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Provenance Chain</h2>
              <p className="text-sm text-gray-600 mt-1">
                Object ID: <span className="font-mono">{chain.objectId}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExport('dot')}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Export DOT
              </button>
            </div>
          </div>

          {/* Verification Status */}
          {verificationResult && (
            <div className={`p-4 border-b ${verificationResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`flex items-center gap-2 ${verificationResult.verified ? 'text-green-800' : 'text-red-800'}`}>
                <div className={`w-3 h-3 rounded-full ${verificationResult.verified ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">
                  {verificationResult.verified ? 'Chain Verified' : 'Verification Failed'}
                </span>
              </div>
              {verificationResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-700">
                  <div className="font-medium mb-1">Errors:</div>
                  <ul className="list-disc list-inside">
                    {verificationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {verificationResult.warnings.length > 0 && (
                <div className="mt-2 text-sm text-yellow-700">
                  <div className="font-medium mb-1">Warnings:</div>
                  <ul className="list-disc list-inside">
                    {verificationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Chain Visualization */}
          <div className="p-6">
            {chain.path.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg mb-2">No provenance data found</div>
                <div className="text-sm">This object has not been tracked through the federation</div>
              </div>
            ) : (
              <div className="space-y-4">
                {chain.path.map((node, index) => (
                  <div key={index} className="relative">
                    {/* Connection Line */}
                    {index < chain.path.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300" />
                    )}

                    {/* Node */}
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        node.operation === 'created' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <div className={`w-6 h-6 rounded-full ${
                          node.operation === 'created' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900">{node.sprintId}</div>
                            <div className="text-sm text-gray-500">{formatTimestamp(node.timestamp)}</div>
                          </div>

                          <div className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Operation:</span> {node.operation}
                          </div>

                          {node.metadata && Object.keys(node.metadata).length > 0 && (
                            <div className="text-sm">
                              <div className="font-medium text-gray-700 mb-1">Metadata:</div>
                              <pre className="bg-white rounded p-2 text-xs overflow-x-auto">
                                {JSON.stringify(node.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
