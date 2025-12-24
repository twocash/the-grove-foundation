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
    <header className="h-12 bg-theme-bg-secondary border-b border-theme-border-accent/20 flex items-center px-4 font-mono">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 border border-theme-border-accent/60 rounded flex items-center justify-center">
          <span className="text-theme-text-accent text-xs font-bold">F</span>
        </div>
        <span className="text-theme-text-accent font-medium">Foundation</span>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center ml-4">
        <span className="text-theme-text-muted mx-2">/</span>
        <span className="text-theme-text-secondary text-sm">{consoleName}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}
          />
          <span className="text-xs text-theme-text-secondary">{statusLabels[status]}</span>
        </div>

        {/* Version */}
        <span className="text-xs text-theme-text-muted">v{version}</span>
      </div>
    </header>
  );
};

export default HUDHeader;
