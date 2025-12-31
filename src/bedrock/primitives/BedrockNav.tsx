// src/bedrock/primitives/BedrockNav.tsx
// Navigation primitive for Bedrock workspace
// Sprint: bedrock-foundation-v1, bedrock-alignment-v1 (Quantum Glass)

import React from 'react';
import { useLocation, Link } from 'react-router-dom';

// =============================================================================
// Types
// =============================================================================

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Material Symbols icon name */
  icon: string;
  /** Route path */
  path: string;
  /** Badge count (optional) */
  badge?: number;
  /** Children items for nested navigation */
  children?: NavItem[];
  /** Whether this item is disabled */
  disabled?: boolean;
}

interface BedrockNavProps {
  /** Navigation items to render */
  items: NavItem[];
  /** Console ID for data attributes */
  consoleId: string;
  /** Header content above nav items */
  header?: React.ReactNode;
  /** Footer content below nav items */
  footer?: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function BedrockNav({ items, consoleId, header, footer }: BedrockNavProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: NavItem) => {
    if (isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.path));
    }
    return false;
  };

  return (
    <nav
      className="flex flex-col h-full p-4"
      data-nav-console={consoleId}
      aria-label={`${consoleId} navigation`}
    >
      {/* Header */}
      {header && (
        <div className="mb-4 pb-4 border-b border-[var(--glass-border)]">
          {header}
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {items.map(item => (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={isActive}
            isParentActive={isParentActive}
          />
        ))}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
          {footer}
        </div>
      )}
    </nav>
  );
}

// =============================================================================
// NavItem Component
// =============================================================================

interface NavItemComponentProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  isParentActive: (item: NavItem) => boolean;
  depth?: number;
}

function NavItemComponent({ item, isActive, isParentActive, depth = 0 }: NavItemComponentProps) {
  const active = isActive(item.path);
  const parentActive = isParentActive(item);

  if (item.disabled) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--glass-text-subtle)] opacity-50 cursor-not-allowed"
        style={{ paddingLeft: depth > 0 ? `${12 + depth * 16}px` : undefined }}
      >
        <span className="material-symbols-outlined text-lg">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
          ${active
            ? 'bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border-l-2 border-[var(--neon-cyan)]'
            : parentActive
              ? 'text-[var(--glass-text-primary)]'
              : 'text-[var(--glass-text-muted)] hover:bg-[var(--glass-elevated)] hover:text-[var(--glass-text-primary)]'
          }
        `}
        style={{ paddingLeft: depth > 0 ? `${12 + depth * 16}px` : undefined }}
        aria-current={active ? 'page' : undefined}
      >
        <span className="material-symbols-outlined text-lg">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] font-medium">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>

      {/* Nested children */}
      {item.children && item.children.length > 0 && parentActive && (
        <div className="mt-1 space-y-1">
          {item.children.map(child => (
            <NavItemComponent
              key={child.id}
              item={child}
              isActive={isActive}
              isParentActive={isParentActive}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BedrockNav;
