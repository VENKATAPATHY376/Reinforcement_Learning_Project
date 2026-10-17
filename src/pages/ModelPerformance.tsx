import React from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { RevenueComparisonChart } from '../components/charts/RevenueComparisonChart';
import { STRATEGY_COLORS } from '../data/metrics';
import type { RevenueComparisonPoint, StrategyName } from '../types/pricing';
import { fetchAnalysisPerformance } from '../utils/api';
import { useAnalysis } from '../utils/useAnalysis';
import { AsyncBanner } from '../components/AsyncBanner';

export function ModelPerformance() {
  const { data, loading, error } = useAnalysis(fetchAnalysisPerformance);

  const rows = data?.rows ?? [];
  const best = rows[0];
  const facts = data?.recommendation?.facts ?? [];
  const baselineRevenue = data?.baseline?.totalRevenue ?? 0;

  const rewardComparison: RevenueComparisonPoint[] = (data?.rewardComparison ?? []).map(
    (r) => ({
      algorithm: r.algorithm as StrategyName,
      revenue: r.revenue,
      color: STRATEGY_COLORS[r.algorithm as StrategyName] ?? '#64748B',
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Model Performance"
        title="Algorithm comparison"
        subtitle="Ranked results for every strategy, computed from the real training evaluation artifacts."
        action={
        <Badge tone="success" dot>
            {best ? `Best model: ${best.algorithm}` : 'Loading…'}
          </Badge>
        } />
      

      <AsyncBanner error={error} loading={loading} label="Loading the training report…" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-accent/30 bg-accent-soft/40 p-5 xl:col-span-1">
          <p className="text-[13px] font-medium text-muted">Recommended for production</p>
          <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {data?.recommendation?.name ?? '—'}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            Highest total revenue in the held-out evaluation protocol. Values come straight from
            <code className="mx-1 rounded bg-white/60 px-1 py-0.5">training_report.json</code>.
          </p>
          <ul className="mt-4 space-y-2">
            {facts.map((item) =>
            <li key={item} className="flex items-center gap-2 text-[13px] text-ink">
                <CheckCircle2Icon className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            )}
            <li className="flex items-center gap-2 text-[13px] text-ink">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              Fixed-price baseline: ₹{baselineRevenue.toFixed(2)}M
            </li>
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            headingLevel="h2"
            title="Average reward by algorithm"
            description="Mean episodic reward from the real evaluation" />
          
          <div className="px-5 py-5">
            {rewardComparison.length > 0 ?
            <RevenueComparisonChart
              data={rewardComparison}
              height={272}
              unit="Reward (millions)" /> :


            <div className="h-[272px] animate-pulse rounded-lg bg-slate-100" />
            }
          </div>
        </Card>
      </div>

      <Card as="section">
        <CardHeader
          headingLevel="h2"
          title="Model comparison"
          description="Revenue, reward and improvement versus the fixed-price baseline" />
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <caption className="sr-only">
              Comparison of every strategy by revenue, reward, improvement and rank
            </caption>
            <thead>
              <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-medium">Algorithm</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Average revenue</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Average reward</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Improvement %</th>
                <th scope="col" className="px-5 py-3 font-medium">Rank</th>
                <th scope="col" className="px-5 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const isBest = row.rank === 1;
                return (
                  <tr
                    key={row.algorithm}
                    className={[
                    'transition-colors duration-150 ease-smooth',
                    isBest ? 'bg-accent-soft/50 hover:bg-accent-soft' : 'hover:bg-slate-50'].
                    join(' ')}>
                    
                    <th scope="row" className="px-5 py-4">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: STRATEGY_COLORS[row.algorithm] ?? '#64748B' }}
                          aria-hidden="true" />
                        
                        <span className="text-[14px] font-semibold text-ink">{row.algorithm}</span>
                        {isBest ? <Badge tone="accent">Best model</Badge> : null}
                      </span>
                    </th>
                    <td className="tabular px-5 py-4 text-right text-[14px] font-medium text-ink">
                      ₹{row.averageRevenue.toFixed(2)}M
                    </td>
                    <td className="tabular px-5 py-4 text-right text-[14px] text-muted">
                      {row.averageReward.toFixed(2)}M
                    </td>
                    <td
                      className={[
                      'tabular px-5 py-4 text-right text-[14px] font-medium',
                      row.improvement > 0 ?
                      'text-emerald-700' :
                      row.improvement < 0 ?
                      'text-red-600' :
                      'text-muted'].
                      join(' ')}>
                      
                      {row.improvement > 0 ? '+' : ''}
                      {row.improvement.toFixed(1)}%
                      {row.improvement === 0 ? ' (baseline)' : ''}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink">
                        {row.medal ? <span aria-hidden="true">{row.medal}</span> : null}#{row.rank}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[12.5px] leading-relaxed text-muted">{row.note}</td>
                  </tr>);
              })}
              {rows.length === 0 && !loading &&
              <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted">
                    No evaluation metrics available.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}
