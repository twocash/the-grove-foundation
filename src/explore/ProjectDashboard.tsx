// src/explore/ProjectDashboard.tsx
// Dashboard for a Grove Project (field)
// Sprint: dashboard-sprout-widget-v1

import { GardenWidget } from './GardenWidget';
import { useOptionalWidgetUI } from '../widget/WidgetUIContext';

export function ProjectDashboard() {
  const widgetUI = useOptionalWidgetUI();

  const handleViewGarden = () => {
    if (widgetUI) {
      widgetUI.setMode('garden');
    }
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="material-symbols-outlined text-5xl text-[var(--glass-text-subtle)] mb-3 block">
          forest
        </span>
        <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
          Grove Project
        </h2>
        <p className="text-[var(--glass-text-muted)] max-w-md mx-auto">
          Your personal knowledge field. Explore lenses, journeys, nodes, and more.
        </p>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full mb-8">
        {/* Garden Widget */}
        <GardenWidget onViewGarden={handleViewGarden} />

        {/* Feature Overview - placeholder for more widgets */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-xl text-[var(--glass-text-subtle)]">widgets</span>
            <span className="font-mono text-xs text-[var(--glass-text-muted)] uppercase tracking-wider">
              Quick Access
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              <span className="text-sm">Terminal</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
              <span className="material-symbols-outlined text-lg">eyeglasses</span>
              <span className="text-sm">Lenses</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
              <span className="material-symbols-outlined text-lg">map</span>
              <span className="text-sm">Journeys</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
              <span className="material-symbols-outlined text-lg">account_tree</span>
              <span className="text-sm">Nodes</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
              <span className="material-symbols-outlined text-lg">menu_book</span>
              <span className="text-sm">Diary</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
              <span className="material-symbols-outlined text-lg">eco</span>
              <span className="text-sm">Sprouts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center">
        <div className="inline-block px-4 py-2 border border-[var(--glass-border)] rounded text-[var(--glass-text-subtle)] text-sm">
          More widgets coming in Grove 1.0
        </div>
      </div>
    </div>
  );
}
