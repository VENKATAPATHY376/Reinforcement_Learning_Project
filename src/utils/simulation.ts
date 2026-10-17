import type { SimulationInput, SimulationResult } from '../types/pricing';

const seasonFactor: Record<SimulationInput['season'], number> = {
  Regular: 1,
  Festival: 1.22,
  'Off-season': 0.82,
  Clearance: 0.7
};

const demandFactor: Record<SimulationInput['demandLevel'], number> = {
  Low: 0.75,
  Medium: 1,
  High: 1.28
};

/**
 * Mirrors the trained DQN policy: it nudges price toward the competitor
 * reference, then adjusts for seasonality, demand signal and inventory cover.
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  const { currentPrice, inventory, competitorPrice, season, demandLevel } = input;

  const competitorGap = (competitorPrice - currentPrice) / Math.max(currentPrice, 1);
  const inventoryPressure = Math.min(Math.max(inventory / 800, 0), 1.4);

  let multiplier = 1;
  multiplier += competitorGap * 0.45;
  multiplier *= seasonFactor[season];
  multiplier *= 0.94 + demandFactor[demandLevel] * 0.08;
  multiplier -= (inventoryPressure - 0.6) * 0.06;

  const recommendedPrice = Math.round(
    Math.min(Math.max(currentPrice * multiplier, currentPrice * 0.72), currentPrice * 1.35)
  );

  const elasticity = -1.35;
  const priceDelta = (recommendedPrice - currentPrice) / Math.max(currentPrice, 1);
  const baseDemand = 420 * demandFactor[demandLevel] * seasonFactor[season];
  const expectedDemand = Math.max(
    12,
    Math.round(Math.min(baseDemand * (1 + elasticity * priceDelta), inventory))
  );
  const baselineDemand = Math.max(12, Math.round(Math.min(baseDemand, inventory)));

  const expectedRevenue = recommendedPrice * expectedDemand;
  const baselineRevenue = currentPrice * baselineDemand;
  const revenueImpact = (expectedRevenue - baselineRevenue) / Math.max(baselineRevenue, 1) * 100;

  const action =
  recommendedPrice > currentPrice ?
  `Raise price by ₹${recommendedPrice - currentPrice}` :
  recommendedPrice < currentPrice ?
  `Reduce price by ₹${currentPrice - recommendedPrice}` :
  'Hold current price';

  return {
    recommendedPrice,
    expectedDemand,
    expectedRevenue,
    revenueImpact: Number(revenueImpact.toFixed(1)),
    baselineRevenue,
    action
  };
}

export function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}