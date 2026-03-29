from dotenv import dotenv_values
from sqlalchemy import create_engine
import pandas as pd
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report
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
df['timestamp'] = pd.to_datetime(df['timestamp'])
print(f"✅ Loaded {len(df)} rows")

# ── Create Labels ─────────────────────────────────────────
def label_congestion(count):
    if count < 50:
        return 'Low'
    elif count < 100:
        return 'Medium'
    else:
        return 'High'

df['congestion'] = df['passenger_count'].apply(label_congestion)
print(f"📊 Label distribution:\n{df['congestion'].value_counts()}")

# ── Create Features ───────────────────────────────────────
df['hour_of_day']  = df['timestamp'].dt.hour
df['day_of_week']  = df['timestamp'].dt.dayofweek
df['is_weekend']   = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
df['rolling_mean'] = df.groupby('location')['passenger_count'].transform(
    lambda x: x.rolling(window=3, min_periods=1).mean()
)

# ── Prepare X and y ───────────────────────────────────────
features = ['hour_of_day', 'day_of_week', 'is_weekend', 'rolling_mean']
X = df[features]
y = df['congestion']

# ── Train/Test Split ──────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── Train Model ───────────────────────────────────────────
print("\n🔧 Training Random Forest Classifier...")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────
y_pred = clf.predict(X_test)
accuracy  = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall    = recall_score(y_test, y_pred, average='weighted', zero_division=0)

print(f"\n📊 Accuracy  : {accuracy:.2%}")
print(f"📊 Precision : {precision:.2%}")
print(f"📊 Recall    : {recall:.2%}")
print(f"\n📋 Full Report:\n{classification_report(y_test, y_pred, zero_division=0)}")

# ── Save Model ────────────────────────────────────────────
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(OUTPUT_DIR, 'model_classifier.pkl'), 'wb') as f:
    pickle.dump(clf, f)

print("✅ Classifier saved to model_classifier.pkl")