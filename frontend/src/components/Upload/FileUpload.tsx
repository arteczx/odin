import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  TextField,
  Chip,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { projectsApi } from '../../services/api';

interface FileUploadProps {
  onUploadSuccess?: (projectId: string, taskId: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  // const navigate = useNavigate(); // Commented out to fix unused variable warning
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    deviceType: '',
    manufacturer: '',
    model: '',
  });

  const acceptedFileTypes = {
    'application/octet-stream': ['.bin', '.img', '.hex', '.rom', '.fw'],
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setMetadata(prev => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
      }));
      setError(null);
      setUploadSuccess(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleMetadataChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMetadata(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !metadata.name) {
      setError('Please select a file and provide a name');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadData = {
        name: metadata.name,
        description: metadata.description,
        device_name: metadata.deviceType,
        device_model: metadata.model,
        manufacturer: metadata.manufacturer,
      };

      const result = await projectsApi.uploadFirmware(selectedFile, uploadData);
      setUploadProgress(100);
      setUploadSuccess(true);
      
      if (onUploadSuccess) {
        onUploadSuccess(result.project_id, result.job_id);
      }
      
      // Navigate to projects page after successful upload
      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setMetadata({
          name: '',
          description: '',
          deviceType: '',
          manufacturer: '',
          model: '',
        });
        setUploadSuccess(false);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
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
          Upload Firmware
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#8b949e',
            fontFamily: '"Fira Code", monospace',
            fontSize: '0.9rem',
          }}
        >
          // Drop your firmware binary for automated analysis
        </Typography>
      </Box>

      {/* File Drop Zone */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? '#00ff41' : '#30363d',
          backgroundColor: isDragActive ? 'rgba(0, 255, 65, 0.1)' : '#161b22',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isDragActive ? '0 0 30px rgba(0, 255, 65, 0.3)' : '0 0 15px rgba(0, 255, 65, 0.1)',
          '&:hover': {
            borderColor: '#00ff41',
            backgroundColor: 'rgba(0, 255, 65, 0.05)',
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: '#00ff41', mb: 2, filter: 'drop-shadow(0 0 10px rgba(0, 255, 65, 0.5))' }} />
        
        {selectedFile ? (
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#00ff41',
                fontFamily: '"Fira Code", monospace',
                textShadow: '0 0 5px rgba(0, 255, 65, 0.5)',
              }}
            >
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
              [FILE_LOADED]
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mt: 1,
                fontFamily: '"Fira Code", monospace',
                color: '#c9d1d9',
              }}
            >
              {selectedFile.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
              }}
            >
              Size: {formatFileSize(selectedFile.size)}
            </Typography>
            <Chip
              label={`[${selectedFile.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'}]`}
              sx={{ 
                mt: 1,
                backgroundColor: 'rgba(0, 255, 65, 0.2)',
                color: '#00ff41',
                border: '1px solid #00ff41',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.7rem',
              }}
            />
          </Box>
        ) : (
          <Box>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontFamily: '"Fira Code", monospace',
                color: '#c9d1d9',
              }}
            >
              {isDragActive ? '> DROP_FILE_HERE' : '> DRAG_FIRMWARE_HERE'}
            </Typography>
            <Typography 
              variant="body2" 
              gutterBottom
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
              }}
            >
              // or click to browse files
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#8b949e',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.7rem',
              }}
            >
              Supported: .bin .img .hex .rom .fw (Max: 500MB)
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Metadata Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Project Information
        </Typography>
        
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Project Name *"
            value={metadata.name}
            onChange={handleMetadataChange('name')}
            placeholder="e.g., Router Firmware Analysis"
            required
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={metadata.description}
            onChange={handleMetadataChange('description')}
            placeholder="Brief description of the firmware or device..."
          />
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Device Type"
              value={metadata.deviceType}
              onChange={handleMetadataChange('deviceType')}
              placeholder="e.g., Router, IoT Device"
            />
            
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Manufacturer"
              value={metadata.manufacturer}
              onChange={handleMetadataChange('manufacturer')}
              placeholder="e.g., TP-Link, Netgear"
            />
            
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Model"
              value={metadata.model}
              onChange={handleMetadataChange('model')}
              placeholder="e.g., AC1750, WR841N"
            />
          </Box>
        </Stack>
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading and starting analysis...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<Error />}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {uploadSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
          Firmware uploaded successfully! Analysis has started.
        </Alert>
      )}

      {/* Upload Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleUpload}
        disabled={!selectedFile || !metadata.name.trim() || uploading}
        startIcon={<CloudUpload />}
        sx={{ minWidth: 200 }}
      >
        {uploading ? 'Uploading...' : 'Start Analysis'}
      </Button>
    </Box>
  );
};

export default FileUpload;
