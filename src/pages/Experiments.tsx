import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { STRATEGY_COLORS } from '../data/metrics';
import { fetchAnalysisExperiments } from '../utils/api';
import { useAnalysis } from '../utils/useAnalysis';
import { AsyncBanner } from '../components/AsyncBanner';

type StatusFilter = 'All' | 'Completed' | 'Pending' | 'Archived';

const filters: StatusFilter[] = ['All', 'Completed', 'Pending', 'Archived'];

const statusTone: Record<string, 'success' | 'accent' | 'danger' | 'neutral'> = {
  Completed: 'success',
  Pending: 'neutral',
  Running: 'accent',
  Failed: 'danger',
  Archived: 'neutral',
};

export function Experiments() {
  const { data, loading, error } = useAnalysis(fetchAnalysisExperiments);
  const [filter, setFilter] = useState<StatusFilter>('All');

  const all = data?.experiments ?? [];
  const rows = useMemo(
    () => filter === 'All' ? all : all.filter((e) => e.status === filter),
    [filter, all]
  );

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Experiments"
        title="Model runs"
        subtitle="Every training run and model artifact discovered on disk, with real revenue, reward and status."
        action={<Button variant="secondary" size="sm" className="py-2">New experiment</Button>} />
      

      <AsyncBanner error={error} loading={loading} label="Scanning training artifacts…" />

      {summary &&
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-[13px] font-medium text-muted">Runs discovered</p>
            <p className="tabular mt-1 text-[26px] font-semibold leading-none text-ink">{summary.runs}</p>
          </Card>
          <Card className="p-5">
            <p className="text-[13px] font-medium text-muted">Trained agents</p>
            <p className="tabular mt-1 text-[26px] font-semibold leading-none text-ink">{summary.trained}</p>
          </Card>
          <Card className="p-5">
            <p className="text-[13px] font-medium text-muted">Source</p>
            <p className="mt-1 text-[15px] font-semibold leading-tight text-ink">{summary.status}</p>
          </Card>
        </div>
      }

      <Card as="section">
        <CardHeader
          headingLevel="h2"
          title={`${rows.length} experiment${rows.length === 1 ? '' : 's'}`}
          description="Sorted by creation date, newest first"
          action={
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {filters.map((f) =>
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={[
              'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors duration-150 ease-smooth',
              filter === f ?
              'border-accent bg-accent text-white' :
              'border-slate-200 bg-white text-muted hover:border-slate-300 hover:text-ink'].
              join(' ')}>
              
                  {f}
                </button>
            )}
            </div>
          } />
        

        {rows.length === 0 ?
        <p className="px-5 py-12 text-center text-[13.5px] text-muted">
            {loading ? 'Loading experiments…' : 'No experiments match this status.'}
          </p> :

        <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wide text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Run ID</th>
                  <th scope="col" className="px-5 py-3 font-medium">Algorithm</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Revenue</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Reward</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Timesteps</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Artifact</th>
                  <th scope="col" className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((exp) =>
              <tr
                key={exp.id}
                className="transition-colors duration-150 ease-smooth hover:bg-slate-50">
                
                    <th scope="row" className="tabular px-5 py-4 text-[13.5px] font-semibold text-ink">
                      {exp.id}
                    </th>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 text-[13.5px] text-ink">
                        <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STRATEGY_COLORS[exp.algorithm] ?? '#64748B' }}
                      aria-hidden="true" />
                    
                        {exp.algorithm}
                      </span>
                    </td>
                    <td className="tabular px-5 py-4 text-right text-[13.5px] font-medium text-ink">
                      {exp.revenue == null ? '—' : `₹${exp.revenue.toFixed(2)}M`}
                    </td>
                    <td className="tabular px-5 py-4 text-right text-[13.5px] text-muted">
                      {exp.reward == null ? '—' : `${exp.reward.toFixed(2)}M`}
                    </td>
                    <td className="tabular px-5 py-4 text-right text-[13.5px] text-muted">
                      {exp.timesteps == null ? '—' : exp.timesteps.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={statusTone[exp.status] ?? 'neutral'} dot={exp.status === 'Running'}>
                        {exp.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-[12.5px] text-muted">{exp.modelFile ?? '—'}</td>
                    <td className="tabular px-5 py-4 text-[13.5px] text-muted">{exp.createdDate}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>);

}
