// src/router/routes.tsx
// Route configuration for Surface, Widget, and Foundation experiences

import React, { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';

// Lazy load Foundation workspace (new three-column layout)
const FoundationWorkspace = lazy(() => import('../foundation/FoundationWorkspace'));

// Lazy load Bedrock workspace (knowledge curation layer)
const BedrockWorkspace = lazy(() => import('../bedrock/BedrockWorkspace'));

// Dev components for testing
const StreamDemo = lazy(() => import('../../components/Terminal/StreamDemo'));

// Kinetic Stream exploration surface
const ExplorePage = lazy(() => import('../surface/pages/ExplorePage'));

// Lazy load Grove Workspace for code splitting
const GroveWorkspace = lazy(() => import('../workspace/GroveWorkspace').then(m => ({ default: m.GroveWorkspace })));

// Lazy load all consoles for code splitting
const NarrativeArchitect = lazy(() => import('../foundation/consoles/NarrativeArchitect'));
const EngagementBridge = lazy(() => import('../foundation/consoles/EngagementBridge'));
const KnowledgeVault = lazy(() => import('../foundation/consoles/KnowledgeVault'));
const RealityTuner = lazy(() => import('../foundation/consoles/RealityTuner'));
const AudioStudio = lazy(() => import('../foundation/consoles/AudioStudio'));
const Genesis = lazy(() => import('../foundation/consoles/Genesis'));
const HealthDashboard = lazy(() => import('../foundation/consoles/HealthDashboard'));
const SproutQueue = lazy(() => import('../foundation/consoles/SproutQueue'));

// Bedrock consoles (knowledge curation layer)
const BedrockDashboard = lazy(() => import('../bedrock/consoles/BedrockDashboard'));
const PipelineMonitor = lazy(() => import('../bedrock/consoles/PipelineMonitor/PipelineMonitor'));
const GardenConsole = lazy(() => import('../bedrock/consoles/GardenConsole'));
const LensWorkshop = lazy(() => import('../bedrock/consoles/LensWorkshop'));

// Loading fallback for lazy-loaded routes
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-slate-500 animate-pulse">Loading Foundation...</span>
    </div>
  </div>
);

// Console loading fallback (smaller, for nested routes)
const ConsoleLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-3">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-xs text-slate-500 animate-pulse">Loading console...</span>
    </div>
  </div>
);

// Workspace loading fallback
const WorkspaceLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#0a0f14] text-white flex items-center justify-center">
    <div className="text-[#00d4aa] animate-pulse">Loading Grove Workspace...</div>
  </div>
);

// Surface Router handles Classic/Genesis experience switching
import SurfaceRouter from '../surface/pages/SurfaceRouter';

// Root layout with theme provider
import { RootLayout } from './RootLayout';

export const routes: RouteObject[] = [
  // Root wrapper with ThemeProvider
  {
    element: <RootLayout />,
    children: [
      // Surface (main experience - routes between Classic and Genesis)
      {
        path: '/',
        element: <SurfaceRouter />,
      },

      // Grove Workspace (three-column Terminal experience)
      {
        path: '/terminal',
        element: (
          <Suspense fallback={<WorkspaceLoadingFallback />}>
            <GroveWorkspace />
          </Suspense>
        ),
      },

      // Kinetic Stream exploration surface
      {
        path: '/explore',
        element: (
          <Suspense fallback={<WorkspaceLoadingFallback />}>
            <ExplorePage />
          </Suspense>
        ),
      },

      // Foundation (admin/control plane with three-column layout)
      {
        path: '/foundation',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <FoundationWorkspace />
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
          {
            path: 'health',
            element: (
              <Suspense fallback={<ConsoleLoadingFallback />}>
                <HealthDashboard />
              </Suspense>
            ),
          },
          {
            path: 'sprouts',
            element: (
              <Suspense fallback={<ConsoleLoadingFallback />}>
                <SproutQueue />
              </Suspense>
            ),
          },
        ],
      },

      // Bedrock (knowledge curation layer)
      {
        path: '/bedrock',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BedrockWorkspace />
          </Suspense>
        ),
        children: [
          // Default route - dashboard
          {
            index: true,
            element: (
              <Suspense fallback={<ConsoleLoadingFallback />}>
                <BedrockDashboard />
              </Suspense>
            ),
          },
          // Pipeline Monitor
          {
            path: 'pipeline',
            element: (
              <Suspense fallback={<ConsoleLoadingFallback />}>
                <PipelineMonitor />
              </Suspense>
            ),
          },
          // Knowledge Garden (sprout curation)
          {
            path: 'garden',
            element: (
              <Suspense fallback={<ConsoleLoadingFallback />}>
                <GardenConsole />
              </Suspense>
            ),
          },
          // Lens Workshop
          {
            path: 'lenses',
            element: (
              <Suspense fallback={<ConsoleLoadingFallback />}>
                <LensWorkshop />
              </Suspense>
            ),
          },
        ],
      },

      // Dev routes for testing (remove in production)
      {
        path: '/dev/stream-demo',
        element: (
          <Suspense fallback={<WorkspaceLoadingFallback />}>
            <StreamDemo />
          </Suspense>
        ),
      },

      // Catch-all redirect to home
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
];
