import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartSkeleton, useDataReady } from '../ui/ChartSkeleton';
import type { RevenueComparisonPoint } from '../../types/pricing';

interface RevenueComparisonChartProps {
  data: RevenueComparisonPoint[];
  height?: number;
  unit?: string;
}

export function RevenueComparisonChart({
  data,
  height = 280,
  unit = 'Revenue (₹ millions)'
}: RevenueComparisonChartProps) {
  const ready = useDataReady();

  if (!ready) return <ChartSkeleton height={height} bars={3} />;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, bottom: 4, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis
            dataKey="algorithm"
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} />
          
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(v: number) => `${v}M`}
            label={{
              value: unit,
              angle: -90,
              position: 'insideLeft',
              offset: 12,
              style: { fill: '#9CA3AF', fontSize: 11 }
            }} />
          
          <Tooltip
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
            content={<ChartTooltip labelPrefix="" />} />
          
          <Bar dataKey="revenue" name="Avg revenue" radius={[8, 8, 0, 0]} maxBarSize={92}>
            {data.map((entry) =>
            <Cell key={entry.algorithm} fill={entry.color} />
            )}
            <LabelList
              dataKey="revenue"
              position="top"
              offset={10}
              formatter={(v: number) => `${v.toFixed(2)}M`}
              style={{ fill: '#111827', fontSize: 12, fontWeight: 600 }} />
            
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>);

}