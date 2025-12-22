// src/shared/layout/NavigationTree.tsx
// Reusable navigation tree component for workspace sidebars

import { useState, type ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  badge?: number | string;
  children?: NavItem[];
}

interface NavigationTreeProps {
  /** Navigation items */
  items: NavItem[];
  /** Currently active route/item ID */
  activeId?: string;
  /** Handler when item is clicked */
  onNavigate: (item: NavItem) => void;
  /** Header content above nav items */
  header?: ReactNode;
  /** Footer content below nav items */
  footer?: ReactNode;
}

export function NavigationTree({
  items,
  activeId,
  onNavigate,
  header,
  footer,
}: NavigationTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['content', 'analytics']));

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isActive = (item: NavItem): boolean => {
    if (item.route && activeId === item.route) return true;
    if (item.id === activeId) return true;
    return false;
  };

  const renderItem = (item: NavItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.id);
    const active = isActive(item);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleGroup(item.id);
            } else {
              onNavigate(item);
            }
          }}
          className={`
            w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
            ${depth > 0 ? 'ml-4' : ''}
            ${active
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700'
            }
          `}
        >
          {item.icon && (
            <span className={`material-symbols-outlined text-lg ${active ? 'text-primary' : ''}`}>
              {item.icon}
            </span>
          )}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge !== undefined && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-0.5">
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {header && (
        <div className="p-4 border-b border-border-light dark:border-border-dark">
          {header}
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(item => renderItem(item))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t border-border-light dark:border-border-dark">
          {footer}
        </div>
      )}
    </div>
  );
}
