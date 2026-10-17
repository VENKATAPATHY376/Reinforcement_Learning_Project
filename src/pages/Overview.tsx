import { ArrowUpRightIcon, DownloadIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { KpiCard } from '../components/KpiCard';
import { InsightsPanel } from '../components/InsightsPanel';
import { ArchitectureFlow } from '../components/ArchitectureFlow';
import { RevenueComparisonChart } from '../components/charts/RevenueComparisonChart';
import { RevenueTrendChart } from '../components/charts/RevenueTrendChart';
import { fetchAnalysisOverview, fetchAnalysisRevenue } from '../utils/api';
import { useAnalysis } from '../utils/useAnalysis';
import { AsyncBanner } from '../components/AsyncBanner';

export function Overview() {
  const overview = useAnalysis(fetchAnalysisOverview);
  const revenue = useAnalysis(() => fetchAnalysisRevenue(30));

  const kpis = overview.data?.kpis ?? [];
  const [featured, ...rest] = kpis;
  const comparison = overview.data?.comparison ?? [];
  const trend = revenue.data?.trend ?? [];
  const insights = overview.data?.insights ?? [];

  const best = comparison.length
    ? comparison.reduce((a, b) => (b.revenue > a.revenue ? b : a))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="RL-Powered Dynamic Pricing Optimization Platform"
        title="Dynamic Pricing Optimization Platform"
        subtitle="Optimize revenue through Reinforcement Learning-based pricing strategies across multiple demand scenarios."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="py-2">
              <DownloadIcon className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
            <Badge tone="success" dot>
              {overview.data?.badge ?? 'Live analysis'}
            </Badge>
          </div>
        }
      />

      <AsyncBanner error={overview.error} loading={overview.loading} label="Loading KPIs from the backend…" />

      {kpis.length > 0 && (
        <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          <div className="lg:col-span-1 xl:col-span-1">
            <KpiCard kpi={featured} featured />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 xl:col-span-3 xl:grid-cols-3">
            {rest.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            headingLevel="h2"
            title="Revenue comparison"
            description="Total revenue per strategy from the real training evaluation"
            action={
              best ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
                  <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {best.algorithm} leads
                </span>
              ) : undefined
            }
          />
          <div className="px-5 py-5">
            {comparison.length > 0 ? (
              <RevenueComparisonChart data={comparison} height={300} />
            ) : (
              <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />
            )}
          </div>
        </Card>

        <InsightsPanel insights={insights} />
      </div>

      <Card as="section">
        <CardHeader
          headingLevel="h2"
          title="Revenue trend per episode"
          description="Live multi-episode evaluation across all five strategies; hover for detail"
        />
        <div className="px-5 py-5">
          {trend.length > 0 ? (
            <RevenueTrendChart data={trend} height={320} />
          ) : (
            <div className="h-[320px] animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
      </Card>

      <ArchitectureFlow />
    </div>
  );
}