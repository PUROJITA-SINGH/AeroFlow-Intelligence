from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from auth import get_db
from database import SensorReading
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/api/history", tags=["History"])
def get_history(
    zone : str = Query(..., description="Zone name e.g. 'Security Checkpoint'"),
    hours: int = Query(24,  description="Number of hours to look back"),
    db   : Session = Depends(get_db)
):
    """Returns historical sensor readings for a specific zone"""
    since = datetime.now() - timedelta(hours=hours)

    readings = (
        db.query(SensorReading)
        .filter(
            SensorReading.location  == zone,
            SensorReading.timestamp >= since
        )
        .order_by(SensorReading.timestamp.asc())
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