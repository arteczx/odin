import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Grid,
  Chip,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Settings,
  Security,
  Computer,
  NetworkCheck,
  Language
} from '@mui/icons-material';
import { embaApi } from '../../services/api';
import { EMBAConfig, EMBAProfile } from '../../types';

interface EMBAConfigProps {
  onConfigUpdate?: (config: EMBAConfig) => void;
}

const EMBAConfigComponent: React.FC<EMBAConfigProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState<EMBAConfig>({
    live_testing_enabled: false,
    emulation_enabled: false,
    cwe_checker_enabled: false,
    scan_profile: 'default-scan.emba',
    thread_count: 4,
  });
  const [profiles, setProfiles] = useState<EMBAProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguration();
    loadProfiles();
  }, []);

  const loadConfiguration = async () => {
    try {
      const currentConfig = await embaApi.getConfig();
      setConfig(currentConfig);
    } catch (err) {
      setError('Failed to load EMBA configuration');
      console.error('Error loading EMBA config:', err);
    }
  };

  const loadProfiles = async () => {
    try {
      const availableProfiles = await embaApi.getProfiles();
      setProfiles(availableProfiles);
    } catch (err) {
      console.error('Error loading EMBA profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof EMBAConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveConfiguration = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedConfig = await embaApi.updateConfig(config);
      setConfig(updatedConfig);
      setSuccess('EMBA configuration updated successfully');
      onConfigUpdate?.(updatedConfig);
    } catch (err) {
      setError('Failed to update EMBA configuration');
      console.error('Error updating EMBA config:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" p={3}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>Loading EMBA configuration...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center">
              <Settings sx={{ mr: 1 }} />
              <Typography variant="h6">EMBA Configuration</Typography>
            </Box>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Live Testing Configuration */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NetworkCheck sx={{ mr: 1 }} />
              Live Testing Modules
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.live_testing_enabled}
                  onChange={(e) => handleConfigChange('live_testing_enabled', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Enable Live Testing (L Modules)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enable network scanning, service detection, and vulnerability testing
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Emulation Configuration */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Computer sx={{ mr: 1 }} />
              System Emulation
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.emulation_enabled}
                  onChange={(e) => handleConfigChange('emulation_enabled', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Enable User-mode Emulation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enable QEMU-based system emulation for dynamic analysis
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* CWE-checker Configuration */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ mr: 1 }} />
              Static Analysis
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={config.cwe_checker_enabled}
                  onChange={(e) => handleConfigChange('cwe_checker_enabled', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Enable CWE-checker</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enable advanced static analysis for common weakness enumeration
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Scan Profile Configuration */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Language sx={{ mr: 1 }} />
              Scan Configuration
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Scan Profile</InputLabel>
                  <Select
                    value={config.scan_profile}
                    onChange={(e) => handleConfigChange('scan_profile', e.target.value)}
                    label="Scan Profile"
                  >
                    {profiles.map((profile) => (
                      <MenuItem key={profile.name} value={profile.name}>
                        {profile.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Choose the analysis depth and modules to run
                </Typography>
              </Box>

              <Box>
                <TextField
                  label="Thread Count"
                  type="number"
                  inputProps={{ min: 1, max: 16 }}
                  value={config.thread_count}
                  onChange={(e) => handleConfigChange('thread_count', parseInt(e.target.value))}
                  fullWidth
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Number of parallel analysis threads (1-16)
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Profile Information */}
          {profiles.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Available Profiles</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                {profiles.map((profile) => (
                  <Box key={profile.name}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">{profile.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {profile.description}
                      </Typography>
                      <Chip 
                        label={`${profile.modules.length} modules`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              onClick={saveConfiguration} 
              disabled={saving} 
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              Save Configuration
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EMBAConfigComponent;
