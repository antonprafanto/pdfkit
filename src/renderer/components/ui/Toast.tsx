/**
 * Toast Component & Provider
 * Enhanced toast notification system with provider and hook
 */

import React, { ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (message: string, options?: { description?: string; variant?: ToastVariant; duration?: number }) => void;
  removeToast: (id: string) => void;
  // Convenience methods
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((
    message: string,
    options?: { description?: string; variant?: ToastVariant; duration?: number }
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = {
      id,
      message,
      description: options?.description,
      variant: options?.variant || 'info',
      duration: options?.duration ?? 3000,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, description?: string) => {
    addToast(message, { variant: 'success', description });
  }, [addToast]);

  const error = useCallback((message: string, description?: string) => {
    addToast(message, { variant: 'error', description, duration: 5000 });
  }, [addToast]);

  const warning = useCallback((message: string, description?: string) => {
    addToast(message, { variant: 'warning', description, duration: 4000 });
  }, [addToast]);

  const info = useCallback((message: string, description?: string) => {
    addToast(message, { variant: 'info', description });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer position="bottom-right">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            description={toast.description}
            variant={toast.variant}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op implementation if outside provider (for safety)
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
};

// Individual Toast Props
interface ToastProps {
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  icon?: ReactNode;
}

export function Toast({
  message,
  description,
  variant = 'info',
  duration = 3000,
  onClose,
  icon,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const variantStyles = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
    info: 'bg-blue-500 text-white border-blue-600',
  };

  const defaultIcons = {
    success: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={`
        flex items-start gap-3 min-w-[280px] max-w-[380px]
        px-4 py-3 rounded-lg shadow-lg border
        ${variantStyles[variant]}
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
      style={{
        animation: isExiting ? undefined : 'toastSlideIn 0.3s ease-out',
      }}
    >
      <div className="flex-shrink-0">{icon || defaultIcons[variant]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{message}</p>
        {description && <p className="mt-0.5 text-sm opacity-90">{description}</p>}
      </div>
      {onClose && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Toast Container Component  
interface ToastContainerProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export function ToastContainer({ children, position = 'bottom-right' }: ToastContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-20 right-4', // Above floating buttons
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <div className={`fixed z-[99999] flex flex-col gap-2 pointer-events-auto ${positionStyles[position]}`}>
        {children}
      </div>
    </>
  );
}
