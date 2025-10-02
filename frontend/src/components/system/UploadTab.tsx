import React, { useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertTriangle, Clock, Satellite, Database } from 'lucide-react';
import { cn } from '../../lib/utils';
//import { SATELLITE_PLATFORMS, SUPPORTED_SATELLITE_FORMATS } from '../../constants/system';
import type { UploadedFile } from '../../types/system';

interface UploadTabProps {
  uploadedFiles: UploadedFile[];
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  addFiles: (files: File[]) => void;
  removeFile: (fileId: string) => void;
}

const UploadTab: React.FC<UploadTabProps> = ({
  uploadedFiles,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  addFiles,
  removeFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
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

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'processing':
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const detectSatelliteType = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.includes('lc08') || name.includes('landsat8')) return 'Landsat 8';
    if (name.includes('lc09') || name.includes('landsat9')) return 'Landsat 9';
    if (name.includes('le07') || name.includes('landsat7')) return 'Landsat 7';
    if (name.includes('lt05') || name.includes('landsat5')) return 'Landsat 5';
    if (name.includes('s2a') || name.includes('s2b') || name.includes('sentinel2')) return 'Sentinel-2';
    if (name.includes('s1a') || name.includes('s1b') || name.includes('sentinel1')) return 'Sentinel-1';
    if (name.includes('gf1') || name.includes('gaofen1')) return 'GaoFen-1';
    if (name.includes('gf2') || name.includes('gaofen2')) return 'GaoFen-2';
    if (name.includes('gf3') || name.includes('gaofen3')) return 'GaoFen-3';
    return 'Unknown';
  };

  const getSatelliteIcon = (satelliteType: string) => {
    if (satelliteType.includes('Landsat')) return <Satellite className="w-4 h-4 text-blue-600" />;
    if (satelliteType.includes('Sentinel')) return <Satellite className="w-4 h-4 text-green-600" />;
    if (satelliteType.includes('GaoFen')) return <Satellite className="w-4 h-4 text-red-600" />;
    return <Database className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Upload Area */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Satellite Data</h2>
        <p className="text-sm text-gray-600 mb-6">
          Upload satellite imagery, metadata, and related files. Supports Landsat 5/7/8/9, Sentinel-1/2, and GaoFen series.
        </p>
        
        {/* Supported Satellites Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Satellite className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Landsat Program</span>
            </div>
            <p className="text-sm text-blue-700">Landsat 5, 7, 8, 9 - USGS/NASA</p>
            <p className="text-xs text-blue-600 mt-1">30m resolution, thermal bands</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Satellite className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Sentinel Program</span>
            </div>
            <p className="text-sm text-green-700">Sentinel-1, Sentinel-2 - ESA</p>
            <p className="text-xs text-green-600 mt-1">10-60m resolution, multispectral</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Satellite className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">GaoFen Series</span>
            </div>
            <p className="text-sm text-red-700">GaoFen-1, 2, 3 - CNSA</p>
            <p className="text-xs text-red-600 mt-1">0.8-16m resolution, high detail</p>
          </div>
        </div>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-gray-600 mb-4">
            Supports: GeoTIFF, Shapefile (ZIP), JSON, metadata files
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept=".tiff,.tif,.zip,.json,.txt,.xml"
          />
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <span className={cn(
                        "text-sm font-medium",
                        file.status === 'completed' && "text-green-600",
                        file.status === 'error' && "text-red-600",
                        file.status === 'processing' && "text-blue-600",
                        file.status === 'pending' && "text-gray-600"
                      )}>
                        {getStatusText(file.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getSatelliteIcon(detectSatelliteType(file.name))}
                      <span className="text-sm text-gray-500">
                        {detectSatelliteType(file.name)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadTab;
