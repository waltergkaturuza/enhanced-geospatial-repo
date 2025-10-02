import React from 'react';
import { Target, MousePointer, Upload, MapPin, Eye, RotateCcw, File } from 'lucide-react';
import { 
  ZIMBABWE_PROVINCES, 
  ZIMBABWE_DISTRICTS, 
  COORDINATE_SYSTEMS 
} from '../constants';

interface SearchTabProps {
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  searchCriteria: any;
  setSearchCriteria: (criteria: any) => void;
  selectedCoordinates: string;
  setSelectedCoordinates: (coords: string) => void;
  areaSelectionMode: 'none' | 'coordinates' | 'drawing' | 'upload';
  setAreaSelectionMode: (mode: 'none' | 'coordinates' | 'drawing' | 'upload') => void;
  selectedCoordinateSystem: string;
  setSelectedCoordinateSystem: (system: string) => void;
  coordinateInputs: any;
  setCoordinateInputs: (inputs: any) => void;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
  isProcessingFiles: boolean;
  areasOfInterest: any[];
  setAreasOfInterest: React.Dispatch<React.SetStateAction<any[]>>;
  activeDrawingTool: string | null;
  setActiveDrawingTool: (tool: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  processUploadedFiles: () => Promise<void>;
}

const DRAWING_TOOLS = [
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="14" rx="2" ry="2"></rect>
      </svg>
    ),
    description: 'Draw rectangular area'
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    ),
    description: 'Draw circular area'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"></path>
      </svg>
    ),
    description: 'Draw custom polygon'
  },
  {
    id: 'freehand',
    name: 'Freehand',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
      </svg>
    ),
    description: 'Draw freehand shape'
  }
];

const SUPPORTED_FILE_TYPES = [
  {
    id: 'geojson',
    name: 'GeoJSON',
    extensions: ['.geojson', '.json'],
    icon: '🗺️',
    description: 'Geographic JSON format'
  },
  {
    id: 'zip',
    name: 'ZIP Archive',
    extensions: ['.zip'],
    icon: '📦',
    description: 'Compressed archive (recommended for shapefiles)'
  },
  {
    id: 'tar',
    name: 'TAR Archive',
    extensions: ['.tar', '.tar.gz', '.tar.bz2', '.tar.xz'],
    icon: '📋',
    description: 'TAR compressed archive'
  },
  {
    id: 'rar',
    name: 'RAR Archive',
    extensions: ['.rar'],
    icon: '📚',
    description: 'RAR compressed archive'
  },
  {
    id: 'sevenz',
    name: '7-Zip Archive',
    extensions: ['.7z'],
    icon: '🗂️',
    description: '7-Zip compressed archive'
  }
];

