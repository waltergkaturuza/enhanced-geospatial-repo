// System Management Types

export interface MetadataField {
  key: string;
  value: string;
  type: 'string' | 'number' | 'array' | 'coordinate' | 'date';
  group?: string;
  description?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  metadata?: MetadataField[];
  preview?: string;
}

export interface SystemStatus {
  database: 'active' | 'inactive' | 'maintenance';
  processing: 'active' | 'inactive' | 'error';
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface ProcessingJob {
  id: string;
  name: string;
  type: 'metadata' | 'upload' | 'processing' | 'database';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

export type SystemTab = 'upload' | 'metadata' | 'processing' | 'database';

// Satellite-specific types
export interface SatelliteMetadata {
  platform: 'LANDSAT' | 'SENTINEL' | 'GAOFEN' | 'OTHER';
  satellite: string;
  sensor: string;
  scene_id: string;
  acquisition_date: string;
  path?: number;
  row?: number;
  cloud_cover?: number;
  processing_level: string;
  bands: string[];
  spatial_resolution: string;
  temporal_coverage: string;
  coordinate_system: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface SatelliteDataset {
  id: string;
  name: string;
  platform: string;
  satellite: string;
  sensor: string;
  metadata: SatelliteMetadata;
  files: UploadedFile[];
  created_at: Date;
  updated_at: Date;
  status: 'imported' | 'processing' | 'ready' | 'error';
}

export interface DataProcessingOptions {
  atmospheric_correction: boolean;
  geometric_correction: boolean;
  radiometric_calibration: boolean;
  cloud_masking: boolean;
  output_format: 'GEOTIFF' | 'HDF' | 'NETCDF';
  output_projection: string;
  resampling_method: 'nearest' | 'bilinear' | 'cubic';
}

export interface SatelliteDataQuery {
  platforms?: string[];
  satellites?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  cloud_cover_max?: number;
  spatial_bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  processing_levels?: string[];
  data_products?: string[];
}

export interface SystemManagementState {
  activeTab: SystemTab;
  uploadedFiles: UploadedFile[];
  isDragging: boolean;
  metadataText: string;
  parsedMetadata: MetadataField[];
  processingJobs: ProcessingJob[];
  systemStatus: SystemStatus;
  activityLog: ActivityLog[];
}
