// src/foundation/components/GlowButton.tsx
// Foundation-styled button with unified design tokens

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlowButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon | string; // LucideIcon or Material Symbols name
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary/10 border-primary text-primary
    hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(77,124,15,0.3)]
    dark:bg-primary/20 dark:hover:bg-primary/30
  `,
  secondary: `
    bg-slate-100 dark:bg-slate-800 border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300
    hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600
  `,
  danger: `
    bg-red-500/10 border-red-500 text-red-500
    hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]
  `,
  ghost: `
    bg-transparent border-transparent text-slate-500 dark:text-slate-400
    hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const GlowButton: React.FC<GlowButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const renderIcon = (position: 'left' | 'right') => {
    if (loading && position === 'left') {
      return <Loader2 size={16} className="animate-spin" />;
    }

    if (!icon || iconPosition !== position) return null;

    // String = Material Symbols icon name
    if (typeof icon === 'string') {
      return (
        <span className="material-symbols-outlined text-base">
          {icon}
        </span>
      );
    }

    // LucideIcon component
    const Icon = icon;
    return <Icon size={16} />;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium
        border rounded-lg
        transition-all duration-150 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {renderIcon('left')}
      {children}
      {!loading && renderIcon('right')}
    </button>
  );
};

export default GlowButton;
