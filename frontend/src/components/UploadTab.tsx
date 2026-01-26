import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertTriangle, Clock, Satellite, Database, Globe, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/api';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  provider?: string;
  satellite?: string;
  progress?: number;
  errorMessage?: string;
}

interface UploadTabProps {
  uploadedFiles?: UploadedFile[];
  onFilesUploaded?: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
}

const SATELLITE_PROVIDERS = [
  {
    name: 'Landsat Program',
    satellites: ['Landsat 5', 'Landsat 7', 'Landsat 8', 'Landsat 9'],
    icon: <Satellite className="w-5 h-5 text-blue-600" />,
    color: 'blue',
    description: '30m resolution, thermal bands, USGS/NASA',
    formats: ['.tif', '.tiff', '.tar.gz', '.zip']
  },
  {
    name: 'Sentinel Program',
    satellites: ['Sentinel-1A', 'Sentinel-1B', 'Sentinel-2A', 'Sentinel-2B', 'Sentinel-3A', 'Sentinel-3B'],
    icon: <Satellite className="w-5 h-5 text-green-600" />,
    color: 'green',
    description: '10-60m resolution, multispectral, ESA',
    formats: ['.zip', '.SAFE', '.jp2', '.tiff']
  },
  {
    name: 'GaoFen Series',
    satellites: ['GaoFen-1', 'GaoFen-2', 'GaoFen-3', 'GaoFen-4', 'GaoFen-6'],
    icon: <Satellite className="w-5 h-5 text-red-600" />,
    color: 'red',
    description: '0.8-16m resolution, high detail, CNSA',
    formats: ['.tiff', '.img', '.zip']
  },
  {
    name: 'SPOT Series',
    satellites: ['SPOT-6', 'SPOT-7'],
    icon: <Satellite className="w-5 h-5 text-purple-600" />,
    color: 'purple',
    description: '1.5-6m resolution, commercial, Airbus',
    formats: ['.tiff', '.jp2', '.zip']
  },
  {
    name: 'WorldView Series',
    satellites: ['WorldView-1', 'WorldView-2', 'WorldView-3', 'WorldView-4'],
    icon: <Globe className="w-5 h-5 text-indigo-600" />,
    color: 'indigo',
    description: '0.3-1.8m resolution, very high resolution, Maxar',
    formats: ['.tiff', '.ntf', '.zip']
  },
  {
    name: 'UAV/Drone',
    satellites: ['DJI Series', 'Fixed-wing UAV', 'Custom Drone'],
    icon: <Plane className="w-5 h-5 text-teal-600" />,
    color: 'teal',
    description: 'Ultra-high resolution, custom surveys',
    formats: ['.jpg', '.jpeg', '.tiff', '.raw', '.dng']
  },
  {
    name: 'MODIS',
    satellites: ['Terra MODIS', 'Aqua MODIS'],
    icon: <Database className="w-5 h-5 text-cyan-600" />,
    color: 'cyan',
    description: '250m-1km resolution, global coverage, NASA',
    formats: ['.hdf', '.tiff', '.nc']
  },
  {
    name: 'VIIRS',
    satellites: ['Suomi NPP', 'NOAA-20', 'NOAA-21'],
    icon: <Database className="w-5 h-5 text-pink-600" />,
    color: 'pink',
    description: '375m-750m resolution, day/night band, NOAA',
    formats: ['.h5', '.nc', '.tiff']
  }
];

