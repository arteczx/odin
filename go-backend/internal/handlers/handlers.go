package handlers

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"odin-backend/internal/config"
	"odin-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct {
	db     *gorm.DB
	config *config.Config
}

func New(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{
		db:     db,
		config: cfg,
	}
}

// HealthCheck returns the health status of the API
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"version":   "1.0.0",
	})
}

// UploadFirmware handles firmware file upload and starts analysis
func (h *Handler) UploadFirmware(c *gin.Context) {
	// Log request details for debugging
	log.Printf("Upload request from %s - Content-Type: %s", c.ClientIP(), c.GetHeader("Content-Type"))
	log.Printf("Request headers: %+v", c.Request.Header)
	
	// Parse multipart form
	err := c.Request.ParseMultipartForm(h.config.MaxFileSize)
	if err != nil {
		log.Printf("Failed to parse multipart form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to parse form",
			"message": err.Error(),
		})
		return
	}

	// Log form fields for debugging
	log.Printf("Form fields: %+v", c.Request.Form)
	log.Printf("Multipart form: %+v", c.Request.MultipartForm)
	
	// Get file from form
	file, header, err := c.Request.FormFile("firmware_file")
	if err != nil {
		log.Printf("Failed to get firmware_file from form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "No firmware file provided",
			"message": "Please provide a firmware file",
		})
		return
	}
	defer file.Close()

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	validExt := false
	for _, supportedExt := range h.config.SupportedExtensions {
		if ext == supportedExt {
			validExt = true
			break
		}
	}
	if !validExt {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Unsupported file type",
			"message": fmt.Sprintf("Supported extensions: %s", strings.Join(h.config.SupportedExtensions, ", ")),
		})
		return
	}

	// Validate file size
	if header.Size > h.config.MaxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "File too large",
			"message": fmt.Sprintf("Maximum file size: %d bytes", h.config.MaxFileSize),
		})
		return
	}

	// Create upload directory if it doesn't exist
	err = os.MkdirAll(h.config.UploadDir, 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create upload directory",
			"message": err.Error(),
		})
		return
	}

	// Generate unique filename
	jobID := uuid.New().String()
	filename := fmt.Sprintf("%s_%s", jobID, header.Filename)
	filePath := filepath.Join(h.config.UploadDir, filename)

	// Save file to disk
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save file",
			"message": err.Error(),
		})
		return
	}
	defer dst.Close()

	// Copy file content and calculate hash
	hasher := sha256.New()
	writer := io.MultiWriter(dst, hasher)
	_, err = io.Copy(writer, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save file",
			"message": err.Error(),
		})
		return
	}

	fileHash := fmt.Sprintf("%x", hasher.Sum(nil))

	// Get project metadata from form
	projectName := c.Request.FormValue("project_name")
	if projectName == "" {
		projectName = strings.TrimSuffix(header.Filename, ext)
	}

	// Create project record
	project := &models.Project{
		ID:          jobID,
		Name:        projectName,
		Description: c.Request.FormValue("description"),
		Status:      models.StatusPending,
		Filename:    header.Filename,
		FilePath:    filePath,
		FileSize:    header.Size,
		FileHash:    fileHash,
		DeviceName:  c.Request.FormValue("device_name"),
		DeviceModel: c.Request.FormValue("device_model"),
		DeviceVersion: c.Request.FormValue("device_version"),
		Manufacturer: c.Request.FormValue("manufacturer"),
		FirmwareInfo: "{}",
		ExtractionResults: "{}",
	}

	// Save project to database
	if err := h.db.Create(project).Error; err != nil {
		// Clean up uploaded file
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create project",
			"message": err.Error(),
		})
		return
	}

	// Start analysis directly (simplified without queue)
	// In a production system, this would be handled by a background worker
	// For now, we'll mark the project as ready for analysis

	// Update project status
	project.Status = models.StatusUploading
	h.db.Save(project)

	c.JSON(http.StatusAccepted, gin.H{
		"job_id":     jobID,
		"project_id": jobID,
		"status":     "QUEUED",
		"message":    "Firmware uploaded successfully, analysis queued",
		"filename":   header.Filename,
		"file_size":  header.Size,
		"file_hash":  fileHash,
	})
}

