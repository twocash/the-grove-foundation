// src/foundation/layout/NavSidebar.tsx
// Navigation sidebar for Foundation console

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Zap,
  Database,
  Sliders,
  Music,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  route: string;
}

const navItems: NavItem[] = [
  { id: 'narrative', icon: BookOpen, label: 'Narrative Architect', route: '/foundation/narrative' },
  { id: 'engagement', icon: Zap, label: 'Engagement Bridge', route: '/foundation/engagement' },
  { id: 'knowledge', icon: Database, label: 'Knowledge Vault', route: '/foundation/knowledge' },
  { id: 'tuner', icon: Sliders, label: 'Reality Tuner', route: '/foundation/tuner' },
  { id: 'audio', icon: Music, label: 'Audio Studio', route: '/foundation/audio' },
];

interface NavSidebarProps {
  defaultExpanded?: boolean;
}

export const NavSidebar: React.FC<NavSidebarProps> = ({ defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const location = useLocation();

  const isActive = (route: string) => {
    if (route === '/foundation') {
      return location.pathname === '/foundation';
    }
    return location.pathname.startsWith(route);
  };

  return (
    <nav
      className={`
        ${expanded ? 'w-[200px]' : 'w-14'}
        bg-obsidian-raised border-r border-holo-cyan/10
        min-h-[calc(100vh-48px)] flex flex-col
        transition-all duration-200 ease-out
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="
          h-12 flex items-center justify-center
          text-gray-500 hover:text-holo-cyan hover:bg-holo-cyan/5
          border-b border-holo-cyan/10
          transition-colors
        "
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Nav Items */}
      <div className="flex-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);

          return (
            <Link
              key={item.id}
              to={item.route}
              className={`
                flex items-center gap-3 px-4 py-3
                ${active
                  ? 'text-holo-cyan bg-holo-cyan/10 border-l-2 border-holo-cyan'
                  : 'text-gray-500 hover:text-holo-cyan hover:bg-holo-cyan/5 border-l-2 border-transparent'
                }
                transition-colors
              `}
              title={item.label}
            >
              <Icon size={20} className="flex-shrink-0" />
              {expanded && (
                <span className="text-sm whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-holo-cyan/10 py-2">
        <Link
          to="/"
          className="
            flex items-center gap-3 px-4 py-3
            text-gray-500 hover:text-white hover:bg-white/5
            transition-colors
          "
          title="Exit to Surface"
        >
          <Home size={20} className="flex-shrink-0" />
          {expanded && (
            <span className="text-sm whitespace-nowrap">Exit to Surface</span>
          )}
        </Link>
      </div>
    </nav>
  );
};

export default NavSidebar;
