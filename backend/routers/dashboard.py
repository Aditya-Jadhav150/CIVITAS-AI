from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import domain
import random
from datetime import datetime, timedelta
import numpy as np
from sklearn.linear_model import LinearRegression

router = APIRouter()

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    active_emergencies = db.query(domain.DisasterReport).filter(domain.DisasterReport.status == "Active").count()
    
    # Calculate mock averages
    hospitals = db.query(domain.HealthcareStat).all()
    avg_occupancy = sum([h.occupancy_rate for h in hospitals]) / len(hospitals) if hospitals else 0
    
    sensors = db.query(domain.EnvironmentalSensor).order_by(domain.EnvironmentalSensor.timestamp.desc()).limit(1).all()
    current_aqi = sensors[0].aqi if sensors else 0
    
    feedback_count = db.query(domain.CitizenFeedback).count()

    return {
        "active_emergencies": active_emergencies,
        "hospital_occupancy_avg": round(avg_occupancy * 100, 1),
        "current_aqi": round(current_aqi, 1),
        "citizen_reports_today": feedback_count
    }

@router.get("/emergencies")
def get_emergencies(db: Session = Depends(get_db)):
    reports = db.query(domain.DisasterReport).filter(domain.DisasterReport.status != "Resolved").all()
    return reports

@router.get("/healthcare")
def get_healthcare_stats(db: Session = Depends(get_db)):
    stats = db.query(domain.HealthcareStat).all()
    return stats

@router.get("/environment/current")
def get_current_environment():
    # In a real app this would query the EnvironmentalSensor table
    return {
        "aqi": int(random.uniform(40, 160)),
        "temperature": round(random.uniform(15, 35), 1),
        "humidity": round(random.uniform(40, 90), 1),
        "emissions": round(random.uniform(100, 400), 1),
        "waste_collection_delay": round(random.uniform(0, 12), 1)
    }

@router.get("/environment/forecast")
def get_environment_forecast():
    # Return 24 hour mock forecast
    forecast = []
    base_aqi = 60
    for i in range(24):
        time = datetime.utcnow() + timedelta(hours=i)
        val = base_aqi + random.randint(-15, 25)
        forecast.append({
            "time": time.strftime("%H:00"),
            "aqi": val
        })
        base_aqi = val # random walk
    return {"forecast": forecast}

@router.get("/healthcare/forecast")
def get_healthcare_forecast(hospital: str = "City General"):
    # Generate 14 days of synthetic historical data
    # Let's say occupancy has been steadily rising
    days = np.array(range(14)).reshape(-1, 1)
    # Base occupancy 70, rising by ~1.5 per day
    historical_occ = 70 + (days.flatten() * 1.5) + np.random.normal(0, 3, 14)
    
    # Train simple linear regression
    model = LinearRegression()
    model.fit(days, historical_occ)
    
    # Predict today (day 14) and next 3 days
    future_days = np.array([14, 15, 16, 17]).reshape(-1, 1)
    predictions = model.predict(future_days)
    
    current_occupancy = float(predictions[0])
    predicted_peak = float(max(predictions))
    
    confidence = 85.0
    
    actions = []
    if predicted_peak > 90:
        actions = ["Redirect incoming non-critical patients", "Activate overflow ward", "Increase nurse staffing"]
    elif predicted_peak > 80:
        actions = ["Monitor bed availability closely", "Prepare discharge for stable patients"]
    else:
        actions = ["Standard operations"]

    return {
        "hospital": hospital,
        "current_occupancy": round(current_occupancy, 1),
        "predicted_occupancy": round(predicted_peak, 1),
        "confidence": confidence,
        "recommended_actions": actions,
        "trend_data": [
            {"day": "Today", "occupancy": round(predictions[0], 1)},
            {"day": "+1 Day", "occupancy": round(predictions[1], 1)},
            {"day": "+2 Days", "occupancy": round(predictions[2], 1)},
            {"day": "+3 Days", "occupancy": round(predictions[3], 1)}
        ]
    }