from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Prediction
from datetime import datetime
import pickle
import os

# ── Load DB ───────────────────────────────────────────────
ENV_PATH = r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env"
config = dotenv_values(ENV_PATH)
DATABASE_URL = config.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ── Load Prophet Models ───────────────────────────────────
ML_DIR = r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\ML_Models"
with open(os.path.join(ML_DIR, 'model_prophet.pkl'), 'rb') as f:
    prophet_models = pickle.load(f)

print("✅ Prophet models loaded")

# ── Generate and Save Predictions ─────────────────────────
db = SessionLocal()

try:
    for zone, model in prophet_models.items():
        print(f"🔮 Generating forecast for: {zone}")

        # Generate 24 hour forecast
        future   = model.make_future_dataframe(periods=24, freq='h')
        forecast = model.predict(future)

        # Get only the future 24 hours
        future_forecast = forecast.tail(24)

        # Delete old predictions for this zone
        db.query(Prediction).filter(Prediction.location == zone).delete()

        # Save new predictions
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