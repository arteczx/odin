package worker

import (
	"fmt"
	"log"
	"odin-backend/internal/config"
	"odin-backend/internal/emba"
	"odin-backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type Worker struct {
	db     *gorm.DB
	config *config.Config
	emba   *emba.Service
}

func New(db *gorm.DB, cfg *config.Config) *Worker {
	embaService := emba.New(cfg)
	return &Worker{
		db:     db,
		config: cfg,
		emba:   embaService,
	}
}

// ProcessPendingJobs polls for pending analysis jobs and processes them
func (w *Worker) ProcessPendingJobs() error {
	var projects []models.Project
	
	// Find projects that are pending analysis
	if err := w.db.Where("status = ?", models.StatusPending).Find(&projects).Error; err != nil {
		return fmt.Errorf("failed to query pending projects: %w", err)
	}

	for _, project := range projects {
		log.Printf("Processing pending project: %s (ID: %d)", project.Name, project.ID)
		if err := w.processProject(&project); err != nil {
			log.Printf("Failed to process project %d: %v", project.ID, err)
			w.updateProjectStatus(&project, models.StatusFailed, fmt.Sprintf("Processing failed: %v", err))
		}
	}

	return nil
}

// processProject processes a single firmware analysis project
func (w *Worker) processProject(project *models.Project) error {
	log.Printf("Starting firmware analysis for project %s", project.Name)

	// Update status to analyzing
	if err := w.updateProjectStatus(project, models.StatusAnalyzing, "Running EMBA firmware analysis..."); err != nil {
		return fmt.Errorf("failed to update project status: %w", err)
	}

	// Run EMBA analysis
	result, err := w.emba.AnalyzeFirmware(project.FilePath, fmt.Sprintf("job_%d", project.ID))
	if err != nil {
		log.Printf("EMBA analysis failed for project %s: %v", project.Name, err)
		w.updateProjectStatus(project, models.StatusFailed, fmt.Sprintf("EMBA analysis failed: %v", err))
		return fmt.Errorf("EMBA analysis failed: %w", err)
	}

	if !result.Success {
		log.Printf("EMBA analysis unsuccessful for project %s: %s", project.Name, result.Error)
		w.updateProjectStatus(project, models.StatusFailed, fmt.Sprintf("EMBA analysis failed: %s", result.Error))
		return fmt.Errorf("EMBA analysis failed: %s", result.Error)
	}

	// Parse and save EMBA results
	if err := w.saveAnalysisResults(project, result); err != nil {
		log.Printf("Failed to save analysis results for project %s: %v", project.Name, err)
		w.updateProjectStatus(project, models.StatusFailed, fmt.Sprintf("Failed to save results: %v", err))
		return fmt.Errorf("failed to save analysis results: %w", err)
	}

	// Calculate risk level
	riskLevel := w.calculateRiskLevel(project)
	project.RiskLevel = riskLevel

	// Mark as completed
	now := time.Now()
	project.CompletedAt = &now
	if err := w.updateProjectStatus(project, models.StatusCompleted, "EMBA analysis completed successfully"); err != nil {
		return fmt.Errorf("failed to update completion status: %w", err)
	}

	log.Printf("EMBA analysis completed successfully for project %s", project.Name)
	return nil
}

// updateProjectStatus updates the project status in database
func (w *Worker) updateProjectStatus(project *models.Project, status models.ProjectStatus, message string) error {
	project.Status = status
	
	// Update extraction results with status message
	if project.ExtractionResults == nil {
		project.ExtractionResults = make(map[string]interface{})
	}
	project.ExtractionResults["status_message"] = message
	project.ExtractionResults["last_updated"] = time.Now().UTC()

	return w.db.Save(project).Error
}

