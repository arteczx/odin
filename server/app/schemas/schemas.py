from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import ProjectStatus, RiskLevel, FindingType

# Project schemas
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    device_name: Optional[str] = None
    device_model: Optional[str] = None
    device_version: Optional[str] = None
    manufacturer: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: ProjectStatus
    risk_level: RiskLevel
    filename: str
    file_size: Optional[int]
    device_name: Optional[str]
    device_model: Optional[str]
    device_version: Optional[str]
    manufacturer: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class ProjectSummary(BaseModel):
    id: str
    name: str
    status: ProjectStatus
    risk_level: RiskLevel
    filename: str
    created_at: datetime
    findings_count: int = 0
    cve_count: int = 0

# Finding schemas
class FindingResponse(BaseModel):
    id: int
    type: FindingType
    title: str
    description: Optional[str]
    severity: RiskLevel
    file_path: Optional[str]
    line_number: Optional[int]
    content: Optional[str]
    context: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

# CVE schemas
class CVEFindingResponse(BaseModel):
    id: int
    cve_id: str
    software_name: str
    software_version: Optional[str]
    description: Optional[str]
    severity_score: Optional[str]
    severity_level: Optional[RiskLevel]
    references: Optional[List[str]]
    created_at: datetime
    
    class Config:
        from_attributes = True

# OSINT schemas
class OSINTResultResponse(BaseModel):
    id: int
    source: str
    query: str
    title: Optional[str]
    description: Optional[str]
    url: Optional[str]
    data: Optional[Dict[str, Any]]
    confidence_score: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analysis results
class AnalysisResults(BaseModel):
    project: ProjectResponse
    findings: List[FindingResponse]
    cve_findings: List[CVEFindingResponse]
    osint_results: List[OSINTResultResponse]
    summary: Dict[str, Any]

# WebSocket messages
class WSMessage(BaseModel):
    type: str  # status_update, analysis_complete, error
    project_id: str
    data: Dict[str, Any]

class StatusUpdate(BaseModel):
    project_id: str
    status: ProjectStatus
    message: str
    progress: Optional[int] = None  # 0-100
