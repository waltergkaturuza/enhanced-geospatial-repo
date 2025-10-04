import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Satellite,
  FileType,
  Camera,
  Zap,
  Layers,
  Info,
  Eye,
  Settings,
  Loader,
  Trash2,
  Map,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced file type definitions for comprehensive geospatial support
interface FileTypeInfo {
  category: string;
  format: string;
  isGeospatial: boolean;
  dataType: 'raster' | 'vector' | 'point_cloud' | 'project' | 'unknown';
  processingHints: string[];
}

interface FileMetadata {
  fileType: FileTypeInfo;
  customMetadata: Record<string, any>;
}

interface FileValidation {
  maxSize: number; // in MB
  allowedTypes: string[];
  allowedExtensions: string[];
  requiredMetadata?: string[];
  specialProcessing?: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ProcessingOptions {
  extractAIMetadata: boolean;
  generateThumbnails: boolean;
  validateGeospatial: boolean;
  autoOrganize: boolean;
  detectCRS: boolean;
  calculateSpatialExtent: boolean;
  performQualityCheck: boolean;
}

interface BatchMetadata {
  provider: string;
  province: string;
  district: string;
  acquisitionDate: string;
  description: string;
  tags: string[];
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  expectedCRS?: string;
  processingPriority: 'low' | 'normal' | 'high';
}

interface FileData {
  file: File;
  metadata: FileMetadata;
  validation: ValidationResult;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  preview?: string;
}

export interface UploadResult {
  success: boolean;
  jobId?: string;
  processedFiles?: any[];
  error?: string;
  warnings?: string[];
}

// Comprehensive geospatial file type definitions
const GEOSPATIAL_FILE_TYPES = {
  raster: {
    satellite: ['.tif', '.tiff', '.geotiff', '.gtiff', '.jp2', '.j2k'],
    drone: ['.tif', '.tiff', '.jpg', '.jpeg', '.png', '.jp2'],
    aerial: ['.tif', '.tiff', '.jpg', '.jpeg', '.png', '.ecw', '.sid'],
    dem: ['.tif', '.tiff', '.asc', '.txt', '.dem', '.hgt'],
    scientific: ['.nc', '.netcdf', '.hdf', '.h5', '.hdf5', '.grib', '.grb']
  },
  vector: {
    shapefile: ['.shp', '.shx', '.dbf', '.prj', '.cpg', '.sbn', '.sbx'],
    modern: ['.geojson', '.json', '.kml', '.kmz', '.gpx', '.gml'],
    cad: ['.dxf', '.dgn'],
    gis: ['.tab', '.mif', '.mid', '.osm', '.pbf']
  },
  project: {
    arcgis: ['.mxd', '.aprx', '.lyr', '.msd'],
    qgis: ['.qgs', '.qgz', '.qlr'],
    mapserver: ['.map']
  },
  pointCloud: {
    lidar: ['.las', '.laz', '.xyz', '.txt'],
    photogrammetry: ['.ply', '.obj', '.e57']
  }
};

const FILE_VALIDATION: FileValidation = {
  maxSize: 2000, // 2GB max file size for large geospatial files
  allowedTypes: [
    'image/tiff',
    'image/geotiff', 
    'image/jpeg',
    'image/png',
    'application/octet-stream', // For various geospatial formats
    'application/json', // GeoJSON
    'application/vnd.google-earth.kml+xml', // KML
    'application/vnd.google-earth.kmz', // KMZ
    'application/x-netcdf', // NetCDF
    'application/x-hdf' // HDF
  ],
  allowedExtensions: [
    // Raster formats
    '.tif', '.tiff', '.geotiff', '.gtiff', '.jp2', '.j2k', '.ecw', '.sid', '.img',
    '.nc', '.netcdf', '.hdf', '.h5', '.hdf5', '.grib', '.grb', '.asc', '.txt', '.dem',
    '.bil', '.bip', '.bsq', '.png', '.jpg', '.jpeg',
    // Vector formats  
    '.shp', '.shx', '.dbf', '.prj', '.cpg', '.sbn', '.sbx', '.geojson', '.json',
    '.kml', '.kmz', '.gpx', '.gml', '.tab', '.mif', '.mid', '.dxf', '.dgn', '.osm', '.pbf',
    // Project formats
    '.mxd', '.aprx', '.lyr', '.msd', '.qgs', '.qgz', '.qlr', '.map',
    // Point cloud
    '.las', '.laz', '.xyz', '.ply', '.obj', '.e57'
  ],
  requiredMetadata: ['provider', 'province', 'district'],
  specialProcessing: ['crs_detection', 'spatial_extent', 'format_validation']
};

const PROVIDERS = [
  { value: 'landsat', label: 'Landsat Program' },
  { value: 'sentinel', label: 'Sentinel Program' },
  { value: 'drone', label: 'Drone/UAV Data' },
  { value: 'survey', label: 'Survey Data' },
  { value: 'commercial', label: 'Commercial Satellite' },
  { value: 'government', label: 'Government Agency' },
  { value: 'research', label: 'Research Institution' },
  { value: 'other', label: 'Other' }
];

const ZIMBABWE_PROVINCES = [
  { value: 'harare', label: 'Harare Province', districts: ['Harare', 'Chitungwiza', 'Epworth'] },
  { value: 'bulawayo', label: 'Bulawayo Province', districts: ['Bulawayo'] },
  { value: 'manicaland', label: 'Manicaland', districts: ['Mutare', 'Rusape', 'Chipinge', 'Nyanga'] },
  { value: 'mashonaland-central', label: 'Mashonaland Central', districts: ['Bindura', 'Centenary', 'Guruve'] },
  { value: 'mashonaland-east', label: 'Mashonaland East', districts: ['Marondera', 'Murehwa', 'Wedza'] },
  { value: 'mashonaland-west', label: 'Mashonaland West', districts: ['Chinhoyi', 'Kariba', 'Makonde'] },
  { value: 'masvingo', label: 'Masvingo', districts: ['Masvingo', 'Chiredzi', 'Bikita', 'Zaka'] },
  { value: 'matabeleland-north', label: 'Matabeleland North', districts: ['Hwange', 'Binga', 'Lupane'] },
  { value: 'matabeleland-south', label: 'Matabeleland South', districts: ['Gwanda', 'Beitbridge', 'Plumtree'] },
  { value: 'midlands', label: 'Midlands', districts: ['Gweru', 'Kwekwe', 'Shurugwi', 'Zvishavane'] }
];

interface EnhancedUploadFormProps {
  onUploadComplete?: (result: UploadResult) => void;
  onClose?: () => void;
}

const EnhancedUploadForm: React.FC<EnhancedUploadFormProps> = ({
  onUploadComplete,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [batchMetadata, setBatchMetadata] = useState<BatchMetadata>({
    provider: '',
    province: '',
    district: '',
    acquisitionDate: '',
    description: '',
    tags: [],
    dataQuality: 'good',
    processingPriority: 'normal'
  });
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    extractAIMetadata: true,
    generateThumbnails: true,
    validateGeospatial: true,
    autoOrganize: true,
    detectCRS: true,
    calculateSpatialExtent: true,
    performQualityCheck: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = (file: File): FileTypeInfo => {
    const extension = file.name.toLowerCase().split('.').pop() || '';
    const fullExtension = `.${extension}`;
    const fileName = file.name.toLowerCase();
    
    // Raster data detection
    if (GEOSPATIAL_FILE_TYPES.raster.satellite.includes(fullExtension)) {
      return {
        category: 'satellite',
        format: extension.toUpperCase(),
        isGeospatial: true,
        dataType: 'raster',
        processingHints: ['crs_detection', 'spatial_extent', 'ai_scene_analysis', 'radiometric_analysis']
      };
    }
    
    if (GEOSPATIAL_FILE_TYPES.raster.drone.includes(fullExtension)) {
      return {
        category: 'drone',
        format: extension.toUpperCase(),
        isGeospatial: true,
        dataType: 'raster',
        processingHints: ['crs_detection', 'gps_extraction', 'ai_scene_analysis', 'orthorectification_check']
      };
    }
    
    if (GEOSPATIAL_FILE_TYPES.raster.dem.includes(fullExtension)) {
      return {
        category: 'elevation',
        format: extension.toUpperCase(),
        isGeospatial: true,
        dataType: 'raster',
        processingHints: ['crs_detection', 'elevation_analysis', 'terrain_statistics']
      };
    }
    
    if (GEOSPATIAL_FILE_TYPES.raster.scientific.includes(fullExtension)) {
      return {
        category: 'scientific',
        format: extension.toUpperCase(),
        isGeospatial: true,
        dataType: 'raster',
        processingHints: ['crs_detection', 'temporal_analysis', 'variable_extraction']
      };
    }
    
    // Vector data detection
    if (fullExtension === '.shp' || fileName.includes('.shp')) {
      return {
        category: 'vector',
        format: 'Shapefile',
        isGeospatial: true,
        dataType: 'vector',
        processingHints: ['crs_detection', 'geometry_validation', 'attribute_analysis', 'companion_files_check']
      };
    }
    
    if (GEOSPATIAL_FILE_TYPES.vector.modern.includes(fullExtension)) {
      return {
        category: 'vector',
        format: extension.toUpperCase(),
        isGeospatial: true,
        dataType: 'vector',
        processingHints: ['crs_detection', 'geometry_validation', 'schema_analysis']
      };
    }
    
    if (GEOSPATIAL_FILE_TYPES.vector.cad.includes(fullExtension)) {
      return {
        category: 'cad',
        format: extension.toUpperCase(),
        isGeospatial: false,
        dataType: 'vector',
        processingHints: ['coordinate_extraction', 'layer_analysis']
      };
    }
    
    // Project files
    if (GEOSPATIAL_FILE_TYPES.project.arcgis.includes(fullExtension)) {
      return {
        category: 'project',
        format: 'ArcGIS',
        isGeospatial: true,
        dataType: 'project',
        processingHints: ['project_analysis', 'layer_inventory', 'symbology_extraction']
      };
    }
    
    if (GEOSPATIAL_FILE_TYPES.project.qgis.includes(fullExtension)) {
      return {
        category: 'project',
        format: 'QGIS',
        isGeospatial: true,
        dataType: 'project',
        processingHints: ['project_analysis', 'layer_inventory', 'style_extraction']
      };
    }
    
    // Point cloud data
    if (GEOSPATIAL_FILE_TYPES.pointCloud.lidar.includes(fullExtension)) {
      return {
        category: 'point_cloud',
        format: 'LiDAR',
        isGeospatial: true,
        dataType: 'point_cloud',
        processingHints: ['crs_detection', 'point_density_analysis', 'classification_check']
      };
    }
    
    // Standard image formats (may have geospatial metadata)
    if (['.jpg', '.jpeg', '.png'].includes(fullExtension)) {
      return {
        category: 'image',
        format: extension.toUpperCase(),
        isGeospatial: false,
        dataType: 'raster',
        processingHints: ['exif_extraction', 'gps_check', 'ai_scene_analysis']
      };
    }
    
    return {
      category: 'other',
      format: 'Unknown',
      isGeospatial: false,
      dataType: 'unknown',
      processingHints: ['basic_metadata']
    };
  };

  const validateFile = (file: File): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Size validation with dynamic limits based on file type
    const fileType = detectFileType(file);
    let maxSize = FILE_VALIDATION.maxSize;
    
    // Adjust size limits based on file category
    if (fileType.category === 'scientific' || fileType.dataType === 'point_cloud') {
      maxSize = 5000; // 5GB for large scientific datasets
    } else if (fileType.category === 'satellite') {
      maxSize = 3000; // 3GB for satellite imagery
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${maxSize}MB for ${fileType.category} files`);
    }
    
    // Extension validation
    const extension = `.${file.name.toLowerCase().split('.').pop()}`;
    if (!FILE_VALIDATION.allowedExtensions.includes(extension)) {
      if (fileType.isGeospatial) {
        warnings.push(`File extension ${extension} is unusual for geospatial data but will be processed`);
      } else {
        errors.push(`File extension ${extension} is not supported`);
      }
    }
    
    // Shapefile validation (requires companion files)
    if (extension === '.shp') {
      warnings.push('Shapefile detected - ensure .shx, .dbf, and .prj files are also uploaded for complete functionality');
    }
    
    // Project file validation
    if (fileType.dataType === 'project') {
      warnings.push('Project files may reference external data sources that need to be uploaded separately');
    }
    
    // Point cloud size warning
    if (fileType.dataType === 'point_cloud' && file.size > 1000 * 1024 * 1024) {
      warnings.push('Large point cloud file detected - processing may take significant time');
    }
    
    // Name validation
    if (file.name.length > 255) {
      errors.push('Filename is too long (max 255 characters)');
    }
    
    // More permissive filename validation for geospatial files
    if (!/^[a-zA-Z0-9._\-\s()]+$/.test(file.name)) {
      warnings.push('Filename contains special characters that may cause compatibility issues');
    }
    
    // Check for coordinate system hints in filename
    const coordSysHints = ['utm', 'wgs84', 'nad83', 'epsg', 'mercator', 'geographic'];
    const hasCoordHint = coordSysHints.some(hint => 
      file.name.toLowerCase().includes(hint)
    );
    
    if (fileType.isGeospatial && hasCoordHint) {
      warnings.push('Coordinate system information detected in filename - this will be verified during processing');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const newFiles: FileData[] = filesArray.map(file => {
      const fileType = detectFileType(file);
      const validation = validateFile(file);
      
      return {
        file,
        metadata: {
          fileType,
          customMetadata: {}
        },
        validation,
        progress: 0,
        status: 'pending'
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: FileTypeInfo) => {
    switch (fileType.dataType) {
      case 'raster':
        return fileType.category === 'satellite' ? <Satellite className="w-5 h-5" /> : <Camera className="w-5 h-5" />;
      case 'vector':
        return <Map className="w-5 h-5" />;
      case 'point_cloud':
        return <Database className="w-5 h-5" />;
      case 'project':
        return <Layers className="w-5 h-5" />;
      default:
        return <FileType className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return files.length > 0 && files.every(f => f.validation.isValid);
      case 2:
        return batchMetadata.provider && batchMetadata.province && batchMetadata.district;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNext()) return;
    
    const validFiles = files.filter(f => f.validation.isValid);
    
    if (validFiles.length === 0) {
      alert('No valid files to upload');
      return;
    }
    
    setCurrentStep(5); // Processing step
    
    try {
      setIsProcessing(true);
      
      const formData = new FormData();
      validFiles.forEach(fileData => {
        formData.append('files', fileData.file);
      });
      
      // Add batch metadata
      formData.append('batch_metadata', JSON.stringify({
        provider: batchMetadata.provider,
        province: batchMetadata.province,
        district: batchMetadata.district,
        acquisition_date: batchMetadata.acquisitionDate,
        description: batchMetadata.description,
        tags: batchMetadata.tags,
        processing_options: processingOptions
      }));
      
      // Add individual file metadata
      const fileMetadataArray = validFiles.map(fileData => ({
        filename: fileData.file.name,
        metadata: fileData.metadata
      }));
      formData.append('file_metadata', JSON.stringify(fileMetadataArray));
      
      // Use enhanced upload endpoint
      const response = await fetch('/api/upload/enhanced-geospatial-data/', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Processing-Type': 'comprehensive_geospatial'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      setUploadResult(result);
      setCurrentStep(6); // Success step
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setCurrentStep(6); // Error step
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Upload Files', icon: Upload },
      { number: 2, title: 'Metadata', icon: Info },
      { number: 3, title: 'Processing Options', icon: Settings },
      { number: 4, title: 'Review', icon: Eye },
      { number: 5, title: 'Processing', icon: Zap },
      { number: 6, title: 'Complete', icon: CheckCircle }
    ];
    
    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <div key={step.number} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                isActive && "bg-blue-600 border-blue-600 text-white",
                isCompleted && "bg-green-600 border-green-600 text-white",
                !isActive && !isCompleted && "border-gray-300 text-gray-400"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <div className={cn(
                  "text-sm font-medium",
                  isActive && "text-blue-600",
                  isCompleted && "text-green-600",
                  !isActive && !isCompleted && "text-gray-400"
                )}>
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-4",
                  isCompleted ? "bg-green-600" : "bg-gray-200"
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderFileUploadStep = () => (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
          "hover:border-blue-400 hover:bg-blue-50"
        )}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Geospatial Files
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports: Satellite imagery, drone data, shapefiles, vector data, point clouds, project files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          accept={FILE_VALIDATION.allowedExtensions.join(',')}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Files
        </button>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Selected Files ({files.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((fileData, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFileIcon(fileData.metadata.fileType)}
                  <div>
                    <div className="font-medium text-sm">{fileData.file.name}</div>
                    <div className="text-xs text-gray-500">
                      {fileData.metadata.fileType.category} • {fileData.metadata.fileType.format} • 
                      {(fileData.file.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(fileData.status)}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {files.some(f => !f.validation.isValid) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="font-medium text-red-800 mb-2">Validation Errors</h5>
              {files.filter(f => !f.validation.isValid).map((fileData, index) => (
                <div key={index} className="text-sm text-red-700 mb-1">
                  <strong>{fileData.file.name}:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {fileData.validation.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          
          {files.some(f => f.validation.warnings.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">Warnings</h5>
              {files.filter(f => f.validation.warnings.length > 0).map((fileData, index) => (
                <div key={index} className="text-sm text-yellow-700 mb-1">
                  <strong>{fileData.file.name}:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {fileData.validation.warnings.map((warning, warningIndex) => (
                      <li key={warningIndex}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMetadataStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Batch Metadata</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Provider *
          </label>
          <select
            value={batchMetadata.provider}
            onChange={(e) => setBatchMetadata(prev => ({ ...prev, provider: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select provider...</option>
            {PROVIDERS.map(provider => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Province *
          </label>
          <select
            value={batchMetadata.province}
            onChange={(e) => {
              setBatchMetadata(prev => ({ ...prev, province: e.target.value, district: '' }));
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select province...</option>
            {ZIMBABWE_PROVINCES.map(province => (
              <option key={province.value} value={province.value}>
                {province.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District *
          </label>
          <select
            value={batchMetadata.district}
            onChange={(e) => setBatchMetadata(prev => ({ ...prev, district: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!batchMetadata.province}
          >
            <option value="">Select district...</option>
            {batchMetadata.province && 
              ZIMBABWE_PROVINCES
                .find(p => p.value === batchMetadata.province)?.districts
                .map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))
            }
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Acquisition Date
          </label>
          <input
            type="date"
            value={batchMetadata.acquisitionDate}
            onChange={(e) => setBatchMetadata(prev => ({ ...prev, acquisitionDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Quality
          </label>
          <select
            value={batchMetadata.dataQuality}
            onChange={(e) => setBatchMetadata(prev => ({ ...prev, dataQuality: e.target.value as any }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Processing Priority
          </label>
          <select
            value={batchMetadata.processingPriority}
            onChange={(e) => setBatchMetadata(prev => ({ ...prev, processingPriority: e.target.value as any }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={batchMetadata.description}
          onChange={(e) => setBatchMetadata(prev => ({ ...prev, description: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Describe the dataset..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expected CRS (optional)
        </label>
        <input
          type="text"
          value={batchMetadata.expectedCRS || ''}
          onChange={(e) => setBatchMetadata(prev => ({ ...prev, expectedCRS: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., EPSG:4326, UTM Zone 35S"
        />
      </div>
    </div>
  );

  const renderProcessingOptionsStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Processing Options</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">AI-Powered Metadata Extraction</div>
            <div className="text-sm text-gray-600">Extract scene descriptions and object detection</div>
          </div>
          <input
            type="checkbox"
            checked={processingOptions.extractAIMetadata}
            onChange={(e) => setProcessingOptions(prev => ({ ...prev, extractAIMetadata: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Coordinate System Detection</div>
            <div className="text-sm text-gray-600">Automatically detect and validate CRS information</div>
          </div>
          <input
            type="checkbox"
            checked={processingOptions.detectCRS}
            onChange={(e) => setProcessingOptions(prev => ({ ...prev, detectCRS: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Spatial Extent Calculation</div>
            <div className="text-sm text-gray-600">Calculate bounding boxes and spatial coverage</div>
          </div>
          <input
            type="checkbox"
            checked={processingOptions.calculateSpatialExtent}
            onChange={(e) => setProcessingOptions(prev => ({ ...prev, calculateSpatialExtent: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Quality Assessment</div>
            <div className="text-sm text-gray-600">Perform data validation and quality checks</div>
          </div>
          <input
            type="checkbox"
            checked={processingOptions.performQualityCheck}
            onChange={(e) => setProcessingOptions(prev => ({ ...prev, performQualityCheck: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Generate Thumbnails</div>
            <div className="text-sm text-gray-600">Create preview images for visualization</div>
          </div>
          <input
            type="checkbox"
            checked={processingOptions.generateThumbnails}
            onChange={(e) => setProcessingOptions(prev => ({ ...prev, generateThumbnails: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Auto-Organization</div>
            <div className="text-sm text-gray-600">Automatically organize files by detected metadata</div>
          </div>
          <input
            type="checkbox"
            checked={processingOptions.autoOrganize}
            onChange={(e) => setProcessingOptions(prev => ({ ...prev, autoOrganize: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Review Upload</h3>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Files to Upload</h4>
          <div className="text-sm text-gray-600">
            {files.filter(f => f.validation.isValid).length} files, total size: 
            {(files.reduce((sum, f) => sum + f.file.size, 0) / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Provider: {batchMetadata.provider}</div>
            <div>Location: {batchMetadata.district}, {batchMetadata.province}</div>
            <div>Quality: {batchMetadata.dataQuality}</div>
            {batchMetadata.acquisitionDate && <div>Date: {batchMetadata.acquisitionDate}</div>}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Processing Options</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {processingOptions.extractAIMetadata && <div>✓ AI metadata extraction</div>}
            {processingOptions.detectCRS && <div>✓ CRS detection</div>}
            {processingOptions.calculateSpatialExtent && <div>✓ Spatial extent calculation</div>}
            {processingOptions.performQualityCheck && <div>✓ Quality assessment</div>}
            {processingOptions.generateThumbnails && <div>✓ Thumbnail generation</div>}
            {processingOptions.autoOrganize && <div>✓ Auto-organization</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">Processing Files</h3>
      <p className="text-gray-600">
        Analyzing geospatial data, extracting metadata, and organizing files...
      </p>
    </div>
  );

  const renderResultStep = () => (
    <div className="text-center space-y-6">
      {uploadResult?.success ? (
        <>
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Upload Successful!</h3>
          <p className="text-gray-600">
            Your geospatial files have been processed and stored successfully.
          </p>
          {uploadResult.jobId && (
            <p className="text-sm text-gray-500">
              Job ID: {uploadResult.jobId}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-center">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Upload Failed</h3>
          <p className="text-red-600">
            {uploadResult?.error || 'An unknown error occurred'}
          </p>
        </>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderFileUploadStep();
      case 2:
        return renderMetadataStep();
      case 3:
        return renderProcessingOptionsStep();
      case 4:
        return renderReviewStep();
      case 5:
        return renderProcessingStep();
      case 6:
        return renderResultStep();
      default:
        return renderFileUploadStep();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Enhanced Geospatial Data Upload
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {renderStepIndicator()}
          {renderCurrentStep()}
          
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isProcessing}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
            >
              Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceedToNext() || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : currentStep === 4 ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceedToNext() || isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
              >
                Start Processing
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUploadForm;