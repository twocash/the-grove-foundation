// src/foundation/components/DataPanel.tsx
// Foundation-styled panel/card component with unified design tokens

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface DataPanelProps {
  title: string;
  icon?: LucideIcon | string; // LucideIcon or Material Symbols name
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  title,
  icon,
  actions,
  children,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) return null;

    // String = Material Symbols icon name
    if (typeof icon === 'string') {
      return (
        <span className="material-symbols-outlined text-base text-primary">
          {icon}
        </span>
      );
    }

    // LucideIcon component
    const Icon = icon;
    return <Icon size={16} className="text-primary" />;
  };

  return (
    <div className={`bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          {renderIcon()}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default DataPanel;
