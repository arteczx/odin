import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#00ff41', // Matrix green
        dark: '#00cc33',
        light: '#33ff66',
      },
      secondary: {
        main: '#ff0080', // Cyberpunk pink
        dark: '#cc0066',
        light: '#ff3399',
      },
      error: {
        main: '#ff073a', // Neon red
      },
      warning: {
        main: '#ffaa00', // Neon orange
      },
      info: {
        main: '#00d4ff', // Neon blue
      },
      success: {
        main: '#00ff41', // Matrix green
      },
      background: {
        default: '#0d1117', // GitHub dark
        paper: '#161b22', // Darker paper
      },
      text: {
        primary: '#c9d1d9', // Light gray
        secondary: '#8b949e', // Medium gray
      },
    },
    typography: {
      fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", "Monaco", monospace',
      h1: { fontWeight: 700, letterSpacing: '0.02em' },
      h2: { fontWeight: 600, letterSpacing: '0.02em' },
      h3: { fontWeight: 600, letterSpacing: '0.02em' },
      h4: { fontWeight: 600, letterSpacing: '0.02em' },
      h5: { fontWeight: 500, letterSpacing: '0.02em' },
      h6: { fontWeight: 500, letterSpacing: '0.02em' },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: '1px solid #30363d',
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontFamily: '"Fira Code", monospace',
            fontWeight: 500,
            borderRadius: 4,
          },
          contained: {
            boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
            '&:hover': {
              boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid #30363d',
            boxShadow: '0 0 15px rgba(0, 255, 65, 0.1)',
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <Sidebar open={true} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8,
            ml: '240px',
            backgroundColor: theme.palette.background.default,
            minHeight: '100vh',
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;
