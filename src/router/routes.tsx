// src/router/routes.tsx
// Route configuration for Surface and Foundation experiences

import React, { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';

// Lazy load Foundation to enable code splitting
const FoundationLayout = lazy(() => import('../foundation/layout/FoundationLayout'));

// Lazy load all consoles for code splitting
const NarrativeArchitect = lazy(() => import('../foundation/consoles/NarrativeArchitect'));
const EngagementBridge = lazy(() => import('../foundation/consoles/EngagementBridge'));
const KnowledgeVault = lazy(() => import('../foundation/consoles/KnowledgeVault'));
const RealityTuner = lazy(() => import('../foundation/consoles/RealityTuner'));
const AudioStudio = lazy(() => import('../foundation/consoles/AudioStudio'));
const Genesis = lazy(() => import('../foundation/consoles/Genesis'));

// Loading fallback for lazy-loaded routes
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-obsidian text-white flex items-center justify-center font-mono">
    <div className="text-holo-cyan animate-pulse">Loading Foundation...</div>
  </div>
);

// Console loading fallback (smaller, for nested routes)
const ConsoleLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-holo-cyan animate-pulse font-mono">Loading console...</div>
  </div>
);

// Surface Router handles Classic/Genesis experience switching
import SurfaceRouter from '../surface/pages/SurfaceRouter';

export const routes: RouteObject[] = [
  // Surface (main experience - routes between Classic and Genesis)
  {
    path: '/',
    element: <SurfaceRouter />,
  },

  // Foundation (admin/control plane)
  {
    path: '/foundation',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <FoundationLayout />
      </Suspense>
    ),
    children: [
      // Default route - will show dashboard in layout
      {
        index: true,
        element: null, // Layout handles this with DashboardPlaceholder
      },
      // Console routes
      {
        path: 'narrative',
        element: (
          <Suspense fallback={<ConsoleLoadingFallback />}>
            <NarrativeArchitect />
          </Suspense>
        ),
      },
      {
        path: 'engagement',
        element: (
          <Suspense fallback={<ConsoleLoadingFallback />}>
            <EngagementBridge />
          </Suspense>
        ),
      },
      {
        path: 'knowledge',
        element: (
          <Suspense fallback={<ConsoleLoadingFallback />}>
            <KnowledgeVault />
          </Suspense>
        ),
      },
      {
        path: 'tuner',
        element: (
          <Suspense fallback={<ConsoleLoadingFallback />}>
            <RealityTuner />
          </Suspense>
        ),
      },
      {
        path: 'audio',
        element: (
          <Suspense fallback={<ConsoleLoadingFallback />}>
            <AudioStudio />
          </Suspense>
        ),
      },
      {
        path: 'genesis',
        element: (
          <Suspense fallback={<ConsoleLoadingFallback />}>
            <Genesis />
          </Suspense>
        ),
      },
    ],
  },

  // Catch-all redirect to home
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
