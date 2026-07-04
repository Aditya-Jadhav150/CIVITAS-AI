import os
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import joblib
import json
from sqlalchemy.orm import Session
from database import get_db
from models import domain
from limiter import limiter

router = APIRouter()

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml")
FLOOD_MODEL_PATH = os.path.join(MODELS_DIR, "flood_xgboost.pkl")
ANOMALY_MODEL_PATH = os.path.join(MODELS_DIR, "anomaly_isolation_forest.pkl")

# Load models
flood_model = None
anomaly_model = None

try:
    if os.path.exists(FLOOD_MODEL_PATH):
        flood_model = joblib.load(FLOOD_MODEL_PATH)
    if os.path.exists(ANOMALY_MODEL_PATH):
        anomaly_model = joblib.load(ANOMALY_MODEL_PATH)
except Exception as e:
    print(f"Error loading models: {e}")

class FloodRequest(BaseModel):
    rainfall: float = Field(..., ge=0, le=1000, description="Rainfall in mm")
    river_level: float = Field(..., ge=0, le=50, description="River level in meters")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    drainage_complaints: int = Field(..., ge=0, le=10000, description="Count of complaints")
    district: int = Field(..., ge=1, le=100, description="District ID")

class AnomalyRequest(BaseModel):
    AQI: float = Field(..., ge=0, le=1000, description="Air Quality Index")
    temperature: float = Field(..., ge=-50, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    emissions: float = Field(..., ge=0, le=10000, description="Emissions level")
    waste_collection_delay: float = Field(..., ge=0, le=100, description="Delay in days")

@router.post("/predict/flood")
@limiter.limit("30/minute")
def predict_flood(request: Request, payload: FloodRequest):
    if not flood_model:
        return {"error": "Flood model not loaded"}

    # Prepare features: rainfall, river_level, humidity, drainage_complaints, district
    features = pd.DataFrame([{
        'rainfall': payload.rainfall,
        'river_level': payload.river_level,
        'humidity': payload.humidity,
        'drainage_complaints': payload.drainage_complaints,
        'district': payload.district
    }])

    # Predict risk score (0-100)
    risk_score = float(flood_model.predict(features)[0])
    
    # Calculate confidence based on how extreme the values are (simple proxy)
    confidence = np.clip(80 + (risk_score / 5), 0, 98)

    # Determine risk level
    if risk_score > 80:
        risk_level = "Critical"
    elif risk_score > 50:
        risk_level = "High"
    elif risk_score > 25:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    # Generate reasoning
    reasoning = []
    if payload.rainfall > 100:
        reasoning.append(f"Heavy rainfall detected ({payload.rainfall:.1f}mm)")
    elif payload.rainfall > 50:
        reasoning.append(f"Moderate rainfall detected ({payload.rainfall:.1f}mm)")
        
    if payload.river_level > 10:
        reasoning.append(f"River level critically high ({payload.river_level:.1f}m)")
    elif payload.river_level > 7:
        reasoning.append(f"River level elevated ({payload.river_level:.1f}m)")
        
    if payload.drainage_complaints > 20:
        reasoning.append(f"High volume of drainage complaints ({payload.drainage_complaints})")
        
    if len(reasoning) == 0:
        reasoning.append("All metrics are within normal baseline ranges.")

    # Generate recommendations
    actions = []
    if risk_level == "Critical":
        actions = ["Deploy water pumps", "Prepare evacuation shelters", "Notify local hospitals"]
    elif risk_level == "High":
        actions = ["Issue flood warning", "Clear primary storm drains", "Monitor river capacity"]
    elif risk_level == "Moderate":
        actions = ["Issue localized advisories", "Standby maintenance crews"]
    else:
        actions = ["Continue standard monitoring"]

    return {
        "risk_score": round(risk_score, 1),
        "risk_level": risk_level,
        "confidence": round(confidence, 1),
        "reasoning": reasoning,
        "recommended_actions": actions
    }

@router.post("/predict/anomaly")
@limiter.limit("30/minute")
def predict_anomaly(request: Request, payload: AnomalyRequest):
    if not anomaly_model:
        return {"error": "Anomaly model not loaded"}

    # Prepare features: AQI, temperature, humidity, emissions, waste_collection_delay
    features = pd.DataFrame([{
        'AQI': payload.AQI,
        'temperature': payload.temperature,
        'humidity': payload.humidity,
        'emissions': payload.emissions,
        'waste_collection_delay': payload.waste_collection_delay
    }])

    # Predict (-1 is anomaly, 1 is normal)
    prediction = anomaly_model.predict(features)[0]
    is_anomaly = bool(prediction == -1)
    
    # Decision function gives lower scores for more anomalous points
    score = anomaly_model.decision_function(features)[0]
    
    # Calculate synthetic confidence based on score distance from 0
    confidence = float(np.clip(70 + abs(score) * 100, 0, 99))
    
    severity = "Low"
    recommendation = "Continue standard monitoring."
    
    if is_anomaly:
        if payload.AQI > 150 or payload.emissions > 300:
            severity = "High"
            recommendation = "Issue pollution advisory and restrict heavy industry."
        elif payload.waste_collection_delay > 5:
            severity = "Moderate"
            recommendation = "Dispatch emergency waste collection fleets."
        else:
            severity = "Moderate"
            recommendation = "Dispatch inspection teams to affected sectors."

    return {
        "anomaly_detected": is_anomaly,
        "confidence": round(confidence, 1),
        "severity": severity,
        "recommendation": recommendation
    }


