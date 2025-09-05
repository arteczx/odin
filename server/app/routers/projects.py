from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Project
from app.schemas.schemas import ProjectResponse, ProjectSummary

router = APIRouter()

@router.get("/", response_model=List[ProjectSummary])
async def get_projects(db: Session = Depends(get_db)):
    """Get all projects with summary information"""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    
    project_summaries = []
    for project in projects:
        summary = ProjectSummary(
            id=project.id,
            name=project.name,
            status=project.status,
            risk_level=project.risk_level,
            filename=project.filename,
            created_at=project.created_at,
            findings_count=len(project.findings),
            cve_count=len(project.cve_findings)
        )
        project_summaries.append(summary)
    
    return project_summaries

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get detailed project information"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project

@router.delete("/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete a project and all associated data"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}
