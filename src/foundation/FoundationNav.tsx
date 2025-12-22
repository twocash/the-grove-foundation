// src/foundation/FoundationNav.tsx
// Foundation navigation using shared NavigationTree

import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationTree, type NavItem } from '../shared/layout';

// Foundation navigation structure
const foundationNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: 'dashboard',
    route: '/foundation',
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'edit_document',
    children: [
      {
        id: 'narrative',
        label: 'Narrative Architect',
        icon: 'route',
        route: '/foundation/narrative',
      },
      {
        id: 'knowledge',
        label: 'Knowledge Vault',
        icon: 'database',
        route: '/foundation/knowledge',
      },
      {
        id: 'audio',
        label: 'Audio Studio',
        icon: 'music_note',
        route: '/foundation/audio',
      },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderation',
    icon: 'shield',
    children: [
      {
        id: 'sprouts',
        label: 'Sprout Queue',
        icon: 'eco',
        route: '/foundation/sprouts',
        badge: 0, // TODO: Wire to actual pending count
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'analytics',
    children: [
      {
        id: 'engagement',
        label: 'Engagement',
        icon: 'trending_up',
        route: '/foundation/engagement',
      },
      {
        id: 'health',
        label: 'System Health',
        icon: 'monitor_heart',
        route: '/foundation/health',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    children: [
      {
        id: 'tuner',
        label: 'Reality Tuner',
        icon: 'tune',
        route: '/foundation/tuner',
      },
      {
        id: 'genesis',
        label: 'Experience Mode',
        icon: 'auto_awesome',
        route: '/foundation/genesis',
      },
    ],
  },
];

export function FoundationNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (item: NavItem) => {
    if (item.route) {
      navigate(item.route);
    }
  };

  // Determine active item from current route
  const getActiveId = () => {
    const path = location.pathname;
    // Check nested items first
    for (const group of foundationNavItems) {
      if (group.children) {
        for (const child of group.children) {
          if (child.route === path) {
            return child.route;
          }
        }
      }
      if (group.route === path) {
        return group.route;
      }
    }
    return '/foundation';
  };

  return (
    <NavigationTree
      items={foundationNavItems}
      activeId={getActiveId()}
      onNavigate={handleNavigate}
      header={
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">terminal</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Consoles</span>
        </div>
      }
      footer={
        <div className="text-xs text-slate-400 dark:text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">⌘</kbd>
          <span className="mx-1">+</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">\</kbd>
          <span className="ml-1">Toggle Inspector</span>
        </div>
      }
    />
  );
}
