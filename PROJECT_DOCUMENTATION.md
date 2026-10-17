# Dynamic Pricing RL — Project Documentation

**Final project documentation · Last verified: 2026-10-16**

> ⚠️ **Synthetic-data disclaimer.** Every dataset, model, and number in this project is produced
> from a **synthetic** dataset (87,600 generated rows). All training and evaluation figures are
> simulation results that demonstrate the pipeline only. They make **no claim of real-world
> profitability** and no claim that any algorithm truly outperforms another.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Dataset & demand model](#3-dataset--demand-model)
4. [RL environment specification](#4-rl-environment-specification)
5. [Training (notebook)](#5-training-notebook)
6. [Saved artifacts](#6-saved-artifacts)
7. [Evaluation results](#7-evaluation-results)
8. [API reference](#8-api-reference)
9. [Frontend integration](#9-frontend-integration)
10. [How to run](#10-how-to-run)
11. [Verification & testing summary](#11-verification--testing-summary)
12. [Project structure](#12-project-structure)
13. [Known limitations](#13-known-limitations)

---

## 1. Project overview

A full-stack **dynamic-pricing prototype**: three Reinforcement Learning agents
(**DQN**, **QR-DQN**, **PPO**) learn a 5-action pricing policy in a simulated
inventory/demand environment, a FastAPI backend serves their predictions, and a
React (Vite) frontend lets you request predictions, choose the algorithm, and
compare strategies.

| Capability | Status |
|---|---|
| Train DQN / QR-DQN / PPO in one notebook | ✅ `Dynamic_Pricing_RL_Training.ipynb` (28 cells, fully executed) |
| Save model + support artifacts to `backend/models/` | ✅ with timestamped backups of prior models |
| Multi-algorithm API (`algorithm` field, default `dqn`) | ✅ 400 on invalid values, paths/schemas unchanged |
| Rule-based strategy kept as separate baseline | ✅ never loaded as an RL model |
| Frontend algorithm selector (DQN / QR-DQN / PPO) | ✅ `PricingStrategy` page dropdown |
| No retraining at request time | ✅ models loaded once at startup |

**Key design decisions**

- One shared environment for all three agents: identical 6-value observation, 5 actions,
  reward function, price bounds, and demand model — so results are comparable.
- QR-DQN is a real `sb3_contrib.QRDQN` (distributional RL), not an approximation.
- The observation is the **legacy 6-feature order**
  `[price, inventory, demand, competitor_price, conversion_rate, season_index]`,
  normalized by `obs_scaler.joblib` — the same scaler used by the backend at inference time.
- Smoke-test budget: **1,000 timesteps per algorithm**, fixed **seed 42**, trained sequentially.
- Relative paths only (works outside Colab; no `/content/` references).

---

## 2. Architecture

```
┌──────────────────────────────┐        ┌───────────────────────────────────┐
│  React + Vite frontend :5173 │        │  FastAPI backend  :8000           │
│  src/pages/PricingStrategy   │  HTTP  │  backend/main.py                  │
│  src/utils/api.ts            │ ─────▶ │   ├─ /api/health                  │
│   · algorithm dropdown       │  JSON  │   ├─ /api/predict  (algorithm?)   │
│   · prediction metrics       │ ◀───── │   └─ /api/evaluation              │
│   · evaluation tables        │        │  loads at startup:               │
└──────────────────────────────┘        │   dqn / qrdqn / ppo .zip          │
                                        │   demand_model.joblib             │
                                        │   obs_scaler.joblib               │
                                        │   training_report.json (bounds)   │
                                        └───────────────▲───────────────────┘
                                                        │ artifacts written by
                                        ┌───────────────┴───────────────────┐
                                        │  Dynamic_Pricing_RL_Training.ipynb│
                                        │  sb3 DQN · sb3_contrib QRDQN · PPO│
                                        │  dataset: synthetic CSV (87,600)  │
                                        └───────────────────────────────────┘
```

**Prediction request flow**

1. User selects season/promotion/inventory/prices and an **algorithm** in the UI.
2. `predictPricing(input, algorithm)` POSTs to `/api/predict`.
3. Backend builds the 6-value raw observation → normalizes with `obs_scaler.joblib` →
   `model.predict(...)` returns an action index (0–4).
4. Action maps to a price change (−10% … +10%), clipped to the price bounds; demand comes from
   `demand_model.joblib`; conversion/sales/revenue/reward are computed by the same formulas used
   in training.
5. Response returns to the page and drives the metric cards and charts.

---

## 3. Dataset & demand model

| Property | Value |
|---|---|
| Dataset | `dynamic_pricing_synthetic_dataset.csv` — **87,600 rows**, `synthetic: true` |
| Resolved path used at training | `C:\Users\VENKAT\Downloads\dynamic_pricing_synthetic_dataset.csv` |
| Demand model | `demand_model.joblib` (scikit-learn regressor) |
| Features | `price, competitor_price, inventory, season, promotion, hour, weekday` |
| Holdout MAE | **46.767** |
| Holdout R² | **0.1149** |

The demand model is shared by the training environment **and** the backend, so training-time and
inference-time rewards are computed from the same demand estimates.

---

## 4. RL environment specification

**Observation (6 values, fixed order, normalized by `obs_scaler.joblib`):**

```
[price, inventory, demand, competitor_price, conversion_rate, season_index]
```

`season_index`: regular → 0, summer → 1, monsoon → 2, festival → 3.

**Action space (Discrete 5):**

| Index | Change | Label |
|---|---|---|
| 0 | −10% | Reduce price by 10% |
| 1 | −5% | Reduce price by 5% |
| 2 | 0% | Hold current price |
| 3 | +5% | Increase price by 5% |
| 4 | +10% | Increase price by 10% |

**Price bounds:** `min = 448.15`, `max = 3208.55` (from `training_report.json`; applied as
`clip(price × (1 + change), [min(448.15, price), max(3208.55, price)])`, so asking for a price
below/above the bounds never forces a jump back into the range).

**Reward:**

```
reward = revenue − 0.5 × stockout_penalty − 0.2 × |price_change|
  revenue        = expected_sales × recommended_price
  expected_sales = min(inventory, floor(demand × conversion_rate))
  stockout_penalty = 500 if (inventory − expected_sales) == 0 else 0
```

**Conversion rate (deterministic, identical in training and API):**

```
conversion_rate = clamp(0.15 − 0.00005 × (price − competitor_price), 0.02, 0.40)
```

**Baseline rule-based strategy** stays a separate, non-RL heuristic used only for comparison.

---

## 5. Training (notebook)

**Notebook:** `Dynamic_Pricing_RL_Training.ipynb` — 10 steps, 28 cells, **fully executed with zero errors** (run via `nbconvert`).

| Setting | Value |
|---|---|
| Seed | 42 (fixed) |
| Timesteps per algorithm (`DQN_TIMESTEPS`, `QRDQN_TIMESTEPS`, `PPO_TIMESTEPS`) | **1,000** each |
| Training order | Sequential: DQN → QR-DQN → PPO |
| Paths | Relative (no Colab `/content/`) |
| Backup policy | Existing model backed up as `*.backup_YYYYMMDD_HHMMSS.zip` before overwrite (old models are copied, never renamed into new ones) |

| Algorithm | Class | File | Timesteps | Training time |
|---|---|---|---|---|
| DQN | `stable_baselines3.dqn.dqn.DQN` | `dqn_pricing_model.zip` | 1,000 | 12.3 s |
| QR-DQN | `sb3_contrib.qrdqn.qrdqn.QRDQN` | `qrdqn_pricing_model.zip` | 1,000 | 11.7 s |
| PPO | `stable_baselines3.ppo.ppo.PPO` | `ppo_pricing_model.zip` | 1,000 | 8.3 s |

> Implementation note: for QR-DQN, `n_quantiles` must be passed inside `policy_kwargs`.
> Because the budget is a deliberate smoke test (1,000 steps), expect immature policies — see
> [Known limitations](#13-known-limitations).

---

## 6. Saved artifacts

All artifacts live in `backend/models/`:

| File | Purpose |
|---|---|
| `dqn_pricing_model.zip` | Trained DQN (SB3) |
| `qrdqn_pricing_model.zip` | Trained QR-DQN (`sb3_contrib`) |
| `ppo_pricing_model.zip` | Trained PPO (SB3) |
| `demand_model.joblib` | Demand regressor used by env + API |
| `obs_scaler.joblib` | Observation normalizer (6 features) |
| `training_report.json` | Seeds, timesteps, timings, price bounds, action maps, eval protocol, per-algorithm results |
| `rl_algorithm_summary.csv` | Flat summary table of all 5 strategies |
| `*.backup_*.zip` | Timestamped backups of models from before retraining |
| `README.md` | Short artifact notes |

---

## 7. Evaluation results

Two distinct protocols — **do not mix the numbers**:

### 7a. Notebook evaluation (20 episodes × 30 steps, seeds 10000–10019, held-out initial conditions)

Identical seeds, environment, demand model, and reward for all strategies (see
`training_report.json → evaluation`):

| Strategy | Total revenue | Units sold | Avg selling price | Avg reward | Stockout freq. | Price-change freq. |
|---|---:|---:|---:|---:|---:|---:|
| **PPO** | **19,968,485.92** | 15,359 | 1,300.12 | 997,924.82 | 0.60 | 0.831 |
| Fixed-price baseline | 18,580,446.08 | 16,636 | 1,116.88 | 928,847.30 | 0.70 | 0.000 |
| Rule-based | 18,457,659.88 | 16,666 | 1,107.50 | 922,705.13 | 0.70 | 0.014 |
| DQN | 18,305,611.57 | 16,650 | 1,099.44 | 914,845.98 | 0.60 | 1.000 |
| QR-DQN | 15,074,607.24 | 17,405 | 866.11 | 753,436.91 | 0.65 | 1.000 |

*PPO leads at ~19.97M; QR-DQN trails at ~15.07M — a consequence of the 1,000-step smoke budget,
not evidence of real algorithm superiority.*

### 7b. API evaluation (`GET /api/evaluation` — 7 scenarios × 5 strategies = 35 rows)

Single-step comparison of the **current-price baseline** vs. rule-based and the three RL agents
on the live demand model; this is what the Pricing Strategy dashboard displays:

| Strategy | Total revenue | Sales | Avg revenue impact |
|---|---:|---:|---:|
| Current-price baseline | 260,260.00 | 260 | 0.00% |
| Rule-based | 260,710.45 | 260 | +0.09% |
| DQN | 262,912.65 | 262 | +1.28% |
| QR-DQN | 255,255.00 | 264 | −1.61% |
| **PPO** | **265,665.40** | 257 | **+2.24%** |

**Reproduce:** `python backend/evaluate_strategies.py` (writes `rl_algorithm_summary.csv` from
current model + demand model; uses `build_observation()` from `main.py` so formulas never drift).

---

## 8. API reference

Base URL: `http://localhost:8000` · All routes are under **`/api/`** (note: there is no `/health`).

### `GET /api/health`

```json
{
  "status": "ok",
  "modelLoaded": true,
  "algorithms": ["dqn", "ppo", "qrdqn"],
  "defaultAlgorithm": "dqn",
  "modelPath": "C:\\...\\backend\\models\\dqn_pricing_model.zip",
  "priceBounds": { "min": 448.15, "max": 3208.55 }
}
```

### `POST /api/predict`

Request — `algorithm` is **optional** (`dqn` | `qrdqn` | `ppo`, default `dqn`):

```json
{
  "currentPrice": 1000,
  "inventory": 1000,
  "competitorPrice": 950,
  "season": "festival",
  "promotion": 0,
  "algorithm": "dqn"
}
```

Response (verified example):

```json
{
  "recommendedPrice": 900.0,
  "action": "Reduce price by 10%",
  "actionIndex": 0,
  "actionChange": -0.1,
  "demand": 297,
  "conversionRate": 0.1525,
  "expectedSales": 45,
  "expectedRevenue": 40500.0,
  "reward": 40480.0,
  "currentPrice": 1000.0,
  "baselineRevenue": 43000.0,
  "revenueImpact": -5.8,
  "modelLoaded": true,
  "algorithm": "dqn"
}
```

Errors:

| Case | Code | Body |
|---|---|---|
| `algorithm` not in `dqn, qrdqn, ppo` | **400** | `{"detail":"Unsupported algorithm 'bad'. Supported values: dqn, qrdqn, ppo"}` |
| `season` invalid | **400** | `{"detail":"season must be one of: regular, summer, monsoon, festival"}` |
| Malformed body / wrong types | **422** | FastAPI validation error |

### `GET /api/evaluation`

Returns `scenarioCount`, `summary[]` (`strategy, totalRevenue, totalSales, totalReward,
averageRevenueImpactPct`) and `results[]`
(`scenario, strategy, action, recommendedPrice, sales, revenue, baselineRevenue, revenueImpactPct`) —
**35 rows / 5 strategies**, with the baseline identical across strategies within each scenario.

### CORS

`backend/main.py` allows origins via regex `http://(localhost|127.0.0.1)(:\d+)?` — any local
port, so the Vite dev server moving from 5173 → 5174 (port collision) can never break the app.
Verified: preflight + POST from origin `http://localhost:5174` return
`access-control-allow-origin` correctly.

---

## 8b. Analysis endpoints (server-driven dashboards)

Implemented in `backend/analysis.py` + the `/api/analysis/*` routes in `main.py`. All figures are
computed on the server from real artifacts — **no retraining at request time**. Episode roll-outs
and the monthly batch scoring are cached and invalidated when the models reload.

### `GET /api/analysis/overview`
KPI cards, strategy revenue comparison, and insights — computed from `training_report.json`
(baselines + algorithms) and the live dataset. Fixed-price baseline is the reference for the
improvement %.

### `GET /api/analysis/revenue?n_episodes=30`
Live multi-episode evaluation (`n_episodes` clamped 1–60) across all **5 strategies**
(`Fixed-price baseline`, `Rule-based`, `DQN`, `QR-DQN`, `PPO`), plus a monthly baseline-vs-DQN
uplift table from batch policy scoring over the dataset. Returns:
`{ trend[], comparison[], distribution[], cumulative[], monthly[], meta }`.

### `GET /api/analysis/performance`
Ranked strategy rows (revenue, reward, improvement vs. fixed-price, rank, medal) + a
recommendation and a reward-comparison series for the chart.

### `GET /api/analysis/experiments`
Run history derived from real artifacts: one `RUN-<ALGO>` row per trained model (revenue, reward,
timesteps, training seconds, model file) plus any `*_pricing_model.backup_*.zip` files on disk as
`Archived` rows.

### `GET /api/analysis/reports`
Metadata for the real files in `backend/models/` (title, filename, human size, format, mtime,
availability).

### `GET /api/analysis/reports/{report_id}`
`FileResponse` download for a report id (`summary`, `training_report`, `demand_model`,
`dqn_model`, `qrdqn_model`, `ppo_model`). 404 if the id is unknown or the file is missing.
Sets `Content-Disposition` so the browser downloads rather than renders.

**Honest data only.** The trained strategies are `Fixed-price baseline`, `Rule-based`, `DQN`,
`QR-DQN`, `PPO`. There is **no "Random" baseline** — the earlier prototype's `Random` figures were
fabricated and have been removed.

---

## 9. Frontend integration

Every dashboard is **backend-driven**. Static placeholder figures in `src/data/metrics.ts` and
`src/data/content.ts` were removed; the dashboards now render real values computed by
`backend/analysis.py` from the trained models + dataset + live episode roll-outs.

**New analysis endpoints** (see §8b): `/api/analysis/overview`, `revenue`, `performance`,
`experiments`, `reports`.

**Frontend files:**

| File | Change |
|---|---|
| `src/utils/api.ts` | Added typed fetchers `fetchAnalysisOverview/Revenue/Performance/Experiments/Reports` + `getAnalysisReportUrl`; `fetchAnalysisRevenue` normalises ₹ → millions |
| `src/utils/useAnalysis.ts` | `useAnalysis(fetcher)` fetch-on-mount hook (`data` / `loading` / `error`) |
| `src/components/AsyncBanner.tsx` | Shared loading / backend-unreachable banner |
| `src/types/pricing.ts` | `AlgorithmName` → `StrategyName` (5 strategies); generic series/`TrendPoint` |
| `src/components/charts/RevenueTrendChart.tsx` | Genericised to 5 strategies, configurable `series` |
| `src/components/InsightsPanel.tsx` | Takes `insights` as a prop (API-driven), no longer imports static data |
| `src/data/metrics.ts` · `content.ts` | Reduced to `STRATEGY_COLORS` + `architectureSteps` |

**Live vs. static pages:**

| Page | Data source |
|---|---|
| **Pricing Strategy** | ✅ Live — `/api/predict` + `/api/evaluation` |
| **Overview** | ✅ Live — `/api/analysis/overview` (KPIs, comparison, insights) + `/api/analysis/revenue` (trend) |
| **Revenue Analytics** | ✅ Live — `/api/analysis/revenue` (trend, comparison, distribution, cumulative, monthly table) |
| **Model Performance** | ✅ Live — `/api/analysis/performance` (ranked rows, reward chart, recommendation) |
| **Experiments** | ✅ Live — `/api/analysis/experiments` (run history from real training artifacts) |
| **Reports** | ✅ Live — `/api/analysis/reports` (real file cards + working download) |

The four converted dashboards fetch on mount and show a loading state (live evaluation can take a
few seconds on first run) or an actionable banner if the backend is unreachable. No retraining
happens at request time; episode roll-outs are cached and invalidated on model reload.

---

## 10. How to run

### Prerequisites

- Python env already created at `backend/.venv/` (Python 3.14) with
  `fastapi`, `uvicorn`, `pandas`, `scikit-learn`, `joblib`, `stable-baselines3`,
  `sb3-contrib==2.9.0`, `matplotlib`, `jupyter/nbconvert`
- Node.js for the frontend (`npm install` already done)

### Backend (Terminal 1)

```powershell
cd C:\Users\VENKAT\Desktop\RL_PROJECT\rl_frontend\backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Smoke check: `curl http://127.0.0.1:8000/api/health` → `"modelLoaded": true,
"algorithms": ["dqn","ppo","qrdqn"]`.

### Frontend (Terminal 2)

```powershell
cd C:\Users\VENKAT\Desktop\RL_PROJECT\rl_frontend
npm run dev
```

Open **http://localhost:5173** (or whichever port Vite prints — any localhost port works with
the backend CORS) → **Pricing Strategy** page → use the **RL algorithm** dropdown.

### Re-run training (optional)

```powershell
cd C:\Users\VENKAT\Desktop\RL_PROJECT\rl_frontend
backend\.venv\Scripts\python.exe -m jupyter nbconvert --to notebook --execute --inplace Dynamic_Pricing_RL_Training.ipynb
```

(Existing models are backed up to `*.backup_*.zip` before being overwritten.)

### Re-run strategy evaluation

```powershell
cd C:\Users\VENKAT\Desktop\RL_PROJECT\rl_frontend\backend
.\.venv\Scripts\python.exe evaluate_strategies.py
```

---

## 11. Verification & testing summary

All of the following were executed against the running system (not just reviewed on paper):

| Test | Result |
|---|---|
| Notebook executes end-to-end (10 steps, 28 cells) | ✅ 0 errors |
| Step 10 model reload + action range (all 3 models) | ✅ |
| **Prediction correctness suite** — 8 input scenarios (default, low inv, zero inv, cheap/expensive competitor, near both price bounds, price below dataset min) × 11 field-level assertions + 3 algorithms + defaults + invalid-input cases + evaluation integrity | ✅ **112/112 passed, 0 failed** |
| • `recommendedPrice` recompute (change map + bound clipping) | ✅ every scenario |
| • `conversionRate`, `expectedSales`, `expectedRevenue`, `reward`, `revenueImpact` formulas | ✅ every scenario |
| • `actionIndex`/`actionChange`/label consistency, `demand` in data range | ✅ |
| • omit `algorithm` → defaults to `dqn` | ✅ |
| • `algorithm: "bad"` → **400** with supported-values message | ✅ |
| • invalid `season` → **400** | ✅ |
| • `/api/evaluation` 35 rows / 5 strategies; summary totals = row sums; per-scenario baseline consistency | ✅ |
| CORS preflight + POST from `http://localhost:5174` | ✅ 200 |
| `evaluate_strategies.py` | ✅ |
| `npm run build` (vite) | ✅ |
| Frontend renders only fields the API returns (no undefined metrics) | ✅ verified by source inspection |
| `import backend/analysis.py` | ✅ imports cleanly |
| `analysis.strategy_metrics()` vs `training_report.json` | ✅ exact match on all 5 strategies |
| `analysis.episode_series(30)` | ✅ 30 rows × 5 strategies, per-episode ₹ |
| `analysis.monthly_table("dqn")` | ✅ real monthly baseline-vs-DQN rows |
| `analysis.experiments()` | ✅ `RUN-*` + backup rows from real artifacts |
| `analysis.reports_meta()` | ✅ 6 real files with true sizes/mtimes |
| **Overview analysis** ranking (PPO 19.97M > baselines > DQN > QR-DQN) | ✅ matches `training_report.json` |
| **All `/api/analysis/*` endpoints** (overview, revenue, performance, experiments, reports + file download) | ✅ |
| `npx vite build` after full static→dynamic conversion | ✅ built successfully |

---

## 12. Project structure

```
rl_frontend/
├── Dynamic_Pricing_RL_Training.ipynb   # training notebook (all 3 agents)
├── PROJECT_DOCUMENTATION.md            # this document
├── README.md                           # Vite template readme
├── package.json                        # scripts: dev / build / preview
├── index.html · vite.config.ts · tailwind.config.js · tsconfig*.json
├── src/
│   ├── pages/
│   │   ├── PricingStrategy.tsx         # LIVE: algorithm selector + predictions + evaluation
│   │   ├── Overview.tsx                # LIVE: /api/analysis/overview + revenue
│   │   ├── RevenueAnalytics.tsx        # LIVE: /api/analysis/revenue
│   │   ├── ModelPerformance.tsx        # LIVE: /api/analysis/performance
│   │   ├── Experiments.tsx             # LIVE: /api/analysis/experiments
│   │   └── Reports.tsx                 # LIVE: /api/analysis/reports (+ downloads)
│   ├── utils/api.ts                    # API client (+ analysis fetchers, AlgorithmId)
│   ├── utils/useAnalysis.ts            # fetch-on-mount hook (data/loading/error)
│   ├── utils/simulation.ts             # client-side simulator (independent of API)
│   ├── types/pricing.ts                # shared types (StrategyName, 5 strategies)
│   ├── data/metrics.ts                 # STRATEGY_COLORS + architectureSteps only
│   ├── data/content.ts                 # (static data removed)
│   └── components/                     # UI + charts + AsyncBanner
└── backend/
    ├── main.py                         # FastAPI app (3 models, analysis routes, CORS)
    ├── analysis.py                     # server-side analysis (episodes, reports, experiments)
    ├── evaluate_strategies.py          # baseline comparison script
    ├── requirements.txt                # fastapi, uvicorn, pandas, sklearn, joblib, sb3, sb3-contrib…
    ├── .venv/                          # Python 3.14 virtualenv
    └── models/
        ├── dqn_pricing_model.zip
        ├── qrdqn_pricing_model.zip
        ├── ppo_pricing_model.zip
        ├── demand_model.joblib
        ├── obs_scaler.joblib
        ├── training_report.json
        ├── rl_algorithm_summary.csv
        ├── README.md
        └── *.backup_*.zip              # pre-retraining backups
```

---

## 13. Known limitations

1. **Smoke-test training budget.** 1,000 timesteps per agent is deliberately tiny; policies are
   immature (all agents change price ~100% of the time, stockout frequency 0.60–0.70) and
   QR-DQN's underperformance reflects this, not distributional RL's inherent quality.
   Longer runs are a one-line change (`*_TIMESTEPS`) + notebook re-run.
2. **Demand model is weak.** Holdout R² = 0.1149; demand in this synthetic data is nearly
   price-independent (correlation ≈ −0.007). All revenue effects therefore come mostly from the
   conversion formula, not the learned demand curve.
3. **Synthetic everything.** 87,600 generated rows; no real-world revenue claims (see disclaimer).
4. **Live episode roll-outs are approximate.** The Overview/Revenue Analytics trend, distribution
   and cumulative charts are computed by rolling out the trained policies for `n_episodes` × 30
   steps on the live demand model (cached, seeded). These illustrate policy *behaviour* and differ
   from the notebook's held-out 20-seed evaluation in §7a — do not mix the numbers. The monthly
   table batch-scores the DQN policy over the dataset.
5. **No persistence of requests.** Predictions are stateless; nothing is written to a database.
6. **Pre-existing lint errors.** `tsc --noEmit` reports original unused-import and
   `import.meta.env` typing issues predating this work; `npm run build` (vite) passes and was the
   gate used. These were intentionally left untouched.

---

*Generated for the Dynamic Pricing RL project — backend `FastAPI` + `stable-baselines3` /
`sb3-contrib`, frontend `React + Vite`.*
