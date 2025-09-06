import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  NetworkCheck as NetworkIcon,
  Web as WebIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Memory as MemoryIcon,
  Computer as ComputerIcon,
  Lock as LockIcon,
  VerifiedUser as CertificateIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Visibility as VisibilityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { EMBAAnalysisResults } from '../../types';

interface EMBAResultsProps {
  results: EMBAAnalysisResults;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`emba-tabpanel-${index}`}
      aria-labelledby={`emba-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return '#d32f2f';
    case 'high': return '#f57c00';
    case 'medium': return '#fbc02d';
    case 'low': return '#388e3c';
    case 'info': return '#1976d2';
    default: return '#757575';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return <ErrorIcon sx={{ color: '#d32f2f' }} />;
    case 'high': return <WarningIcon sx={{ color: '#f57c00' }} />;
    case 'medium': return <InfoIcon sx={{ color: '#fbc02d' }} />;
    case 'low': return <CheckCircleIcon sx={{ color: '#388e3c' }} />;
    case 'info': return <InfoIcon sx={{ color: '#1976d2' }} />;
    default: return <InfoIcon sx={{ color: '#757575' }} />;
  }
};

export const EMBAResults: React.FC<EMBAResultsProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Summary Statistics
  const getSummaryStats = () => {
    const stats = {
      totalFindings: results.findings?.length || 0,
      totalCVEs: results.cve_findings?.length || 0,
      criticalCount: results.summary?.critical_count || 0,
      highCount: results.summary?.high_count || 0,
      mediumCount: results.summary?.medium_count || 0,
      lowCount: results.summary?.low_count || 0,
      riskScore: results.summary?.risk_score || 0,
      modulesExecuted: results.module_results?.length || 0,
      sbomComponents: results.sbom?.total_components || 0,
      vulnerableComponents: results.sbom?.vulnerable_components || 0,
    };
    return stats;
  };

  const stats = getSummaryStats();

  // Overview Tab Component
  const OverviewTab = () => (
    <Box>
      {/* Executive Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="primary">{stats.totalFindings}</Typography>
                <Typography variant="body2" color="textSecondary">Total Findings</Typography>
              </Box>
              <BugReportIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="error">{stats.totalCVEs}</Typography>
                <Typography variant="body2" color="textSecondary">CVE Findings</Typography>
              </Box>
              <SecurityIcon color="error" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="warning">{stats.riskScore}</Typography>
                <Typography variant="body2" color="textSecondary">Risk Score</Typography>
              </Box>
              <AssessmentIcon color="warning" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" color="success">{stats.modulesExecuted}</Typography>
                <Typography variant="body2" color="textSecondary">Modules Executed</Typography>
              </Box>
              <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Severity Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Severity Distribution</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: getSeverityColor('critical') }}>{stats.criticalCount}</Typography>
            <Typography variant="body2">Critical</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: getSeverityColor('high') }}>{stats.highCount}</Typography>
            <Typography variant="body2">High</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: getSeverityColor('medium') }}>{stats.mediumCount}</Typography>
            <Typography variant="body2">Medium</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: getSeverityColor('low') }}>{stats.lowCount}</Typography>
            <Typography variant="body2">Low</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Module Execution Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Module Execution Summary</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {results.module_results?.map((module, index) => (
            <Card key={`${module.module}-${index}`} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">{module.module}</Typography>
                  <Chip 
                    label={module.status} 
                    color={module.status === 'completed' ? 'success' : module.status === 'failed' ? 'error' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Findings: {module.findings_count || 0}
                </Typography>
                {module.execution_time && (
                  <Typography variant="body2" color="textSecondary">
                    Duration: {module.execution_time}s
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Analysis Metadata */}
      {results.analysis_metadata && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Analysis Information</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="textSecondary">EMBA Version</Typography>
              <Typography variant="body1">{results.analysis_metadata.emba_version}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">Scan Duration</Typography>
              <Typography variant="body1">{Math.round(results.analysis_metadata.scan_duration / 60)} minutes</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">Scan Profile</Typography>
              <Typography variant="body1">{results.analysis_metadata.scan_profile_used}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">Log Directory</Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {results.analysis_metadata.log_directory}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon />
        EMBA Analysis Results
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" icon={<AssessmentIcon />} />
          <Tab label="Firmware Info" icon={<MemoryIcon />} />
          <Tab label="Binary Analysis" icon={<CodeIcon />} />
          <Tab label="Static Analysis" icon={<AnalyticsIcon />} />
          <Tab label="Dynamic Analysis" icon={<ComputerIcon />} />
          <Tab label="Network Analysis" icon={<NetworkIcon />} />
          <Tab label="Web Analysis" icon={<WebIcon />} />
          <Tab label="SBOM" icon={<StorageIcon />} />
          <Tab label="CVE Details" icon={<SecurityIcon />} />
          <Tab label="All Findings" icon={<BugReportIcon />} />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <OverviewTab />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Firmware Info Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>Firmware Information</Typography>
          {results.firmware_info ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Basic Firmware Info */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MemoryIcon />
                  Basic Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {results.firmware_info.architecture && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Architecture</Typography>
                      <Typography variant="body1">{results.firmware_info.architecture}</Typography>
                    </Box>
                  )}
                  {results.firmware_info.endianness && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Endianness</Typography>
                      <Typography variant="body1">{results.firmware_info.endianness}</Typography>
                    </Box>
                  )}
                  {results.firmware_info.file_type && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">File Type</Typography>
                      <Typography variant="body1">{results.firmware_info.file_type}</Typography>
                    </Box>
                  )}
                  {results.firmware_info.size && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Size</Typography>
                      <Typography variant="body1">{(results.firmware_info.size / 1024 / 1024).toFixed(2)} MB</Typography>
                    </Box>
                  )}
                  {results.firmware_info.entropy && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Entropy</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{results.firmware_info.entropy.toFixed(3)}</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={results.firmware_info.entropy * 12.5} 
                          sx={{ width: 100 }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Hash Information */}
              {results.firmware_info.hash && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon />
                    Hash Values
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {results.firmware_info.hash.md5 && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">MD5</Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {results.firmware_info.hash.md5}
                        </Typography>
                      </Box>
                    )}
                    {results.firmware_info.hash.sha1 && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">SHA1</Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {results.firmware_info.hash.sha1}
                        </Typography>
                      </Box>
                    )}
                    {results.firmware_info.hash.sha256 && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">SHA256</Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {results.firmware_info.hash.sha256}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}

              {/* Bootloader and Kernel Info */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                {results.firmware_info.bootloader_info && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Bootloader Information</Typography>
                    <Typography variant="body1">{JSON.stringify(results.firmware_info.bootloader_info, null, 2)}</Typography>
                  </Paper>
                )}
                {results.firmware_info.kernel_info && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Kernel Information</Typography>
                    <Typography variant="body1">{JSON.stringify(results.firmware_info.kernel_info, null, 2)}</Typography>
                  </Paper>
                )}
              </Box>

              {/* Filesystem Info */}
              {results.firmware_info.filesystem_info && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon />
                    Filesystem Information
                  </Typography>
                  <Typography variant="body1">{JSON.stringify(results.firmware_info.filesystem_info, null, 2)}</Typography>
                </Paper>
              )}
            </Box>
          ) : (
            <Alert severity="info">No firmware information available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Binary Analysis Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>Binary Analysis</Typography>
          {results.binary_analysis ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Executables */}
              {results.binary_analysis.executables && results.binary_analysis.executables.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon />
                    Executables ({results.binary_analysis.executables.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Path</TableCell>
                          <TableCell>Architecture</TableCell>
                          <TableCell>Stripped</TableCell>
                          <TableCell>Security Features</TableCell>
                          <TableCell>Functions</TableCell>
                          <TableCell>Strings</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.binary_analysis.executables.map((exe, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {exe.path}
                            </TableCell>
                            <TableCell>{exe.architecture}</TableCell>
                            <TableCell>
                              <Chip 
                                label={exe.stripped ? 'Yes' : 'No'} 
                                color={exe.stripped ? 'warning' : 'success'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip 
                                  label={`Canary: ${exe.security_features.canary ? 'Yes' : 'No'}`}
                                  color={exe.security_features.canary ? 'success' : 'error'}
                                  size="small"
                                />
                                <Chip 
                                  label={`NX: ${exe.security_features.nx ? 'Yes' : 'No'}`}
                                  color={exe.security_features.nx ? 'success' : 'error'}
                                  size="small"
                                />
                                <Chip 
                                  label={`PIE: ${exe.security_features.pie ? 'Yes' : 'No'}`}
                                  color={exe.security_features.pie ? 'success' : 'error'}
                                  size="small"
                                />
                                <Chip 
                                  label={`RELRO: ${exe.security_features.relro}`}
                                  color={exe.security_features.relro === 'Full' ? 'success' : exe.security_features.relro === 'Partial' ? 'warning' : 'error'}
                                  size="small"
                                />
                              </Box>
                            </TableCell>
                            <TableCell>{exe.functions_count || 'N/A'}</TableCell>
                            <TableCell>{exe.strings_count || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Libraries */}
              {results.binary_analysis.libraries && results.binary_analysis.libraries.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon />
                    Libraries ({results.binary_analysis.libraries.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Vulnerabilities</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.binary_analysis.libraries.map((lib, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{lib.name}</TableCell>
                            <TableCell>{lib.version || 'Unknown'}</TableCell>
                            <TableCell>
                              {lib.vulnerabilities && lib.vulnerabilities.length > 0 ? (
                                <Chip 
                                  label={`${lib.vulnerabilities.length} CVEs`}
                                  color="error"
                                  size="small"
                                />
                              ) : (
                                <Chip label="None" color="success" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Certificates */}
              {results.binary_analysis.certificates && results.binary_analysis.certificates.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CertificateIcon />
                    Certificates ({results.binary_analysis.certificates.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject</TableCell>
                          <TableCell>Issuer</TableCell>
                          <TableCell>Valid From</TableCell>
                          <TableCell>Valid To</TableCell>
                          <TableCell>Algorithm</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.binary_analysis.certificates.map((cert, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {cert.subject}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {cert.issuer}
                            </TableCell>
                            <TableCell>{new Date(cert.valid_from).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(cert.valid_to).toLocaleDateString()}</TableCell>
                            <TableCell>{cert.algorithm}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          ) : (
            <Alert severity="info">No binary analysis data available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Static Analysis Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>Static Analysis</Typography>
          {results.static_analysis ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Credentials Found */}
              {results.static_analysis.credentials_found && results.static_analysis.credentials_found.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon />
                    Credentials Found ({results.static_analysis.credentials_found.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Context</TableCell>
                          <TableCell>Severity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.static_analysis.credentials_found.map((cred, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip label={cred.type} color="warning" size="small" />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {cred.location}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cred.context}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={cred.severity}
                                color={cred.severity === 'high' ? 'error' : cred.severity === 'medium' ? 'warning' : 'info'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Crypto Material */}
              {results.static_analysis.crypto_material && results.static_analysis.crypto_material.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon />
                    Cryptographic Material ({results.static_analysis.crypto_material.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Algorithm</TableCell>
                          <TableCell>Key Size</TableCell>
                          <TableCell>Location</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.static_analysis.crypto_material.map((crypto, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip label={crypto.type} color="primary" size="small" />
                            </TableCell>
                            <TableCell>{crypto.algorithm || 'Unknown'}</TableCell>
                            <TableCell>{crypto.key_size ? `${crypto.key_size} bits` : 'Unknown'}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {crypto.location}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Configuration Files */}
              {results.static_analysis.configuration_files && results.static_analysis.configuration_files.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon />
                    Configuration Files ({results.static_analysis.configuration_files.length})
                  </Typography>
                  {results.static_analysis.configuration_files.map((config, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography variant="subtitle1" sx={{ fontFamily: 'monospace' }}>
                            {config.path}
                          </Typography>
                          <Chip label={config.type} size="small" />
                          {config.security_issues.length > 0 && (
                            <Chip 
                              label={`${config.security_issues.length} issues`}
                              color="warning"
                              size="small"
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {config.security_issues.length > 0 ? (
                          <List>
                            {config.security_issues.map((issue, issueIndex) => (
                              <ListItem key={issueIndex}>
                                <ListItemIcon>
                                  {getSeverityIcon(issue.severity)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={issue.title}
                                  secondary={issue.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography color="textSecondary">No security issues found</Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Paper>
              )}

              {/* Interesting Files */}
              {results.static_analysis.interesting_files && results.static_analysis.interesting_files.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VisibilityIcon />
                    Interesting Files ({results.static_analysis.interesting_files.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Path</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.static_analysis.interesting_files.map((file, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {file.path}
                            </TableCell>
                            <TableCell>{file.reason}</TableCell>
                            <TableCell>{(file.size / 1024).toFixed(1)} KB</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          ) : (
            <Alert severity="info">No static analysis data available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {/* Dynamic Analysis Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>Dynamic Analysis & Emulation</Typography>
          {results.dynamic_analysis ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Emulation Status */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ComputerIcon />
                  Emulation Status
                </Typography>
                <Chip 
                  label={results.dynamic_analysis.emulation_status}
                  color={results.dynamic_analysis.emulation_status === 'success' ? 'success' : 'error'}
                  size="medium"
                />
              </Paper>

              {/* Emulated Processes */}
              {results.dynamic_analysis.emulated_processes && results.dynamic_analysis.emulated_processes.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon />
                    Emulated Processes ({results.dynamic_analysis.emulated_processes.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>PID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Command</TableCell>
                          <TableCell>Network Activity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.dynamic_analysis.emulated_processes.map((process, index) => (
                          <TableRow key={index}>
                            <TableCell>{process.pid}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{process.name}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {process.command}
                            </TableCell>
                            <TableCell>
                              {process.network_activity && process.network_activity.length > 0 ? (
                                <Chip label={`${process.network_activity.length} connections`} color="info" size="small" />
                              ) : (
                                <Chip label="None" color="default" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Network Activity */}
              {results.dynamic_analysis.network_activity && results.dynamic_analysis.network_activity.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NetworkIcon />
                    Network Activity ({results.dynamic_analysis.network_activity.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Protocol</TableCell>
                          <TableCell>Source</TableCell>
                          <TableCell>Destination</TableCell>
                          <TableCell>Port</TableCell>
                          <TableCell>Data Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.dynamic_analysis.network_activity.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip label={activity.protocol} color="primary" size="small" />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{activity.source}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{activity.destination}</TableCell>
                            <TableCell>{activity.port}</TableCell>
                            <TableCell>{(activity.data_size / 1024).toFixed(1)} KB</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* File System Changes */}
              {results.dynamic_analysis.file_system_changes && results.dynamic_analysis.file_system_changes.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon />
                    File System Changes ({results.dynamic_analysis.file_system_changes.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Operation</TableCell>
                          <TableCell>Path</TableCell>
                          <TableCell>Timestamp</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.dynamic_analysis.file_system_changes.map((change, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={change.operation}
                                color={change.operation === 'create' ? 'success' : change.operation === 'delete' ? 'error' : 'info'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {change.path}
                            </TableCell>
                            <TableCell>{new Date(change.timestamp).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* System Calls */}
              {results.dynamic_analysis.system_calls && results.dynamic_analysis.system_calls.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon />
                    System Calls Analysis
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>System Call</TableCell>
                          <TableCell>Count</TableCell>
                          <TableCell>Suspicious</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.dynamic_analysis.system_calls.map((syscall, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{syscall.syscall}</TableCell>
                            <TableCell>{syscall.count}</TableCell>
                            <TableCell>
                              <Chip 
                                label={syscall.suspicious ? 'Yes' : 'No'}
                                color={syscall.suspicious ? 'error' : 'success'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          ) : (
            <Alert severity="info">No dynamic analysis data available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        {/* Network Analysis Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>Network Analysis</Typography>
          {results.network_analysis ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Open Ports */}
              {results.network_analysis.open_ports && results.network_analysis.open_ports.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NetworkIcon />
                    Open Ports ({results.network_analysis.open_ports.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Port</TableCell>
                          <TableCell>Protocol</TableCell>
                          <TableCell>Service</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Banner</TableCell>
                          <TableCell>Vulnerabilities</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.network_analysis.open_ports.map((port, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{port.port}</TableCell>
                            <TableCell>
                              <Chip label={port.protocol} color="primary" size="small" />
                            </TableCell>
                            <TableCell>{port.service}</TableCell>
                            <TableCell>{port.version || 'Unknown'}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {port.banner || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {port.vulnerabilities && port.vulnerabilities.length > 0 ? (
                                <Chip 
                                  label={`${port.vulnerabilities.length} issues`}
                                  color="error"
                                  size="small"
                                />
                              ) : (
                                <Chip label="None" color="success" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Network Services */}
              {results.network_analysis.network_services && results.network_analysis.network_services.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ComputerIcon />
                    Network Services ({results.network_analysis.network_services.length})
                  </Typography>
                  {results.network_analysis.network_services.map((service, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {service.name}
                          </Typography>
                          {service.version && (
                            <Chip label={service.version} size="small" />
                          )}
                          {service.security_issues.length > 0 && (
                            <Chip 
                              label={`${service.security_issues.length} issues`}
                              color="warning"
                              size="small"
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {service.security_issues.length > 0 ? (
                          <List>
                            {service.security_issues.map((issue, issueIndex) => (
                              <ListItem key={issueIndex}>
                                <ListItemIcon>
                                  {getSeverityIcon(issue.severity)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={issue.title}
                                  secondary={issue.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography color="textSecondary">No security issues found</Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Paper>
              )}

              {/* SSL/TLS Analysis */}
              {results.network_analysis.ssl_tls_analysis && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon />
                    SSL/TLS Analysis
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {results.network_analysis.ssl_tls_analysis.certificates && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>Certificates</Typography>
                        <Typography variant="body2">
                          {results.network_analysis.ssl_tls_analysis.certificates.length} certificates found
                        </Typography>
                      </Box>
                    )}
                    {results.network_analysis.ssl_tls_analysis.cipher_suites && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>Cipher Suites</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {results.network_analysis.ssl_tls_analysis.cipher_suites.map((cipher, index) => (
                            <Chip key={index} label={cipher} size="small" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {results.network_analysis.ssl_tls_analysis.vulnerabilities && results.network_analysis.ssl_tls_analysis.vulnerabilities.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>SSL/TLS Vulnerabilities</Typography>
                        <List>
                          {results.network_analysis.ssl_tls_analysis.vulnerabilities.map((vuln, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                {getSeverityIcon(vuln.severity)}
                              </ListItemIcon>
                              <ListItemText
                                primary={vuln.title}
                                secondary={vuln.description}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          ) : (
            <Alert severity="info">No network analysis data available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={6}>
        {/* Web Analysis Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>Web Analysis</Typography>
          {results.web_analysis ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Discovered URLs */}
              {results.web_analysis.discovered_urls && results.web_analysis.discovered_urls.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WebIcon />
                    Discovered URLs ({results.web_analysis.discovered_urls.length})
                  </Typography>
                  <List>
                    {results.web_analysis.discovered_urls.map((url, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={url}
                          sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Web Technologies */}
              {results.web_analysis.web_technologies && results.web_analysis.web_technologies.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon />
                    Web Technologies ({results.web_analysis.web_technologies.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Technology</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.web_analysis.web_technologies.map((tech, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{tech.name}</TableCell>
                            <TableCell>{tech.version || 'Unknown'}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{tech.confidence}%</Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={tech.confidence} 
                                  sx={{ width: 100 }}
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Web Vulnerabilities */}
              {results.web_analysis.vulnerabilities && results.web_analysis.vulnerabilities.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon />
                    Web Vulnerabilities ({results.web_analysis.vulnerabilities.length})
                  </Typography>
                  <List>
                    {results.web_analysis.vulnerabilities.map((vuln, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getSeverityIcon(vuln.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={vuln.title}
                          secondary={vuln.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Authentication & Session Management */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                {results.web_analysis.authentication_mechanisms && results.web_analysis.authentication_mechanisms.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Authentication Mechanisms</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {results.web_analysis.authentication_mechanisms.map((auth, index) => (
                        <Chip key={index} label={auth} color="primary" size="small" />
                      ))}
                    </Box>
                  </Paper>
                )}
                {results.web_analysis.session_management && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Session Management</Typography>
                    <Typography variant="body2">
                      {JSON.stringify(results.web_analysis.session_management, null, 2)}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          ) : (
            <Alert severity="info">No web analysis data available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={7}>
        {/* SBOM Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>Software Bill of Materials (SBOM)</Typography>
          {results.sbom ? (
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* SBOM Summary */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon />
                  SBOM Summary
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">{results.sbom.total_components}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Components</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error">{results.sbom.vulnerable_components}</Typography>
                    <Typography variant="body2" color="textSecondary">Vulnerable Components</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success">
                      {results.sbom.total_components - results.sbom.vulnerable_components}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Clean Components</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* License Summary */}
              {results.sbom.license_summary && Object.keys(results.sbom.license_summary).length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>License Distribution</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Object.entries(results.sbom.license_summary).map(([license, count]) => (
                      <Chip 
                        key={license}
                        label={`${license}: ${count}`}
                        color="info"
                        size="small"
                      />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Components Table */}
              {results.sbom.components && results.sbom.components.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Components</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>License</TableCell>
                          <TableCell>Vulnerabilities</TableCell>
                          <TableCell>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.sbom.components.map((component, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{component.name}</TableCell>
                            <TableCell>{component.version || 'Unknown'}</TableCell>
                            <TableCell>
                              <Chip label={component.type} color="primary" size="small" />
                            </TableCell>
                            <TableCell>{component.license || 'Unknown'}</TableCell>
                            <TableCell>
                              {component.vulnerabilities && component.vulnerabilities.length > 0 ? (
                                <Chip 
                                  label={`${component.vulnerabilities.length} CVEs`}
                                  color="error"
                                  size="small"
                                />
                              ) : (
                                <Chip label="None" color="success" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{component.confidence}%</Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={component.confidence} 
                                  sx={{ width: 80 }}
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          ) : (
            <Alert severity="info">No SBOM data available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={8}>
        {/* CVE Details Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>CVE Details</Typography>
          {results.cve_findings && results.cve_findings.length > 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon />
                CVE Findings ({results.cve_findings.length})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>CVE ID</TableCell>
                      <TableCell>Software</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell>CVSS Score</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.cve_findings.map((cve, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {cve.cve_id}
                        </TableCell>
                        <TableCell>{cve.software_name}</TableCell>
                        <TableCell>{cve.version}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{cve.cvss_score}</Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(cve.cvss_score / 10) * 100} 
                              sx={{ width: 60 }}
                              color={cve.cvss_score >= 7 ? 'error' : cve.cvss_score >= 4 ? 'warning' : 'success'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={cve.severity}
                            color={cve.severity === 'critical' ? 'error' : cve.severity === 'high' ? 'warning' : cve.severity === 'medium' ? 'info' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cve.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Alert severity="info">No CVE findings available</Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={9}>
        {/* All Findings Tab */}
        <Box>
          <Typography variant="h6" gutterBottom>All Findings</Typography>
          {results.findings && results.findings.length > 0 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {results.findings.map((finding, index) => (
                <Paper key={index} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getSeverityIcon(finding.severity)}
                        <Typography variant="h6">{finding.title}</Typography>
                        <Chip 
                          label={finding.severity}
                          color={finding.severity === 'critical' ? 'error' : finding.severity === 'high' ? 'warning' : finding.severity === 'medium' ? 'info' : 'success'}
                          size="small"
                        />
                        <Chip label={finding.type} color="primary" size="small" />
                      </Box>
                      <Typography variant="body1" paragraph>
                        {finding.description}
                      </Typography>
                      {finding.file_path && (
                        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                          File: {finding.file_path}
                          {finding.line_number && ` (Line ${finding.line_number})`}
                        </Typography>
                      )}
                      {finding.context && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {finding.context}
                          </Typography>
                        </Box>
                      )}
                      {finding.finding_metadata && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            Source: {finding.finding_metadata.source || 'Unknown'}
                            {finding.finding_metadata.module && ` | Module: ${finding.finding_metadata.module}`}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Alert severity="info">No findings available</Alert>
          )}
        </Box>
      </TabPanel>
    </Box>
  );
};

export default EMBAResults;
