// src/foundation/components/FederationCard.tsx
// Sprint overview card component
// Sprint: EPIC5-SL-Federation v1

import React from 'react';
import type { SprintRegistration } from '@core/federation/schema';
import { CapabilityTag } from './CapabilityTag';

export interface FederationCardProps {
  sprint: SprintRegistration;
  onSelect?: (sprint: SprintRegistration) => void;
  onHeartbeat?: (sprintId: string) => void;
  compact?: boolean;
}

export function FederationCard({ sprint, onSelect, onHeartbeat, compact = false }: FederationCardProps): JSX.Element {
  const formatUptime = (lastSeen: string) => {
    const now = Date.now();
    const lastSeenMs = new Date(lastSeen).getTime();
    const diffMs = now - lastSeenMs;
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getHealthColor = (status?: SprintRegistration['status']) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-400';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  const getHealthBadgeColor = (status?: SprintRegistration['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${
        compact ? 'p-4' : 'p-6'
      }`}
      onClick={() => onSelect?.(sprint)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
            {sprint.name}
          </h3>
          <p className="text-gray-500 text-sm">{sprint.sprintId}</p>
        </div>

        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            getHealthBadgeColor(sprint.status)
          }`}
        >
          {sprint.status}
        </span>
      </div>

      {!compact && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Version:</span> {sprint.version}
          </div>
          {sprint.organization && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Organization:</span> {sprint.organization}
            </div>
          )}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Last seen:</span> {formatUptime(sprint.lastSeen)}
          </div>
        </div>
      )}

      {sprint.capabilities.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Capabilities</div>
          <div className="flex flex-wrap gap-2">
            {sprint.capabilities.slice(0, compact ? 3 : 5).map((capability) => (
              <CapabilityTag key={capability.tag} capability={capability} />
            ))}
            {sprint.capabilities.length > (compact ? 3 : 5) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{sprint.capabilities.length - (compact ? 3 : 5)} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className={`flex items-center gap-2 ${getHealthColor(sprint.status)}`}>
          <div className={`w-2 h-2 rounded-full ${
            sprint.status === 'active' ? 'bg-green-500' :
            sprint.status === 'degraded' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm font-medium">
            {sprint.status === 'active' ? 'Healthy' :
             sprint.status === 'degraded' ? 'Degraded' : 'Offline'}
          </span>
        </div>

        {onHeartbeat && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHeartbeat(sprint.sprintId);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Send Heartbeat
          </button>
        )}
      </div>
    </div>
  );
}
