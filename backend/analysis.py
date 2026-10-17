"""Backend analysis layer.

Computes every dashboard figure on the server from the real artifacts:
  * training_report.json  -> per-strategy evaluation metrics
  * rl_algorithm_summary.csv -> flat summary table
  * the synthetic dataset -> monthly baseline + product counts
  * live episode roll-outs -> per-episode revenue for all 5 strategies
  * model batch scoring   -> monthly optimised revenue

No training happens here; results are cached and invalidated when models reload.
"""

import json
import os
import random
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(BASE_DIR / "models")))

DATASET_PATH_CANDIDATES = [
    BASE_DIR.parent / "dynamic_pricing_synthetic_dataset.csv",
    MODELS_DIR.parent.parent / "dynamic_pricing_synthetic_dataset.csv",
    Path("C:/Users/VENKAT/Downloads/dynamic_pricing_synthetic_dataset.csv"),
    Path("C:/Users/VENKAT/Desktop/RL_PROJECT/dynamic_pricing_synthetic_dataset.csv"),
]
DATASET_PATH: Optional[Path] = None
for _cand in DATASET_PATH_CANDIDATES:
    if _cand.exists():
        DATASET_PATH = _cand
        break

REPORT_PATH = MODELS_DIR / "training_report.json"
SUMMARY_CSV_PATH = MODELS_DIR / "rl_algorithm_summary.csv"

SEASONS = ["regular", "summer", "monsoon", "festival"]
ACTION_MAP = {0: -0.10, 1: -0.05, 2: 0.0, 3: 0.05, 4: 0.10}
ACTION_LABELS = {
    0: "Reduce price by 10%",
    1: "Reduce price by 5%",
    2: "Hold current price",
    3: "Increase price by 5%",
    4: "Increase price by 10%",
}
ALGO_LABELS = {"dqn": "DQN", "qrdqn": "QR-DQN", "ppo": "PPO"}
LABEL_TO_ALGO = {v: k for k, v in ALGO_LABELS.items()}
STRATEGY_ORDER = ["Fixed-price baseline", "Rule-based", "DQN", "QR-DQN", "PPO"]
RL_STRATEGIES = ["DQN", "QR-DQN", "PPO"]
STRATEGY_COLORS = {
    "Fixed-price baseline": "#64748B",
    "Rule-based": "#06B6D4",
    "DQN": "#10B981",
    "QR-DQN": "#6366F1",
    "PPO": "#F59E0B",
}
MODEL_FEATURES = ["price", "competitor_price", "inventory", "season", "promotion", "hour", "weekday"]

_cache: Dict[str, Any] = {
    "episode_series": None,
    "monthly": None,
    "reports_meta": None,
    "experiments": None,
    "last_models_sig": None,
    "models": {},
    "demand_model": None,
    "obs_scaler": None,
    "price_bounds": {"min": 448.15, "max": 3208.55},
}


# --------------------------------------------------------------------------- #
# artifact access
# --------------------------------------------------------------------------- #
def _training_report() -> Dict[str, Any]:
    try:
        if REPORT_PATH.exists():
            return json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}


