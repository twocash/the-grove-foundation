// src/surface/components/KineticStream/Stream/blocks/NavigationObject.tsx
// Fork button display
// Sprint: kinetic-experience-v1

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { JourneyFork, JourneyForkType } from '@core/schema/stream';
import { staggerContainer, staggerItem } from '../motion/variants';

export interface NavigationObjectProps {
  forks: JourneyFork[];
  onSelect?: (fork: JourneyFork) => void;
}

const FORK_ICONS: Record<JourneyForkType, string> = {
  deep_dive: '↓',
  pivot: '→',
  apply: '✓',
  challenge: '?'
};

const FORK_STYLES: Record<JourneyForkType, string> = {
  deep_dive: 'kinetic-fork--primary',
  pivot: 'kinetic-fork--secondary',
  apply: 'kinetic-fork--tertiary',
  challenge: 'kinetic-fork--quaternary'
};

export const NavigationObject: React.FC<NavigationObjectProps> = ({
  forks,
  onSelect
}) => {
  const grouped = useMemo(() => ({
    deep_dive: forks.filter(f => f.type === 'deep_dive'),
    pivot: forks.filter(f => f.type === 'pivot'),
    apply: forks.filter(f => f.type === 'apply'),
    challenge: forks.filter(f => f.type === 'challenge')
  }), [forks]);

  if (forks.length === 0) return null;

  return (
    <motion.div
      className="pt-4 border-t border-[var(--glass-border)] space-y-3 font-sans text-[13px]"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      data-testid="navigation-object"
    >
      {grouped.deep_dive.length > 0 && (
        <ForkGroup forks={grouped.deep_dive} onSelect={onSelect} />
      )}
      {grouped.pivot.length > 0 && (
        <ForkGroup forks={grouped.pivot} onSelect={onSelect} />
      )}
      {grouped.apply.length > 0 && (
        <ForkGroup forks={grouped.apply} onSelect={onSelect} />
      )}
      {grouped.challenge.length > 0 && (
        <ForkGroup forks={grouped.challenge} onSelect={onSelect} />
      )}
    </motion.div>
  );
};

const ForkGroup: React.FC<{
  forks: JourneyFork[];
  onSelect?: (fork: JourneyFork) => void;
}> = ({ forks, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {forks.map(fork => (
      <motion.button
        key={fork.id}
        variants={staggerItem}
        onClick={() => onSelect?.(fork)}
        className={`kinetic-fork ${FORK_STYLES[fork.type]}`}
        data-testid="fork-button"
      >
        <span>{FORK_ICONS[fork.type]}</span>
        <span>{fork.label}</span>
      </motion.button>
    ))}
  </div>
);

export default NavigationObject;
