import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow ?
        <p className="mb-1.5 text-[13px] font-medium text-accent-hover">{eyebrow}</p> :
        null}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>);

}