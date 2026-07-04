from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import dashboard, assistant, simulation, streaming, ml
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Civitas AI API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Internal error on {request.url}: {exc}")
    return JSONResponse(status_code=500, content={"message": "Internal server error. Please try again later."})

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://civitas-ai.vercel.app"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Assign limiter state for routers to access
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(assistant.router, prefix="/api", tags=["assistant"])
app.include_router(simulation.router, prefix="/api", tags=["simulation"])
app.include_router(streaming.router, prefix="/ws", tags=["streaming"])
app.include_router(ml.router, prefix="/api", tags=["machine_learning"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Civitas AI API"}
