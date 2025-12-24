// src/foundation/layout/FoundationLayout.tsx
// Main layout wrapper for Foundation console

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { HUDHeader } from './HUDHeader';
import { NavSidebar } from './NavSidebar';
import { GridViewport } from './GridViewport';

// Dashboard placeholder - shown at /foundation root
const DashboardPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
    <div className="text-center max-w-md">
      <h1 className="text-3xl text-theme-text-accent mb-4 font-sans font-semibold">
        Foundation Console
      </h1>
      <p className="text-theme-text-muted mb-6">
        Welcome to the Control Plane. Select a console from the sidebar to begin.
      </p>
      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="f-panel p-4 rounded">
          <div className="text-theme-text-accent text-sm font-mono mb-1">Narrative</div>
          <div className="text-theme-text-muted text-xs">Manage personas & cards</div>
        </div>
        <div className="f-panel p-4 rounded">
          <div className="text-theme-text-accent text-sm font-mono mb-1">Engagement</div>
          <div className="text-theme-text-muted text-xs">Monitor user engagement</div>
        </div>
        <div className="f-panel p-4 rounded">
          <div className="text-theme-text-accent text-sm font-mono mb-1">Knowledge</div>
          <div className="text-theme-text-muted text-xs">Manage RAG documents</div>
        </div>
        <div className="f-panel p-4 rounded">
          <div className="text-theme-text-accent text-sm font-mono mb-1">Audio</div>
          <div className="text-theme-text-muted text-xs">Generate TTS audio</div>
        </div>
      </div>
    </div>
  </div>
);

const FoundationLayout: React.FC = () => {
  const location = useLocation();
  const isRootPath = location.pathname === '/foundation';

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-mono">
      {/* HUD Header */}
      <HUDHeader status="healthy" version="2.4.1" />

      <div className="flex">
        {/* Navigation Sidebar */}
        <NavSidebar />

        {/* Main Viewport with Grid */}
        <GridViewport>
          {isRootPath ? <DashboardPlaceholder /> : <Outlet />}
        </GridViewport>
      </div>
    </div>
  );
};

export default FoundationLayout;
