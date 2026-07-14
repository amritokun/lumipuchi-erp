from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(
    title="Lumipuchi ERP API",
    description="Production-ready open-source ERP API for Indian e-commerce sellers",
    version="1.0.0-MVP"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StatusResponse(BaseModel):
    status: str
    version: str
    database_connected: bool
    redis_connected: bool

@app.get("/", response_model=Dict[str, str])
def read_root():
    return {"message": "Welcome to Lumipuchi ERP API"}

@app.get("/health", response_model=StatusResponse)
def health_check():
    # Placeholder checks for database and cache connections
    return {
        "status": "healthy",
        "version": "1.0.0-MVP",
        "database_connected": True,
        "redis_connected": True
    }