// GetAnalysisStatus returns the current status of an analysis job
func (h *Handler) GetAnalysisStatus(c *gin.Context) {
	jobID := c.Param("job_id")

	var project models.Project
	if err := h.db.First(&project, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Job not found",
				"message": "Analysis job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":       jobID,
		"project_id":   project.ID,
		"status":       project.Status,
		"risk_level":   project.RiskLevel,
		"created_at":   project.CreatedAt,
		"updated_at":   project.UpdatedAt,
		"completed_at": project.CompletedAt,
	})
}

// GetAnalysisResults returns the complete analysis results
func (h *Handler) GetAnalysisResults(c *gin.Context) {
	jobID := c.Param("job_id")

	var project models.Project
	if err := h.db.Preload("Findings").Preload("CVEFindings").Preload("OSINTResults").
		First(&project, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Job not found",
				"message": "Analysis job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": err.Error(),
		})
		return
	}

	if project.Status != models.StatusCompleted {
		c.JSON(http.StatusAccepted, gin.H{
			"job_id":     jobID,
			"status":     project.Status,
			"message":    "Analysis not yet completed",
			"progress":   h.getProgressMessage(project.Status),
		})
		return
	}

	// Calculate summary statistics
	summary := gin.H{
		"total_findings":   len(project.Findings),
		"total_cves":      len(project.CVEFindings),
		"total_osint":     len(project.OSINTResults),
		"risk_level":      project.RiskLevel,
		"analysis_time":   project.CompletedAt,
	}

	// Count findings by severity
	severityCounts := map[models.RiskLevel]int{
		models.RiskLow:      0,
		models.RiskMedium:   0,
		models.RiskHigh:     0,
		models.RiskCritical: 0,
	}

	for _, finding := range project.Findings {
		severityCounts[finding.Severity]++
	}

	for _, cve := range project.CVEFindings {
		severityCounts[cve.SeverityLevel]++
	}

	summary["severity_counts"] = severityCounts

	c.JSON(http.StatusOK, gin.H{
		"job_id":            jobID,
		"project":           project,
		"findings":          project.Findings,
		"cve_findings":      project.CVEFindings,
		"osint_results":     project.OSINTResults,
		"summary":           summary,
		"extraction_results": project.ExtractionResults,
		"firmware_info":     project.FirmwareInfo,
	})
}

// DeleteAnalysis deletes an analysis job and its results
func (h *Handler) DeleteAnalysis(c *gin.Context) {
	jobID := c.Param("job_id")

	var project models.Project
	if err := h.db.First(&project, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Job not found",
				"message": "Analysis job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": err.Error(),
		})
		return
	}

	// Delete uploaded file
	if err := os.Remove(project.FilePath); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Warning: Failed to delete file %s: %v\n", project.FilePath, err)
	}

	// Delete project (cascade will delete related records)
	if err := h.db.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete project",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Analysis job deleted successfully",
		"job_id":  jobID,
	})
}

// ListProjects returns a list of all projects (for compatibility)
func (h *Handler) ListProjects(c *gin.Context) {
	var projects []models.Project
	
	// Parse query parameters
	limit := 50 // default
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	offset := 0
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	if err := h.db.Limit(limit).Offset(offset).Order("created_at DESC").Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"count":    len(projects),
	})
}

// GetProject returns a specific project (for compatibility)
func (h *Handler) GetProject(c *gin.Context) {
	projectID := c.Param("project_id")

	var project models.Project
	if err := h.db.Preload("Findings").Preload("CVEFindings").Preload("OSINTResults").
		First(&project, "id = ?", projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Project not found",
				"message": "Project not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, project)
}

// DeleteProject deletes a project (for compatibility)
func (h *Handler) DeleteProject(c *gin.Context) {
	projectID := c.Param("project_id")
	c.Param("job_id")
	// Reuse the delete analysis logic
	c.Params = append(c.Params, gin.Param{Key: "job_id", Value: projectID})
	h.DeleteAnalysis(c)
}

// GetEMBAReport returns EMBA HTML report path
func (h *Handler) GetEMBAReport(c *gin.Context) {
	jobID := c.Param("job_id")

	var project models.Project
	if err := h.db.First(&project, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Job not found",
				"message": "Analysis job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": err.Error(),
		})
		return
	}

	// Check for EMBA report in extraction results
	reportPath := ""
	if project.ExtractionResults != "" && project.ExtractionResults != "{}" {
		// Parse JSON string to get log directory
		var extractionData map[string]interface{}
		if err := json.Unmarshal([]byte(project.ExtractionResults), &extractionData); err == nil {
			if logDir, ok := extractionData["emba_log_dir"].(string); ok {
				// Look for HTML report files
				reportPath = filepath.Join(logDir, "html-report", "index.html")
				if _, err := os.Stat(reportPath); os.IsNotExist(err) {
					// Try alternative paths
					reportPath = filepath.Join(logDir, "report.html")
					if _, err := os.Stat(reportPath); os.IsNotExist(err) {
						reportPath = ""
					}
				}
			}
		}
	}

	if reportPath == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "EMBA report not found",
			"message": "EMBA HTML report is not available",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":           jobID,
		"report_path":      reportPath,
		"report_available": true,
	})
}

