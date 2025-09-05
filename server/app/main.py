from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import os
from pathlib import Path

from app.config import settings
from app.database import engine, Base
from app.routers import analysis, projects, websocket
from app.models import models
from app.utils.logging_config import setup_logging
from app.utils.error_handlers import (
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
    analysis_exception_handler,
    AnalysisError
)

# Setup logging
setup_logging()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Odin Firmware Intelligence API",
    description="Platform untuk analisis otomatis firmware dan attack surface reconnaissance",
    version="1.0.0"
)

# Add exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(AnalysisError, analysis_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

@app.get("/")
async def root():
    return {
        "message": "Odin Firmware Intelligence API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