const SearchTab: React.FC<SearchTabProps> = ({
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  searchCriteria,
  setSearchCriteria,
  selectedCoordinates,
  setSelectedCoordinates,
  areaSelectionMode,
  setAreaSelectionMode,
  selectedCoordinateSystem,
  setSelectedCoordinateSystem,
  coordinateInputs,
  setCoordinateInputs,
  uploadedFiles,
  setUploadedFiles,
  uploadError,
  setUploadError,
  isProcessingFiles,
  areasOfInterest,
  setAreasOfInterest,
  activeDrawingTool,
  setActiveDrawingTool,
  fileInputRef,
  processUploadedFiles
}) => {
  
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedDistrict(''); // Reset district when province changes
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
  };

  return (
    <div>
      <div className="bg-gray-200 border-b border-gray-300 px-3 py-2">
        <h2 className="text-xs font-semibold text-gray-700">
          1. Enter Search Criteria
        </h2>
        <p className="text-xs text-gray-600 mt-1 leading-tight">
          To narrow your search area, type in an address or place name, 
          enter coordinates or click the map to define your search area.
        </p>
      </div>

      {/* Location Search */}
      <div className="p-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select a Geocoding Method
          </label>
          <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500">
            <option>Feature (GNIS)</option>
            <option>Coordinates</option>
            <option>Path/Row</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Province/Region Name
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            {ZIMBABWE_PROVINCES.map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        {selectedProvince !== 'All Zimbabwe' && ZIMBABWE_DISTRICTS[selectedProvince as keyof typeof ZIMBABWE_DISTRICTS]?.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              District (Optional)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Districts in {selectedProvince}</option>
              {ZIMBABWE_DISTRICTS[selectedProvince as keyof typeof ZIMBABWE_DISTRICTS].map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Feature Name (use % as wildcard)
          </label>
          <input
            type="text"
            placeholder="Search Zimbabwe features..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Enhanced Area Selection */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">🗺️ Advanced Area Selection</h3>
            <div className="flex space-x-1">
              <button 
                onClick={() => setAreaSelectionMode('coordinates')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  areaSelectionMode === 'coordinates' ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title="Enter coordinates manually"
              >
                <Target className="h-3 w-3 inline mr-1" />
                Coordinates
              </button>
              <button 
                onClick={() => setAreaSelectionMode('drawing')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  areaSelectionMode === 'drawing' ? 'bg-green-200 text-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title="Draw on map"
              >
                <MousePointer className="h-3 w-3 inline mr-1" />
                Draw
              </button>
              <button 
                onClick={() => setAreaSelectionMode('upload')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  areaSelectionMode === 'upload' ? 'bg-purple-200 text-purple-800' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                title="Upload file"
              >
                <Upload className="h-3 w-3 inline mr-1" />
                Upload
              </button>
            </div>
          </div>

          {/* Coordinate System Selection */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              📐 Coordinate Reference System
            </label>
            <select
              value={selectedCoordinateSystem}
              onChange={(e) => {
                setSelectedCoordinateSystem(e.target.value);
                setCoordinateInputs({
                  latitude: '', longitude: '', latitudeMax: '', longitudeMax: '',
                  easting: '', northing: '', eastingMax: '', northingMax: ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
            >
              {COORDINATE_SYSTEMS.map(cs => (
                <option key={cs.id} value={cs.id}>
                  {cs.name} ({cs.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {COORDINATE_SYSTEMS.find(cs => cs.id === selectedCoordinateSystem)?.description}
            </p>
          </div>

          {/* Coordinate Input Mode */}
          {areaSelectionMode === 'coordinates' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Manual Coordinate Entry
              </h4>
              
              {COORDINATE_SYSTEMS.find(cs => cs.id === selectedCoordinateSystem)?.type === 'geographic' ? (
                // Geographic coordinates (Lat/Lon)
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        🧭 Southwest Corner
                      </label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Latitude (South)"
                          value={coordinateInputs.latitude}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, latitude: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Longitude (West)"
                          value={coordinateInputs.longitude}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, longitude: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        🧭 Northeast Corner
                      </label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Latitude (North)"
                          value={coordinateInputs.latitudeMax}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, latitudeMax: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Longitude (East)"
                          value={coordinateInputs.longitudeMax}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, longitudeMax: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <p><strong>Example for Zimbabwe:</strong></p>
                    <p>Southwest: -22.4174, 25.2373 | Northeast: -15.6097, 33.0560</p>
                  </div>
                </div>
              ) : (
                // UTM/Projected coordinates (Easting/Northing)
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        📍 Southwest Corner
                      </label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Easting (m)"
                          value={coordinateInputs.easting}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, easting: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Northing (m)"
                          value={coordinateInputs.northing}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, northing: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        📍 Northeast Corner
                      </label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Easting (m)"
                          value={coordinateInputs.eastingMax}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, eastingMax: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Northing (m)"
                          value={coordinateInputs.northingMax}
                          onChange={(e) => setCoordinateInputs((prev: any) => ({ ...prev, northingMax: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <p><strong>UTM Zone {COORDINATE_SYSTEMS.find(cs => cs.id === selectedCoordinateSystem)?.zone}:</strong></p>
                    <p>Zimbabwe spans UTM zones 35S and 36S</p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2 mt-3">
                <button 
                  onClick={() => {
                    // Apply coordinates logic here
                    console.log('Applying coordinates:', coordinateInputs);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply Coordinates
                </button>
                <button 
                  onClick={() => setCoordinateInputs({
                    latitude: '', longitude: '', latitudeMax: '', longitudeMax: '',
                    easting: '', northing: '', eastingMax: '', northingMax: ''
                  })}
                  className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Drawing Tools Mode */}
          {areaSelectionMode === 'drawing' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                <MousePointer className="h-4 w-4 mr-2" />
                Interactive Drawing Tools
              </h4>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                {DRAWING_TOOLS.map(tool => {
                  const IconComponent = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveDrawingTool(activeDrawingTool === tool.id ? null : tool.id)}
                      className={`p-3 text-left border rounded transition-colors ${
                        activeDrawingTool === tool.id 
                          ? 'border-green-500 bg-green-100 text-green-800' 
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                      title={tool.description}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-xs font-medium">{tool.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                    </button>
                  );
                })}
              </div>
              
              {activeDrawingTool && (
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-green-700 mb-2">
                    <strong>🎯 {DRAWING_TOOLS.find(t => t.id === activeDrawingTool)?.name} Tool Active</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    {activeDrawingTool === 'rectangle' 
                      ? 'Click and drag from one corner to the opposite corner to create a rectangle.'
                      : activeDrawingTool === 'circle'
                      ? 'Click center point, then drag to set radius.'
                      : 'Click on the map to add points. Double-click to finish the shape.'
                    }
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      onClick={() => setActiveDrawingTool(null)}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel Drawing
                    </button>
                    <button 
                      onClick={() => {
                        // Clear all drawn shapes
                        setAreasOfInterest([]);
                      }}
                      className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300"
                    >
                      Clear All Shapes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Mode */}
          {areaSelectionMode === 'upload' && (
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
              <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload Spatial Files
              </h4>
              
              {/* File Type Support */}
              <div className="mb-3">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Supported File Types:</h5>
                <div className="grid grid-cols-1 gap-1">
                  {SUPPORTED_FILE_TYPES.map(fileType => (
                    <div key={fileType.id} className="flex items-center space-x-2 text-xs">
                      <span className="text-base">{fileType.icon}</span>
                      <span className="font-medium text-gray-700">{fileType.name}</span>
                      <span className="text-gray-500">({fileType.extensions.join(', ')})</span>
                      {(fileType.id === 'rar' || fileType.id === 'sevenz') && (
                        <span className="text-amber-600 text-xs">⚠️ Requires system tools</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Additional format notes */}
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> RAR files require the 'unrar' utility to be installed on the server. 
                    7Z files require the 'py7zr' Python package. ZIP and TAR formats are recommended for maximum compatibility.
                  </p>
                </div>
              </div>
              
              {/* File Upload Area */}
              <div 
                className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-25 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-purple-500', 'bg-purple-100');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-purple-500', 'bg-purple-100');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-purple-500', 'bg-purple-100');
                  const files = Array.from(e.dataTransfer.files);
                  setUploadedFiles(prev => [...prev, ...files]);
                  setUploadError(null); // Clear any previous errors
                }}
              >
                <File className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-purple-700 font-medium">Click to upload or drag & drop files</p>
                <p className="text-xs text-purple-600 mt-1">
                  GeoJSON (.geojson), compressed archives (.zip, .tar, .rar, .7z)
                </p>
                <p className="text-xs text-purple-500 mt-1 italic">
                  For shapefiles: Package all files (.shp, .dbf, .prj, .shx) in a compressed archive
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".zip,.tar,.gz,.bz2,.xz,.rar,.7z,.geojson,.json"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setUploadedFiles(prev => [...prev, ...files]);
                    setUploadError(null); // Clear any previous errors
                  }}
                  className="hidden"
                />
              </div>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Uploaded Files:</h5>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          <File className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button 
                      onClick={processUploadedFiles}
                      disabled={isProcessingFiles}
                      className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                        isProcessingFiles 
                          ? 'bg-purple-400 text-white cursor-not-allowed' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isProcessingFiles && (
                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>{isProcessingFiles ? 'Processing...' : 'Process Files'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setUploadedFiles([]);
                        setUploadError(null); // Clear error when clearing files
                      }}
                      className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
              
              {/* Upload Error Display */}
              {uploadError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <h5 className="text-xs font-medium text-red-800 mb-1 flex items-center">
                    ⚠️ Upload Error
                  </h5>
                  <div className="text-xs text-red-700 whitespace-pre-wrap space-y-1">
                    {uploadError.split('\n').map((line, index) => {
                      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                        return (
                          <div key={index} className="ml-2 flex items-start">
                            <span className="mr-2 text-red-600">•</span>
                            <span>{line.replace(/^[•\-]\s*/, '')}</span>
                          </div>
                        );
                      } else if (line.trim().startsWith('Alternative:') || line.trim().startsWith('Note:')) {
                        return (
                          <div key={index} className="mt-2 p-2 bg-red-100 rounded text-red-800 font-medium">
                            {line}
                          </div>
                        );
                      } else {
                        return <div key={index}>{line}</div>;
                      }
                    })}
                  </div>
                  <button
                    onClick={() => setUploadError(null)}
                    className="mt-2 px-2 py-1 text-xs bg-red-200 text-red-800 rounded hover:bg-red-300"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Areas of Interest Summary */}
          {areasOfInterest.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                🎯 Selected Areas of Interest ({areasOfInterest.length})
              </h4>
              <div className="space-y-2">
                {areasOfInterest.map((aoi, index) => (
                  <div key={aoi.id} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-700">{aoi.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          aoi.type === 'rectangle' ? 'bg-blue-100 text-blue-700' :
                          aoi.type === 'circle' ? 'bg-green-100 text-green-700' :
                          aoi.type === 'polygon' ? 'bg-purple-100 text-purple-700' :
                          aoi.type === 'file' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {aoi.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Area: {aoi.area.toFixed(2)} km² | 
                        CRS: {COORDINATE_SYSTEMS.find(cs => cs.id === aoi.coordinateSystem)?.code}
                      </p>
                    </div>
                    <button
                      onClick={() => setAreasOfInterest(prev => prev.filter((_, i) => i !== index))}
                      className="text-xs text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-2 border-t border-yellow-200">
                <div className="grid grid-cols-2 gap-2 text-xs text-yellow-700">
                  <div>
                    <span className="font-medium">Total Coverage:</span>
                    <span className="ml-1">{areasOfInterest.reduce((sum, aoi) => sum + aoi.area, 0).toFixed(2)} km²</span>
                  </div>
                  <div>
                    <span className="font-medium">Coordinate System:</span>
                    <span className="ml-1">{COORDINATE_SYSTEMS.find(cs => cs.id === selectedCoordinateSystem)?.code}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selection Summary */}
          {(selectedCoordinates || areasOfInterest.length > 0) && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <MapPin className="h-4 w-4 text-gray-600 inline mr-2" />
                  <span className="text-xs font-medium text-gray-700">
                    {areasOfInterest.length > 0 ? 
                      `${areasOfInterest.length} area(s) selected` : 
                      'Area defined'
                    }
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      // Preview on map
                      console.log('Showing on map:', areasOfInterest);
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Eye className="h-3 w-3 inline mr-1" />
                    Preview
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedCoordinates('');
                      setAreasOfInterest([]);
                      setAreaSelectionMode('none');
                      setActiveDrawingTool(null);
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <RotateCcw className="h-3 w-3 inline mr-1" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-700">Date Range</span>
            <div className="flex space-x-1">
              <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                Cloud Cover
              </button>
              <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                Result Options
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Search from:</label>
              <input
                type="date"
                value={searchCriteria.dateRange.start}
                onChange={(e) => setSearchCriteria((prev: any) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">to:</label>
              <input
                type="date"
                value={searchCriteria.dateRange.end}
                onChange={(e) => setSearchCriteria((prev: any) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Search months:</label>
              <select className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500">
                <option>(all)</option>
                <option>January</option>
                <option>February</option>
                <option>March</option>
                <option>April</option>
                <option>May</option>
                <option>June</option>
                <option>July</option>
                <option>August</option>
                <option>September</option>
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTab;
