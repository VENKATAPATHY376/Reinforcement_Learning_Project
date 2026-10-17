import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityIcon, IndianRupeeIcon, Loader2Icon, PlayIcon, TrendingUpIcon, UsersIcon, ZapIcon, RefreshCwIcon, BarChart3Icon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/simulation';
import { predictPricing, fetchStrategyEvaluation, type AlgorithmId, type PredictionResult, type StrategyEvaluation } from '../utils/api';
import type { SimulationInput } from '../types/pricing';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors duration-150 ease-smooth focus:border-accent focus:ring-2 focus:ring-accent/20';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-ink';
const algorithms: { id: AlgorithmId; label: string }[] = [
  { id: 'dqn', label: 'DQN' },
  { id: 'qrdqn', label: 'QR-DQN' },
  { id: 'ppo', label: 'PPO' },
];
const strategies = ['Current-price baseline', 'Rule-based', ...algorithms.map((a) => a.label)];
const strategyTone: Record<string, string> = {
  'Current-price baseline': 'bg-slate-400',
  'Rule-based': 'bg-sky-500',
  DQN: 'bg-violet-500',
  'QR-DQN': 'bg-fuchsia-500',
  PPO: 'bg-emerald-500',
};
const money = (value: number) => formatCurrency(value);

export function PricingStrategy() {
  const [input, setInput] = useState<SimulationInput>({
    currentPrice: 1000,
    inventory: 1000,
    competitorPrice: 950,
    season: 'Festival',
    promotion: 0,
  });
  const [algorithm, setAlgorithm] = useState<AlgorithmId>('dqn');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<StrategyEvaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(true);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const loadEvaluation = async () => {
    setEvaluationLoading(true);
    setEvaluationError(null);
    try {
      setEvaluation(await fetchStrategyEvaluation());
    } catch (err) {
      setEvaluationError(err instanceof Error ? err.message : 'Could not load strategy evaluation');
    } finally {
      setEvaluationLoading(false);
    }
  };

  useEffect(() => { void loadEvaluation(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    setError(null);
    try {
      setResult(await predictPricing(input, algorithm));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  const algorithmLabel = algorithms.find((a) => a.id === algorithm)?.label ?? 'DQN';

  const metrics = result ? [
    { label: `${algorithmLabel} recommended price`, value: formatCurrency(result.recommendedPrice), support: result.action, icon: IndianRupeeIcon },
    { label: 'Expected sales', value: `${result.expectedSales} units`, support: `Demand ${result.demand} · conversion ${(result.conversionRate * 100).toFixed(1)}%`, icon: UsersIcon },
    { label: 'Expected revenue', value: formatCurrency(result.expectedRevenue), support: `Baseline ${formatCurrency(result.baselineRevenue)}`, icon: ActivityIcon },
    { label: 'Reward', value: result.reward.toLocaleString('en-IN'), support: 'Notebook reward function', icon: ZapIcon },
    { label: 'Revenue impact', value: `${result.revenueImpact > 0 ? '+' : ''}${result.revenueImpact}%`, support: 'Versus current-price baseline', icon: TrendingUpIcon },
  ] : [];

  const maxRevenue = Math.max(1, ...(evaluation?.summary.map((s) => s.totalRevenue) ?? [1]));
  const impactRows = evaluation?.results.filter((row) => row.strategy !== 'Current-price baseline') ?? [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Pricing Strategy" title={`${algorithmLabel} pricing prediction`} subtitle="Run a prediction with a trained RL model and compare it with baseline and rule-based pricing strategies." action={<Badge tone="accent">Live model: {algorithmLabel}</Badge>} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader headingLevel="h2" title="Scenario inputs" description="These values are converted into the 6-value state used by the Colab environment." />
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div><label className={labelClass} htmlFor="currentPrice">Current price (₹)</label><input id="currentPrice" type="number" min={1} step={10} className={fieldClass} value={input.currentPrice} onChange={(e) => setInput({ ...input, currentPrice: Number(e.target.value) })} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="inventory">Inventory</label><input id="inventory" type="number" min={0} step={10} className={fieldClass} value={input.inventory} onChange={(e) => setInput({ ...input, inventory: Number(e.target.value) })} /></div>
              <div><label className={labelClass} htmlFor="competitorPrice">Competitor price (₹)</label><input id="competitorPrice" type="number" min={1} step={10} className={fieldClass} value={input.competitorPrice} onChange={(e) => setInput({ ...input, competitorPrice: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="season">Season</label><select id="season" className={fieldClass} value={input.season} onChange={(e) => setInput({ ...input, season: e.target.value as SimulationInput['season'] })}><option>Regular</option><option>Summer</option><option>Monsoon</option><option>Festival</option></select></div>
              <div><label className={labelClass} htmlFor="promotion">Promotion</label><select id="promotion" className={fieldClass} value={input.promotion} onChange={(e) => setInput({ ...input, promotion: Number(e.target.value) as 0 | 1 })}><option value={0}>No promotion</option><option value={1}>Promotion active</option></select></div>
            </div>
            <div><label className={labelClass} htmlFor="algorithm">RL algorithm</label><select id="algorithm" className={fieldClass} value={algorithm} onChange={(e) => setAlgorithm(e.target.value as AlgorithmId)}>{algorithms.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
            <Button type="submit" disabled={running} className="w-full">{running ? <><Loader2Icon className="h-4 w-4 animate-spin" /> Running {algorithmLabel}…</> : <><PlayIcon className="h-4 w-4" /> Predict with {algorithmLabel}</>}</Button>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-700">{error}</div>}
          </form>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader headingLevel="h2" title={`${algorithmLabel} prediction output`} description="Individual prediction from the Stable-Baselines3 model loaded by the Python backend." />
          <div className="px-5 py-5">
            {running ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse rounded-2xl border border-slate-200 p-5"><div className="h-9 w-9 rounded-xl bg-slate-100" /><div className="mt-4 h-3 w-24 rounded bg-slate-100" /><div className="mt-3 h-7 w-32 rounded bg-slate-100" /></div>)}</div> : !result ? <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><PlayIcon className="h-5 w-5" /></span><p className="mt-3 text-[14px] font-medium text-ink">No prediction yet</p><p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">Enter a pricing scenario and send it to the trained DQN model.</p></div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{metrics.map((metric, i) => <motion.div key={metric.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: i * 0.05 }} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><metric.icon className="h-[18px] w-[18px]" /></span><p className="mt-4 text-[13px] font-medium text-muted">{metric.label}</p><p className="tabular mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">{metric.value}</p><p className="mt-auto pt-3 text-[12.5px] leading-relaxed text-muted">{metric.support}</p></motion.div>)}</div>}
          </div>
        </Card>
      </div>

      <section className="space-y-4" aria-labelledby="evaluation-heading">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Offline evaluation</p><h2 id="evaluation-heading" className="mt-1 text-xl font-semibold text-ink">Strategy performance comparison</h2><p className="mt-1 text-sm text-muted">Results from the fixed synthetic scenario set; separate from the individual prediction above.</p></div><Button type="button" variant="secondary" onClick={() => void loadEvaluation()} disabled={evaluationLoading}>{evaluationLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />} Refresh evaluation</Button></div>
        {evaluationError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{evaluationError}<p className="mt-1">Check that FastAPI is running and `GET /api/evaluation` is available.</p></div>}
        {evaluationLoading && !evaluation ? <Card><div className="flex items-center gap-3 p-6 text-sm text-muted"><Loader2Icon className="h-5 w-5 animate-spin" /> Loading strategy evaluation…</div></Card> : evaluation && <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {evaluation.summary.map((item) => <Card key={item.strategy}>
              <div className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-muted">{item.strategy}</p><span className={`h-2.5 w-2.5 rounded-full ${strategyTone[item.strategy] ?? 'bg-slate-400'}`} /></div><p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{money(item.totalRevenue)}</p><p className="mt-1 text-xs text-muted">Total simulated revenue</p><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3"><div><p className="text-xs text-muted">Units sold</p><p className="mt-1 font-semibold text-ink">{item.totalSales}</p></div><div><p className="text-xs text-muted">Avg. impact</p><p className={`mt-1 font-semibold ${item.averageRevenueImpactPct > 0 ? 'text-emerald-600' : item.averageRevenueImpactPct < 0 ? 'text-red-600' : 'text-ink'}`}>{item.averageRevenueImpactPct > 0 ? '+' : ''}{item.averageRevenueImpactPct.toFixed(2)}%</p></div></div></div>
            </Card>)}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card><CardHeader headingLevel="h3" title="Total revenue by strategy" description="Total across the same seven scenarios." /><div className="space-y-5 px-5 py-5">{evaluation.summary.map((item) => <div key={item.strategy}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-ink">{item.strategy}</span><span className="tabular text-muted">{money(item.totalRevenue)}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${strategyTone[item.strategy] ?? 'bg-slate-400'}`} style={{ width: `${Math.min(100, (item.totalRevenue / maxRevenue) * 100)}%` }} /></div></div>)}</div></Card>
            <Card><CardHeader headingLevel="h3" title="Revenue impact by scenario" description="Percentage change relative to the current-price baseline." /><div className="space-y-3 px-5 py-4">{(evaluation.results.filter((row) => row.strategy === algorithmLabel)).map((row) => <div key={row.scenario} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{row.scenario}</p><p className="text-xs text-muted">{row.action}</p></div><span className={`rounded-lg px-2.5 py-1 text-sm font-semibold tabular ${row.revenueImpactPct > 0 ? 'bg-emerald-50 text-emerald-700' : row.revenueImpactPct < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{row.revenueImpactPct > 0 ? '+' : ''}{row.revenueImpactPct.toFixed(2)}%</span></div>)}</div></Card>
          </div>

          <Card><CardHeader headingLevel="h2" title="Scenario-level results" description={`${evaluation.scenarioCount} synthetic scenarios × ${strategies.length} strategies = ${evaluation.results.length} evaluation rows.`} /><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3 font-semibold">Scenario</th><th className="px-4 py-3 font-semibold">Strategy</th><th className="px-4 py-3 font-semibold">Action</th><th className="px-4 py-3 text-right font-semibold">Price</th><th className="px-4 py-3 text-right font-semibold">Sales</th><th className="px-4 py-3 text-right font-semibold">Revenue</th><th className="px-4 py-3 text-right font-semibold">Impact</th></tr></thead><tbody className="divide-y divide-slate-100">{evaluation.results.map((row, index) => <tr key={`${row.scenario}-${row.strategy}-${index}`} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.scenario}</td><td className="whitespace-nowrap px-4 py-3"><span className="inline-flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${strategyTone[row.strategy] ?? 'bg-slate-400'}`} />{row.strategy}</span></td><td className="whitespace-nowrap px-4 py-3 text-muted">{row.action}</td><td className="whitespace-nowrap px-4 py-3 text-right tabular">{money(row.recommendedPrice)}</td><td className="px-4 py-3 text-right tabular">{row.sales}</td><td className="whitespace-nowrap px-4 py-3 text-right tabular">{money(row.revenue)}</td><td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular ${row.revenueImpactPct > 0 ? 'text-emerald-600' : row.revenueImpactPct < 0 ? 'text-red-600' : 'text-muted'}`}>{row.revenueImpactPct > 0 ? '+' : ''}{row.revenueImpactPct.toFixed(2)}%</td></tr>)}</tbody></table></div></Card>
          <p className="text-xs leading-relaxed text-muted">Interpretation note: these results are deterministic outputs from a small synthetic scenario set. They are useful for demonstrating and debugging the prototype, but they do not establish real-world profitability or statistically robust DQN superiority.</p>
        </>}
      </section>
    </div>
  );
}
