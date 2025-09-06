import React from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/Upload/FileUpload';

const Upload: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadSuccess = (projectId: string, taskId: string) => {
    // Navigate to project details page after successful upload
    navigate(`/projects/${projectId}`);
  };

  return (
    <FileUpload onUploadSuccess={handleUploadSuccess} />
  );
};

export default Upload;
