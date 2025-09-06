export interface Project {
  id: string;
  name: string;
  description?: string;
  filename: string;
  file_size: number;
  device_type?: string;
  manufacturer?: string;
  model?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  progress?: number;
}

export interface Finding {
  id: string;
  project_id: string;
  type: 'sensitive_info' | 'binary_analysis' | 'config_analysis' | 'system_emulation' | 'open_port' | 'network_service' | 'web_vulnerability' | 'snmp_analysis' | 'upnp_analysis' | 'vnc_analysis' | 'emulation_finding' | 'cwe_finding' | 'sbom_finding' | 'firmware_info' | 'credential_finding' | 'analysis_summary' | 'risk_assessment' | 'extraction_info' | 'static_analysis' | 'dynamic_analysis' | 'entropy_analysis' | 'certificate_analysis' | 'crypto_analysis';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  title: string;
  description: string;
  file_path?: string;
  line_number?: number;
  context?: string;
  created_at: string;
  finding_metadata?: {
    source?: string;
    module?: string;
    category?: string;
    emulation_data?: any;
    network_data?: any;
    web_data?: any;
    port_info?: any;
    service_info?: any;
    binary_info?: any;
    entropy_data?: any;
    certificate_data?: any;
    extraction_data?: any;
    [key: string]: any;
  };
}

export interface CVEFinding {
  id: string;
  project_id: string;
  cve_id: string;
  software_name: string;
  version: string;
  cvss_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  references: string[];
  created_at: string;
}

export interface OSINTResult {
  id: string;
  project_id: string;
  type: 'domain' | 'ip' | 'certificate' | 'service' | 'vulnerability';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  project_name: string;
  discovered_at: string;
  details: Record<string, any>;
  confidence?: number;
  created_at: string;
}

export interface AnalysisResults {
  project: Project;
  findings: Finding[];
  cve_findings: CVEFinding[];
  osint_results: OSINTResult[];
  summary: {
    total_findings: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    risk_score: number;
  };
}

export interface WebSocketMessage {
  type: 'status_update' | 'progress_update' | 'analysis_complete';
  project_id: string;
  data: any;
}

// EMBA-specific types
export interface EMBAConfig {
  live_testing_enabled: boolean;
  emulation_enabled: boolean;
  cwe_checker_enabled: boolean;
  scan_profile: string;
  thread_count: number;
}

export interface EMBAProfile {
  name: string;
  description: string;
  modules: string[];
}

export interface EMBAModuleResult {
  module: string;
  status: 'completed' | 'failed' | 'skipped';
  findings_count: number;
  execution_time?: number;
  log_file?: string;
}

// Extended EMBA-specific interfaces
export interface EMBAFirmwareInfo {
  architecture?: string;
  endianness?: string;
  file_type?: string;
  entropy?: number;
  size?: number;
  hash?: {
    md5?: string;
    sha1?: string;
    sha256?: string;
  };
  bootloader_info?: any;
  kernel_info?: any;
  filesystem_info?: any;
}

export interface EMBABinaryAnalysis {
  executables: Array<{
    path: string;
    architecture: string;
    stripped: boolean;
    security_features: {
      canary: boolean;
      nx: boolean;
      pie: boolean;
      relro: string;
    };
    functions_count?: number;
    strings_count?: number;
  }>;
  libraries: Array<{
    name: string;
    version?: string;
    vulnerabilities?: CVEFinding[];
  }>;
  certificates?: Array<{
    subject: string;
    issuer: string;
    valid_from: string;
    valid_to: string;
    algorithm: string;
  }>;
}

export interface EMBAStaticAnalysis {
  credentials_found: Array<{
    type: string;
    location: string;
    context: string;
    severity: string;
  }>;
  crypto_material: Array<{
    type: string;
    algorithm?: string;
    key_size?: number;
    location: string;
  }>;
  configuration_files: Array<{
    path: string;
    type: string;
    security_issues: Finding[];
  }>;
  interesting_files: Array<{
    path: string;
    reason: string;
    size: number;
  }>;
}

export interface EMBADynamicAnalysis {
  emulation_status: string;
  emulated_processes: Array<{
    pid: number;
    name: string;
    command: string;
    network_activity?: any[];
  }>;
  network_activity: Array<{
    protocol: string;
    source: string;
    destination: string;
    port: number;
    data_size: number;
  }>;
  file_system_changes: Array<{
    operation: string;
    path: string;
    timestamp: string;
  }>;
  system_calls: Array<{
    syscall: string;
    count: number;
    suspicious: boolean;
  }>;
}

export interface EMBASBOM {
  components: Array<{
    name: string;
    version?: string;
    type: 'library' | 'executable' | 'config' | 'firmware';
    license?: string;
    vulnerabilities: CVEFinding[];
    confidence: number;
  }>;
  total_components: number;
  vulnerable_components: number;
  license_summary: { [key: string]: number };
}

export interface EMBANetworkAnalysis {
  open_ports: Array<{
    port: number;
    protocol: string;
    service: string;
    version?: string;
    banner?: string;
    vulnerabilities: Finding[];
  }>;
  network_services: Array<{
    name: string;
    version?: string;
    configuration: any;
    security_issues: Finding[];
  }>;
  ssl_tls_analysis?: {
    certificates: any[];
    cipher_suites: string[];
    vulnerabilities: Finding[];
  };
}

export interface EMBAWebAnalysis {
  discovered_urls: string[];
  web_technologies: Array<{
    name: string;
    version?: string;
    confidence: number;
  }>;
  vulnerabilities: Finding[];
  authentication_mechanisms: string[];
  session_management: any;
}

export interface EMBAAnalysisResults extends AnalysisResults {
  emba_config: EMBAConfig;
  module_results: EMBAModuleResult[];
  firmware_info?: EMBAFirmwareInfo;
  binary_analysis?: EMBABinaryAnalysis;
  static_analysis?: EMBAStaticAnalysis;
  dynamic_analysis?: EMBADynamicAnalysis;
  sbom?: EMBASBOM;
  network_analysis?: EMBANetworkAnalysis;
  web_analysis?: EMBAWebAnalysis;
  live_testing_results?: {
    system_emulation?: {
      status: string;
      emulated_services: string[];
      network_interfaces: any[];
    };
    network_services?: {
      open_ports: Array<{
        port: string;
        protocol: string;
        service: string;
        version?: string;
      }>;
      vulnerabilities: Finding[];
    };
    web_analysis?: {
      discovered_urls: string[];
      vulnerabilities: Finding[];
      ssl_analysis?: any;
    };
  };
  extraction_info?: {
    extracted_files: number;
    extraction_method: string;
    filesystem_type?: string;
    compression_ratio?: number;
  };
  analysis_metadata?: {
    emba_version: string;
    scan_duration: number;
    log_directory: string;
    scan_profile_used: string;
    modules_executed: string[];
  };
}
