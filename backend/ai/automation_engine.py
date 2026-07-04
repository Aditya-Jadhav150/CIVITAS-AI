import logging
from sqlalchemy.orm import Session
from models.domain import AutomationHistory
from datetime import datetime

logger = logging.getLogger(__name__)

def evaluate_rules(db: Session, event_type: str, data: dict):
    """
    Evaluates business rules based on incoming events and triggers automated actions.
    """
    actions_taken = []

    if event_type == "risk_updated":
        risk = data.get("flood_risk", 0)
        if risk > 80:
            actions_taken.extend(["Deploy water pumps", "Notify local authorities", "Prepare evacuation shelters"])
            
    elif event_type == "hospital_overload":
        occupancy = data.get("occupancy", 0)
        if occupancy > 90:
            actions_taken.extend(["Redirect incoming patients", "Activate overflow wards", "Dispatch additional ambulances"])
            
    elif event_type == "aqi_spike":
        aqi = data.get("aqi", 0)
        if aqi > 150:
            actions_taken.extend(["Issue public health advisory", "Recommend N95 masks", "Limit industrial emissions in sector"])

    # Log actions to DB
    for action in actions_taken:
        history = AutomationHistory(
            trigger=event_type,
            action=action,
            status="Executed",
            timestamp=datetime.utcnow()
        )
        db.add(history)
        logger.info(f"Automation Engine triggered: {action} (Reason: {event_type})")
        
    if actions_taken:
        db.commit()

    return actions_taken
