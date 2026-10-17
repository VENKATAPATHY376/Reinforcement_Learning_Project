
import csv
from pathlib import Path

import numpy as np
import main

OUTPUT = Path(__file__).resolve().parent / "strategy_comparison.csv"

# Same scenarios used in your API tests.
SCENARIOS = [
    {"name": "A - Baseline", "price": 1001, "inventory": 1000, "competitor": 951, "season": "regular", "promotion": 0},
    {"name": "B - Low inventory", "price": 1001, "inventory": 50, "competitor": 951, "season": "regular", "promotion": 0},
    {"name": "C - High inventory", "price": 1001, "inventory": 2000, "competitor": 951, "season": "regular", "promotion": 0},
    {"name": "D - Competitor cheaper", "price": 1001, "inventory": 1000, "competitor": 500, "season": "regular", "promotion": 0},
    {"name": "E - Competitor costlier", "price": 1001, "inventory": 1000, "competitor": 1200, "season": "regular", "promotion": 0},
    {"name": "F - Festival", "price": 1001, "inventory": 1000, "competitor": 951, "season": "festival", "promotion": 0},
    {"name": "G - Promotion", "price": 1001, "inventory": 1000, "competitor": 951, "season": "regular", "promotion": 1},
]


def rule_based_action(s):
    """Transparent benchmark rules; not a learned policy."""
    if s["inventory"] < 100:
        return 2  # Hold when stock is low

    gap = (s["competitor"] - s["price"]) / s["price"]

    if gap < -0.15:
        return 1  # Reduce 5% when competitor is much cheaper
    if gap > 0.10 and s["inventory"] > 500:
        return 3  # Increase 5% when competitor is costlier
    return 2


def evaluate(s, strategy, action):
    price = s["price"]
    inventory = s["inventory"]
    competitor = s["competitor"]
    season = s["season"]
    promotion = s["promotion"]

    new_price = round(price * (1 + main.ACTION_MAP[action]), 2)

    # Demand comes from the trained demand model (demand_model.joblib).
    demand = main.calculate_demand(
        new_price, s["inventory"], s["competitor"], season, s["promotion"]
    )
    conversion = main.calculate_conversion_rate(new_price, competitor)
    sales = main.calculate_sales(demand, conversion, inventory)
    revenue = sales * new_price

    baseline_demand = main.calculate_demand(
        price, s["inventory"], s["competitor"], season, s["promotion"]
    )
    baseline_conversion = main.calculate_conversion_rate(price, competitor)
    baseline_sales = main.calculate_sales(
        baseline_demand, baseline_conversion, inventory
    )
    baseline_revenue = baseline_sales * price

    inventory_after = inventory - sales
    reward = main.calculate_reward(
        sales, new_price, inventory_after, price
    )

    impact = (
        (revenue - baseline_revenue) / baseline_revenue * 100
        if baseline_revenue else 0.0
    )

    return {
        "scenario": s["name"],
        "strategy": strategy,
        "action": main.ACTION_LABELS[action],
        "recommended_price": new_price,
        "demand": demand,
        "sales": sales,
        "revenue": round(revenue, 2),
        "baseline_revenue": round(baseline_revenue, 2),
        "revenue_impact_pct": round(impact, 2),
        "reward": round(reward, 2),
    }


def main_eval():
    main.load_model()
    if main.model is None:
        raise RuntimeError(
            "DQN model not loaded. Check backend/models/dqn_pricing_model.zip"
        )

    rows = []

    for s in SCENARIOS:
        # 6-value normalized observation built exactly like /api/predict does.
        obs = main.build_observation(
            s["price"], s["inventory"], s["competitor"], s["season"], s["promotion"]
        )

        dqn_action, _ = main.model.predict(obs, deterministic=True)
        dqn_action = int(np.asarray(dqn_action).item())

        actions = {
            "Current-price baseline": 2,
            "Rule-based": rule_based_action(s),
            "DQN": dqn_action,
        }

        for strategy, action in actions.items():
            rows.append(evaluate(s, strategy, action))

    fields = list(rows[0].keys())
    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Saved detailed results to: {OUTPUT}")
    print("\nStrategy summary")
    print("-" * 78)

    for strategy in actions:
        group = [r for r in rows if r["strategy"] == strategy]
        total_revenue = sum(r["revenue"] for r in group)
        total_sales = sum(r["sales"] for r in group)
        total_reward = sum(r["reward"] for r in group)
        avg_impact = sum(r["revenue_impact_pct"] for r in group) / len(group)

        print(
            f"{strategy:24} | "
            f"Revenue: {total_revenue:10.2f} | "
            f"Sales: {total_sales:4} | "
            f"Reward: {total_reward:10.2f} | "
            f"Avg impact: {avg_impact:7.2f}%"
        )


if __name__ == "__main__":
    main_eval()
