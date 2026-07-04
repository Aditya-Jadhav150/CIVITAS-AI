import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import json
from sqlalchemy.orm import Session
from database import get_db
from models import domain

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
    rainfall: float
    river_level: float
    humidity: float
    drainage_complaints: int
    district: int

class AnomalyRequest(BaseModel):
    AQI: float
    temperature: float
    humidity: float
    emissions: float
    waste_collection_delay: float

@router.post("/predict/flood")
def predict_flood(req: FloodRequest):
    if not flood_model:
        return {"error": "Flood model not loaded"}

    # Prepare features: rainfall, river_level, humidity, drainage_complaints, district
    features = pd.DataFrame([{
        'rainfall': req.rainfall,
        'river_level': req.river_level,
        'humidity': req.humidity,
        'drainage_complaints': req.drainage_complaints,
        'district': req.district
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
    if req.rainfall > 100:
        reasoning.append(f"Heavy rainfall detected ({req.rainfall:.1f}mm)")
    elif req.rainfall > 50:
        reasoning.append(f"Moderate rainfall detected ({req.rainfall:.1f}mm)")
        
    if req.river_level > 10:
        reasoning.append(f"River level critically high ({req.river_level:.1f}m)")
    elif req.river_level > 7:
        reasoning.append(f"River level elevated ({req.river_level:.1f}m)")
        
    if req.drainage_complaints > 20:
        reasoning.append(f"High volume of drainage complaints ({req.drainage_complaints})")
        
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
def predict_anomaly(req: AnomalyRequest):
    if not anomaly_model:
        return {"error": "Anomaly model not loaded"}

    # Prepare features: AQI, temperature, humidity, emissions, waste_collection_delay
    features = pd.DataFrame([{
        'AQI': req.AQI,
        'temperature': req.temperature,
        'humidity': req.humidity,
        'emissions': req.emissions,
        'waste_collection_delay': req.waste_collection_delay
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
        if req.AQI > 150 or req.emissions > 300:
            severity = "High"
            recommendation = "Issue pollution advisory and restrict heavy industry."
        elif req.waste_collection_delay > 5:
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


