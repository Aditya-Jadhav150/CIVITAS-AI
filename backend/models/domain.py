from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from database import Base

class DisasterReport(Base):
    __tablename__ = "disaster_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    location = Column(String, index=True)
    event_type = Column(String) # e.g. Flood, Heatwave
    severity = Column(Float) # 0.0 to 1.0
    status = Column(String, default="Active")

class HealthcareStat(Base):
    __tablename__ = "healthcare_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    hospital_name = Column(String, index=True)
    region = Column(String)
    occupancy_rate = Column(Float) # 0.0 to 1.0
    available_beds = Column(Integer)
    status = Column(String) # Normal, Overloaded

class CitizenFeedback(Base):
    __tablename__ = "citizen_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    category = Column(String, index=True) # e.g., Water Supply, Roads
    description = Column(String)
    sentiment_score = Column(Float) # -1.0 to 1.0
    priority_level = Column(String) # Low, Medium, High, Critical
    location = Column(String)

class EnvironmentalSensor(Base):
    __tablename__ = "environmental_sensors"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    sensor_id = Column(String, index=True)
    location = Column(String)
    aqi = Column(Float) # Air Quality Index
    temperature = Column(Float)
    humidity = Column(Float)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, index=True) # UUID
    title = Column(String, default="New Operation")
    operation_type = Column(String, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, MONITORING, RESOLVED, ESCALATED
    priority = Column(String, default="Normal")
    teams_assigned = Column(String, nullable=True) # JSON array or comma separated string
    active_resources = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    context = relationship("OperationalContext", back_populates="session", uselist=False, cascade="all, delete-orphan")
    recommendations = relationship("RecommendationHistory", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String) # 'user' or 'ai'
    message = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="messages")

class OperationalContext(Base):
    __tablename__ = "operational_context"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), unique=True)
    active_district = Column(String, nullable=True)
    emergency_type = Column(String, nullable=True)
    priority_level = Column(String, nullable=True)
    affected_population = Column(Integer, nullable=True)
    current_focus = Column(String, nullable=True)
    
    session = relationship("ChatSession", back_populates="context")

class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    recommendation = Column(String)
    status = Column(String, default="Pending")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="recommendations")

class AutomationHistory(Base):
    __tablename__ = "automation_history"
    
    id = Column(Integer, primary_key=True, index=True)
    trigger = Column(String)
    action = Column(String)
    status = Column(String, default="Executed")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class SimulationHistory(Base):
    __tablename__ = "simulation_history"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String, nullable=True)
    parameters = Column(String) # JSON string
    outputs = Column(String) # JSON string
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class HazardZone(Base):
    __tablename__ = "hazard_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    district = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    radius = Column(Float)
    severity = Column(String) # e.g. "Critical", "High"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
