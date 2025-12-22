// src/foundation/FoundationHeader.tsx
// Unified header for Foundation workspace

import { useLocation, Link } from 'react-router-dom';
import { StatusBadge } from '../shared/feedback';

interface FoundationHeaderProps {
  status?: 'healthy' | 'degraded' | 'error';
  version?: string;
}

// Map route paths to console names
const routeNames: Record<string, string> = {
  '/foundation': 'Dashboard',
  '/foundation/genesis': 'Genesis',
  '/foundation/health': 'System Health',
  '/foundation/narrative': 'Narrative Architect',
  '/foundation/engagement': 'Engagement Bridge',
  '/foundation/knowledge': 'Knowledge Vault',
  '/foundation/tuner': 'Reality Tuner',
  '/foundation/audio': 'Audio Studio',
  '/foundation/sprouts': 'Sprout Queue',
};

const statusVariant = {
  healthy: 'success' as const,
  degraded: 'warning' as const,
  error: 'error' as const,
};

export function FoundationHeader({
  status = 'healthy',
  version = '2.4.1',
}: FoundationHeaderProps) {
  const location = useLocation();
  const consoleName = routeNames[location.pathname] || 'Console';

  return (
    <header className="h-12 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center px-4">
      {/* Logo / Brand */}
      <Link to="/foundation" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-lg">eco</span>
        </div>
        <span className="text-primary font-semibold">Foundation</span>
      </Link>

      {/* Breadcrumb */}
      <div className="flex items-center ml-4">
        <span className="text-slate-300 dark:text-slate-600 mx-2">/</span>
        <span className="text-slate-600 dark:text-slate-400 text-sm">{consoleName}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status & Version */}
      <div className="flex items-center gap-3">
        <StatusBadge
          label={status}
          variant={statusVariant[status]}
          pulse={status !== 'healthy'}
        />
        <span className="text-xs text-slate-400 dark:text-slate-500">v{version}</span>

        {/* Exit to Surface */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 hover:text-primary hover:bg-primary/5 rounded transition-colors"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          <span className="hidden sm:inline">Exit</span>
        </Link>
      </div>
    </header>
  );
}
