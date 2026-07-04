from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
import datetime
from sqlalchemy.orm import Session
from database import get_db
from models.domain import ChatSession, ChatMessage, OperationalContext
from ai.assistant import ask_assistant, generate_executive_briefing

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    role: str = "Operations"

class SessionCreate(BaseModel):
    title: str = "New Operation"
    operation_type: Optional[str] = None

@router.post("/sessions")
def create_session(request: SessionCreate, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    db_session = ChatSession(id=session_id, title=request.title, operation_type=request.operation_type, status="ACTIVE", active_resources=0)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Init context
    context = OperationalContext(session_id=session_id)
    db.add(context)
    db.commit()
    return {"id": session_id, "title": db_session.title, "status": db_session.status, "active_resources": db_session.active_resources}

@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    return [{"id": s.id, "title": s.title, "status": s.status, "active_resources": s.active_resources, "operation_type": s.operation_type, "updated_at": s.updated_at} for s in sessions]

@router.get("/sessions/{session_id}")
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp.asc()).all()
    context = db.query(OperationalContext).filter(OperationalContext.session_id == session_id).first()
    
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "session": {
            "title": db_session.title,
            "status": db_session.status,
            "active_resources": db_session.active_resources
        },
        "messages": [{"id": m.id, "role": m.role, "text": m.message, "timestamp": m.timestamp} for m in messages],
        "context": {
            "active_district": context.active_district if context else None,
            "emergency_type": context.emergency_type if context else None,
            "current_focus": context.current_focus if context else None,
            "priority_level": context.priority_level if context else None,
            "affected_population": context.affected_population if context else None
        }
    }

@router.post("/chat/{session_id}")
def chat_with_ai(session_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    # Verify session
    db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", message=request.message)
    db.add(user_msg)
    db.commit()

    # Get response from AI (Passing Role!)
    ai_response_data = ask_assistant(request.message, session_id, db, role=request.role)
    
    # Save AI message
    ai_msg = ChatMessage(session_id=session_id, role="ai", message=ai_response_data.get("response", ""))
    db.add(ai_msg)
    
    # Update updated_at
    db_session.updated_at = datetime.datetime.utcnow()
    db.commit()
    
    return ai_response_data

@router.get("/executive-briefing")
def get_executive_briefing():
    """Generates a high-level briefing using the RAG knowledge base."""
    briefing_text = generate_executive_briefing()
    return {"briefing": briefing_text}
