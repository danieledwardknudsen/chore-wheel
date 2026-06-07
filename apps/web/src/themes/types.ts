import type { ChangeEvent, ComponentType, ReactNode } from 'react';
import type { ChoreStatus } from '@chore-wheel/domain';

export type BoxProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export type ButtonProps = {
  variant: 'primary' | 'ghost' | 'danger';
  size: 'sm' | 'md';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

export type InputProps = {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
};

export type LabelProps = {
  htmlFor: string;
  children: ReactNode;
};

export type BadgeProps = {
  status: ChoreStatus | 'active' | 'inactive';
};

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export type SpinnerProps = {
  label?: string;
};

export type ToastProps = {
  message: string;
  type: 'success' | 'error' | 'info';
};

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export type TabsProps = {
  tabs: Array<{ key: string; label: string }>;
  activeKey: string;
  onChange: (key: string) => void;
};

export type UserChipProps = {
  user: { id: string; name: string };
  onClick?: () => void;
};

export type ThemePrimitives = {
  Box: ComponentType<BoxProps>;
  Button: ComponentType<ButtonProps>;
  Input: ComponentType<InputProps>;
  Label: ComponentType<LabelProps>;
  Badge: ComponentType<BadgeProps>;
  Modal: ComponentType<ModalProps>;
  Spinner: ComponentType<SpinnerProps>;
  Toast: ComponentType<ToastProps>;
  Toggle: ComponentType<ToggleProps>;
  Tabs: ComponentType<TabsProps>;
  UserChip: ComponentType<UserChipProps>;
};
