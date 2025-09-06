import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Brightness4,
  AccountCircle,
  Notifications,
  MarkAsUnread,
  Clear,
} from '@mui/icons-material';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: '1',
      title: 'Analysis Complete',
      message: 'Router_Firmware_v2.1.3.bin analysis finished with 3 critical vulnerabilities found',
      type: 'warning',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: '2',
      title: 'New CVE Detected',
      message: 'CVE-2024-1337 affects your uploaded firmware. Immediate attention required.',
      type: 'error',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: '3',
      title: 'System Update',
      message: 'ODIN Intelligence engine updated to v3.2.1 with improved detection capabilities',
      type: 'success',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      read: false,
    },
  ]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return '#ff073a';
      case 'warning': return '#ffaa00';
      case 'success': return '#00ff41';
      default: return '#00d4ff';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#0d1117',
        borderBottom: '1px solid #30363d',
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)',
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontFamily: '"Fira Code", monospace',
            color: '#c9d1d9',
            fontWeight: 500,
          }}
        >
          <span style={{ color: '#00ff41' }}>[</span>
          <span style={{ color: '#ff0080' }}>root@odin</span>
          <span style={{ color: '#00ff41' }}>]</span>
          <span style={{ color: '#8b949e' }}> ~/firmware-intel $</span>
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            color="inherit" 
            onClick={toggleDarkMode}
            sx={{
              color: '#8b949e',
              '&:hover': {
                color: '#00ff41',
                backgroundColor: 'rgba(0, 255, 65, 0.1)',
              },
            }}
          >
            <Brightness4 />
          </IconButton>
          
          <IconButton 
            color="inherit"
            onClick={handleNotificationMenu}
            sx={{
              color: '#8b949e',
              '&:hover': {
                color: '#ff0080',
                backgroundColor: 'rgba(255, 0, 128, 0.1)',
              },
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#ff073a',
                  color: '#fff',
                  boxShadow: '0 0 5px rgba(255, 7, 58, 0.5)',
                },
              }}
            >
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            sx={{
              color: '#8b949e',
              '&:hover': {
                color: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
              },
            }}
          >
            <AccountCircle />
          </IconButton>
          
          {/* Notifications Menu */}
          <Menu
            id="notifications-menu"
            anchorEl={notificationAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            PaperProps={{
              sx: {
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                boxShadow: '0 0 20px rgba(255, 0, 128, 0.2)',
                width: '400px',
                maxHeight: '500px',
              },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #30363d' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#ff0080',
                    fontFamily: '"Fira Code", monospace',
                    fontWeight: 'bold',
                  }}
                >
                  [NOTIFICATIONS]
                </Typography>
                {unreadCount > 0 && (
                  <IconButton
                    size="small"
                    onClick={markAllAsRead}
                    sx={{
                      color: '#8b949e',
                      '&:hover': {
                        color: '#00ff41',
                        backgroundColor: 'rgba(0, 255, 65, 0.1)',
                      },
                    }}
                    title="Mark all as read"
                  >
                    <MarkAsUnread />
                  </IconButton>
                )}
              </Box>
            </Box>
            
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography
                  sx={{
                    color: '#8b949e',
                    fontFamily: '"Fira Code", monospace',
                  }}
                >
                  No notifications
                </Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  sx={{
                    borderBottom: '1px solid #30363d',
                    p: 2,
                    backgroundColor: notification.read ? 'transparent' : 'rgba(255, 0, 128, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 0, 128, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                          {getNotificationIcon(notification.type)}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: getNotificationColor(notification.type),
                            fontFamily: '"Fira Code", monospace',
                            fontWeight: notification.read ? 'normal' : 'bold',
                          }}
                        >
                          {notification.title}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#8b949e',
                          fontFamily: '"Fira Code", monospace',
                          fontSize: '0.7rem',
                        }}
                      >
                        {formatTimeAgo(notification.timestamp)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: notification.read ? '#8b949e' : '#c9d1d9',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.8rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

          {/* User Menu */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)',
                '& .MuiMenuItem-root': {
                  fontFamily: '"Fira Code", monospace',
                  color: '#c9d1d9',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 65, 0.1)',
                    color: '#00ff41',
                  },
                },
              },
            }}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
