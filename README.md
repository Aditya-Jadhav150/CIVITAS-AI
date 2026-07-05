# Civitas AI 🏙️
**Smart City Decision Intelligence Engine**

Civitas AI is a next-generation Smart City Operating System designed to empower city administrators, emergency responders, and urban planners. Powered by DeepMind Gemini and advanced Machine Learning models, Civitas AI seamlessly fuses live telemetry data with actionable, explainable AI workflows to mitigate crises and optimize urban infrastructure.

---

## 🚀 Key Features

*   **Operations Mission Control:** An intelligent chat interface powered by a RAG (Retrieval-Augmented Generation) pipeline using Gemini and ChromaDB. It processes raw sensor data, parses Standard Operating Procedures, and acts as an autonomous assistant to dispatch resources during emergencies.
*   **Predictive ML Scenario Simulator:** Uses trained XGBoost and Isolation Forest models to predict flood risks and urban anomalies in real-time. Automatically triggers workflow alerts and recommendations (e.g., "Deploy mobile pumps", "Issue pollution advisory").
*   **Live Telemetry Dashboard:** A glassmorphic, real-time dashboard visualizing city metrics (Power Grid Load, Traffic Flow, Water Quality, Emergency Wait Times) to give administrators a holistic view of the city's health.

---

## 🧠 Architecture Overview

Civitas AI is built with a modern, decoupled architecture:

*   **Frontend:** React + Vite + Tailwind CSS. Designed with a stunning, premium dark-mode aesthetic and real-time responsiveness.
*   **Backend:** FastAPI (Python). Handles ML inference, the LangChain/Gemini RAG pipeline, and provides secure, rate-limited REST endpoints.
*   **AI & ML:** 
    *   **GenAI:** Google Gemini handles complex natural language reasoning, extracting actionable json directives from unstructured crisis reports.
    *   **Predictive ML:** Scikit-Learn / XGBoost models pre-trained on historical municipal data to forecast floods and detect infrastructural anomalies.
    *   **Vector Database:** ChromaDB stores and retrieves city policies, historical incident reports, and standard operating procedures.
*   **Database:** SQLite + SQLAlchemy for operational context, chat history, and telemetry persistence.

---

## 🛠️ Local Development Setup

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file and add your Google Gemini API Key
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the backend
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup (React/Vite)
```bash
cd frontend
npm install

# Run the frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## ☁️ Deployment

Civitas AI is fully dockerized and configured for CI/CD deployment.
*   **Frontend:** Hosted on Vercel.
*   **Backend:** Hosted on Railway (via Dockerfile).

*Built for the Gen AI Academy APAC Hackathon.*
