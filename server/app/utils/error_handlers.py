from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
from typing import Union

logger = logging.getLogger(__name__)

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Invalid input data",
            "details": exc.errors()
        }
    )

async def http_exception_handler(request: Request, exc: Union[HTTPException, StarletteHTTPException]):
    """Handle HTTP exceptions"""
    logger.warning(f"HTTP {exc.status_code} on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": f"HTTP {exc.status_code}",
            "message": exc.detail
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception on {request.url}: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later."
        }
    )

class AnalysisError(Exception):
    """Custom exception for analysis-related errors"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class ExtractionError(AnalysisError):
    """Exception for firmware extraction errors"""
    pass

class OSINTError(AnalysisError):
    """Exception for OSINT analysis errors"""
    pass

async def analysis_exception_handler(request: Request, exc: AnalysisError):
    """Handle analysis-specific exceptions"""
    logger.error(f"Analysis error on {request.url}: {exc.message}")
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Analysis Error",
            "message": exc.message,
            "error_code": exc.error_code
        }
    )
