import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function Card({ children, className, as = 'div' }: CardProps) {
  const Tag = as;
  return (
    <Tag
      className={twMerge(
        'rounded-2xl border border-slate-200 bg-white shadow-card',
        className
      )}>
      
      {children}
    </Tag>);

}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  headingLevel?: 'h2' | 'h3';
}

export function CardHeader({
  title,
  description,
  action,
  className,
  headingLevel = 'h3'
}: CardHeaderProps) {
  const Heading = headingLevel;
  return (
    <div
      className={twMerge(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4',
        className
      )}>
      
      <div className="min-w-0">
        <Heading className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</Heading>
        {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>);

}