# RL Dynamic Pricing — Full-Stack Dashboard

A full-stack **dynamic-pricing prototype**. Three Reinforcement Learning agents
(**DQN**, **QR-DQN**, **PPO**) learn a 5-action pricing policy in a simulated
inventory/demand environment. A **FastAPI** backend serves their predictions and
real evaluation analytics, and a **React (Vite)** frontend visualises everything —
request predictions, compare strategies, and explore live analysis dashboards.

> ⚠️ **Synthetic-data disclaimer.** Every dataset, model, and number in this project is
> produced from a **synthetic** dataset (87,600 generated rows). All figures are simulation
> results that demonstrate the pipeline only. They make **no claim of real-world
> profitability**, and no claim that any algorithm truly outperforms another.

---

## Architecture

```
React / Vite frontend
        │  fetch  (VITE_API_URL, default http://localhost:8000)
        ▼
FastAPI backend  ──►  Stable-Baselines3 models (DQN / QR-DQN / PPO)
        │             + demand model + obs scaler (loaded once at startup)
        ▼
JSON responses  ──►  charts, KPI cards, tables, downloadable reports
```

- The frontend **does no prediction math itself** — it calls the backend and renders.
- All five strategies use one shared environment (identical observation, actions, reward),
  so results are comparable: `Fixed-price baseline`, `Rule-based`, `DQN`, `QR-DQN`, `PPO`.
- Models are loaded **once at startup** — there is **no retraining at request time**.
- Evaluation episodes (20 × 30 steps) are computed by the backend and **cached**.

---

## Repository contents

Everything needed to run the app is committed:

| Path | What it is |
|---|---|
| `src/` | React + TypeScript frontend (pages, components, typed API client) |
| `backend/` | FastAPI app (`main.py`), analysis engine (`analysis.py`), strategy evaluation |
| `backend/models/` | Trained artifacts: `dqn/qrdqn/ppo_pricing_model.zip`, `demand_model.joblib`, `obs_scaler.joblib`, `training_report.json` |
| `dynamic_pricing_synthetic_dataset.csv` | Synthetic dataset (87,600 rows) used for demand + monthly analysis |
| `Dynamic_Pricing_RL_Training.ipynb` | Notebook that trains and evaluates all three agents |
| `PROJECT_DOCUMENTATION.md` | Full technical documentation (architecture, API, results, limitations) |

Not committed (see `.gitignore`): `node_modules/`, `dist/`, `backend/.venv/`,
`__pycache__/`, `.env`, model `*.backup_*.zip`, `backend/strategy_comparison.csv`.

---

## Prerequisites

- **Python 3.10+** (developed on 3.14)
- **Node.js 18+** and npm

---

## Run the backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is now at **http://localhost:8000** (all routes live under `/api/`).
Health check: `http://localhost:8000/api/health`.

*The `.venv/` folder is intentionally not committed — create it with the commands above.*

## Run the frontend

From the project root (a second terminal):

```bash
npm install
npm run dev
```

Open the Vite URL (default **http://localhost:5173**). Any localhost port works — the
backend CORS policy allows all `http://localhost:*` and `http://127.0.0.1:*` origins.

To point the frontend at a different API host, copy `.env.example` to `.env` and set:

```
VITE_API_URL=http://localhost:8000
```

---

## Using the app

- **Overview** — headline KPIs and strategy ranking, computed live from the models.
- **Revenue Analytics** — revenue trend, distribution, and monthly comparisons
  (episodes computed by the backend on the real dataset).
- **Model Performance** — per-strategy metrics and the training protocol.
- **Experiments** — real run history read from the saved artifacts.
- **Reports** — downloadable CSV / JSON artifacts served by the backend.
- **Pricing Strategy** — enter a scenario and get a live recommendation from the
  selected algorithm (DQN / QR-DQN / PPO).

---

## API reference

Base URL `http://localhost:8000` · all routes under `/api/`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service status and loaded models |
| `POST` | `/api/predict` | Price recommendation for a scenario (`algorithm` = `dqn` \| `qrdqn` \| `ppo`) |
| `GET` | `/api/evaluation` | 7 scenarios × 5 strategies comparison table |
| `GET` | `/api/analysis/overview` | Overview KPIs and ranking |
| `GET` | `/api/analysis/revenue?n_episodes=30` | Revenue trend / distribution / monthly data |
| `GET` | `/api/analysis/performance` | Per-strategy performance metrics |
| `GET` | `/api/analysis/experiments` | Run history from artifacts |
| `GET` | `/api/analysis/reports` | Report catalogue |
| `GET` | `/api/analysis/reports/{id}` | Download a report (CSV / JSON) |

---

## Environment specification (model alignment)

The observation is the **6-value** vector used during training:

```
[price, inventory, demand, competitor_price, conversion_rate, season_index]
```

normalised by `obs_scaler.joblib`, with **5 discrete actions**:

```
-10%  -5%  0%  +5%  +10%
```

Seasons: **Regular, Summer, Monsoon, Festival** (plus the promotion flag).

---

## Project structure

```
rl_frontend/
├── backend/
│   ├── main.py                  # FastAPI app + all /api routes
│   ├── analysis.py              # real analysis engine (episodes, monthly, reports)
│   ├── evaluate_strategies.py   # offline strategy comparison
│   ├── requirements.txt
│   └── models/                  # trained artifacts (committed)
├── src/
│   ├── pages/                   # Overview, RevenueAnalytics, ModelPerformance,…
│   ├── components/              # charts, layout, shared UI
│   ├── utils/api.ts             # typed API client
│   ├── utils/useAnalysis.ts     # fetch-on-mount hook
│   └── data/metrics.ts          # strategy colours + static config
├── dynamic_pricing_synthetic_dataset.csv
├── Dynamic_Pricing_RL_Training.ipynb
└── PROJECT_DOCUMENTATION.md
```

---

## Optional: re-run training / evaluation

```bash
# Re-play the training notebook end-to-end
backend\.venv\Scripts\python.exe -m jupyter nbconvert --to notebook --execute --inplace Dynamic_Pricing_RL_Training.ipynb

# Re-run the offline strategy comparison (writes backend/strategy_comparison.csv)
cd backend
.\.venv\Scripts\python.exe evaluate_strategies.py
```

See **`PROJECT_DOCUMENTATION.md`** for full details, the API schema, evaluation
results, and known limitations.
