// src/foundation/consoles/FederationConsole.tsx
// Main federation dashboard
// Sprint: EPIC5-SL-Federation v1

import React, { useState } from 'react';
import { useFederation } from '../hooks/useFederation';
import type { SprintRegistration } from '@core/federation/schema';
import { FederationCard } from '@foundation/components/FederationCard';
import { ServiceDiscovery } from '@foundation/components/ServiceDiscovery';
import { ProvenanceTracer } from '@foundation/components/ProvenanceTracer';
import { FederationTopology } from '@foundation/components/FederationTopology';

export function FederationConsole(): JSX.Element {
  const {
    sprints,
    loading,
    error,
    health,
    discoverSprints,
    registerSprint,
    unregisterSprint,
    heartbeat,
    refetch,
  } = useFederation();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'discovery' | 'topology' | 'provenance'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedSprint, setSelectedSprint] = useState<SprintRegistration | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await discoverSprints({
        tags: selectedTag ? [selectedTag] : undefined,
        limit: 20,
      });

      console.log('Search results:', results.items);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleRegister = async (sprintId: string) => {
    try {
      await registerSprint({
        sprintId,
        name: `Test Sprint ${sprintId}`,
        version: '1.0.0',
        endpoint: `http://localhost:3000/${sprintId}`,
        capabilities: [
          { tag: 'test-capability', description: 'Test capability' },
        ],
      });
      await refetch();
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleUnregister = async (sprintId: string) => {
    try {
      await unregisterSprint(sprintId);
      await refetch();
    } catch (err) {
      console.error('Unregistration failed:', err);
    }
  };

  const handleHeartbeat = async (sprintId: string) => {
    try {
      await heartbeat(sprintId);
      await refetch();
    } catch (err) {
      console.error('Heartbeat failed:', err);
    }
  };

  if (loading && sprints.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-lg">Loading federation data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Federation Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor federated sprints across the organization
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'discovery'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Service Discovery
            </button>
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'topology'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Topology
            </button>
            <button
              onClick={() => setActiveTab('provenance')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'provenance'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Provenance Tracer
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Health Status */}
            {health && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Total Sprints</div>
                  <div className="mt-2 text-3xl font-semibold text-gray-900">
                    {health.totalSprints}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Active Sprints</div>
                  <div className="mt-2 text-3xl font-semibold text-green-600">
                    {health.activeSprints}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Registry Status</div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        health.status === 'healthy'
                          ? 'bg-green-100 text-green-800'
                          : health.status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {health.status}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Uptime</div>
                  <div className="mt-2 text-3xl font-semibold text-gray-900">
                    {Math.floor(health.uptime / 3600000)}h
                  </div>
                </div>
              </div>
            )}

            {/* Sprint Actions */}
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  <p className="text-sm text-gray-600">Manage federation sprints</p>
                </div>
                <button
                  onClick={() => handleRegister('test-sprint-' + Date.now())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Register Test Sprint
                </button>
              </div>
            </div>

            {/* Sprint List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Registered Sprints</h2>
              </div>
              <div className="p-6">
                {sprints.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-lg mb-2">No sprints registered</div>
                    <div className="text-sm">Click "Register Test Sprint" to add a sprint</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sprints.map((sprint) => (
                      <FederationCard
                        key={sprint.sprintId}
                        sprint={sprint}
                        onSelect={setSelectedSprint}
                        onHeartbeat={handleHeartbeat}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'discovery' && (
          <ServiceDiscovery onSprintSelect={setSelectedSprint} />
        )}

        {activeTab === 'topology' && (
          <FederationTopology />
        )}

        {activeTab === 'provenance' && (
          <ProvenanceTracer />
        )}
      </div>
    </div>
  );
}

export default FederationConsole;
