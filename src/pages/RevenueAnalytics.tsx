import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { RevenueComparisonChart } from '../components/charts/RevenueComparisonChart';
import { RevenueTrendChart, ALL_STRATEGIES } from '../components/charts/RevenueTrendChart';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { ChartSkeleton, useDataReady } from '../components/ui/ChartSkeleton';
import { STRATEGY_COLORS } from '../data/metrics';
import { fetchAnalysisRevenue } from '../utils/api';
import { useAnalysis } from '../utils/useAnalysis';
import { AsyncBanner } from '../components/AsyncBanner';

const legendStyle = { fontSize: 12, color: '#6B7280', paddingTop: 8 };

export function RevenueAnalytics() {
  const ready = useDataReady(300);
  const { data, loading, error } = useAnalysis(() => fetchAnalysisRevenue(30));

  const trend = data?.trend ?? [];
  const comparison = data?.comparison ?? [];
  const distribution = data?.distribution ?? [];
  const cumulative = data?.cumulative ?? [];
  const monthly = data?.monthly ?? [];
  const episodes = data?.meta?.episodes ?? 0;
  const steps = data?.meta?.steps ?? 0;
  const maxUplift = Math.max(1, ...monthly.map((m) => m.uplift));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue Analytics"
        title="Revenue performance"
        subtitle="Compare strategy revenue, distribution and cumulative contribution from live multi-episode evaluation."
        action={
          <Badge tone="accent">
            {episodes > 0 ? `${episodes} episodes · ${steps} steps` : 'Live evaluation'}
          </Badge>
        } />

      <AsyncBanner
        error={error}
        loading={loading}
        label="Running live evaluation episodes on the backend…" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            headingLevel="h2"
            title="Revenue trend"
            description="Episodic revenue per strategy (₹ millions)" />
          
          <div className="px-5 py-5">
            {trend.length > 0 ?
            <RevenueTrendChart data={trend} height={320} /> :

            <ChartSkeleton height={320} bars={16} />
            }
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader headingLevel="h2" title="Revenue comparison" description="Average per strategy" />
          <div className="px-5 py-5">
            {comparison.length > 0 ?
            <RevenueComparisonChart data={comparison} height={320} /> :

            <ChartSkeleton height={320} bars={5} />
            }
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            headingLevel="h2"
            title="Revenue distribution"
            description="Episode count by revenue bucket (₹ millions)" />
          
          <div className="px-5 py-5">
            {!ready || distribution.length === 0 ?
            <ChartSkeleton height={280} bars={6} /> :

            <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                    <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  
                    <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    allowDecimals={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    label={{
                      value: 'Episodes',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: { fill: '#9CA3AF', fontSize: 11 }
                    }} />
                  
                    <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
                    content={<ChartTooltip formatter={(v) => `${v} episodes`} />} />
                  
                    <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
                  
                    {ALL_STRATEGIES.map((name, i) =>
                  <Bar
                    key={name}
                    dataKey={name}
                    name={name}
                    stackId="a"
                    fill={STRATEGY_COLORS[name]}
                    radius={i === ALL_STRATEGIES.length - 1 ? [6, 6, 0, 0] : undefined} />

                  )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            }
          </div>
        </Card>

        <Card>
          <CardHeader
            headingLevel="h2"
            title="Cumulative revenue"
            description="Total revenue accumulated across episodes (₹ millions)" />
          
          <div className="px-5 py-5">
            {!ready || cumulative.length === 0 ?
            <ChartSkeleton height={280} bars={14} /> :

            <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulative} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                    <XAxis
                    dataKey="episode"
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  
                    <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}M`} />
                  
                    <Tooltip content={<ChartTooltip labelPrefix="Episode " />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
                  
                    {ALL_STRATEGIES.map((name) =>
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    name={name}
                    stroke={STRATEGY_COLORS[name]}
                    fill={STRATEGY_COLORS[name]}
                    fillOpacity={0.1}
                    strokeWidth={2} />

                  )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            }
          </div>
        </Card>
      </div>

      <Card as="section">
        <CardHeader
          headingLevel="h2"
          title="Monthly revenue summary"
          description="Dataset baseline pricing versus the DQN policy, per month" />
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-medium">Month</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Baseline</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Optimized</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Uplift</th>
                <th scope="col" className="px-5 py-3 font-medium">Relative uplift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthly.map((row) =>
              <tr
                key={row.monthKey ?? row.month}
                className="transition-colors duration-150 ease-smooth hover:bg-slate-50">
                
                  <th scope="row" className="px-5 py-3 text-[13.5px] font-medium text-ink">
                    {row.month}
                  </th>
                  <td className="tabular px-5 py-3 text-right text-[13.5px] text-muted">
                    ₹{row.baseline.toFixed(2)}M
                  </td>
                  <td className="tabular px-5 py-3 text-right text-[13.5px] font-medium text-ink">
                    ₹{row.optimized.toFixed(2)}M
                  </td>
                  <td
                  className={[
                  'tabular px-5 py-3 text-right text-[13.5px] font-medium',
                  row.uplift >= 0 ? 'text-emerald-700' : 'text-red-600'].
                  join(' ')}>
                  
                    {row.uplift >= 0 ? '+' : ''}
                    {row.uplift.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-100">
                      <div
                      className={row.uplift >= 0 ? 'h-full rounded-full bg-accent' : 'h-full rounded-full bg-red-400'}
                      style={{ width: `${Math.min(100, Math.abs(row.uplift) / maxUplift * 100)}%` }} />
                    
                    </div>
                  </td>
                </tr>
              )}
              {monthly.length === 0 &&
              <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-muted">
                    Monthly breakdown unavailable — the dataset could not be located by the backend.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}
