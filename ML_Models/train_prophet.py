from dotenv import dotenv_values
from sqlalchemy import create_engine
import pandas as pd
import pickle
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_error
import numpy as np
import sys
import os

# ── Load DB ───────────────────────────────────────────────
ENV_PATH = r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env"
config = dotenv_values(ENV_PATH)
DATABASE_URL = config.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# ── Load Data ─────────────────────────────────────────────
print("📦 Loading data from database...")
query = "SELECT timestamp, location, passenger_count FROM sensor_readings ORDER BY timestamp ASC"
df = pd.read_sql(query, engine)
print(f"✅ Loaded {len(df)} rows")

# ── Train one model per zone ──────────────────────────────
zones = df['location'].unique()
print(f"📍 Zones found: {zones}")

models = {}
metrics = {}

for zone in zones:
    print(f"\n🔧 Training Prophet model for: {zone}")

    zone_df = df[df['location'] == zone][['timestamp', 'passenger_count']].copy()
    zone_df.columns = ['ds', 'y']
    zone_df['ds'] = pd.to_datetime(zone_df['ds'])

    # Remove anomaly spikes for cleaner training
    zone_df = zone_df[zone_df['y'] < zone_df['y'].quantile(0.99)]

    # ── Train/Test Split ──────────────────────────────────
    split = int(len(zone_df) * 0.8)
    train_df = zone_df[:split]
    test_df  = zone_df[split:]

    # ── Train Prophet ─────────────────────────────────────
    model = Prophet(
        daily_seasonality  = True,
        weekly_seasonality = True,
        changepoint_prior_scale = 0.05
    )
    model.fit(train_df)

    # ── Evaluate ──────────────────────────────────────────
    future   = model.make_future_dataframe(periods=len(test_df), freq='h')
    forecast = model.predict(future)

    predicted = forecast['yhat'].tail(len(test_df)).values
    actual    = test_df['y'].values

    rmse = np.sqrt(mean_squared_error(actual, predicted))
    mae  = mean_absolute_error(actual, predicted)

    print(f"  📊 RMSE: {rmse:.2f} | MAE: {mae:.2f}")

    models[zone]  = model
    metrics[zone] = {"rmse": round(rmse, 2), "mae": round(mae, 2)}

# ── Save Models ───────────────────────────────────────────
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(OUTPUT_DIR, 'model_prophet.pkl'), 'wb') as f:
    pickle.dump(models, f)

print("\n✅ Prophet models saved to model_prophet.pkl")
print("\n📊 Final Metrics:")
for zone, m in metrics.items():
    print(f"  {zone}: RMSE={m['rmse']} | MAE={m['mae']}")