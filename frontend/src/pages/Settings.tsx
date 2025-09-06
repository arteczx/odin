import React, { useState } from 'react';
import EMBAConfig from '../components/EMBA/EMBAConfig';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Security,
  Save,
} from '@mui/icons-material';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    enableStaticAnalysis: true,
    enableCVEScanning: true,
    enableOSINT: false,
    enableNotifications: true,
    darkMode: true,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontFamily: '"Fira Code", monospace',
            color: '#ffaa00',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 170, 0, 0.5)',
            mb: 1,
          }}
        >
          SYSTEM_SETTINGS
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#8b949e',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.9rem',
          }}
        >
          Configure analysis parameters and system behavior
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* EMBA Configuration */}
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
            border: '1px solid #30363d',
            boxShadow: '0 0 15px rgba(255, 170, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Security sx={{ color: '#ffaa00', mr: 1 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#ffaa00',
                fontFamily: '"Fira Code", monospace',
                fontWeight: 'bold',
              }}
            >
              EMBA Configuration
            </Typography>
          </Box>

          <EMBAConfig />
        </Paper>

        {/* Analysis Settings */}
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
            border: '1px solid #30363d',
            boxShadow: '0 0 15px rgba(255, 170, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Security sx={{ color: '#ffaa00', mr: 1 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#ffaa00',
                fontFamily: '"Fira Code", monospace',
                fontWeight: 'bold',
              }}
            >
              Analysis Settings
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.enableStaticAnalysis}
                  onChange={(e) => handleSettingChange('enableStaticAnalysis', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00ff41',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00ff41',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontFamily: '"Fira Code", monospace', color: '#c9d1d9' }}>
                  Enable Static Analysis
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch 
                  checked={settings.enableCVEScanning}
                  onChange={(e) => handleSettingChange('enableCVEScanning', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00ff41',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00ff41',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontFamily: '"Fira Code", monospace', color: '#c9d1d9' }}>
                  Enable CVE Scanning
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch 
                  checked={settings.enableOSINT}
                  onChange={(e) => handleSettingChange('enableOSINT', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00ff41',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00ff41',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontFamily: '"Fira Code", monospace', color: '#c9d1d9' }}>
                  Enable OSINT Gathering
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch 
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00ff41',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00ff41',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontFamily: '"Fira Code", monospace', color: '#c9d1d9' }}>
                  Enable Notifications
                </Typography>
              }
            />
          </Box>
        </Paper>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button 
            onClick={handleSaveSettings} 
            disabled={saving} 
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            sx={{
              bgcolor: '#00ff41',
              color: '#000',
              fontFamily: '"Fira Code", monospace',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#00cc33',
              },
              '&:disabled': {
                bgcolor: '#30363d',
                color: '#8b949e',
              },
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Settings;
