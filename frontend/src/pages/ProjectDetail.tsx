import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, embaApi } from '../services/api';
import { Project, EMBAAnalysisResults } from '../types/index';
import EMBAResults from '../components/EMBA/EMBAResults';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Security,
} from '@mui/icons-material';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [embaResults, setEmbaResults] = useState<EMBAAnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [embaLoading, setEmbaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        const projectData = await projectsApi.getProject(id);
        setProject(projectData);
        
        // Try to fetch EMBA results if available
        if (projectData.status === 'completed') {
          setEmbaLoading(true);
          try {
            const embaData = await embaApi.getAnalysisResults(id);
            setEmbaResults(embaData);
          } catch (embaErr) {
            // EMBA results not available, that's okay
            console.log('EMBA results not available for this project');
          } finally {
            setEmbaLoading(false);
          }
        }
      } catch (err) {
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00ff41';
      case 'processing': return '#ffaa00';
      case 'pending': return '#8b949e';
      case 'failed': return '#ff073a';
      default: return '#8b949e';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading project details...</Typography>
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Project not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/projects')}
          sx={{ mr: 2, color: '#8b949e' }}
        >
          Back to Projects
        </Button>
        <Typography 
          variant="h4" 
          sx={{ 
            fontFamily: '"Fira Code", monospace',
            color: '#00d4ff',
            fontWeight: 'bold',
            flex: 1,
          }}
        >
          {project.name}
        </Typography>
        <Button
          startIcon={<Download />}
          variant="outlined"
          sx={{ color: '#00ff41', borderColor: '#00ff41' }}
        >
          Download Report
        </Button>
      </Box>

      {/* Project Overview */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
          border: '1px solid #30363d',
          boxShadow: '0 0 15px rgba(0, 212, 255, 0.1)',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: '"Fira Code", monospace',
            color: '#00d4ff',
            fontWeight: 'bold',
            mb: 2,
          }}
        >
          PROJECT OVERVIEW
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#8b949e', fontFamily: '"Fira Code", monospace', fontSize: '0.8rem' }}>
                STATUS
              </Typography>
              <Chip
                label={`[${project.status.toUpperCase()}]`}
                sx={{
                  backgroundColor: `${getStatusColor(project.status)}20`,
                  color: getStatusColor(project.status),
                  border: `1px solid ${getStatusColor(project.status)}40`,
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#8b949e', fontFamily: '"Fira Code", monospace', fontSize: '0.8rem' }}>
                DEVICE TYPE
              </Typography>
              <Typography sx={{ color: '#c9d1d9', fontFamily: '"Fira Code", monospace' }}>
                {project.device_type || 'Unknown'}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#8b949e', fontFamily: '"Fira Code", monospace', fontSize: '0.8rem' }}>
                MANUFACTURER
              </Typography>
              <Typography sx={{ color: '#c9d1d9', fontFamily: '"Fira Code", monospace' }}>
                {project.manufacturer || 'Unknown'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#8b949e', fontFamily: '"Fira Code", monospace', fontSize: '0.8rem' }}>
                FILENAME
              </Typography>
              <Typography sx={{ color: '#c9d1d9', fontFamily: '"Fira Code", monospace' }}>
                {project.filename}
              </Typography>
            </Box>
          </Box>
        </Box>

        {project.status === 'processing' && project.progress && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ color: '#ffaa00', fontFamily: '"Fira Code", monospace', mb: 1 }}>
              ANALYSIS PROGRESS: {project.progress}%
            </Typography>
          </Box>
        )}
      </Paper>

      {/* EMBA Results Section */}
      {embaResults && (
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontFamily: '"Fira Code", monospace',
              color: '#ffaa00',
              fontWeight: 'bold',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Security sx={{ mr: 1 }} />
            EMBA Analysis Results
          </Typography>
          <EMBAResults results={embaResults} />
        </Box>
      )}

      {/* EMBA Loading State */}
      {embaLoading && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading EMBA analysis results...</Typography>
          </Paper>
        </Box>
      )}

      {/* No EMBA Results Message */}
      {!embaResults && !embaLoading && project.status === 'completed' && (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
          <Typography sx={{ color: '#8b949e', fontFamily: '"Fira Code", monospace' }}>
            EMBA analysis results not available for this project
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ProjectDetail;
