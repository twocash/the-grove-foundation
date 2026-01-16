// src/foundation/consoles/FederationConsole.tsx
// Main federation dashboard
// Sprint: EPIC5-SL-Federation v1

import React, { useState } from 'react';
import { useFederation } from '@hooks/useFederation';
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
                {Math.floor(health.uptime / 60000)}m
              </div>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Discovery</h2>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search sprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="text"
              placeholder="Capability tag..."
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Sprint List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Registered Sprints</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sprint ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capabilities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {sprints.map((sprint) => (
                  <SprintRow
                    key={sprint.sprintId}
                    sprint={sprint}
                    onUnregister={() => handleUnregister(sprint.sprintId)}
                    onHeartbeat={() => handleHeartbeat(sprint.sprintId)}
                  />
                ))}

                {sprints.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No sprints registered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Registration */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Registration</h2>
          <p className="text-gray-600 mb-4">
            Register a test sprint to verify the federation system
          </p>
          <button
            onClick={() => handleRegister(`test-sprint-${Date.now()}`)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Register Test Sprint
          </button>
        </div>
        )}

        {/* Service Discovery Tab */}
        {activeTab === 'discovery' && (
          <ServiceDiscovery
            onSprintSelect={(sprint) => setSelectedSprint(sprint)}
          />
        )}

        {/* Topology Tab */}
        {activeTab === 'topology' && (
          <FederationTopology
            sprintId={selectedSprint?.sprintId}
          />
        )}

        {/* Provenance Tracer Tab */}
        {activeTab === 'provenance' && (
          <ProvenanceTracer />
        )}
      </div>
    </div>
  );
}

interface SprintRowProps {
  sprint: SprintRegistration;
  onUnregister: () => void;
  onHeartbeat: () => void;
}

function SprintRow({ sprint, onUnregister, onHeartbeat }: SprintRowProps): JSX.Element {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {sprint.sprintId}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {sprint.name}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {sprint.version}
      </td>

      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex flex-wrap gap-2">
          {sprint.capabilities.map((cap) => (
            <span
              key={cap.tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {cap.tag}
            </span>
          ))}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            sprint.status === 'active'
              ? 'bg-green-100 text-green-800'
              : sprint.status === 'inactive'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {sprint.status}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(sprint.lastSeen).toLocaleString()}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex gap-2">
          <button
            onClick={onHeartbeat}
            className="text-blue-600 hover:text-blue-900 font-medium"
          >
            Heartbeat
          </button>
          <button
            onClick={onUnregister}
            className="text-red-600 hover:text-red-900 font-medium"
          >
            Unregister
          </button>
        </div>
      </td>
    </tr>
  );
}
