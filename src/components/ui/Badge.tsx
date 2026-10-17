import React from 'react';
import { twMerge } from 'tailwind-merge';

type Tone = 'success' | 'warning' | 'danger' | 'accent' | 'neutral';

const tones: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  accent: 'bg-accent-soft text-accent-hover ring-indigo-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20'
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, tone = 'neutral', className, dot = false }: BadgeProps) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset',
        tones[tone],
        className
      )}>
      
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>);

}