// src/bedrock/components/DebugDensityToggle.tsx
// Debug tool for testing density tiers at runtime
// Sprint: S3-SKIN-StranglerMigration

import React from 'react';
import { useSkin } from '../context/BedrockUIContext';
import type { GroveSkin } from '../types/GroveSkin';
import type { DensityToken } from '../../theme/mappings/quantum-glass.map';

// =============================================================================
// Types
// =============================================================================

interface DebugDensityToggleProps {
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether to show in production (default: dev only) */
  showInProduction?: boolean;
}

// =============================================================================
// Component
// =============================================================================

const densityOptions: DensityToken[] = ['compact', 'comfortable', 'spacious'];

const densityLabels: Record<DensityToken, { label: string; icon: string }> = {
  compact: { label: 'Compact', icon: 'density_small' },
  comfortable: { label: 'Comfort', icon: 'density_medium' },
  spacious: { label: 'Spacious', icon: 'density_large' },
};

const positionClasses: Record<NonNullable<DebugDensityToggleProps['position']>, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

/**
 * Debug tool for testing density tiers at runtime.
 * Only visible in development mode unless showInProduction is true.
 *
 * Usage:
 * ```tsx
 * <DebugDensityToggle position="bottom-right" />
 * ```
 */
export function DebugDensityToggle({
  position = 'bottom-right',
  showInProduction = false,
}: DebugDensityToggleProps) {
  const { skin, setSkin } = useSkin();

  // Only show in development unless explicitly enabled
  if (!showInProduction && process.env.NODE_ENV === 'production') {
    return null;
  }

  const currentDensity = (skin.layout?.density as DensityToken) || 'comfortable';

  const handleDensityChange = (density: DensityToken) => {
    const updatedSkin: GroveSkin = {
      ...skin,
      layout: {
        ...skin.layout,
        density,
      },
    };
    setSkin(updatedSkin);
  };

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50
        bg-[var(--glass-solid)] backdrop-blur-md
        border border-white/10 rounded-lg
        p-2 shadow-lg
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="material-symbols-outlined text-sm text-[var(--neon-cyan)]">
          tune
        </span>
        <span className="text-[10px] font-medium text-[var(--glass-text-secondary)] uppercase tracking-wider">
          Density Debug
        </span>
      </div>

      {/* Density buttons */}
      <div className="flex gap-1">
        {densityOptions.map((density) => {
          const { label, icon } = densityLabels[density];
          const isActive = currentDensity === density;

          return (
            <button
              key={density}
              onClick={() => handleDensityChange(density)}
              className={`
                flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md
                transition-all duration-150
                ${isActive
                  ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30'
                  : 'bg-white/5 text-[var(--glass-text-secondary)] border border-transparent hover:bg-white/10'
                }
              `}
              title={`Set density to ${label}`}
            >
              <span className="material-symbols-outlined text-base">
                {icon}
              </span>
              <span className="text-[9px] font-medium">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current skin info */}
      <div className="mt-2 pt-2 border-t border-white/5 px-1">
        <div className="text-[9px] text-[var(--glass-text-secondary)]/60">
          Skin: <span className="text-[var(--glass-text-secondary)]">{skin.name}</span>
        </div>
      </div>
    </div>
  );
}

export default DebugDensityToggle;
