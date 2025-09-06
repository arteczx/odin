import axios from 'axios';
import { Project, AnalysisResults, CVEFinding, OSINTResult, EMBAConfig, EMBAProfile, EMBAAnalysisResults } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API
export const projectsApi = {
  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects/');
    return response.data;
  },

  // Get project by ID
  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Upload firmware and start analysis
  uploadFirmware: async (
    file: File,
    metadata: {
      name: string;
      description?: string;
      device_name?: string;
      device_model?: string;
      device_version?: string;
      manufacturer?: string;
    }
  ): Promise<{ job_id: string; project_id: string; status: string }> => {
    const formData = new FormData();
    formData.append('firmware_file', file);
    formData.append('project_name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.device_name) formData.append('device_name', metadata.device_name);
    if (metadata.device_model) formData.append('device_model', metadata.device_model);
    if (metadata.device_version) formData.append('device_version', metadata.device_version);
    if (metadata.manufacturer) formData.append('manufacturer', metadata.manufacturer);

    const response = await api.post('/firmware/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Analysis API
export const analysisApi = {
  // Get analysis results
  getResults: async (jobId: string): Promise<AnalysisResults> => {
    const response = await api.get(`/analysis/${jobId}/results`);
    return response.data;
  },

  // Get analysis status
  getStatus: async (jobId: string): Promise<{ job_id: string; status: string; risk_level: string; created_at: string; updated_at: string; completed_at?: string }> => {
    const response = await api.get(`/analysis/${jobId}/status`);
    return response.data;
  },

  // Delete analysis
  deleteAnalysis: async (jobId: string): Promise<void> => {
    await api.delete(`/analysis/${jobId}`);
  },
};

// Vulnerabilities API
export const vulnerabilitiesApi = {
  // Get all vulnerabilities
  getVulnerabilities: async (): Promise<CVEFinding[]> => {
    const response = await api.get('/vulnerabilities/');
    return response.data;
  },

  // Get vulnerabilities by project
  getProjectVulnerabilities: async (projectId: string): Promise<CVEFinding[]> => {
    const response = await api.get(`/projects/${projectId}/vulnerabilities`);
    return response.data;
  },
};

// OSINT API
export const osintApi = {
  // Get all OSINT results
  getOSINTResults: async (): Promise<OSINTResult[]> => {
    const response = await api.get('/osint/');
    return response.data;
  },

  // Get OSINT results by project
  getProjectOSINT: async (projectId: string): Promise<OSINTResult[]> => {
    const response = await api.get(`/projects/${projectId}/osint`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  // Get all reports
  getReports: async (): Promise<any[]> => {
    const response = await api.get('/reports/');
    return response.data;
  },

  // Generate report
  generateReport: async (projectId: string, reportType: string): Promise<{ report_id: string }> => {
    const response = await api.post('/reports/generate', {
      project_id: projectId,
      report_type: reportType,
    });
    return response.data;
  },

  // Download report
  downloadReport: async (reportId: string): Promise<Blob> => {
    const response = await api.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// EMBA API
export const embaApi = {
  // Get EMBA report
  getReport: async (jobId: string) => {
    const response = await api.get(`/emba/${jobId}/report`);
    return response.data;
  },
  
  // Get EMBA logs
  getLogs: async (jobId: string) => {
    const response = await api.get(`/emba/${jobId}/logs`);
    return response.data;
  },
  
  // Get EMBA configuration
  getConfig: async (): Promise<EMBAConfig> => {
    const response = await api.get('/emba/config');
    return response.data;
  },
  
  // Update EMBA configuration
  updateConfig: async (config: Partial<EMBAConfig>): Promise<EMBAConfig> => {
    const response = await api.post('/emba/config', config);
    return response.data;
  },
  
  // Get available EMBA profiles
  getProfiles: async (): Promise<EMBAProfile[]> => {
    const response = await api.get('/emba/profiles');
    return response.data;
  },
  
  // Get enhanced EMBA analysis results
  getAnalysisResults: async (jobId: string): Promise<EMBAAnalysisResults> => {
    const response = await api.get(`/emba/${jobId}/results`);
    return response.data;
  },
};

export default api;
