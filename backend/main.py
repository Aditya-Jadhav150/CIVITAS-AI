from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import dashboard, assistant, simulation, streaming, ml

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Civitas AI API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(assistant.router, prefix="/api", tags=["assistant"])
app.include_router(simulation.router, prefix="/api", tags=["simulation"])
app.include_router(streaming.router, prefix="/ws", tags=["streaming"])
app.include_router(ml.router, prefix="/api", tags=["machine_learning"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Civitas AI API"}
