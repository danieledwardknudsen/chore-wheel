'use client';

import { useEffect, useState } from 'react';
import type {
  BadgeProps,
  BoxProps,
  ButtonProps,
  InputProps,
  LabelProps,
  ModalProps,
  SpinnerProps,
  TabsProps,
  ThemePrimitives,
  ToastProps,
  ToggleProps,
  UserChipProps,
} from '../types';

const Box = ({ title, children, className }: BoxProps) => (
  <div
    className={`relative border p-4 ${className ?? ''}`}
    style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius-box)' }}
  >
    {title && (
      <span
        className="absolute -top-3 left-3 px-1 text-xs"
        style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
      >
        ─ {title} ─
      </span>
    )}
    {children}
  </div>
);

const Button = ({
  variant,
  size,
  disabled,
  loading,
  onClick,
  children,
  type = 'button',
}: ButtonProps) => {
  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }
      : variant === 'ghost'
        ? { borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)' }
        : { borderColor: 'var(--color-danger)', color: 'var(--color-danger)' };
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-sm' : 'px-4 py-2 text-base';
  const isDisabled = disabled === true || loading === true;
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`border transition-opacity hover:opacity-70 ${sizeClass}`}
      style={{
        ...variantStyle,
        background: 'transparent',
        fontFamily: 'inherit',
        borderRadius: 'var(--radius-button)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.4 : undefined,
      }}
    >
      {loading === true ? '...' : children}
    </button>
  );
};

const Input = ({ label, name, type, value, onChange, error, placeholder }: InputProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={name} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-3 py-1.5 w-full border outline-none text-sm"
      style={{
        background: 'var(--color-bg)',
        borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
        color: 'var(--color-text)',
        fontFamily: 'inherit',
        borderRadius: 0,
      }}
    />
    {error && (
      <span className="text-xs" style={{ color: 'var(--color-danger)' }}>
        {error}
      </span>
    )}
  </div>
);

const Label = ({ htmlFor, children }: LabelProps) => (
  <label htmlFor={htmlFor} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
    {children}
  </label>
);

const BADGE_CONFIG: Record<string, { text: string; colorVar: string }> = {
  incomplete: { text: '[PENDING]', colorVar: 'var(--color-text-muted)' },
  complete: { text: '[✓ DONE]', colorVar: 'var(--color-accent)' },
  expired: { text: '[EXPIRED]', colorVar: 'var(--color-danger)' },
  canceled: { text: '[CANCELED]', colorVar: 'var(--color-text-muted)' },
  active: { text: '[ACTIVE]', colorVar: 'var(--color-accent)' },
  inactive: { text: '[INACTIVE]', colorVar: 'var(--color-text-muted)' },
};

const Badge = ({ status }: BadgeProps) => {
  const cfg = BADGE_CONFIG[status] ?? {
    text: `[${status.toUpperCase()}]`,
    colorVar: 'var(--color-text-muted)',
  };
  return (
    <span className="text-xs" style={{ color: cfg.colorVar, fontFamily: 'inherit' }}>
      {cfg.text}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg mx-4">
        <Box title={title}>{children}</Box>
      </div>
    </div>
  );
};

const SPINNER_FRAMES = ['|', '/', '─', '\\'] as const;

const Spinner = ({ label }: SpinnerProps) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 120);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ color: 'var(--color-accent)', fontFamily: 'inherit' }}>
      {SPINNER_FRAMES[frame]}
      {label ? ` ${label}` : ''}
    </span>
  );
};

const TOAST_CONFIG: Record<string, { icon: string; colorVar: string }> = {
  success: { icon: '[OK]', colorVar: 'var(--color-accent)' },
  error: { icon: '[!!]', colorVar: 'var(--color-danger)' },
  info: { icon: '[..]', colorVar: 'var(--color-text-muted)' },
};

const Toast = ({ message, type }: ToastProps) => {
  const cfg = TOAST_CONFIG[type] ?? TOAST_CONFIG['info']!;
  return (
    <div
      className="border px-4 py-2 text-sm"
      style={{
        borderColor: cfg.colorVar,
        color: cfg.colorVar,
        background: 'var(--color-bg)',
        fontFamily: 'inherit',
      }}
    >
      {cfg.icon} {message}
    </div>
  );
};

const Toggle = ({ checked, onChange, label }: ToggleProps) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex items-center gap-3 text-sm"
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      padding: 0,
    }}
  >
    <span style={{ color: checked ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
      {checked ? '[ON ]' : '[OFF]'}
    </span>
    <span style={{ color: 'var(--color-text)' }}>{label}</span>
  </button>
);

const Tabs = ({ tabs, activeKey, onChange }: TabsProps) => (
  <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
    {tabs.map((tab) => {
      const isActive = tab.key === activeKey;
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className="px-4 py-2 text-sm transition-colors"
          style={{
            background: 'none',
            border: 'none',
            borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {isActive ? `> ${tab.label}` : `  ${tab.label}`}
        </button>
      );
    })}
  </div>
);

const UserChip = ({ user, onClick }: UserChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className="text-sm px-2 py-0.5 border"
    style={{
      background: 'none',
      borderColor: 'var(--color-border)',
      color: 'var(--color-text)',
      fontFamily: 'inherit',
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: 0,
    }}
  >
    @{user.name}
  </button>
);

export const terminalTheme: ThemePrimitives = {
  Box,
  Button,
  Input,
  Label,
  Badge,
  Modal,
  Spinner,
  Toast,
  Toggle,
  Tabs,
  UserChip,
};
