export type StrategyName = 'Fixed-price baseline' | 'Rule-based' | 'DQN' | 'QR-DQN' | 'PPO';

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

export interface ModelRow {
  algorithm: StrategyName;
  averageRevenue: number;
  averageReward: number;
  improvement: number;
  rank: 1 | 2 | 3 | 4 | 5;
  medal: string;
  note: string;
}

export type ExperimentStatus = 'Completed' | 'Running' | 'Failed' | 'Pending' | 'Archived';

export interface Experiment {
  id: string;
  algorithm: StrategyName;
  revenue: number | null;
  reward: number | null;
  status: ExperimentStatus;
  createdDate: string;
  episodes: number | null;
  timesteps?: number | null;
  trainingSeconds?: number | null;
  owner: string;
  modelFile?: string;
}

export interface Insight {
  id: string;
  title: string;
  detail: string;
  tone: 'success' | 'accent' | 'warning' | 'neutral';
}

export interface SimulationInput {
  currentPrice: number;
  inventory: number;
  competitorPrice: number;
  season: 'Regular' | 'Summer' | 'Monsoon' | 'Festival';
  promotion: 0 | 1;
}

export interface SimulationResult {
  recommendedPrice: number;
  expectedDemand: number;
  expectedRevenue: number;
  revenueImpact: number;
  baselineRevenue: number;
  action: string;
}