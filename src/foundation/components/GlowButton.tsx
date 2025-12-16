// src/foundation/components/GlowButton.tsx
// Foundation-styled button with glow effects

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlowButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-holo-cyan/10 border-holo-cyan text-holo-cyan
    hover:bg-holo-cyan/20 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]
  `,
  secondary: `
    bg-transparent border-holo-cyan/30 text-gray-400
    hover:border-holo-cyan/50 hover:text-holo-cyan
  `,
  danger: `
    bg-holo-red/10 border-holo-red text-holo-red
    hover:bg-holo-red/20 hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]
  `,
  ghost: `
    bg-transparent border-transparent text-gray-400
    hover:text-white hover:bg-white/5
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
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-mono uppercase tracking-wider
        border rounded
        transition-all duration-150 ease-out
        focus:outline-none focus:ring-2 focus:ring-holo-cyan focus:ring-offset-2 focus:ring-offset-obsidian
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={16} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={16} />}
    </button>
  );
};

export default GlowButton;
