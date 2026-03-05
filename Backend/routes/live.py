from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from auth import get_db
from database import SensorReading
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/api/live", tags=["Live Data"])
def get_live(db: Session = Depends(get_db)):
    """Returns latest sensor reading per zone (last 1 minute)"""
    one_min_ago = datetime.now() - timedelta(minutes=1)

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.timestamp >= one_min_ago)
        .all()
    )

    # If no readings in last 1 min, get the very latest per zone
    if not readings:
        subquery = (
            db.query(
                SensorReading.location,
                func.max(SensorReading.timestamp).label("max_ts")
            )
            .group_by(SensorReading.location)
            .subquery()
        )
        readings = (
            db.query(SensorReading)
            .join(subquery, (SensorReading.location == subquery.c.location) &
                  (SensorReading.timestamp == subquery.c.max_ts))
            .all()
        )

    return [
        {
            "sensor_id"      : r.sensor_id,
            "location"       : r.location,
            "passenger_count": r.passenger_count,
            "queue_length"   : r.queue_length,
            "timestamp"      : r.timestamp
        }
        for r in readings
    ]