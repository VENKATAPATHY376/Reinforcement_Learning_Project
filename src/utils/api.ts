import type { SimulationInput, SimulationResult, StrategyName } from '../types/pricing';

export type AlgorithmId = 'dqn' | 'qrdqn' | 'ppo';

export interface PredictionResult extends SimulationResult {
  actionIndex: number;
  actionChange: number;
  demand: number;
  conversionRate: number;
  expectedSales: number;
  reward: number;
  modelLoaded: boolean;
  algorithm?: AlgorithmId;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Turn a FastAPI `detail` value into a readable string.
 * A 422 validation error returns `detail` as an array of error objects, so a naive
 * `new Error(detail)` would render `[object Object]`.
 */
function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const entry = item as { loc?: unknown; msg?: unknown };
          const loc = Array.isArray(entry.loc)
            ? entry.loc.filter((part) => part !== 'body').join('.')
            : '';
          const msg = typeof entry.msg === 'string' ? entry.msg : JSON.stringify(item);
          return loc ? `${loc}: ${msg}` : msg;
        }
        return String(item);
      })
      .filter(Boolean);
    if (parts.length) return parts.join('; ');
  }

  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return fallback;
}

export async function predictPricing(
  input: SimulationInput,
  algorithm: AlgorithmId = 'dqn',
): Promise<PredictionResult> {
  const response = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPrice: input.currentPrice,
      inventory: input.inventory,
      competitorPrice: input.competitorPrice,
      season: input.season.toLowerCase(),
      promotion: input.promotion,
      algorithm,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(formatApiError(data?.detail, 'Prediction request failed'));
  }

  return data as PredictionResult;
}

export interface StrategyEvaluationRow {
  scenario: string;
  strategy: string;
  action: string;
  recommendedPrice: number;
  demand: number;
  sales: number;
  revenue: number;
  baselineRevenue: number;
  revenueImpactPct: number;
  reward: number;
}

export interface StrategySummary {
  strategy: string;
  totalRevenue: number;
  totalSales: number;
  totalReward: number;
  averageRevenueImpactPct: number;
}

export interface StrategyEvaluation {
  modelLoaded: boolean;
  evaluationType: string;
  scenarioCount: number;
  summary: StrategySummary[];
  results: StrategyEvaluationRow[];
}

export async function fetchStrategyEvaluation(): Promise<StrategyEvaluation> {
  const response = await fetch(`${API_BASE}/api/evaluation`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatApiError(data?.detail, 'Strategy evaluation request failed'));
  }

  return data as StrategyEvaluation;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  support: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'flat';
  icon: 'revenue' | 'trophy' | 'growth' | 'reward' | 'products' | 'episodes';
}

export interface RevenueComparisonPoint {
  algorithm: StrategyName;
  revenue: number;
  color: string;
}

export interface TrendPoint {
  episode: number;
  'Fixed-price baseline'?: number;
  'Rule-based'?: number;
  DQN?: number;
  'QR-DQN'?: number;
  PPO?: number;
  [key: string]: number | undefined;
}

export interface DistributionRow {
  bucket: string;
  [key: string]: number | string;
}

export interface MonthlyRow {
  month: string;
  monthKey?: string;
  baseline: number;
  optimized: number;
  uplift: number;
}

export interface AnalysisOverview {
  kpis: Kpi[];
  comparison: RevenueComparisonPoint[];
  insights: Array<{ id: string; title: string; detail: string; tone: 'success' | 'accent' | 'warning' | 'neutral' }>;
  badge: string;
}

export interface AnalysisRevenue {
  trend: TrendPoint[];
  comparison: RevenueComparisonPoint[];
  distribution: DistributionRow[];
  cumulative: TrendPoint[];
  monthly: MonthlyRow[];
  meta: { episodes: number; steps: number };
}

export interface ModelRow {
  algorithm: StrategyName;
  averageRevenue: number;
  averageReward: number;
  improvement: number;
  rank: number;
  medal: string;
  note: string;
}

export interface AnalysisPerformance {
  rows: ModelRow[];
  recommendation: { name: string; facts: string[] };
  rewardComparison: Array<{ algorithm: string; revenue: number }>;
  baseline: { totalRevenue: number };
}

export interface ExperimentRow {
  id: string;
  algorithm: StrategyName;
  revenue: number | null;
  reward: number | null;
  status: string;
  createdDate: string;
  episodes: number | null;
  timesteps?: number | null;
  trainingSeconds?: number | null;
  owner: string;
  modelFile?: string;
}

export interface AnalysisExperiments {
  experiments: ExperimentRow[];
  summary: { runs: number; trained: number; status: string };
}

export interface ReportMeta {
  id: string;
  title: string;
  filename: string;
  description: string;
  size: string;
  bytes: number;
  format: string;
  updated: string;
  available: boolean;
}

export interface AnalysisReports {
  reports: ReportMeta[];
}

export async function fetchAnalysisOverview(): Promise<AnalysisOverview> {
  const res = await fetch(`${API_BASE}/api/analysis/overview`);
  if (!res.ok) throw new Error('Failed to load overview');
  return res.json();
}

const STRATEGY_KEYS: string[] = ['Fixed-price baseline', 'Rule-based', 'DQN', 'QR-DQN', 'PPO'];

function toMillions(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Number((n / 1e6).toFixed(2)) : 0;
}

export async function fetchAnalysisRevenue(nEpisodes = 30): Promise<AnalysisRevenue> {
  const res = await fetch(`${API_BASE}/api/analysis/revenue?n_episodes=${nEpisodes}`);
  if (!res.ok) throw new Error('Failed to load revenue analysis');
  const raw = (await res.json()) as AnalysisRevenue;

  // The backend returns episode/monthly revenue in raw rupees; charts render millions.
  const trend = raw.trend.map((point) => {
    const scaled: TrendPoint = { episode: point.episode };
    for (const key of STRATEGY_KEYS) {
      if (typeof point[key] === 'number') scaled[key] = toMillions(point[key]);
    }
    return scaled;
  });

  const monthly = raw.monthly.map((row) => ({
    ...row,
    baseline: toMillions(row.baseline),
    optimized: toMillions(row.optimized),
  }));

  return { ...raw, trend, monthly };
}

export async function fetchAnalysisPerformance(): Promise<AnalysisPerformance> {
  const res = await fetch(`${API_BASE}/api/analysis/performance`);
  if (!res.ok) throw new Error('Failed to load performance');
  return res.json();
}

export async function fetchAnalysisExperiments(): Promise<AnalysisExperiments> {
  const res = await fetch(`${API_BASE}/api/analysis/experiments`);
  if (!res.ok) throw new Error('Failed to load experiments');
  return res.json();
}

export async function fetchAnalysisReports(): Promise<AnalysisReports> {
  const res = await fetch(`${API_BASE}/api/analysis/reports`);
  if (!res.ok) throw new Error('Failed to load reports');
  return res.json();
}

export function getAnalysisReportUrl(id: string): string {
  return `${API_BASE}/api/analysis/reports/${id}`;
}