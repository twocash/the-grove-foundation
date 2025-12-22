// src/workspace/NavigationSidebar.tsx
// Left column with navigation tree

import { useState, useEffect } from 'react';
import { useWorkspaceUI } from './WorkspaceUIContext';
import type { NavItem, NavigationPath } from '@core/schema/workspace';

// Material Symbols icon name mapping
const iconNameToSymbol: Record<string, string> = {
  compass: 'explore',
  sprout: 'eco',
  users: 'groups',
  zap: 'bolt',
  message: 'chat_bubble',
  branch: 'account_tree',
  map: 'map',
  glasses: 'eyeglasses',
  code: 'code',
  bot: 'smart_toy',
  forest: 'forest',
  add_circle: 'add_circle_outline',
};

// Navigation tree structure - Updated IA v0.14.2
const navigationTree: Record<string, NavItem> = {
  explore: {
    id: 'explore',
    label: 'Explore',
    icon: 'compass',
    children: {
      groveProject: {
        id: 'groveProject',
        label: 'Grove Project',
        icon: 'forest',
        view: 'terminal',
        children: {
          nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
          journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
          lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
        },
      },
      addField: {
        id: 'addField',
        label: '+ Fields',
        icon: 'add_circle',
        comingSoon: true,
      },
    },
  },
  do: {
    id: 'do',
    label: 'Do',
    icon: 'zap',
    children: {
      chat: { id: 'chat', label: 'Chat', icon: 'message', view: 'chat-placeholder', comingSoon: true },
      apps: { id: 'apps', label: 'Apps', icon: 'code', view: 'apps-placeholder', comingSoon: true },
      agents: { id: 'agents', label: 'Agents', icon: 'bot', view: 'agents-placeholder', comingSoon: true },
    },
  },
  cultivate: {
    id: 'cultivate',
    label: 'Cultivate',
    icon: 'sprout',
    children: {
      mySprouts: { id: 'mySprouts', label: 'My Sprouts', view: 'sprout-grid' },
      commons: { id: 'commons', label: 'Commons', view: 'commons-feed' },
    },
  },
  village: {
    id: 'village',
    label: 'Village',
    icon: 'users',
    children: {
      feed: { id: 'feed', label: 'Feed', view: 'village-feed' },
    },
  },
};

interface NavItemProps {
  item: NavItem;
  path: string[];
  depth: number;
}

function NavItemComponent({ item, path, depth }: NavItemProps) {
  const { navigation, navigateTo, toggleGroup } = useWorkspaceUI();
  const fullPath = [...path, item.id];
  const pathString = fullPath.join('.');

  const isExpanded = navigation.expandedGroups.has(pathString);
  const isActive = navigation.activePath.join('.') === pathString;
  const isParentOfActive = navigation.activePath.join('.').startsWith(pathString + '.');

  const hasChildren = item.children && Object.keys(item.children).length > 0;
  const iconSymbol = item.icon ? iconNameToSymbol[item.icon] : null;
  const isComingSoon = item.comingSoon ?? false;

  const handleClick = () => {
    if (hasChildren) {
      toggleGroup(pathString);
    }
    if (item.view) {
      navigateTo(fullPath);
    }
  };

  // Determine styling based on state
  const getItemClasses = () => {
    if (isComingSoon) {
      return 'text-[var(--grove-text-dim)] cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800/50';
    }
    if (isActive) {
      return 'bg-stone-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium';
    }
    if (isParentOfActive) {
      return 'text-[var(--grove-text)]';
    }
    return 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/50';
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors
          ${getItemClasses()}
        `}
        style={{ paddingLeft: `${8 + depth * 24}px` }}
      >
        {hasChildren && (
          <span className="material-symbols-outlined text-lg">
            {isExpanded ? 'expand_more' : 'chevron_right'}
          </span>
        )}
        {!hasChildren && depth > 0 && <span className="w-5" />}
        {iconSymbol && (
          <span className={`material-symbols-outlined text-lg ${isActive ? 'filled text-primary' : 'opacity-70'} ${isComingSoon ? 'opacity-50' : ''}`}>
            {iconSymbol}
          </span>
        )}
        <span className="flex-1 text-left">{item.label}</span>
        {isComingSoon && (
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600">
            Soon
          </span>
        )}
        {item.badge !== undefined && !isComingSoon && (
          <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--grove-surface)]">
            {item.badge}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {Object.values(item.children!).map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              path={fullPath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NavigationSidebar() {
  const { session } = useWorkspaceUI();
  const [elapsed, setElapsed] = useState(0);

  // Update timer every minute
  useEffect(() => {
    const updateElapsed = () => {
      const diff = Date.now() - session.startTime.getTime();
      setElapsed(Math.floor(diff / 60000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [session.startTime]);

  return (
    <aside className="w-60 flex flex-col bg-[var(--grove-surface)] dark:bg-background-dark/50 border-r border-[var(--grove-border)] flex-shrink-0">
      {/* Navigation Tree */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {Object.values(navigationTree).map((item) => (
          <div key={item.id}>
            <NavItemComponent item={item} path={[]} depth={0} />
          </div>
        ))}
      </nav>

      {/* Footer with session info */}
      <div className="border-t border-[var(--grove-border)] px-4 py-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
          <span>{elapsed}m</span>
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-600">
          <span className="material-symbols-outlined text-sm">eco</span>
          <span>{session.sproutCount}</span>
        </div>
      </div>
    </aside>
  );
}
