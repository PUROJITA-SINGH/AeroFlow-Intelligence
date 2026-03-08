import os
import time
import pickle
import threading
import numpy as np
import pandas as pd
from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Alert, SensorReading, AirportZone
from datetime import datetime

# ── Load DATABASE_URL ─────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    config = dotenv_values(r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env")
    DATABASE_URL = config.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found in alert_engine.py")

engine       = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ── Load ML Models ────────────────────────────────────────
ML_DIR = os.environ.get("ML_DIR", os.path.join(os.path.dirname(__file__), '..', 'ML_Models'))

print("📦 Loading ML models...")
try:
    with open(os.path.join(ML_DIR, 'model_anomaly.pkl'), 'rb') as f:
        anomaly_data     = pickle.load(f)
        anomaly_model    = anomaly_data['model']
        anomaly_scaler   = anomaly_data['scaler']
        anomaly_features = anomaly_data['features']

    with open(os.path.join(ML_DIR, 'model_prophet.pkl'), 'rb') as f:
        prophet_models = pickle.load(f)

    print("✅ ML models loaded")
except Exception as e:
    print(f"⚠️ ML models not found: {e}")
    anomaly_model  = None
    prophet_models = {}

# ── Helper: Create Alert if not duplicate ─────────────────
def create_alert_if_new(db, severity, location, message):
    existing = db.query(Alert).filter(
        Alert.severity == severity,
        Alert.location == location,
        Alert.message  == message,
        Alert.status   == "Active"
    ).first()

    if not existing:
        alert = Alert(
            timestamp = datetime.now(),
            severity  = severity,
            location  = location,
            message   = message,
            status    = "Active"
        )
        db.add(alert)
        print(f"  🚨 New {severity} alert at {location}: {message}")
    else:
        print(f"  ⏭️ Duplicate alert skipped: {location}")

# ── Helper: Auto resolve alerts ───────────────────────────
def auto_resolve_alerts(db, location, current_count, capacity):
    if current_count <= capacity * 1.2:
        active_alerts = db.query(Alert).filter(
            Alert.location == location,
            Alert.status   == "Active",
            Alert.severity.in_(["Critical", "Warning"])
        ).all()
        for alert in active_alerts:
            alert.status = "Resolved"
            print(f"  ✅ Auto-resolved alert at {location}")

# ── Main Alert Check Function ─────────────────────────────
def check_and_create_alerts():
    db = SessionLocal()
    try:
        print(f"\n🔍 Running alert check at {datetime.now().strftime('%H:%M:%S')}")

        zones = db.query(AirportZone).all()

        for zone in zones:
            latest = (
                db.query(SensorReading)
                .filter(SensorReading.location == zone.name)
                .order_by(SensorReading.timestamp.desc())
                .first()
            )

            if not latest:
                continue

            count    = latest.passenger_count
            capacity = zone.capacity

            # ── Rule 1: Critical — Over capacity ──────────
            if count > capacity * 1.2:
                create_alert_if_new(
                    db, "Critical", zone.name,
                    f"Passenger count {count} exceeds 120% of capacity ({capacity})"
                )
            else:
                auto_resolve_alerts(db, zone.name, count, capacity)

            # ── Rule 2: Warning — Long queue ──────────────
            if latest.queue_length > 20:
                create_alert_if_new(
                    db, "Warning", zone.name,
                    f"Queue length {latest.queue_length} exceeds 20 minute wait"
                )

            # ── Rule 3: Predictive — Prophet forecast ─────
            if prophet_models and zone.name in prophet_models:
                try:
                    model    = prophet_models[zone.name]
                    future   = model.make_future_dataframe(periods=2, freq='h')
                    forecast = model.predict(future)
                    next_hour = forecast['yhat'].iloc[-1]

                    if next_hour > 100:
                        create_alert_if_new(
                            db, "Info", zone.name,
                            f"AI predicts High congestion in next 60 mins (forecast: {int(next_hour)} passengers)"
                        )
                except Exception as e:
                    print(f"⚠️ Prophet error for {zone.name}: {e}")

            # ── Rule 4: Anomaly Detection ─────────────────
            if anomaly_model:
                try:
                    hour       = latest.timestamp.hour
                    day        = latest.timestamp.weekday()
                    is_weekend = 1 if day >= 5 else 0

                    features_values = pd.DataFrame([[
                        count,
                        latest.queue_length,
                        hour,
                        day,
                        is_weekend,
                        count
                    ]], columns=anomaly_features)

                    scaled = anomaly_scaler.transform(features_values)
                    result = anomaly_model.predict(scaled)

                    if result[0] == -1:
                        create_alert_if_new(
                            db, "Critical", zone.name,
                            f"Anomaly detected! Unusual passenger count: {count}"
                        )
                except Exception as e:
                    print(f"⚠️ Anomaly detection error: {e}")

        db.commit()
        print("✅ Alert check complete")

    except Exception as e:
        print(f"❌ Alert engine error: {e}")
        db.rollback()
    finally:
        db.close()

# ── Run Every 5 Minutes ───────────────────────────────────
def run_alert_engine():
    print("🚀 Alert engine started — checking every 5 minutes...")
    while True:
        check_and_create_alerts()
        time.sleep(300)

# ── Run as standalone ─────────────────────────────────────
if __name__ == "__main__":
    t = threading.Thread(target=run_alert_engine, daemon=True)
    t.start()
    print("Alert engine running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Alert engine stopped.")