import os
import random
from dotenv import dotenv_values
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import User, AirportZone, SensorReading
from datetime import datetime, timedelta
from passlib.context import CryptContext

# ── Load DATABASE_URL ─────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    config = dotenv_values(r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env")
    DATABASE_URL = config.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine       = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
pwd_context  = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    db = SessionLocal()
    try:
        # ── Seed Users ────────────────────────────────────
        if db.query(User).count() == 0:
            users = [
                User(username="admin",      hashed_password=pwd_context.hash("admin123"),  role="admin"),
                User(username="operations", hashed_password=pwd_context.hash("ops123"),    role="operations"),
                User(username="viewer",     hashed_password=pwd_context.hash("view123"),   role="viewer"),
            ]
            db.add_all(users)
            db.commit()
            print("✅ Users seeded")
        else:
            print("⏭️ Users already exist")

        # ── Seed Zones ────────────────────────────────────
        if db.query(SensorReading).count() == 0:
            locations  = ["Security Checkpoint", "Gate B", "Baggage Claim"]
            sensor_ids = ["S001", "S002", "S003"]
            start_time = datetime.now() - timedelta(days=7)
            readings   = []

            for day in range(7):
                for hour in range(24):
                    for i, location in enumerate(locations):
                        if 7 <= hour <= 9 or 17 <= hour <= 19:
                            base = random.randint(80, 120)
                        elif 10 <= hour <= 16:
                            base = random.randint(40, 70)
                        else:
                            base = random.randint(5, 20)

                        current_day = (start_time + timedelta(days=day)).weekday()
                        if current_day >= 5:
                            base = int(base * 0.7)

                        count = max(0, int(random.gauss(base, 10)))
                        if random.random() < 0.01:
                            count = count * 3

                        readings.append(SensorReading(
                            timestamp       = start_time + timedelta(days=day, hours=hour),
                            sensor_id       = sensor_ids[i],
                            location        = location,
                            passenger_count = count,
                            queue_length    = max(0, count // 5),
                        ))

            db.add_all(readings)
            db.commit()
            print(f"✅ {len(readings)} sensor readings seeded")
        else:
            print("⏭️ Sensor readings already exist")

    except Exception as e:
        print(f"❌ Seed error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
