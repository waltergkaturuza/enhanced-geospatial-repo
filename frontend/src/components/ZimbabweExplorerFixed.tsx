import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  MapPin, 
  Download, 
  Settings,
  Info,
  Layers,
  Cloud,
  Satellite,
  Eye,
  Plus
} from 'lucide-react';
import MapComponent from './MapComponent';
import { GeospatialAPI } from '@/lib/api';

interface SearchCriteria {
  location: string;
  coordinates?: [number, number, number, number]; // bbox
  dateRange: {
    start: string;
    end: string;
  };
  datasets: string[];
  cloudCover: number;
  resultsLimit: number;
}

interface ZimbabweDataset {
  id: string;
  name: string;
  description: string;
  provider: string;
  resolution: string;
  bands: string[];
  temporalCoverage: string;
  spatialCoverage: string;
  enabled: boolean;
}

const ZIMBABWE_DATASETS: ZimbabweDataset[] = [
  {
    id: 'sentinel2_zimbabwe',
    name: 'Sentinel-2 MSI Zimbabwe',
    description: 'High-resolution optical imagery for Zimbabwe',
    provider: 'ESA Copernicus',
    resolution: '10-60m',
    bands: ['B02', 'B03', 'B04', 'B08', 'B11', 'B12'],
    temporalCoverage: '2015-present',
    spatialCoverage: 'Zimbabwe',
    enabled: true
  },
  {
    id: 'landsat8_zimbabwe',
    name: 'Landsat 8 OLI Zimbabwe',
    description: 'Medium-resolution optical and thermal imagery',
    provider: 'USGS',
    resolution: '15-100m',
    bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'],
    temporalCoverage: '2013-present',
    spatialCoverage: 'Zimbabwe',
    enabled: true
  },
  {
    id: 'sentinel1_zimbabwe',
    name: 'Sentinel-1 SAR Zimbabwe',
    description: 'All-weather radar imagery for Zimbabwe',
    provider: 'ESA Copernicus',
    resolution: '5-40m',
    bands: ['VV', 'VH'],
    temporalCoverage: '2014-present',
    spatialCoverage: 'Zimbabwe',
    enabled: true
  },
  {
    id: 'modis_zimbabwe',
    name: 'MODIS Zimbabwe',
    description: 'Daily global imagery for vegetation monitoring',
    provider: 'NASA',
    resolution: '250-1000m',
    bands: ['NDVI', 'EVI', 'Surface Temperature'],
    temporalCoverage: '2000-present',
    spatialCoverage: 'Zimbabwe',
    enabled: true
  }
];

const ZIMBABWE_PROVINCES = [
  'All Zimbabwe',
  'Harare',
  'Bulawayo', 
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
  'Masvingo'
];

