import os
import logging
import json
import re
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from ai.rag_pipeline import get_retriever
from sqlalchemy.orm import Session
from models.domain import ChatMessage, OperationalContext

load_dotenv()

logger = logging.getLogger(__name__)

# Check for API key
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key or gemini_api_key == "your_api_key_here":
    logger.warning("GEMINI_API_KEY is not set. The assistant will run in mock mode.")
    llm = None
else:
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=gemini_api_key)

template = """You are Civitas AI, a Smart City Operating System and highly competent operations decision engine.

━━━━━━━━━━━━━━━━━━━━━━
ROLE ADAPTATION
━━━━━━━━━━━━━━━━━━━━━━
You are talking to a user with the role: {user_role}

- If Citizen: Use simple, public-friendly language. Focus on safety and simple instructions.
- If Operations: Focus on tactical recommendations, resource deployment, and immediate operational steps.
- If Executive: Focus on strategic overviews, financial/economic exposure, population impact, and high-level recovery metrics.

━━━━━━━━━━━━━━━━━━━━━━
EXPLAINABLE AI & CROSS DOMAIN INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━
You must connect events across domains (e.g. Weather -> Traffic -> Healthcare). Identify cascading effects.
Ground your answers using the Knowledge Base.

Active Context:
District: {active_district}
Emergency: {emergency_type}
Focus: {current_focus}
Priority: {priority_level}

Chat History:
{chat_history}

Knowledge Base:
{context}

User Question: {question}

━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT REQUIREMENT
━━━━━━━━━━━━━━━━━━━━━━
You must respond with a VALID JSON object matching the exact structure below. Do not output markdown text outside the JSON block. Do not include ```json tags. Output raw JSON only.

{{
  "situation": {{
    "summary": "Brief summary of the situation tailored to the {user_role} role.",
    "severity": "Low | Moderate | High | Critical",
    "risk_score": 84, // integer 0-100
    "confidence": 91, // integer 0-100
    "affected": 22000,
    "duration": "Estimated duration (e.g., '6-12 hours')"
  }},
  "reasoning": [
    "First reasoning point based on the knowledge base.",
    "Second reasoning point explaining the risk."
  ],
  "recommendations": [
    {{ "priority": 1, "action": "First recommended action" }},
    {{ "priority": 2, "action": "Second recommended action" }}
  ],
  "cascading_effects": [
    "First effect (e.g. Flood Risk)",
    "Second effect (e.g. Drainage Overloaded)",
    "Third effect"
  ],
  "timeline": [
    {{ "time": "09:12", "event": "Past event", "status": "green" }},
    {{ "time": "09:15", "event": "Current event", "status": "red" }},
    {{ "time": "10:00", "event": "Predicted event", "status": "yellow" }}
  ],
  "quick_actions": [
    "Deploy Pumps", "Issue Alert", "Simulate Impact"
  ],
  "context_update": {{
    "title": "Emoji + Title (e.g. 🔴 Flood Response - North District)",
    "district": "North District",
    "emergency": "Flood",
    "status": "ACTIVE", // ACTIVE, MONITORING, RESOLVED, ESCALATED
    "priority": "Critical",
    "active_resources": 8
  }}
}}
"""

prompt = ChatPromptTemplate.from_template(template)

briefing_template = """You are Civitas AI, the Smart City Operating System chief advisor.

Generate a highly concise Executive Briefing based on the current city state and recent incidents found in the Knowledge Base.

Format strictly as:
Good morning/afternoon.

Three issues require attention:
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

Recommended actions:
- [Action 1]
- [Action 2]
- [Action 3]

Estimated impact:
- Population affected: [Number]
- Hospitals impacted: [Number]
- Emergency resources required: [Low/Moderate/High]

Knowledge Base:
{context}
"""

