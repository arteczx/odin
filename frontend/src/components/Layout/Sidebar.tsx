import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Upload,
  FolderOpen,
  Security,
  BugReport,
  Search,
  Settings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Upload Firmware', icon: <Upload />, path: '/upload' },
  { text: 'Projects', icon: <FolderOpen />, path: '/projects' },
  { text: 'Vulnerabilities', icon: <Security />, path: '/vulnerabilities' },
  { text: 'OSINT Results', icon: <Search />, path: '/osint' },
  { text: 'Analysis Reports', icon: <BugReport />, path: '/reports' },
];

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#0d1117',
          color: '#c9d1d9',
          borderRight: '1px solid #30363d',
          boxShadow: '0 0 30px rgba(0, 255, 65, 0.1)',
        },
      }}
    >
      <Toolbar sx={{ borderBottom: '1px solid #30363d' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security sx={{ color: '#00ff41', fontSize: 28 }} />
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#00ff41',
              fontFamily: '"Fira Code", monospace',
              textShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
            }}
          >
            ODIN
          </Typography>
        </Box>
      </Toolbar>
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#8b949e',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.7rem',
          }}
        >
          // Firmware Intelligence
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                fontFamily: '"Fira Code", monospace',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 255, 65, 0.1)',
                  borderLeft: '3px solid #00ff41',
                  boxShadow: '0 0 10px rgba(0, 255, 65, 0.2)',
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 65, 0.05)',
                  boxShadow: '0 0 5px rgba(0, 255, 65, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#00ff41' : '#8b949e', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '0.85rem',
                  color: location.pathname === item.path ? '#00ff41' : '#c9d1d9',
                }}
              >
                {/* Add more navigation items here */}
              </ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 1 }}>
        <Divider sx={{ borderColor: '#30363d', mb: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/settings')}
            sx={{
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 65, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#8b949e', minWidth: 40 }}>
              <Settings />
            </ListItemIcon>
            <ListItemText 
              primary="Settings"
              primaryTypographyProps={{
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.85rem',
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
