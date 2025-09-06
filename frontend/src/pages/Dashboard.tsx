import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  AlertTitle,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
  Grid,
} from '@mui/material';
import {
  Security,
  TrendingUp,
  Assessment,
  BugReport,
  CloudUpload,
  Visibility,
  Delete,
  FolderOpen,
  Search,
} from '@mui/icons-material';
import StatsCard from '../components/Dashboard/StatsCard';
import { dashboardApi, projectsApi, vulnerabilitiesApi } from '../services/api';
import { Project } from '../types';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeAnalyses: 0,
    criticalVulns: 0,
    riskScore: 0,
  });
  const [vulnerabilityStats, setVulnerabilityStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load projects, stats, and vulnerabilities in parallel
      const [projectsData, statsData, vulnerabilitiesData] = await Promise.allSettled([
        projectsApi.getProjects(),
        dashboardApi.getStats().catch(() => ({
          totalProjects: 0,
          activeAnalyses: 0,
          criticalVulns: 0,
          riskScore: 0,
        })),
        vulnerabilitiesApi.getVulnerabilities().catch(() => [])
      ]);

      if (projectsData.status === 'fulfilled') {
        setProjects(projectsData.value);
        // Calculate stats from projects if API doesn't provide them
        const activeCount = projectsData.value.filter(p => p.status === 'processing').length;
        setStats(prev => ({
          ...prev,
          totalProjects: projectsData.value.length,
          activeAnalyses: activeCount,
        }));
      }

      if (statsData.status === 'fulfilled') {
        setStats(prev => ({ ...prev, ...statsData.value }));
      }

      // Calculate vulnerability distribution from real data
      if (vulnerabilitiesData.status === 'fulfilled') {
        const vulns = vulnerabilitiesData.value;
        const distribution = {
          critical: vulns.filter(v => v.severity === 'critical').length,
          high: vulns.filter(v => v.severity === 'high').length,
          medium: vulns.filter(v => v.severity === 'medium').length,
          low: vulns.filter(v => v.severity === 'low').length,
        };
        setVulnerabilityStats(distribution);
        
        // Update critical vulns count in stats
        setStats(prev => ({
          ...prev,
          criticalVulns: distribution.critical + distribution.high,
        }));
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
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

  // Stats data from API - create React elements for icons
  const statsCards = [
    { title: 'Total Projects', value: stats.totalProjects, icon: <FolderOpen />, color: '#00ff41' },
    { title: 'Active Analysis', value: stats.activeAnalyses, icon: <Search />, color: '#ff0080' },
    { title: 'Vulnerabilities Found', value: stats.criticalVulns, icon: <Security />, color: '#ff073a' },
    { title: 'Risk Score', value: `${stats.riskScore}/10`, icon: <Assessment />, color: '#ffaa00' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
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
          Dashboard
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#8b949e',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.9rem',
          }}
        >
          // Real-time firmware analysis overview
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </Box>

      {/* Quick Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#0a0a0a', border: '1px solid #333' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#00ff41', fontFamily: 'monospace' }}>
            [VULNERABILITY_DISTRIBUTION]
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#ff073a', fontFamily: 'monospace' }}>Critical</Typography>
              <Chip label={vulnerabilityStats.critical} size="small" sx={{ bgcolor: '#ff073a', color: 'white' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#ffaa00', fontFamily: 'monospace' }}>High</Typography>
              <Chip label={vulnerabilityStats.high} size="small" sx={{ bgcolor: '#ffaa00', color: 'black' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#ff0080', fontFamily: 'monospace' }}>Medium</Typography>
              <Chip label={vulnerabilityStats.medium} size="small" sx={{ bgcolor: '#ff0080', color: 'white' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#00d4ff', fontFamily: 'monospace' }}>Low</Typography>
              <Chip label={vulnerabilityStats.low} size="small" sx={{ bgcolor: '#00d4ff', color: 'black' }} />
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: '#0a0a0a', border: '1px solid #333' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#00ff41', fontFamily: 'monospace' }}>
            [SYSTEM_STATUS]
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#00ff41', fontFamily: 'monospace' }}>Analysis Engine</Typography>
              <Chip label="ONLINE" size="small" sx={{ bgcolor: '#00ff41', color: 'black' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#00d4ff', fontFamily: 'monospace' }}>Database</Typography>
              <Chip label="CONNECTED" size="small" sx={{ bgcolor: '#00d4ff', color: 'black' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#ff0080', fontFamily: 'monospace' }}>Queue Status</Typography>
              <Chip label={`${stats.activeAnalyses} ACTIVE`} size="small" sx={{ bgcolor: '#ff0080', color: 'white' }} />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Recent Projects */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        
        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 10).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {project.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {project.filename}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {project.manufacturer && project.model ? (
                        <Typography variant="body2">
                          {project.manufacturer} {project.model}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Unknown Device
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={project.status}
                        color={getStatusColor(project.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(project.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {project.status === 'processing' ? (
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={project.progress || 0}
                          />
                          <Typography variant="caption">
                            {project.progress || 0}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2">
                          {project.status === 'completed' ? '100%' : '-'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;
