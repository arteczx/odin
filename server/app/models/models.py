from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Enum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class ProjectStatus(str, enum.Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    ANALYZING = "analyzing"
    OSINT = "osint"
    COMPLETED = "completed"
    FAILED = "failed"

class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PENDING)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.LOW)
    
    # File information
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    file_hash = Column(String)
    
    # Device metadata
    device_name = Column(String)
    device_model = Column(String)
    device_version = Column(String)
    manufacturer = Column(String)
    
    # Analysis results
    firmware_info = Column(JSON)  # Architecture, filesystem type, etc.
    extraction_results = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    findings = relationship("Finding", back_populates="project", cascade="all, delete-orphan")
    cve_findings = relationship("CVEFinding", back_populates="project", cascade="all, delete-orphan")
    osint_results = relationship("OSINTResult", back_populates="project", cascade="all, delete-orphan")

class FindingType(str, enum.Enum):
    SENSITIVE_INFO = "sensitive_info"
    PRIVATE_KEY = "private_key"
    CREDENTIAL = "credential"
    URL = "url"
    IP_ADDRESS = "ip_address"
    SERVICE = "service"
    CONFIG_ISSUE = "config_issue"

class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    
    type = Column(Enum(FindingType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    severity = Column(Enum(RiskLevel), default=RiskLevel.LOW)
    
    # Location information
    file_path = Column(String)
    line_number = Column(Integer)
    
    # Finding data
    content = Column(Text)  # The actual finding content
    context = Column(Text)  # Surrounding context
    metadata = Column(JSON)  # Additional structured data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="findings")

class CVEFinding(Base):
    __tablename__ = "cve_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    
    cve_id = Column(String, nullable=False)  # e.g., CVE-2023-1234
    software_name = Column(String, nullable=False)
    software_version = Column(String)
    
    # CVE details
    description = Column(Text)
    severity_score = Column(String)  # CVSS score
    severity_level = Column(Enum(RiskLevel))
    
    # References
    references = Column(JSON)  # URLs to advisories, patches, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="cve_findings")

class OSINTResult(Base):
    __tablename__ = "osint_results"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    
    source = Column(String, nullable=False)  # shodan, google, fcc, etc.
    query = Column(String, nullable=False)
    
    # Results
    title = Column(String)
    description = Column(Text)
    url = Column(String)
    data = Column(JSON)  # Raw result data
    
    # Relevance scoring
    confidence_score = Column(Integer, default=0)  # 0-100
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="osint_results")
