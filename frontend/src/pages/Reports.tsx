import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Alert,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Assessment,
  Description,
  BugReport,
  Security,
  PictureAsPdf,
  Language,
  Visibility,
  Download,
  Refresh,
} from '@mui/icons-material';
import { reportsApi } from '../services/api';


const Reports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getReports();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return <Assessment />;
      case 'executive': return <Description />;
      case 'technical': return <BugReport />;
      case 'vulnerability': return <Security />;
      default: return <Description />;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'full': return '#00ff41';
      case 'executive': return '#00d4ff';
      case 'technical': return '#ffaa00';
      case 'vulnerability': return '#ff073a';
      default: return '#8b949e';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PictureAsPdf />;
      case 'html': return <Language />;
      case 'json': return <Description />;
      default: return <Description />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#00ff41';
      case 'generating': return '#ffaa00';
      case 'failed': return '#ff073a';
      default: return '#8b949e';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalFindings = (findings: any) => {
    if (!findings) return 0;
    return (findings.critical || 0) + (findings.high || 0) + (findings.medium || 0) + (findings.low || 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontFamily: '"Fira Code", monospace',
            color: '#00ff41',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
            mb: 1,
          }}
        >
[ANALYSIS REPORTS]
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#8b949e',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.9rem',
          }}
        >
          // Generated analysis reports and documentation
        </Typography>
        
        <IconButton
          onClick={fetchReports}
          sx={{
            color: '#00ff41',
            '&:hover': {
              backgroundColor: 'rgba(0, 255, 65, 0.1)',
              boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
            },
          }}
          title="Refresh Reports"
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: '#ff073a20',
            color: '#ff073a',
            border: '1px solid #ff073a',
            '& .MuiAlert-icon': {
              color: '#ff073a',
            },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Report Generation Actions */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 15px rgba(0, 255, 65, 0.1)',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#00ff41',
            fontFamily: '"Fira Code", monospace',
            mb: 2,
          }}
        >
          Generate New Report
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          {[
            { type: 'full', label: 'Full Report', desc: 'Complete analysis with all findings' },
            { type: 'executive', label: 'Executive Summary', desc: 'High-level overview for management' },
            { type: 'technical', label: 'Technical Report', desc: 'Detailed technical findings' },
            { type: 'vulnerability', label: 'Vulnerability Report', desc: 'Security issues only' },
          ].map((reportType) => (
            <Box key={reportType.type}>
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #21262d 0%, #161b22 100%)',
                  border: `1px solid ${getReportTypeColor(reportType.type)}40`,
                  boxShadow: `0 0 10px ${getReportTypeColor(reportType.type)}20`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 0 20px ${getReportTypeColor(reportType.type)}40`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Box sx={{ color: getReportTypeColor(reportType.type), fontSize: 32, mb: 1 }}>
                    {getReportTypeIcon(reportType.type)}
                  </Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: '#c9d1d9',
                      fontFamily: '"Fira Code", monospace',
                      fontWeight: 'bold',
                      mb: 0.5,
                    }}
                  >
                    {reportType.label}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#8b949e',
                      fontFamily: '"Fira Code", monospace',
                      fontSize: '0.7rem',
                    }}
                  >
                    {reportType.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Existing Reports */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)',
          p: 2,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#00ff41',
            fontFamily: '"Fira Code", monospace',
            mb: 3,
          }}
        >
Available Reports
        </Typography>

        {loading && (
          <LinearProgress 
            sx={{ 
              backgroundColor: '#30363d',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#00ff41',
                boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
              },
              mb: 2,
            }} 
          />
        )}

        {reports.length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 2 }}>
            {reports.map((report) => (
              <Box key={report.id}>
                <Card 
                  sx={{ 
                    background: 'linear-gradient(135deg, #21262d 0%, #161b22 100%)',
                    border: `1px solid ${getReportTypeColor(report.type)}40`,
                    boxShadow: `0 0 15px ${getReportTypeColor(report.type)}20`,
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: getReportTypeColor(report.type), fontSize: 24 }}>
                          {getReportTypeIcon(report.type)}
                        </Box>
                        <Box sx={{ color: '#8b949e', fontSize: 16 }}>
                          {getFormatIcon(report.format)}
                        </Box>
                      </Box>
                      
                      <Chip
                        label={`[${report.status.toUpperCase()}]`}
                        sx={{
                          backgroundColor: `${getStatusColor(report.status)}20`,
                          color: getStatusColor(report.status),
                          border: `1px solid ${getStatusColor(report.status)}`,
                          fontFamily: '"Fira Code", monospace',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}
                        size="small"
                      />
                    </Box>

                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#c9d1d9',
                        fontFamily: '"Fira Code", monospace',
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: '0.9rem',
                      }}
                    >
                      {report.project_name}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: getReportTypeColor(report.type),
                        fontFamily: '"Fira Code", monospace',
                        mb: 2,
                        textTransform: 'uppercase',
                        fontSize: '0.8rem',
                      }}
                    >
                      {report.type} Report ({report.format.toUpperCase()})
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                          display: 'block',
                        }}
                      >
                        Findings: {getTotalFindings(report.findings_count)} total
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        {report.findings_count && Object.entries(report.findings_count).map(([severity, count]) => (
                          (count as number) > 0 && (
                            <Chip
                              key={severity}
                              label={`${severity}: ${count}`}
                              sx={{
                                backgroundColor: `${severity === 'critical' ? '#ff073a' : 
                                  severity === 'high' ? '#ff6b35' : 
                                  severity === 'medium' ? '#ffaa00' : '#00d4ff'}20`,
                                color: severity === 'critical' ? '#ff073a' : 
                                  severity === 'high' ? '#ff6b35' : 
                                  severity === 'medium' ? '#ffaa00' : '#00d4ff',
                                border: `1px solid ${severity === 'critical' ? '#ff073a' : 
                                  severity === 'high' ? '#ff6b35' : 
                                  severity === 'medium' ? '#ffaa00' : '#00d4ff'}`,
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '0.6rem',
                              }}
                              size="small"
                            />
                          )
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                        }}
                      >
                        {report.status === 'ready' ? formatFileSize(report.file_size) : 'Generating...'}
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                        }}
                      >
                        {new Date(report.generated_at).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {report.status === 'generating' && (
                      <LinearProgress 
                        sx={{ 
                          backgroundColor: '#30363d',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getReportTypeColor(report.type),
                            boxShadow: `0 0 5px ${getReportTypeColor(report.type)}50`,
                          },
                          mb: 2,
                        }} 
                      />
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        disabled={report.status !== 'ready'}
                        sx={{
                          color: report.status === 'ready' ? '#00d4ff' : '#30363d',
                          '&:hover': {
                            backgroundColor: report.status === 'ready' ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                            boxShadow: report.status === 'ready' ? '0 0 10px rgba(0, 212, 255, 0.3)' : 'none',
                          },
                        }}
                        title="Preview Report"
                      >
                        <Visibility />
                      </IconButton>
                      
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Download />}
                        disabled={report.status !== 'ready'}
                        sx={{
                          backgroundColor: report.status === 'ready' ? getReportTypeColor(report.type) : '#30363d',
                          color: report.status === 'ready' ? '#0d1117' : '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          boxShadow: report.status === 'ready' ? `0 0 15px ${getReportTypeColor(report.type)}30` : 'none',
                          '&:hover': {
                            backgroundColor: report.status === 'ready' ? getReportTypeColor(report.type) : '#30363d',
                            boxShadow: report.status === 'ready' ? `0 0 20px ${getReportTypeColor(report.type)}50` : 'none',
                          },
                          '&:disabled': {
                            backgroundColor: '#30363d',
                            color: '#8b949e',
                          },
                        }}
                      >
                        Download
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        ) : !loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                mb: 1,
              }}
            >
              // No reports available
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.9rem',
              }}
            >
              // Complete a firmware analysis to generate reports
            </Typography>
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
};

export default Reports;
