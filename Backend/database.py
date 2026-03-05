from dotenv import dotenv_values
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# ── Load .env ─────────────────────────────────────────────
ENV_PATH = r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\.env"
config = dotenv_values(ENV_PATH)
DATABASE_URL = config.get("DATABASE_URL")

print("DATABASE_URL =", DATABASE_URL)

if DATABASE_URL is None:
    raise ValueError("❌ DATABASE_URL not found. Check your .env file.")

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
    severity  = Column(String)    # "Critical" / "Warning" / "Info"
    location  = Column(String)
    message   = Column(Text)
    status    = Column(String)    # "Active" / "Resolved"

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
    role            = Column(String)    # "admin" / "operations" / "viewer"

# ── Create ALL tables in one shot ─────────────────────────
Base.metadata.create_all(engine)
print("✅ All tables created successfully!")