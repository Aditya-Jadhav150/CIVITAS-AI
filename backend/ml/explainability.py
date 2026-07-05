import os
import joblib
import numpy as np

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))

# Load models if they exist
flood_model_path = os.path.join(MODELS_DIR, "flood_xgboost.pkl")
if os.path.exists(flood_model_path):
    flood_model = joblib.load(flood_model_path)
else:
    flood_model = None

def get_flood_risk_explanation(rainfall: float, humidity: float, river_level: float, drainage: int):
    """
    Returns the predicted risk and an explainable AI reasoning string.
    """
    if flood_model is None:
        return 0.0, "Model not trained yet."
    
    import pandas as pd
    
    # Predict using 5 features as trained (district hardcoded or default for simulation)
    features = pd.DataFrame([{
        'rainfall': rainfall,
        'river_level': river_level,
        'humidity': humidity,
        'drainage_complaints': drainage,
        'district': 1
    }])
    risk_score = float(flood_model.predict(features)[0])
    
    # Explainability (simplified logic based on input thresholds and mock model importance)
    reasons = []
    if rainfall > 100:
        reasons.append(f"Rainfall is critically high ({rainfall:.1f}mm).")
    elif rainfall > 50:
        reasons.append(f"Rainfall is elevated ({rainfall:.1f}mm).")
        
    if river_level > 8:
        reasons.append(f"River levels are dangerously high ({river_level:.1f}m), nearing capacity.")
        
    if drainage > 20:
        reasons.append(f"High number of citizen drainage complaints ({drainage}) indicating local infrastructure stress.")
        
    if not reasons:
        reasons.append("All metrics are within normal bounds.")
        
    reasoning_text = " ".join(reasons)
    
    # Workflow Automation Rules
    automated_actions = []
    if risk_score > 80:
        automated_actions.append("TRIGGER ALERT: High Flood Risk")
        automated_actions.append("RECOMMEND: Deploy mobile pumps to affected zones.")
        automated_actions.append("RECOMMEND: Prepare evacuation shelters.")
    elif risk_score > 60:
        automated_actions.append("RECOMMEND: Increase infrastructure monitoring.")
        
    return {
        "risk_score": round(risk_score, 2),
        "confidence": 0.91, # Mock confidence for MVP
        "reasoning": reasoning_text,
        "automated_actions": automated_actions
    }