// saveAnalysisResults saves EMBA analysis results to database
func (w *Worker) saveAnalysisResults(project *models.Project, result *emba.AnalysisResult) error {
	// Start transaction
	tx := w.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Save findings
	for _, findingData := range result.Results.Findings {
		finding := models.Finding{
			ProjectID:       project.ID,
			Type:            findingData.Type,
			Title:           findingData.Title,
			Description:     findingData.Description,
			Severity:        findingData.Severity,
			FilePath:        findingData.FilePath,
			LineNumber:      findingData.LineNumber,
			Content:         findingData.Content,
			Context:         findingData.Context,
			FindingMetadata: findingData.FindingMetadata,
		}
		if err := tx.Create(&finding).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to save finding: %w", err)
		}
	}

	// Save CVE findings
	for _, cveData := range result.Results.CVEs {
		cveFinding := models.CVEFinding{
			ProjectID:       project.ID,
			CVEID:          cveData.CVEID,
			SoftwareName:   cveData.SoftwareName,
			SoftwareVersion: cveData.SoftwareVersion,
			Description:    cveData.Description,
			SeverityScore:  cveData.SeverityScore,
			SeverityLevel:  cveData.SeverityLevel,
			References:     cveData.References,
		}
		if err := tx.Create(&cveFinding).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to save CVE finding: %w", err)
		}
	}

	// Save OSINT results
	for _, osintData := range result.Results.OSINTResults {
		osintResult := models.OSINTResult{
			ProjectID:       project.ID,
			Source:         osintData.Source,
			Query:          osintData.Query,
			Title:          osintData.Title,
			Description:    osintData.Description,
			URL:            osintData.URL,
			Data:           osintData.Data,
			ConfidenceScore: osintData.ConfidenceScore,
		}
		if err := tx.Create(&osintResult).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to save OSINT result: %w", err)
		}
	}

	// Update project with EMBA results
	project.ExtractionResults = map[string]interface{}{
		"emba_log_dir":    result.LogDir,
		"analysis_time":   result.AnalysisTime,
		"file_info":       result.Results.FileInfo,
		"summary":         result.Results.Summary,
		"emba_stdout":     result.Stdout,
		"success":         result.Success,
	}

	// Update firmware info if available
	if result.Results.FileInfo != nil {
		project.FirmwareInfo = result.Results.FileInfo
	}

	if err := tx.Save(project).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to update project: %w", err)
	}

	return tx.Commit().Error
}

// calculateRiskLevel calculates overall risk level based on findings
func (w *Worker) calculateRiskLevel(project *models.Project) models.RiskLevel {
	var findings []models.Finding
	var cveFindings []models.CVEFinding

	w.db.Where("project_id = ?", project.ID).Find(&findings)
	w.db.Where("project_id = ?", project.ID).Find(&cveFindings)

	// Count severity levels
	criticalCount := 0
	highCount := 0
	mediumCount := 0

	for _, finding := range findings {
		switch finding.Severity {
		case models.RiskCritical:
			criticalCount++
		case models.RiskHigh:
			highCount++
		case models.RiskMedium:
			mediumCount++
		}
	}

	for _, cve := range cveFindings {
		switch cve.SeverityLevel {
		case models.RiskCritical:
			criticalCount++
		case models.RiskHigh:
			highCount++
		case models.RiskMedium:
			mediumCount++
		}
	}

	// Determine overall risk
	if criticalCount > 0 {
		return models.RiskCritical
	} else if highCount >= 3 {
		return models.RiskCritical
	} else if highCount > 0 {
		return models.RiskHigh
	} else if mediumCount >= 5 {
		return models.RiskHigh
	} else if mediumCount > 0 {
		return models.RiskMedium
	}

	return models.RiskLow
}

// mapFindingType maps EMBA finding types to our model types
func (w *Worker) mapFindingType(embaType string) models.FindingType {
	switch embaType {
	case "credential", "password", "key":
		return models.FindingCredential
	case "private_key", "ssh_key", "ssl_key":
		return models.FindingPrivateKey
	case "url", "endpoint":
		return models.FindingURL
	case "ip_address", "ip":
		return models.FindingIPAddress
	case "service", "daemon":
		return models.FindingService
	case "config", "configuration":
		return models.FindingConfigIssue
	case "security", "vulnerability":
		return models.FindingSecurityIssue
	default:
		return models.FindingSensitiveInfo
	}
}

// mapRiskLevel maps EMBA severity levels to our model risk levels
func (w *Worker) mapRiskLevel(embaSeverity string) models.RiskLevel {
	switch embaSeverity {
	case "critical":
		return models.RiskCritical
	case "high":
		return models.RiskHigh
	case "medium":
		return models.RiskMedium
	case "low":
		return models.RiskLow
	default:
		return models.RiskLow
	}
}
