import asyncio
from ws_manager import manager
from dotenv import dotenv_values
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import SensorReading, SessionLocal
import random
import time
import threading
from datetime import datetime

# ── Sensor Class ──────────────────────────────────────────
class Sensor:
    def __init__(self, sensor_id, location, sensor_type):
        self.sensor_id   = sensor_id
        self.location    = location
        self.sensor_type = sensor_type  # entry_counter / queue_sensor / gate_counter

    def generate_reading(self):
        hour = datetime.now().hour

        # Realistic passenger counts based on time of day
        if 7 <= hour <= 9 or 17 <= hour <= 19:
            base = random.randint(80, 120)   # Rush hour
        elif 10 <= hour <= 16:
            base = random.randint(40, 70)    # Normal hours
        else:
            base = random.randint(5, 20)     # Night time

        # Add natural noise
        count = max(0, int(random.gauss(base, 10)))

        # 1% chance of anomaly spike (3x normal)
        if random.random() < 0.01:
            count = count * 3

        return count


# ── Create 5 Sensor Instances ─────────────────────────────
sensors = [
    Sensor("S001", "Security Checkpoint", "entry_counter"),
    Sensor("S002", "Security Checkpoint", "queue_sensor"),
    Sensor("S003", "Gate B",              "gate_counter"),
    Sensor("S004", "Baggage Claim",       "entry_counter"),
    Sensor("S005", "Check-in",            "entry_counter"),
]


# ── Simulator Loop ────────────────────────────────────────
def run_simulator():
    print("🚀 Simulator started — generating readings every 60 seconds...")
    while True:
        db = SessionLocal()
        try:
            for sensor in sensors:
                count = sensor.generate_reading()

                reading = SensorReading(
                    timestamp       = datetime.now(),
                    sensor_id       = sensor.sensor_id,
                    location        = sensor.location,
                    passenger_count = count,
                    queue_length    = max(0, count // 5),
                )
                db.add(reading)
                # Broadcast to WebSocket clients
                data = {
                     "sensor_id"      : sensor.sensor_id,
                     "location"       : sensor.location,
                     "passenger_count": count,
                     "queue_length"   : max(0, count // 5),
                     "timestamp"      : str(datetime.now())
                     }
                try:
                     asyncio.run(manager.broadcast(data))
                except Exception:
                    pass
                print(f"  ✅ {sensor.location} | {sensor.sensor_id} | passengers: {count}")

            db.commit()
            print(f"💾 Saved at {datetime.now().strftime('%H:%M:%S')} — sleeping 60s...\n")

        except Exception as e:
            print(f"❌ Error: {e}")
            db.rollback()

        finally:
            db.close()

        time.sleep(60)


# ── Run as Background Thread ──────────────────────────────
if __name__ == "__main__":
    t = threading.Thread(target=run_simulator, daemon=True)
    t.start()

    # Keep main thread alive
    print("Simulator running in background. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped.")