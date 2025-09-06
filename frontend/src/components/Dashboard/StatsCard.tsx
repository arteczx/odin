import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
}) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
        border: '1px solid #30363d',
        boxShadow: `0 0 20px ${color}20`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 0 30px ${color}40`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography 
              variant="overline" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
              }}
            >
              {title.toUpperCase()}
            </Typography>
            <Typography 
              variant="h3" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                color: color,
                fontFamily: '"Fira Code", monospace',
                textShadow: `0 0 10px ${color}50`,
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#c9d1d9',
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '0.8rem',
                }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography
                variant="body2"
                sx={{
                  color: trend.isPositive ? '#00ff41' : '#ff073a',
                  mt: 0.5,
                  fontFamily: '"Fira Code", monospace',
                  fontWeight: 'bold',
                }}
              >
                {trend.isPositive ? '↗ +' : '↘ '}{trend.value}%
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              border: `1px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 15px ${color}30`,
            }}
          >
            <Box sx={{ color: color, fontSize: 28 }}>
              {icon}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
