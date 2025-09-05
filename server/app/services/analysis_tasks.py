from celery import current_task
from sqlalchemy.orm import Session
from app.services.celery_app import celery_app
from app.services.analysis_service import get_db_session, update_project_status
from app.models.models import Project, ProjectStatus, Finding, CVEFinding, OSINTResult, FindingType, RiskLevel
from app.services.extractors.binwalk_extractor import BinwalkExtractor
from app.services.analyzers.static_analyzer import StaticAnalyzer
from app.services.analyzers.cve_analyzer import CVEAnalyzer
from app.services.analyzers.osint_analyzer import OSINTAnalyzer
import traceback
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def analyze_firmware(self, project_id: str):
    """Main firmware analysis task"""
    db = get_db_session()
    
    try:
        # Get project
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.error(f"Project {project_id} not found")
            return {"error": "Project not found"}
        
        logger.info(f"Starting analysis for project {project_id}: {project.name}")
        
        # Update status to extracting
        update_project_status(project_id, ProjectStatus.EXTRACTING, "Mengekstraksi filesystem...")
        
        # Step 1: Extract firmware
        extractor = BinwalkExtractor()
        extraction_result = extractor.extract(project.file_path, project_id)
        
        if not extraction_result["success"]:
            update_project_status(project_id, ProjectStatus.FAILED, f"Ekstraksi gagal: {extraction_result['error']}")
            return {"error": extraction_result["error"]}
        
        # Update project with extraction results
        project.extraction_results = extraction_result
        db.commit()
        
        # Step 2: Static Analysis
        update_project_status(project_id, ProjectStatus.ANALYZING, "Melakukan analisis statis...")
        
        static_analyzer = StaticAnalyzer()
        static_results = static_analyzer.analyze(extraction_result["extract_path"], project_id)
        
        # Save findings to database
        for finding_data in static_results.get("findings", []):
            finding = Finding(
                project_id=project_id,
                type=FindingType(finding_data["type"]),
                title=finding_data["title"],
                description=finding_data.get("description"),
                severity=RiskLevel(finding_data.get("severity", "low")),
                file_path=finding_data.get("file_path"),
                line_number=finding_data.get("line_number"),
                content=finding_data.get("content"),
                context=finding_data.get("context"),
                metadata=finding_data.get("metadata", {})
            )
            db.add(finding)
        
        # Step 3: CVE Analysis
        cve_analyzer = CVEAnalyzer()
        cve_results = cve_analyzer.analyze(extraction_result["extract_path"], project_id)
        
        # Save CVE findings
        for cve_data in cve_results.get("cves", []):
            cve_finding = CVEFinding(
                project_id=project_id,
                cve_id=cve_data["cve_id"],
                software_name=cve_data["software_name"],
                software_version=cve_data.get("software_version"),
                description=cve_data.get("description"),
                severity_score=cve_data.get("severity_score"),
                severity_level=RiskLevel(cve_data.get("severity_level", "low")),
                references=cve_data.get("references", [])
            )
            db.add(cve_finding)
        
        # Step 4: OSINT Analysis
        update_project_status(project_id, ProjectStatus.OSINT, "Mengumpulkan intelligence...")
        
        osint_analyzer = OSINTAnalyzer()
        osint_results = osint_analyzer.analyze(project, static_results)
        
        # Save OSINT results
        for osint_data in osint_results.get("results", []):
            osint_result = OSINTResult(
                project_id=project_id,
                source=osint_data["source"],
                query=osint_data["query"],
                title=osint_data.get("title"),
                description=osint_data.get("description"),
                url=osint_data.get("url"),
                data=osint_data.get("data", {}),
                confidence_score=osint_data.get("confidence_score", 0)
            )
            db.add(osint_result)
        
        # Calculate overall risk level
        risk_level = _calculate_risk_level(db, project_id)
        project.risk_level = risk_level
        project.completed_at = datetime.utcnow()
        
        db.commit()
        
        # Final status update
        update_project_status(project_id, ProjectStatus.COMPLETED, "Analisis selesai!")
        
        logger.info(f"Analysis completed for project {project_id}")
        
        return {
            "success": True,
            "project_id": project_id,
            "findings_count": len(static_results.get("findings", [])),
            "cve_count": len(cve_results.get("cves", [])),
            "osint_count": len(osint_results.get("results", [])),
            "risk_level": risk_level.value
        }
        
    except Exception as e:
        logger.error(f"Analysis failed for project {project_id}: {str(e)}")
        logger.error(traceback.format_exc())
        
        update_project_status(project_id, ProjectStatus.FAILED, f"Analisis gagal: {str(e)}")
        
        return {"error": str(e)}
    
    finally:
        db.close()

def _calculate_risk_level(db: Session, project_id: str) -> RiskLevel:
    """Calculate overall risk level based on findings"""
    findings = db.query(Finding).filter(Finding.project_id == project_id).all()
    cve_findings = db.query(CVEFinding).filter(CVEFinding.project_id == project_id).all()
    
    # Count severity levels
    critical_count = len([f for f in findings if f.severity == RiskLevel.CRITICAL])
    critical_count += len([c for c in cve_findings if c.severity_level == RiskLevel.CRITICAL])
    
    high_count = len([f for f in findings if f.severity == RiskLevel.HIGH])
    high_count += len([c for c in cve_findings if c.severity_level == RiskLevel.HIGH])
    
    medium_count = len([f for f in findings if f.severity == RiskLevel.MEDIUM])
    medium_count += len([c for c in cve_findings if c.severity_level == RiskLevel.MEDIUM])
    
    # Determine overall risk
    if critical_count > 0:
        return RiskLevel.CRITICAL
    elif high_count >= 3:
        return RiskLevel.CRITICAL
    elif high_count > 0:
        return RiskLevel.HIGH
    elif medium_count >= 5:
        return RiskLevel.HIGH
    elif medium_count > 0:
        return RiskLevel.MEDIUM
    else:
        return RiskLevel.LOW
