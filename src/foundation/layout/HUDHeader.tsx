// src/foundation/layout/HUDHeader.tsx
// HUD-style header for Foundation console

import React from 'react';
import { useLocation } from 'react-router-dom';

interface HUDHeaderProps {
  status?: 'healthy' | 'degraded' | 'error';
  version?: string;
}

const statusColors = {
  healthy: 'bg-holo-lime',
  degraded: 'bg-holo-amber',
  error: 'bg-holo-red',
};

const statusLabels = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  error: 'Error',
};

// Map route paths to console names
const routeNames: Record<string, string> = {
  '/foundation': 'Dashboard',
  '/foundation/narrative': 'Narrative Architect',
  '/foundation/engagement': 'Engagement Bridge',
  '/foundation/knowledge': 'Knowledge Vault',
  '/foundation/tuner': 'Reality Tuner',
  '/foundation/audio': 'Audio Studio',
};

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  status = 'healthy',
  version = '2.4.1',
}) => {
  const location = useLocation();
  const consoleName = routeNames[location.pathname] || 'Console';

  return (
    <header className="h-12 bg-obsidian-raised border-b border-holo-cyan/20 flex items-center px-4 font-mono">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border border-holo-cyan/60 rounded flex items-center justify-center">
          <span className="text-holo-cyan text-xs font-bold">F</span>
        </div>
        <span className="text-holo-cyan font-medium">Foundation</span>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center ml-4">
        <span className="text-gray-600 mx-2">/</span>
        <span className="text-gray-400 text-sm">{consoleName}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}
          />
          <span className="text-xs text-gray-400">{statusLabels[status]}</span>
        </div>

        {/* Version */}
        <span className="text-xs text-gray-500">v{version}</span>
      </div>
    </header>
  );
};

export default HUDHeader;
