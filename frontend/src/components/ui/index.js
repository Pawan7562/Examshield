// src/components/ui/index.js — Reusable Nexify Examina UI Library
import React from 'react';
import './ui-components.css';

/**
 * Button Component
 * @param {'primary' | 'secondary' | 'ghost' | 'danger'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} loading
 * @param {boolean} iconOnly
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconOnly = false,
  className = '',
  ...props
}) => {
  const base = `es-btn es-btn-${variant} es-btn-${size} ${iconOnly ? 'es-btn-icon' : ''} ${className}`;
  return (
    <button className={base} disabled={disabled || loading} {...props}>
      {loading ? (
        <span style={{
          width: '14px',
          height: '14px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.6s linear infinite'
        }} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}
      {!iconOnly && children}
    </button>
  );
};

/**
 * Input Component with prefix, suffix, and validation message
 */
export const Input = ({
  label,
  error,
  helperText,
  prefix: Prefix,
  suffix: Suffix,
  isMono = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`es-input-group ${className}`}>
      {label && <label className="es-input-label">{label}</label>}
      <div className="es-input-box">
        {Prefix && <span className="es-input-prefix"><Prefix size={16} /></span>}
        <input
          className={`es-input-field ${Prefix ? 'has-prefix' : ''} ${Suffix ? 'has-suffix' : ''} ${isMono ? 'is-mono' : ''} ${error ? 'is-error' : ''}`}
          {...props}
        />
        {Suffix && <span className="es-input-suffix"><Suffix size={16} /></span>}
      </div>
      {error && <span className="es-input-msg is-error">{error}</span>}
      {!error && helperText && <span className="es-input-msg is-helper">{helperText}</span>}
    </div>
  );
};

/**
 * Badge & Chip Component
 * @param {'neutral' | 'primary' | 'success' | 'warning' | 'danger'} variant
 */
export const Badge = ({
  children,
  variant = 'neutral',
  pill = false,
  icon: Icon,
  className = ''
}) => {
  return (
    <span className={`es-badge es-badge-${variant} ${pill ? 'is-pill' : ''} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

/**
 * Status Dot Component
 * @param {'ready' | 'idle' | 'error' | 'warning'} status
 */
export const StatusDot = ({
  status = 'ready',
  pulse = false,
  label,
  className = ''
}) => {
  return (
    <div className={`es-status-dot-wrap ${className}`}>
      <span className={`es-status-dot ${status} ${pulse ? 'pulse' : ''}`} />
      {label && <span>{label}</span>}
    </div>
  );
};

/**
 * Card Component
 */
export const Card = ({
  children,
  interactive = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`es-card ${interactive ? 'es-card-interactive' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, description, children, className = '' }) => (
  <div className={`es-card-header ${className}`}>
    {title && <h3 className="es-card-title">{title}</h3>}
    {description && <p className="es-card-desc">{description}</p>}
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`es-card-footer ${className}`}>{children}</div>
);

/**
 * StatCard Component
 */
export const StatCard = ({
  label,
  value,
  helper,
  icon: Icon,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`es-stat-card ${onClick ? 'es-card-interactive' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="es-stat-top">
        <span className="es-stat-label">{label}</span>
        {Icon && (
          <div className="es-stat-icon">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="es-stat-val">{value}</div>
      {helper && <div className="es-stat-helper">{helper}</div>}
    </div>
  );
};

/**
 * EmptyState Component
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`es-empty-state ${className}`}>
      {Icon && (
        <div className="es-empty-icon">
          <Icon size={24} />
        </div>
      )}
      {title && <h3 className="es-empty-title">{title}</h3>}
      {description && <p className="es-empty-desc">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * ProgressBar Component
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  className = ''
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`es-progress-track ${className}`}>
      <div 
        className={`es-progress-fill ${variant !== 'primary' ? variant : ''}`} 
        style={{ width: `${pct}%` }} 
      />
    </div>
  );
};

/**
 * Avatar Component
 */
export const Avatar = ({
  name = 'User',
  src,
  size = 40,
  verified = false,
  className = ''
}) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  return (
    <div 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--es-primary-600), var(--es-primary-800))',
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: `${size * 0.4}px`,
        position: 'relative',
        flexShrink: 0
      }} 
      className={className}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
        />
      ) : initial}
      {verified && (
        <span style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '12px',
          height: '12px',
          background: '#10b981',
          border: '2px solid #ffffff',
          borderRadius: '50%'
        }} />
      )}
    </div>
  );
};

/**
 * Skeleton Loader Component
 */
export const Skeleton = ({
  width = '100%',
  height = '16px',
  circle = false,
  className = ''
}) => {
  return (
    <div 
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '6px',
        background: 'linear-gradient(90deg, var(--es-slate-200) 25%, var(--es-slate-100) 50%, var(--es-slate-200) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }} 
      className={className} 
    />
  );
};
