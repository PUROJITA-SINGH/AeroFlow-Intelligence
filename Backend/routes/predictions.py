from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from auth import get_db, get_current_user
from database import Prediction, User

router = APIRouter()

@router.get("/api/predictions", tags=["Predictions"])
def get_predictions(
    zone        : str     = Query(..., min_length=1, max_length=100, description="Zone name e.g. 'Security Checkpoint'"),
    limit       : int     = Query(24, description="Maximum number of forecast records to return", ge=1, le=168),
    db          : Session = Depends(get_db),
    current_user: User    = Depends(get_current_user)
):
    """Returns next 24-hour forecast for a specific zone"""
    predictions = (
        db.query(Prediction)
        .filter(Prediction.location == zone)
        .order_by(Prediction.timestamp.asc())
        .limit(limit)
        .all()
    )

    return [
        {
            "timestamp"       : p.timestamp,
            "location"        : p.location,
            "predicted_count" : p.predicted_count,
            "confidence_level": p.confidence_level
        }
        for p in predictions
    ]
