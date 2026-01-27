// src/explore/context/ToastContext.tsx
// Toast notification system for /explore
// Sprint: sprout-research-v1, Phase 4d
//
// Simple toast notifications for feedback on actions:
// - Sprout created successfully
// - Action failed
// - Status changes
// - General info messages

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// =============================================================================
// Types
// =============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// =============================================================================
// Context
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface ToastProviderProps {
  children: ReactNode;
  /** Maximum number of toasts to show at once */
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: Toast = { ...toast, id };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit number of visible toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-dismiss after duration
    const duration = toast.duration ?? getDefaultDuration(toast.type);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, clearToasts } = context;

  // Convenience methods
  const success = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'success', message, ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'error', message, ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'info', message, ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'warning', message, ...options });
  }, [addToast]);

  return {
    success,
    error,
    info,
    warning,
    addToast,
    removeToast,
    clearToasts,
  };
}

// =============================================================================
// Toast Container
// =============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

// =============================================================================
// Toast Item
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = getToastConfig(toast.type);

  return (
    <div
      className="pointer-events-auto max-w-sm w-full p-4 rounded-lg shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-200"
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span
          className="material-symbols-outlined text-lg shrink-0"
          style={{ color: config.color }}
        >
          {config.iconName}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: config.color }}>
            {toast.message}
          </p>
          {toast.description && (
            <p className="text-xs mt-1" style={{ color: config.color, opacity: 0.8 }}>
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="text-xs mt-2 font-medium hover:underline"
              style={{ color: config.color }}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: config.color }}
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getDefaultDuration(type: ToastType): number {
  switch (type) {
    case 'success':
      return 4000;
    case 'error':
      return 6000;
    case 'warning':
      return 5000;
    case 'info':
      return 4000;
    default:
      return 4000;
  }
}

interface ToastConfig {
  /** Background color (CSS variable value) */
  bg: string;
  /** Border color (CSS variable value) */
  border: string;
  /** Text/icon color (CSS variable value) */
  color: string;
  /** Material Symbols icon name */
  iconName: string;
}

function getToastConfig(type: ToastType): ToastConfig {
  switch (type) {
    case 'success':
      return {
        bg: 'var(--semantic-success-bg)',
        border: 'var(--semantic-success-border)',
        color: 'var(--semantic-success)',
        iconName: 'check_circle',
      };
    case 'error':
      return {
        bg: 'var(--semantic-error-bg)',
        border: 'var(--semantic-error-border)',
        color: 'var(--semantic-error)',
        iconName: 'error',
      };
    case 'warning':
      return {
        bg: 'var(--semantic-warning-bg)',
        border: 'var(--semantic-warning-border)',
        color: 'var(--semantic-warning)',
        iconName: 'warning',
      };
    case 'info':
    default:
      return {
        bg: 'var(--semantic-info-bg)',
        border: 'var(--semantic-info-border)',
        color: 'var(--semantic-info)',
        iconName: 'info',
      };
  }
}

// =============================================================================
// Exports
// =============================================================================

export type { ToastContextValue };