const UploadTab: React.FC<UploadTabProps> = ({
  uploadedFiles = [],
  onFilesUploaded,
  onFileRemove
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedSatellite, setSelectedSatellite] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (onFilesUploaded) {
      onFilesUploaded(files);
    }
    
    // Upload files to the enhanced backend endpoint
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (selectedProvider) {
      formData.append('provider', selectedProvider);
    }
    if (selectedSatellite) {
      formData.append('satellite', selectedSatellite);
    }
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const response = await fetch(`${apiBaseUrl}/upload/satellite-imagery/`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Upload successful:', result);
        // You could update UI state here to show upload results
      } else {
        console.error('Upload failed:', result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const detectSatelliteType = (fileName: string): { provider: string; satellite: string } => {
    const name = fileName.toLowerCase();
    
    if (name.includes('lc08') || name.includes('landsat8')) return { provider: 'Landsat Program', satellite: 'Landsat 8' };
    if (name.includes('lc09') || name.includes('landsat9')) return { provider: 'Landsat Program', satellite: 'Landsat 9' };
    if (name.includes('s2a') || name.includes('s2b') || name.includes('sentinel2')) return { provider: 'Sentinel Program', satellite: 'Sentinel-2A' };
    if (name.includes('dji') || name.includes('drone') || name.includes('uav')) return { provider: 'UAV/Drone', satellite: 'DJI Series' };
    
    return { provider: 'Unknown', satellite: 'Unknown' };
  };

  const getProviderIcon = (provider: string) => {
    const providerData = SATELLITE_PROVIDERS.find(p => p.name === provider);
    return providerData?.icon || <Database className="w-4 h-4 text-gray-600" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectedProviderData = SATELLITE_PROVIDERS.find(p => p.name === selectedProvider);
  const acceptedFormats = selectedProviderData?.formats.join(',') || '.tiff,.tif,.zip,.jpg,.jpeg,.hdf,.h5,.nc,.jp2,.SAFE,.tar.gz,.img,.ntf,.raw,.dng';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Satellite & UAV Imagery</h2>
        <p className="text-sm text-gray-600">
          Upload satellite imagery, UAV data, and related files from various providers.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Provider Selection */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Provider/Platform
            </label>
            <select 
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedSatellite('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Auto-detect from filename</option>
              {SATELLITE_PROVIDERS.map((provider) => (
                <option key={provider.name} value={provider.name}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Satellite/Sensor
              </label>
              <select 
                value={selectedSatellite}
                onChange={(e) => setSelectedSatellite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select satellite...</option>
                {selectedProviderData?.satellites.map((satellite) => (
                  <option key={satellite} value={satellite}>
                    {satellite}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Supported Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SATELLITE_PROVIDERS.slice(0, 6).map((provider) => (
            <div 
              key={provider.name}
              className={cn(
                "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md text-sm",
                selectedProvider === provider.name 
                  ? `border-${provider.color}-500 bg-${provider.color}-50` 
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setSelectedProvider(provider.name)}
            >
              <div className="flex items-center space-x-2 mb-2">
                {provider.icon}
                <span className="font-medium text-sm">{provider.name}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{provider.description}</p>
              <div className="flex flex-wrap gap-1">
                {provider.formats.slice(0, 3).map((format) => (
                  <span key={format} className="text-xs bg-gray-100 text-gray-700 px-1 rounded">
                    {format}
                  </span>
                ))}
                {provider.formats.length > 3 && (
                  <span className="text-xs text-gray-500">+{provider.formats.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Supports: GeoTIFF, JPEG, HDF, NetCDF, SAFE, archives
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept={acceptedFormats}
          />
          {selectedProvider && (
            <p className="text-xs text-gray-500 mt-2">
              Optimized for {selectedProvider}: {selectedProviderData?.formats.join(', ')}
            </p>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {uploadedFiles.map((file) => {
                  const detection = detectSatelliteType(file.name);
                  return (
                    <div key={file.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <File className="w-6 h-6 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(file.status)}
                            <span className={cn(
                              "text-xs font-medium",
                              file.status === 'completed' && "text-green-600",
                              file.status === 'error' && "text-red-600",
                              file.status === 'processing' && "text-blue-600",
                              file.status === 'pending' && "text-gray-600"
                            )}>
                              {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getProviderIcon(detection.provider)}
                            <span className="text-xs text-gray-600">
                              {detection.satellite}
                            </span>
                          </div>
                          <button
                            onClick={() => onFileRemove && onFileRemove(file.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {file.status === 'error' && file.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                          Error: {file.errorMessage}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadTab;