from database import SessionLocal, SensorReading, AirportZone
from datetime import datetime, timedelta
import random

db = SessionLocal()

# ── Step 4a: Add the 3 Airport Zones ─────────────────────
zones = [
    AirportZone(name="Security Checkpoint", capacity=100, zone_type="security"),
    AirportZone(name="Gate B",              capacity=80,  zone_type="gate"),
    AirportZone(name="Baggage Claim",       capacity=120, zone_type="baggage"),
]
db.add_all(zones)
db.commit()
print("✅ Zones added")

# ── Step 4b: Generate 7 days of sensor readings ───────────
locations   = ["Security Checkpoint", "Gate B", "Baggage Claim"]
sensor_ids  = ["S001", "S002", "S003"]
start_time  = datetime.now() - timedelta(days=7)

readings = []
for day in range(7):
    for hour in range(24):
        for i, location in enumerate(locations):

            # Realistic passenger counts based on time of day
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                base = random.randint(80, 120)   # Rush hour
            elif 10 <= hour <= 16:
                base = random.randint(40, 70)    # Normal
            else:
                base = random.randint(5, 20)     # Night

            # Weekend vs Weekday difference
            current_day = (start_time + timedelta(days=day)).weekday()
            if current_day >= 5:   # Saturday / Sunday
                base = int(base * 0.7)

            # Add natural noise
            count = max(0, int(random.gauss(base, 10)))

            # 1% chance of anomaly spike (3× normal)
            if random.random() < 0.01:
                count = count * 3

            timestamp = start_time + timedelta(days=day, hours=hour)

            readings.append(SensorReading(
                timestamp       = timestamp,
                sensor_id       = sensor_ids[i],
                location        = location,
                passenger_count = count,
                queue_length    = max(0, count // 5),
            ))

db.add_all(readings)
db.commit()
db.close()
print(f"✅ {len(readings)} sensor readings seeded successfully!")