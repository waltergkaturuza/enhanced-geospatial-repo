import { useState } from 'react';
import type { SystemTab, UploadedFile, MetadataField, ProcessingJob, SystemStatus, ActivityLog } from '../types/system';

export const useSystemState = () => {
  const [activeTab, setActiveTab] = useState<SystemTab>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [metadataText, setMetadataText] = useState('');
  const [parsedMetadata, setParsedMetadata] = useState<MetadataField[]>([]);
  
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([
    {
      id: '1',
      name: 'Landsat Scene Processing',
      type: 'processing',
      status: 'running',
      progress: 75,
      startTime: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: '2', 
      name: 'Metadata Extraction',
      type: 'metadata',
      status: 'completed',
      progress: 100,
      startTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      endTime: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
    },
    {
      id: '3',
      name: 'File Upload Queue',
      type: 'upload', 
      status: 'pending',
      progress: 0,
      startTime: new Date()
    }
  ]);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'active',
    processing: 'active',
    storage: {
      used: 756,
      total: 1000,
      percentage: 75.6
    }
  });

  const [activityLog, setActivityLog] = useState<ActivityLog[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'success',
      message: 'Added 23 new imagery scenes to database'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      type: 'success', 
      message: 'Updated administrative boundaries for Harare Province'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 75 * 60 * 1000),
      type: 'info',
      message: 'Database maintenance completed successfully'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 100 * 60 * 1000),
      type: 'success',
      message: 'Processed metadata for 15 Landsat scenes'
    }
  ]);

  return {
    activeTab,
    setActiveTab,
    uploadedFiles,
    setUploadedFiles,
    isDragging,
    setIsDragging,
    metadataText,
    setMetadataText,
    parsedMetadata,
    setParsedMetadata,
    processingJobs,
    setProcessingJobs,
    systemStatus,
    setSystemStatus,
    activityLog,
    setActivityLog
  };
};