briefing_prompt = ChatPromptTemplate.from_template(briefing_template)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def ask_assistant(question: str, session_id: str, db: Session, role: str = "Operations"):
    if not llm:
        return {
            "response": '{"situation": {"summary": "Mock Mode", "severity": "Low", "risk_score": 0, "confidence": 0, "affected": 0, "duration": "0h"}, "reasoning": [], "recommendations": [], "cascading_effects": [], "timeline": [], "quick_actions": [], "context_update": {}}',
            "context": {}
        }
    
    # Load history
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp.asc()).limit(10).all()
    history_str = "\n".join([f"{'User' if m.role == 'user' else 'AI'}: {m.message}" for m in messages])
    
    # Load Context
    session_context = db.query(OperationalContext).filter(OperationalContext.session_id == session_id).first()
    active_district = session_context.active_district if session_context else "None"
    emergency_type = session_context.emergency_type if session_context else "None"
    current_focus = session_context.current_focus if session_context else "None"
    priority_level = session_context.priority_level if session_context else "None"

    retriever = get_retriever()
    docs = retriever.invoke(question)
    context_str = format_docs(docs)
    
    # Extract sources from documents
    sources = list(set([doc.metadata.get('source', 'System Knowledge Base') for doc in docs if 'source' in doc.metadata]))
    
    # RAG chain
    rag_chain = (
        {"context": lambda x: context_str, 
         "question": RunnablePassthrough(),
         "chat_history": lambda x: history_str,
         "active_district": lambda x: active_district,
         "emergency_type": lambda x: emergency_type,
         "current_focus": lambda x: current_focus,
         "priority_level": lambda x: priority_level,
         "user_role": lambda x: role
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    
    raw_response = rag_chain.invoke(question)
    
    # Clean JSON if wrapped in markdown or surrounded by text
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_response, re.DOTALL)
    if match:
        json_str = match.group(1).strip()
    else:
        # fallback: find the first { and last }
        start = raw_response.find('{')
        end = raw_response.rfind('}')
        if start != -1 and end != -1:
            json_str = raw_response[start:end+1].strip()
        else:
            json_str = raw_response.strip()

    context_update = {}
    try:
        data = json.loads(json_str)
        context_update = data.get("context_update", {})
        
        # Inject sources into the JSON directly
        data["sources"] = sources
        json_str = json.dumps(data)
        
        # Update DB Context
        if session_context:
            session_context.active_district = context_update.get("district", session_context.active_district)
            session_context.emergency_type = context_update.get("emergency", session_context.emergency_type)
            session_context.current_focus = context_update.get("focus", session_context.current_focus)
            session_context.priority_level = context_update.get("priority", session_context.priority_level)
            session_context.affected_population = context_update.get("affected_population", session_context.affected_population)
            
        # Update DB Session metadata
        db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if db_session:
            if context_update.get("title"):
                db_session.title = context_update.get("title")
            if context_update.get("status"):
                db_session.status = context_update.get("status")
            if context_update.get("active_resources") is not None:
                db_session.active_resources = context_update.get("active_resources")
                
        db.commit()
    except Exception as e:
        logger.error(f"Failed to parse JSON response: {e}")
        json_str = json.dumps({
            "situation": {"summary": f"Failed to parse AI response. Raw output: {raw_response}", "severity": "Unknown", "risk_score": 0, "confidence": 0, "affected": 0, "duration": ""},
            "reasoning": [],
            "recommendations": [],
            "cascading_effects": [],
            "timeline": [],
            "quick_actions": [],
            "sources": sources
        })

    return {
        "response": json_str,
        "context": context_update
    }

def generate_executive_briefing():
    if not llm:
        return "Mock Briefing:\n\nGood morning.\n\nThree issues require attention:\n1. North District flood risk increased to 84%.\n2. City General Hospital may exceed capacity by 18:00.\n3. Industrial Zone AQI expected to exceed safe levels.\n\nRecommended actions:\n- Deploy pumps.\n- Redirect patients.\n- Issue pollution advisory.\n\nEstimated impact:\n- Population affected: 22,000\n- Hospitals impacted: 2\n- Emergency resources required: Moderate"
    
    retriever = get_retriever()
    docs = retriever.invoke("Generate briefing")
    context_str = format_docs(docs)
    
    briefing_chain = (
        {"context": lambda x: context_str}
        | briefing_prompt
        | llm
        | StrOutputParser()
    )
    
    return briefing_chain.invoke("Generate briefing")

