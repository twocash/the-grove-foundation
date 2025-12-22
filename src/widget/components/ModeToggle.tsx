// src/widget/components/ModeToggle.tsx
// Footer mode switcher with utility buttons

import { useWidgetUI } from '../WidgetUIContext';
import { MODE_CONFIGS, type WidgetMode } from '@core/schema/widget';

export function ModeToggle() {
  const { currentMode, setMode } = useWidgetUI();

  const handleModeClick = (mode: WidgetMode, disabled?: boolean) => {
    if (!disabled) {
      setMode(mode);
    }
  };

  return (
    <footer className="widget-footer flex items-center justify-between px-4 py-2 border-t border-[var(--grove-border)]">
      <nav className="mode-toggle flex items-center gap-6">
        {MODE_CONFIGS.map((config) => (
          <button
            key={config.id}
            onClick={() => handleModeClick(config.id, config.disabled)}
            disabled={config.disabled}
            className={`
              mode-button flex items-center gap-2 text-sm transition-colors duration-200
              ${currentMode === config.id
                ? 'text-[var(--grove-accent)]'
                : 'text-[var(--grove-text-muted)] hover:text-[var(--grove-text)]'
              }
              ${config.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="mode-indicator">
              {currentMode === config.id ? '●' : '○'}
            </span>
            <span>{config.label}</span>
            {config.hint && (
              <span className="text-xs text-[var(--grove-text-dim)]">({config.hint})</span>
            )}
          </button>
        ))}
      </nav>
      <div className="widget-utils flex items-center gap-2">
        <button
          className="util-button p-2 text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] transition-colors"
          title="Settings"
        >
          ⚙
        </button>
        <button
          className="util-button p-2 text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] transition-colors"
          title="Help"
        >
          ?
        </button>
        <button
          className="util-button p-2 text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] transition-colors"
          title="More options"
        >
          ···
        </button>
      </div>
    </footer>
  );
}
