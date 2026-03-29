from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from auth import get_db
from database import AirportZone

router = APIRouter()

@router.get("/api/zones", tags=["Zones"])
def get_zones(db: Session = Depends(get_db)):
    """Returns list of all airport zones"""
    zones = db.query(AirportZone).all()
    return [
        {
            "zone_id"  : z.zone_id,
            "name"     : z.name,
            "capacity" : z.capacity,
            "zone_type": z.zone_type
        }
        for z in zones
    ]