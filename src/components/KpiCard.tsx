import React from 'react';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BoxIcon,
  IndianRupeeIcon,
  MinusIcon,
  RepeatIcon,
  TargetIcon,
  TrendingUpIcon,
  TrophyIcon } from
'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { Kpi } from '../types/pricing';

const icons = {
  revenue: IndianRupeeIcon,
  trophy: TrophyIcon,
  growth: TrendingUpIcon,
  reward: TargetIcon,
  products: BoxIcon,
  episodes: RepeatIcon
};

interface KpiCardProps {
  kpi: Kpi;
  featured?: boolean;
}

export function KpiCard({ kpi, featured = false }: KpiCardProps) {
  const Icon = icons[kpi.icon];
  const TrendIcon =
  kpi.trendDirection === 'up' ?
  ArrowUpRightIcon :
  kpi.trendDirection === 'down' ?
  ArrowDownRightIcon :
  MinusIcon;

  return (
    <div
      className={twMerge(
        'group flex h-full flex-col rounded-2xl border bg-white p-5 shadow-card transition-[box-shadow,border-color,transform] duration-200 ease-smooth hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift',
        featured ? 'border-accent/30 bg-accent-soft/40' : 'border-slate-200'
      )}>
      
      <div className="flex items-start justify-between gap-3">
        <span
          className={twMerge(
            'flex items-center justify-center rounded-xl',
            featured ? 'h-10 w-10 bg-accent text-white' : 'h-9 w-9 bg-slate-100 text-slate-500'
          )}>
          
          <Icon className={featured ? 'h-5 w-5' : 'h-[18px] w-[18px]'} aria-hidden="true" />
        </span>
        <span
          className={twMerge(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium',
            kpi.trendDirection === 'up' ?
            'bg-emerald-50 text-emerald-700' :
            kpi.trendDirection === 'down' ?
            'bg-red-50 text-red-700' :
            'bg-slate-100 text-slate-600'
          )}>
          
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {kpi.trend}
        </span>
      </div>

      <p className="mt-4 text-[13px] font-medium text-muted">{kpi.label}</p>
      <p
        className={twMerge(
          'tabular mt-1 font-semibold tracking-[-0.02em] text-ink',
          featured ? 'text-[38px] leading-none' : 'text-[26px] leading-none'
        )}>
        
        {kpi.value}
      </p>
      <p className="mt-auto pt-3 text-[12.5px] leading-relaxed text-muted">{kpi.support}</p>
    </div>);

}