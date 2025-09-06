import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Security,
  Warning,
  Error,
  Info,
  OpenInNew,
  Refresh,
} from '@mui/icons-material';
import { vulnerabilitiesApi } from '../services/api';
import { CVEFinding } from '../types';


const Vulnerabilities: React.FC = () => {
  const [vulnerabilities, setVulnerabilities] = useState<CVEFinding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vulnerabilitiesApi.getVulnerabilities();
      setVulnerabilities(data);
    } catch (err) {
      console.error('Error fetching vulnerabilities:', err);
      setError('Failed to load vulnerabilities. Please try again.');
      setVulnerabilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff073a';
      case 'high': return '#ff6b35';
      case 'medium': return '#ffaa00';
      case 'low': return '#00d4ff';
      default: return '#8b949e';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Error />;
      case 'high': return <Warning />;
      case 'medium': return <Warning />;
      case 'low': return <Info />;
      default: return <Security />;
    }
  };

  const filteredVulnerabilities = vulnerabilities.filter(vuln =>
    vuln.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vuln.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vuln.software_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const severityStats = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontFamily: '"Fira Code", monospace',
            color: '#ff073a',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 7, 58, 0.5)',
            mb: 1,
          }}
        >
[VULNERABILITY ANALYSIS]
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#8b949e',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.9rem',
          }}
        >
          // Security vulnerabilities detected in firmware analysis
        </Typography>
        
        <IconButton
          onClick={fetchVulnerabilities}
          sx={{
            color: '#ff073a',
            '&:hover': {
              backgroundColor: 'rgba(255, 7, 58, 0.1)',
              boxShadow: '0 0 10px rgba(255, 7, 58, 0.3)',
            },
          }}
          title="Refresh Vulnerabilities"
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

      {/* Severity Overview Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
        {Object.entries(severityStats).map(([severity, count]) => (
          <Card 
            key={severity}
            sx={{ 
              background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
              border: `1px solid ${getSeverityColor(severity)}40`,
              boxShadow: `0 0 15px ${getSeverityColor(severity)}20`,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: '#8b949e',
                      fontFamily: '"Fira Code", monospace',
                      fontSize: '0.7rem',
                    }}
                  >
                    {severity.toUpperCase()}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: getSeverityColor(severity),
                      fontFamily: '"Fira Code", monospace',
                      fontWeight: 'bold',
                    }}
                  >
                    {count}
                  </Typography>
                </Box>
                <Box sx={{ color: getSeverityColor(severity), fontSize: 24 }}>
                  {getSeverityIcon(severity)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Search */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3,
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 15px rgba(255, 7, 58, 0.1)',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search vulnerabilities by CVE, title, component, or project..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: '"Fira Code", monospace',
              '& fieldset': {
                borderColor: '#30363d',
              },
              '&:hover fieldset': {
                borderColor: '#ff073a',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ff073a',
                boxShadow: '0 0 10px rgba(255, 7, 58, 0.3)',
              },
            },
            '& .MuiInputBase-input': {
              color: '#c9d1d9',
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#8b949e',
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#ff073a' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Vulnerabilities Table */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 20px rgba(255, 7, 58, 0.1)',
        }}
      >
        {loading && (
          <LinearProgress 
            sx={{ 
              backgroundColor: '#30363d',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ff073a',
                boxShadow: '0 0 10px rgba(255, 7, 58, 0.5)',
              },
            }} 
          />
        )}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#21262d' }}>
                {['CVE ID', 'Severity', 'Title', 'Component', 'Project', 'Discovered', 'Actions'].map((header) => (
                  <TableCell 
                    key={header}
                    sx={{ 
                      color: '#ff073a', 
                      fontFamily: '"Fira Code", monospace',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontSize: '0.8rem',
                      borderBottom: '1px solid #30363d',
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVulnerabilities.map((vuln) => (
                <TableRow 
                  key={vuln.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(255, 7, 58, 0.05)',
                    },
                    borderBottom: '1px solid #30363d',
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      sx={{ 
                        color: '#00d4ff',
                        fontFamily: '"Fira Code", monospace',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    >
                      {vuln.cve_id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Chip
                      label={`[${vuln.severity.toUpperCase()}]`}
                      icon={getSeverityIcon(vuln.severity)}
                      sx={{
                        backgroundColor: `${getSeverityColor(vuln.severity)}20`,
                        color: getSeverityColor(vuln.severity),
                        border: `1px solid ${getSeverityColor(vuln.severity)}`,
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                      size="small"
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        color: '#8b949e',
                        fontFamily: '"Fira Code", monospace',
                        mt: 0.5,
                      }}
                    >
                      Score: {vuln.cvss_score}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      sx={{ 
                        color: '#c9d1d9',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {vuln.software_name} - {vuln.version}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#8b949e',
                        fontFamily: '"Fira Code", monospace',
                        display: 'block',
                        mt: 0.5,
                      }}
                    >
                      {vuln.description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      sx={{ 
                        color: '#c9d1d9',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      {vuln.software_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      sx={{ 
                        color: '#c9d1d9',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      Project #{vuln.project_id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      sx={{ 
                        color: '#8b949e',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      {new Date(vuln.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <IconButton
                      size="small"
                      sx={{
                        color: '#00d4ff',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                        },
                      }}
                      onClick={() => {
                        if (vuln.cve_id) {
                          window.open(`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vuln.cve_id}`, '_blank');
                        } else {
                          window.open(`https://www.google.com/search?q=${encodeURIComponent(vuln.software_name + ' vulnerability')}`, '_blank');
                        }
                      }}
                      title="View CVE Details"
                    >
                      <OpenInNew />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredVulnerabilities.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                mb: 1,
              }}
            >
              // No vulnerabilities found
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.9rem',
              }}
            >
              {searchTerm ? '// Try adjusting your search terms' : '// No security issues detected'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Vulnerabilities;
