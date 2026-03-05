from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from auth import get_db, get_current_user
from database import Alert, User
from datetime import datetime

router = APIRouter()

@router.get("/api/alerts", tags=["Alerts"])
def get_alerts(db: Session = Depends(get_db)):
    """Returns all active alerts sorted by severity"""
    severity_order = {"Critical": 0, "Warning": 1, "Info": 2}

    alerts = (
        db.query(Alert)
        .filter(Alert.status == "Active")
        .all()
    )

    alerts.sort(key=lambda a: severity_order.get(a.severity, 99))

    return [
        {
            "id"       : a.id,
            "timestamp": a.timestamp,
            "severity" : a.severity,
            "location" : a.location,
            "message"  : a.message,
            "status"   : a.status
        }
        for a in alerts
    ]

@router.post("/api/alerts/resolve/{alert_id}", tags=["Alerts"])
def resolve_alert(
    alert_id   : int,
    db         : Session = Depends(get_db),
    current_user: User   = Depends(get_current_user)
):
    """Marks an alert as resolved (admin and operations only)"""
    if current_user.role not in ["admin", "operations"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "Resolved"
    db.commit()
    return {"message": f"✅ Alert {alert_id} resolved successfully"}