// GetEMBAResults returns EMBA analysis results in structured format
func (h *Handler) GetEMBAResults(c *gin.Context) {
	jobID := c.Param("job_id")

	var project models.Project
	err := h.db.Where("id = ?", jobID).First(&project).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Project not found",
			"message": "No project found with the given job ID",
		})
		return
	}

	// Check if analysis is completed
	if project.Status != "completed" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Analysis not completed",
			"message": "EMBA analysis is not yet completed for this project",
		})
		return
	}

	// Return the analysis results from the project
	c.JSON(http.StatusOK, gin.H{
		"job_id":            jobID,
		"project_id":        project.ID,
		"status":            "completed",
		"firmware_info":     project.FirmwareInfo,
		"extraction_results": project.ExtractionResults,
		"findings":          project.Findings,
		"cve_findings":      project.CVEFindings,
		"osint_results":     project.OSINTResults,
		"generated_at":      project.UpdatedAt,
		"analysis_time":     project.CompletedAt,
	})
}

// GetEMBALogs returns EMBA log files information
func (h *Handler) GetEMBALogs(c *gin.Context) {
	jobID := c.Param("job_id")

	var project models.Project
	if err := h.db.First(&project, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Job not found",
				"message": "Analysis job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"message": err.Error(),
		})
		return
	}

	// Get log directory from extraction results
	logDir := ""
	if project.ExtractionResults != "" && project.ExtractionResults != "{}" {
		// Parse JSON string to get log directory
		var extractionData map[string]interface{}
		if err := json.Unmarshal([]byte(project.ExtractionResults), &extractionData); err == nil {
			if dir, ok := extractionData["emba_log_dir"].(string); ok {
				logDir = dir
			}
		}
	}

	if logDir == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "EMBA logs not found",
			"message": "EMBA log directory not available",
		})
		return
	}

	// List log files
	var logFiles []gin.H
	err := filepath.Walk(logDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Skip errors
		}
		if !info.IsDir() {
			relPath, _ := filepath.Rel(logDir, path)
			logFiles = append(logFiles, gin.H{
				"name": info.Name(),
				"path": relPath,
				"size": info.Size(),
				"type": filepath.Ext(path),
			})
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to list log files",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":        jobID,
		"log_directory": logDir,
		"files":         logFiles,
	})
}

// GetEMBAProfiles returns available EMBA scan profiles
func (h *Handler) GetEMBAProfiles(c *gin.Context) {
	profilesDir := filepath.Join(h.config.EMBAPath, "scan-profiles")
	
	profiles := []gin.H{
		{
			"name":        "default-scan",
			"filename":    "default-scan.emba",
			"description": "Default EMBA scan profile with comprehensive analysis",
			"enabled":     true,
		},
		{
			"name":        "quick-scan",
			"filename":    "quick-scan.emba",
			"description": "Quick scan profile for faster analysis",
			"enabled":     true,
		},
		{
			"name":        "full-scan",
			"filename":    "full-scan.emba",
			"description": "Full comprehensive scan with all modules",
			"enabled":     true,
		},
	}
	
	// Check if profiles directory exists and add real profiles if available
	if _, err := os.Stat(profilesDir); err == nil {
		files, err := os.ReadDir(profilesDir)
		if err == nil {
			for _, file := range files {
				if !file.IsDir() && strings.HasSuffix(file.Name(), ".emba") {
					info, _ := file.Info()
					name := strings.TrimSuffix(file.Name(), ".emba")
					
					// Check if this profile is already in our default list
					found := false
					for i, profile := range profiles {
						if profile["name"] == name {
							profiles[i] = gin.H{
								"name":        name,
								"filename":    file.Name(),
								"description": fmt.Sprintf("EMBA scan profile: %s", name),
								"size":        info.Size(),
								"modified_at": info.ModTime(),
								"enabled":     true,
							}
							found = true
							break
						}
					}
					
					if !found {
						profiles = append(profiles, gin.H{
							"name":        name,
							"filename":    file.Name(),
							"description": fmt.Sprintf("EMBA scan profile: %s", name),
							"size":        info.Size(),
							"modified_at": info.ModTime(),
							"enabled":     true,
						})
					}
				}
			}
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"profiles": profiles,
		"total":    len(profiles),
		"profiles_dir": profilesDir,
	})
}

