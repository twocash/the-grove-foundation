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
      className={`
        pointer-events-auto
        max-w-sm w-full p-4 rounded-lg shadow-lg
        border backdrop-blur-sm
        animate-in slide-in-from-right-5 fade-in duration-200
        ${config.bg} ${config.border}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className={`material-symbols-outlined text-lg shrink-0 ${config.icon}`}>
          {config.iconName}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.text}`}>
            {toast.message}
          </p>
          {toast.description && (
            <p className={`text-xs mt-1 ${config.description}`}>
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className={`text-xs mt-2 font-medium hover:underline ${config.action}`}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${config.dismiss}`}
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
  bg: string;
  border: string;
  icon: string;
  iconName: string;
  text: string;
  description: string;
  action: string;
  dismiss: string;
}

function getToastConfig(type: ToastType): ToastConfig {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800/50',
        icon: 'text-green-600 dark:text-green-400',
        iconName: 'check_circle',
        text: 'text-green-800 dark:text-green-200',
        description: 'text-green-700 dark:text-green-300',
        action: 'text-green-700 dark:text-green-400',
        dismiss: 'text-green-500 dark:text-green-500',
      };
    case 'error':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800/50',
        icon: 'text-red-600 dark:text-red-400',
        iconName: 'error',
        text: 'text-red-800 dark:text-red-200',
        description: 'text-red-700 dark:text-red-300',
        action: 'text-red-700 dark:text-red-400',
        dismiss: 'text-red-500 dark:text-red-500',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800/50',
        icon: 'text-amber-600 dark:text-amber-400',
        iconName: 'warning',
        text: 'text-amber-800 dark:text-amber-200',
        description: 'text-amber-700 dark:text-amber-300',
        action: 'text-amber-700 dark:text-amber-400',
        dismiss: 'text-amber-500 dark:text-amber-500',
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800/50',
        icon: 'text-blue-600 dark:text-blue-400',
        iconName: 'info',
        text: 'text-blue-800 dark:text-blue-200',
        description: 'text-blue-700 dark:text-blue-300',
        action: 'text-blue-700 dark:text-blue-400',
        dismiss: 'text-blue-500 dark:text-blue-500',
      };
  }
}

// =============================================================================
// Exports
// =============================================================================

export type { ToastContextValue };
