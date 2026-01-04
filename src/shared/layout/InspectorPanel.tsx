// src/shared/layout/InspectorPanel.tsx
// Reusable inspector panel wrapper with header and close button
// Enhanced: collapsible sections (prompt-editor-standardization-v1)

import { useState, type ReactNode } from 'react';

interface InspectorPanelProps {
  /** Panel title */
  title: string;
  /** Panel subtitle (optional) - can be string or React node */
  subtitle?: React.ReactNode;
  /** Icon name (Material Symbols) */
  icon?: string;
  /** Icon color class */
  iconColor?: string;
  /** Icon background class */
  iconBg?: string;
  /** Close handler */
  onClose: () => void;
  /** Panel content */
  children: ReactNode;
  /** Footer actions */
  actions?: ReactNode;
  /** Bottom panel slot (for Copilot) */
  bottomPanel?: ReactNode;
}

export function InspectorPanel({
  title,
  subtitle,
  icon,
  iconColor = 'text-slate-600 dark:text-slate-300',
  iconBg = 'bg-stone-100 dark:bg-slate-700',
  onClose,
  children,
  actions,
  bottomPanel,
}: InspectorPanelProps) {
  return (
    <div className="flex flex-col h-full glass-panel-solid">
      {/* Header */}
      <div className="min-h-14 flex items-start justify-between px-4 py-3 border-b border-[var(--glass-border)] flex-shrink-0 bg-black/20">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {icon && (
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm text-[var(--glass-text-primary)] line-clamp-2 leading-tight">{title}</div>
            {subtitle && (
              <div className="text-xs text-[var(--glass-text-muted)] mt-1 line-clamp-2">{subtitle}</div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)] rounded-lg transition-colors flex-shrink-0 ml-2"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Actions footer */}
      {actions && (
        <div className="p-4 border-t border-[var(--glass-border)] flex-shrink-0 bg-black/20">
          {actions}
        </div>
      )}

      {/* Bottom Panel (Copilot) */}
      {bottomPanel && (
        <div className="flex-shrink-0">
          {bottomPanel}
        </div>
      )}
    </div>
  );
}

// Reusable section within inspector
interface InspectorSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  /** Enable collapse/expand toggle */
  collapsible?: boolean;
  /** Start collapsed (only applies when collapsible=true) */
  defaultCollapsed?: boolean;
}

export function InspectorSection({ 
  title, 
  children, 
  className = '',
  collapsible = false,
  defaultCollapsed = false
}: InspectorSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={`p-5 space-y-4 ${className}`}>
      {title && (
        <div 
          className={`flex items-center justify-between ${collapsible ? 'cursor-pointer select-none' : ''}`}
          onClick={handleToggle}
          role={collapsible ? 'button' : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={collapsible ? handleKeyDown : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
        >
          <h4 className="glass-section-header">{title}</h4>
          {collapsible && (
            <span 
              className={`material-symbols-outlined text-[var(--glass-text-muted)] transition-transform duration-200 ${
                isCollapsed ? '' : 'rotate-180'
              }`}
            >
              expand_more
            </span>
          )}
        </div>
      )}
      {(!collapsible || !isCollapsed) && children}
    </div>
  );
}

// Divider between sections
export function InspectorDivider() {
  return <div className="border-t border-[var(--glass-border)]" />;
}
