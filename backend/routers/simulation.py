from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import domain
from ml.explainability import get_flood_risk_explanation
import json

router = APIRouter()

class SimulationRequest(BaseModel):
    rainfall: float
    humidity: float
    river_level: float
    drainage_reports: int
    # Other parameters could be added here for hospital capacity etc.

@router.post("/simulate")
def run_simulation(request: SimulationRequest, db: Session = Depends(get_db)):
    # Call the explainable AI module which uses the trained XGBoost model
    result = get_flood_risk_explanation(
        rainfall=request.rainfall,
        humidity=request.humidity,
        river_level=request.river_level,
        drainage=request.drainage_reports
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
        parameters=json.dumps(request.dict()),
        outputs=json.dumps(outputs)
    )
    db.add(sim_record)
    db.commit()
    
    return {
        "status": "success",
        "simulation_results": outputs
    }