const ZimbabweExplorer: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: 'All Zimbabwe',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    datasets: ['sentinel2_zimbabwe'],
    cloudCover: 30,
    resultsLimit: 100
  });

  const [selectedDatasets, setSelectedDatasets] = useState<string[]>(['sentinel2_zimbabwe']);

  // Search for imagery
  const { data: imagery, isLoading, refetch } = useQuery({
    queryKey: ['zimbabwe-imagery', searchCriteria],
    queryFn: async () => {
      if (selectedDatasets.length === 0) return { results: [], count: 0 };
      
      return GeospatialAPI.searchImageryByLocation({
        location: searchCriteria.location,
        start_date: searchCriteria.dateRange.start,
        end_date: searchCriteria.dateRange.end,
        providers: selectedDatasets,
        max_cloud_cover: searchCriteria.cloudCover,
        max_results: searchCriteria.resultsLimit
      });
    },
    enabled: false
  });

  const handleSearch = () => {
    refetch();
  };

  const handleClearSearch = () => {
    setSearchCriteria({
      location: 'All Zimbabwe',
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      datasets: ['sentinel2_zimbabwe'],
      cloudCover: 30,
      resultsLimit: 100
    });
    setSelectedDatasets(['sentinel2_zimbabwe']);
  };

  const toggleDataset = (datasetId: string) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId) 
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header - EarthExplorer Style */}
      <header className="bg-gray-800 text-white">
        <div className="px-6 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">ZimbabweExplorer</h1>
            <div className="flex items-center space-x-4 text-sm">
              <a href="#" className="text-gray-300 hover:text-white">Help</a>
              <a href="#" className="text-gray-300 hover:text-white">Feedback</a>
              <a href="#" className="text-gray-300 hover:text-white">Login</a>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-6 py-2">
          <nav className="flex space-x-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-t text-sm font-medium">
              Search Criteria
            </button>
            <button className="text-gray-300 hover:text-white px-4 py-2 rounded-t text-sm font-medium">
              Data Sets
            </button>
            <button className="text-gray-300 hover:text-white px-4 py-2 rounded-t text-sm font-medium">
              Additional Criteria
            </button>
            <button className="text-gray-300 hover:text-white px-4 py-2 rounded-t text-sm font-medium">
              Results
            </button>
            <div className="ml-auto flex items-center space-x-2">
              <span className="text-gray-300 text-sm">
                Search Criteria Summary (Show)
              </span>
              <button 
                onClick={handleClearSearch}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700"
              >
                Clear Search Criteria
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Search Criteria */}
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
          {/* Section Title */}
          <div className="bg-gray-200 border-b border-gray-300 px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700">
              1. Enter Search Criteria
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              To narrow your search area, type in an address or place name, 
              enter coordinates or click the map to define your search area.
            </p>
          </div>

          {/* Location Search */}
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Select a Geocoding Method
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500">
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
                value={searchCriteria.location}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                {ZIMBABWE_PROVINCES.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

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

            {/* Map Drawing Tools */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-700">Polygon</span>
                <div className="flex space-x-1">
                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Circle
                  </button>
                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Predefined Area
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-300 p-3 rounded text-center">
                <MapPin className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">No coordinates selected</p>
                <div className="flex justify-center space-x-2 mt-3">
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    Use Map
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                    Add Coordinate
                  </button>
                  <button className="px-3 py-1 text-xs bg-red-300 text-red-700 rounded hover:bg-red-400">
                    Clear Coordinates
                  </button>
                </div>
              </div>
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
                    onChange={(e) => setSearchCriteria(prev => ({
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
                    onChange={(e) => setSearchCriteria(prev => ({
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

          {/* Data Sets Section */}
          <div className="border-t border-gray-300">
            <div className="bg-gray-200 border-b border-gray-300 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Data Sets ▶</span>
                <div className="flex space-x-1">
                  <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    Additional Criteria ▶
                  </button>
                  <button className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                    Results ▶
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 p-3 rounded bg-white">
                {ZIMBABWE_DATASETS.map(dataset => (
                  <div key={dataset.id} className="flex items-start space-x-2 p-2 border-b border-gray-100 last:border-b-0">
                    <input
                      type="checkbox"
                      id={dataset.id}
                      checked={selectedDatasets.includes(dataset.id)}
                      onChange={() => toggleDataset(dataset.id)}
                      className="mt-1 h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={dataset.id} className="text-xs font-medium text-gray-700 cursor-pointer block">
                        {dataset.name}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">{dataset.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">{dataset.provider}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-1 rounded">{dataset.resolution}</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">{dataset.temporalCoverage}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cloud Cover and Options */}
          <div className="border-t border-gray-300 p-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Maximum Cloud Cover: {searchCriteria.cloudCover}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={searchCriteria.cloudCover}
                  onChange={(e) => setSearchCriteria(prev => ({ ...prev, cloudCover: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Results Limit
                </label>
                <select
                  value={searchCriteria.resultsLimit}
                  onChange={(e) => setSearchCriteria(prev => ({ ...prev, resultsLimit: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value={50}>50 records</option>
                  <option value={100}>100 records</option>
                  <option value={250}>250 records</option>
                  <option value={500}>500 records</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Buttons */}
          <div className="border-t border-gray-300 p-4 bg-gray-50">
            <div className="text-center text-xs text-gray-600 mb-4">
              The search result limit is {searchCriteria.resultsLimit} records; select a Country, 
              Feature Class, and/or Feature Type to reduce your chances of exceeding this limit.
            </div>
            <div className="flex justify-center space-x-2">
              <button
                onClick={handleSearch}
                disabled={isLoading || selectedDatasets.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - Map and Results */}
        <div className="flex-1 flex flex-col">
          {/* Map Area */}
          <div className="flex-1 relative">
            <MapComponent
              viewState={{ center: [-19.0154, 29.1549], zoom: 6 }}
              height="100%"
              drawingEnabled={true}
              onDrawingComplete={(geometry) => {
                console.log('Drawing completed:', geometry);
              }}
            />
            
            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 bg-white rounded shadow-lg p-2 space-y-2">
              <button className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
                <Layers className="h-4 w-4" />
              </button>
              <button className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
                <Plus className="h-4 w-4" />
              </button>
              <button className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
                <Settings className="h-4 w-4" />
              </button>
            </div>

            {/* Map Information Panel */}
            <div className="absolute bottom-4 left-4 bg-white rounded shadow-lg p-3 max-w-md">
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Map Information</p>
                <p>Center: Zimbabwe ({(-19.0154).toFixed(4)}°, {(29.1549).toFixed(4)}°)</p>
                <p>Coordinate System: WGS84 (EPSG:4326)</p>
                <p className="mt-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                  ⚠️ The provided maps are not for purchase or for download; they are to be used as a guide for reference and search purposes only.
                </p>
              </div>
            </div>

            {/* Search Summary Overlay */}
            {imagery && (
              <div className="absolute top-4 left-4 bg-white rounded shadow-lg p-3 max-w-sm">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Search Results</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Location:</strong> {searchCriteria.location}</p>
                  <p><strong>Date Range:</strong> {searchCriteria.dateRange.start} to {searchCriteria.dateRange.end}</p>
                  <p><strong>Datasets:</strong> {selectedDatasets.length} selected</p>
                  <p><strong>Results:</strong> {imagery.results?.length || 0} images found</p>
                  <p><strong>Cloud Cover:</strong> ≤ {searchCriteria.cloudCover}%</p>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-700">Searching for satellite imagery...</span>
                </div>
              </div>
            )}
          </div>

          {/* Results Footer */}
          <div className="bg-white border-t border-gray-300 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {imagery && (
                <>
                  <span>Results: {imagery.results?.length || 0} images</span>
                  <span>•</span>
                  <span>Showing results for {searchCriteria.location}</span>
                  <span>•</span>
                  <span>Max cloud cover: {searchCriteria.cloudCover}%</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                <Download className="h-4 w-4 mr-1" />
                Bulk Download
              </button>
              <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                Preview All
              </button>
              <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Export Results
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Results Panel */}
        <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
          <div className="bg-gray-200 border-b border-gray-300 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Search Results</h3>
            {imagery && (
              <p className="text-xs text-gray-600 mt-1">
                Found {imagery.results?.length || 0} images matching your criteria
              </p>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Searching Zimbabwe satellite archives...</p>
                <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
              </div>
            ) : imagery?.results && imagery.results.length > 0 ? (
              <div className="space-y-2 p-3">
                {imagery.results.map((image: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate mb-1">
                          {image.tile_id || `Zimbabwe Scene ${index + 1}`}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {image.provider || 'Satellite Provider'} • {image.sensor || 'Multi-Spectral'}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Acquisition Date:</span>
                            <span className="font-medium">
                              {image.sensed_at ? new Date(image.sensed_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Cloud Cover:</span>
                            <span className="font-medium">
                              {image.cloud_cover || 0}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Path/Row:</span>
                            <span className="font-medium">
                              {image.path || '168'}/{image.row || '074'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Scene Size:</span>
                            <span className="font-medium">
                              {image.file_size_mb ? `${image.file_size_mb} MB` : '~250 MB'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 mt-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            (image.cloud_cover || 0) < 10 
                              ? 'bg-green-100 text-green-700' 
                              : (image.cloud_cover || 0) < 30
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            <Cloud className="h-3 w-3 inline mr-1" />
                            {image.cloud_cover || 0}%
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {image.provider || 'Landsat'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
                      <button className="flex-1 text-xs bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 flex items-center justify-center">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </button>
                      <button className="flex-1 text-xs bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700 flex items-center justify-center">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                      <button className="text-xs bg-gray-200 text-gray-700 py-2 px-2 rounded hover:bg-gray-300">
                        <Info className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Satellite className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-sm font-medium text-gray-700 mb-2">No Results Found</h4>
                <p className="text-xs text-gray-500 mb-4">
                  No satellite imagery found matching your search criteria.
                </p>
                <div className="text-xs text-gray-500 text-left space-y-1">
                  <p><strong>Try:</strong></p>
                  <p>• Expanding your date range</p>
                  <p>• Increasing cloud cover tolerance</p>
                  <p>• Selecting different datasets</p>
                  <p>• Using a broader search area</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZimbabweExplorer;
