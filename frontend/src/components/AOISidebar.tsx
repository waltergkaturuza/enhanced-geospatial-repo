import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GeospatialAPI, type AOI } from '@/lib/api.ts';
import { formatDate, formatArea, cn, getErrorMessage } from '@/lib/utils';
import { 
  Upload, 
  Search, 
  MapPin, 
  Trash2, 
  Eye,
  Loader,
  AlertCircle,
  Calendar,
  Ruler,
  Plus,
  Minus,
  Target,
  Globe
} from 'lucide-react';
import type { MapViewState } from './MapComponent';
import { ZIMBABWE_PROVINCES, ZIMBABWE_DISTRICTS, ZIMBABWE_COORDINATES } from '@/constants';

interface AOISidebarProps {
  selectedAOI: AOI | null;
  onAOISelect: (aoi: AOI | null) => void;
  onMapViewChange: (viewState: MapViewState) => void;
}

const AOISidebar: React.FC<AOISidebarProps> = ({
  selectedAOI,
  onAOISelect,
  onMapViewChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [geocodingMethod, setGeocodingMethod] = useState('Feature (GNIS)');
  const [selectedProvince, setSelectedProvince] = useState('All Zimbabwe');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [coordinates, setCoordinates] = useState({
    north: '',
    south: '',
    east: '',
    west: '',
    centerLat: '',
    centerLon: ''
  });
  const [pathRow, setPathRow] = useState({ path: '', row: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch AOIs
  const { data: aoisResponse, isLoading, error } = useQuery({
    queryKey: ['aois'],
    queryFn: async () => {
      try {
        return await GeospatialAPI.getAOIs();
      } catch (error) {
        console.error('Failed to fetch AOIs:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Ensure aois is always an array
  const aois: AOI[] = Array.isArray(aoisResponse) ? aoisResponse : [];

  // Delete AOI mutation
  const deleteAOIMutation = useMutation({
    mutationFn: GeospatialAPI.deleteAOI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aois'] });
      if (selectedAOI) {
        onAOISelect(null);
      }
    },
  });

  // Filter AOIs based on search term
  const filteredAOIs = aois.filter(aoi => {
    const name = aoi.name || '';
    const description = aoi.description || '';
    const searchLower = searchTerm.toLowerCase();
    
    return name.toLowerCase().includes(searchLower) ||
           description.toLowerCase().includes(searchLower);
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await GeospatialAPI.uploadGeometry(formData);
      
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['aois'] });
        
        // Select and zoom to the first created AOI if multiple were created
        if (result.created_aois && result.created_aois.length > 0) {
          const newAOI = result.created_aois[0];
          onAOISelect(newAOI);
          // Also trigger zoom to the new AOI
          zoomToAOI(newAOI);
        } else if (result.aoi) {
          onAOISelect(result.aoi);
          // Also trigger zoom to the new AOI
          zoomToAOI(result.aoi);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Zoom to AOI
  const zoomToAOI = (aoi: AOI) => {
    if (aoi.bounds && aoi.bounds.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = aoi.bounds;
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      
      // Calculate appropriate zoom level based on bounds
      const latDiff = maxLat - minLat;
      const lonDiff = maxLon - minLon;
      const maxDiff = Math.max(latDiff, lonDiff);
      
      let zoom = 10;
      if (maxDiff > 10) zoom = 4;
      else if (maxDiff > 5) zoom = 5;
      else if (maxDiff > 2) zoom = 6;
      else if (maxDiff > 1) zoom = 7;
      else if (maxDiff > 0.5) zoom = 8;
      else if (maxDiff > 0.1) zoom = 9;
      
      onMapViewChange({
        center: [centerLat, centerLon],
        zoom,
      });
    }
  };

  // Handle coordinate input
  const handleCoordinateChange = (field: string, value: string) => {
    setCoordinates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear coordinates
  const clearCoordinates = () => {
    setCoordinates({
      north: '',
      south: '',
      east: '',
      west: '',
      centerLat: '',
      centerLon: ''
    });
  };

  // Use coordinates to set map view
  const useCoordinates = () => {
    const { north, south, east, west, centerLat, centerLon } = coordinates;
    
    if (centerLat && centerLon) {
      // Use center coordinates
      const lat = parseFloat(centerLat);
      const lon = parseFloat(centerLon);
      if (!isNaN(lat) && !isNaN(lon)) {
        onMapViewChange({
          center: [lat, lon],
          zoom: 10
        });
      }
    } else if (north && south && east && west) {
      // Use bounding box
      const n = parseFloat(north);
      const s = parseFloat(south);
      const e = parseFloat(east);
      const w = parseFloat(west);
      
      if (!isNaN(n) && !isNaN(s) && !isNaN(e) && !isNaN(w)) {
        const centerLat = (n + s) / 2;
        const centerLon = (e + w) / 2;
        
        // Calculate appropriate zoom level
        const latDiff = Math.abs(n - s);
        const lonDiff = Math.abs(e - w);
        const maxDiff = Math.max(latDiff, lonDiff);
        
        let zoom = 10;
        if (maxDiff > 10) zoom = 4;
        else if (maxDiff > 5) zoom = 5;
        else if (maxDiff > 2) zoom = 6;
        else if (maxDiff > 1) zoom = 7;
        else if (maxDiff > 0.5) zoom = 8;
        else if (maxDiff > 0.1) zoom = 9;
        
        onMapViewChange({
          center: [centerLat, centerLon],
          zoom
        });
      }
    }
  };

  // Handle province change
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedDistrict('');
    
    // Update map view based on province
    const provinceCoords = ZIMBABWE_COORDINATES[province];
    if (provinceCoords) {
      onMapViewChange(provinceCoords);
    }
  };

  // Handle district change
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    // In a real implementation, you'd have district coordinates
    // For now, just keep the province view
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 text-sm">{getErrorMessage(error)}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-200 border-b border-gray-300 px-3 py-2">
        <h2 className="text-xs font-semibold text-gray-700">
          1. Enter Search Criteria
        </h2>
        <p className="text-xs text-gray-600 mt-1 leading-tight">
          To narrow your search area, type in an address or place name, 
          enter coordinates, upload files, or click the map to define your search area.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {/* Geocoding Method Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Select a Geocoding Method
            </label>
            <select 
              value={geocodingMethod}
              onChange={(e) => setGeocodingMethod(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option>Feature (GNIS)</option>
              <option>Coordinates</option>
              <option>Path/Row</option>
              <option>Import Shapefile</option>
              <option>Import KML</option>
              <option>Import GPX</option>
            </select>
          </div>

          {/* Feature/Location Search */}
          {geocodingMethod === 'Feature (GNIS)' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Province/Region Name
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                >
                  {ZIMBABWE_PROVINCES.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              {selectedProvince !== 'All Zimbabwe' && ZIMBABWE_DISTRICTS[selectedProvince as keyof typeof ZIMBABWE_DISTRICTS] && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Districts</option>
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
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  placeholder="Search Zimbabwe features..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Coordinates Input */}
          {geocodingMethod === 'Coordinates' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">North (Lat)</label>
                  <input
                    type="number"
                    step="any"
                    value={coordinates.north}
                    onChange={(e) => handleCoordinateChange('north', e.target.value)}
                    placeholder="-15.0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">South (Lat)</label>
                  <input
                    type="number"
                    step="any"
                    value={coordinates.south}
                    onChange={(e) => handleCoordinateChange('south', e.target.value)}
                    placeholder="-22.5"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">West (Lon)</label>
                  <input
                    type="number"
                    step="any"
                    value={coordinates.west}
                    onChange={(e) => handleCoordinateChange('west', e.target.value)}
                    placeholder="25.0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">East (Lon)</label>
                  <input
                    type="number"
                    step="any"
                    value={coordinates.east}
                    onChange={(e) => handleCoordinateChange('east', e.target.value)}
                    placeholder="33.0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">Or use center point</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Center Lat</label>
                    <input
                      type="number"
                      step="any"
                      value={coordinates.centerLat}
                      onChange={(e) => handleCoordinateChange('centerLat', e.target.value)}
                      placeholder="-19.0154"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Center Lon</label>
                    <input
                      type="number"
                      step="any"
                      value={coordinates.centerLon}
                      onChange={(e) => handleCoordinateChange('centerLon', e.target.value)}
                      placeholder="29.1549"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Path/Row Input */}
          {geocodingMethod === 'Path/Row' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Path</label>
                  <input
                    type="number"
                    value={pathRow.path}
                    onChange={(e) => setPathRow(prev => ({ ...prev, path: e.target.value }))}
                    placeholder="168"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Row</label>
                  <input
                    type="number"
                    value={pathRow.row}
                    onChange={(e) => setPathRow(prev => ({ ...prev, row: e.target.value }))}
                    placeholder="074"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Enter Landsat WRS-2 Path/Row values for Zimbabwe (typical ranges: Path 168-172, Row 070-078)
              </p>
            </div>
          )}

          {/* File Upload Section */}
          {(geocodingMethod.includes('Import') || geocodingMethod === 'Feature (GNIS)') && (
            <div className="border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-700">Area of Interest</span>
                <div className="flex space-x-1">
                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Circle
                  </button>
                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Predefined
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 p-3 rounded text-center mb-3">
                <MapPin className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-2">
                  {(coordinates.north || coordinates.centerLat) ? 'Coordinates defined' : 'No coordinates selected'}
                </p>
                <div className="flex justify-center space-x-2">
                  <button 
                    onClick={useCoordinates}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Target className="h-3 w-3 inline mr-1" />
                    Use Map
                  </button>
                  <button 
                    onClick={() => setGeocodingMethod('Coordinates')}
                    className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    Add Coordinate
                  </button>
                  <button 
                    onClick={clearCoordinates}
                    className="px-2 py-1 text-xs bg-red-300 text-red-700 rounded hover:bg-red-400"
                  >
                    <Minus className="h-3 w-3 inline mr-1" />
                    Clear
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-t pt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".zip,.kml,.kmz,.gpx,.geojson,.json,.shp"
                  className="hidden"
                  disabled={uploading}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50">
                    <Globe className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supports: Shapefile (ZIP), KML/KMZ, GPX, GeoJSON
                </p>
              </div>
            </div>
          )}

          {/* Existing AOI Search */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Existing Areas</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {uploading ? 'Uploading...' : 'Upload New'}
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Rest of existing AOI list code */}
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-gray-600">Loading areas...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">{getErrorMessage(error)}</p>
              </div>
            ) : filteredAOIs.length === 0 ? (
              <div className="p-4 text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  {searchTerm ? 'No AOIs match your search' : 'No AOIs created yet'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Draw on the map or upload a file to create one
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAOIs.map((aoi) => (
                  <div
                    key={aoi.id}
                    className={cn(
                      'p-3 cursor-pointer transition-all hover:shadow-md border rounded',
                      selectedAOI?.id === aoi.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                    )}
                    onClick={() => onAOISelect(aoi)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate text-sm">{aoi.name}</h3>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            zoomToAOI(aoi);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Zoom to AOI"
                        >
                          <Eye className="w-3 h-3 text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this AOI?')) {
                              deleteAOIMutation.mutate(aoi.id);
                            }
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Delete AOI"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {aoi.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(aoi.created_at)}
                      </div>
                      <div className="flex items-center">
                        <Ruler className="w-3 h-3 mr-1" />
                        {formatArea(aoi.area_km2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AOISidebar;
