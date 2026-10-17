import React from 'react';

interface TooltipPayloadItem {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  labelPrefix?: string;
  formatter?: (value: number) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelPrefix = '',
  formatter = (v) => `₹${v.toFixed(2)}M`
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lift">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {labelPrefix}
        {label}
      </p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((item) =>
        <li key={String(item.dataKey)} className="flex items-center gap-2 text-[13px]">
            <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true" />
          
            <span className="text-muted">{item.name}</span>
            <span className="tabular ml-auto font-semibold text-ink">
              {formatter(Number(item.value ?? 0))}
            </span>
          </li>
        )}
      </ul>
    </div>);

}