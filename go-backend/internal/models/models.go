package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProjectStatus represents the status of a firmware analysis project
type ProjectStatus string

const (
	StatusPending    ProjectStatus = "pending"
	StatusUploading  ProjectStatus = "uploading"
	StatusExtracting ProjectStatus = "extracting"
	StatusAnalyzing  ProjectStatus = "analyzing"
	StatusOSINT      ProjectStatus = "osint"
	StatusCompleted  ProjectStatus = "completed"
	StatusFailed     ProjectStatus = "failed"
)

// RiskLevel represents the risk level of findings
type RiskLevel string

const (
	RiskLow      RiskLevel = "low"
	RiskMedium   RiskLevel = "medium"
	RiskHigh     RiskLevel = "high"
	RiskCritical RiskLevel = "critical"
)

// FindingType represents the type of finding
type FindingType string

const (
	FindingSensitiveInfo FindingType = "sensitive_info"
	FindingPrivateKey    FindingType = "private_key"
	FindingCredential    FindingType = "credential"
	FindingURL           FindingType = "url"
	FindingIPAddress     FindingType = "ip_address"
	FindingService       FindingType = "service"
	FindingConfigIssue   FindingType = "config_issue"
	FindingSecurityIssue FindingType = "security_issue"
)

// Project represents a firmware analysis project
type Project struct {
	ID          string        `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Name        string        `gorm:"not null" json:"name"`
	Description string        `json:"description"`
	Status      ProjectStatus `gorm:"default:pending" json:"status"`
	RiskLevel   RiskLevel     `gorm:"default:low" json:"risk_level"`

	// File information
	Filename string `gorm:"not null" json:"filename"`
	FilePath string `gorm:"not null" json:"file_path"`
	FileSize int64  `json:"file_size"`
	FileHash string `json:"file_hash"`

	// Device metadata
	DeviceName    string `json:"device_name"`
	DeviceModel   string `json:"device_model"`
	DeviceVersion string `json:"device_version"`
	Manufacturer  string `json:"manufacturer"`

	// Analysis results (JSON fields)
	FirmwareInfo      map[string]interface{} `gorm:"type:jsonb" json:"firmware_info"`
	ExtractionResults map[string]interface{} `gorm:"type:jsonb" json:"extraction_results"`

	// Timestamps
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CompletedAt *time.Time `json:"completed_at"`

	// Relationships
	Findings     []Finding     `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"findings,omitempty"`
	CVEFindings  []CVEFinding  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"cve_findings,omitempty"`
	OSINTResults []OSINTResult `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"osint_results,omitempty"`
}

// BeforeCreate generates UUID for new projects
func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

// Finding represents a security finding from analysis
type Finding struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	ProjectID string      `gorm:"not null;index" json:"project_id"`
	Type      FindingType `gorm:"not null" json:"type"`
	Title     string      `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Severity    RiskLevel `gorm:"default:low" json:"severity"`

	// Location information
	FilePath   string `json:"file_path"`
	LineNumber int    `json:"line_number"`

	// Finding data
	Content         string                 `json:"content"`
	Context         string                 `json:"context"`
	FindingMetadata map[string]interface{} `gorm:"type:jsonb" json:"finding_metadata"`

	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Project Project `gorm:"foreignKey:ProjectID" json:"-"`
}

// CVEFinding represents a CVE vulnerability finding
type CVEFinding struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	ProjectID string `gorm:"not null;index" json:"project_id"`

	CVEID           string `gorm:"not null" json:"cve_id"`
	SoftwareName    string `gorm:"not null" json:"software_name"`
	SoftwareVersion string `json:"software_version"`

	// CVE details
	Description   string    `json:"description"`
	SeverityScore float64   `json:"severity_score"`
	SeverityLevel RiskLevel `json:"severity_level"`

	// References (JSON array)
	References []string `gorm:"type:jsonb" json:"references"`

	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Project Project `gorm:"foreignKey:ProjectID" json:"-"`
}

// OSINTResult represents OSINT intelligence data
type OSINTResult struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	ProjectID string `gorm:"not null;index" json:"project_id"`

	Source string `gorm:"not null" json:"source"` // shodan, google, fcc, etc.
	Query  string `gorm:"not null" json:"query"`

	// Results
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	URL         string                 `json:"url"`
	Data        map[string]interface{} `gorm:"type:jsonb" json:"data"`

	// Relevance scoring
	ConfidenceScore int `gorm:"default:0" json:"confidence_score"` // 0-100

	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Project Project `gorm:"foreignKey:ProjectID" json:"-"`
}
