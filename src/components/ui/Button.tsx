import React from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
  'bg-accent text-white hover:bg-accent-hover shadow-card focus-visible:outline-accent-hover',
  secondary:
  'bg-white text-ink border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-accent',
  ghost: 'text-muted hover:bg-slate-100 hover:text-ink focus-visible:outline-accent'
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background-color,border-color,color,transform] duration-150 ease-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-60',
        size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2.5 text-sm',
        variants[variant],
        className
      )}
      {...rest}>
      
      {children}
    </button>);

}