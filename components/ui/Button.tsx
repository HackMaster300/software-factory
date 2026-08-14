'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30 disabled:bg-blue-600/40',
  secondary:
    'bg-[#1c2029] hover:bg-[#242a36] text-gray-200 border border-[#2e3340] disabled:text-gray-500',
  ghost: 'text-gray-400 hover:text-gray-200 hover:bg-[#1c2029] disabled:text-gray-600',
  danger: 'bg-red-600/90 hover:bg-red-500 text-white disabled:bg-red-600/40',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-md',
  md: 'px-3.5 py-2 text-sm gap-2 rounded-md',
  icon: 'p-1.5 rounded-md',
};

/**
 * Shared button primitive. Purely presentational — callers keep full control
 * of onClick/disabled/aria-* and any other native button prop, this just
 * centralizes the Tailwind class strings that were previously duplicated
 * ad-hoc across every view.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
