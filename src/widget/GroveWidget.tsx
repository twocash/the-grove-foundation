// src/widget/GroveWidget.tsx
// Main Grove Widget container component

import type { WidgetMode } from '@core/schema/widget';
import { WidgetUIProvider, useWidgetUI } from './WidgetUIContext';
import { WidgetHeader, WidgetInput, ModeToggle, CommandPalette } from './components';
import { ExploreView, GardenView, ChatPlaceholder } from './views';

interface GroveWidgetProps {
  initialMode?: WidgetMode;
}

/**
 * Main content area that switches based on current mode
 */
function WidgetContent() {
  const { currentMode } = useWidgetUI();

  return (
    <main className="widget-content flex-1 overflow-y-auto">
      {currentMode === 'explore' && <ExploreView />}
      {currentMode === 'garden' && <GardenView />}
      {currentMode === 'chat' && <ChatPlaceholder />}
    </main>
  );
}

/**
 * Widget footer with conditional input
 * Hides WidgetInput in Explore mode since Terminal has its own input
 */
function WidgetFooter() {
  const { currentMode } = useWidgetUI();

  return (
    <>
      {/* Only show widget input in Garden/Chat modes - Explore has Terminal's own input */}
      {currentMode !== 'explore' && <WidgetInput />}
      <ModeToggle />
    </>
  );
}

/**
 * Grove Widget - Unified interface for Explore, Garden, and Chat modes
 *
 * Usage:
 * ```tsx
 * <GroveWidget />
 * <GroveWidget initialMode="garden" />
 * ```
 */
export function GroveWidget({ initialMode = 'explore' }: GroveWidgetProps) {
  return (
    <WidgetUIProvider initialMode={initialMode}>
      <div className="grove-widget flex flex-col h-screen bg-[var(--grove-bg)] text-[var(--grove-text)]">
        <WidgetHeader />
        <WidgetContent />
        <WidgetFooter />
        <CommandPalette />
      </div>
    </WidgetUIProvider>
  );
}
