# RL Dynamic Pricing — Frontend + DQN Backend

This project connects the React frontend to the **DQN trained in `RL_.ipynb`**.

## Architecture

React/Vite frontend → FastAPI `/api/predict` → Stable-Baselines3 DQN → prediction → frontend cards

The frontend no longer calculates the recommendation with the old TypeScript simulator. The Python backend loads `dqn_pricing_model.zip` produced by the Colab notebook and calls `model.predict(..., deterministic=True)`.

## 1. Export the model from Colab

Run the notebook training cells through:

```python
model.learn(total_timesteps=10000)
model.save("dqn_pricing_model")
```

Then download `dqn_pricing_model.zip` and put it at:

`backend/models/dqn_pricing_model.zip`

## 2. Start backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Ubuntu/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: `http://localhost:8000/api/health`

## 3. Start frontend

From the project root:

```bash
npm install
npm run dev
```

Open the Vite URL, go to **Pricing Strategy**, enter a scenario, and click **Predict with DQN**.

## Important model alignment

The Colab environment uses this 6-value observation:

`[price, inventory, demand, competitor_price, conversion, season_index]`

and five actions:

`-10%, -5%, 0%, +5%, +10%`

The integration preserves those definitions. The frontend therefore uses the notebook's seasons: **Regular, Summer, Monsoon, Festival**, plus the notebook's promotion flag.
