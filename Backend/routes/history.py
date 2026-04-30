from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from auth import get_db, get_current_user
from database import SensorReading, User
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/api/history", tags=["History"])
def get_history(
    zone        : str     = Query(..., min_length=1, max_length=100, description="Zone name e.g. 'Security Checkpoint'"),
    hours       : int     = Query(24, description="Number of hours to look back", ge=1, le=168),
    limit       : int     = Query(500, description="Maximum number of records to return", ge=1, le=2000),
    db          : Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    """Returns historical sensor readings for a specific zone"""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    readings = (
        db.query(SensorReading)
        .filter(
            SensorReading.location  == zone,
            SensorReading.timestamp >= since
        )
        .order_by(SensorReading.timestamp.asc())
        .limit(limit)
        .all()
    )

    return [
        {
            "timestamp"      : r.timestamp,
            "sensor_id"      : r.sensor_id,
            "passenger_count": r.passenger_count,
            "queue_length"   : r.queue_length
        }
        for r in readings
    ]
