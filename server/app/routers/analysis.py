from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import hashlib
import magic
import os
from pathlib import Path

from app.database import get_db
from app.models.models import Project, ProjectStatus
from app.schemas.schemas import ProjectCreate, ProjectResponse, AnalysisResults
from app.config import settings
from app.services.analysis_service import start_analysis_pipeline

router = APIRouter()

@router.post("/upload", response_model=ProjectResponse)
async def upload_firmware(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    device_name: Optional[str] = Form(None),
    device_model: Optional[str] = Form(None),
    device_version: Optional[str] = Form(None),
    manufacturer: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload firmware file and start analysis"""
    
    # Validate file size
    if file.size > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.max_file_size / (1024*1024):.0f}MB"
        )
    
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.supported_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported: {', '.join(settings.supported_extensions)}"
        )
    
    # Generate unique project ID
    project_id = str(uuid.uuid4())
    
    # Create file path
    file_path = Path(settings.upload_dir) / f"{project_id}_{file.filename}"
    
    # Save uploaded file
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Calculate file hash
        file_hash = hashlib.sha256(content).hexdigest()
        
        # Detect file type
        file_type = magic.from_file(str(file_path))
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create project record
    project = Project(
        id=project_id,
        name=name,
        description=description,
        status=ProjectStatus.UPLOADING,
        filename=file.filename,
        file_path=str(file_path),
        file_size=file.size,
        file_hash=file_hash,
        device_name=device_name,
        device_model=device_model,
        device_version=device_version,
        manufacturer=manufacturer,
        firmware_info={"file_type": file_type}
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Start analysis pipeline in background
    background_tasks.add_task(start_analysis_pipeline, project_id)
    
    return project

@router.get("/{project_id}/results", response_model=AnalysisResults)
async def get_analysis_results(project_id: str, db: Session = Depends(get_db)):
    """Get complete analysis results for a project"""
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Calculate summary statistics
    summary = {
        "total_findings": len(project.findings),
        "total_cves": len(project.cve_findings),
        "total_osint_results": len(project.osint_results),
        "risk_breakdown": {
            "critical": len([f for f in project.findings if f.severity == "critical"]),
            "high": len([f for f in project.findings if f.severity == "high"]),
            "medium": len([f for f in project.findings if f.severity == "medium"]),
            "low": len([f for f in project.findings if f.severity == "low"])
        },
        "file_info": project.firmware_info or {},
        "extraction_info": project.extraction_results or {}
    }
    
    return AnalysisResults(
        project=project,
        findings=project.findings,
        cve_findings=project.cve_findings,
        osint_results=project.osint_results,
        summary=summary
    )

@router.get("/{project_id}/status")
async def get_analysis_status(project_id: str, db: Session = Depends(get_db)):
    """Get current analysis status"""
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return {
        "project_id": project_id,
        "status": project.status,
        "progress": _calculate_progress(project.status),
        "message": _get_status_message(project.status)
    }

def _calculate_progress(status: ProjectStatus) -> int:
    """Calculate progress percentage based on status"""
    progress_map = {
        ProjectStatus.PENDING: 0,
        ProjectStatus.UPLOADING: 10,
        ProjectStatus.EXTRACTING: 30,
        ProjectStatus.ANALYZING: 60,
        ProjectStatus.OSINT: 80,
        ProjectStatus.COMPLETED: 100,
        ProjectStatus.FAILED: 0
    }
    return progress_map.get(status, 0)

def _get_status_message(status: ProjectStatus) -> str:
    """Get human-readable status message"""
    messages = {
        ProjectStatus.PENDING: "Menunggu pemrosesan...",
        ProjectStatus.UPLOADING: "Firmware berhasil diterima",
        ProjectStatus.EXTRACTING: "Mengekstraksi filesystem...",
        ProjectStatus.ANALYZING: "Melakukan analisis statis...",
        ProjectStatus.OSINT: "Mengumpulkan intelligence...",
        ProjectStatus.COMPLETED: "Analisis selesai",
        ProjectStatus.FAILED: "Analisis gagal"
    }
    return messages.get(status, "Status tidak diketahui")
