// src/foundation/components/DataPanel.tsx
// Foundation-styled panel/card component

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface DataPanelProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  title,
  icon: Icon,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`f-panel rounded ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-holo-cyan/10">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-holo-cyan" />}
          <h3 className="text-sm font-semibold text-white font-sans">{title}</h3>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default DataPanel;
