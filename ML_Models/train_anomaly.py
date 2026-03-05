from dotenv import dotenv_values
from sqlalchemy import create_engine
import pandas as pd
import pickle
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import os

# ── Load DB ───────────────────────────────────────────────
ENV_PATH = r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env"
config = dotenv_values(ENV_PATH)
DATABASE_URL = config.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# ── Load Data ─────────────────────────────────────────────
print("📦 Loading data from database...")
query = "SELECT timestamp, location, passenger_count, queue_length FROM sensor_readings ORDER BY timestamp ASC"
df = pd.read_sql(query, engine)
df['timestamp'] = pd.to_datetime(df['timestamp'])
print(f"✅ Loaded {len(df)} rows")

# ── Create Features ───────────────────────────────────────
df['hour_of_day'] = df['timestamp'].dt.hour
df['day_of_week'] = df['timestamp'].dt.dayofweek
df['is_weekend']  = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
df['rolling_mean'] = df.groupby('location')['passenger_count'].transform(
    lambda x: x.rolling(window=3, min_periods=1).mean()
)

# ── Use only normal data for training ─────────────────────
# Remove top 1% spikes (the anomalies we simulated)
threshold = df['passenger_count'].quantile(0.99)
normal_df = df[df['passenger_count'] <= threshold].copy()
print(f"✅ Normal readings: {len(normal_df)} | Anomalies removed: {len(df) - len(normal_df)}")

# ── Prepare Features ──────────────────────────────────────
features = ['passenger_count', 'queue_length', 'hour_of_day', 'day_of_week', 'is_weekend', 'rolling_mean']
X_normal = normal_df[features]
X_all    = df[features]

# ── Scale Features ────────────────────────────────────────
scaler = StandardScaler()
X_normal_scaled = scaler.fit_transform(X_normal)
X_all_scaled    = scaler.transform(X_all)

# ── Train Isolation Forest ────────────────────────────────
print("\n🔧 Training Isolation Forest...")
model = IsolationForest(
    contamination = 0.01,
    random_state  = 42,
    n_estimators  = 100
)
model.fit(X_normal_scaled)

# ── Evaluate on full dataset ──────────────────────────────
predictions = model.predict(X_all_scaled)
anomalies   = df[predictions == -1]

print(f"\n📊 Total readings   : {len(df)}")
print(f"📊 Anomalies found  : {len(anomalies)}")
print(f"📊 Anomaly rate     : {len(anomalies)/len(df):.2%}")
print(f"\n🚨 Sample anomalies detected:")
print(anomalies[['timestamp', 'location', 'passenger_count']].head(10))

# ── Save Model + Scaler ───────────────────────────────────
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(OUTPUT_DIR, 'model_anomaly.pkl'), 'wb') as f:
    pickle.dump({'model': model, 'scaler': scaler, 'features': features}, f)

print("\n✅ Anomaly model saved to model_anomaly.pkl")