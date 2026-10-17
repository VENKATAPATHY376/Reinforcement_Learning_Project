import React, { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartSkeleton, useDataReady } from '../ui/ChartSkeleton';
import { STRATEGY_COLORS } from '../../data/metrics';
import type { StrategyName, TrendPoint } from '../../types/pricing';

export const ALL_STRATEGIES: StrategyName[] = [
  'Fixed-price baseline',
  'Rule-based',
  'DQN',
  'QR-DQN',
  'PPO',
];

interface RevenueTrendChartProps {
  data: TrendPoint[];
  series?: StrategyName[];
  height?: number;
  yLabel?: string;
  formatter?: (value: number) => string;
}

export function RevenueTrendChart({
  data,
  series = ALL_STRATEGIES,
  height = 280,
  yLabel = 'Revenue (₹ millions)',
  formatter
}: RevenueTrendChartProps) {
  const ready = useDataReady();
  const [visible, setVisible] = useState<StrategyName[]>(series);

  const toggle = (name: StrategyName) => {
    setVisible((prev) =>
    prev.includes(name) ?
    prev.length === 1 ?
    prev :
    prev.filter((n) => n !== name) :
    [...prev, name]
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter strategies">
        {series.map((name) => {
          const on = visible.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              aria-pressed={on}
              className={[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-colors duration-150 ease-smooth',
              on ?
              'border-slate-300 bg-white text-ink' :
              'border-slate-200 bg-slate-50 text-slate-400'].
              join(' ')}>
              
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? STRATEGY_COLORS[name] : '#CBD5E1' }}
                aria-hidden="true" />
              
              {name}
            </button>);

        })}
      </div>

      {!ready ?
      <ChartSkeleton height={height} bars={16} /> :

      <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis
              dataKey="episode"
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              label={{
                value: 'Episode',
                position: 'insideBottom',
                offset: -2,
                style: { fill: '#9CA3AF', fontSize: 11 }
              }} />
            
              <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(v: number) => `${v}M`}
              label={{
                value: yLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                style: { fill: '#9CA3AF', fontSize: 11 }
              }} />
            
              <Tooltip
              cursor={{ stroke: '#C7D2FE', strokeWidth: 1 }}
              content={<ChartTooltip labelPrefix="Episode " formatter={formatter} />} />
            
              {series.
            filter((name) => visible.includes(name)).
            map((name) =>
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              name={name}
              stroke={STRATEGY_COLORS[name]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }} />

            )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
    </div>);

}
