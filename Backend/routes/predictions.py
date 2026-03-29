from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from auth import get_db
from database import Prediction

router = APIRouter()

@router.get("/api/predictions", tags=["Predictions"])
def get_predictions(
    zone: str = Query(..., description="Zone name e.g. 'Security Checkpoint'"),
    db  : Session = Depends(get_db)
):
    """Returns next 24-hour forecast for a specific zone"""
    predictions = (
        db.query(Prediction)
        .filter(Prediction.location == zone)
        .order_by(Prediction.timestamp.asc())
        .all()
    )

    return [
        {
            "timestamp"      : p.timestamp,
            "location"       : p.location,
            "predicted_count": p.predicted_count,
            "confidence_level": p.confidence_level
        }
        for p in predictions
    ]