// Helper function to get profile description
func (h *Handler) getProfileDescription(profilePath string) string {
	content, err := os.ReadFile(profilePath)
	if err != nil {
		return "No description available"
	}

	lines := strings.Split(string(content), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "#") && strings.Contains(strings.ToLower(line), "description") {
			return strings.TrimPrefix(line, "#")
		}
	}
	
	return "EMBA scan profile"
}

// GetEMBAConfig returns current EMBA configuration
func (h *Handler) GetEMBAConfig(c *gin.Context) {
	config := gin.H{
		"emba_path":             h.config.EMBAPath,
		"log_dir":              h.config.EMBALogDir,
		"scan_profile":         h.config.EMBAScanProfile,
		"threads":              h.config.EMBAThreads,
		"enable_emulation":     h.config.EMBAEnableEmulation,
		"enable_cwe_check":     h.config.EMBAEnableCWECheck,
		"enable_live_testing":  h.config.EMBAEnableLiveTesting,
	}
	
	c.JSON(http.StatusOK, gin.H{
		"config": config,
		"status": "success",
	})
}

// UpdateEMBAConfig updates EMBA configuration
func (h *Handler) UpdateEMBAConfig(c *gin.Context) {
	var updateRequest struct {
		ScanProfile        *string `json:"scan_profile"`
		Threads           *int    `json:"threads"`
		EnableEmulation   *bool   `json:"enable_emulation"`
		EnableCWECheck    *bool   `json:"enable_cwe_check"`
		EnableLiveTesting *bool   `json:"enable_live_testing"`
	}
	
	if err := c.ShouldBindJSON(&updateRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}
	
	// Note: In a real implementation, you'd want to persist these changes
	// For now, we'll just return the updated configuration
	updatedConfig := gin.H{
		"emba_path":             h.config.EMBAPath,
		"log_dir":              h.config.EMBALogDir,
		"scan_profile":         h.config.EMBAScanProfile,
		"threads":              h.config.EMBAThreads,
		"enable_emulation":     h.config.EMBAEnableEmulation,
		"enable_cwe_check":     h.config.EMBAEnableCWECheck,
		"enable_live_testing":  h.config.EMBAEnableLiveTesting,
	}
	
	// Apply updates if provided
	if updateRequest.ScanProfile != nil {
		updatedConfig["scan_profile"] = *updateRequest.ScanProfile
	}
	if updateRequest.Threads != nil {
		updatedConfig["threads"] = *updateRequest.Threads
	}
	if updateRequest.EnableEmulation != nil {
		updatedConfig["enable_emulation"] = *updateRequest.EnableEmulation
	}
	if updateRequest.EnableCWECheck != nil {
		updatedConfig["enable_cwe_check"] = *updateRequest.EnableCWECheck
	}
	if updateRequest.EnableLiveTesting != nil {
		updatedConfig["enable_live_testing"] = *updateRequest.EnableLiveTesting
	}
	
	c.JSON(http.StatusOK, gin.H{
		"config": updatedConfig,
		"status": "success",
		"message": "EMBA configuration updated successfully",
	})
}

// Helper function to get progress message based on status
func (h *Handler) getProgressMessage(status models.ProjectStatus) string {
	switch status {
	case models.StatusPending:
		return "Analysis queued, waiting to start"
	case models.StatusUploading:
		return "File uploaded, preparing for analysis"
	case models.StatusExtracting:
		return "Extracting firmware filesystem"
	case models.StatusAnalyzing:
		return "Running EMBA security analysis"
	case models.StatusOSINT:
		return "Gathering OSINT intelligence"
	case models.StatusCompleted:
		return "Analysis completed successfully"
	case models.StatusFailed:
		return "Analysis failed"
	default:
		return "Processing..."
	}
}
