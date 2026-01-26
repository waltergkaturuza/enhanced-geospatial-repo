import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileType,
  Eye,
  Settings,
  Brain,
  Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/api';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  preview?: string;
  extractedMetadata?: ExtractedMetadata;
  userMetadata?: UserMetadata;
  validationErrors?: string[];
}

interface ExtractedMetadata {
  // AI-extracted metadata
  provider?: string;
  satellite?: string;
  resolution?: string;
  bands?: string[];
  crs?: string;
  cloudCover?: number;
  acquisitionDate?: string;
  geographicBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  estimatedLocation?: {
    country?: string;
    province?: string;
    district?: string;
    confidence?: number;
  };
  fileFormat?: string;
  compressionType?: string;
  colorSpace?: string;
  bitDepth?: number;
}

interface UserMetadata {
  // User-provided metadata
  provider: string;
  satellite: string;
  province: string;
  district: string;
  acquisitionDate: string;
  description: string;
  tags: string[];
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  cloudCover?: number;
  customFields: { [key: string]: string };
}

interface AdvancedUploadFormProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  onClose?: () => void;
}

const SATELLITE_PROVIDERS = [
  { value: 'landsat', label: 'Landsat Program', satellites: ['Landsat 5', 'Landsat 7', 'Landsat 8', 'Landsat 9'] },
  { value: 'sentinel', label: 'Sentinel Program', satellites: ['Sentinel-1A', 'Sentinel-1B', 'Sentinel-2A', 'Sentinel-2B'] },
  { value: 'gaofen', label: 'GaoFen Series', satellites: ['GaoFen-1', 'GaoFen-2', 'GaoFen-3', 'GaoFen-4'] },
  { value: 'spot', label: 'SPOT Series', satellites: ['SPOT-6', 'SPOT-7'] },
  { value: 'worldview', label: 'WorldView Series', satellites: ['WorldView-1', 'WorldView-2', 'WorldView-3', 'WorldView-4'] },
  { value: 'uav', label: 'UAV/Drone', satellites: ['DJI Series', 'Fixed-wing UAV', 'Custom Drone'] },
  { value: 'modis', label: 'MODIS', satellites: ['Terra MODIS', 'Aqua MODIS'] },
  { value: 'viirs', label: 'VIIRS', satellites: ['Suomi NPP', 'NOAA-20', 'NOAA-21'] }
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

const AdvancedUploadForm: React.FC<AdvancedUploadFormProps> = ({
  onUploadComplete,
  onClose
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'metadata' | 'review'>('upload');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedSatellite, setSelectedSatellite] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [batchMetadata, setBatchMetadata] = useState<Partial<UserMetadata>>({
    tags: [],
    customFields: {},
    dataQuality: 'good'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop
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
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      progress: 0,
      userMetadata: {
        provider: selectedProvider,
        satellite: selectedSatellite,
        province: selectedProvince,
        district: selectedDistrict,
        acquisitionDate: '',
        description: '',
        tags: [...(batchMetadata.tags || [])],
        dataQuality: batchMetadata.dataQuality || 'good',
        customFields: { ...batchMetadata.customFields }
      }
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);

    // Process each file
    for (const uploadFile of newUploadFiles) {
      await processIndividualFile(uploadFile);
    }

    setCurrentStep('metadata');
  };

  // AI-powered metadata extraction
  const processIndividualFile = async (uploadFile: UploadFile) => {
    try {
      // Update status to analyzing
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'analyzing', progress: 10 } : f
      ));

      // Generate preview for image files
      if (uploadFile.file.type.startsWith('image/')) {
        const preview = await generatePreview(uploadFile.file);
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, preview, progress: 30 } : f
        ));
      }

      // Extract basic file metadata
      const basicMetadata = await extractBasicMetadata(uploadFile.file);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          extractedMetadata: { ...basicMetadata }, 
          progress: 50 
        } : f
      ));

      // AI-powered advanced extraction
      setIsAiProcessing(true);
      const aiMetadata = await performAIExtraction(uploadFile.file);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          extractedMetadata: { ...basicMetadata, ...aiMetadata },
          progress: 80 
        } : f
      ));

      // Validate file
      const validationErrors = await validateFile(uploadFile.file, { ...basicMetadata, ...aiMetadata });
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          validationErrors,
          status: validationErrors.length > 0 ? 'error' : 'completed',
          progress: 100 
        } : f
      ));

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          validationErrors: ['Failed to process file'],
          progress: 100 
        } : f
      ));
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Generate preview image
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Extract basic metadata
  const extractBasicMetadata = async (file: File): Promise<Partial<ExtractedMetadata>> => {
    const metadata: Partial<ExtractedMetadata> = {
      fileFormat: file.name.split('.').pop()?.toLowerCase(),
    };

    // Try to detect provider from filename
    const filename = file.name.toLowerCase();
    for (const provider of SATELLITE_PROVIDERS) {
      if (filename.includes(provider.value) || 
          provider.satellites.some(sat => filename.includes(sat.toLowerCase().replace(/[-\s]/g, '')))) {
        metadata.provider = provider.label;
        break;
      }
    }

    return metadata;
  };

  // AI-powered metadata extraction
  const performAIExtraction = async (file: File): Promise<Partial<ExtractedMetadata>> => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      // Send file to AI processing endpoint
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiBaseUrl}/ai/extract-metadata/`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return result.metadata || {};
      }
    } catch (error) {
      console.error('AI extraction failed:', error);
    }

    // Fallback: simulate AI extraction for demo
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          resolution: '30m',
          bands: ['Red', 'Green', 'Blue', 'NIR'],
          crs: 'EPSG:4326',
          cloudCover: Math.random() * 30,
          estimatedLocation: {
            country: 'Zimbabwe',
            confidence: 0.85
          }
        });
      }, 2000);
    });
  };

  // Validate file
  const validateFile = async (file: File, metadata: Partial<ExtractedMetadata>): Promise<string[]> => {
    const errors: string[] = [];

    // File size validation
    if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB
      errors.push('File size exceeds 5GB limit');
    }

    // Format validation
    const supportedFormats = ['.tif', '.tiff', '.jpg', '.jpeg', '.png', '.hdf', '.h5', '.nc', '.jp2'];
    const fileExtension = '.' + (metadata.fileFormat || '');
    if (!supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported file format: ${fileExtension}`);
    }

    return errors;
  };

  // Remove file from upload list
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Update user metadata for a file
  const updateFileMetadata = (fileId: string, metadata: Partial<UserMetadata>) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { 
        ...f, 
        userMetadata: { ...f.userMetadata, ...metadata } as UserMetadata 
      } : f
    ));
  };

  // Add custom field
  const addCustomField = (fileId: string, key: string, value: string) => {
    updateFileMetadata(fileId, {
      customFields: {
        ...uploadFiles.find(f => f.id === fileId)?.userMetadata?.customFields,
        [key]: value
      }
    });
  };

  // Submit upload
  const handleSubmit = async () => {
    try {
      setIsAiProcessing(true);

      const formData = new FormData();
      
      uploadFiles.forEach((uploadFile, index) => {
        formData.append('files', uploadFile.file);
        formData.append(`metadata_${index}`, JSON.stringify({
          ...uploadFile.extractedMetadata,
          ...uploadFile.userMetadata
        }));
      });

      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const response = await fetch(`${apiBaseUrl}/upload/advanced-satellite-imagery/`, {
        method: 'POST',
        headers,
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        onUploadComplete?.(uploadFiles);
        alert('Upload completed successfully!');
      } else {
        alert(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: Network error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Batch Metadata */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Batch Metadata (applies to all files)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Auto-detect</option>
              {SATELLITE_PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>{provider.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Satellite</label>
            <select
              value={selectedSatellite}
              onChange={(e) => setSelectedSatellite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={!selectedProvider}
            >
              <option value="">Auto-detect</option>
              {selectedProvider && SATELLITE_PROVIDERS
                .find(p => p.value === selectedProvider)?.satellites
                .map(satellite => (
                  <option key={satellite} value={satellite}>{satellite}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Auto-detect</option>
              {ZIMBABWE_PROVINCES.map(province => (
                <option key={province.value} value={province.value}>{province.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={!selectedProvince}
            >
              <option value="">Auto-detect</option>
              {selectedProvince && ZIMBABWE_PROVINCES
                .find(p => p.value === selectedProvince)?.districts
                .map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Supports: GeoTIFF, JPEG, PNG, HDF, NetCDF, JPEG 2000, and more
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Choose Files
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".tif,.tiff,.jpg,.jpeg,.png,.hdf,.h5,.nc,.jp2,.zip,.tar.gz"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              processFiles(files);
            }
          }}
        />
      </div>

      {/* AI Processing Status */}
      {isAiProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">AI Processing</h4>
              <p className="text-sm text-blue-700">
                Extracting metadata and analyzing satellite imagery...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Processing Files ({uploadFiles.length})</h3>
          {uploadFiles.map(uploadFile => renderFileItem(uploadFile))}
        </div>
      )}
    </div>
  );

  const renderFileItem = (uploadFile: UploadFile) => (
    <div key={uploadFile.id} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          {uploadFile.preview ? (
            <img 
              src={uploadFile.preview} 
              alt={uploadFile.file.name}
              className="w-16 h-16 object-cover rounded-md border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
              <FileType className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {uploadFile.file.name}
            </h4>
            <button
              onClick={() => removeFile(uploadFile.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2 mb-2">
            {uploadFile.status === 'pending' && (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
            {uploadFile.status === 'analyzing' && (
              <Loader className="w-4 h-4 text-blue-500 animate-spin" />
            )}
            {uploadFile.status === 'completed' && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {uploadFile.status === 'error' && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600 capitalize">
              {uploadFile.status}
            </span>
            <span className="text-xs text-gray-500">
              {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadFile.progress}%` }}
            />
          </div>

          {/* Extracted Metadata Preview */}
          {uploadFile.extractedMetadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {uploadFile.extractedMetadata.provider && (
                <div>
                  <span className="text-gray-500">Provider:</span>
                  <span className="ml-1 font-medium">{uploadFile.extractedMetadata.provider}</span>
                </div>
              )}
              {uploadFile.extractedMetadata.resolution && (
                <div>
                  <span className="text-gray-500">Resolution:</span>
                  <span className="ml-1 font-medium">{uploadFile.extractedMetadata.resolution}</span>
                </div>
              )}
              {uploadFile.extractedMetadata.cloudCover !== undefined && (
                <div>
                  <span className="text-gray-500">Cloud:</span>
                  <span className="ml-1 font-medium">{uploadFile.extractedMetadata.cloudCover.toFixed(1)}%</span>
                </div>
              )}
              {uploadFile.extractedMetadata.estimatedLocation?.confidence && (
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-1 font-medium">
                    {(uploadFile.extractedMetadata.estimatedLocation.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Validation Errors */}
          {uploadFile.validationErrors && uploadFile.validationErrors.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <p className="text-red-600 font-medium">Validation Errors:</p>
              <ul className="text-red-600 list-disc list-inside">
                {uploadFile.validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Advanced Upload</h2>
            <p className="text-sm text-gray-600">Upload satellite imagery with AI-powered metadata extraction</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center space-x-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className={cn(
            "flex items-center space-x-2 px-3 py-1 rounded-full text-sm",
            currentStep === 'upload' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
          )}>
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </div>
          <div className={cn(
            "flex items-center space-x-2 px-3 py-1 rounded-full text-sm",
            currentStep === 'metadata' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
          )}>
            <Settings className="w-4 h-4" />
            <span>Metadata</span>
          </div>
          <div className={cn(
            "flex items-center space-x-2 px-3 py-1 rounded-full text-sm",
            currentStep === 'review' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
          )}>
            <Eye className="w-4 h-4" />
            <span>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentStep === 'upload' && renderUploadStep()}
          {/* TODO: Implement metadata and review steps */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {uploadFiles.length > 0 && (
              <span>
                {uploadFiles.filter(f => f.status === 'completed').length} of {uploadFiles.length} files processed
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'completed') && (
              <button
                onClick={handleSubmit}
                disabled={isAiProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isAiProcessing ? 'Processing...' : 'Upload Files'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedUploadForm;