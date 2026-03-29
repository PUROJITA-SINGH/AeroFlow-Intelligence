import os
from dotenv import dotenv_values
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker

# ── DEBUG ─────────────────────────────────────────────────
print("=== ENVIRONMENT DEBUG ===")
print("DATABASE_URL from environ:", os.environ.get("DATABASE_URL"))
print("All env keys:", list(os.environ.keys()))
print("=========================")

# ── Load DATABASE_URL ─────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    print("⚠️ Not found in os.environ, trying .env file...")
    config = dotenv_values(r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env")
    DATABASE_URL = config.get("DATABASE_URL")

if not DATABASE_URL:
    print("⚠️ Not found in .env file either, trying current directory...")
    config2 = dotenv_values(".env")
    DATABASE_URL = config2.get("DATABASE_URL")

# ── Fix Render postgres:// → postgresql:// ────────────────
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    print("✅ Fixed postgres:// to postgresql://")

print("FINAL DATABASE_URL:", DATABASE_URL)

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found in any source.")

# ── Connect to PostgreSQL ─────────────────────────────────
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ── Table 1: sensor_readings ──────────────────────────────
class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id              = Column(Integer, primary_key=True, index=True)
    timestamp       = Column(DateTime)
    sensor_id       = Column(String)
    location        = Column(String)
    passenger_count = Column(Integer)
    queue_length    = Column(Integer)

    __table_args__ = (
        Index('idx_timestamp', 'timestamp'),
        Index('idx_location',  'location'),
    )

# ── Table 2: predictions ──────────────────────────────────
class Prediction(Base):
    __tablename__ = "predictions"

    id               = Column(Integer, primary_key=True, index=True)
    timestamp        = Column(DateTime)
    location         = Column(String)
    predicted_count  = Column(Float)
    confidence_level = Column(Float)

# ── Table 3: alerts ───────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id        = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    severity  = Column(String)
    location  = Column(String)
    message   = Column(Text)
    status    = Column(String)

# ── Table 4: airport_zones ────────────────────────────────
class AirportZone(Base):
    __tablename__ = "airport_zones"

    zone_id   = Column(Integer, primary_key=True, index=True)
    name      = Column(String)
    capacity  = Column(Integer)
    zone_type = Column(String)

# ── Table 5: users ────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True)
    hashed_password = Column(String)
    role            = Column(String)

# ── Create ALL tables ─────────────────────────────────────
Base.metadata.create_all(engine)
print("✅ All tables created successfully!")