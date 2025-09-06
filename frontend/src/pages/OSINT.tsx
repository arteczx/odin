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
  List,
  ListItem,
  ListItemText,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import {
  Language,
  Dns,
  Security,
  Router,
  Warning,
  Search,
  ExpandMore,
  OpenInNew,
  Refresh,
} from '@mui/icons-material';
import { osintApi } from '../services/api';
import { OSINTResult } from '../types';


const OSINT: React.FC = () => {
  const [results, setResults] = useState<OSINTResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOSINTResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await osintApi.getOSINTResults();
      setResults(data);
    } catch (err) {
      console.error('Error fetching OSINT results:', err);
      setError('Failed to load OSINT results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOSINTResults();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff073a';
      case 'high': return '#ff6b35';
      case 'medium': return '#ffaa00';
      case 'low': return '#00d4ff';
      case 'info': return '#8b949e';
      default: return '#8b949e';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return <Language />;
      case 'ip': return <Dns />;
      case 'certificate': return <Security />;
      case 'service': return <Router />;
      case 'vulnerability': return <Warning />;
      default: return <Search />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'domain': return '#00d4ff';
      case 'ip': return '#00ff41';
      case 'certificate': return '#ffaa00';
      case 'service': return '#ff6b35';
      case 'vulnerability': return '#ff073a';
      default: return '#8b949e';
    }
  };

  const filteredResults = results.filter(result =>
    result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeStats = {
    domain: results.filter(r => r.type === 'domain').length,
    ip: results.filter(r => r.type === 'ip').length,
    certificate: results.filter(r => r.type === 'certificate').length,
    service: results.filter(r => r.type === 'service').length,
    vulnerability: results.filter(r => r.type === 'vulnerability').length,
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontFamily: '"Fira Code", monospace',
            color: '#00d4ff',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
            mb: 1,
          }}
        >
[OSINT INTELLIGENCE]
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#8b949e',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.9rem',
          }}
        >
// Open Source Intelligence gathering and analysis
        </Typography>
        
        <IconButton
          onClick={fetchOSINTResults}
          sx={{
            color: '#00d4ff',
            '&:hover': {
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
            },
          }}
          title="Refresh OSINT Results"
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Type Overview Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 4 }}>
        {Object.entries(typeStats).map(([type, count]) => (
          <Card 
            key={type}
            sx={{ 
              background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
              border: `1px solid ${getTypeColor(type)}40`,
              boxShadow: `0 0 15px ${getTypeColor(type)}20`,
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
                    {type.toUpperCase()}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: getTypeColor(type),
                      fontFamily: '"Fira Code", monospace',
                      fontWeight: 'bold',
                    }}
                  >
                    {count}
                  </Typography>
                </Box>
                <Box sx={{ color: getTypeColor(type), fontSize: 24 }}>
                  {getTypeIcon(type)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
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

      {/* Search */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3,
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 15px rgba(0, 212, 255, 0.1)',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search OSINT results by title, description, source, or project..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: '"Fira Code", monospace',
              '& fieldset': {
                borderColor: '#30363d',
              },
              '&:hover fieldset': {
                borderColor: '#00d4ff',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00d4ff',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
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
                <Search sx={{ color: '#00d4ff' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* OSINT Results */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
          p: 2,
        }}
      >
        {loading && (
          <CircularProgress 
            sx={{ 
              backgroundColor: '#30363d',
              '& .MuiCircularProgress-svg': {
                stroke: '#00d4ff',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
              },
              mb: 2,
            }} 
          />
        )}

        {filteredResults.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredResults.map((result) => (
              <Accordion 
                key={result.id}
                sx={{
                  backgroundColor: '#21262d',
                  border: `1px solid ${getSeverityColor(result.severity)}40`,
                  boxShadow: `0 0 10px ${getSeverityColor(result.severity)}20`,
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: 0,
                    boxShadow: `0 0 20px ${getSeverityColor(result.severity)}30`,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: '#8b949e' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                    <Box sx={{ color: getTypeColor(result.type), fontSize: 20 }}>
                      {getTypeIcon(result.type)}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        sx={{ 
                          color: '#c9d1d9',
                          fontFamily: '"Fira Code", monospace',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        {result.title}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                          display: 'block',
                        }}
                      >
                        {result.description}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={`[${result.type.toUpperCase()}]`}
                        sx={{
                          backgroundColor: `${getTypeColor(result.type)}20`,
                          color: getTypeColor(result.type),
                          border: `1px solid ${getTypeColor(result.type)}`,
                          fontFamily: '"Fira Code", monospace',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}
                        size="small"
                      />
                      
                      <Chip
                        label={`[${result.severity.toUpperCase()}]`}
                        sx={{
                          backgroundColor: `${getSeverityColor(result.severity)}20`,
                          color: getSeverityColor(result.severity),
                          border: `1px solid ${getSeverityColor(result.severity)}`,
                          fontFamily: '"Fira Code", monospace',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}
                        size="small"
                      />

                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                          minWidth: '60px',
                        }}
                      >
                        {result.source}
                      </Typography>

                      <IconButton
                        size="small"
                        sx={{
                          color: '#00d4ff',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                            boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/search?q=${encodeURIComponent(result.title)}`, '_blank');
                        }}
                        title="Search online"
                      >
                        <OpenInNew />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ pt: 0 }}>
                  <Box sx={{ pl: 5 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: '#00d4ff',
                            fontFamily: '"Fira Code", monospace',
                            mb: 1,
                          }}
                        >
                          Project Information
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#c9d1d9',
                            fontFamily: '"Fira Code", monospace',
                            fontSize: '0.8rem',
                          }}
                        >
                          <Box component="span" sx={{ color: '#00ff41' }}>Project:</Box> {result.project_name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#c9d1d9',
                            fontFamily: '"Fira Code", monospace',
                            fontSize: '0.8rem',
                          }}
                        >
                          <Box component="span" sx={{ color: '#00ff41' }}>Discovered:</Box> {new Date(result.discovered_at).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: '#00d4ff',
                            fontFamily: '"Fira Code", monospace',
                            mb: 1,
                          }}
                        >
                          Technical Details
                        </Typography>
                        {Object.entries(result.details).map(([key, value]) => (
                          <Typography 
                            key={key}
                            variant="body2" 
                            sx={{ 
                              color: '#c9d1d9',
                              fontFamily: '"Fira Code", monospace',
                              fontSize: '0.8rem',
                            }}
                          >
                            <Box component="span" sx={{ color: '#00ff41' }}>{key}:</Box> {String(value)}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
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
              No OSINT results found
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.9rem',
              }}
            >
              {searchTerm ? '// Try adjusting your search terms' : '// No intelligence data available'}
            </Typography>
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
};

export default OSINT;
