from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from auth import get_db, get_current_user
from database import SensorReading, User

router = APIRouter()

@router.get("/api/live", tags=["Live Data"])
def get_live(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the latest sensor reading per zone"""
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
        .join(
            subquery,
            (SensorReading.location == subquery.c.location) &
            (SensorReading.timestamp == subquery.c.max_ts)
        )
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
