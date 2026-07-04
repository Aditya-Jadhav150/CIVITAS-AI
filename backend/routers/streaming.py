from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import asyncio
import json
import random
from datetime import datetime
from database import SessionLocal
from ai.automation_engine import evaluate_rules

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    db = SessionLocal()
    try:
        # Simulate live data stream loop
        while True:
            events = []
            
            # Base metrics
            hospital_occ = round(random.uniform(70, 95), 1)
            aqi = int(random.uniform(40, 160))
            flood_risk = int(random.uniform(20, 85))

            # Trigger Hospital Overload
            if hospital_occ > 90:
                events.append({"type": "hospital_overload", "data": {"occupancy": hospital_occ, "hospital": "City General"}})
                
            # Trigger AQI Spike
            if aqi > 150:
                events.append({"type": "aqi_spike", "data": {"aqi": aqi, "district": "Industrial Zone"}})
                
            # Trigger Flood Risk Update
            if flood_risk > 80:
                events.append({"type": "risk_updated", "data": {"flood_risk": flood_risk, "district": "North District"}})
                
            # Random operations update
            if random.random() < 0.1:
                events.append({"type": "operation_updated", "data": {"operation": "Flood Response", "status": "ESCALATED"}})
            
            # Send normal tick
            update_data = {
                "type": "LIVE_UPDATE",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "hospital_occupancy": hospital_occ,
                    "current_aqi": aqi,
                    "active_emergencies": 3,
                    "recent_complaints": random.randint(0, 5)
                }
            }
            await websocket.send_text(json.dumps(update_data))
            
            # Send specific events and trigger automation
            for event in events:
                # 1. Send WebSocket event
                await websocket.send_text(json.dumps({
                    "type": event["type"],
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": event["data"]
                }))
                
                # 2. Trigger Automation Engine
                evaluate_rules(db, event["type"], event["data"])

            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
        print(f"WebSocket Error: {e}")
    finally:
        db.close()
