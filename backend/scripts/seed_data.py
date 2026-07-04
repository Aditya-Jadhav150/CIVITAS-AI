import sys
import os
import random
import datetime

# Add the parent directory to sys.path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine
from models import domain

def seed_data():
    domain.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(domain.DisasterReport).count() > 0:
        print("Data already seeded.")
        return

    print("Seeding Disaster Reports...")
    disasters = [
        {"location": "North District", "event_type": "Flood", "severity": 0.85, "status": "Active"},
        {"location": "Downtown", "event_type": "Heatwave", "severity": 0.60, "status": "Warning"},
        {"location": "Zone B", "event_type": "Storm", "severity": 0.40, "status": "Monitoring"},
    ]
    for d in disasters:
        db.add(domain.DisasterReport(**d))

    print("Seeding Healthcare Stats...")
    hospitals = [
        {"hospital_name": "City General", "region": "North District", "occupancy_rate": 0.92, "available_beds": 12, "status": "Overloaded"},
        {"hospital_name": "Metro Health", "region": "Downtown", "occupancy_rate": 0.65, "available_beds": 145, "status": "Normal"},
        {"hospital_name": "Westside Clinic", "region": "Zone B", "occupancy_rate": 0.80, "available_beds": 25, "status": "Warning"},
    ]
    for h in hospitals:
        db.add(domain.HealthcareStat(**h))

    print("Seeding Citizen Feedback...")
    feedbacks = [
        {"category": "Water Supply", "description": "No water in sector 4 for 2 days", "sentiment_score": -0.9, "priority_level": "Critical", "location": "Sector 4"},
        {"category": "Roads", "description": "Pothole on main street", "sentiment_score": -0.4, "priority_level": "Medium", "location": "Main St"},
        {"category": "Power", "description": "Frequent power cuts at night", "sentiment_score": -0.7, "priority_level": "High", "location": "North District"},
    ]
    for f in feedbacks:
        db.add(domain.CitizenFeedback(**f))
        
    print("Seeding Environmental Sensors...")
    now = datetime.datetime.utcnow()
    for i in range(24): # 24 hours of data
        timestamp = now - datetime.timedelta(hours=23-i)
        db.add(domain.EnvironmentalSensor(
            timestamp=timestamp,
            sensor_id="ENV-01",
            location="Downtown",
            aqi=random.uniform(40, 150),
            temperature=random.uniform(25, 35),
            humidity=random.uniform(40, 70)
        ))

    db.commit()
    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed_data()
