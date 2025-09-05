from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Project, ProjectStatus
from app.services.celery_app import celery_app
from app.routers.websocket import broadcast_status_update
import asyncio

def start_analysis_pipeline(project_id: str):
    """Start the analysis pipeline for a project"""
    # Queue the analysis task
    celery_app.send_task('app.services.analysis_tasks.analyze_firmware', args=[project_id])

def get_db_session():
    """Get database session for Celery tasks"""
    return SessionLocal()

def update_project_status(project_id: str, status: ProjectStatus, message: str = None):
    """Update project status in database and broadcast to WebSocket clients"""
    db = get_db_session()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.status = status
            db.commit()
            
            # Broadcast status update via WebSocket
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(
                        broadcast_status_update(
                            project_id, 
                            status.value, 
                            message or f"Status updated to {status.value}"
                        )
                    )
            except:
                # If no event loop is running, skip WebSocket broadcast
                pass
                
    finally:
        db.close()
