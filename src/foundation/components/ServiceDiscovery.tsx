// src/foundation/components/ServiceDiscovery.tsx
// Service discovery interface component
// Sprint: EPIC5-SL-Federation v1

import React, { useState, useEffect } from 'react';
import { useFederation } from '@hooks/useFederation';
import type { SprintRegistration, DiscoveryCriteria, Capability } from '@core/federation/schema';
import { FederationCard } from './FederationCard';
import { CapabilityTag } from './CapabilityTag';

export interface ServiceDiscoveryProps {
  onSprintSelect?: (sprint: SprintRegistration) => void;
  compact?: boolean;
}

export function ServiceDiscovery({ onSprintSelect, compact = false }: ServiceDiscoveryProps): JSX.Element {
  const { discoverSprints, listSprints } = useFederation();
  const [sprints, setSprints] = useState<SprintRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [criteria, setCriteria] = useState<DiscoveryCriteria>({
    tags: [],
    organization: '',
    version: '',
    status: undefined,
    limit: 50,
    offset: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [availableCapabilities, setAvailableCapabilities] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadSprints();
    loadCapabilities();
  }, []);

  // Apply filters when criteria change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchSprints();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [criteria, searchQuery]);

  const loadSprints = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listSprints(100, 0);
      setSprints(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sprints');
    } finally {
      setLoading(false);
    }
  };

  const loadCapabilities = async () => {
    try {
      // In a real implementation, this would fetch from the registry
      // For now, extract from loaded sprints
      const capabilities = new Set<string>();
      sprints.forEach(sprint => {
        sprint.capabilities.forEach(cap => capabilities.add(cap.tag));
      });
      setAvailableCapabilities(capabilities);
    } catch (err) {
      console.error('Failed to load capabilities:', err);
    }
  };

  const searchSprints = async () => {
    setLoading(true);
    setError(null);

    try {
      // Filter by search query
      const filtered = sprints.filter(sprint => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          sprint.name.toLowerCase().includes(query) ||
          sprint.sprintId.toLowerCase().includes(query) ||
          sprint.organization?.toLowerCase().includes(query) ||
          sprint.capabilities.some(cap => cap.tag.toLowerCase().includes(query))
        );
      });

      // Apply tag filters
      const tagFiltered = selectedTags.length > 0
        ? filtered.filter(sprint =>
            selectedTags.every(tag =>
              sprint.capabilities.some(cap => cap.tag === tag)
            )
          )
        : filtered;

      setSprints(tagFiltered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setCriteria({
      tags: [],
      organization: '',
      version: '',
      status: undefined,
      limit: 50,
      offset: 0,
    });
  };

  const handleHeartbeat = async (sprintId: string) => {
    try {
      await discoverSprints({ limit: 1, offset: 0 });
      await loadSprints();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Heartbeat failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Service Discovery</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, ID, organization, or capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Capability Tags Filter */}
        {availableCapabilities.size > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Filter by Capabilities</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(availableCapabilities).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(searchQuery || selectedTags.length > 0) && (
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Discovered Sprints</h2>
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${sprints.length} sprint${sprints.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-2">Searching sprints...</div>
          </div>
        ) : sprints.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-lg mb-2">No sprints found</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        ) : (
          <div className={`grid gap-4 p-6 ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {sprints.map((sprint) => (
              <FederationCard
                key={sprint.sprintId}
                sprint={sprint}
                onSelect={onSprintSelect}
                onHeartbeat={handleHeartbeat}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
