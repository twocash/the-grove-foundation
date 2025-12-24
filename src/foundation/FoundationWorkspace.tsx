// src/foundation/FoundationWorkspace.tsx
// Main Foundation workspace using three-column layout
// Kinetic Foundation v1: Now includes DEXRegistryProvider

import { Outlet, useLocation } from 'react-router-dom';
import { ThreeColumnLayout } from '../shared/layout';
import { FoundationUIProvider, useFoundationUI } from './FoundationUIContext';
import { FoundationHeader } from './FoundationHeader';
import { FoundationNav } from './FoundationNav';
import { FoundationInspector } from './FoundationInspector';
import { DEXRegistryProvider } from '../core/registry';

// Dashboard placeholder - shown at /foundation root
function DashboardPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl text-primary">eco</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Foundation Console
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Welcome to the Control Plane. Select a console from the navigation to begin.
        </p>
        <div className="grid grid-cols-2 gap-4 text-left">
          <QuickLink icon="route" label="Narrative" desc="Manage personas & cards" />
          <QuickLink icon="trending_up" label="Engagement" desc="Monitor user engagement" />
          <QuickLink icon="database" label="Knowledge" desc="Manage RAG documents" />
          <QuickLink icon="eco" label="Sprouts" desc="Review submissions" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="p-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary/30 transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <div className="text-xs text-slate-500">{desc}</div>
    </div>
  );
}

// Inner component that can use the context
function FoundationWorkspaceInner() {
  const location = useLocation();
  const isRootPath = location.pathname === '/foundation';
  const { inspector } = useFoundationUI();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <FoundationHeader status="healthy" version="2.4.1" />
      <ThreeColumnLayout
        navigation={<FoundationNav />}
        content={
          <div className="h-[calc(100vh-48px)] overflow-y-auto">
            {isRootPath ? <DashboardPlaceholder /> : <Outlet />}
          </div>
        }
        inspector={
          inspector.mode.type !== 'none' ? (
            <FoundationInspector mode={inspector.mode} />
          ) : undefined
        }
        inspectorOpen={inspector.isOpen}
        navWidth={220}
        inspectorWidth={340}
      />
    </div>
  );
}

// Main export wraps with providers (Kinetic Foundation v1: DEXRegistry added)
export default function FoundationWorkspace() {
  return (
    <DEXRegistryProvider>
      <FoundationUIProvider>
        <FoundationWorkspaceInner />
      </FoundationUIProvider>
    </DEXRegistryProvider>
  );
}
