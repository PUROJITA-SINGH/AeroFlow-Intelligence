import os
import pickle
from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Prediction
from datetime import datetime

# ── Load DATABASE_URL ─────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    config = dotenv_values(r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env")
    DATABASE_URL = config.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found in generate_predictions.py")

engine       = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ── Load Prophet Models ───────────────────────────────────
ML_DIR = os.environ.get(
    "ML_DIR",
    os.path.join(os.path.dirname(__file__), '..', 'ML_Models')
)

try:
    with open(os.path.join(ML_DIR, 'model_prophet.pkl'), 'rb') as f:
        prophet_models = pickle.load(f)
    print("✅ Prophet models loaded")
except Exception as e:
    print(f"⚠️ Prophet models not found: {e}")
    prophet_models = {}

# ── Generate and Save Predictions ─────────────────────────
def generate_predictions():
    db = SessionLocal()
    try:
        for zone, model in prophet_models.items():
            print(f"🔮 Generating forecast for: {zone}")

            future          = model.make_future_dataframe(periods=24, freq='h')
            forecast        = model.predict(future)
            future_forecast = forecast.tail(24)

            db.query(Prediction).filter(Prediction.location == zone).delete()

            for _, row in future_forecast.iterrows():
                prediction = Prediction(
                    timestamp        = row['ds'],
                    location         = zone,
                    predicted_count  = round(row['yhat'], 2),
                    confidence_level = round(row['yhat_upper'] - row['yhat_lower'], 2)
                )
                db.add(prediction)
            print(f"  ✅ Saved 24 predictions for {zone}")

        db.commit()
        print("\n✅ All predictions saved to database!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_predictions()