// src/workspace/NavigationSidebar.tsx
// Left column with navigation tree

import { useState, useEffect } from 'react';
import { useWorkspaceUI } from './WorkspaceUIContext';
import type { NavItem, NavigationPath } from '@core/schema/workspace';

// Icons from lucide-react
import {
  Compass,
  Sprout,
  Users,
  Zap,
  MessageSquare,
  GitBranch,
  Map,
  Glasses,
  Code,
  Bot,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

// Navigation tree structure - Updated IA
const navigationTree: Record<string, NavItem> = {
  explore: {
    id: 'explore',
    label: 'Explore',
    icon: 'compass',
    view: 'terminal',  // Clicking Explore shows Terminal directly
    children: {
      nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
      journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
      lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
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

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  compass: Compass,
  sprout: Sprout,
  users: Users,
  zap: Zap,
  message: MessageSquare,
  branch: GitBranch,
  map: Map,
  glasses: Glasses,
  code: Code,
  bot: Bot,
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
  const Icon = item.icon ? iconMap[item.icon] : null;
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
      return 'text-[var(--grove-text-dim)] cursor-pointer hover:bg-[var(--grove-surface)]';
    }
    if (isActive) {
      return 'bg-[var(--grove-accent-muted)] text-[var(--grove-accent)]';
    }
    if (isParentOfActive) {
      return 'text-[var(--grove-text)]';
    }
    return 'text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] hover:bg-[var(--grove-surface)]';
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors
          ${getItemClasses()}
        `}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <span className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        {Icon && <Icon className={`w-4 h-4 ${isComingSoon ? 'opacity-50' : ''}`} />}
        <span className="flex-1 text-left">{item.label}</span>
        {isComingSoon && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--grove-surface)] text-[var(--grove-text-dim)]">
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
    <aside className="w-60 flex flex-col bg-[var(--grove-bg)] border-r border-[var(--grove-border)]">
      {/* Navigation Tree */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {Object.values(navigationTree).map((item) => (
          <div key={item.id} className="mb-2">
            <NavItemComponent item={item} path={[]} depth={0} />
          </div>
        ))}
      </nav>

      {/* Footer with session info */}
      <div className="border-t border-[var(--grove-border)] px-4 py-3">
        <div className="flex items-center justify-between text-xs text-[var(--grove-text-muted)]">
          <span className="font-mono">{elapsed}m</span>
          <span className="flex items-center gap-1">
            <Sprout size={12} />
            {session.sproutCount}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--grove-success)]" />
          <span className="text-[var(--grove-text-dim)]">Healthy</span>
        </div>
      </div>
    </aside>
  );
}