def _get_dataset() -> pd.DataFrame:
    if not (DATASET_PATH and DATASET_PATH.exists()):
        return pd.DataFrame()
    df = pd.read_csv(DATASET_PATH)
    if "season" in df.columns:
        df["season"] = df["season"].astype(str).str.lower()
    for col in ("promotion", "inventory", "sales"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    for col in ("price", "competitor_price", "demand", "revenue", "conversion_rate"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    return df


def _month_label(ts) -> str:
    try:
        return pd.Timestamp(ts).strftime("%b %Y")
    except Exception:
        return "Unknown"


# --------------------------------------------------------------------------- #
# shared formulas (identical to main.py / the training notebook)
# --------------------------------------------------------------------------- #
def _conv(price: float, competitor: float) -> float:
    return max(0.02, min(0.40, 0.15 - 0.00005 * (price - competitor)))


def _apply_bounds(current_price: float, recommended: float) -> float:
    bounds = _cache["price_bounds"] or {}
    low = min(float(bounds.get("min", 448.15)), float(current_price))
    high = max(float(bounds.get("max", 3208.55)), float(current_price))
    return round(min(max(float(recommended), low), high), 2)


def _rule_based_action(price: float, inventory: int, competitor: float) -> int:
    if inventory < 100:
        return 2
    gap = (competitor - price) / price if price else 0.0
    if gap < -0.15:
        return 1
    if gap > 0.10 and inventory > 500:
        return 3
    return 2


def _demand_fn():
    dm = _cache["demand_model"]

    def calc(price, inventory, competitor, season, promotion, hour, weekday) -> int:
        if dm is None:
            base = (
                200.0
                + (1000.0 - price) / 5.0
                + (competitor - price) / 3.0
                + 50.0 * (1 if promotion else 0)
                + 20.0 * weekday
                - 10.0 * hour
            )
            return int(max(0.0, min(1000.0, base)))
        row = pd.DataFrame([{
            "price": float(price),
            "competitor_price": float(competitor),
            "inventory": float(inventory),
            "season": str(season),
            "promotion": int(promotion),
            "hour": int(hour),
            "weekday": int(weekday),
        }])
        return int(max(0.0, float(dm.predict(row[MODEL_FEATURES])[0])))

    return calc


def init_from_main(models: Dict, demand_model, obs_scaler, price_bounds) -> None:
    """Seed the analysis layer with the objects loaded by main.load_model()."""
    _cache["models"] = models or {}
    _cache["demand_model"] = demand_model
    _cache["obs_scaler"] = obs_scaler
    _cache["price_bounds"] = price_bounds or {"min": 448.15, "max": 3208.55}
    _cache["last_models_sig"] = _models_sig()
    _cache["episode_series"] = None
    _cache["monthly"] = None
    _cache["reports_meta"] = None
    _cache["experiments"] = None


def _models_sig() -> str:
    sig = ",".join(sorted((_cache["models"] or {}).keys()))
    if _cache["demand_model"] is not None:
        sig += "|demand"
    if _cache["obs_scaler"] is not None:
        sig += "|scaler"
    return sig


def _fresh(key: str):
    if _cache[key] is not None and _cache["last_models_sig"] == _models_sig():
        return _cache[key]
    return None


# --------------------------------------------------------------------------- #
# live episode roll-out
# --------------------------------------------------------------------------- #
def _run_episode(strategy: str, seed: int, max_steps: int = 30):
    rng = random.Random(seed)
    price = round(float(rng.uniform(800, 1400)), 2)
    inventory = int(rng.choice([800, 900, 1000, 1200, 1500]))
    competitor = round(float(rng.uniform(max(400.0, price * 0.5), min(2000.0, price * 1.5))), 2)
    season = rng.choice(SEASONS)
    promotion = rng.choice([0, 1]) if rng.random() < 0.4 else 0

    models = _cache["models"] or {}
    scaler = _cache["obs_scaler"]
    demand = _demand_fn()

    current_price = price
    current_inventory = inventory
    total_revenue = 0.0
    total_reward = 0.0
    units = 0

    for _ in range(max_steps):
        if current_inventory <= 0:
            break
        hour = rng.randint(0, 23)
        weekday = rng.randint(0, 6)

        if strategy == "Fixed-price baseline":
            action = 2
        elif strategy == "Rule-based":
            action = _rule_based_action(current_price, current_inventory, competitor)
        else:
            model = models.get(LABEL_TO_ALGO.get(strategy, ""))
            if model is None or scaler is None:
                action = 2
            else:
                d = demand(current_price, current_inventory, competitor, season, promotion, hour, weekday)
                c = _conv(current_price, competitor)
                raw = np.array(
                    [[current_price, current_inventory, d, competitor, c, SEASONS.index(season)]],
                    dtype=np.float32,
                )
                obs = scaler.transform(raw).astype(np.float32)
                predicted, _ = model.predict(obs, deterministic=True)
                action = int(np.asarray(predicted).item())

        recommended = _apply_bounds(current_price, current_price * (1.0 + ACTION_MAP.get(action, 0.0)))
        d_rec = demand(recommended, current_inventory, competitor, season, promotion, hour, weekday)
        c_rec = _conv(recommended, competitor)
        sales = min(current_inventory, int(d_rec * c_rec))
        revenue = sales * recommended
        inventory_after = current_inventory - sales
        reward = revenue - 0.5 * (500 if inventory_after == 0 else 0) - 0.2 * abs(recommended - current_price)

        units += sales
        total_revenue += revenue
        total_reward += reward
        current_inventory = inventory_after
        current_price = recommended

    return total_revenue, total_reward, units


def episode_series(n_episodes: int = 20) -> Dict[str, Any]:
    cached = _fresh("episode_series")
    if cached and cached.get("episodes") == n_episodes:
        return cached

    rng = random.Random(1234)
    trend: List[Dict[str, Any]] = []
    for episode in range(1, n_episodes + 1):
        seed = 20000 + episode * 31 + rng.randint(1, 1000)
        point: Dict[str, Any] = {"episode": episode}
        for strategy in STRATEGY_ORDER:
            revenue, reward, units = _run_episode(strategy, seed, 30)
            point[strategy] = round(float(revenue), 2)
            point[f"{strategy}__reward"] = round(float(reward), 2)
        trend.append(point)

    payload = {"trend": trend, "episodes": n_episodes, "steps": 30, "seed": 1234}
    _cache["episode_series"] = payload
    _cache["last_models_sig"] = _models_sig()
    return payload


# --------------------------------------------------------------------------- #
# monthly baseline vs optimised (batch policy scoring over the dataset)
# --------------------------------------------------------------------------- #
def monthly_table(algorithm: str = "dqn") -> List[Dict[str, Any]]:
    cached = _fresh("monthly")
    if cached:
        return cached

    df = _get_dataset()
    if df.empty or "timestamp" not in df.columns:
        return []

    work = df.dropna(subset=["timestamp"]).copy()
    if work.empty:
        return []

    work["month"] = work["timestamp"].dt.strftime("%Y-%m")
    label_map = {m: _month_label(ts) for m, ts in zip(work["month"], work["timestamp"])}
    baseline_revenue = work.groupby("month")["revenue"].sum()

    optimized_revenue = None
    model = (_cache["models"] or {}).get(algorithm)
    scaler = _cache["obs_scaler"]
    dm = _cache["demand_model"]

    if model is not None and scaler is not None and dm is not None:
        try:
            prices = work["price"].to_numpy(dtype=float)
            competitors = work["competitor_price"].to_numpy(dtype=float)
            inventories = work["inventory"].to_numpy(dtype=float)
            seasons = work["season"].astype(str).to_numpy()
            promotions = work["promotion"].to_numpy()
            hours = (work["timestamp"].dt.hour.to_numpy() if "hour" not in work.columns else work["hour"].to_numpy())
            weekdays = (work["timestamp"].dt.weekday.to_numpy() if "weekday" not in work.columns else work["weekday"].to_numpy())

            conv_now = np.clip(0.15 - 0.00005 * (prices - competitors), 0.02, 0.40)
            season_idx = np.array([SEASONS.index(s) if s in SEASONS else 0 for s in seasons], dtype=np.float32)
            raw = np.column_stack([prices, inventories, prices * 0.0, competitors, conv_now, season_idx]).astype(np.float32)
            # demand feature for the observation uses the model with the *current* price
            demand_frame = pd.DataFrame({
                "price": prices,
                "competitor_price": competitors,
                "inventory": inventories,
                "season": seasons,
                "promotion": promotions,
                "hour": hours,
                "weekday": weekdays,
            })
            demand_now = np.maximum(0.0, dm.predict(demand_frame[MODEL_FEATURES]))
            raw[:, 2] = demand_now
            obs = scaler.transform(raw).astype(np.float32)

            actions, _ = model.predict(obs, deterministic=True)
            actions = np.asarray(actions).reshape(-1).astype(int)
            changes = np.array([ACTION_MAP.get(int(a), 0.0) for a in actions], dtype=float)

            bounds = _cache["price_bounds"] or {}
            low = np.minimum(float(bounds.get("min", 448.15)), prices)
            high = np.maximum(float(bounds.get("max", 3208.55)), prices)
            rec = np.round(np.clip(prices * (1.0 + changes), low, high), 2)

            rec_frame = demand_frame.copy()
            rec_frame["price"] = rec
            demand_rec = np.maximum(0.0, dm.predict(rec_frame[MODEL_FEATURES]))
            conv_rec = np.clip(0.15 - 0.00005 * (rec - competitors), 0.02, 0.40)
            sales = np.minimum(inventories, np.floor(demand_rec * conv_rec))
            policy_revenue = sales * rec

            scored = pd.DataFrame({"month": work["month"].to_numpy(), "revenue": policy_revenue})
            optimized_revenue = scored.groupby("month")["revenue"].sum()
        except Exception:
            optimized_revenue = None

    rows: List[Dict[str, Any]] = []
    for month in sorted(baseline_revenue.index):
        base = float(baseline_revenue.loc[month])
        opt = float(optimized_revenue.loc[month]) if optimized_revenue is not None and month in optimized_revenue.index else base
        uplift = ((opt - base) / base * 100.0) if base else 0.0
        rows.append({
            "month": label_map.get(month, month),
            "monthKey": month,
            "baseline": round(base, 2),
            "optimized": round(opt, 2),
            "uplift": round(uplift, 1),
        })

    _cache["monthly"] = rows
    return rows


# --------------------------------------------------------------------------- #
# reports + experiments (real files on disk)
# --------------------------------------------------------------------------- #
def reports_meta() -> List[Dict[str, Any]]:
    cached = _fresh("reports_meta")
    if cached:
        return cached

    catalog = [
        ("summary", "RL algorithm summary", "rl_algorithm_summary.csv",
         "Flat comparison of every strategy: revenue, units, reward, stockouts and timings."),
        ("training_report", "Training report", "training_report.json",
         "Seeds, timesteps, price bounds, action map and per-algorithm evaluation metrics."),
        ("demand_model", "Demand model", "demand_model.joblib",
         "Trained demand regressor shared by the environment, API and analysis layer."),
        ("dqn_model", "DQN model", "dqn_pricing_model.zip",
         "Trained Deep Q-Network pricing policy."),
        ("qrdqn_model", "QR-DQN model", "qrdqn_pricing_model.zip",
         "Trained distributional QR-DQN pricing policy."),
        ("ppo_model", "PPO model", "ppo_pricing_model.zip",
         "Trained Proximal Policy Optimization pricing policy."),
    ]

    rows = []
    for report_id, title, filename, description in catalog:
        path = MODELS_DIR / filename
        exists = path.exists()
        stat = path.stat() if exists else None
        rows.append({
            "id": report_id,
            "title": title,
            "filename": filename,
            "description": description,
            "size": _human_size(stat.st_size) if stat else "—",
            "bytes": stat.st_size if stat else 0,
            "format": path.suffix.lstrip(".").upper(),
            "updated": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M") if stat else "—",
            "available": exists,
        })

    _cache["reports_meta"] = rows
    return rows


def _human_size(num: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num < 1024 or unit == "GB":
            return f"{num:.1f} {unit}" if unit != "B" else f"{num} B"
        num /= 1024.0
    return f"{num:.1f} GB"


def experiments() -> List[Dict[str, Any]]:
    cached = _fresh("experiments")
    if cached:
        return cached

    report = _training_report()
    rows: List[Dict[str, Any]] = []
    algorithms = report.get("algorithms", {})

    for key, label in ALGO_LABELS.items():
        entry = algorithms.get(key, {})
        evaluation = entry.get("evaluation", {})
        rows.append({
            "id": f"RUN-{label.replace('-', '')}",
            "algorithm": label,
            "revenue": round(float(evaluation.get("total_revenue", 0.0)) / 1e6, 2),
            "reward": round(float(evaluation.get("avg_reward", 0.0)) / 1e6, 2),
            "status": "Completed" if entry else "Pending",
            "createdDate": report.get("generated_at", "—"),
            "episodes": int(entry.get("timesteps", 0)),
            "timesteps": int(entry.get("timesteps", 0)),
            "trainingSeconds": entry.get("training_seconds"),
            "owner": "local",
            "modelFile": entry.get("model_file", "—"),
        })

    for backup in sorted(MODELS_DIR.glob("*_pricing_model.backup_*.zip")):
        name = backup.name
        algo_key = name.split("_pricing_model")[0]
        label = ALGO_LABELS.get(algo_key, algo_key.upper())
        stamp = name.split("backup_")[-1].replace(".zip", "")
        try:
            created = datetime.strptime(stamp, "%Y%m%d_%H%M%S").strftime("%Y-%m-%d %H:%M")
        except Exception:
            created = stamp
        rows.append({
            "id": f"BACKUP-{label}-{stamp}",
            "algorithm": label,
            "revenue": None,
            "reward": None,
            "status": "Archived",
            "createdDate": created,
            "episodes": None,
            "timesteps": None,
            "trainingSeconds": None,
            "owner": "local",
            "modelFile": name,
        })

    rows.sort(key=lambda r: str(r["createdDate"]), reverse=True)
    _cache["experiments"] = rows
    return rows


def strategy_metrics() -> List[Dict[str, Any]]:
    """Per-strategy totals from the training report (single source of truth)."""
    report = _training_report()
    algorithms = report.get("algorithms", {})
    baselines = report.get("baselines", {})

    lookups = [
        ("Fixed-price baseline", baselines.get("fixed_price", {})),
        ("Rule-based", baselines.get("rule_based", {})),
        ("DQN", algorithms.get("dqn", {}).get("evaluation", {})),
        ("QR-DQN", algorithms.get("qrdqn", {}).get("evaluation", {})),
        ("PPO", algorithms.get("ppo", {}).get("evaluation", {})),
    ]

    rows = []
    for name, data in lookups:
        rows.append({
            "strategy": name,
            "totalRevenue": float(data.get("total_revenue", 0.0)),
            "unitsSold": int(data.get("units_sold", 0)),
            "avgSellingPrice": float(data.get("avg_selling_price", 0.0)),
            "avgReward": float(data.get("avg_reward", 0.0)),
            "stockoutFrequency": float(data.get("stockout_frequency", 0.0)),
            "remainingInventory": float(data.get("remaining_inventory", 0.0)),
            "priceChangeFrequency": float(data.get("price_change_frequency", 0.0)),
            "color": STRATEGY_COLORS.get(name, "#64748B"),
        })
    return rows


def protocol() -> Dict[str, Any]:
    report = _training_report()
    evaluation = report.get("evaluation", {})
    return {
        "episodes": evaluation.get("episodes", 20),
        "maxSteps": evaluation.get("max_steps_per_episode", 30),
        "seeds": evaluation.get("seeds", []),
        "generatedAt": report.get("generated_at"),
        "datasetRows": report.get("dataset", {}).get("rows_used"),
        "synthetic": report.get("dataset", {}).get("synthetic", True),
        "demandR2": report.get("observation", {}).get("demand_holdout_r2"),
        "demandMae": report.get("observation", {}).get("demand_holdout_mae"),
        "seed": report.get("seed"),
    }
