import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ListItemIcon,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  LinearProgress,
  Fab,
} from '@mui/material';
import {
  Search,
  Visibility,
  Download,
  Delete,
  Add,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import { projectsApi } from '../services/api';
import { Project } from '../types';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await projectsApi.deleteProject(projectToDelete.id);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.manufacturer && project.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.model && project.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00ff41';
      case 'processing': return '#ffaa00';
      case 'failed': return '#ff073a';
      default: return '#8b949e';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{
            color: '#00ff41',
            fontFamily: '"Fira Code", monospace',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
          }}
        >
          [FIRMWARE PROJECTS]
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton
            onClick={fetchProjects}
            sx={{
              color: '#00d4ff',
              '&:hover': {
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
              },
            }}
            title="Refresh"
          >
            <Refresh />
          </IconButton>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/upload')}
            sx={{
              backgroundColor: '#00ff41',
              color: '#000',
              fontFamily: '"Fira Code", monospace',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#00cc33',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
              },
            }}
          >
            NEW ANALYSIS
          </Button>
        </Box>
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
          boxShadow: '0 0 15px rgba(0, 255, 65, 0.1)',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search projects by name, filename, manufacturer, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: '"Fira Code", monospace',
              '& fieldset': {
                borderColor: '#30363d',
              },
              '&:hover fieldset': {
                borderColor: '#00ff41',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00ff41',
                boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
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
                <Search sx={{ color: '#00ff41' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Projects Table */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#21262d' }}>
                <TableCell sx={{ 
                  color: '#00ff41', 
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #30363d',
                }}>
                  Project
                </TableCell>
                <TableCell sx={{ 
                  color: '#00ff41', 
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #30363d',
                }}>
                  Device Info
                </TableCell>
                <TableCell sx={{ 
                  color: '#00ff41', 
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #30363d',
                }}>
                  File
                </TableCell>
                <TableCell sx={{ 
                  color: '#00ff41', 
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #30363d',
                }}>
                  Status
                </TableCell>
                <TableCell sx={{ 
                  color: '#00ff41', 
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #30363d',
                }}>
                  Created
                </TableCell>
                <TableCell sx={{ 
                  color: '#00ff41', 
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid #30363d',
                }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow 
                  key={project.id} 
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 65, 0.05)',
                    },
                    borderBottom: '1px solid #30363d',
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#c9d1d9',
                        fontFamily: '"Fira Code", monospace',
                      }}
                    >
                      {project.name}
                    </Typography>
                    {project.description && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                          fontSize: '0.8rem',
                        }}
                      >
                        {project.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    {project.manufacturer || project.model || project.device_type ? (
                      <Box>
                        {project.manufacturer && (
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: '#c9d1d9',
                              fontFamily: '"Fira Code", monospace',
                              fontSize: '0.8rem',
                            }}
                          >
                            <Box component="span" sx={{ color: '#00ff41' }}>Manufacturer:</Box> {project.manufacturer}
                          </Typography>
                        )}
                        {project.model && (
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: '#c9d1d9',
                              fontFamily: '"Fira Code", monospace',
                              fontSize: '0.8rem',
                            }}
                          >
                            <Box component="span" sx={{ color: '#00ff41' }}>Model:</Box> {project.model}
                          </Typography>
                        )}
                        {project.device_type && (
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: '#c9d1d9',
                              fontFamily: '"Fira Code", monospace',
                              fontSize: '0.8rem',
                            }}
                          >
                            <Box component="span" sx={{ color: '#00ff41' }}>Type:</Box> {project.device_type}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                          fontSize: '0.8rem',
                        }}
                      >
                        // No device info
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: '#c9d1d9',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      {project.filename}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#8b949e',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.7rem',
                      }}
                    >
                      {formatFileSize(project.file_size)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Chip
                      label={`[${project.status.toUpperCase()}]`}
                      sx={{
                        backgroundColor: `${getStatusColor(project.status)}20`,
                        color: getStatusColor(project.status),
                        border: `1px solid ${getStatusColor(project.status)}`,
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        color: '#8b949e',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatDate(project.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #30363d' }}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      title="View Details"
                      sx={{
                        color: '#00d4ff',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          color: '#00d4ff',
                          boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                        },
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Download Report"
                      disabled={project.status !== 'completed'}
                      sx={{
                        color: project.status === 'completed' ? '#00ff41' : '#30363d',
                        '&:hover': {
                          backgroundColor: project.status === 'completed' ? 'rgba(0, 255, 65, 0.1)' : 'transparent',
                          color: project.status === 'completed' ? '#00ff41' : '#30363d',
                          boxShadow: project.status === 'completed' ? '0 0 10px rgba(0, 255, 65, 0.3)' : 'none',
                        },
                      }}
                    >
                      <Download />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setProjectToDelete(project);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete Project"
                      sx={{
                        color: '#ff073a',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 7, 58, 0.1)',
                          color: '#ff073a',
                          boxShadow: '0 0 10px rgba(255, 7, 58, 0.3)',
                        },
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredProjects.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                mb: 1,
              }}
            >
              {/* No projects found */}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                mb: 2,
                fontSize: '0.9rem',
              }}
            >
              {searchTerm ? '// Try adjusting your search terms' : '// Upload your first firmware to get started'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/upload')}
              sx={{
                backgroundColor: '#00ff41',
                color: '#0d1117',
                fontFamily: '"Fira Code", monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                border: '1px solid #00ff41',
                '&:hover': {
                  backgroundColor: '#00d435',
                  boxShadow: '0 0 30px rgba(0, 255, 65, 0.5)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Upload Firmware
            </Button>
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            boxShadow: '0 0 30px rgba(255, 7, 58, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#ff073a',
          fontFamily: '"Fira Code", monospace',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}>
          [DELETE_PROJECT]
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ 
            color: '#c9d1d9',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.9rem',
          }}>
            // Are you sure you want to delete "{projectToDelete?.name}"?
          </Typography>
          <Typography sx={{ 
            color: '#ff073a',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.8rem',
            mt: 1,
          }}>
            WARNING: This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#8b949e',
              fontFamily: '"Fira Code", monospace',
              textTransform: 'uppercase',
              '&:hover': {
                backgroundColor: 'rgba(139, 148, 158, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteProject} 
            variant="contained"
            sx={{
              backgroundColor: '#ff073a',
              color: '#ffffff',
              fontFamily: '"Fira Code", monospace',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              boxShadow: '0 0 20px rgba(255, 7, 58, 0.3)',
              '&:hover': {
                backgroundColor: '#d60631',
                boxShadow: '0 0 30px rgba(255, 7, 58, 0.5)',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        aria-label="add"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          backgroundColor: '#00ff41',
          color: '#0d1117',
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.4)',
          '&:hover': {
            backgroundColor: '#00d435',
            boxShadow: '0 0 30px rgba(0, 255, 65, 0.6)',
            transform: 'scale(1.1)',
          },
        }}
        onClick={() => navigate('/upload')}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Projects;
