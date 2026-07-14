from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

from database import engine, Base
from routers import auth, supplier, forex, purchase_order, product, inventory

import sys

# Initialize database schemas (skipped during tests)
if "pytest" not in sys.modules:
    try:
        # Import models explicitly to ensure they are registered on Base
        import models.user
        import models.supplier
        import models.forex
        import models.purchase_order
        import models.product
        import models.inventory
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Skipping database schema initialization: {e}")


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

# Register routers
app.include_router(auth.router)
app.include_router(supplier.router)
app.include_router(forex.router)
app.include_router(purchase_order.router)
app.include_router(product.router)
app.include_router(inventory.router)

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

