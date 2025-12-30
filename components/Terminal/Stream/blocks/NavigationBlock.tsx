// components/Terminal/Stream/blocks/NavigationBlock.tsx
// Journey navigation fork block with visual hierarchy
// Sprint: kinetic-stream-reset-v2

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { JourneyFork, JourneyForkType } from '../../../../src/core/schema/stream';
import { staggerContainer, staggerItem } from '../motion/variants';

export interface NavigationBlockProps {
  forks: JourneyFork[];
  onSelect?: (fork: JourneyFork) => void;
}

export const NavigationBlock: React.FC<NavigationBlockProps> = ({
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
      className="mt-6 pt-4 border-t border-[var(--glass-border)] space-y-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      data-testid="navigation-block"
    >
      {grouped.deep_dive.length > 0 && (
        <ForkGroup forks={grouped.deep_dive} variant="primary" onSelect={onSelect} />
      )}
      {grouped.pivot.length > 0 && (
        <ForkGroup forks={grouped.pivot} variant="secondary" onSelect={onSelect} />
      )}
      {grouped.apply.length > 0 && (
        <ForkGroup forks={grouped.apply} variant="tertiary" onSelect={onSelect} />
      )}
      {grouped.challenge.length > 0 && (
        <ForkGroup forks={grouped.challenge} variant="quaternary" onSelect={onSelect} />
      )}
    </motion.div>
  );
};

const ForkGroup: React.FC<{
  forks: JourneyFork[];
  variant: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  onSelect?: (fork: JourneyFork) => void;
}> = ({ forks, variant, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {forks.map(fork => (
      <motion.div key={fork.id} variants={staggerItem}>
        <ForkButton fork={fork} variant={variant} onClick={() => onSelect?.(fork)} />
      </motion.div>
    ))}
  </div>
);

const FORK_ICONS: Record<JourneyForkType, string> = {
  deep_dive: '↓',
  pivot: '→',
  apply: '✓',
  challenge: '?'
};

const ForkButton: React.FC<{
  fork: JourneyFork;
  variant: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  onClick: () => void;
}> = ({ fork, variant, onClick }) => (
  <button
    onClick={onClick}
    className={`
      fork-button fork-button--${variant}
      px-4 py-2 rounded-full text-sm font-medium
      transition-all duration-200
      hover:scale-105 active:scale-95
    `}
    data-testid="fork-button"
  >
    <span className="mr-2">{FORK_ICONS[fork.type]}</span>
    {fork.label}
  </button>
);

export default NavigationBlock;
