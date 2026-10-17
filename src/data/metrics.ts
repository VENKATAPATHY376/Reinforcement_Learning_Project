import type { StrategyName } from '../types/pricing';

export const STRATEGY_COLORS: Record<StrategyName, string> = {
  'Fixed-price baseline': '#64748B',
  'Rule-based': '#06B6D4',
  DQN: '#10B981',
  'QR-DQN': '#6366F1',
  PPO: '#F59E0B',
};

export const ALGORITHM_COLORS = STRATEGY_COLORS;

export const architectureSteps = [
  { id: '01', title: 'Data Ingestion', description: 'Synthetic pricing dataset with demand drivers and seasonality' },
  { id: '02', title: 'Feature Engineering', description: 'Prices, inventory, competitor price, season and promotion' },
  { id: '03', title: 'Demand Modeling', description: 'Train demand regressor to estimate realistic demand' },
  { id: '04', title: 'RL Training', description: 'Train DQN, QR-DQN and PPO agents on the pricing environment' },
  { id: '05', title: 'Evaluation', description: 'Multi-scenario evaluation against baselines (live)' },
  { id: '06', title: 'API & Dashboard', description: 'FastAPI backend serves real analysis to React dashboard' },
];
