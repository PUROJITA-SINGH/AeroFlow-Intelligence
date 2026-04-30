import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is required")

# ── Connect to PostgreSQL ─────────────────────────────────
engine_kwargs = {"pool_pre_ping": True}
if DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg2://")):
    engine_kwargs.update(
        pool_size=int(os.environ.get("DB_POOL_SIZE", "5")),
        max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
        pool_recycle=int(os.environ.get("DB_POOL_RECYCLE", "300")),
    )

engine = create_engine(DATABASE_URL, **engine_kwargs)
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
        Index('idx_sensor_readings_location_timestamp', 'location', 'timestamp'),
    )

# ── Table 2: predictions ──────────────────────────────────
class Prediction(Base):
    __tablename__ = "predictions"

    id               = Column(Integer, primary_key=True, index=True)
    timestamp        = Column(DateTime)
    location         = Column(String)
    predicted_count  = Column(Float)
    confidence_level = Column(Float)

    __table_args__ = (
        Index('idx_predictions_location_timestamp', 'location', 'timestamp'),
    )

# ── Table 3: alerts ───────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id        = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    severity  = Column(String)
    location  = Column(String)
    message   = Column(Text)
    status    = Column(String)

    __table_args__ = (
        Index('idx_alerts_status_severity', 'status', 'severity'),
    )

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
