// src/shared/ui/StatusBadge.tsx
// Monospace status indicator for Quantum Glass design system

interface StatusBadgeProps {
  variant: 'active' | 'draft' | 'system';
  label?: string;
}

const variantLabels: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  system: 'System',
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const displayLabel = label || variantLabels[variant];

  return (
    <span className={`status-badge status-badge-${variant}`}>
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
