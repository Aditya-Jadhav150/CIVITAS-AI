from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from models import domain
from ml.explainability import get_flood_risk_explanation
from limiter import limiter
import json

router = APIRouter()

class SimulationRequest(BaseModel):
    rainfall: float = Field(..., ge=0, le=1000, description="Rainfall in mm")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    river_level: float = Field(..., ge=0, le=50, description="River level in meters")
    drainage_reports: int = Field(..., ge=0, le=10000, description="Count of complaints")
    # Other parameters could be added here for hospital capacity etc.

@router.post("/simulate")
@limiter.limit("10/minute")
def run_simulation(request: Request, payload: SimulationRequest, db: Session = Depends(get_db)):
    # Call the explainable AI module which uses the trained XGBoost model
    result = get_flood_risk_explanation(
        rainfall=payload.rainfall,
        humidity=payload.humidity,
        river_level=payload.river_level,
        drainage=payload.drainage_reports
    )
    
    outputs = {
        "flood_risk": result["risk_score"],
        "confidence": result["confidence"],
        "reasoning": result["reasoning"],
        "automated_actions": result["automated_actions"]
    }

    # Save to SimulationHistory
    sim_record = domain.SimulationHistory(
        scenario_name="Flood Simulation",
        parameters=json.dumps(payload.dict()),
        outputs=json.dumps(outputs)
    )
    db.add(sim_record)
    db.commit()
    
    return {
        "status": "success",
        "simulation_results": outputs
    }
