import { memo, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Accessible UI components with proper ARIA attributes
 * Improves accessibility for screen readers and keyboard navigation
 */

// Accessible Button with loading state
export const Button = memo(forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ariaLabel,
  className = '',
  ...props
}, ref) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn bg-red-500 hover:bg-red-600 text-white',
    ghost: 'btn bg-transparent hover:bg-white/5 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      ref={ref}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}));

Button.displayName = 'Button';

// Accessible Input with label
export const Input = memo(forwardRef(({
  id,
  label,
  error,
  required = false,
  helpText,
  className = '',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="label"
        >
          {label}
          {required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
        aria-required={required}
        {...props}
      />
      {helpText && !error && (
        <p id={helpId} className="mt-1 text-sm text-gray-400">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';

// Accessible Alert component
export const Alert = memo(({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const variants = {
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300'
  };

  const roles = {
    info: 'status',
    success: 'status',
    warning: 'alert',
    error: 'alert'
  };

  return (
    <div
      className={`p-4 rounded-xl border ${variants[variant]} ${className}`}
      role={roles[variant]}
      aria-live={variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fermer l'alerte"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
});

Alert.displayName = 'Alert';

// Accessible Modal
export const Modal = memo(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={`${sizes[size]} w-full bg-surface rounded-2xl border border-white/10 shadow-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

// Skip to main content link (accessibility)
export const SkipLink = memo(() => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
  >
    Aller au contenu principal
  </a>
));

SkipLink.displayName = 'SkipLink';

// Visually hidden text for screen readers
export const VisuallyHidden = memo(({ children }) => (
  <span className="sr-only">{children}</span>
));

VisuallyHidden.displayName = 'VisuallyHidden';

// Loading spinner with accessible text
export const LoadingSpinner = memo(({ size = 'md', text = 'Chargement...' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status">
      <Loader2 className={`${sizes[size]} animate-spin text-primary`} aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default { Button, Input, Alert, Modal, SkipLink, VisuallyHidden, LoadingSpinner };
