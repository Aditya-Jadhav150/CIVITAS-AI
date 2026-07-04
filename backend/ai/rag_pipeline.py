import os
import logging
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from database import SessionLocal
from models import domain

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

persist_directory = "./chroma_db"
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def build_vector_store():
    logger.info("Building Vector Store...")
    
    db = SessionLocal()
    reports = db.query(domain.DisasterReport).all()
    feedback = db.query(domain.CitizenFeedback).all()
    hospitals = db.query(domain.HealthcareStat).all()
    db.close()

    docs = []
    
    for r in reports:
        text = f"Disaster Report: {r.event_type} at {r.location}. Severity is {r.severity}. Status is {r.status}."
        docs.append(Document(page_content=text, metadata={"source": f"Disaster Report #{r.id}"}))
        
    for f in feedback:
        text = f"Citizen Feedback in {f.location} regarding {f.category}: {f.description}. Priority is {f.priority_level}."
        docs.append(Document(page_content=text, metadata={"source": f"Citizen Complaint #{f.id}"}))
        
    for h in hospitals:
        text = f"Hospital {h.hospital_name} in {h.region} has {h.occupancy_rate*100}% occupancy and {h.available_beds} beds available. Status: {h.status}."
        docs.append(Document(page_content=text, metadata={"source": f"Hospital Report #{h.id}"}))

    docs.append(Document(page_content="Policy: If flood risk exceeds 80%, recommend deploying pumps and preparing evacuation shelters.", metadata={"source": "Flood Preparedness Policy"}))
    docs.append(Document(page_content="Policy: If hospital occupancy exceeds 90%, recommend redirecting non-critical patients and increasing staffing.", metadata={"source": "Healthcare Surge Policy"}))
    docs.append(Document(page_content="Historical context: In 2023, high rainfall combined with 90% river capacity caused severe flooding in North District.", metadata={"source": "Historical Incident #2023-F"}))

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    split_docs = text_splitter.split_documents(docs)
    
    logger.info("Creating Chroma index...")
    vectorstore = Chroma.from_documents(
        documents=split_docs,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    vectorstore.persist()
    logger.info("Vector store created successfully.")
    return vectorstore

def get_retriever():
    if not os.path.exists(persist_directory):
        vectorstore = build_vector_store()
    else:
        vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
    
    return vectorstore.as_retriever(search_kwargs={"k": 3})

if __name__ == "__main__":
    build_vector_store()
